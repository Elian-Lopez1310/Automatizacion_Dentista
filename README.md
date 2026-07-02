# DentalBot Pro

Aplicacion web SaaS local para automatizacion de clinicas dentales.

## Requisitos

- Node.js 18 o superior.
- No requiere instalar paquetes externos.

## Ejecutar

```bash
npm start
```

Abre:

```text
http://localhost:3000
```

Cuenta demo:

```text
Correo: demo@dentalbotpro.com
Contrasena: demo1234
```

## Flujo incluido

- Landing page responsive con plan mensual de US$9.99.
- Registro de dentistas con estado `pendiente de pago`.
- Pantalla de bienvenida.
- Login con hash de contrasena y sesion local.
- Dashboard privado con metricas, proximas citas y estado del plan.
- Agenda diaria, semanal y mensual.
- Creacion, edicion, cancelacion y completado de citas.
- Modulo de pacientes con busqueda, creacion, edicion e historial por cantidad de citas.
- Chat de bot tipo WhatsApp que toma datos, muestra horarios y guarda la cita.
- Configuracion del bot: nombre, horario, duracion, mensajes y servicios.
- API preparada para integrar Stripe Checkout o PayPal Orders API.
- Base de datos local inicial en `data/db.json`.

## Estructura

```text
server.js          API HTTP, sesiones, seguridad basica y archivos estaticos
public/index.html  Entrada de la SPA
public/styles.css  Diseno responsive
public/app.js      Frontend y flujos de negocio
data/db.json       Se crea automaticamente con datos demo al iniciar
```

## Pagos reales

El endpoint `POST /api/payments/create-checkout` crea una intencion local placeholder. Para Stripe o PayPal, reemplaza ese bloque en `server.js` por la llamada real del proveedor y guarda el estado confirmado mediante webhook.

