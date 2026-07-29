# Edupay Frontend

React 18 + Vite + Tailwind CSS 3 + Zustand + React Router v6 + Axios + Recharts + react-calendar.
Backend: `http://localhost:3001/api/v1` (see `.env` / `VITE_API_URL`).

## El código fuente del backend está disponible localmente

`C:\Users\juanj\OneDrive\Desktop\edupay-api` — **léelo antes de asumir un contrato de API**.
Las rutas están en `src/routes/*.routes.js`, la validación de payloads en
`src/controllers/*.controller.js`, y la forma exacta de los datos devueltos (incluyendo joins,
nombres de columnas y casos límite) en `src/services/*.service.js`. Es mucho más confiable y
barato (no consume el rate limit) que probar por prueba y error con curl.

## Rate limiting del backend

`express-rate-limit` global (`src/app.js`): 100 requests / 15 min **por IP, sobre todas las
rutas** (no solo auth). curl y el navegador comparten el mismo contador en localhost. Evitar
scripts de prueba con muchas llamadas sueltas; agrupar en un solo script bash cuando se necesite
sembrar datos de prueba.

## Estado actual

Completado y aprobado: estructura base, tema claro/oscuro, autenticación, layout
(Sidebar/Topbar), Dashboard, y Movimientos. Las demás páginas (Bolsillos, Calendario,
Presupuestos, Metas, Deudas, Reportes) están pendientes — hay rutas placeholder en `App.jsx`.
No avanzar a la siguiente página sin confirmación explícita del usuario.

## Contrato real del backend (verificado con curl, no asumido)

- **Todas** las respuestas vienen envueltas como `{ success: boolean, data: ... }` o
  `{ success: false, error: "mensaje" }`. El interceptor de respuesta en `src/api/axios.js`
  desenvuelve `response.data` a `response.data.data` automáticamente en el caso exitoso, así que
  el código de páginas/stores puede tratar `const { data } = await api.get(...)` como el payload
  real. Los errores conservan la forma `{ success: false, error }` — usar `err.response?.data?.error`.
- `POST /auth/register` **no** devuelve token — solo crea el usuario. `authStore.registrar()`
  encadena un login automático después del registro.
- `POST /auth/login` devuelve `{ token, usuario: { id, nombre, email } }`.
- `GET /auth/me` devuelve el usuario directamente (sin envoltura `usuario`).
- Los campos numéricos (`saldo`, `monto`) vienen como strings tipo `"0.00"` — se formatean bien
  con `Intl.NumberFormat` sin conversión, pero usar `Number(...)` antes de sumas/comparaciones.
- `GET /reportes/balance?mes&anio` devuelve campos en **snake_case**:
  `ingresos_reales, gastos_reales, balance_real, total_planeado, balance_proyectado, estado`.
- `POST /movimientos` requiere `bolsillo_id`, `categoria_id`, `tipo`, `monto`, `fecha` (400 si
  faltan). El modal "+ Nuevo movimiento" del Topbar carga `/bolsillos` y `/categorias` para
  poblar esos selects, y deshabilita el submit si el usuario no tiene al menos uno de cada uno.
- Los bolsillos (`GET /bolsillos`) **no tienen** campo `meta`/objetivo — solo
  `{ id, nombre, saldo, created_at }`. El progreso mostrado en el Dashboard es el porcentaje de
  cada bolsillo sobre el saldo total, no un avance hacia una meta.
- `GET /categorias?tipo=INGRESO|GASTO` filtra por tipo server-side. Una categoría solo puede
  usarse en movimientos del mismo `tipo` (400 si no coincide). No hay página de gestión de
  categorías/etiquetas en el spec original — el modal de movimiento las crea/selecciona inline.
- `GET /etiquetas`, `POST /etiquetas {nombre}` — simples, `{ id, nombre }`, sin tipo.
- Movimientos (`GET /movimientos`) trae columnas planas más `categoria_nombre`, `bolsillo_nombre`
  y `etiquetas: [{id, nombre}]` (join ya resuelto server-side, no hace falta cruzar con
  categorías/bolsillos en el frontend).
- Reglas de negocio de movimientos que la UI debe respetar (ya implementadas en Movimientos.jsx):
  - `PUT /movimientos/:id` y `DELETE /movimientos/:id` **solo** funcionan sobre `estado=REAL`
    (400 si es `PLANEADO` — usar confirmar/cancelar en su lugar). La edición tampoco permite
    cambiar `tipo` ni `bolsillo_id`.
  - `PATCH /movimientos/:id/confirmar` solo sobre `PLANEADO` → pasa a `REAL` y aplica el saldo.
  - `DELETE /movimientos/:id/cancelar` (sí, DELETE) solo sobre `PLANEADO` → lo borra sin tocar
    saldo.
  - `GET /movimientos/buscar?q=` no admite combinarse con los demás filtros (tipo/estado/mes/etc);
    cuando hay texto de búsqueda, se usa ese endpoint en vez de `GET /movimientos`.
  - `GET /movimientos/exportar` requiere `mes` y `anio` (no exporta "todo" sin ellos).

## Convenciones del proyecto

- Nunca hardcodear colores — usar las variables CSS `--ep-*` (ver `src/index.css`) o las clases
  Tailwind `ep-*` mapeadas en `tailwind.config.js`.
- Todas las llamadas HTTP van por `src/api/axios.js` (nunca `fetch` directo).
- `formatCOP` vive en `src/utils/formatCOP.js`.
- El mes/año seleccionado en el Topbar vive en `src/store/mesStore.js` (compartido entre Topbar
  y cualquier página que necesite filtrar por periodo, como Dashboard).
