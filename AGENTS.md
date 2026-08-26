# 🤖 Guía de Desarrollo para Agentes IA (`AGENTS.md`)

> **Proyecto:** Sistema de Mantenimiento de Vehículos y Equipos  
> **Propósito:** Guía de referencia operativa, reglas de arquitectura, estándares de código y flujos de trabajo para cualquier Agente de IA o LLM que trabaje en esta base de código.

---

## 🎯 1. Visión y Alcance del Proyecto

Este sistema es una aplicación interna, responsiva y **Mobile-First** orientada al seguimiento técnico y legal de vehículos.
Permite a los usuarios y operarios verificar rápidamente el estado de las revisiones (seguro, permiso de circulación, revisión técnica, revisión de gas, pastillas de freno, kilometraje) directamente desde sus dispositivos móviles.

### Modos de Operación
1. **Modo Revisión (Público / Solo Lectura):**
   - Vista rápida general para cualquier operario.
   - Cálculo automático de **días restantes** hasta la próxima revisión.
   - Semáforos de alerta visual (🔴 Vencido, 🟡 Próximo a vencer según margen, 🟢 Al día).
   - Acceso a miniaturas y visualización modal de respaldos fotográficos de documentos.
2. **Modo Edición (Protegido con Clave Maestra):**
   - Requiere autenticación mediante `MASTER_KEY` definida en variables de entorno.
   - Genera una sesión/token firmado con validez de **24 horas** almacenado en `localStorage`.
   - Permite dar de alta, modificar y eliminar vehículos.
   - Permite actualizar la fecha de la última revisión general, las fechas de las próximas revisiones, kilometraje y adjuntar 1 imagen de respaldo por revisión. Los items de revisión son **fijos** (no se agregan ni eliminan).

---

## 🛠️ 2. Stack Tecnológico y Reglas del Entorno

| Componente | Tecnología | Reglas de Uso para el Agente |
| :--- | :--- | :--- |
| **Runtime & Servidor** | **Node.js + Hono** (`@hono/node-server`) | Utilizar sintaxis estándar de Hono. El servidor debe gestionar tanto la API REST como servir los archivos estáticos compilados del frontend. |
| **Frontend** | **Preact + Tailwind CSS + Vite** | Mantener bundle ultraliviano. Priorizar clases utilitarias de Tailwind. Diseño **Mobile-First** estricto (pensado para 360px - 430px de ancho). |
| **Base de Datos** | **Flat-File JSON (`data/db.json`)** | Acceder **únicamente** a través del patrón Repositorio (`JsonDbRepository`). No hacer manipulaciones directas de `fs` fuera de la capa de almacenamiento. |
| **Almacenamiento de Fotos** | **Directorio Local (`uploads/`)** | Guardar archivos con nombres únicos (ej: UUID + extensión). Máximo 1 foto por revisión de vehículo. |
| **Testing** | **Vitest** | Todo nuevo módulo o refactor debe incluir pruebas unitarias o de integración. |
| **Despliegue** | **Node.js estándar (`npm start`)** | Despliegue principal con `npm run build` + `npm start`. También compatible con **Vercel** (preset Hono, entry `src/index.ts`, SPA autocontenida servida por la función con `vite-plugin-singlefile` y persistencia con Vercel Blob al detectar `process.env.VERCEL`). Los directorios `data/` y `uploads/` son carpetas locales persistentes. |

---

## 📐 3. Arquitectura del Código y Estructura de Directorios

```text
mantenimiento-vehiculos/
├── data/                       # Base de datos JSON (persistencia local)
│   └── db.json
├── uploads/                    # Fotos y respaldos (persistencia local)
├── src/
│   ├── backend/                # Servidor Hono y lógica de negocio
│   │   ├── config/             # Configuración y validación de variables de entorno
│   │   ├── middleware/         # Middleware de Auth (24h JWT), errores, CORS, static
│   │   ├── modules/            # Módulos por dominio (auth, vehicles, upload)
│   │   ├── storage/            # Repositorios de persistencia (local JSON y Vercel Blob)
│   │   └── app.ts              # Punto de entrada de la aplicación Hono
│   ├── frontend/               # Aplicación Preact SPA
│   │   ├── src/
│   │   │   ├── components/     # Componentes visuales reutilizables
│   │   │   ├── hooks/          # Hooks de estado, autenticación y llamadas API
│   │   │   ├── pages/          # Páginas (PublicDashboard, AdminDashboard)
│   │   │   ├── services/       # Cliente API HTTP
│   │   │   └── utils/          # Utilidades (cálculo de fechas y días restantes)
│   │   ├── vite.config.ts
│   │   └── vite.vercel.config.ts
│   ├── index.ts                # Entry point para Vercel (default export Hono app)
│   └── shared/                 # Tipos TypeScript compartidos (Frontend <-> Backend)
│       └── types.ts
├── tests/                      # Suite de pruebas automatizadas con Vitest
├── vercel.json                 # Configuración de deploy en Vercel (preset Hono)
├── package.json
└── tsconfig.json
```

