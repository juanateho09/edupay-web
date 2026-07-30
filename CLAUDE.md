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

Completado y aprobado: las 9 páginas — estructura base, tema claro/oscuro, autenticación,
layout (Sidebar/Topbar), Dashboard, Movimientos, Bolsillos, Calendario, Presupuestos, Metas,
Deudas y Reportes. No quedan rutas placeholder en `App.jsx`.

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
- `GET /presupuestos?mes&anio` devuelve `estado` ya calculado server-side:
  `'OK' | 'ALERTA' | 'EXCEDIDO'` (umbral EXCEDIDO es `> 100`, no `>= 100`). `PUT /presupuestos/:id`
  solo acepta `{ limite }` — `categoria_id`, `mes` y `anio` son inmutables tras la creación.
- `GET /metas` trae el join contra `bolsillos` ya resuelto: `bolsillo_nombre`, `saldo_actual` y
  los campos derivados `porcentaje_logrado`, `monto_faltante`, `completada` — no hace falta cruzar
  con `GET /bolsillos` salvo para poblar el select del modal de creación. `PUT /metas/:id` solo
  acepta `nombre` y `monto_objetivo`; `bolsillo_id` es inmutable tras la creación.
- `GET /deudas` soporta `?pagada=true|false` server-side (el filtro todas/pendientes/pagadas de
  la UI usa este query param, no filtra client-side). `PUT /deudas/:id` rechaza con 400 editar una
  deuda con `pagada=true` (el botón "Editar" se oculta en deudas pagadas); `tipo` sí es editable
  junto con el resto de campos. `PATCH /deudas/:id/pagar` marca la deuda como pagada.
- `GET /reportes/categorias?mes&anio` devuelve
  `{ ingresos: [{categoria_id, nombre, total, porcentaje_del_total}], gastos: [...] }`, ya
  ordenado `DESC` por `total`.
- `GET /reportes/mensual?mes&anio` devuelve
  `{ balance, por_categoria: {ingresos, gastos}, presupuestos, metas, top_gastos: [...],
  comparacion_mes_anterior: {ingresos_mes_anterior, gastos_mes_anterior, variacion_ingresos_pct,
  variacion_gastos_pct} }`. Las `variacion_*_pct` pueden venir `null` cuando el mes anterior fue 0.
- `GET /reportes/bolsillos` devuelve `[{id, nombre, saldo, porcentaje_del_total}]`.

## Convenciones del proyecto

- Nunca hardcodear colores — usar las variables CSS `--ep-*` (ver `src/index.css`) o las clases
  Tailwind `ep-*` mapeadas en `tailwind.config.js`.
- Todas las llamadas HTTP van por `src/api/axios.js` (nunca `fetch` directo).
- `formatCOP` vive en `src/utils/formatCOP.js`.
- El mes/año seleccionado en el Topbar vive en `src/store/mesStore.js` (compartido entre Topbar
  y cualquier página que necesite filtrar por periodo, como Dashboard).
