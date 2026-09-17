import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { promisify } from "node:util";
import Database from "better-sqlite3";
import { buildMLRecommendation, buildMLForecast, predictCashAvailability } from "./atmModel.mjs";

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 8788);
const staticRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const isStaticBuildAvailable = existsSync(staticRoot);
const scrypt = promisify(scryptCallback);
const usersFile = resolve(dirname(fileURLToPath(import.meta.url)), "data/users.json");
const contactMessagesFile = resolve(dirname(fileURLToPath(import.meta.url)), "data/contact-submissions.json");
const databasePath = resolve(dirname(fileURLToPath(import.meta.url)), "data/cashready.db");
const sessions = new Map();
const providerUrl = process.env.ATM_PROVIDER_URL;
const providerApiKey = process.env.ATM_PROVIDER_API_KEY;
const providerAuthHeader = process.env.ATM_PROVIDER_AUTH_HEADER ?? "Authorization";
const providerAuthPrefix = process.env.ATM_PROVIDER_AUTH_PREFIX ?? "Bearer";
const providerTimeoutMs = Number(process.env.ATM_PROVIDER_TIMEOUT_MS ?? 8000);
const sessionTtlMs = Number(process.env.SESSION_TTL_MS ?? 8 * 60 * 60 * 1000);
const rateWindowMs = 60 * 1000;
const rateLimit = Number(process.env.API_RATE_LIMIT ?? 120);
const requestCounts = new Map();
const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_role
    ON users(username, role);

  CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS atm_forecasts (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    requested_amount REAL NOT NULL,
    customer_limit REAL NOT NULL,
    prediction_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const demoUsers = [
  { id: "customer-demo", username: "customer@cashready.test", role: "customer", name: "Demo Customer", password: "Customer@123" },
  { id: "banker-demo", username: "banker@cashready.test", role: "banker", name: "Demo Banker", password: "Banker@123" },
];

async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;

  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function seedDemoUsers() {
  const existingCount = Number(db.prepare("SELECT COUNT(*) AS count FROM users").get()?.count ?? 0);
  if (existingCount > 0) {
    return;
  }

  await mkdir(dirname(usersFile), { recursive: true });
  const seededUsers = await Promise.all(demoUsers.map(async ({ password, ...user }) => ({
    ...user,
    passwordHash: await hashPassword(password),
  })));

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, role, name, password_hash)
    VALUES (@id, @username, @role, @name, @passwordHash)
  `);

  const transaction = db.transaction((users) => {
    for (const user of users) {
      insertUser.run(user);
    }
  });

  transaction(seededUsers);
  await writeFile(usersFile, JSON.stringify(seededUsers, null, 2)).catch(() => undefined);
}

async function loadUsers() {
  await seedDemoUsers();
  return db.prepare("SELECT * FROM users").all().map((user) => ({
    ...user,
    passwordHash: user.password_hash,
  }));
}

async function loadContactMessages() {
  await mkdir(dirname(contactMessagesFile), { recursive: true });
  const rows = db.prepare("SELECT * FROM contact_messages ORDER BY created_at DESC").all();
  const serialized = rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    email: row.email,
    message: row.message,
  }));

  try {
    await writeFile(contactMessagesFile, JSON.stringify(serialized, null, 2));
  } catch {
    // Best effort sync for compatibility with the existing file-backed workflow.
  }
  return serialized;
}

async function saveContactMessage(payload) {
  const message = {
    id: randomBytes(6).toString("hex"),
    createdAt: new Date().toISOString(),
    ...payload,
  };

  db.prepare(`
    INSERT INTO contact_messages (id, created_at, name, email, message)
    VALUES (@id, @createdAt, @name, @email, @message)
  `).run(message);

  await loadContactMessages();
  return message;
}

function createSession(user) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + sessionTtlMs;
  sessions.set(token, { userId: user.id, expiresAt });
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, user.id, expiresAt);
  return token;
}

function publicUser(user) {
  return { id: user.id, username: user.username, role: user.role, name: user.name };
}

function getAuthenticatedUser(request, users) {
  const authorization = request.headers.authorization ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  let session = sessions.get(token);
  if (!session) {
    const stored = db.prepare("SELECT user_id AS userId, expires_at AS expiresAt FROM sessions WHERE token = ?").get(token);
    if (stored) {
      session = stored;
      sessions.set(token, session);
    }
  }
  if (!session || session.expiresAt <= Date.now()) {
    if (session) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }

  return users.find((user) => user.id === session.userId) ?? null;
}

function createDashboardSnapshot() {
  const now = new Date().toISOString();
  return {
    updatedAt: now,
    healthData: [
      { name: "Healthy", value: 112, color: "#16A34A" },
      { name: "Refill soon", value: 21, color: "#F59E0B" },
      { name: "Critical", value: 7, color: "#DC2626" },
    ],
    trendData: [
      { day: "Mon", cash: 184 },
      { day: "Tue", cash: 226 },
      { day: "Wed", cash: 198 },
      { day: "Thu", cash: 264 },
      { day: "Fri", cash: 241 },
      { day: "Sat", cash: 286 },
    ],
    queue: [
      { id: "ATM-034", location: "Connaught Place", status: "Critical", level: "18%", color: "critical" },
      { id: "ATM-089", location: "Rajiv Chowk", status: "Critical", level: "24%", color: "critical" },
      { id: "ATM-112", location: "Barakhamba Road", status: "Refill soon", level: "39%", color: "warning" },
    ],
    activity: [
      ["ATM-021", "Cash replenished", "10:42 AM", "R. Mehta"],
      ["ATM-177", "Health check passed", "10:36 AM", "Auto-monitor"],
      ["ATM-034", "Low cash alert", "10:31 AM", "Unassigned"],
    ],
    monitored: 2420,
    availability: "98.2",
    withdrawals: "18.4",
  };
}

function createOperationsSnapshot() {
  const updatedAt = new Date().toISOString();
  return {
    updatedAt,
    alerts: 4,
    activeRuns: 17,
    terminalsNeedingAction: 12,
    uptime: "99.3%",
    availability: "94%",
    withdrawals: "₹12.4M",
    queue: [
      { id: "ATM-034", location: "Connaught Place", owner: "Unassigned", priority: "Critical", eta: "Today, 11:30 AM" },
      { id: "ATM-089", location: "Rajiv Chowk", owner: "R. Mehta", priority: "Critical", eta: "Today, 1:00 PM" },
      { id: "ATM-112", location: "Barakhamba Road", owner: "A. Singh", priority: "Refill soon", eta: "Today, 3:30 PM" },
    ],
    reports: [
      { id: "daily-network-summary", name: "Daily network summary", status: "Ready", generatedAt: "Today, 08:45 AM" },
      { id: "cash-movement-report", name: "Cash movement report", status: "Ready", generatedAt: "Yesterday, 06:20 PM" },
      { id: "export-center", name: "Executive export package", status: "Scheduled", generatedAt: "Tomorrow, 08:00 AM" },
    ],
  };
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin",
  });
  response.end(JSON.stringify(body));
}

function getContentType(filePath) {
  const extension = extname(filePath).toLowerCase();
  switch (extension) {
    case ".html": return "text/html; charset=utf-8";
    case ".js": return "text/javascript; charset=utf-8";
    case ".css": return "text/css; charset=utf-8";
    case ".json": return "application/json; charset=utf-8";
    case ".svg": return "image/svg+xml";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".ico": return "image/x-icon";
    case ".woff": return "font/woff";
    case ".woff2": return "font/woff2";
    case ".txt": return "text/plain; charset=utf-8";
    default: return "application/octet-stream";
  }
}

async function serveStaticAsset(response, pathname) {
  if (!isStaticBuildAvailable) return false;

  const safePath = pathname === "/" ? "/index.html" : pathname;
  const requestedPath = safePath.replace(/^\/+/, "");
  if (requestedPath.includes("..")) {
    sendJson(response, 403, { error: "Forbidden" });
    return true;
  }

  const candidatePath = resolve(staticRoot, requestedPath);
  if (!candidatePath.startsWith(staticRoot)) {
    sendJson(response, 403, { error: "Forbidden" });
    return true;
  }

  try {
    const fileContent = await readFile(candidatePath);
    const fileType = getContentType(candidatePath);
    response.writeHead(200, {
      "Content-Type": fileType,
      "Cache-Control": "public, max-age=3600",
    });
    response.end(fileContent);
    return true;
  } catch {
    if (safePath !== "/index.html" && !pathname.includes(".")) {
      try {
        const fileContent = await readFile(resolve(staticRoot, "index.html"));
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        response.end(fileContent);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

function isRateLimited(request) {
  const address = request.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  const current = requestCounts.get(address);
  if (!current || current.resetAt <= now) {
    requestCounts.set(address, { count: 1, resetAt: now + rateWindowMs });
    return false;
  }
  current.count += 1;
  return current.count > rateLimit;
}

function cleanupExpiredSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error("Request body is too large");
    chunks.push(chunk);
  }

  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function parseCoordinates(query) {
  const latitude = Number(query.get("lat"));
  const longitude = Number(query.get("lon"));
  const radius = Number(query.get("radius") ?? 5000);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error("lat must be a valid latitude");
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("lon must be a valid longitude");
  }
  if (!Number.isFinite(radius) || radius <= 0 || radius > 50000) {
    throw new Error("radius must be between 1 and 50000 meters");
  }

  return { latitude, longitude, radius };
}

function normalizeStatus(payload) {
  const status = payload.status ?? payload.availability ?? "unknown";
  const available = payload.available ?? payload.cashAvailable ?? null;
  const lastUpdated = payload.lastUpdated ?? payload.updatedAt ?? null;

  return {
    available: typeof available === "boolean" ? available : null,
    status: String(status),
    lastUpdated,
    source: "configured-provider",
  };
}

function haversineKm(fromLatitude, fromLongitude, toLatitude, toLongitude) {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((toLatitude - fromLatitude) * Math.PI) / 180;
  const longitudeDelta = ((toLongitude - fromLongitude) * Math.PI) / 180;
  const latitudeOne = (fromLatitude * Math.PI) / 180;
  const latitudeTwo = (toLatitude * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.sin(longitudeDelta / 2) ** 2 *
      Math.cos(latitudeOne) *
      Math.cos(latitudeTwo);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function buildSyntheticAtmRecommendations(latitude, longitude, requestedAmount, customerLimit) {
  const atmSeed = [
    { id: "ATM-101", name: "HDFC Bank ATM", lat: latitude + 0.008, lon: longitude + 0.010 },
    { id: "ATM-104", name: "ICICI Bank ATM", lat: latitude - 0.012, lon: longitude + 0.016 },
    { id: "ATM-118", name: "SBI ATM", lat: latitude + 0.021, lon: longitude - 0.009 },
    { id: "ATM-221", name: "Axis Bank ATM", lat: latitude - 0.018, lon: longitude - 0.014 },
    { id: "ATM-305", name: "Kotak ATM", lat: latitude + 0.015, lon: longitude + 0.021 },
    { id: "ATM-412", name: "Canara Bank ATM", lat: latitude - 0.024, lon: longitude + 0.011 },
  ];

  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();

  const candidates = atmSeed
    .map((atm) => {
      const distanceKm = haversineKm(latitude, longitude, atm.lat, atm.lon);
      const healthScore = Math.max(0.42, Math.min(0.98, 0.8 + (Math.sin((atm.id.length + distanceKm) * 0.8) + 1) * 0.12));
      const cashLevel = Math.max(40, Math.min(95, 84 - distanceKm * 4 + ((hour >= 9 && hour <= 18) ? 6 : -2)));
      return {
        id: atm.id,
        name: atm.name,
        latitude: atm.lat,
        longitude: atm.lon,
        distanceKm: Number(distanceKm.toFixed(2)),
        healthScore: Number(healthScore.toFixed(2)),
        cashLevel: Number(cashLevel.toFixed(0)),
        status: "Healthy",
      };
    })
    .filter((atm) => atm.distanceKm <= 5);

  const scored = buildMLRecommendation({
    latitude,
    longitude,
    requestedAmount,
    customerLimit,
    hour,
    dayOfWeek,
    candidates,
  });

  return scored.map((atm) => ({
    id: atm.id,
    name: atm.name,
    latitude: atm.latitude,
    longitude: atm.longitude,
    distanceKm: atm.distanceKm,
    status: atm.status ?? "Healthy",
    healthScore: atm.healthScore,
    cashLevel: atm.cashLevel,
    sufficiencyScore: atm.sufficiencyScore,
    isEligible: atm.isEligible,
    recommendation: atm.recommendation,
  }));
}

async function getProviderStatus(query) {
  const coordinates = parseCoordinates(query);

  if (!providerUrl) {
    return {
      available: null,
      status: "unavailable",
      lastUpdated: null,
      source: "provider-not-configured",
      message: "Configure ATM_PROVIDER_URL for live cash availability.",
    };
  }

  const upstreamUrl = new URL(providerUrl);
  upstreamUrl.searchParams.set("latitude", String(coordinates.latitude));
  upstreamUrl.searchParams.set("longitude", String(coordinates.longitude));
  upstreamUrl.searchParams.set("radius", String(coordinates.radius));

  const headers = { Accept: "application/json" };
  if (providerApiKey) {
    headers[providerAuthHeader] = providerAuthPrefix
      ? `${providerAuthPrefix} ${providerApiKey}`
      : providerApiKey;
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    headers,
    signal: AbortSignal.timeout(providerTimeoutMs),
  });
  if (!upstreamResponse.ok) {
    throw new Error(`Provider returned ${upstreamResponse.status}`);
  }

  return normalizeStatus(await upstreamResponse.json());
}

async function handleApiRequest(request, response) {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (isRateLimited(request)) {
    sendJson(response, 429, { error: "Too many requests. Please try again shortly." });
    return;
  }

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/auth/login") {
    try {
      const body = await readJsonBody(request);
      const role = body.role;
      const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";

      if (!role || !["customer", "banker"].includes(role) || !username || !password) {
        sendJson(response, 400, { error: "role, username, and password are required" });
        return;
      }

      const users = await loadUsers();
      const user = users.find((candidate) => candidate.username === username && candidate.role === role);
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        sendJson(response, 401, { error: "Invalid credentials" });
        return;
      }

      sendJson(response, 200, { token: createSession(user), user: publicUser(user) });
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : "Invalid request" });
    }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/auth/logout") {
    const authorization = request.headers.authorization ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

    if (token) {
      sessions.delete(token);
      db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    }

    sendJson(response, 200, { ok: true, message: "Logged out successfully" });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/auth/me") {
    const users = await loadUsers();
    const user = getAuthenticatedUser(request, users);
    if (!user) {
      sendJson(response, 401, { error: "Authentication required" });
      return;
    }

    sendJson(response, 200, { user: publicUser(user) });
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/contact") {
    try {
      const body = await readJsonBody(request);
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim() : "";
      const message = typeof body.message === "string" ? body.message.trim() : "";

      if (!name || !email || !message) {
        sendJson(response, 400, { error: "name, email, and message are required" });
        return;
      }

      const saved = await saveContactMessage({ name, email, message });
      sendJson(response, 200, {
        ok: true,
        message: "Your message has been received.",
        submissionId: saved.id,
      });
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : "Invalid request" });
    }
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/banker/dashboard") {
    const users = await loadUsers();
    const user = getAuthenticatedUser(request, users);
    if (!user || user.role !== "banker") {
      sendJson(response, 401, { error: "Banker authentication required" });
      return;
    }

    sendJson(response, 200, { user: publicUser(user), dashboard: createDashboardSnapshot() });
    return;
  }

  if (request.method === "GET" && ["/api/operations/overview", "/api/forecasting"].includes(requestUrl.pathname)) {
    const users = await loadUsers();
    const user = getAuthenticatedUser(request, users);
    if (!user || user.role !== "banker") {
      sendJson(response, 401, { error: "Banker authentication required" });
      return;
    }

    if (requestUrl.pathname === "/api/operations/overview") {
      sendJson(response, 200, { operations: createOperationsSnapshot() });
      return;
    }

    const latitude = Number(requestUrl.searchParams.get("lat") ?? 26.8467);
    const longitude = Number(requestUrl.searchParams.get("lon") ?? 80.9462);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      sendJson(response, 400, { error: "lat and lon must be valid coordinates" });
      return;
    }
    const forecast = buildMLForecast({
      latitude,
      longitude,
      hour: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      candidates: buildSyntheticAtmRecommendations(latitude, longitude, 50000, 75000),
    });
    sendJson(response, 200, { forecast, generatedAt: new Date().toISOString(), model: "knn-style ATM forecast engine" });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/atm-status") {
    try {
      const result = await getProviderStatus(requestUrl.searchParams);
      sendJson(response, 200, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Provider request failed";
      const isInvalidRequest = message.startsWith("lat ") || message.startsWith("lon ") || message.startsWith("radius ");
      sendJson(response, isInvalidRequest ? 400 : 502, {
        available: null,
        status: "unavailable",
        lastUpdated: null,
        source: isInvalidRequest ? "invalid-request" : "provider-error",
        message,
      });
    }
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/atm/cash-predict") {
    try {
      const latitude = Number(requestUrl.searchParams.get("lat"));
      const longitude = Number(requestUrl.searchParams.get("lon"));
      const atmId = Number(requestUrl.searchParams.get("atmId") ?? 0);
      const requestedAmount = Number(requestUrl.searchParams.get("amount") ?? 0);
      const customerLimit = Number(requestUrl.searchParams.get("limit") ?? 75000);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        sendJson(response, 400, { error: "lat and lon must be valid coordinates" });
        return;
      }
      const distanceKm = haversineKm(latitude, longitude, Number(requestUrl.searchParams.get("atmLat")), Number(requestUrl.searchParams.get("atmLon")));
      sendJson(response, 200, {
        ...predictCashAvailability({ distanceKm, hour: new Date().getHours(), dayOfWeek: new Date().getDay(), atmId, requestedAmount, customerLimit }),
        generatedAt: new Date().toISOString(),
        source: "cashready-ml-estimate",
      });
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : "Cash prediction failed" });
    }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/atm/recommend") {
    try {
      const body = await readJsonBody(request);
      const latitude = Number(body.lat);
      const longitude = Number(body.lon);
      const requestedAmount = Number(body.requestedAmount ?? 0);
      const customerLimit = Number(body.customerLimit ?? 75000);

      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        sendJson(response, 400, { error: "lat must be a valid latitude" });
        return;
      }
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        sendJson(response, 400, { error: "lon must be a valid longitude" });
        return;
      }
      if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
        sendJson(response, 400, { error: "requestedAmount must be greater than zero" });
        return;
      }
      if (requestedAmount > customerLimit) {
        sendJson(response, 400, {
          error: "The requested amount exceeds your daily withdrawal limit.",
          limit: customerLimit,
          requestedAmount,
        });
        return;
      }

      const eligibleAtms = buildSyntheticAtmRecommendations(latitude, longitude, requestedAmount, customerLimit);
      const strongestMatch = eligibleAtms[0] ?? null;

      sendJson(response, 200, {
        requestedAmount,
        customerLimit,
        totalCandidates: eligibleAtms.length,
        eligibleAtms,
        summary: {
          strongestMatch,
          count: eligibleAtms.length,
          model: "knn-style ATM recommendation engine",
        },
      });
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : "Invalid request" });
    }
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/ai/refill-forecast") {
    try {
      const latitude = Number(requestUrl.searchParams.get("lat"));
      const longitude = Number(requestUrl.searchParams.get("lon"));

      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        sendJson(response, 400, { error: "lat must be a valid latitude" });
        return;
      }
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        sendJson(response, 400, { error: "lon must be a valid longitude" });
        return;
      }

      const forecast = buildMLForecast({
        latitude,
        longitude,
        hour: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        candidates: buildSyntheticAtmRecommendations(latitude, longitude, 50000, 75000),
      });

      sendJson(response, 200, {
        forecast,
        model: "knn-style ATM forecast engine",
      });
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : "Forecast request failed" });
    }
    return;
  }

  sendJson(response, 404, { error: "Not found" });
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (requestUrl.pathname.startsWith("/api/")) {
    await handleApiRequest(request, response);
    return;
  }

  if (isStaticBuildAvailable) {
    const served = await serveStaticAsset(response, requestUrl.pathname);
    if (served) return;
  }

  if (request.method === "GET" && !requestUrl.pathname.includes(".")) {
    const served = await serveStaticAsset(response, "/");
    if (served) return;
  }

  sendJson(response, 404, { error: "Not found" });
});

export default async function handler(request, response) {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host}`);
  if (requestUrl.pathname.startsWith("/api/")) {
    await handleApiRequest(request, response);
    return;
  }

  if (isStaticBuildAvailable) {
    const served = await serveStaticAsset(response, requestUrl.pathname);
    if (served) return;
  }

  sendJson(response, 404, { error: "Not found" });
}

if (!process.env.VERCEL) {
  server.listen(port, () => {
    cleanupExpiredSessions();
    setInterval(cleanupExpiredSessions, 15 * 60 * 1000).unref();
    console.log(`CashReady API listening on http://127.0.0.1:${port}`);
  });
}
