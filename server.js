const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const net = require("net");
const tls = require("tls");
const { execFile } = require("child_process");

function loadLocalEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadLocalEnv();

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const SQLCMD_PATH = process.env.SQLCMD_PATH || "sqlcmd";
const SQL_SERVER = process.env.SQL_SERVER || "localhost";
const SQL_DATABASE = process.env.SQL_DATABASE || "Automatizacion dental";
const SQL_CLIENTS_TABLE = process.env.SQL_CLIENTS_TABLE || "dbo.ClientesDentales";
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || "dentalbot_verify_token";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_SANDBOX_WABA_ID = process.env.WHATSAPP_WABA_ID || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "";
const WHATSAPP_DEFAULT_CLINIC_ID = process.env.WHATSAPP_DEFAULT_CLINIC_ID || "clinic_demo";
const WHATSAPP_CONVERSATION_WINDOW_MS = 1000 * 60 * 60 * 24;
const META_APP_ID = process.env.META_APP_ID || "";
const META_APP_SECRET = process.env.META_APP_SECRET || "";
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || "";
const WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID = process.env.WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID || "";
const WHATSAPP_WEBHOOK_URL = process.env.WHATSAPP_WEBHOOK_URL || "";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "elianstiven06@gmail.com";
const SMTP_PASS = process.env.SMTP_PASS || "zcem rkfa qhff kebi";
const EMAIL_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

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
        email: "demo@dentace.com",
        phone: "809-555-0180",
        passwordHash: hashPassword("demo1234"),
        emailVerified: true,
        emailVerifiedAt: now.toISOString(),
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
        botName: "DentAce",
        workStart: "08:00",
        workEnd: "17:00",
        appointmentDuration: 30,
        whatsappEnabled: true,
        whatsappBusinessPhone: "18095550180",
        whatsappPhoneNumberId: "",
        welcomeMessage: "Hola, soy DentAce. Te ayudo a reservar tu cita dental.",
        afterHoursMessage: "Gracias por escribir. Estamos fuera de horario, pero puedo dejar tu solicitud registrada.",
        services: dentalServiceCatalog()
      }
    ],
    paymentIntents: [],
    ClinicWhatsAppConnection: [
      {
        ClinicId: clinicId,
        waba_id: WHATSAPP_SANDBOX_WABA_ID,
        phone_number_id: WHATSAPP_PHONE_NUMBER_ID,
        display_phone_number: "18095550180",
        access_token: WHATSAPP_ACCESS_TOKEN,
        whatsappEnabled: true,
        status: "sandbox",
        connectedAt: ""
      }
    ],
    sessions: []
  };
}

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) writeDb(seedDb());
}

