# 🚚 Sistema de Mantenimiento de Vehículos

Aplicación web interna, **Mobile-First**, para el seguimiento técnico y legal de
los vehículos de una empresa. Permite a los operarios verificar desde el móvil
el estado de las revisiones —seguro, permiso de circulación, revisión técnica,
revisión de gas, pastillas de freno y kilometraje— con cálculo automático de los
días restantes, semáforos de alerta y respaldo fotográfico por revisión.

---

## ✨ Características

- **Modo Revisión (público):** lista de vehículos con semáforos de estado
  (🔴 vencido · 🟡 próximo · 🟢 al día · ⚪ sin fecha), días restantes e icono de
  foto por revisión (azul si hay respaldo, gris si no) con visor a pantalla completa.
- **Modo Edición (protegido):** acceso con clave maestra y sesión de **24 horas**
  (token en `localStorage`). Permite crear, editar y eliminar vehículos, actualizar
  fechas y kilometraje, y adjuntar **1 foto de respaldo por revisión**.
- **Items de revisión fijos:** los 6 tipos de revisión son subtítulos fijos; el
  usuario solo actualiza sus fechas/km/observaciones y foto.
- **Margen de aviso fijo** de 15 días (constante `DIAS_MARGEN_AVISO`).
- **Mobile-First:** pensado para pantallas de 360–430 px, con captura directa de
  cámara (`capture="environment"`).

---

## 🛠 Stack

| Capa | Tecnología |
| :--- | :--- |
| **Backend** | Node.js + Hono (`@hono/node-server`) |
| **Frontend** | Preact + Tailwind CSS + Vite |
| **Persistencia** | JSON flat-file (`data/db.json`) con patrón Repositorio |
| **Fotos** | Directorio local (`uploads/`), 1 imagen por revisión |
| **Auth** | Clave maestra (`.env`) + token JWT de sesión 24 h |
| **Testing** | Vitest |
| **Despliegue** | Node.js estándar (`npm run build` + `npm start`) |

---

## ⚙️ Configuración (variables de entorno)

Copia `.env.example` a `.env` y ajusta los valores:

| Variable | Descripción | Default |
| :--- | :--- | :--- |
| `PORT` | Puerto del servidor | `3000` |
| `MASTER_KEY` | Clave maestra para el modo edición | `secreto123` |
| `JWT_SECRET` | Secreto para firmar el token de sesión | `super_secret_jwt_key_24h` |
| `JWT_EXPIRES_IN` | Duración de la sesión (`s`, `m`, `h`, `d`) | `24h` |
| `DATA_DIR` | Carpeta de la base de datos JSON | `./data` |
| `UPLOADS_DIR` | Carpeta de fotos de respaldo | `./uploads` |
| `PUBLIC_DIR` | Carpeta del frontend compilado | `./dist` |

> ⚠️ **Seguridad:** `MASTER_KEY` y `JWT_SECRET` nunca viajan al frontend. La clave
> maestra solo se valida en el servidor para emitir el token de sesión.

---

## 🚀 Ejecución local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear entorno
cp .env.example .env

# 3. Desarrollo (servidor :3000 + frontend :5173 con proxy)
npm run dev

# 4. Producción (compila frontend + backend y sirve todo desde :3000)
npm run build
npm start

