import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { URL } from "node:url";
import { promisify } from "node:util";

const port = Number(process.env.API_PORT ?? 8787);
const scrypt = promisify(scryptCallback);
const usersFile = resolve("server/data/users.json");
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

  sendJson(response, 404, { error: "Not found" });
});

server.listen(port, () => {
  console.log(`CashReady API listening on http://127.0.0.1:${port}`);
});
