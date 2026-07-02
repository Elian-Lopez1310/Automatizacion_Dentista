const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, originalHash] = String(stored || "").split(":");
  if (!salt || !originalHash) return false;
  const attempted = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(attempted, "hex"));
}

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function seedDb() {
  const now = new Date();
  const today = todayISO();
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  const nextWeek = new Date(now.getTime() + 86400000 * 5).toISOString().slice(0, 10);
  const clinicId = "clinic_demo";

  return {
    clinics: [
      {
        id: clinicId,
        clinicName: "Clinica Dental Sonrisa Demo",
        dentistName: "Dra. Laura Mendez",
        email: "demo@dentalbotpro.com",
        phone: "809-555-0180",
        passwordHash: hashPassword("demo1234"),
        planStatus: "prueba",
        createdAt: now.toISOString()
      }
    ],
    patients: [
      { id: "pat_ana", clinicId, name: "Ana Rosario", phone: "809-221-4488", email: "ana@example.com", notes: "Prefiere citas en la manana.", createdAt: now.toISOString() },
      { id: "pat_carlos", clinicId, name: "Carlos Pena", phone: "809-338-7744", email: "carlos@example.com", notes: "Seguimiento de ortodoncia.", createdAt: now.toISOString() },
      { id: "pat_maria", clinicId, name: "Maria Gomez", phone: "809-440-1200", email: "maria@example.com", notes: "Nueva paciente.", createdAt: now.toISOString() }
    ],
    appointments: [
      { id: "apt_1", clinicId, patientId: "pat_ana", patientName: "Ana Rosario", phone: "809-221-4488", date: today, time: "09:30", reason: "Limpieza dental", status: "confirmada", source: "demo", createdAt: now.toISOString() },
      { id: "apt_2", clinicId, patientId: "pat_carlos", patientName: "Carlos Pena", phone: "809-338-7744", date: today, time: "11:00", reason: "Ortodoncia", status: "pendiente", source: "demo", createdAt: now.toISOString() },
      { id: "apt_3", clinicId, patientId: "pat_maria", patientName: "Maria Gomez", phone: "809-440-1200", date: tomorrow, time: "15:00", reason: "Consulta general", status: "pendiente", source: "demo", createdAt: now.toISOString() },
      { id: "apt_4", clinicId, patientId: "pat_ana", patientName: "Ana Rosario", phone: "809-221-4488", date: nextWeek, time: "10:30", reason: "Blanqueamiento", status: "confirmada", source: "demo", createdAt: now.toISOString() }
    ],
    botConfigs: [
      {
        clinicId,
        botName: "DentiBot",
        workStart: "08:00",
        workEnd: "17:00",
        appointmentDuration: 30,
        welcomeMessage: "Hola, soy DentiBot. Te ayudo a reservar tu cita dental.",
        afterHoursMessage: "Gracias por escribir. Estamos fuera de horario, pero puedo dejar tu solicitud registrada.",
        services: ["Limpieza dental", "Ortodoncia", "Extraccion", "Consulta general", "Blanqueamiento", "Emergencia dental"]
      }
    ],
    paymentIntents: [],
    sessions: []
  };
}

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) writeDb(seedDb());
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function publicClinic(clinic) {
  if (!clinic) return null;
  const { passwordHash, ...safe } = clinic;
  return safe;
}

function send(res, status, payload, contentType = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": contentType });
  if (Buffer.isBuffer(payload) || payload instanceof Uint8Array) {
    res.end(payload);
    return;
  }
  res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload demasiado grande"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("JSON invalido"));
      }
    });
  });
}