---

## 🔒 4. Convenciones de Seguridad y Autenticación

1. **Nunca exponer la Clave Maestra en el Frontend ni en respuestas de la API.**
2. La variable `MASTER_KEY` reside exclusivamente en `.env`.
3. El endpoint `POST /api/auth/login` recibe `{ masterKey: string }`. Si es válida, genera un token JWT/HMAC con `expiresIn: '24h'`.
4. El frontend almacena el token en `localStorage.getItem('auth_token')` y lo envía en el header `Authorization: Bearer <token>`.
5. Cualquier endpoint de modificación (`POST`, `PUT`, `DELETE`) debe estar protegido por el middleware de autenticación.
6. Si el token ha expirado (> 24h), la API devuelve `401 Unauthorized` y el frontend redirige limpiamente al modal de clave maestra.

---

## 📝 5. Tipos y Esquemas Centrales (`src/shared/types.ts`)

Los agentes deben respetar siempre el contrato canónico de datos:

```typescript
export const TIPOS_REVISION = ['seguro', 'permiso_circulacion', 'revision_tecnica', 'revision_gas', 'pastillas_freno', 'kilometraje'] as const;
export type TipoRevision = (typeof TIPOS_REVISION)[number];

// Margen de aviso fijo (constante, no editable por el usuario)
export const DIAS_MARGEN_AVISO = 15;

export interface ItemRevision {
  id: string;
  tipo: TipoRevision;
  nombre: string;
  fechaProximaRevision?: string;      // Formato ISO: YYYY-MM-DD
  kilometrajeActual?: number;
  kilometrajeProximo?: number;
  imagenRespaldoUrl?: string | null;  // URL de la imagen en uploads/
  observaciones?: string;
}

export interface Vehiculo {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  tipo: string;
  fechaUltimaRevision?: string;       // Última revisión general del vehículo (ISO YYYY-MM-DD)
  revisiones: ItemRevision[];         // Items FIJOS (los 6 tipos siempre presentes)
  createdAt: string;
  updatedAt: string;
}
```

> **Nota:** Los items de revisión son fijos. `diasMargenAviso`, `anio` y el
> `kilometraje` a nivel de vehículo fueron eliminados del contrato. El kilometraje
> solo vive en el item de tipo `kilometraje`.

---

## 📱 6. Pautas de UI/UX (Mobile-First)

- **Touch Friendly:** Botones y áreas clickeables con altura mínima de `44px` para interacción táctil cómoda.
- **Acceso a Cámara:** Los inputs de subida de imágenes deben permitir captura directa desde la cámara del móvil usando:
  ```html
  <input type="file" accept="image/*" capture="environment" />
  ```
- **Semáforos de Estado (solo punto de color, sin texto):**
  - 🔴 **Rojo (`bg-red-500`):** `diasRestantes < 0` (Vencido).
  - 🟡 **Amarillo (`bg-amber-500`):** `0 <= diasRestantes <= DIAS_MARGEN_AVISO` (Próximo a vencer).
  - 🟢 **Verde (`bg-emerald-500`):** `diasRestantes > DIAS_MARGEN_AVISO` (Al día).
  - ⚪ **Gris (`bg-slate-400`):** sin fecha definida.
- **Icono de Foto:** A la derecha del punto de estado, un icono 📷 coloreado (`text-brand-600`) si existe imagen de respaldo y gris (`text-slate-300`) si no existe.
- **Visor de Imágenes:** Modal modal liviano con botón de cierre grande y soporte para zoom o visualización nítida del documento.

---

## 🧪 7. Flujo de Trabajo y Testing para Agentes

Al implementar o modificar código:

1. **Leer Documentos Relevantes:**
   - [arquitectura_inicial.md](file:///D:/mantenimiento-vehiculos/arquitectura_inicial.md) para el contexto original de negocio.
   - [plan_de_trabajo.md](file:///D:/mantenimiento-vehiculos/plan_de_trabajo.md) para la hoja de ruta por fases y tareas pendientes.
2. **Escribir Código Modular y Tipado:**
   - No usar `any` en TypeScript.
   - Separar controladores, servicios y repositorio.
   - **Usar imports relativos con extensión `.js`** (ej: `from './services/api.js'`). Esto es obligatorio para que el output ESM compilado por Vercel resuelva los módulos en Node (`moduleResolution: Bundler` permite el mapeo `.js` → `.ts`).
3. **Ejecutar Pruebas Antes de Finalizar:**
   - Ejecutar `npm test` para verificar que ninguna funcionalidad existente se rompa.
   - Agregar tests unitarios para nuevas utilidades (especialmente cálculos de fechas y reglas de negocio).
4. **Preservar la Persistencia de Datos:**
   - El despliegue es solo con `npm start`. Asegurarse de que las rutas de almacenamiento apunten a carpetas relativas o configurables por variables de entorno (`./data` y `./uploads`).
