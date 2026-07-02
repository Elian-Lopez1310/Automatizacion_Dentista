const app = document.querySelector("#app");
const state = {
  token: localStorage.getItem("dentalbot_token") || "",
  clinic: JSON.parse(localStorage.getItem("dentalbot_clinic") || "null"),
  route: location.hash.replace("#", "") || "landing",
  appointments: [],
  patients: [],
  dashboard: null,
  botConfig: null,
  calendarView: "daily",
  availabilitySelectedDate: nextBusinessDate(),
  chat: {
    step: "name",
    data: { clinicId: "clinic_demo", date: nextBusinessDate() },
    messages: []
  }
};

const icons = {
  bot: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="7" width="14" height="11" rx="4"></rect><path d="M12 3v4"></path><path d="M8.5 12h.01"></path><path d="M15.5 12h.01"></path><path d="M9 18v2h6v-2"></path></svg></span>',
  calendar: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3"></rect><path d="M8 3v4"></path><path d="M16 3v4"></path><path d="M4 10h16"></path><path d="M8 14h3"></path><path d="M13 14h3"></path></svg></span>',
  patients: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4"></path><circle cx="12" cy="9" r="3"></circle><path d="M20 18c0-1.7-1.1-3.1-2.6-3.7"></path><path d="M16.8 6.4a2.5 2.5 0 0 1 0 4.2"></path></svg></span>',
  chart: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19h16"></path><path d="M7 16V9"></path><path d="M12 16V5"></path><path d="M17 16v-6"></path></svg></span>',
  settings: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"></path><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.8 1.8 0 0 0-2 .1 8 8 0 0 1-1.4.8 1.8 1.8 0 0 0-1.1 1.6V23H9v-.2a1.8 1.8 0 0 0-1.1-1.6 8 8 0 0 1-1.4-.8 1.8 1.8 0 0 0-2-.1l-.2.1-2-3.4.1-.1A1.7 1.7 0 0 0 2.6 15 8.8 8.8 0 0 1 2.5 13 1.8 1.8 0 0 0 1 11.5H.8V7.5H1a1.8 1.8 0 0 0 1.6-1.1c.2-.5.5-1 .8-1.4a1.8 1.8 0 0 0 .1-2l-.1-.2 3.4-2 .1.1A1.7 1.7 0 0 0 8.8 1c.5-.2 1-.3 1.6-.4A1.8 1.8 0 0 0 12 .1h.1a1.8 1.8 0 0 0 1.6.5c.6.1 1.1.2 1.6.4a1.7 1.7 0 0 0 1.9-.3l.1-.1 3.4 2-.1.2a1.8 1.8 0 0 0 .1 2c.3.4.6.9.8 1.4A1.8 1.8 0 0 0 23 7.5h.2v4H23a1.8 1.8 0 0 0-1.6 1.1c0 .8-.1 1.6-.3 2.4Z"></path></svg></span>',
  services: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3c3 0 5 2.2 5 5.2 0 2.7-1.5 4.4-2.1 6.8-.5 2-1 6-2.9 6s-2.4-4-2.9-6C8.5 12.6 7 10.9 7 8.2 7 5.2 9 3 12 3Z"></path><path d="M10 5.4c1.1.8 2.9.8 4 0"></path></svg></span>',
  reports: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"></rect><path d="M8 16V9"></path><path d="M12 16v-5"></path><path d="M16 16V7"></path><path d="M7 19h10"></path></svg></span>',  pay: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"></rect><path d="M3 10h18"></path><path d="M7 15h4"></path></svg></span>',
  phone: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1.4 1.4 0 0 1 1.4-.3c1.5.5 3 .8 4.2.8V20a2 2 0 0 1-2 2C9.6 22 2 14.4 2 5a2 2 0 0 1 2-2h4.3c0 1.2.3 2.7.8 4.2.2.5.1 1-.3 1.4l-2.2 2.2Z"></path></svg></span>',
  login: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path><path d="M3 12h12"></path><path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"></path></svg></span>',
  check: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12l4 4L19 6"></path></svg></span>',
  edit: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"></path><path d="M13.5 6.5l4 4"></path></svg></span>'
};

window.addEventListener("hashchange", () => {
  state.route = location.hash.replace("#", "") || "landing";
  render();
});

function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  return fetch(path, { ...options, headers }).then(async response => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Error de solicitud");
    return data;
  });
}

function setRoute(route) {
  location.hash = route;
}

function saveSession(token, clinic) {
  state.token = token;
  state.clinic = clinic;
  localStorage.setItem("dentalbot_token", token);
  localStorage.setItem("dentalbot_clinic", JSON.stringify(clinic));
}

function logout() {
  state.token = "";
  state.clinic = null;
  localStorage.removeItem("dentalbot_token");
  localStorage.removeItem("dentalbot_clinic");
  setRoute("landing");
}

function nextBusinessDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function money(value) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" }).format(value);
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "class") node.className = value;
    else if (key === "html") node.innerHTML = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== false && value !== null && value !== undefined) node.setAttribute(key, value);
  });
  const list = Array.isArray(children) ? children : [children];
  list.forEach(child => {
    if (child === null || child === undefined) return;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  });
  return node;
}

function html(template) {
  const wrapper = document.createElement("template");
  wrapper.innerHTML = template.trim();
  return wrapper.content.firstElementChild;
}

function publicNav() {
  return `
    <header class="topbar premium-nav">
      <div class="topbar-inner">
        <button class="brand public-brand" data-route="landing" aria-label="DentalBot Pro inicio">
          <span class="brand-mark">DB</span>
          <span class="brand-copy"><strong>DentalBot Pro</strong><small>AI Dental Automation</small></span>
        </button>
        <nav class="public-menu" aria-label="Navegacion principal">
          <a href="#inicio">Inicio</a><a href="#caracteristicas">Caracteristicas</a><a href="#bot-ia">Bot IA</a><a href="#planes">Planes</a><a href="#faq">FAQ</a><a href="#contacto">Contacto</a>
        </nav>
        <div class="nav-actions"><button class="btn btn-ghost" data-route="login">Iniciar sesion</button><button class="btn btn-primary" data-route="register">Comenzar ahora</button><button class="btn btn-secondary" data-route="app-direct">Ir a la app</button></div>
      </div>
    </header>
  `;
}

