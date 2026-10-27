# FleetCore API

API REST para gestionar el mantenimiento preventivo y correctivo de la flota de vehículos de FleetCore.
Prueba de desempeño – Módulo 6.2 NestJS (Riwi).

- **Coder:** _TU NOMBRE AQUÍ_
- **Clan:** _TU CLAN AQUÍ_

## Tecnologías

NestJS 12 · TypeScript · TypeORM · PostgreSQL · JWT (`@nestjs/jwt`) · Swagger (`@nestjs/swagger`) ·
`class-validator` / `class-transformer` · `bcryptjs` · Docker / docker-compose · Vitest.

## Puesta en marcha con Docker (recomendado)

Requisitos: Docker y Docker Compose.

```bash
# 1. Variables de entorno
cp .env.example .env

# 2. Levantar API + PostgreSQL (el esquema se crea automáticamente)
docker compose up -d --build

# 3. Poblar la base de datos (se puede ejecutar varias veces sin duplicar datos)
docker compose exec api npm run seed
```

- API: <http://localhost:3000>
- **Swagger: <http://localhost:3000/docs>**

Para detener: `docker compose down` (añade `-v` para borrar también el volumen de datos).

### Sin Docker

Necesitas PostgreSQL local y una base `fleetcore`. Ajusta `DB_HOST=localhost` en `.env`.

```bash
npm install
npm run build
npm run seed
npm run start:dev
```

### Variables de entorno (`.env.example`)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de la API |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Conexión a PostgreSQL (en Docker, `DB_HOST` se sustituye por el servicio `db`) |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Firma y vigencia del JWT |
| `API_KEYS` | Claves válidas para integraciones externas, separadas por coma |

## Credenciales de prueba (seed)

| Rol | Correo | Contraseña |
|---|---|---|
| ADMIN | `admin@fleetcore.com` | `Admin123*` |
| TECHNICIAN | `tecnico1@fleetcore.com` | `Tecnico123*` |
| TECHNICIAN | `tecnico2@fleetcore.com` | `Tecnico123*` |

API Keys de ejemplo: `demo-key-partner-1`, `demo-key-partner-2`.

El seed crea: 1 ADMIN y 2 TECHNICIAN; 3 mecánicos (2 activos vinculados a los técnicos y 1 inactivo);
2 talleres (1 activo y 1 inactivo); 4 vehículos (2 `AVAILABLE`, 1 `IN_MAINTENANCE` con su
mantenimiento `IN_PROGRESS` y 1 `INACTIVE`) y un mantenimiento `COMPLETED` para el historial.

## Cómo probar en Swagger

1. Abre <http://localhost:3000/docs> y ejecuta `POST /auth/login` con las credenciales del ADMIN.
2. Copia el valor de `data.accessToken` (sin comillas).
3. Pulsa **Authorize**, pega el token en `bearer` y confirma. Swagger añade `Bearer` solo.
4. Para `GET /integrations/vehicles/{plate}/maintenances` usa el esquema `api-key` e introduce `demo-key-partner-1`.

## Endpoints principales

| Módulo | Rutas | Acceso |
|---|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/admin/profile` | público / ADMIN |
| Vehículos | `POST/PATCH /vehicles`, `GET /vehicles`, `/vehicles/:id`, `/vehicles/plate/:plate`, `PATCH /vehicles/:id/activate\|deactivate` | escritura ADMIN, lectura autenticados |
| Mecánicos | `POST/GET/PATCH /mechanics`, `PATCH /mechanics/:id/activate\|deactivate`, `GET /mechanics/me` | ADMIN (`me`: TECHNICIAN) |
| Talleres | `POST/PATCH /workshops`, `GET /workshops` (activos), `GET /workshops/all`, `PATCH /workshops/:id/activate\|deactivate` | escritura ADMIN, lectura autenticados |
| Mantenimientos | `POST /maintenances`, `GET /maintenances`, `/active`, `/vehicle/:id`, `/vehicle/:id/history`, `/mechanic/:id`, `/my`, `PATCH /maintenances/:id/status` | ADMIN; el TECHNICIAN solo ve y actualiza los suyos |
| Integraciones | `GET /integrations/vehicles/:plate/maintenances` | header `x-api-key` |

## Autenticación y autorización

- Contraseñas con hash (bcrypt) y JWT tras iniciar sesión.
- `JwtAuthGuard` y `RolesGuard` son **globales**: toda ruta exige JWT salvo las marcadas con `@Public()`.
- Decoradores propios: `@Roles()`, `@CurrentUser()` y `@Public()`.
- Las integraciones externas usan `ApiKeyGuard`, que valida `x-api-key` contra `API_KEYS`.
- Acceso denegado: sin token / token inválido o expirado → `401`; rol insuficiente → `403`; API Key ausente o incorrecta → `401`.

## Reglas de negocio de los mantenimientos

- Estado inicial `SCHEDULED`. Transiciones: `SCHEDULED → IN_PROGRESS | CANCELLED`, `IN_PROGRESS → COMPLETED | CANCELLED`. `COMPLETED` y `CANCELLED` son finales; una transición inválida responde `409` con un mensaje.
- Un vehículo no puede tener dos mantenimientos activos (`SCHEDULED` o `IN_PROGRESS`).
- Un mecánico no puede tener dos mantenimientos activos con horarios que se crucen (en cualquier taller). Terminar a las 9:00 y empezar a las 9:00 es válido. El horario se define con `scheduledDate` y `durationMinutes` (60 por defecto).
- Un mecánico solo puede tener un mantenimiento `IN_PROGRESS` a la vez.
- No se asignan vehículos `INACTIVE`, ni mecánicos o talleres inexistentes o inactivos.
- El kilometraje del mantenimiento no puede ser menor al actual del vehículo.
- `IN_PROGRESS` pone el vehículo en `IN_MAINTENANCE`; `COMPLETED` lo deja `AVAILABLE` y actualiza su kilometraje. Cancelar un mantenimiento en proceso también lo libera.
- Para `COMPLETED` son obligatorios `workDone`, `finalCost`, `finishedAt` y `finalMileage`.
- Los cambios de estado se ejecutan en una transacción con bloqueo de filas para evitar condiciones de carrera.
- Vehículos, mecánicos y talleres se inactivan (borrado lógico) en lugar de eliminarse, para conservar el historial.

## Formato de respuestas

Éxito (`ResponseInterceptor`):

```json
{ "success": true, "statusCode": 200, "data": {}, "timestamp": "2026-10-20T19:00:00.000Z" }
```

Error (`AllExceptionsFilter`; los errores de validación, auth, no encontrado y unicidad nunca son `500`):

```json
{ "success": false, "statusCode": 409, "message": "El vehículo ABC123 ya tiene un mantenimiento activo", "path": "/maintenances", "timestamp": "2026-10-20T19:00:00.000Z" }
```

## Base de datos

El esquema lo crea TypeORM al iniciar (`synchronize: true`, pensado para esta prueba).
El dump con estructura y datos de ejemplo está en [`database/fleetcore.sql`](database/fleetcore.sql):

```bash
docker compose exec -T db psql -U postgres -d fleetcore < database/fleetcore.sql
```

(Úsalo sobre una base vacía: `docker compose down -v && docker compose up -d db`, y carga el dump antes de iniciar la API.)

## Scripts

| Comando | Descripción |
|---|---|
| `npm run build` | Compila a `dist/` |
| `npm run start:dev` | Modo desarrollo con recarga |
| `npm run seed` | Pobla la base de datos (idempotente) |
| `npm run lint` | Linter (oxlint) |
| `npm test` | Pruebas unitarias (Vitest) |