function getBearer(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function getSession(req, db) {
  const token = getBearer(req);
  if (!token) return null;
  const session = db.sessions.find(item => item.token === token && new Date(item.expiresAt).getTime() > Date.now());
  if (!session) return null;
  const clinic = db.clinics.find(item => item.id === session.clinicId);
  return clinic ? { session, clinic } : null;
}

function requireAuth(req, res, db) {
  const auth = getSession(req, db);
  if (!auth) {
    send(res, 401, { error: "Sesion requerida" });
    return null;
  }
  return auth;
}

function validateRequired(fields, body) {
  return fields.filter(field => !String(body[field] || "").trim());
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function upsertPatient(db, clinicId, name, phone) {
  const normalizedPhone = String(phone || "").trim();
  let patient = db.patients.find(item => item.clinicId === clinicId && item.phone === normalizedPhone);
  if (!patient) {
    patient = {
      id: id("pat"),
      clinicId,
      name: String(name || "").trim(),
      phone: normalizedPhone,
      email: "",
      notes: "Creado automaticamente por el bot.",
      createdAt: new Date().toISOString()
    };
    db.patients.push(patient);
  } else if (name && patient.name !== name) {
    patient.name = String(name).trim();
  }
  return patient;
}

function availableSlots(db, clinicId, date) {
  const config = db.botConfigs.find(item => item.clinicId === clinicId) || {};
  const start = config.workStart || "08:00";
  const end = config.workEnd || "17:00";
  const duration = Number(config.appointmentDuration || 30);
  const taken = new Set(
    db.appointments
      .filter(item => item.clinicId === clinicId && item.date === date && item.status !== "cancelada")
      .map(item => item.time)
  );
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let cursor = sh * 60 + sm;
  const finish = eh * 60 + em;
  const slots = [];
  while (cursor + duration <= finish && slots.length < 12) {
    const hh = String(Math.floor(cursor / 60)).padStart(2, "0");
    const mm = String(cursor % 60).padStart(2, "0");
    const slot = `${hh}:${mm}`;
    if (!taken.has(slot)) slots.push(slot);
    cursor += duration;
  }
  return slots;
}

function dashboardFor(db, clinicId) {
  const today = todayISO();
  const patients = db.patients.filter(item => item.clinicId === clinicId);
  const appointments = db.appointments.filter(item => item.clinicId === clinicId);
  const todayAppointments = appointments.filter(item => item.date === today && item.status === "confirmada");
  const pending = appointments.filter(item => item.status === "pendiente");
  const upcoming = appointments
    .filter(item => item.date >= today && item.status === "confirmada")
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 6);
  const clinic = db.clinics.find(item => item.id === clinicId);
  return {
    metrics: {
      totalPatients: patients.length,
      todayAppointments: todayAppointments.length,
      pendingAppointments: pending.length,
      messagesReceived: appointments.filter(item => item.source === "bot").length + 18
    },
    upcoming,
    planStatus: clinic ? clinic.planStatus : "pendiente"
  };
}

async function api(req, res) {
  const db = readDb();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;

  try {
    if (method === "POST" && url.pathname === "/api/auth/register") {
      const body = await parseBody(req);
      const missing = validateRequired(["clinicName", "dentistName", "email", "phone", "password"], body);
      if (missing.length) return send(res, 400, { error: `Campos requeridos: ${missing.join(", ")}` });
      const email = normalizeEmail(body.email);
      if (db.clinics.some(item => item.email === email)) return send(res, 409, { error: "Ese correo ya esta registrado" });
      if (String(body.password).length < 6) return send(res, 400, { error: "La contrasena debe tener al menos 6 caracteres" });
      const clinic = {
        id: id("clinic"),
        clinicName: String(body.clinicName).trim(),
        dentistName: String(body.dentistName).trim(),
        email,
        phone: String(body.phone).trim(),
        passwordHash: hashPassword(body.password),
        planStatus: "pendiente de pago",
        createdAt: new Date().toISOString()
      };
      db.clinics.push(clinic);
      db.botConfigs.push({
        clinicId: clinic.id,
        botName: "DentalBot",
        workStart: "08:00",
        workEnd: "17:00",
        appointmentDuration: 30,
        welcomeMessage: "Hola, soy DentalBot. Te ayudo a reservar tu cita dental.",
        afterHoursMessage: "Gracias por escribir. Estamos fuera de horario, pero puedo tomar tus datos.",
        services: ["Limpieza dental", "Ortodoncia", "Extraccion", "Consulta general", "Blanqueamiento", "Emergencia dental"]
      });
      writeDb(db);
      return send(res, 201, { clinic: publicClinic(clinic) });
    }

    if (method === "POST" && url.pathname === "/api/auth/login") {
      const body = await parseBody(req);
      const email = normalizeEmail(body.email);
      const clinic = db.clinics.find(item => item.email === email);
      if (!clinic || !verifyPassword(body.password, clinic.passwordHash)) return send(res, 401, { error: "Correo o contrasena incorrectos" });
      const token = crypto.randomBytes(32).toString("hex");
      db.sessions = db.sessions.filter(item => new Date(item.expiresAt).getTime() > Date.now());
      db.sessions.push({ token, clinicId: clinic.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() });
      writeDb(db);
      return send(res, 200, { token, clinic: publicClinic(clinic) });
    }

    if (method === "GET" && url.pathname === "/api/me") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      return send(res, 200, { clinic: publicClinic(auth.clinic) });
    }

    if (method === "GET" && url.pathname === "/api/dashboard") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      return send(res, 200, dashboardFor(db, auth.clinic.id));
    }

    if (method === "GET" && url.pathname === "/api/patients") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const query = String(url.searchParams.get("q") || "").toLowerCase();
      const patients = db.patients
        .filter(item => item.clinicId === auth.clinic.id)
        .filter(item => !query || item.name.toLowerCase().includes(query) || item.phone.includes(query));
      return send(res, 200, { patients });
    }

    if (method === "POST" && url.pathname === "/api/patients") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const body = await parseBody(req);
      const missing = validateRequired(["name", "phone"], body);
      if (missing.length) return send(res, 400, { error: `Campos requeridos: ${missing.join(", ")}` });
      const patient = { id: id("pat"), clinicId: auth.clinic.id, name: body.name.trim(), phone: body.phone.trim(), email: String(body.email || "").trim(), notes: String(body.notes || "").trim(), createdAt: new Date().toISOString() };
      db.patients.push(patient);
      writeDb(db);
      return send(res, 201, { patient });
    }

    if (method === "PUT" && url.pathname.startsWith("/api/patients/")) {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const patientId = url.pathname.split("/").pop();
      const patient = db.patients.find(item => item.id === patientId && item.clinicId === auth.clinic.id);
      if (!patient) return send(res, 404, { error: "Paciente no encontrado" });
      const body = await parseBody(req);
      ["name", "phone", "email", "notes"].forEach(field => {
        if (body[field] !== undefined) patient[field] = String(body[field]).trim();
      });
      writeDb(db);
      return send(res, 200, { patient });
    }

    if (method === "GET" && url.pathname === "/api/appointments") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const appointments = db.appointments
        .filter(item => item.clinicId === auth.clinic.id)
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
      return send(res, 200, { appointments });
    }

    if (method === "POST" && url.pathname === "/api/appointments") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const body = await parseBody(req);
      const missing = validateRequired(["patientName", "phone", "date", "time", "reason"], body);
      if (missing.length) return send(res, 400, { error: `Campos requeridos: ${missing.join(", ")}` });
      const patient = upsertPatient(db, auth.clinic.id, body.patientName, body.phone);
      const appointment = {
        id: id("apt"),
        clinicId: auth.clinic.id,
        patientId: patient.id,
        patientName: String(body.patientName).trim(),
        phone: String(body.phone).trim(),
        date: String(body.date).trim(),
        time: String(body.time).trim(),
        reason: String(body.reason).trim(),
        status: String(body.status || "pendiente").trim(),
        source: "manual",
        createdAt: new Date().toISOString()
      };
      db.appointments.push(appointment);
      writeDb(db);
      return send(res, 201, { appointment });
    }

    if (method === "PUT" && url.pathname.startsWith("/api/appointments/")) {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const appointmentId = url.pathname.split("/").pop();
      const appointment = db.appointments.find(item => item.id === appointmentId && item.clinicId === auth.clinic.id);
      if (!appointment) return send(res, 404, { error: "Cita no encontrada" });
      const body = await parseBody(req);
      ["patientName", "phone", "date", "time", "reason", "status"].forEach(field => {
        if (body[field] !== undefined) appointment[field] = String(body[field]).trim();
      });
      writeDb(db);
      return send(res, 200, { appointment });
    }

    if (method === "GET" && url.pathname === "/api/bot/config") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      return send(res, 200, { config: db.botConfigs.find(item => item.clinicId === auth.clinic.id) });
    }

    if (method === "PUT" && url.pathname === "/api/bot/config") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const body = await parseBody(req);
      let config = db.botConfigs.find(item => item.clinicId === auth.clinic.id);
      if (!config) {
        config = { clinicId: auth.clinic.id, services: [] };
        db.botConfigs.push(config);
      }
      ["botName", "workStart", "workEnd", "appointmentDuration", "welcomeMessage", "afterHoursMessage"].forEach(field => {
        if (body[field] !== undefined) config[field] = field === "appointmentDuration" ? Number(body[field]) : String(body[field]).trim();
      });
      if (Array.isArray(body.services)) config.services = body.services.map(item => String(item).trim()).filter(Boolean);
      writeDb(db);
      return send(res, 200, { config });
    }

    if (method === "GET" && url.pathname === "/api/bot/slots") {
      const clinicId = url.searchParams.get("clinicId") || "clinic_demo";
      const date = url.searchParams.get("date") || todayISO();
      return send(res, 200, { date, slots: availableSlots(db, clinicId, date) });
    }

    if (method === "POST" && url.pathname === "/api/bot/book") {
      const body = await parseBody(req);
      const clinicId = body.clinicId || "clinic_demo";
      const missing = validateRequired(["patientName", "phone", "date", "time", "reason"], body);
      if (missing.length) return send(res, 400, { error: `Campos requeridos: ${missing.join(", ")}` });
      const patient = upsertPatient(db, clinicId, body.patientName, body.phone);
      const appointment = {
        id: id("apt"),
        clinicId,
        patientId: patient.id,
        patientName: String(body.patientName).trim(),
        phone: String(body.phone).trim(),
        date: String(body.date).trim(),
        time: String(body.time).trim(),
        reason: String(body.reason).trim(),
        status: "confirmada",
        source: "bot",
        createdAt: new Date().toISOString()
      };
      db.appointments.push(appointment);
      writeDb(db);
      return send(res, 201, { appointment, message: `Tu cita fue agendada correctamente para ${appointment.date} a las ${appointment.time}.` });
    }

    if (method === "POST" && url.pathname === "/api/payments/create-checkout") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const intent = {
        id: id("pay"),
        clinicId: auth.clinic.id,
        provider: "placeholder",
        amount: 9.99,
        currency: "USD",
        status: "prepared",
        nextStep: "Integrar Stripe Checkout o PayPal Orders API aqui.",
        createdAt: new Date().toISOString()
      };
      db.paymentIntents.push(intent);
      writeDb(db);
      return send(res, 201, { paymentIntent: intent });
    }

    return send(res, 404, { error: "Endpoint no encontrado" });
  } catch (error) {
    return send(res, 500, { error: error.message || "Error interno" });
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let requestedPath = decodeURIComponent(url.pathname);
  if (requestedPath === "/") requestedPath = "/index.html";
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));
  if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, "Prohibido", "text/plain; charset=utf-8");
  const target = fs.existsSync(filePath) && fs.statSync(filePath).isFile() ? filePath : path.join(PUBLIC_DIR, "index.html");
  const ext = path.extname(target).toLowerCase();
  fs.readFile(target, (error, content) => {
    if (error) return send(res, 500, "No se pudo leer el archivo", "text/plain; charset=utf-8");
    send(res, 200, content, MIME_TYPES[ext] || "application/octet-stream");
  });
}

ensureDb();

http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) return api(req, res);
  return serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`DentalBot Pro ejecutandose en http://localhost:${PORT}`);
  console.log("Demo: demo@dentalbotpro.com / demo1234");
});