function renderLanding() {
  app.innerHTML = `
    <div class="public-shell premium-landing enterprise-landing">
      ${publicNav()}
      <main>
        <section class="ultra-hero" id="inicio">
          <div class="hero-bg" aria-hidden="true"><span class="particle p1"></span><span class="particle p2"></span><span class="particle p3"></span><span class="particle p4"></span><span class="orb orb-a"></span><span class="orb orb-b"></span><span class="orb orb-c"></span><span class="grid-glow"></span></div>
          <div class="hero-copy reveal-up"><span class="eyebrow live-pill"><span></span> Plataforma IA para cl&iacute;nicas dentales</span><h1>La plataforma que automatiza tu cl&iacute;nica dental.</h1><p>Convierte la atenci&oacute;n de tus pacientes en un proceso r&aacute;pido, inteligente y completamente automatizado.</p><div class="hero-badges"><span>Disponible 24/7</span><span>IA integrada</span><span>WhatsApp</span><span>Agenda automatica</span><span>US$9.99/mes</span></div><div class="hero-actions"><button class="btn btn-primary btn-hero" data-route="register">Comenzar prueba gratuita</button><button class="btn btn-secondary btn-hero" id="openDemoVideo">Ver demostracion</button><button class="btn btn-ghost btn-hero" data-route="app-direct">Ir a la app</button></div><div class="trust-strip"><span>Setup rapido</span><span>Sin contratos largos</span><span>Cancela cuando quieras</span></div></div>
          <div class="hero-command-center hero-plan-zone reveal-up delay-1">
            <div class="hero-price-card glass-panel moving-plan-card">
              <span class="popular-badge">Plan mensual</span>
              <div class="plan-live-row"><span class="live-indicator">IA activa</span><span>Sin contratos largos</span></div>
              <h2>DentalBot Pro</h2>
              <div class="hero-plan-price"><strong>US$9.99</strong><span>/ mes</span></div>
              <p>Automatiza citas, pacientes, recordatorios y respuestas con IA desde una sola plataforma.</p>
              <ul class="hero-plan-list">
                <li>Bot de atencion automatica 24/7</li>
                <li>Agenda de citas inteligente</li>
                <li>Panel de pacientes y dashboard</li>
                <li>Recordatorios automaticos</li>
              </ul>
              <button class="btn btn-primary btn-hero" type="button" id="openPaymentModal">Comenzar ahora</button>
            </div>
          </div>
        </section>
        <section class="stats-section reveal-up"><div class="stat-card"><strong data-count="3200">0</strong><span>Clinicas registradas</span></div><div class="stat-card"><strong data-count="1800000">0</strong><span>Mensajes enviados</span></div><div class="stat-card"><strong data-count="680000">0</strong><span>Pacientes atendidos</span></div><div class="stat-card"><strong data-count="999">0</strong><span>Disponibilidad</span></div></section>
        <section class="logos-section reveal-up"><p>Empresas que confian en nosotros</p><div class="logo-cloud"><span>SonrisaCare</span><span>OrthoNova</span><span>DentalHub</span><span>ClinicFlow</span><span>BrightSmile</span></div></section>
        <section class="showcase-section" id="caracteristicas"><div class="section-title centered-title reveal-up"><span class="eyebrow">Operacion inteligente</span><h2>Un dashboard que se siente como el centro de mando de tu cl&iacute;nica.</h2><p>Agenda, pacientes, mensajes, ingresos, notificaciones y decisiones asistidas por IA en una experiencia visual clara y moderna.</p></div><div class="dashboard-showcase glass-panel reveal-up delay-1"><aside><strong>DentalBot Pro</strong><button>Dashboard</button><button>Agenda</button><button>Pacientes</button><button>IA</button></aside><div class="show-main"><div class="show-header"><div><span>Buenos dias, Dra. Laura</span><h3>Tu cl&iacute;nica esta creciendo</h3></div><span class="live-indicator">IA activa</span></div><div class="show-cards"><div><span>Ingresos</span><strong>US$8,420</strong></div><div><span>Citas nuevas</span><strong>146</strong></div><div><span>Recordatorios</span><strong>2,918</strong></div></div><div class="show-lower"><div class="big-chart"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="notification-stack"><p>Maria confirmo su cita</p><p>Bot agendo ortodoncia</p><p>Recordatorio enviado</p></div></div></div></div></section>
        <section class="bot-demo-section reveal-up"><div class="demo-copy"><span class="eyebrow">Demo Bot IA</span><h2>Convierte conversaciones en citas reales.</h2><p>El paciente escribe, DentalBot entiende la intencion, ofrece horarios y confirma la reserva sin que tu equipo tenga que intervenir.</p><button class="btn btn-primary" data-route="bot-demo">Probar bot demo</button></div><div class="whatsapp-demo glass-panel"><div class="wa-head"><span></span><div><strong>DentalBot IA</strong><small>en linea</small></div></div><div class="wa-body"><p class="wa in">Hola.</p><p class="wa in">Necesito una limpieza dental.</p><p class="wa out">Con gusto. Cual es su nombre?</p><p class="wa in">Juan Perez</p><p class="wa out">Perfecto. Tengo disponible 10:00, 11:30 y 2:00.</p><p class="wa in">11:30</p><p class="wa out success">Excelente. Tu cita fue confirmada. Enviare recordatorio automaticamente.</p></div></div></section>
        <section class="benefits-matrix reveal-up"><div class="section-title centered-title"><span class="eyebrow">Caracteristicas premium</span><h2>Automatizacion completa para vender mas citas.</h2><p>Cada modulo fue pensado para reducir trabajo manual y aumentar la velocidad de respuesta.</p></div><div class="benefit-grid pro-grid">${landingBenefit('Agenda automatica', 'Reservas con horarios disponibles, estados y control diario, semanal o mensual.')}${landingBenefit('WhatsApp IA', 'Conversaciones naturales que capturan nombre, telefono, motivo y horario.')}${landingBenefit('Pacientes', 'Base centralizada con busqueda, historial y datos de contacto.')}${landingBenefit('Recordatorios', 'Mensajes automaticos para reducir ausencias y llamadas repetidas.')}${landingBenefit('Dashboard', 'Metricas claras para entender citas, pacientes, mensajes y actividad.')}${landingBenefit('Reportes', 'Vista ejecutiva para saber que servicios generan mas demanda.')}${landingBenefit('Cobros', 'Estructura preparada para Stripe o PayPal cuando actives pagos reales.')}${landingBenefit('Estadisticas', 'Indicadores visuales para tomar mejores decisiones cada semana.')}</div></section>

        <section class="testimonials-section reveal-up"><div class="section-title centered-title"><span class="eyebrow">Confianza</span><h2>Clinicas que ya atienden mas rapido.</h2></div><div class="testimonial-grid">${testimonial('Dra. Camila Torres', 'Directora Clinica Aurora', 'DentalBot Pro nos dio una imagen mucho mas profesional y redujo llamadas repetitivas desde la primera semana.')}${testimonial('Dr. Mateo Rivas', 'Ortodoncia Rivas', 'El bot agenda pacientes mientras estamos atendiendo. La experiencia se siente moderna y confiable.')}${testimonial('Lic. Sofia Vargas', 'Gerente Smile Center', 'Ahora tenemos control de agenda, pacientes y mensajes en un solo panel. Parece una plataforma enterprise.')}</div></section>
        <section class="faq-section" id="faq"><div class="section-title centered-title reveal-up"><span class="eyebrow">FAQ</span><h2>Preguntas frecuentes</h2></div><div class="faq-list reveal-up delay-1">${faqItem('Puedo usarlo sin integrar pagos reales?', 'Si. La app ya incluye estructura de pagos placeholder y puedes conectar Stripe o PayPal cuando tengas credenciales.')}${faqItem('El bot guarda citas automaticamente?', 'Si. El flujo demo captura datos, muestra horarios y guarda la cita en la base local.')}${faqItem('Funciona en celular?', 'Si. La landing, dashboard, agenda, pacientes y chat son responsive para movil, tablet y desktop.')}${faqItem('Puedo cancelar cuando quiera?', 'Si. No hay contratos largos. El plan mensual esta pensado para ser simple y flexible.')}</div></section>
      </main><footer class="premium-footer" id="contacto"><div><strong>DentalBot Pro</strong><p>Automatizacion inteligente para cl&iacute;nicas dentales modernas.</p></div><nav><strong>Producto</strong><a>Bot IA</a><a>Agenda</a><a>Pacientes</a><a>Dashboard</a></nav><nav><strong>Empresa</strong><a>Blog</a><a>Documentacion</a><a>Politicas</a><a>Planes</a></nav><nav><strong>Contacto</strong><a>WhatsApp</a><a>Correo</a><a>Soporte</a><a>Redes sociales</a></nav></footer><div class="payment-modal hidden" id="paymentModal"><form class="payment-box glass-panel" id="paymentForm"><button type="button" class="payment-close" id="closePaymentModal">Cerrar</button><span class="popular-badge">Plan mensual</span><h3>Activar DentalBot Pro</h3><div class="payment-price"><strong>US$9.99</strong><span>/ mes</span></div><p>Ingresa los datos de tu tarjeta para continuar. Este formulario esta preparado para conectar Stripe o PayPal; no guarda datos reales.</p><label class="field"><span>Nombre en la tarjeta</span><input name="cardName" required placeholder="Dra. Ana Perez"></label><label class="field"><span>Numero de tarjeta</span><input name="cardNumber" inputmode="numeric" maxlength="19" required placeholder="4242 4242 4242 4242"></label><div class="payment-row"><label class="field"><span>Vence</span><input name="cardExpiry" required placeholder="MM/AA"></label><label class="field"><span>CVC</span><input name="cardCvc" inputmode="numeric" maxlength="4" required placeholder="123"></label></div><button class="btn btn-primary" type="submit">Pagar US$9.99 y crear cuenta</button><small>Pago seguro. Cancela cuando quieras.</small></form></div><div class="video-modal hidden" id="demoVideoModal"><div class="video-box glass-panel"><button id="closeDemoVideo">Cerrar</button><div class="play-circle">Play</div><h3>Demostracion DentalBot Pro</h3><p>Video placeholder listo para conectar tu demo comercial.</p></div></div>
    </div>`;
  bindRoutes();
  landingInteractions();
}

function landingBenefit(title, description) {
  return '<article class="card feature-card pro-benefit"><div class="benefit-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4L19 6"></path></svg></div><h3>' + title + '</h3><p>' + description + '</p></article>';
}

function planCard(name, price, badge, items, featured) {
  return '<article class="plan-card ' + (featured ? 'featured-plan' : '') + '"><span class="popular-badge">' + badge + '</span><h3>' + name + '</h3><div class="price"><strong>' + price + '</strong><span>' + (price.indexOf('US') === 0 ? '/ mes' : '') + '</span></div><ul class="check-list">' + items.map(item => '<li>' + item + '</li>').join('') + '</ul><button class="btn ' + (featured ? 'btn-primary' : 'btn-secondary') + '" data-route="register">' + (featured ? 'Comenzar ahora' : 'Elegir plan') + '</button></article>';
}

function testimonial(name, role, quote) {
  const initials = name.split(' ').map(part => part[0]).slice(0, 2).join('');
  return '<article class="testimonial-card glass-panel"><div class="avatar">' + initials + '</div><div class="stars">*****</div><p>"' + quote + '"</p><strong>' + name + '</strong><span>' + role + '</span></article>';
}

function faqItem(question, answer) {
  return '<article class="faq-item"><button type="button"><span>' + question + '</span><b>+</b></button><p>' + answer + '</p></article>';
}