# Verificación rápida
curl http://localhost:3000/api/health
```

---

## 📦 Despliegue (`npm start`)

El despliegue es **solo con Node.js estándar**:

```bash
npm ci
npm run build   # compila el frontend (Vite → dist/) y el backend (esbuild → dist/server/)
npm start       # sirve la app completa (API + estáticos) en :3000
```

Los datos y las fotos persisten en carpetas locales (`data/` y `uploads/`), que se
crean automáticamente en el primer arranque. Montar esas carpetas como volumen del
servidor garantiza que la información no se pierda al reiniciar o actualizar.

---

## ▲ Deploy en Vercel (preset Hono)

El proyecto está preparado para **Vercel** con el **Framework Preset: Hono**:

1. Importa el repositorio en Vercel (o usa `vercel` CLI).
2. En **Project Settings > Framework Preset** selecciona **Hono** (ya forzado por
   `vercel.json`). El build usa `npm run build:vercel`, que compila el frontend
   como un único HTML autocontenido.
3. **Conecta un Vercel Blob Store** (Project > Storage > Blob). Vercel inyecta
   automáticamente `BLOB_READ_WRITE_TOKEN`; sin él la app funciona con datos
   **en memoria** (no persistentes) y las fotos no se pueden subir.
4. Define `MASTER_KEY` y `JWT_SECRET` en las variables de entorno del proyecto.

### Cómo funciona

- El **entry point** `src/index.ts` exporta la aplicación Hono como default
  export (detectado automáticamente por el preset).
- El build de Vercel (`npm run build:vercel`) compila el frontend como un **único
  HTML autocontenido** (`vite-plugin-singlefile`, JS y CSS inline) y lo inyecta
  en la función. Cualquier ruta que no sea `/api/*` responde con la SPA.
- La API (`/api/*`) corre como serverless function.
- **Persistencia con Vercel Blob:** al detectar `process.env.VERCEL`, la app usa
  Blob para guardar `db.json` y las fotos de respaldo (no hay filesystem
  persistente en serverless). En local sigue usando `data/` y `uploads/`.

```bash
# Verificación local del build de Vercel
npm run build:vercel
```

> ⚠️ En Vercel no se usa el middleware estático local ni `dist/`: la SPA se sirve
> desde la propia función y las URLs de fotos apuntan a Vercel Blob.

---

## 🔐 Modos de uso

- **Modo Revisión (público):** cualquier usuario ve los vehículos, los días
  restantes, los semáforos y las fotos de respaldo (información pública).
- **Modo Edición (protegido):** solicita la clave maestra. Con la sesión de 24 h
  se pueden crear, editar y eliminar vehículos, actualizar la fecha de la última
  revisión general, las fechas de las próximas revisiones, el kilometraje y
  subir/quitar la foto de cada revisión.

---

## 🗃 Modelo de datos

Los **6 items de revisión son fijos** y siempre están presentes en cada vehículo:

1. Seguro Obligatorio (SOAP)
2. Permiso de Circulación
3. Revisión Técnica
4. Revisión de Gas
5. Pastillas de Freno
6. Kilometraje

```typescript
interface ItemRevision {
  id: string
  tipo: TipoRevision
  nombre: string
  fechaProximaRevision?: string      // ISO YYYY-MM-DD
  kilometrajeActual?: number         // solo en el item 'kilometraje'
  kilometrajeProximo?: number        // solo en el item 'kilometraje'
  imagenRespaldoUrl?: string | null
  observaciones?: string
}

interface Vehiculo {
  id: string
  patente: string
  marca: string
  modelo: string
  tipo: string
  fechaUltimaRevision?: string       // última revisión general del vehículo
  revisiones: ItemRevision[]
  createdAt: string
  updatedAt: string
}
```

El margen de aviso es fijo: `DIAS_MARGEN_AVISO = 15`.

---

## 🔌 API

| Método | Ruta | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Público | Valida `{ masterKey }` y emite token 24 h |
| `GET` | `/api/auth/verify` | Público | Verifica si un token sigue activo |
| `GET` | `/api/vehicles` | Público | Lista vehículos con estados calculados |
| `GET` | `/api/vehicles/:id` | Público | Detalle de un vehículo |
| `POST` | `/api/vehicles` | 🔒 Token | Crear vehículo |
| `PUT` | `/api/vehicles/:id` | 🔒 Token | Actualizar vehículo y sus revisiones |
| `DELETE` | `/api/vehicles/:id` | 🔒 Token | Eliminar vehículo |
| `GET` | `/api/vehicles/export` | 🔒 Token | Exportar respaldo de todos los vehículos (JSON) |
| `POST` | `/api/vehicles/import` | 🔒 Token | Importar/restaurar vehículos desde un respaldo JSON |
| `POST` | `/api/vehicles/:id/revision/:revId/image` | 🔒 Token | Subir foto de respaldo |
| `DELETE` | `/api/vehicles/:id/revision/:revId/image` | 🔒 Token | Eliminar foto de respaldo |
| `GET` | `/api/health` | Público | Estado del servidor |

Toda mutación requiere `Authorization: Bearer <token>`.

---

## 🧪 Tests

```bash
npm test            # ejecuta la suite de Vitest
npm run test:watch  # modo watch
npm run typecheck   # chequeo de tipos TypeScript
```

La suite cubre: cálculo de días restantes y estados, repositorio JSON,
autenticación (login, verify, protección de rutas) y CRUD completo + subida de
imágenes.

---

## 📂 Estructura del proyecto

```text
mantenimiento-vehiculos/
├── data/                        # Base de datos JSON (persistencia local)
├── uploads/                     # Fotos de respaldo (persistencia local)
├── scripts/
│   └── build.mjs                # Build de producción (Vite + esbuild)
├── src/
│   ├── backend/                 # Servidor Hono
│   │   ├── config/              # Variables de entorno
│   │   ├── middleware/          # Auth, errores, estáticos
│   │   ├── modules/             # auth, vehicles, upload
│   │   ├── storage/             # Repositorio JSON (patrón Repositorio)
│   │   ├── app.ts               # Configuración de la aplicación Hono
│   │   └── server.ts            # Punto de entrada
│   ├── frontend/                # SPA Preact + Tailwind
│   │   ├── src/
│   │   │   ├── components/      # UI (cards, tablas, modales, badges…)
│   │   │   ├── hooks/           # useAuth, useVehicles
│   │   │   ├── pages/           # PublicDashboard, AdminDashboard
│   │   │   ├── services/        # Cliente HTTP (api.ts)
│   │   │   └── utils/           # dateUtils
│   │   └── vite.config.ts
│   └── shared/                  # Tipos y lógica de fechas compartidos
├── tests/                       # Suite de Vitest
├── .env.example
├── package.json
└── tsconfig.json
```