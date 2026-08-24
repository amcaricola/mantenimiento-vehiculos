# 🚚 Sistema de Mantenimiento de Vehículos

Aplicación web interna, **Mobile-First**, para el seguimiento técnico y legal de
vehículos: seguro, permiso de circulación, revisión técnica, revisión de gas,
pastillas de freno y kilometraje. Incluye semáforos de alerta, cálculo de días
restantes y respaldo fotográfico por revisión.

---

## 🛠 Stack

- **Backend:** Node.js + Hono (`@hono/node-server`)
- **Frontend:** Preact + Tailwind CSS + Vite
- **Persistencia:** JSON flat-file (`data/db.json`) con patrón Repositorio (migrable)
- **Fotos:** Directorio local (`uploads/`), 1 imagen por revisión
- **Auth:** Clave maestra (`.env`) + token JWT de sesión de 24 h en `localStorage`
- **Testing:** Vitest
- **Despliegue:** Node.js estándar con `npm start`

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

> ⚠️ **Seguridad:** `MASTER_KEY` nunca viaja al frontend. Solo se valida en el
> servidor para emitir el token de sesión.

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

## 🚀 Despliegue (`npm start`)

El despliegue es **solo con Node.js estándar**:

```bash
npm install --omit=dev   # o simplemente: npm ci
npm run build            # compila frontend + backend en /dist
npm start                # sirve la app completa en :3000
```

Los datos y fotos persisten en carpetas locales (`data/` y `uploads/`), que se
crean automáticamente en el primer arranque. Montar esas carpetas en el volumen
del servidor garantiza que la información no se pierda al reiniciar o actualizar.

---

## 🔐 Modos de uso

- **Modo Revisión (público):** cualquier usuario ve los vehículos, días restantes,
  semáforos y fotos de respaldo.
- **Modo Edición (protegido):** solicita la clave maestra. Con sesión de 24 h se
  puede crear, editar, eliminar vehículos y subir/quitar 1 foto por revisión.

---

## 🧪 Tests

```bash
npm test          # ejecuta la suite de Vitest
npm run test:watch
npm run typecheck # chequeo de tipos TypeScript
```

La suite cubre: cálculo de días restantes y estados, repositorio JSON,
autenticación (login, verify, protección de rutas) y CRUD completo + subida de
imágenes.

---

## 📂 Estructura

```text
src/
├── backend/          # Servidor Hono (config, middleware, modules, storage)
├── frontend/         # SPA Preact + Tailwind (components, hooks, pages, services, utils)
└── shared/           # Tipos y lógica de fechas compartidos
data/                 # Base de datos JSON (persistencia local)
uploads/              # Fotos de respaldo (persistencia local)
tests/                # Suite de Vitest
```