function landingInteractions() {
  document.querySelectorAll('.faq-item button').forEach(button => button.addEventListener('click', () => button.closest('.faq-item').classList.toggle('open')));
  const modal = document.querySelector('#demoVideoModal');
  document.querySelector('#openDemoVideo')?.addEventListener('click', () => modal?.classList.remove('hidden'));
  document.querySelector('#closeDemoVideo')?.addEventListener('click', () => modal?.classList.add('hidden'));
  modal?.addEventListener('click', event => { if (event.target === modal) modal.classList.add('hidden'); });
  const paymentModal = document.querySelector('#paymentModal');
  document.querySelector('#openPaymentModal')?.addEventListener('click', () => paymentModal?.classList.remove('hidden'));
  document.querySelector('#closePaymentModal')?.addEventListener('click', () => paymentModal?.classList.add('hidden'));
  paymentModal?.addEventListener('click', event => { if (event.target === paymentModal) paymentModal.classList.add('hidden'); });
  document.querySelector('#paymentForm')?.addEventListener('submit', event => {
    event.preventDefault();
    paymentModal?.classList.add('hidden');
    setRoute('register');
  });
  document.querySelectorAll('[data-count]').forEach(counter => {
    const target = Number(counter.dataset.count || 0);
    const duration = 1100;
    const start = performance.now();
    const format = value => target === 999 ? '99.9%' : target >= 1000000 ? '+1.8M' : target >= 100000 ? '+680K' : '+' + Math.round(value).toLocaleString('en-US');
    const tick = now => { const progress = Math.min((now - start) / duration, 1); counter.textContent = format(target * progress); if (progress < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}

function renderAuth(mode) {
  const isRegister = mode === "register";
  app.innerHTML = `
    <main class="auth-layout premium-login-layout">
      <div class="login-topbar-float">
        <button type="button" class="login-back-home" data-route="landing" aria-label="Volver al inicio"><span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"></path></svg></span> Volver al inicio</button>
        <div class="login-topbar-brand"><span class="brand-mark">DB</span><div><strong>DentalBot Pro</strong><small>Conoce todas las funciones de la plataforma</small></div></div>
      </div>
      <div class="login-loader" aria-hidden="true"><div><span class="brand-mark">DB</span><strong>DentalBot Pro</strong><i></i></div></div>
      <div class="login-particles" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      <section class="premium-login-card">
        <aside class="premium-login-side">
          <button class="brand premium-login-brand" data-route="landing"><span class="brand-mark">DB</span><span>DentalBot Pro</span></button>
          <span class="login-kicker">AI Dental Automation</span>
          <h1>${isRegister ? "Crea tu cl&iacute;nica digital" : "Accede a tu panel de control"}</h1>
          <p>Software premium para automatizar citas, pacientes y respuestas con inteligencia artificial.</p>
          <div class="premium-feature-list">
            <span><b>01</b>Agenda Inteligente</span>
            <span><b>02</b>Bot IA</span>
            <span><b>03</b>Pacientes</span>
            <span><b>04</b>Recordatorios</span>
            <span><b>05</b>Seguridad SSL</span>
          </div>
          <div class="premium-indicators">
            <span>Servidores activos</span><span>Seguridad SSL</span><span>Disponible 24/7</span>
          </div>
        </aside>
        <form class="premium-login-form" id="authForm">
          <div class="premium-form-head">
            <span class="login-kicker">Acceso seguro</span>
            <h2>${isRegister ? "Crear cuenta" : "Iniciar sesion"}</h2>
            <p>${isRegister ? "Configura tu cl&iacute;nica y empieza a automatizar hoy." : "Bienvenido de vuelta, odontologo."}</p>
          </div>
          <div id="formMessage"></div>
          <div class="form-grid premium-auth-grid">
            ${isRegister ? '<label class="field"><span>Nombre de la cl&iacute;nica</span><input name="clinicName" required placeholder="Clinica Dental Sonrisa"></label><label class="field"><span>Nombre del dentista</span><input name="dentistName" required placeholder="Dra. Ana Perez"></label><label class="field"><span>Telefono</span><input name="phone" required placeholder="809-000-0000"></label>' : ''}
            <label class="field ${isRegister ? '' : 'span-2'}"><span>Correo electronico</span><input type="email" name="email" required placeholder="correo@cl&iacute;nica.com" value="${isRegister ? '' : 'demo@dentalbotpro.com'}"></label>
            <label class="field ${isRegister ? '' : 'span-2'}"><span>Contrasena</span><input type="password" name="password" required minlength="6" placeholder="Minimo 6 caracteres" value="${isRegister ? '' : 'demo1234'}"></label>
          </div>
          <div class="login-options"><label><input type="checkbox" checked> Recordarme</label><a>Olvidaste tu contrasena?</a></div>
          <div class="hero-actions premium-login-actions">
            <button class="btn btn-primary" type="submit">${isRegister ? "Crear cuenta" : "Entrar al dashboard"}</button>
            <button class="btn btn-secondary" type="button" data-route="${isRegister ? 'login' : 'register'}">${isRegister ? "Ya tengo cuenta" : "Crear cuenta nueva"}</button>
          </div>
          <p class="social-proof">Mas de 3,000 cl&iacute;nicas confian en DentalBot Pro.</p>
          <small class="auth-copy">? 2026 DentalBot Pro. Todos los derechos reservados.</small>
        </form>
      </section>
    </main>`;
  bindRoutes();
  window.setTimeout(() => document.querySelector(".login-loader")?.classList.add("loaded"), 650);
  document.querySelector("#authForm").addEventListener("submit", async event => {
    event.preventDefault();
    const message = document.querySelector("#formMessage");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      if (isRegister) {
        const data = await api("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
        state.clinic = data.clinic;
        localStorage.setItem("dentalbot_clinic", JSON.stringify(data.clinic));
        setRoute("welcome");
      } else {
        const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });
        saveSession(data.token, data.clinic);
        await loadPrivateData();
        setRoute("dashboard");
      }
    } catch (error) {
      message.innerHTML = '<div class="alert error">' + error.message + '</div>';
    }
  });
}

function renderWelcome() {
  app.innerHTML = `<main class="auth-layout"><section class="card auth-form" style="max-width:720px"><div class="brand"><span class="brand-mark">DB</span><span>DentalBot Pro</span></div><h1>Bienvenido a DentalBot Pro</h1><p class="muted">Tu cl&iacute;nica ya esta lista para automatizar citas y responder pacientes.</p><div class="alert">Estado actual: pendiente de pago. La estructura de pago esta preparada para conectar Stripe o PayPal.</div><div class="hero-actions"><button class="btn btn-primary" data-route="login">Iniciar sesion</button><button class="btn btn-secondary" data-route="landing">Volver al sitio</button></div></section></main>`;
  bindRoutes();
}

async function loadPrivateData() {
  if (!state.token) return;
  const [dashboard, appointments, patients, bot] = await Promise.all([
    api("/api/dashboard"),
    api("/api/appointments"),
    api("/api/patients"),
    api("/api/bot/config")
  ]);
  state.dashboard = dashboard;
  state.appointments = appointments.appointments;
  state.patients = patients.patients;
  state.botConfig = bot.config;
}

function appShell(content, title = "Dashboard") {
  const clinicName = state.clinic?.clinicName || "Cl&iacute;nica dental";
  const dentistName = state.clinic?.dentistName || "Doctor";
  const initials = clinicName.replace(/&[^;]+;/g, "").split(" ").filter(Boolean).map(part => part[0]).slice(0, 2).join("").toUpperCase() || "DB";
  app.innerHTML = `
    <div class="app-shell premium-app-shell">
      <aside class="sidebar premium-sidebar">
        <div class="sidebar-clinic-card">
          <div class="clinic-avatar">${initials}</div>
          <div><strong>${clinicName}</strong><span>${dentistName}</span></div>
        </div>
        <div class="sidebar-plan-card">
          <span class="status confirmada">Bot IA activo</span>
          <strong>Plan US$9.99</strong>
          <small>DentalBot Pro v1.0</small>
        </div>
        <nav class="side-nav premium-side-nav">
          ${navButton("dashboard", `${icons.chart} Dashboard`)}
          ${navButton("agenda", `${icons.calendar} Citas`)}
          ${navButton("calendar", `${icons.calendar} Calendario`)}
          ${navButton("bot", `${icons.bot} Bot IA`)}
          ${navButton("services", `${icons.services} Servicios`)}
          ${navButton("settings", `${icons.settings} Configuracion`)}
        </nav>
        <div class="sidebar-system-card"><span></span><div><strong>Sincronizado</strong><small>Servidor activo</small></div></div>
        <button class="btn btn-ghost" style="width:100%;margin-top:18px" id="logoutBtn">Salir</button>
      </aside>
      <main class="main premium-main">
        <header class="app-header premium-app-header">
          <div class="header-title-block"><span class="header-kicker">DentalBot OS</span><h1>${title}</h1><div class="muted">${clinicName}</div></div>
          <label class="smart-search"><span>Buscar</span><input aria-label="Buscador inteligente" placeholder="Pacientes, citas, mensajes, IA"></label>
          <div class="premium-header-actions">
            <button class="icon-action" title="Actualizar">?</button>
            <button class="icon-action" title="Ayuda">?</button>
            <button class="icon-action notification-dot" title="Notificaciones">?</button>
            <span class="bot-online-pill">Bot IA Online</span>
            <button class="btn btn-green" id="paymentBtn">${icons.pay} Plan ${money(9.99)}</button>
            <div class="profile-chip"><span>${initials}</span><div><strong>${dentistName}</strong><small>Perfil</small></div></div>
          </div>
        </header>
        <section class="content premium-content">${content}</section>
      </main>
    </div>
  `;
  document.querySelectorAll("[data-route]").forEach(btn => btn.addEventListener("click", () => setRoute(btn.dataset.route)));
  document.querySelector("#logoutBtn").addEventListener("click", logout);
  document.querySelector("#paymentBtn").addEventListener("click", async () => {
    const data = await api("/api/payments/create-checkout", { method: "POST", body: "{}" });
    alert(`${data.paymentIntent.nextStep}
Intent local: ${data.paymentIntent.id}`);
  });
  bindAppointmentActions();
}

function navButton(route, label) {
  return `<button class="nav-btn ${state.route === route ? "active" : ""}" data-route="${route}">${label}</button>`;
}

function renderDashboard() {
  const data = state.dashboard || { metrics: {}, upcoming: [], planStatus: "pendiente" };
  const m = data.metrics;
  appShell(`
    <section class="dashboard-hero-panel">
      <div><span class="header-kicker">Resumen inteligente</span><h2>Tu clinica en tiempo real</h2><p>KPIs, actividad, agenda e IA en una sola vista ejecutiva.</p></div>
    </section>
    <div class="metric-grid premium-metric-grid">
      ${metric("Total de pacientes", m.totalPatients || 0)}
      ${metric("Citas de hoy", m.todayAppointments || 0)}
      ${metric("Citas pendientes", m.pendingAppointments || 0)}
      ${metric("Mensajes recibidos", m.messagesReceived || 0)}
    </div>
    <div class="dashboard-insight-grid">
      <article class="card panel premium-chart-panel">
        <div class="panel-head"><h2>Rendimiento semanal</h2><span class="status confirmada">Sincronizado</span></div>
        <div class="dashboard-chart weekly-chart"><div><i></i><span>Lun</span></div><div><i></i><span>Mar</span></div><div><i></i><span>Mie</span></div><div><i></i><span>Jue</span></div><div><i></i><span>Vie</span></div><div><i></i><span>Sab</span></div></div>
      </article>
    </div>
    <div class="dashboard-grid premium-dashboard-grid">
      <article class="card panel">
        <div class="panel-head"><h2>Proximas citas</h2><button class="btn btn-secondary" data-route="agenda">Ver agenda</button></div>
        ${appointmentsTable(data.upcoming || [])}
      </article>
    </div>
  `);
}

function metric(label, value) {
  return `<article class="card metric"><span>${label}</span><strong>${value}</strong></article>`;
}

function appointmentsTable(appointments) {
  if (!appointments.length) return `<div class="alert">No hay citas para mostrar.</div>`;
  return `
    <table class="table">
      <thead><tr><th>Paciente</th><th>Fecha</th><th>Hora</th><th>Motivo</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${appointments.map(apt => `
          <tr>
            <td><strong>${apt.patientName}</strong><span class="phone-field">${apt.phone}</span></td>
            <td>${apt.date}</td>
            <td>${apt.time}</td>
            <td>${apt.reason}</td>
            <td><span class="status ${apt.status}">${apt.status}</span></td>
            <td><div class="row-actions"><button class="btn btn-green btn-complete" data-complete-apt="${apt.id}">Finalizar</button><button class="btn btn-secondary" data-edit-apt="${apt.id}">${icons.edit}</button></div></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function bindAppointmentActions() {
  document.querySelectorAll("[data-complete-apt]").forEach(btn => btn.addEventListener("click", async () => {
    const appointmentId = btn.dataset.completeApt;
    const row = btn.closest("tr");
    const patientName = row?.querySelector("td strong")?.textContent?.trim() || "este paciente";
    const accepted = await confirmAppointmentCompletion(patientName);
    if (!accepted) return;
    btn.disabled = true;
    btn.textContent = "Finalizando...";
    try {
      await api(`/api/appointments/${appointmentId}`, { method: "PUT", body: JSON.stringify({ status: "completada" }) });
      await loadPrivateData();
      if (state.route === "agenda") renderAgenda();
      else renderDashboard();
    } catch (error) {
      showToast(error.message, "error");
      btn.disabled = false;
      btn.textContent = "Finalizar";
    }
  }));
}

function confirmAppointmentCompletion(patientName) {
  return new Promise(resolve => {
    const modal = html(`
      <div class="confirm-modal-backdrop">
        <section class="confirm-modal glass-panel">
          <div class="confirm-icon">?</div>
          <h3>Finalizar cita</h3>
          <p>Seguro que termino la cita con <strong>${patientName}</strong>?</p>
          <div class="confirm-actions">
            <button class="btn btn-ghost" type="button" data-confirm="no">Cancelar</button>
            <button class="btn btn-green" type="button" data-confirm="yes">Si, finalizar</button>
          </div>
        </section>
      </div>
    `);
    document.body.appendChild(modal);
    modal.querySelector('[data-confirm="no"]').addEventListener('click', () => { modal.remove(); resolve(false); });
    modal.querySelector('[data-confirm="yes"]').addEventListener('click', () => { modal.remove(); resolve(true); });
    modal.addEventListener('click', event => { if (event.target === modal) { modal.remove(); resolve(false); } });
  });
}

function showToast(message, type = "info") {
  const toast = html(`<div class="toast toast-${type}">${message}</div>`);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function renderAgenda() {
  const filtered = filterAppointmentsByView(state.appointments);
  appShell(`
    <div class="toolbar">
      <div class="calendar-tabs">
        <button class="${state.calendarView === "daily" ? "active" : ""}" data-view="daily">Diario</button>
        <button class="${state.calendarView === "weekly" ? "active" : ""}" data-view="weekly">Semanal</button>
        <button class="${state.calendarView === "monthly" ? "active" : ""}" data-view="monthly">Mensual</button>
      </div>
      <button class="btn btn-primary" id="newAppointment">${icons.calendar} Crear cita</button>
    </div>
    <article class="card panel">
      <div class="panel-head"><h2>Agenda ${state.calendarView === "daily" ? "diaria" : state.calendarView === "weekly" ? "semanal" : "mensual"}</h2><span class="muted">${filtered.length} citas visibles</span></div>
      ${appointmentsTable(filtered)}
    </article>
  `, "Agenda de citas");
  document.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => {
    state.calendarView = btn.dataset.view;
    renderAgenda();
  }));
  document.querySelector("#newAppointment").addEventListener("click", () => openAppointmentModal());
  document.querySelectorAll("[data-edit-apt]").forEach(btn => btn.addEventListener("click", () => {
    const apt = state.appointments.find(item => item.id === btn.dataset.editApt);
    openAppointmentModal(apt);
  }));
}

function filterAppointmentsByView(appointments) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const end = new Date(now);
  if (state.calendarView === "daily") return appointments.filter(item => item.date === today && item.status === "confirmada");
  if (state.calendarView === "weekly") end.setDate(now.getDate() + 7);
  else end.setMonth(now.getMonth() + 1);
  return appointments.filter(item => item.date >= today && item.date <= end.toISOString().slice(0, 10) && item.status === "confirmada");
}

function openAppointmentModal(appointment = null) {
  const modal = html(`
    <div class="modal-backdrop">
      <form class="card modal" id="appointmentForm">
        <div class="panel-head"><h2>${appointment ? "Editar cita" : "Crear cita"}</h2><button type="button" class="btn btn-ghost" id="closeModal">Cerrar</button></div>
        <div id="modalMsg"></div>
        <div class="form-grid">
          <label class="field"><span>Nombre paciente</span><input name="patientName" required value="${appointment?.patientName || ""}"></label>
          <label class="field"><span>Telefono</span><input name="phone" required value="${appointment?.phone || ""}"></label>
          <label class="field"><span>Fecha</span><input type="date" name="date" required value="${appointment?.date || nextBusinessDate()}"></label>
          <label class="field"><span>Hora</span><input type="time" name="time" required value="${appointment?.time || "09:00"}"></label>
          <label class="field"><span>Motivo</span><input name="reason" required value="${appointment?.reason || "Consulta general"}"></label>
          <label class="field"><span>Estado</span><select name="status">
            ${["pendiente", "confirmada", "cancelada", "completada"].map(status => `<option ${appointment?.status === status ? "selected" : ""}>${status}</option>`).join("")}
          </select></label>
        </div>
        <div class="hero-actions" style="margin-top:18px"><button class="btn btn-primary">Guardar cita</button></div>
      </form>
    </div>
  `);
  document.body.appendChild(modal);
  modal.querySelector("#closeModal").addEventListener("click", () => modal.remove());
  modal.querySelector("#appointmentForm").addEventListener("submit", async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      if (appointment) await api(`/api/appointments/${appointment.id}`, { method: "PUT", body: JSON.stringify(payload) });
      else await api("/api/appointments", { method: "POST", body: JSON.stringify(payload) });
      await loadPrivateData();
      modal.remove();
      renderAgenda();
    } catch (error) {
      modal.querySelector("#modalMsg").innerHTML = `<div class="alert error">${error.message}</div>`;
    }
  });
}

