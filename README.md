# DentAce

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
Correo: demo@dentace.com
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
## SQL Server

Los nuevos clientes registrados se sincronizan en SQL Server local. Los archivos fisicos usan el nombre ElerSync.mdf/ElerSync_log.ldf, pero la base adjunta en SQL Server se llama:

```text
Servidor: localhost
Base de datos: Automatizacion dental
Tabla: dbo.ClientesDentales
```

Campos guardados: `Id`, `NombreClinica`, `NombreDentista`, `Correo`, `Telefono`, `EstadoPlan`, `FechaRegistro` y `FechaSincronizacion`.

La app crea la tabla automaticamente si no existe. Puedes cambiar la conexion con variables de entorno: `SQL_SERVER`, `SQL_DATABASE`, `SQL_CLIENTS_TABLE`, `SQL_USER`, `SQL_PASSWORD` y `SQLCMD_PATH`.
## WhatsApp Business

La app incluye webhook para WhatsApp Business Cloud API:

```text
Webhook URL: https://TU-DOMINIO/webhooks/whatsapp
Verify token: dentalbot_verify_token
```

Variables de entorno para produccion:

```text
WHATSAPP_VERIFY_TOKEN=tu_token_de_verificacion
WHATSAPP_ACCESS_TOKEN=token_permanente_o_temporal_de_meta
WHATSAPP_PHONE_NUMBER_ID=id_del_numero_de_whatsapp_business
WHATSAPP_DEFAULT_CLINIC_ID=clinic_demo
```

Flujo: el paciente escribe al numero Business, Meta envia el mensaje al webhook, el bot pide nombre, servicio, fecha y hora, crea la cita con estado `confirmada` y responde al paciente. DentAce no inicia conversaciones de WhatsApp, no envia recordatorios automaticos y no envia promociones; solo responde a mensajes entrantes del paciente. Esa cita aparece en Agenda porque la agenda filtra solo citas confirmadas.

Reglas obligatorias de WhatsApp:
- Solo se responde a eventos entrantes `messages` recibidos desde Meta.
- No hay recordatorios, promociones ni campanas.
- No se inician conversaciones por cuenta propia.
- No se responde fuera de la ventana activa de conversacion.
- Cada clinica puede activar o desactivar WhatsApp desde la configuracion del bot.
- Cada mensaje recibido y enviado se registra en `whatsappMessageLogs`, y el historial queda en `whatsappConversations`.

Prueba local sin Meta:

```bash
curl -X POST http://localhost:3000/api/whatsapp/simulate -H "Content-Type: application/json" -d "{\"phone\":\"8290000000\",\"text\":\"hola\"}"
```

