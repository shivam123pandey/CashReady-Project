import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { promisify } from "node:util";

const port = Number(process.env.API_PORT ?? 8787);
const scrypt = promisify(scryptCallback);
const usersFile = resolve(dirname(fileURLToPath(import.meta.url)), "data/users.json");
const contactMessagesFile = resolve(dirname(fileURLToPath(import.meta.url)), "data/contact-submissions.json");
const sessions = new Map();
const providerUrl = process.env.ATM_PROVIDER_URL;
const providerApiKey = process.env.ATM_PROVIDER_API_KEY;
const providerAuthHeader = process.env.ATM_PROVIDER_AUTH_HEADER ?? "Authorization";
const providerAuthPrefix = process.env.ATM_PROVIDER_AUTH_PREFIX ?? "Bearer";
const providerTimeoutMs = Number(process.env.ATM_PROVIDER_TIMEOUT_MS ?? 8000);

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

async function loadUsers() {
  try {
    return JSON.parse(await readFile(usersFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;

    await mkdir(dirname(usersFile), { recursive: true });
    const seededUsers = await Promise.all(demoUsers.map(async ({ password, ...user }) => ({
      ...user,
      passwordHash: await hashPassword(password),
    })));
    await writeFile(usersFile, JSON.stringify(seededUsers, null, 2));
    return seededUsers;
  }
}

async function loadContactMessages() {
  try {
    return JSON.parse(await readFile(contactMessagesFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;

    await mkdir(dirname(contactMessagesFile), { recursive: true });
    await writeFile(contactMessagesFile, JSON.stringify([], null, 2));
    return [];
  }
}

async function saveContactMessage(payload) {
  const messages = await loadContactMessages();
  const message = {
    id: randomBytes(6).toString("hex"),
    createdAt: new Date().toISOString(),
    ...payload,
  };

  messages.push(message);
  await writeFile(contactMessagesFile, JSON.stringify(messages, null, 2));
  return message;
}

function createSession(user) {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
  return token;
}

function publicUser(user) {
  return { id: user.id, username: user.username, role: user.role, name: user.name };
}

function getAuthenticatedUser(request, users) {
  const authorization = request.headers.authorization ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) return null;

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

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
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

  return atmSeed
    .map((atm) => {
      const distanceKm = haversineKm(latitude, longitude, atm.lat, atm.lon);
      const demandFactor = 1 + Math.min(1.2, requestedAmount / Math.max(customerLimit, 1));
      const healthScore = Math.max(0.42, Math.min(0.98, 0.8 + (Math.sin((atm.id.length + distanceKm) * 0.8) + 1) * 0.12));
      const distanceScore = Math.max(0.2, 1 - distanceKm / 6);
      const sufficiencyScore = Math.min(0.99, Math.max(0.35,
        healthScore * 0.58 + distanceScore * 0.32 + (demandFactor > 1 ? 0.08 : 0.15)
      ));

      let status = "Healthy";
      if (sufficiencyScore < 0.62) status = "Critical";
      else if (sufficiencyScore < 0.76) status = "Refill Soon";

      const isEligible = requestedAmount <= customerLimit && sufficiencyScore >= 0.62;
      return {
        id: atm.id,
        name: atm.name,
        latitude: atm.lat,
        longitude: atm.lon,
        distanceKm: Number(distanceKm.toFixed(2)),
        status,
        healthScore: Number(healthScore.toFixed(2)),
        sufficiencyScore: Number(sufficiencyScore.toFixed(2)),
        isEligible,
        recommendation: isEligible
          ? "Likely to serve the requested amount within the customer limit"
          : "Not recommended for the requested withdrawal amount",
      };
    })
    .filter((atm) => atm.distanceKm <= 5)
    .sort((first, second) => {
      if (Number(first.isEligible) !== Number(second.isEligible)) {
        return Number(second.isEligible) - Number(first.isEligible);
      }
      return first.distanceKm - second.distanceKm;
    })
    .slice(0, 5);
}

function buildRefillForecast(latitude, longitude) {
  const atms = buildSyntheticAtmRecommendations(latitude, longitude, 50000, 75000);
  return atms.map((atm) => ({
    id: atm.id,
    name: atm.name,
    status: atm.status,
    risk: atm.status === "Critical" ? "high" : atm.status === "Refill Soon" ? "medium" : "low",
    sufficiencyScore: atm.sufficiencyScore,
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

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host}`);

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
      sendJson(response, 200, {
        requestedAmount,
        customerLimit,
        totalCandidates: eligibleAtms.length,
        eligibleAtms,
        summary: {
          strongestMatch: eligibleAtms[0] ?? null,
          count: eligibleAtms.length,
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

      sendJson(response, 200, {
        forecast: buildRefillForecast(latitude, longitude),
      });
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : "Forecast request failed" });
    }
    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(port, () => {
  console.log(`CashReady API listening on http://127.0.0.1:${port}`);
});