function renderPatients() {
  appShell(`
    <div class="toolbar">
      <input class="field-input" id="patientSearch" placeholder="Buscar paciente por nombre o tel&eacute;fono" style="border:1px solid var(--line);border-radius:8px;padding:12px;min-width:min(380px,100%)">
      <button class="btn btn-primary" id="newPatient">${icons.patients} Crear paciente</button>
    </div>
    <article class="card panel">
      <div class="panel-head"><h2>Pacientes</h2><span class="muted">${state.patients.length} registrados</span></div>
      <div id="patientsTable">${patientsTable(state.patients)}</div>
    </article>
  `, "Pacientes");
  document.querySelector("#patientSearch").addEventListener("input", event => {
    const q = event.target.value.toLowerCase();
    const list = state.patients.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q));
    document.querySelector("#patientsTable").innerHTML = patientsTable(list);
    bindPatientEdit();
  });
  document.querySelector("#newPatient").addEventListener("click", () => openPatientModal());
  bindPatientEdit();
}

function patientsTable(patients) {
  if (!patients.length) return `<div class="alert">No hay pacientes para mostrar.</div>`;
  return `
    <table class="table">
      <thead><tr><th>Paciente</th><th>Contacto</th><th>Historial</th><th></th></tr></thead>
      <tbody>
        ${patients.map(patient => {
          const count = state.appointments.filter(apt => apt.patientId === patient.id || apt.phone === patient.phone).length;
          return `<tr>
            <td><strong>${patient.name}</strong><span class="phone-field">${patient.phone}</span></td>
            <td><span class="muted">${patient.email || "Sin correo"}</span></td>
            <td>${count} citas</td>
            <td><button class="btn btn-secondary" data-edit-patient="${patient.id}">${icons.edit}</button></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  `;
}

function bindPatientEdit() {
  document.querySelectorAll("[data-edit-patient]").forEach(btn => btn.addEventListener("click", () => {
    openPatientModal(state.patients.find(item => item.id === btn.dataset.editPatient));
  }));
}

function openPatientModal(patient = null) {
  const modal = html(`
    <div class="modal-backdrop">
      <form class="card modal" id="patientForm">
        <div class="panel-head"><h2>${patient ? "Editar paciente" : "Crear paciente"}</h2><button type="button" class="btn btn-ghost" id="closeModal">Cerrar</button></div>
        <div class="form-grid">
          <label class="field"><span>Nombre</span><input name="name" required value="${patient?.name || ""}"></label>
          <label class="field"><span>Telefono</span><input name="phone" required value="${patient?.phone || ""}"></label>
          <label class="field span-2"><span>Correo</span><input type="email" name="email" value="${patient?.email || ""}"></label>
          <label class="field span-2"><span>Notas</span><textarea name="notes">${patient?.notes || ""}</textarea></label>
        </div>
        <div class="hero-actions" style="margin-top:18px"><button class="btn btn-primary">Guardar paciente</button></div>
      </form>
    </div>
  `);
  document.body.appendChild(modal);
  modal.querySelector("#closeModal").addEventListener("click", () => modal.remove());
  modal.querySelector("#patientForm").addEventListener("submit", async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (patient) await api(`/api/patients/${patient.id}`, { method: "PUT", body: JSON.stringify(payload) });
    else await api("/api/patients", { method: "POST", body: JSON.stringify(payload) });
    await loadPrivateData();
    modal.remove();
    renderPatients();
  });
}

function getDentalServiceCategories() {
  return [
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
    { title: "OTROS SERVICIOS", services: ["Bruxismo", "Ferula de descarga", "Tratamiento ATM", "Sensibilidad dental", "Halitosis", "Urgencia dental", "Emergencia dental", "Control postoperatorio", "Seguimiento de tratamiento", "Consulta virtual"] }
  ];
}

function getDentalServiceCatalog() {
  return getDentalServiceCategories().flatMap(category => category.services);
}

function getBotServiceOptions(config = state.botConfig || {}) {
  return Array.from(new Set([...(config.services || []), ...getDentalServiceCatalog()]));
}
const AVAILABILITY_KEY = "dentalbot_availability_settings";

function defaultAvailabilitySettings(config = state.botConfig || {}) {
  return {
    workStart: config.workStart || "08:00",
    workEnd: config.workEnd || "17:00",
    appointmentDuration: Number(config.appointmentDuration || 30),
    workDays: [1, 2, 3, 4, 5, 6],
    blockedDays: [],
    blockedSlots: {}
  };
}

function getAvailabilitySettings(config = state.botConfig || {}) {
  try {
    const saved = JSON.parse(localStorage.getItem(AVAILABILITY_KEY) || "{}");
    const defaults = defaultAvailabilitySettings(config);
    return {
      ...defaults,
      ...saved,
      appointmentDuration: Number(saved.appointmentDuration || defaults.appointmentDuration),
      workDays: Array.isArray(saved.workDays) ? saved.workDays.map(Number) : defaults.workDays,
      blockedDays: Array.isArray(saved.blockedDays) ? saved.blockedDays : [],
      blockedSlots: saved.blockedSlots || {}
    };
  } catch {
    return defaultAvailabilitySettings(config);
  }
}

function saveAvailabilitySettings(settings) {
  localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(settings));
}

function toMinutes(time) {
  const [hours, minutes] = String(time || "00:00").split(":").map(Number);
  return (hours * 60) + (minutes || 0);
}

function fromMinutes(total) {
  const hours = String(Math.floor(total / 60)).padStart(2, "0");
  const minutes = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function displayTime(time) {
  const [hours, minutes] = String(time).split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = ((hours + 11) % 12) + 1;
  return `${hour12}:${String(minutes || 0).padStart(2, "0")} ${suffix}`;
}

function dateFromISO(date) {
  return new Date(`${date}T00:00:00`);
}

function todayLocalISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addDaysISO(date, amount) {
  const next = dateFromISO(date);
  next.setDate(next.getDate() + amount);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

function isAppointmentBlocking(appointment) {
  return !["cancelada", "completada"].includes(appointment.status);
}

function getDayAvailability(date, config = state.botConfig || {}) {
  const settings = getAvailabilitySettings(config);
  const day = dateFromISO(date).getDay();
  const blockedDay = settings.blockedDays.includes(date);
  const workingDay = settings.workDays.includes(day);
  if (!workingDay || blockedDay) {
    return { date, status: "closed", free: [], occupied: [], slots: [] };
  }
  const taken = new Set(
    state.appointments
      .filter(item => item.date === date && isAppointmentBlocking(item))
      .map(item => item.time)
  );
  (settings.blockedSlots[date] || []).forEach(time => taken.add(time));
  const start = toMinutes(settings.workStart);
  const end = toMinutes(settings.workEnd);
  const duration = Number(settings.appointmentDuration || 30);
  const slots = [];
  for (let cursor = start; cursor + duration <= end; cursor += duration) {
    const time = fromMinutes(cursor);
    const busy = taken.has(time);
    slots.push({ time, busy });
  }
  const free = slots.filter(slot => !slot.busy).map(slot => slot.time);
  const occupied = slots.filter(slot => slot.busy).map(slot => slot.time);
  const status = free.length === 0 ? "busy" : occupied.length ? "partial" : "free";
  return { date, status, free, occupied, slots };
}

function findSuggestedDates(fromDate = todayLocalISO(), limit = 5) {
  const dates = [];
  for (let index = 0; index < 45 && dates.length < limit; index += 1) {
    const date = addDaysISO(fromDate, index);
    const availability = getDayAvailability(date);
    if (availability.free.length) dates.push(date);
  }
  return dates;
}

function normalizeDateInput(text) {
  const clean = String(text || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  return null;
}

function nextFreeSlot(date, preferredTime) {
  const availability = getDayAvailability(date);
  if (!preferredTime) return availability.free[0] || null;
  const preferred = toMinutes(preferredTime);
  return availability.free.find(slot => toMinutes(slot) >= preferred) || availability.free[0] || null;
}

function chatNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function addChatMessage(from, text, status = "recibido") {
  state.chat.messages.push({ from, text, time: chatNow(), status });
}

function renderChatMessage(msg) {
  const isUser = msg.from === "user";
  const avatar = isUser ? "P" : "IA";
  const status = isUser ? (msg.status || "leido") : (msg.status || "recibido");
  return `<div class="chat-row ${isUser ? "user" : "bot"}"><div class="chat-avatar">${avatar}</div><div class="message-stack"><div class="bubble ${isUser ? "user" : "bot"}">${msg.text}</div><div class="message-meta"><span>${msg.time || chatNow()}</span><span>${status}</span></div></div></div>`;
}

function chatProgress() {
  const steps = ["Nombre", "Telefono", "Servicio", "Fecha", "Hora", "Confirmacion"];
  const map = { name: 0, phone: 1, reason: 2, date: 3, slot: 4, confirm: 5, done: 6 };
  const current = map[state.chat.step] || 0;
  return `<div class="flow-progress">${steps.map((step, index) => `<div class="flow-step ${index < current ? "done" : index === current ? "active" : ""}"><b>${index + 1}</b><span>${step}</span></div>`).join("")}</div>`;
}

function chatSummary() {
  const data = state.chat.data || {};
  return `<div class="chat-summary"><h4>Resumen de reserva</h4><p><span>Paciente</span><strong>${data.patientName || "Pendiente"}</strong></p><p><span>Servicio</span><strong>${data.reason || "Pendiente"}</strong></p><p><span>Fecha</span><strong>${data.date || "Pendiente"}</strong></p><p><span>Hora</span><strong>${data.time ? displayTime(data.time) : "Pendiente"}</strong></p></div>`;
}

function quickActionButtons() {
  return `<div class="quick-action-row"><button class="btn btn-secondary" data-chat-action="restart">Agendar cita</button><button class="btn btn-secondary" data-chat-action="show-slots">Ver horarios</button><button class="btn btn-secondary" data-chat-action="change-date">Cambiar fecha</button><button class="btn btn-secondary" data-chat-action="cancel">Cancelar</button><button class="btn btn-secondary" data-chat-action="human">Hablar con humano</button></div>`;
}

function renderAvailabilityCalendar(config = state.botConfig || {}) {
  const settings = getAvailabilitySettings(config);
  const selected = state.availabilitySelectedDate || todayLocalISO();
  const selectedDate = dateFromISO(selected);
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const offset = first.getDay();
  const cells = [];
  for (let index = 0; index < offset; index += 1) cells.push(`<button type="button" class="availability-day empty"></button>`);
  for (let day = 1; day <= last.getDate(); day += 1) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const availability = getDayAvailability(date, config);
    const today = date === todayLocalISO();
    cells.push(`<button type="button" class="availability-day ${availability.status} ${date === selected ? "selected" : ""} ${today ? "today" : ""}" data-availability-date="${date}"><strong>${day}</strong><span>${availability.status === "free" ? "Libre" : availability.status === "partial" ? "Parcial" : availability.status === "busy" ? "Ocupado" : "Cerrado"}</span></button>`);
  }
  const selectedAvailability = getDayAvailability(selected, config);
  const monthName = selectedDate.toLocaleDateString("es-DO", { month: "long", year: "numeric" });
  const days = [{ n: 1, label: "Lunes" }, { n: 2, label: "Martes" }, { n: 3, label: "Miercoles" }, { n: 4, label: "Jueves" }, { n: 5, label: "Viernes" }, { n: 6, label: "Sabado" }, { n: 0, label: "Domingo" }];
  return `
    <section class="card panel availability-panel">
      <div class="panel-head"><div><h2>Calendario de disponibilidad</h2><p class="muted">Visualiza dias libres, ocupados y horarios que el Bot IA puede ofrecer.</p></div><span class="status ${selectedAvailability.status === "free" ? "confirmada" : selectedAvailability.status === "partial" ? "pendiente" : "cancelada"}">${selectedAvailability.status === "free" ? "Libre" : selectedAvailability.status === "partial" ? "Parcial" : selectedAvailability.status === "busy" ? "Ocupado" : "Sin horario"}</span></div>
      <div class="availability-layout">
        <div>
          <div class="availability-toolbar"><button type="button" class="btn btn-secondary" id="availabilityPrev">Anterior</button><strong>${monthName}</strong><button type="button" class="btn btn-secondary" id="availabilityNext">Siguiente</button></div>
          <div class="availability-weekdays"><span>Dom</span><span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span></div>
          <div class="availability-month">${cells.join("")}</div>
        </div>
        <aside class="availability-detail">
          <h3>${selected}</h3>
          <p class="muted">Estado: ${selectedAvailability.status === "free" ? "Libre" : selectedAvailability.status === "partial" ? "Parcialmente ocupado" : selectedAvailability.status === "busy" ? "Ocupado" : "Sin horario laboral"}</p>
          <div class="availability-slots">${selectedAvailability.slots.length ? selectedAvailability.slots.map(slot => `<button type="button" class="availability-slot ${slot.busy ? "busy" : "free"}" data-toggle-slot="${slot.time}"><span>${displayTime(slot.time)}</span><strong>${slot.busy ? "Ocupado" : "Libre"}</strong></button>`).join("") : `<div class="alert">Este dia no tiene horario laboral.</div>`}</div>
          <div class="availability-actions"><button type="button" class="btn btn-secondary" id="blockSelectedDay">Bloquear dia completo</button><button type="button" class="btn btn-secondary" id="releaseSelectedDay">Liberar dia completo</button></div>
        </aside>
      </div>
      <div class="availability-config-grid">
        <label class="field"><span>Hora inicio laboral</span><input type="time" id="availabilityStart" value="${settings.workStart}"></label>
        <label class="field"><span>Hora fin laboral</span><input type="time" id="availabilityEnd" value="${settings.workEnd}"></label>
        <label class="field"><span>Duracion de cita</span><input type="number" id="availabilityDuration" min="10" step="5" value="${settings.appointmentDuration}"></label>
        <div class="workday-picker">${days.map(day => `<label class="chip"><input type="checkbox" data-workday="${day.n}" ${settings.workDays.includes(day.n) ? "checked" : ""}> ${day.label}</label>`).join("")}</div>
      </div>
    </section>`;
}

function renderCalendarPage() {
  const config = state.botConfig || {};
  appShell(`
    ${renderAvailabilityCalendar(config)}
  `, "Calendario");
  bindAvailabilityCalendar();
}

function refreshAvailabilityView() {
  if (state.route === "calendar") renderCalendarPage();
  else renderSettings();
}

function servicesCatalogMarkup(config = state.botConfig || {}) {
  const serviceCategories = getDentalServiceCategories();
  const catalogServices = getDentalServiceCatalog();
  const customServices = (config.services || []).filter(service => !catalogServices.includes(service));
  return `
    <h3>Servicios disponibles</h3>
    <div class="add-service-row"><input id="newServiceInput" placeholder="Agregar nuevo servicio"><button type="button" class="btn btn-secondary" id="addServiceBtn">Agregar servicio</button></div>
    <div class="services-catalog" id="servicesGrid">
      ${serviceCategories.map(category => `<section class="service-category"><h4>${category.title}</h4><div class="service-grid">${category.services.map(service => `<label class="chip"><input type="checkbox" name="services" value="${service}" ${(config.services || []).includes(service) ? "checked" : ""}> ${service}</label>`).join("")}</div></section>`).join("")}
      ${customServices.length ? `<section class="service-category"><h4>SERVICIOS PERSONALIZADOS</h4><div class="service-grid" id="customServicesGrid">${customServices.map(service => `<label class="chip"><input type="checkbox" name="services" value="${service}" checked> ${service}</label>`).join("")}</div></section>` : ""}
    </div>`;
}

function bindServiceCatalog(formSelector = "#servicesForm") {
  document.querySelector("#addServiceBtn")?.addEventListener("click", () => {
    const input = document.querySelector("#newServiceInput");
    const service = input.value.trim();
    if (!service) return;
    const exists = Array.from(document.querySelectorAll('input[name="services"]')).some(item => item.value.toLowerCase() === service.toLowerCase());
    if (exists) { input.value = ""; return; }
    const label = document.createElement("label");
    label.className = "chip";
    label.innerHTML = '<input type="checkbox" name="services" value="' + service.replace(/"/g, '&quot;') + '" checked> ' + service;
    let customGrid = document.querySelector("#customServicesGrid");
    if (!customGrid) {
      const section = document.createElement("section");
      section.className = "service-category";
      section.innerHTML = `<h4>SERVICIOS PERSONALIZADOS</h4><div class="service-grid" id="customServicesGrid"></div>`;
      document.querySelector("#servicesGrid").appendChild(section);
      customGrid = section.querySelector("#customServicesGrid");
    }
    customGrid.appendChild(label);
    input.value = "";
  });
  document.querySelector(formSelector)?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = await api("/api/bot/config", { method: "PUT", body: JSON.stringify({ services: form.getAll("services") }) });
    state.botConfig = data.config;
    const msg = document.querySelector("#servicesMsg") || document.querySelector("#configMsg");
    if (msg) msg.innerHTML = `<div class="alert">Servicios guardados correctamente.</div>`;
  });
}

function renderServicesPage() {
  const config = state.botConfig || {};
  appShell(`
    <form class="card panel" id="servicesForm">
      <div class="panel-head"><div><h2>Servicios</h2><p class="muted">Activa los servicios que el Bot IA puede ofrecer al agendar citas.</p></div><span class="status confirmada">Catalogo IA</span></div>
      <div id="servicesMsg"></div>
      ${servicesCatalogMarkup(config)}
      <div class="hero-actions" style="margin-top:18px"><button class="btn btn-primary">Guardar servicios</button><button type="button" class="btn btn-secondary" data-route="bot">Probar bot</button></div>
    </form>
  `, "Servicios");
  bindServiceCatalog("#servicesForm");
}

function renderReportsPage() {
  const total = state.appointments.length;
  const confirmed = state.appointments.filter(item => item.status === "confirmada").length;
  const pending = state.appointments.filter(item => item.status === "pendiente").length;
  const completed = state.appointments.filter(item => item.status === "completada").length;
  const botAppointments = state.appointments.filter(item => item.source === "bot").length;
  appShell(`
    <section class="dashboard-hero-panel"><div><span class="header-kicker">Reportes</span><h2>Rendimiento de la clinica</h2><p>Resumen operativo de citas, automatizacion y pacientes atendidos.</p></div></section>
    <div class="metric-grid premium-metric-grid">
      ${metric("Total de citas", total)}
      ${metric("Confirmadas", confirmed)}
      ${metric("Pendientes", pending)}
      ${metric("Completadas", completed)}
      ${metric("Citas por Bot IA", botAppointments)}
    </div>
    <article class="card panel premium-chart-panel"><div class="panel-head"><h2>Actividad semanal</h2><span class="status confirmada">Actualizado</span></div><div class="dashboard-chart weekly-chart"><div><i></i><span>Lun</span></div><div><i></i><span>Mar</span></div><div><i></i><span>Mie</span></div><div><i></i><span>Jue</span></div><div><i></i><span>Vie</span></div><div><i></i><span>Sab</span></div></div></article>
  `, "Reportes");
}function renderSettings() {
  const config = state.botConfig || {};
  const serviceCategories = getDentalServiceCategories();
  const catalogServices = getDentalServiceCatalog();
  const customServices = (config.services || []).filter(service => !catalogServices.includes(service));
  appShell(`
    <form class="card panel" id="botConfigForm">
      <div class="panel-head"><h2>Configuracion del bot</h2><span class="status confirmada">Bot activo</span></div>
      <div id="configMsg"></div>
      <div class="form-grid">
        <label class="field"><span>Nombre del bot</span><input name="botName" value="${config.botName || "DentalBot"}" required></label>
        <label class="field"><span>Duracion de citas</span><input type="number" name="appointmentDuration" min="10" step="5" value="${config.appointmentDuration || 30}" required></label>
        <label class="field"><span>Horario inicio</span><input type="time" name="workStart" value="${config.workStart || "08:00"}" required></label>
        <label class="field"><span>Horario fin</span><input type="time" name="workEnd" value="${config.workEnd || "17:00"}" required></label>
        <label class="field span-2"><span>Mensaje de bienvenida</span><textarea name="welcomeMessage">${config.welcomeMessage || ""}</textarea></label>
        <label class="field span-2"><span>Mensaje fuera de horario</span><textarea name="afterHoursMessage">${config.afterHoursMessage || ""}</textarea></label>
      </div>
      <h3>Servicios disponibles</h3>
      <div class="add-service-row"><input id="newServiceInput" placeholder="Agregar nuevo servicio"><button type="button" class="btn btn-secondary" id="addServiceBtn">Agregar servicio</button></div>
      <div class="services-catalog" id="servicesGrid">
        ${serviceCategories.map(category => `<section class="service-category"><h4>${category.title}</h4><div class="service-grid">${category.services.map(service => `<label class="chip"><input type="checkbox" name="services" value="${service}" ${(config.services || []).includes(service) ? "checked" : ""}> ${service}</label>`).join("")}</div></section>`).join("")}
        ${customServices.length ? `<section class="service-category"><h4>SERVICIOS PERSONALIZADOS</h4><div class="service-grid" id="customServicesGrid">${customServices.map(service => `<label class="chip"><input type="checkbox" name="services" value="${service}" checked> ${service}</label>`).join("")}</div></section>` : ""}
      </div>
      <div class="hero-actions" style="margin-top:18px"><button class="btn btn-primary">Guardar configuracion</button><button type="button" class="btn btn-secondary" data-route="bot">Probar bot</button></div>
    </form>
  `, "Configuracion");
  document.querySelector("#addServiceBtn").addEventListener("click", () => {
    const input = document.querySelector("#newServiceInput");
    const service = input.value.trim();
    if (!service) return;
    const exists = Array.from(document.querySelectorAll('input[name="services"]')).some(item => item.value.toLowerCase() === service.toLowerCase());
    if (exists) {
      input.value = "";
      return;
    }
    const label = document.createElement("label");
    label.className = "chip";
    label.innerHTML = '<input type="checkbox" name="services" value="' + service.replace(/"/g, '&quot;') + '" checked> ' + service;
    let customGrid = document.querySelector("#customServicesGrid");
    if (!customGrid) {
      const section = document.createElement("section");
      section.className = "service-category";
      section.innerHTML = `<h4>SERVICIOS PERSONALIZADOS</h4><div class="service-grid" id="customServicesGrid"></div>`;
      document.querySelector("#servicesGrid").appendChild(section);
      customGrid = section.querySelector("#customServicesGrid");
    }
    customGrid.appendChild(label);
    input.value = "";
  });
  document.querySelector("#botConfigForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.services = form.getAll("services");
    const data = await api("/api/bot/config", { method: "PUT", body: JSON.stringify(payload) });
    state.botConfig = data.config;
    document.querySelector("#configMsg").innerHTML = `<div class="alert">Configuracion guardada correctamente.</div>`;
  });
}

function bindAvailabilityCalendar() {
  const panel = document.querySelector(".availability-panel");
  if (!panel) return;
  const settings = getAvailabilitySettings();
  const persist = () => {
    settings.workStart = document.querySelector("#availabilityStart")?.value || settings.workStart;
    settings.workEnd = document.querySelector("#availabilityEnd")?.value || settings.workEnd;
    settings.appointmentDuration = Number(document.querySelector("#availabilityDuration")?.value || settings.appointmentDuration);
    settings.workDays = Array.from(document.querySelectorAll("[data-workday]:checked")).map(input => Number(input.dataset.workday));
    saveAvailabilitySettings(settings);
  };
  panel.querySelectorAll("#availabilityStart, #availabilityEnd, #availabilityDuration, [data-workday]").forEach(input => {
    input.addEventListener("change", () => {
      persist();
      refreshAvailabilityView();
    });
  });
  panel.querySelectorAll("[data-availability-date]").forEach(btn => btn.addEventListener("click", () => {
    state.availabilitySelectedDate = btn.dataset.availabilityDate;
    refreshAvailabilityView();
  }));
  document.querySelector("#availabilityPrev")?.addEventListener("click", () => {
    const current = dateFromISO(state.availabilitySelectedDate || todayLocalISO());
    current.setMonth(current.getMonth() - 1);
    state.availabilitySelectedDate = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(Math.min(current.getDate(), 28)).padStart(2, "0")}`;
    refreshAvailabilityView();
  });
  document.querySelector("#availabilityNext")?.addEventListener("click", () => {
    const current = dateFromISO(state.availabilitySelectedDate || todayLocalISO());
    current.setMonth(current.getMonth() + 1);
    state.availabilitySelectedDate = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(Math.min(current.getDate(), 28)).padStart(2, "0")}`;
    refreshAvailabilityView();
  });
  document.querySelector("#blockSelectedDay")?.addEventListener("click", () => {
    const date = state.availabilitySelectedDate || todayLocalISO();
    settings.blockedDays = Array.from(new Set([...(settings.blockedDays || []), date]));
    saveAvailabilitySettings(settings);
    refreshAvailabilityView();
  });
  document.querySelector("#releaseSelectedDay")?.addEventListener("click", () => {
    const date = state.availabilitySelectedDate || todayLocalISO();
    settings.blockedDays = (settings.blockedDays || []).filter(item => item !== date);
    delete settings.blockedSlots[date];
    saveAvailabilitySettings(settings);
    refreshAvailabilityView();
  });
  panel.querySelectorAll("[data-toggle-slot]").forEach(btn => btn.addEventListener("click", () => {
    const date = state.availabilitySelectedDate || todayLocalISO();
    const time = btn.dataset.toggleSlot;
    settings.blockedSlots[date] = settings.blockedSlots[date] || [];
    if (settings.blockedSlots[date].includes(time)) settings.blockedSlots[date] = settings.blockedSlots[date].filter(item => item !== time);
    else settings.blockedSlots[date].push(time);
    saveAvailabilitySettings(settings);
    refreshAvailabilityView();
  }));
}
function resetChat() {
  const config = state.botConfig || {};
  state.chat = {
    step: "name",
    data: { clinicId: state.clinic?.id || "clinic_demo", date: nextBusinessDate() },
    messages: [
      { from: "bot", text: config.welcomeMessage || "Hola, soy DentalBot. Te ayudo a reservar tu cita dental." },
      { from: "bot", text: "Para empezar, dime tu nombre completo." }
    ]
  };
}

function renderBot(publicDemo = false) {
  if (!state.chat.messages.length) resetChat();
  const title = publicDemo ? "Bot demo para pacientes" : "Bot para pacientes";
  const content = `
    <div class="chat-layout premium-bot-layout">
      <section class="card chat-phone premium-chat-phone">
        <div class="chat-header premium-chat-header"><div class="chat-avatar bot-avatar">IA</div><div><strong>${state.botConfig?.botName || "DentiBot"}</strong><span>Asistente inteligente de reservas</span></div><em>Online</em></div>
        <div class="messages premium-messages" id="messages">${state.chat.messages.map(renderChatMessage).join("")}<div class="typing-indicator"><span></span><span></span><span></span><b>escribiendo...</b></div></div>
        <form class="chat-input premium-chat-input" id="chatForm">
          <input id="chatText" autocomplete="off" placeholder="Escribe tu respuesta">
          <button class="btn btn-green">Enviar</button>
        </form>
      </section>
      <aside class="card panel bot-flow-panel">
        <div class="panel-head"><h3>Flujo automatico</h3><button class="btn btn-secondary" id="resetChat">Reiniciar</button></div>
        <p class="muted">El bot usa la disponibilidad real del calendario para sugerir solo horarios libres.</p>
        ${chatProgress()}
        ${chatSummary()}
        <div class="alert">Fecha sugerida: ${state.chat.data.date || findSuggestedDates()[0] || nextBusinessDate()}</div>
        ${quickActionButtons()}
        <div id="quickOptions"></div>
      </aside>
    </div>
  `;
  if (publicDemo) {
    app.innerHTML = `<div class="public-shell">${publicNav()}<section class="section">${content}</section></div>`;
    bindRoutes();
  } else {
    appShell(content, title);
  }
  bindChat(publicDemo);
}
function bindChat(publicDemo) {
  const messages = document.querySelector("#messages");
  messages.scrollTop = messages.scrollHeight;
  document.querySelector("#resetChat").addEventListener("click", () => {
    state.chat.messages = [];
    resetChat();
    renderBot(publicDemo);
  });
  document.querySelector("#chatForm").addEventListener("submit", async event => {
    event.preventDefault();
    const input = document.querySelector("#chatText");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    await handleChatText(text, publicDemo);
  });
  document.querySelectorAll("[data-chat-action]").forEach(btn => btn.addEventListener("click", async () => {
    const action = btn.dataset.chatAction;
    if (action === "restart") {
      state.chat.messages = [];
      resetChat();
      renderBot(publicDemo);
    } else if (action === "show-slots") {
      const dates = findSuggestedDates(state.chat.data.date || todayLocalISO(), 4);
      addChatMessage("bot", dates.length ? `Tengo disponibilidad en estas fechas: ${dates.join(", ")}. Elige una fecha.` : "No encontre disponibilidad cercana. Revisa el calendario de configuracion.");
      state.chat.step = "date";
      renderBot(publicDemo);
    } else if (action === "change-date") {
      state.chat.step = "date";
      addChatMessage("bot", "Claro. Escribe una fecha en formato YYYY-MM-DD o selecciona una opcion disponible.");
      renderBot(publicDemo);
    } else if (action === "cancel") {
      addChatMessage("bot", "Reserva cancelada. Puedo ayudarte a empezar una nueva cita cuando quieras.");
      state.chat.step = "done";
      renderBot(publicDemo);
    } else if (action === "human") {
      addChatMessage("bot", "Te conectare con una persona del equipo de la clinica. Mientras tanto puedo dejar tus datos registrados.");
      renderBot(publicDemo);
    }
  }));
  renderQuickOptions(publicDemo);
}
async function handleChatText(text, publicDemo) {
  addChatMessage("user", text, "enviado");
  const data = state.chat.data;
  if (state.chat.step === "name") {
    data.patientName = text;
    state.chat.step = "phone";
    addChatMessage("bot", `Gracias, ${text}. Ahora indicame tu telefono.`);
  } else if (state.chat.step === "phone") {
    data.phone = text;
    state.chat.step = "reason";
    addChatMessage("bot", "Que servicio necesitas? Puedes elegir uno del catalogo.");
  } else if (state.chat.step === "reason") {
    data.reason = text;
    const dates = findSuggestedDates(data.date || todayLocalISO(), 4);
    data.date = dates[0] || data.date || nextBusinessDate();
    state.chat.step = "date";
    addChatMessage("bot", dates.length ? `Perfecto. Tengo disponibilidad en estas fechas: ${dates.join(", ")}. Elige una fecha.` : "No encontre disponibilidad cercana. Revisa el calendario de configuracion.");
  } else if (state.chat.step === "date") {
    const date = normalizeDateInput(text);
    if (!date) {
      addChatMessage("bot", "Usa el formato YYYY-MM-DD. Ejemplo: 2026-07-03.");
    } else {
      const availability = getDayAvailability(date);
      if (!availability.free.length) {
        const alternatives = findSuggestedDates(addDaysISO(date, 1), 4);
        addChatMessage("bot", alternatives.length ? `Ese dia esta completo. Tengo disponibilidad para estas fechas: ${alternatives.join(", ")}.` : "Ese dia esta completo y no encontre horarios cercanos disponibles.");
      } else {
        data.date = date;
        data.slots = availability.free;
        state.chat.step = "slot";
        addChatMessage("bot", `Tengo estos horarios libres para ${date}: ${availability.free.map(displayTime).join(", ")}. Elige uno.`);
      }
    }
  } else if (state.chat.step === "slot") {
    const chosen = text.includes(":") ? text.slice(0, 5) : text;
    const availability = getDayAvailability(data.date);
    if (!availability.free.includes(chosen)) {
      const suggested = nextFreeSlot(data.date, chosen);
      addChatMessage("bot", suggested ? `Esa hora esta ocupada. Te sugiero ${displayTime(suggested)}.` : "Ese dia ya no tiene horas libres. Elige otra fecha.");
    } else {
      data.time = chosen;
      state.chat.step = "confirm";
      addChatMessage("bot", `Antes de guardar confirma la reserva: Paciente: ${data.patientName}. Servicio: ${data.reason}. Fecha: ${data.date}. Hora: ${displayTime(data.time)}. Responde Confirmar para agendar.`);
    }
  } else if (state.chat.step === "confirm") {
    if (/^(confirmar|si|sí|ok|acepto)$/i.test(text.trim())) await bookFromChat(publicDemo);
    else {
      state.chat.step = "date";
      addChatMessage("bot", "Sin problema. Elige otra fecha para buscar nuevos horarios.");
    }
  }
  renderBot(publicDemo);
}
function renderQuickOptions(publicDemo) {
  const container = document.querySelector("#quickOptions");
  if (!container) return;
  const config = state.botConfig || {};
  if (state.chat.step === "reason") {
    container.innerHTML = `<div class="slot-grid bot-service-options">${getBotServiceOptions(config).map(service => `<button class="chip" data-chat="${service}">${service}</button>`).join("")}</div>`;
  } else if (state.chat.step === "date") {
    const dates = findSuggestedDates(state.chat.data.date || todayLocalISO(), 6);
    container.innerHTML = `<div class="slot-grid">${dates.map(date => `<button class="chip" data-chat="${date}">${date}</button>`).join("")}</div>`;
  } else if (state.chat.step === "slot") {
    const slots = getDayAvailability(state.chat.data.date).free;
    state.chat.data.slots = slots;
    container.innerHTML = `<div class="slot-grid">${slots.map(slot => `<button class="chip" data-chat="${slot}">${displayTime(slot)}</button>`).join("")}</div>`;
  } else if (state.chat.step === "confirm") {
    container.innerHTML = `<div class="slot-grid"><button class="chip" data-chat="Confirmar">Confirmar reserva</button><button class="chip" data-chat="Cambiar">Cambiar fecha</button></div>`;
  } else {
    container.innerHTML = `<div class="muted">Completa el paso actual desde el chat.</div>`;
  }
  container.querySelectorAll("[data-chat]").forEach(btn => btn.addEventListener("click", () => handleChatText(btn.dataset.chat, publicDemo)));
}
async function bookFromChat(publicDemo) {
  const data = state.chat.data;
  const availability = getDayAvailability(data.date);
  if (!availability.free.includes(data.time)) {
    const suggested = nextFreeSlot(data.date, data.time);
    state.chat.step = suggested ? "slot" : "date";
    addChatMessage("bot", suggested ? `Esa hora acaba de ocuparse. La proxima hora libre es ${displayTime(suggested)}.` : "Ese dia acaba de llenarse. Elige otra fecha disponible.");
    return;
  }
  const response = await api("/api/bot/book", { method: "POST", body: JSON.stringify(data) });
  state.chat.step = "done";
  addChatMessage("bot", "Tu cita fue agendada correctamente.");
  addChatMessage("bot", response.message || `Confirmada para ${data.date} a las ${data.time}.`);
  if (!publicDemo && state.token) await loadPrivateData();
}
function bindRoutes() {
  document.querySelectorAll("[data-route]").forEach(btn => btn.addEventListener("click", () => setRoute(btn.dataset.route)));
}

async function render() {
  const publicRoutes = ["landing", "login", "register", "welcome", "bot-demo", "app-direct"];
  if (!publicRoutes.includes(state.route) && !state.token) {
    setRoute("login");
    return;
  }
  try {
    if (state.token && !publicRoutes.includes(state.route)) await loadPrivateData();
    if (state.route === "app-direct") { setRoute(state.token ? "dashboard" : "login"); }
    else if (state.route === "landing") renderLanding();
    else if (state.route === "login") renderAuth("login");
    else if (state.route === "register") renderAuth("register");
    else if (state.route === "welcome") renderWelcome();
    else if (state.route === "dashboard") renderDashboard();
    else if (state.route === "agenda") renderAgenda();
    else if (state.route === "calendar") renderCalendarPage();
    else if (state.route === "patients") renderPatients();
    else if (state.route === "services") renderServicesPage();
    else if (state.route === "reports") renderReportsPage();
    else if (state.route === "settings") renderSettings();
    else if (state.route === "bot") renderBot(false);
    else if (state.route === "bot-demo") {
      state.chat.data.clinicId = "clinic_demo";
      renderBot(true);
    } else renderLanding();
  } catch (error) {
    app.innerHTML = `<main class="auth-layout"><section class="card auth-form"><h1>Error</h1><div class="alert error">${error.message}</div><button class="btn btn-primary" data-route="login">Volver al login</button></section></main>`;
    bindRoutes();
  }
}

render();











