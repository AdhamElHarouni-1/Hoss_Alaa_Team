const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");
const DB_PATH = path.join(ROOT, "data", "db.json");
const PUBLIC_PATH = path.join(ROOT, "frontend", "public");
const SRC_PATH = path.join(ROOT, "frontend", "src");

const defaultCollections = {
  users: [],
  venues: [],
  bookings: [],
  events: [],
  tasks: [],
  budgets: [],
  expenses: [],
  vendors: [],
  sourcingRequests: [],
  deliveries: [],
  invoices: [],
  guests: [],
  messages: [],
  feedback: [],
  layouts: [],
  notifications: [],
  sessions: [],
  outbox: [],
  reports: []
};

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function readDb() {
  return { ...defaultCollections, ...JSON.parse(fs.readFileSync(DB_PATH, "utf8")) };
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function sendJson(res, status, body) {
  res.writeHead(status, jsonHeaders);
  res.end(JSON.stringify(body));
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function token() {
  return crypto.randomBytes(24).toString("hex");
}

function reportPayload(db) {
  const summary = buildSummary(db);
  return {
    generatedAt: new Date().toISOString(),
    summary,
    costs: [...db.budgets, ...db.expenses],
    attendance: db.guests,
    bookings: db.bookings,
    feedback: db.feedback
  };
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 8_000_000) {
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function matchesFilters(item, query) {
  for (const [key, value] of query.entries()) {
    if (!value) continue;
    if (key === "q") {
      const haystack = JSON.stringify(item).toLowerCase();
      if (!haystack.includes(value.toLowerCase())) return false;
      continue;
    }
    if (key === "minCapacity") {
      if (Number(item.capacity || 0) < Number(value)) return false;
      continue;
    }
    if (key === "date") {
      const unavailable = item.unavailableDates || [];
      if (item.date && item.date !== value) return false;
      if (unavailable.includes(value)) return false;
      continue;
    }
    const current = item[key];
    if (Array.isArray(current)) {
      if (!current.map(String).some(entry => entry.toLowerCase().includes(value.toLowerCase()))) return false;
    } else if (String(current || "").toLowerCase() !== value.toLowerCase()) {
      return false;
    }
  }
  return true;
}

function buildSummary(db) {
  const today = "2026-06-18";
  const todaysEvents = db.events.filter(event => event.date === today);
  const arrivedGuests = db.guests.filter(guest => guest.checkInStatus === "Arrived").length;
  const positive = db.feedback.filter(item => Number(item.rating) >= 4).length;
  const negative = db.feedback.filter(item => Number(item.rating) <= 2).length;
  const plannedBudget = db.budgets.reduce((sum, item) => sum + Number(item.planned || 0), 0);
  const actualExpenses = db.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return {
    todaysEvents,
    upcomingEvents: db.events.filter(event => event.date >= today),
    taskReminders: db.tasks.filter(task => task.status !== "Done").slice(0, 5),
    feedback: { positive, negative },
    operations: {
      totalGuests: db.guests.length,
      arrivedGuests
    },
    budget: {
      plannedBudget,
      actualExpenses,
      difference: plannedBudget - actualExpenses
    },
    venueOwner: {
      totalBookings: db.bookings.filter(booking => booking.status === "Approved").length,
      pendingBookings: db.bookings.filter(booking => booking.status === "Pending").length,
      revenue: db.bookings
        .filter(booking => booking.status === "Approved")
        .reduce((sum, booking) => sum + Number(booking.price || 0), 0)
    }
  };
}

function serveStatic(req, res, pathname) {
  const route = pathname === "/" ? "/index.html" : pathname;
  const basePath = route.startsWith("/src/") ? SRC_PATH : PUBLIC_PATH;
  const cleanRoute = route.startsWith("/src/") ? route.replace("/src/", "/") : route;
  const filePath = path.normalize(path.join(basePath, cleanRoute));
  if (!filePath.startsWith(basePath)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      fs.readFile(path.join(PUBLIC_PATH, "index.html"), (fallbackError, fallbackData) => {
        if (fallbackError) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fallbackData);
      });
      return;
    }

    const extension = path.extname(filePath);
    const contentTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".json": "application/json",
      ".svg": "image/svg+xml"
    };
    res.writeHead(200, { "Content-Type": contentTypes[extension] || "text/plain" });
    res.end(data);
  });
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, jsonHeaders);
    res.end();
    return;
  }

  const db = readDb();
  const parts = url.pathname.split("/").filter(Boolean);
  const resource = parts[1];
  const id = parts[2];

  try {
    if (url.pathname === "/api/auth/login" && req.method === "POST") {
      const payload = await parseBody(req);
      const user = db.users.find(item =>
        item.email.toLowerCase() === String(payload.email || "").toLowerCase() &&
        item.role === payload.role &&
        item.status !== "Inactive"
      );
      const expectedHash = user?.passwordHash || hashPassword("password123");
      if (!user || expectedHash !== hashPassword(payload.password || "")) {
        sendJson(res, 401, { error: "Invalid email, role, or password." });
        return;
      }
      const session = { id: `session-${Date.now()}`, userId: user.id, token: token(), createdAt: new Date().toISOString() };
      db.sessions = db.sessions || [];
      db.sessions.push(session);
      writeDb(db);
      sendJson(res, 200, { user: publicUser(user), session });
      return;
    }

    if (url.pathname === "/api/auth/register" && req.method === "POST") {
      const payload = await parseBody(req);
      if (!payload.name || !payload.email || !payload.role || !payload.password) {
        sendJson(res, 400, { error: "Name, email, role, and password are required." });
        return;
      }
      const exists = db.users.some(item => item.email.toLowerCase() === String(payload.email).toLowerCase());
      if (exists) {
        sendJson(res, 409, { error: "An account with this email already exists." });
        return;
      }
      const user = {
        id: `user-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        speciality: payload.speciality || "",
        company: payload.company || "",
        status: "Active",
        passwordHash: hashPassword(payload.password),
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      writeDb(db);
      sendJson(res, 201, publicUser(user));
      return;
    }

    if (url.pathname === "/api/summary" && req.method === "GET") {
      sendJson(res, 200, buildSummary(db));
      return;
    }

    if (url.pathname === "/api/reports/full" && req.method === "GET") {
      const report = {
        id: `report-${Date.now()}`,
        name: "Comprehensive event report",
        ...reportPayload(db)
      };
      db.reports.push(report);
      writeDb(db);
      sendJson(res, 200, report);
      return;
    }

    if (!db[resource]) {
      sendJson(res, 404, { error: "Unknown resource." });
      return;
    }

    if (req.method === "GET") {
      const records = db[resource].filter(item => matchesFilters(item, url.searchParams));
      sendJson(res, 200, resource === "users" ? records.map(publicUser) : records);
      return;
    }

    if (req.method === "POST") {
      const payload = await parseBody(req);
      const now = new Date().toISOString();
      const record = {
        id: `${resource}-${Date.now()}`,
        createdAt: now,
        ...payload
      };
      if (resource === "users" && payload.password) {
        record.passwordHash = hashPassword(payload.password);
        delete record.password;
      }
      if (resource === "messages") {
        db.outbox.push({
          id: `outbox-${Date.now()}`,
          type: "message",
          recipientGroup: record.audience || "Guests",
          subject: "Event update",
          body: record.body,
          status: "Queued",
          createdAt: now
        });
      }
      db[resource].push(record);
      writeDb(db);
      sendJson(res, 201, resource === "users" ? publicUser(record) : record);
      return;
    }

    const index = db[resource].findIndex(item => item.id === id);
    if (index === -1) {
      sendJson(res, 404, { error: "Record not found." });
      return;
    }

    if (req.method === "PATCH") {
      const payload = await parseBody(req);
      if (resource === "users" && payload.password) {
        payload.passwordHash = hashPassword(payload.password);
        delete payload.password;
      }
      db[resource][index] = { ...db[resource][index], ...payload, updatedAt: new Date().toISOString() };
      writeDb(db);
      sendJson(res, 200, resource === "users" ? publicUser(db[resource][index]) : db[resource][index]);
      return;
    }

    if (req.method === "DELETE") {
      const [removed] = db[resource].splice(index, 1);
      writeDb(db);
      sendJson(res, 200, removed);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Invalid request." });
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url);
    return;
  }
  serveStatic(req, res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`Event Management Platform running at http://localhost:${PORT}`);
});