function normalizeDb(db) {
  db.clinics = db.clinics || [];
  db.sessions = db.sessions || [];
  db.botConfigs = db.botConfigs || [];
  db.whatsappConversations = db.whatsappConversations || [];
  db.whatsappMessageLogs = db.whatsappMessageLogs || [];
  db.ClinicWhatsAppConnection = db.ClinicWhatsAppConnection || [];
  db.clinics.forEach(clinic => {
    if (clinic.emailVerified === undefined) clinic.emailVerified = clinic.id === "clinic_demo";
    if (clinic.id === "clinic_demo" && !clinic.emailVerifiedAt) clinic.emailVerifiedAt = clinic.createdAt || new Date().toISOString();
  });
  db.botConfigs.forEach(config => {
    if (config.whatsappEnabled === undefined) config.whatsappEnabled = true;
    if (!config.whatsappStatus) {
      config.whatsappStatus = config.whatsappPhoneNumberId ? "connected" : (config.clinicId === WHATSAPP_DEFAULT_CLINIC_ID && WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID ? "sandbox" : "disconnected");
    }
  });
  db.clinics.forEach(clinic => {
    const config = db.botConfigs.find(item => item.clinicId === clinic.id) || {};
    let connection = db.ClinicWhatsAppConnection.find(item => item.ClinicId === clinic.id);
    const isSandboxClinic = clinic.id === WHATSAPP_DEFAULT_CLINIC_ID;
    if (!connection) {
      connection = {
        ClinicId: clinic.id,
        waba_id: config.whatsappWabaId || (isSandboxClinic ? WHATSAPP_SANDBOX_WABA_ID : ""),
        phone_number_id: config.whatsappPhoneNumberId || (isSandboxClinic ? WHATSAPP_PHONE_NUMBER_ID : ""),
        display_phone_number: config.whatsappDisplayPhoneNumber || config.whatsappBusinessPhone || (isSandboxClinic ? "18095550180" : ""),
        access_token: config.whatsappAccessToken || (isSandboxClinic ? WHATSAPP_ACCESS_TOKEN : ""),
        whatsappEnabled: config.whatsappEnabled !== false,
        status: config.whatsappStatus || (isSandboxClinic && WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID ? "sandbox" : "disconnected"),
        connectedAt: config.whatsappConnectedAt || ""
      };
      db.ClinicWhatsAppConnection.push(connection);
    }
    if (isSandboxClinic && connection.status !== "connected" && WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
      connection.status = "sandbox";
      connection.waba_id = connection.waba_id || WHATSAPP_SANDBOX_WABA_ID;
      connection.phone_number_id = connection.phone_number_id || WHATSAPP_PHONE_NUMBER_ID;
      connection.display_phone_number = connection.display_phone_number || config.whatsappBusinessPhone || "18095550180";
      connection.access_token = connection.access_token || WHATSAPP_ACCESS_TOKEN;
      connection.whatsappEnabled = connection.whatsappEnabled !== false;
    }
  });
  db.whatsappConversations.forEach(conversation => {
    conversation.history = conversation.history || [];
  });
  return db;
}
function readDb() {
  ensureDb();
  return normalizeDb(JSON.parse(fs.readFileSync(DB_FILE, "utf8").replace(/^\uFEFF/, "")));
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function getWhatsAppConnection(db, clinicId) {
  db.ClinicWhatsAppConnection = db.ClinicWhatsAppConnection || [];
  let connection = db.ClinicWhatsAppConnection.find(item => item.ClinicId === clinicId);
  if (!connection) {
    const config = getBotConfig(db, clinicId);
    const isSandboxClinic = clinicId === WHATSAPP_DEFAULT_CLINIC_ID;
    connection = {
      ClinicId: clinicId,
      waba_id: config.whatsappWabaId || (isSandboxClinic ? WHATSAPP_SANDBOX_WABA_ID : ""),
      phone_number_id: config.whatsappPhoneNumberId || (isSandboxClinic ? WHATSAPP_PHONE_NUMBER_ID : ""),
      display_phone_number: config.whatsappDisplayPhoneNumber || config.whatsappBusinessPhone || "",
      access_token: config.whatsappAccessToken || (isSandboxClinic ? WHATSAPP_ACCESS_TOKEN : ""),
      whatsappEnabled: config.whatsappEnabled !== false,
      status: config.whatsappStatus || (isSandboxClinic && WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID ? "sandbox" : "disconnected"),
      connectedAt: config.whatsappConnectedAt || ""
    };
    db.ClinicWhatsAppConnection.push(connection);
  }
  return connection;
}

function publicWhatsAppConnection(connection = {}, config = {}) {
  return {
    ClinicId: connection.ClinicId || config.clinicId || "",
    waba_id: connection.waba_id || config.whatsappWabaId || "",
    phone_number_id: connection.phone_number_id || config.whatsappPhoneNumberId || "",
    display_phone_number: connection.display_phone_number || config.whatsappDisplayPhoneNumber || config.whatsappBusinessPhone || "",
    whatsappEnabled: connection.whatsappEnabled !== false,
    status: connection.status || config.whatsappStatus || "disconnected",
    connectedAt: connection.connectedAt || config.whatsappConnectedAt || "",
    has_access_token: Boolean(connection.access_token || config.whatsappAccessToken)
  };
}

function syncBotConfigFromWhatsAppConnection(config, connection) {
  config.whatsappEnabled = connection.whatsappEnabled !== false;
  config.whatsappStatus = connection.status || "disconnected";
  config.whatsappWabaId = connection.waba_id || "";
  config.whatsappPhoneNumberId = connection.phone_number_id || "";
  config.whatsappBusinessPhone = normalizePhone(connection.display_phone_number || config.whatsappBusinessPhone || "");
  config.whatsappDisplayPhoneNumber = connection.display_phone_number || "";
  if (connection.status === "connected") config.whatsappAccessToken = connection.access_token || "";
  else delete config.whatsappAccessToken;
  config.whatsappConnectedAt = connection.connectedAt || "";
}

function effectiveWhatsAppCredentials(connection, message = {}) {
  if (connection.status === "connected") {
    return {
      mode: "production",
      phoneNumberId: connection.phone_number_id || message.phoneNumberId || "",
      accessToken: connection.access_token || ""
    };
  }
  if (connection.status === "sandbox") {
    return {
      mode: "sandbox",
      phoneNumberId: WHATSAPP_PHONE_NUMBER_ID || connection.phone_number_id || message.phoneNumberId || "",
      accessToken: WHATSAPP_ACCESS_TOKEN || connection.access_token || ""
    };
  }
  return { mode: connection.status || "disconnected", phoneNumberId: "", accessToken: "" };
}
function publicBotConfig(config = {}) {
  const { whatsappAccessToken, access_token, ...safe } = config || {};
  safe.hasWhatsAppAccessToken = Boolean(whatsappAccessToken || access_token);
  return safe;
}

function embeddedSignupSettings(req) {
  const fallbackRedirect = `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host || `localhost:${PORT}`}/#whatsapp`;
  const missing = [];
  if (!META_APP_SECRET) missing.push("META_APP_SECRET");
  if (!WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID) missing.push("WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID");
  if (!META_REDIRECT_URI) missing.push("META_REDIRECT_URI");
  return {
    appId: META_APP_ID,
    configId: WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID,
    redirectUri: META_REDIRECT_URI || fallbackRedirect,
    webhookUrl: WHATSAPP_WEBHOOK_URL,
    verifyToken: WHATSAPP_VERIFY_TOKEN,
    sandbox: {
      ready: Boolean(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID),
      phoneNumberId: WHATSAPP_PHONE_NUMBER_ID,
      wabaId: WHATSAPP_SANDBOX_WABA_ID,
      hasAccessToken: Boolean(WHATSAPP_ACCESS_TOKEN)
    },
    productionReady: Boolean(META_APP_ID && META_APP_SECRET && WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID && META_REDIRECT_URI),
    ready: Boolean(META_APP_ID && META_APP_SECRET && WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID && META_REDIRECT_URI),
    missing,
    message: missing.includes("WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID") ? "Falta configurar Embedded Signup Configuration ID en Meta." : ""
  };
}
function publicClinic(clinic) {
  if (!clinic) return null;
  const { passwordHash, emailVerificationToken, emailVerificationCode, emailVerificationExpiresAt, ...safe } = clinic;
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

function verificationUrl(req, token) {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host || `localhost:${PORT}`;
  return `${protocol}://${host}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

function smtpRead(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
    };
    const onError = error => {
      cleanup();
      reject(error);
    };
    const onData = chunk => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1] || "";
      if (/^\d{3} /.test(last)) {
        cleanup();
        resolve(buffer);
      }
    };
    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function smtpCommand(socket, command, expectedCodes) {
  if (command) socket.write(`${command}\r\n`);
  const response = await smtpRead(socket);
  const code = response.slice(0, 3);
  if (expectedCodes && !expectedCodes.includes(code)) {
    throw new Error(`SMTP respondio ${code}: ${response.split(/\r?\n/)[0]}`);
  }
  return response;
}

function smtpConnect() {
  return new Promise((resolve, reject) => {
    const socket = SMTP_PORT === 465
      ? tls.connect({ host: SMTP_HOST, port: SMTP_PORT, servername: SMTP_HOST })
      : net.connect({ host: SMTP_HOST, port: SMTP_PORT });
    socket.once("connect", () => resolve(socket));
    socket.once("secureConnect", () => resolve(socket));
    socket.once("error", reject);
  });
}

function smtpStartTls(socket) {
  return new Promise((resolve, reject) => {
    const secureSocket = tls.connect({ socket, servername: SMTP_HOST }, () => resolve(secureSocket));
    secureSocket.once("error", reject);
  });
}

function encodeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(String(value), "utf8").toString("base64")}?=`;
}

function smtpEscapeData(value) {
  return String(value).replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function resetPasswordUrl(req, token) {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host || `localhost:${PORT}`;
  return `${protocol}://${host}/#reset-password?token=${encodeURIComponent(token)}`;
}

async function sendPasswordResetEmail(clinic, resetLink) {
  if (!SMTP_USER || !SMTP_PASS) throw new Error("Configura SMTP_USER y SMTP_PASS para enviar correos");
  const subject = "Restablece tu contrasena de DentAce";
  const htmlBody = `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#14213d"><h2>Restablece tu contrasena</h2><p>Hola ${clinic.dentistName}, recibimos una solicitud para cambiar la contrasena de ${clinic.clinicName}.</p><p><a href="${resetLink}" style="display:inline-block;background:#1565d8;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Cambiar contrasena</a></p><p>Si el boton no abre, copia este enlace:</p><p>${resetLink}</p><p>Este enlace vence en 1 hora. Si no solicitaste este cambio, ignora este correo.</p></div>`;
  const message = [
    `From: ${encodeHeader("DentAce")} <${SMTP_USER}>`,
    `To: ${clinic.email}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    htmlBody
  ].join("\r\n");

  let socket = await smtpConnect();
  try {
    await smtpCommand(socket, "", ["220"]);
    await smtpCommand(socket, "EHLO localhost", ["250"]);
    if (SMTP_PORT !== 465) {
      await smtpCommand(socket, "STARTTLS", ["220"]);
      socket = await smtpStartTls(socket);
      await smtpCommand(socket, "EHLO localhost", ["250"]);
    }
    const smtpPassword = String(SMTP_PASS).replace(/\s+/g, "");
    const auth = Buffer.from(`\u0000${SMTP_USER}\u0000${smtpPassword}`, "utf8").toString("base64");
    await smtpCommand(socket, `AUTH PLAIN ${auth}`, ["235"]);
    await smtpCommand(socket, `MAIL FROM:<${SMTP_USER}>`, ["250"]);
    await smtpCommand(socket, `RCPT TO:<${clinic.email}>`, ["250", "251"]);
    await smtpCommand(socket, "DATA", ["354"]);
    await smtpCommand(socket, `${smtpEscapeData(message)}\r\n.`, ["250"]);
    await smtpCommand(socket, "QUIT", ["221"]);
  } finally {
    socket.end();
  }
}
async function sendVerificationEmail(clinic, verifyLink, verifyCode) {
  if (!SMTP_USER || !SMTP_PASS) throw new Error("Configura SMTP_USER y SMTP_PASS para enviar correos de verificacion");
  const subject = "Verifica tu cuenta de DentAce";
  const htmlBody = `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#14213d"><h2>Verifica tu cuenta de DentAce</h2><p>Hola ${clinic.dentistName}, usa este codigo para activar el acceso de ${clinic.clinicName}:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px;background:#eef4ff;color:#123c69;padding:14px 18px;border-radius:10px;display:inline-block">${verifyCode}</p><p>Tambien puedes verificar con este enlace:</p><p><a href="${verifyLink}" style="display:inline-block;background:#1565d8;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Verificar cuenta</a></p><p>Este codigo vence en 24 horas.</p></div>`;
  const message = [
    `From: ${encodeHeader("DentAce")} <${SMTP_USER}>`,
    `To: ${clinic.email}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    htmlBody
  ].join("\r\n");

  let socket = await smtpConnect();
  try {
    await smtpCommand(socket, "", ["220"]);
    await smtpCommand(socket, "EHLO localhost", ["250"]);
    if (SMTP_PORT !== 465) {
      await smtpCommand(socket, "STARTTLS", ["220"]);
      socket = await smtpStartTls(socket);
      await smtpCommand(socket, "EHLO localhost", ["250"]);
    }
    const smtpPassword = String(SMTP_PASS).replace(/\s+/g, "");
    const auth = Buffer.from(`\u0000${SMTP_USER}\u0000${smtpPassword}`, "utf8").toString("base64");
    await smtpCommand(socket, `AUTH PLAIN ${auth}`, ["235"]);
    await smtpCommand(socket, `MAIL FROM:<${SMTP_USER}>`, ["250"]);
    await smtpCommand(socket, `RCPT TO:<${clinic.email}>`, ["250", "251"]);
    await smtpCommand(socket, "DATA", ["354"]);
    await smtpCommand(socket, `${smtpEscapeData(message)}\r\n.`, ["250"]);
    await smtpCommand(socket, "QUIT", ["221"]);
  } finally {
    socket.end();
  }
}

function sqlString(value) {
  return `N'${String(value || "").replace(/'/g, "''")}'`;
}

function sqlDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "SYSUTCDATETIME()" : sqlString(date.toISOString());
}

function sqlIdentifier(value) {
  return `[${String(value || "").replace(/]/g, "]]")}]`;
}

function runSql(query, database = SQL_DATABASE) {
  const args = ["-S", SQL_SERVER, "-d", database, "-b", "-Q", query];
  if (process.env.SQL_USER && process.env.SQL_PASSWORD) {
    args.splice(2, 0, "-U", process.env.SQL_USER, "-P", process.env.SQL_PASSWORD);
  } else {
    args.splice(2, 0, "-E");
  }
  return new Promise((resolve, reject) => {
    execFile(SQLCMD_PATH, args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        error.message = [error.message, stderr, stdout].filter(Boolean).join("\n");
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

async function ensureSqlDatabase() {
  await runSql(`IF DB_ID(${sqlString(SQL_DATABASE)}) IS NULL CREATE DATABASE ${sqlIdentifier(SQL_DATABASE)};`, "master");
}

async function syncRegisteredClinicToSqlServer(clinic) {
  await ensureSqlDatabase();
  const tableName = SQL_CLIENTS_TABLE.replace(/'/g, "''");
  const query = `
IF OBJECT_ID(N'${tableName}', N'U') IS NULL
BEGIN
  CREATE TABLE ${SQL_CLIENTS_TABLE} (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    NombreClinica NVARCHAR(200) NOT NULL,
    NombreDentista NVARCHAR(200) NOT NULL,
    Correo NVARCHAR(254) NOT NULL UNIQUE,
    Telefono NVARCHAR(50) NOT NULL,
    EstadoPlan NVARCHAR(50) NOT NULL,
    FechaRegistro DATETIME2 NOT NULL,
    FechaSincronizacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

MERGE ${SQL_CLIENTS_TABLE} AS target
USING (SELECT
  ${sqlString(clinic.id)} AS Id,
  ${sqlString(clinic.clinicName)} AS NombreClinica,
  ${sqlString(clinic.dentistName)} AS NombreDentista,
  ${sqlString(clinic.email)} AS Correo,
  ${sqlString(clinic.phone)} AS Telefono,
  ${sqlString(clinic.planStatus)} AS EstadoPlan,
  CONVERT(DATETIME2, ${sqlDate(clinic.createdAt)}, 127) AS FechaRegistro
) AS source
ON target.Id = source.Id OR target.Correo = source.Correo
WHEN MATCHED THEN UPDATE SET
  NombreClinica = source.NombreClinica,
  NombreDentista = source.NombreDentista,
  Correo = source.Correo,
  Telefono = source.Telefono,
  EstadoPlan = source.EstadoPlan,
  FechaRegistro = source.FechaRegistro,
  FechaSincronizacion = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT
  (Id, NombreClinica, NombreDentista, Correo, Telefono, EstadoPlan, FechaRegistro, FechaSincronizacion)
VALUES
  (source.Id, source.NombreClinica, source.NombreDentista, source.Correo, source.Telefono, source.EstadoPlan, source.FechaRegistro, SYSUTCDATETIME());
`;
  await runSql(query);
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


function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function addDaysISO(baseDate, days) {
  const date = new Date(`${baseDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseDateText(text) {
  const value = String(text || "").trim().toLowerCase();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const slash = value.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/);
  if (slash) {
    const year = slash[3] ? Number(String(slash[3]).padStart(4, "20")) : new Date().getFullYear();
    return `${year}-${String(slash[2]).padStart(2, "0")}-${String(slash[1]).padStart(2, "0")}`;
  }
  if (["hoy", "today"].includes(value)) return todayISO();
  if (["manana", "mañana", "tomorrow"].includes(value)) return addDaysISO(todayISO(), 1);
  return "";
}

function parseTimeText(text) {
  const value = String(text || "").trim().toLowerCase().replace(/\s+/g, "");
  const withMinutes = value.match(/^(\d{1,2}):(\d{2})(am|pm)?$/);
  if (withMinutes) {
    let hour = Number(withMinutes[1]);
    const suffix = withMinutes[3];
    if (suffix === "pm" && hour < 12) hour += 12;
    if (suffix === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${withMinutes[2]}`;
  }
  const hourOnly = value.match(/^(\d{1,2})(am|pm)?$/);
  if (!hourOnly) return "";
  let hour = Number(hourOnly[1]);
  if (hourOnly[2] === "pm" && hour < 12) hour += 12;
  if (hourOnly[2] === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:00`;
}

function displayTime(time) {
  const [hours, minutes] = String(time || "00:00").split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = ((hours + 11) % 12) + 1;
  return `${hour12}:${String(minutes || 0).padStart(2, "0")} ${suffix}`;
}

function displaySlotList(slots) {
  return slots.slice(0, 5).map(displayTime).join(", ");
}

const DENTAL_SERVICE_CATEGORIES = [
  { title: "ODONTOLOGIA GENERAL", services: ["Consulta general", "Consulta de primera vez", "Revision dental", "Control periodico", "Diagnostico dental"] },
  { title: "PREVENCION", services: ["Limpieza dental", "Limpieza profunda", "Aplicacion de fluor", "Sellantes dentales", "Profilaxis dental"] },
  { title: "ESTETICA DENTAL", services: ["Blanqueamiento dental", "Diseno de sonrisa", "Carillas dentales", "Resinas esteticas", "Contorneado dental"] },
  { title: "ORTODONCIA", services: ["Evaluacion ortodontica", "Colocacion de brackets", "Ajuste de brackets", "Retiro de brackets", "Invisalign", "Retenedores"] },
  { title: "ENDODONCIA", services: ["Tratamiento de conducto", "Retratamiento de conducto", "Urgencia endodontica"] },
  { title: "PERIODONCIA", services: ["Tratamiento de encias", "Raspado y alisado radicular", "Cirugia periodontal", "Mantenimiento periodontal"] },
  { title: "PROTESIS DENTAL", services: ["Coronas dentales", "Puentes dentales", "Protesis fija", "Protesis removible", "Reparacion de protesis"] },
  { title: "IMPLANTOLOGIA", services: ["Evaluacion para implantes", "Implantes dentales", "Mantenimiento de implantes"] },
  { title: "CIRUGIA ORAL", services: ["Extraccion simple", "Extraccion de cordales", "Cirugia oral menor", "Frenectomia"] },
  { title: "ODONTOPEDIATRIA", services: ["Consulta infantil", "Limpieza infantil", "Aplicacion de fluor infantil", "Sellantes infantiles"] },
  { title: "DIAGNOSTICO", services: ["Radiografia panoramica", "Radiografia periapical", "Radiografia digital", "Escaner intraoral", "Fotografia clinica"] },
  { title: "OTROS SERVICIOS", services: ["Bruxismo", "Ferula de descarga", "Tratamiento ATM", "Sensibilidad dental", "Halitosis", "Urgencia dental", "Emergencia dental", "Control postoperatorio", "Seguimiento de tratamiento", "Consulta virtual"] },
  { title: "SERVICIOS PERSONALIZADOS", services: ["Ortodoncia", "Extraccion", "Blanqueamiento"] }
];

function dentalServiceCatalog() {
  return DENTAL_SERVICE_CATEGORIES.flatMap(category => category.services);
}

function serviceMenu(config) {
  let index = 1;
  const sections = DENTAL_SERVICE_CATEGORIES.map(category => {
    const items = category.services.map(service => `${index++}. ${service}`);
    const lines = [];
    for (let i = 0; i < items.length; i += 2) {
      const left = items[i].padEnd(34, " ");
      const right = items[i + 1] || "";
      lines.push(right ? `${left} ${right}` : items[i]);
    }
    return `*${category.title}*\n${lines.join("\n")}`;
  });
  return `Servicios disponibles:\n\n${sections.join("\n\n")}\n\nResponde con el numero del servicio o escribe tu motivo.`;
}

function isAppointmentIntent(text) {
  const value = String(text || "").toLowerCase();
  return /\b(cita|turno|consulta|reservar|agendar|agenda|appointment)\b/.test(value);
}

function getWhatsAppClinic(db, clinicId = WHATSAPP_DEFAULT_CLINIC_ID) {
  return db.clinics.find(item => item.id === clinicId) || db.clinics[0];
}

function getBotConfig(db, clinicId) {
  return db.botConfigs.find(item => item.clinicId === clinicId) || {};
}

function findWhatsAppClinic(db, message = {}) {
  const displayPhone = normalizePhone(message.displayPhoneNumber || message.businessPhone || "");
  const phoneNumberId = String(message.phoneNumberId || "").trim();
  const connection = (db.ClinicWhatsAppConnection || []).find(item => {
    const connectionPhone = normalizePhone(item.display_phone_number || "");
    const connectionPhoneId = String(item.phone_number_id || "").trim();
    return (phoneNumberId && connectionPhoneId && connectionPhoneId === phoneNumberId) || (displayPhone && connectionPhone && connectionPhone === displayPhone);
  });
  if (connection) return getWhatsAppClinic(db, connection.ClinicId);
  if (phoneNumberId && WHATSAPP_PHONE_NUMBER_ID && phoneNumberId === WHATSAPP_PHONE_NUMBER_ID) return getWhatsAppClinic(db, WHATSAPP_DEFAULT_CLINIC_ID);
  const config = db.botConfigs.find(item => {
    const configPhone = normalizePhone(item.whatsappBusinessPhone || "");
    const configPhoneId = String(item.whatsappPhoneNumberId || "").trim();
    return (phoneNumberId && configPhoneId && configPhoneId === phoneNumberId) || (displayPhone && configPhone && configPhone === displayPhone);
  });
  return config ? getWhatsAppClinic(db, config.clinicId) : getWhatsAppClinic(db);
}
function createConfirmedBotAppointment(db, clinicId, data, source = "whatsapp") {
  const patient = upsertPatient(db, clinicId, data.patientName, data.phone);
  const appointment = {
    id: id("apt"),
    clinicId,
    patientId: patient.id,
    patientName: String(data.patientName).trim(),
    phone: String(data.phone).trim(),
    date: String(data.date).trim(),
    time: String(data.time).trim(),
    reason: String(data.reason).trim(),
    status: "confirmada",
    source,
    createdAt: new Date().toISOString()
  };
  db.appointments.push(appointment);
  return appointment;
}

function getConversation(db, clinicId, phone) {
  db.whatsappConversations = db.whatsappConversations || [];
  let conversation = db.whatsappConversations.find(item => item.clinicId === clinicId && item.phone === phone);
  if (!conversation) {
    conversation = { clinicId, phone, step: "name", data: { phone }, history: [], updatedAt: new Date().toISOString() };
    db.whatsappConversations.push(conversation);
  }
  conversation.history = conversation.history || [];
  return conversation;
}

function resetConversation(conversation, phone) {
  conversation.step = "name";
  conversation.data = { phone };
  conversation.updatedAt = new Date().toISOString();
}

function whatsappConfigEnabled(config) {
  return config && config.whatsappEnabled !== false;
}

function activeConversationWindow(message) {
  if (!message.timestampMs) return true;
  return Date.now() - message.timestampMs <= WHATSAPP_CONVERSATION_WINDOW_MS;
}

function appendConversationHistory(conversation, entry) {
  conversation.history = conversation.history || [];
  conversation.history.push({
    id: id("wmsg"),
    direction: entry.direction,
    text: String(entry.text || ""),
    messageId: entry.messageId || "",
    status: entry.status || "ok",
    createdAt: new Date().toISOString()
  });
}

function appendWhatsAppLog(db, entry) {
  db.whatsappMessageLogs = db.whatsappMessageLogs || [];
  const log = {
    id: id("wlog"),
    clinicId: entry.clinicId || "",
    phone: normalizePhone(entry.phone || ""),
    direction: entry.direction,
    text: String(entry.text || ""),
    status: entry.status || "ok",
    reason: entry.reason || "",
    messageId: entry.messageId || "",
    createdAt: new Date().toISOString()
  };
  db.whatsappMessageLogs.push(log);
  console.log(`[WhatsApp ${log.direction}] clinic=${log.clinicId || "unknown"} phone=${log.phone || "unknown"} status=${log.status}${log.reason ? ` reason=${log.reason}` : ""}`);
  return log;
}

function processWhatsAppBotMessage(db, { clinicId, phone, text }) {
  const clinic = getWhatsAppClinic(db, clinicId);
  if (!clinic) return { reply: "No hay una clinica configurada para este numero.", appointment: null };
  const config = getBotConfig(db, clinic.id);
  const conversation = getConversation(db, clinic.id, phone);
  const cleanText = String(text || "").trim();
  const lower = cleanText.toLowerCase();
  conversation.updatedAt = new Date().toISOString();

  if (!cleanText || ["hola", "buenas", "inicio", "empezar", "reiniciar", "cancelar"].includes(lower)) {
    resetConversation(conversation, phone);
    return { reply: `${config.welcomeMessage || "Hola, soy DentAce. Te ayudo a reservar tu cita dental."}\n\nPara empezar, me permites tu primer nombre y primer apellido?`, appointment: null };
  }

  if (conversation.step === "name" && isAppointmentIntent(cleanText)) {
    return { reply: `Perfecto, te ayudo a agendar. Primero, me permites tu primer nombre y primer apellido?`, appointment: null };
  }

  if (conversation.step === "name") {
    conversation.data.patientName = cleanText;
    conversation.data.phone = phone;
    conversation.step = "reason";
    return { reply: `Gracias, ${conversation.data.patientName}. Que servicio o motivo necesitas?\n\n${serviceMenu(config)}`, appointment: null };
  }

  if (conversation.step === "reason") {
    const selectedIndex = Number(cleanText);
    const selectedService = Number.isInteger(selectedIndex) ? dentalServiceCatalog()[selectedIndex - 1] : "";
    conversation.data.reason = selectedService || cleanText;
    conversation.step = "date";
    return { reply: "Perfecto. Para que fecha quieres la cita? Puedes escribir hoy, mañana o una fecha como 2026-07-05.", appointment: null };
  }

  if (conversation.step === "date") {
    const date = parseDateText(cleanText);
    if (!date) return { reply: "No pude entender la fecha. Envia una fecha como 2026-07-05, 05/07/2026, hoy o mañana.", appointment: null };
    const slots = availableSlots(db, clinic.id, date);
    if (!slots.length) return { reply: "Ese dia no tiene horarios disponibles. Envia otra fecha para buscar espacios libres.", appointment: null };
    conversation.data.date = date;
    conversation.data.slots = slots;
    conversation.step = "time";
    return { reply: `Tengo estos horarios disponibles para ${date}: ${displaySlotList(slots)}. Cual prefieres?`, appointment: null };
  }

  if (conversation.step === "time") {
    const time = parseTimeText(cleanText);
    const slots = availableSlots(db, clinic.id, conversation.data.date);
    if (!time || !slots.includes(time)) return { reply: `Ese horario no esta disponible. Elige uno de estos: ${displaySlotList(slots)}.`, appointment: null };
    conversation.data.time = time;
    const appointment = createConfirmedBotAppointment(db, clinic.id, conversation.data, "whatsapp");
    resetConversation(conversation, phone);
    return { reply: `Listo. Tu cita fue confirmada para ${appointment.date} a las ${displayTime(appointment.time)}.\nPaciente: ${appointment.patientName}\nServicio: ${appointment.reason}`, appointment };
  }

  resetConversation(conversation, phone);
  return { reply: "Vamos a empezar de nuevo. Me permites tu primer nombre y primer apellido?", appointment: null };
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


function extractWhatsAppMessages(payload) {
  const messages = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const metadata = value.metadata || {};
      for (const message of value.messages || []) {
        if (message.type !== "text") continue;
        messages.push({
          from: normalizePhone(message.from),
          text: message.text?.body || "",
          phoneNumberId: metadata.phone_number_id || "",
          displayPhoneNumber: metadata.display_phone_number || "",
          messageId: message.id || "",
          timestampMs: message.timestamp ? Number(message.timestamp) * 1000 : Date.now()
        });
      }
    }
  }
  return messages.filter(item => item.from && item.text);
}

async function graphGet(pathname, accessToken, params = {}) {
  const url = new URL(`https://graph.facebook.com/v20.0/${pathname.replace(/^\//, "")}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "Meta Graph API rechazo la solicitud");
  return data;
}

async function exchangeMetaCodeForToken(code, redirectUri) {
  const url = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
  url.searchParams.set("client_id", META_APP_ID);
  url.searchParams.set("client_secret", META_APP_SECRET);
  url.searchParams.set("code", code);
  if (redirectUri) url.searchParams.set("redirect_uri", redirectUri);
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error(data.error?.message || "No se pudo intercambiar el code de Meta");
  return data;
}

async function resolveWhatsAppSignupAssets(accessToken, provided = {}) {
  const result = {
    wabaId: String(provided.waba_id || provided.wabaId || "").trim(),
    phoneNumberId: String(provided.phone_number_id || provided.phoneNumberId || "").trim(),
    displayPhoneNumber: String(provided.display_phone_number || provided.displayPhoneNumber || "").trim()
  };
  if (result.phoneNumberId && result.displayPhoneNumber) return result;

  if (result.wabaId) {
    const phones = await graphGet(`${result.wabaId}/phone_numbers`, accessToken, { fields: "id,display_phone_number,verified_name" });
    const first = (phones.data || [])[0] || {};
    result.phoneNumberId = result.phoneNumberId || String(first.id || "");
    result.displayPhoneNumber = result.displayPhoneNumber || String(first.display_phone_number || "");
    return result;
  }

  const businesses = await graphGet("me/businesses", accessToken, { fields: "id,name" });
  for (const business of businesses.data || []) {
    const accounts = await graphGet(`${business.id}/owned_whatsapp_business_accounts`, accessToken, { fields: "id,name" }).catch(() => ({ data: [] }));
    const account = (accounts.data || [])[0];
    if (!account) continue;
    result.wabaId = String(account.id || "");
    const phones = await graphGet(`${result.wabaId}/phone_numbers`, accessToken, { fields: "id,display_phone_number,verified_name" }).catch(() => ({ data: [] }));
    const first = (phones.data || [])[0] || {};
    result.phoneNumberId = String(first.id || "");
    result.displayPhoneNumber = String(first.display_phone_number || "");
    if (result.phoneNumberId) return result;
  }
  return result;
}
async function sendWhatsAppText(to, text, phoneNumberId = WHATSAPP_PHONE_NUMBER_ID, accessToken = WHATSAPP_ACCESS_TOKEN) {
  if (!accessToken || !phoneNumberId) {
    console.log(`[WhatsApp demo] ${to}: ${text}`);
    return { skipped: true };
  }
  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { preview_url: false, body: text }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "No se pudo enviar mensaje de WhatsApp");
  return data;
}


async function handleIncomingWhatsAppMessage(db, message) {
  const clinic = findWhatsAppClinic(db, message);
  const config = getBotConfig(db, clinic.id);
  const connection = getWhatsAppConnection(db, clinic.id);
  const conversation = getConversation(db, clinic.id, message.from);
  appendWhatsAppLog(db, { clinicId: clinic.id, phone: message.from, direction: "received", text: message.text, messageId: message.messageId });
  appendConversationHistory(conversation, { direction: "received", text: message.text, messageId: message.messageId });

  if (!whatsappConfigEnabled(config) || connection.whatsappEnabled === false) {
    appendWhatsAppLog(db, { clinicId: clinic.id, phone: message.from, direction: "sent", text: "", status: "skipped", reason: "whatsapp_disabled", messageId: message.messageId });
    return { from: message.from, clinicId: clinic.id, replied: false, skipped: "whatsapp_disabled" };
  }

  if (!activeConversationWindow(message)) {
    appendWhatsAppLog(db, { clinicId: clinic.id, phone: message.from, direction: "sent", text: "", status: "skipped", reason: "conversation_window_closed", messageId: message.messageId });
    return { from: message.from, clinicId: clinic.id, replied: false, skipped: "conversation_window_closed" };
  }

  const result = processWhatsAppBotMessage(db, { clinicId: clinic.id, phone: message.from, text: message.text });
  const credentials = effectiveWhatsAppCredentials(connection, message);
  await sendWhatsAppText(message.from, result.reply, credentials.phoneNumberId, credentials.accessToken);
  appendConversationHistory(conversation, { direction: "sent", text: result.reply, status: "sent" });
  appendWhatsAppLog(db, { clinicId: clinic.id, phone: message.from, direction: "sent", text: result.reply, status: "sent" });
  return {
    from: message.from,
    businessPhone: config.whatsappBusinessPhone || message.displayPhoneNumber || "",
    clinicId: clinic.id,
    replied: true,
    reply: result.reply,
    appointment: result.appointment
  };
}
async function whatsappWebhook(req, res) {
  const db = readDb();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;

  try {
    if (method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge") || "";
      if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) return send(res, 200, challenge, "text/plain; charset=utf-8");
      return send(res, 403, "Token de verificacion invalido", "text/plain; charset=utf-8");
    }

    if (method === "POST") {
      const payload = await parseBody(req);
      const messages = extractWhatsAppMessages(payload);
      const results = [];
      for (const message of messages) {
        results.push(await handleIncomingWhatsAppMessage(db, message));
      }
      writeDb(db);
      return send(res, 200, { ok: true, processed: results.length, results });
    }

    return send(res, 405, { error: "Metodo no permitido" });
  } catch (error) {
    return send(res, 500, { error: error.message || "Error en webhook de WhatsApp" });
  }
}
async function api(req, res) {
  const db = readDb();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;

  try {
    if (method === "POST" && url.pathname === "/api/whatsapp/simulate") {
      const body = await parseBody(req);
      const phone = normalizePhone(body.phone || "8290000000");
      const clinic = body.clinicId ? getWhatsAppClinic(db, body.clinicId) : findWhatsAppClinic(db, { businessPhone: body.businessPhone });
      const config = getBotConfig(db, clinic.id);
      const connection = getWhatsAppConnection(db, clinic.id);
      const conversation = getConversation(db, clinic.id, phone);
      const text = String(body.text || "").trim();
      appendWhatsAppLog(db, { clinicId: clinic.id, phone, direction: "received", text, messageId: "simulate" });
      appendConversationHistory(conversation, { direction: "received", text, messageId: "simulate" });
      if (!whatsappConfigEnabled(config) || connection.whatsappEnabled === false) {
        appendWhatsAppLog(db, { clinicId: clinic.id, phone, direction: "sent", text: "", status: "skipped", reason: "whatsapp_disabled", messageId: "simulate" });
        writeDb(db);
        return send(res, 200, { replied: false, skipped: "whatsapp_disabled" });
      }
      const result = processWhatsAppBotMessage(db, { clinicId: clinic.id, phone, text });
      appendConversationHistory(conversation, { direction: "sent", text: result.reply, status: "simulated" });
      appendWhatsAppLog(db, { clinicId: clinic.id, phone, direction: "sent", text: result.reply, status: "simulated" });
      writeDb(db);
      return send(res, 200, { ...result, replied: true, simulated: true });
    }
    if (method === "GET" && url.pathname === "/api/auth/verify-email") {
      const token = String(url.searchParams.get("token") || "").trim();
      const clinic = db.clinics.find(item => item.emailVerificationToken === token && new Date(item.emailVerificationExpiresAt || 0).getTime() > Date.now());
      if (!token || !clinic) {
        return send(res, 400, "<h1>Enlace invalido o vencido</h1><p>Solicita un nuevo registro o contacta soporte.</p>", "text/html; charset=utf-8");
      }
      clinic.emailVerified = true;
      clinic.emailVerifiedAt = new Date().toISOString();
      delete clinic.emailVerificationToken;
      delete clinic.emailVerificationExpiresAt;
      writeDb(db);
      return send(res, 200, "<h1>Correo verificado</h1><p>Tu cuenta de DentAce ya esta activa. Puedes iniciar sesion.</p><p><a href='/#login'>Ir al login</a></p>", "text/html; charset=utf-8");
    }

    if (method === "POST" && url.pathname === "/api/auth/forgot-password") {
      const body = await parseBody(req);
      const email = normalizeEmail(body.email);
      const clinic = db.clinics.find(item => item.email === email);
      if (clinic) {
        clinic.passwordResetToken = crypto.randomBytes(32).toString("hex");
        clinic.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();
        await sendPasswordResetEmail(clinic, resetPasswordUrl(req, clinic.passwordResetToken));
        writeDb(db);
      }
      return send(res, 200, { message: "Si el correo existe, enviaremos un enlace para restablecer la contrasena." });
    }

    if (method === "POST" && url.pathname === "/api/auth/reset-password") {
      const body = await parseBody(req);
      const token = String(body.token || "").trim();
      const password = String(body.password || "");
      if (password.length < 6) return send(res, 400, { error: "La contrasena debe tener al menos 6 caracteres" });
      const clinic = db.clinics.find(item => item.passwordResetToken === token && new Date(item.passwordResetExpiresAt || 0).getTime() > Date.now());
      if (!token || !clinic) return send(res, 400, { error: "Enlace invalido o vencido" });
      clinic.passwordHash = hashPassword(password);
      delete clinic.passwordResetToken;
      delete clinic.passwordResetExpiresAt;
      db.sessions = (db.sessions || []).filter(item => item.clinicId !== clinic.id);
      writeDb(db);
      return send(res, 200, { message: "Contrasena actualizada. Ya puedes iniciar sesion." });
    }
    if (method === "POST" && url.pathname === "/api/auth/resend-verification-code") {
      const body = await parseBody(req);
      const email = normalizeEmail(body.email);
      const clinic = db.clinics.find(item => item.email === email);
      if (!email || !clinic) return send(res, 404, { error: "Correo no registrado" });
      if (clinic.emailVerified) return send(res, 200, { message: "Este correo ya esta verificado. Puedes iniciar sesion." });
      clinic.emailVerificationToken = clinic.emailVerificationToken || crypto.randomBytes(32).toString("hex");
      clinic.emailVerificationCode = String(crypto.randomInt(100000, 1000000));
      clinic.emailVerificationExpiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_MS).toISOString();
      await sendVerificationEmail(clinic, verificationUrl(req, clinic.emailVerificationToken), clinic.emailVerificationCode);
      writeDb(db);
      return send(res, 200, { message: "Codigo reenviado. Revisa tu correo." });
    }
    if (method === "POST" && url.pathname === "/api/auth/verify-email-code") {
      const body = await parseBody(req);
      const email = normalizeEmail(body.email);
      const code = String(body.code || "").replace(/\D/g, "");
      const clinic = db.clinics.find(item => item.email === email && item.emailVerificationCode === code && new Date(item.emailVerificationExpiresAt || 0).getTime() > Date.now());
      if (!email || !code || !clinic) return send(res, 400, { error: "Codigo invalido o vencido" });
      clinic.emailVerified = true;
      clinic.emailVerifiedAt = new Date().toISOString();
      delete clinic.emailVerificationToken;
      delete clinic.emailVerificationCode;
      delete clinic.emailVerificationExpiresAt;
      writeDb(db);
      return send(res, 200, { clinic: publicClinic(clinic), message: "Correo verificado. Ya puedes iniciar sesion." });
    }
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
        emailVerified: false,
        emailVerificationToken: crypto.randomBytes(32).toString("hex"),
        emailVerificationCode: String(crypto.randomInt(100000, 1000000)),
        emailVerificationExpiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS).toISOString(),
        planStatus: "pendiente de pago",
        createdAt: new Date().toISOString()
      };
      db.clinics.push(clinic);
      db.botConfigs.push({
        clinicId: clinic.id,
        botName: "DentAce",
        workStart: "08:00",
        workEnd: "17:00",
        appointmentDuration: 30,
        whatsappEnabled: true,
        whatsappBusinessPhone: normalizePhone(clinic.phone),
        whatsappPhoneNumberId: "",
        welcomeMessage: "Hola, soy DentAce. Te ayudo a reservar tu cita dental.",
        afterHoursMessage: "Gracias por escribir. Estamos fuera de horario, pero puedo tomar tus datos.",
        services: dentalServiceCatalog()
      });
      await syncRegisteredClinicToSqlServer(clinic);
      try {
        await sendVerificationEmail(clinic, verificationUrl(req, clinic.emailVerificationToken), clinic.emailVerificationCode);
      } catch (emailError) {
        console.error("No se pudo enviar correo de verificacion:", emailError.message);
        throw new Error("Gmail no pudo enviar el codigo. Configura SMTP_USER con tu Gmail y SMTP_PASS con una clave de aplicacion valida de Google.");
      }
      writeDb(db);
      return send(res, 201, { clinic: publicClinic(clinic), message: "Cuenta creada. Te enviamos un codigo de verificacion a tu correo." });
    }

    if (method === "POST" && url.pathname === "/api/auth/login") {
      const body = await parseBody(req);
      const email = normalizeEmail(body.email);
      const clinic = db.clinics.find(item => item.email === email);
      if (!clinic || !verifyPassword(body.password, clinic.passwordHash)) return send(res, 401, { error: "Correo o contrasena incorrectos" });
      if (!clinic.emailVerified) return send(res, 403, { error: "Debes verificar tu correo antes de iniciar sesion. Revisa el enlace enviado a tu email." });
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

    if (method === "DELETE" && url.pathname.startsWith("/api/patients/")) {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const patientId = url.pathname.split("/").pop();
      const patient = db.patients.find(item => item.id === patientId && item.clinicId === auth.clinic.id);
      if (!patient) return send(res, 404, { error: "Paciente no encontrado" });
      const phone = patient.phone;
      db.patients = db.patients.filter(item => !(item.id === patientId && item.clinicId === auth.clinic.id));
      db.appointments = db.appointments.filter(item => !(item.clinicId === auth.clinic.id && (item.patientId === patientId || item.phone === phone)));
      writeDb(db);
      return send(res, 200, { ok: true });
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

    if (method === "GET" && url.pathname === "/api/whatsapp/embedded-signup/config") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      return send(res, 200, embeddedSignupSettings(req));
    }

    if (method === "GET" && url.pathname === "/api/whatsapp/connection") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const config = getBotConfig(db, auth.clinic.id);
      const connection = getWhatsAppConnection(db, auth.clinic.id);
      return send(res, 200, { connection: publicBotConfig(config), clinicWhatsAppConnection: publicWhatsAppConnection(connection, config) });
    }

    if (method === "POST" && url.pathname === "/api/whatsapp/embedded-signup/exchange") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const signupSettings = embeddedSignupSettings(req);
      if (!signupSettings.productionReady) {
        return send(res, 400, { error: signupSettings.message || `Faltan variables de produccion en .env: ${signupSettings.missing.join(", ")}` });
      }
      const body = await parseBody(req);
      const code = String(body.code || "").trim();
      if (!code) return send(res, 400, { error: "Meta no devolvio code de autorizacion" });
      const tokenData = await exchangeMetaCodeForToken(code, body.redirectUri || META_REDIRECT_URI || embeddedSignupSettings(req).redirectUri);
      const assets = await resolveWhatsAppSignupAssets(tokenData.access_token, body);
      if (!assets.wabaId || !assets.phoneNumberId) return send(res, 400, { error: "No se pudo resolver WABA ID o Phone Number ID desde Meta" });
      let config = db.botConfigs.find(item => item.clinicId === auth.clinic.id);
      if (!config) {
        config = { clinicId: auth.clinic.id, services: dentalServiceCatalog() };
        db.botConfigs.push(config);
      }
      const connectedAt = new Date().toISOString();
      const connection = getWhatsAppConnection(db, auth.clinic.id);
      connection.waba_id = assets.wabaId;
      connection.phone_number_id = assets.phoneNumberId;
      connection.display_phone_number = assets.displayPhoneNumber;
      connection.access_token = tokenData.access_token;
      connection.whatsappEnabled = true;
      connection.status = "connected";
      connection.connectedAt = connectedAt;
      syncBotConfigFromWhatsAppConnection(config, connection);
      config.whatsappTokenType = tokenData.token_type || "bearer";
      config.whatsappTokenExpiresIn = tokenData.expires_in || null;
      writeDb(db);
      return send(res, 200, { connection: publicBotConfig(config), clinicWhatsAppConnection: publicWhatsAppConnection(connection, config), message: "WhatsApp conectado correctamente." });
    }

    if (method === "POST" && url.pathname === "/api/whatsapp/disconnect") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const config = getBotConfig(db, auth.clinic.id);
      const connection = getWhatsAppConnection(db, auth.clinic.id);
      connection.whatsappEnabled = false;
      connection.status = "disconnected";
      connection.access_token = "";
      connection.connectedAt = "";
      syncBotConfigFromWhatsAppConnection(config, connection);
      delete config.whatsappTokenType;
      delete config.whatsappTokenExpiresIn;
      writeDb(db);
      return send(res, 200, { connection: publicBotConfig(config), clinicWhatsAppConnection: publicWhatsAppConnection(connection, config), message: "WhatsApp desconectado para esta clinica." });
    }
    if (method === "GET" && url.pathname === "/api/bot/config") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      return send(res, 200, { config: publicBotConfig(db.botConfigs.find(item => item.clinicId === auth.clinic.id) || {}) });
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
      ["botName", "workStart", "workEnd", "appointmentDuration", "whatsappPhoneNumberId", "welcomeMessage", "afterHoursMessage"].forEach(field => {
        if (body[field] !== undefined) config[field] = field === "appointmentDuration" ? Number(body[field]) : String(body[field]).trim();
      });
      if (body.whatsappBusinessPhone !== undefined) config.whatsappBusinessPhone = normalizePhone(body.whatsappBusinessPhone);
      if (body.whatsappEnabled !== undefined) config.whatsappEnabled = body.whatsappEnabled === true || body.whatsappEnabled === "true" || body.whatsappEnabled === "on";
      if (Array.isArray(body.services)) config.services = body.services.map(item => String(item).trim()).filter(Boolean);
      writeDb(db);
      return send(res, 200, { config: publicBotConfig(config) });
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
      return send(res, 201, { appointment, message: `Tu cita fue agendada correctamente para ${appointment.date} a las ${displayTime(appointment.time)}.` });
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
  if (req.url.startsWith("/webhooks/whatsapp")) return whatsappWebhook(req, res);
  if (req.url.startsWith("/api/")) return api(req, res);
  return serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`DentAce ejecutandose en http://localhost:${PORT}`);
  console.log("Demo: demo@dentace.com / demo1234");
});


















