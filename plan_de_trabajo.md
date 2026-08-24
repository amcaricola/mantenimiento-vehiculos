# 📋 Plan de Trabajo y Especificación de Arquitectura: Sistema de Mantenimiento de Vehículos

> **Destinatario:** LLM / Agente Desarrollador  
> **Objetivo:** Implementar desde cero una aplicación web interna, modular, responsiva (Mobile-First) y testeable para la gestión y monitoreo del mantenimiento y documentación de vehículos.

---

## 🏗️ 1. Resumen Ejecutivo y Stack Tecnológico

| Capa | Tecnología / Herramienta | Justificación / Detalles |
| :--- | :--- | :--- |
| **Runtime & Backend** | **Node.js + Hono** (`@hono/node-server`) | Ultrarrápido, ligero, estándar y fácil de desplegar. |
| **Frontend** | **Preact + Tailwind CSS + Vite** | Reactividad ligera (<4KB Preact), compilado como SPA o cliente estático servido por Hono. |
| **Persistencia** | **JSON Flat-File DB + Zod/TypeScript Contracts** | Ubicado en `/data/db.json` como carpeta local persistente. Preparado para migración a SQL/NoSQL con Repository Pattern. |
| **Almacenamiento Multimedia** | **Local File Storage (`/uploads/`)** | 1 imagen de respaldo por revisión/documento. |
| **Autenticación** | **Master Key (.env) + JWT/HMAC Session (24 horas)** | Acceso público a consulta ("Revisión") y protegido con token a edición ("Edición"). |
| **Estilos & UI** | **Tailwind CSS (Mobile-First)** | Interfaz pensada para operarios con teléfono móvil junto al vehículo. |
| **Testing** | **Vitest / Supertest** | Pruebas unitarias y de integración de endpoints, servicios y lógica de días restantes. |
| **Despliegue** | **Node.js estándar (`npm run build` + `npm start`)** | El frontend compilado es servido por el propio servidor Hono. Los directorios `data/` y `uploads/` son carpetas locales persistentes (montables como volumen del servidor). |

---

## 📁 2. Estructura de Directorios Propuesta

```text
mantenimiento-vehiculos/
├── data/                       # Base de datos JSON (persistencia local)
│   └── db.json
├── uploads/                    # Fotos de respaldo (persistencia local)
├── src/
│   ├── backend/                # Servidor Hono
│   │   ├── config/             # Variables de entorno (.env) y constantes
│   │   │   └── env.ts
│   │   ├── middleware/         # Auth (Master Key / 24h JWT), Error Handler, Static
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── modules/
│   │   │   ├── auth/           # Login con Master Key -> Emisión de Token 24h
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── auth.service.ts
│   │   │   ├── vehicles/       # CRUD de Vehículos y Revisiones
│   │   │   │   ├── vehicle.controller.ts
│   │   │   │   ├── vehicle.service.ts
│   │   │   │   └── vehicle.schema.ts
│   │   │   └── upload/         # Subida y gestión de fotos de respaldo
│   │   │       ├── upload.controller.ts
│   │   │       └── upload.service.ts
│   │   ├── storage/            # Capa de Acceso a Datos (Repository Pattern)
│   │   │   ├── json-db.repository.ts
│   │   │   └── storage.interface.ts
│   │   └── app.ts              # Inicialización de Hono y middlewares
│   ├── frontend/               # SPA Preact + Tailwind
│   │   ├── src/
│   │   │   ├── components/     # UI Components (Badges, Cards, Modals, Forms, Alerts)
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── VehicleCard.tsx
│   │   │   │   ├── RevisionTable.tsx
│   │   │   │   ├── StatusBadge.tsx
│   │   │   │   ├── ImagePreviewModal.tsx
│   │   │   │   ├── EditVehicleModal.tsx
│   │   │   │   └── MasterKeyModal.tsx
│   │   │   ├── hooks/          # Hooks de estado, auth (24h localStorage), API
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useVehicles.ts
│   │   │   ├── pages/          # Vistas principales
│   │   │   │   ├── PublicDashboard.tsx   # Modo "Revisión" (Público)
│   │   │   │   └── AdminDashboard.tsx    # Modo "Edición" (Protegido)
│   │   │   ├── services/       # Cliente HTTP (Fetch API con Bearer token)
│   │   │   │   └── api.ts
│   │   │   ├── utils/          # Cálculo de fechas, días restantes, formato de patente
│   │   │   │   └── dateUtils.ts
│   │   │   ├── app.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.html
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   └── shared/                 # Tipos y Schemas compartidos (Frontend & Backend)
│       └── types.ts
├── tests/                      # Suite de Pruebas Automatizadas
│   ├── backend/
│   │   ├── auth.test.ts
│   │   ├── vehicles.test.ts
│   │   └── dateUtils.test.ts
│   └── setup.ts
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 📜 3. Contratos de Datos y Modelos (Zod / TypeScript)

### 3.1. Entidades del Dominio (`src/shared/types.ts`)

```typescript
export type TipoRevision = 
  | 'seguro'
  | 'permiso_circulacion'
  | 'revision_tecnica'
  | 'revision_gas'
  | 'pastillas_freno'
  | 'kilometraje';

export const DIAS_MARGEN_AVISO = 15;  // Margen de aviso fijo (constante)

export interface ItemRevision {
  id: string;
  tipo: TipoRevision;
  nombre: string;                     // ej: "Seguro Obligatorio (SOAP)"
  fechaProximaRevision?: string;      // ISO Date YYYY-MM-DD
  kilometrajeActual?: number;         // Solo item de tipo 'kilometraje'
  kilometrajeProximo?: number;        // Solo item de tipo 'kilometraje'
  imagenRespaldoUrl?: string | null;  // 1 imagen máx por revisión (ej: "/uploads/rev-123.jpg")
  observaciones?: string;
}

export interface Vehiculo {
  id: string;                         // UUID
  patente: string;                    // ej: "ABCD-12" o "AB1234"
  marca: string;                      // ej: "Toyota"
  modelo: string;                     // ej: "Hilux"
  tipo: string;                       // ej: "Camioneta", "Furgón", "Automóvil"
  fechaUltimaRevision?: string;       // Última revisión general (ISO YYYY-MM-DD)
  revisiones: ItemRevision[];         // Items FIJOS (los 6 tipos siempre presentes)
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  version: number;
  vehiculos: Vehiculo[];
}
```

> **Nota:** Los items de revisión son fijos y no son editables por el usuario
> (solo se actualizan sus fechas/km/observaciones y foto). `diasMargenAviso`,
> `anio` y el `kilometraje` a nivel de vehículo fueron eliminados del contrato.

### 3.2. Lógica de Días Restantes y Estados de Alerta

Para cada revisión con fecha de vencimiento:
- **`diasRestantes = diferenciaEnDias(fechaProximaRevision, hoy)`**
- **Estados (punto de color, sin texto):**
  - 🔴 **Vencido / Crítico:** `diasRestantes < 0` (o km excedido).
  - 🟡 **Alerta Próxima:** `0 <= diasRestantes <= DIAS_MARGEN_AVISO` (15 días o menos).
  - 🟢 **Al Día / OK:** `diasRestantes > DIAS_MARGEN_AVISO`.
  - ⚪ **Sin fecha:** sin fecha definida.
- **Icono de foto:** a la derecha del punto de estado, coloreado si existe imagen y gris si no existe.

---

## 🔐 4. Flujo de Autenticación y Permisos

1. **Modo Público ("Revisión"):**
   - Ruta: `/`
   - Cualquier usuario puede ver la lista de vehículos, el semáforo de estado, los días restantes y abrir las fotos de respaldo en modal. No requiere login.
2. **Modo Administrador ("Edición"):**
   - Ruta / Botón: `/admin` o botón "Modo Edición".
   - Al pulsar "Modo Edición", si no hay token válido en `localStorage`, se muestra el modal pidiendo la **Clave Maestra** (`MASTER_KEY`).
   - El backend valida contra `process.env.MASTER_KEY` y devuelve un JWT firmado con expiración de **24 horas**.
   - El frontend guarda el token en `localStorage.getItem('auth_token')`.
   - Con este token, se habilitan:
     - Crear nuevo vehículo.
     - Editar datos de vehículo (marca, modelo, patente, tipo, km).
     - Actualizar fechas de revisiones y subir/reemplazar/eliminar imagen de respaldo.
     - Eliminar vehículos reemplazados o dados de baja.

---

## 🚀 5. Fases de Ejecución Paso a Paso para el LLM

### **Fase 1: Setup Inicial del Proyecto y Configuración**
- [ ] Inicializar `package.json` con soporte TypeScript y scripts (`dev`, `build`, `start`, `test`).
- [ ] Instalar dependencias backend: `hono`, `@hono/node-server`, `zod`, `jsonwebtoken` (o `@tsndr/cloudflare-worker-jwt` / `jose`), `multer` o `hono/busboy` para multipart uploads, `uuid`.
- [ ] Configurar Vite + Preact + Tailwind CSS en `/src/frontend`.
- [ ] Crear `.env.example` con `PORT=3000`, `MASTER_KEY=secreto123`, `JWT_SECRET=super_secret_jwt_key_24h`.

### **Fase 2: Capa de Persistencia y Repositorio JSON**
- [ ] Crear clase `JsonDbRepository` en `src/backend/storage/json-db.repository.ts`.
- [ ] Implementar lectura y escritura atómica sobre `data/db.json` con bloqueo/cola básica o `fs.promises` para prevenir condiciones de carrera.
- [ ] Crear datos semilla iniciales (seed data) en caso de que `db.json` no exista.

### **Fase 3: Backend API (Hono)**
- [ ] `POST /api/auth/login`: Valida `masterKey` y emite token 24h.
- [ ] `GET /api/auth/verify`: Valida si el token local sigue activo.
- [ ] `GET /api/vehicles`: Público. Devuelve lista de vehículos con cálculo de días y estados.
- [ ] `GET /api/vehicles/:id`: Público. Detalle de un vehículo.
- [ ] `POST /api/vehicles`: Protegido (Auth 24h). Crear vehículo.
- [ ] `PUT /api/vehicles/:id`: Protegido (Auth 24h). Actualizar vehículo y sus revisiones.
- [ ] `DELETE /api/vehicles/:id`: Protegido (Auth 24h). Eliminar vehículo.
- [ ] `POST /api/vehicles/:id/revision/:revisionId/image`: Protegido. Subir foto de respaldo (guarda en `/uploads` y actualiza URL).
- [ ] Servir estáticos: Servir carpeta `/uploads/` y los archivos compilados del frontend (`/dist`).

### **Fase 4: Frontend (Preact + Tailwind) - Mobile First**
- [ ] **Diseño Responsivo:** Diseñado pensando en pantallas de 360px a 430px (móviles) y escalable a Desktop.
- [ ] **Vista Pública ("Revisión"):**
  - Barra superior con buscador rápido por patente/marca y botón "Acceso Edición".
  - Tarjetas de vehículos con acordeón o tabla desplegable:
    - Indicador de días restantes con colores (🔴 Vencido, 🟡 Próximo, 🟢 Al día).
    - Botón de icono para ver imagen de respaldo en modal / visor full screen (zoom táctil amigable).
- [ ] **Modal de Autenticación:**
  - Input para Clave Maestra.
  - Almacenamiento transparente en `localStorage` por 24 horas.
- [ ] **Vista / Modo "Edición":**
  - Botón flotante para "Agregar Vehículo".
  - Botón de edición por vehículo: formulario para actualizar kilometraje, modificar fechas de revisiones (con datepicker nativo móvil) y capturar foto con la cámara del móvil o archivo (`<input type="file" accept="image/*" capture="environment">`).
  - Botón de "Eliminar Vehículo" con confirmación de seguridad.

### **Fase 5: Testing Automatizado**
- [ ] Tests unitarios con Vitest para:
  - Función de cálculo de días restantes y estados (verificar margen de días, vencidos hoy, vencidos hace X días).
  - Repositorio JSON (lectura, escritura, actualización y borrado).
- [ ] Tests de integración para endpoints Hono:
  - Acceso público a `GET /api/vehicles`.
  - Rechazo de `POST /api/vehicles` sin token o con token expirado.
  - Login exitoso con clave maestra y emisión de token 24h.
  - Subida de imagen y persistencia en disco.

### **Fase 6: Build de Producción y Despliegue con `npm start`**
- [ ] `scripts/build.mjs`: compila el frontend (Vite -> `dist/`) y el backend (esbuild -> `dist/server/index.js`).
- [ ] Despliegue únicamente con `npm run build` + `npm start` (servidor Hono sirve API + estáticos).
- [ ] Los directorios `data/` y `uploads/` son carpetas locales persistentes, montables como volumen del servidor.
- [ ] Documentar en `README.md` los pasos de ejecución local y de producción.

---

## 🧪 6. Criterios de Aceptación

1. **Reactividad y UX:** Al cambiar una fecha o kilometraje en modo edición, la vista de revisión refleja inmediatamente los nuevos días restantes calculados.
2. **Seguridad:** Ninguna mutación (POST, PUT, DELETE, Upload) es permitida sin el Bearer Token válido de 24 horas.
3. **Respaldo de Documentación:** Se puede adjuntar 1 foto por documento/revisión y visualizarla en modal sin recargar la página.
4. **Resiliencia de Datos:** Reiniciar el servidor no borra los datos ni las fotos (los archivos `data/db.json` y `uploads/` persisten entre ejecuciones).
5. **Cobertura de Tests:** La suite de pruebas corre con `npm test` y pasa al 100% de manera determinista.
