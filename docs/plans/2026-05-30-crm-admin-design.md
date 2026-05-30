# CRM Admin Dashboard — Documento de Diseño

**Fecha:** 2026-05-30
**Estado:** Validado, listo para planes de implementación

## Resumen

Transformar el panel `/admin` simple en un CRM profesional interactivo
(inspirado en el template "Uno" Bootstrap 5): sidebar + topbar, dashboards con
gráficos interactivos (Recharts), y tablas de datos con búsqueda/orden/paginación
para gestionar toda la tienda. 7 módulos. Datos demo realistas para que se vea
vivo.

## Stack

- Next.js 16 App Router + TypeScript + Tailwind v4 + shadcn/ui
- **Recharts** para gráficos (client components)
- Supabase (sesión admin + políticas RLS admin — sin service-role en el panel)
- Vitest (lógica pura TDD) + Playwright (flujo admin)

## Layout

Todo bajo `/admin`, protegido por `requireAdmin()` en el layout:
- **Sidebar** colapsable con nav (iconos lucide): Dashboard, Productos, Órdenes,
  Clientes, Inventario, Descuentos, Colecciones. En móvil: drawer.
- **Topbar**: título de sección, email admin, salir, toggle sidebar.
- Contenido responsive, tema neutral shadcn coherente con la tienda.

## Cambios de Schema

- `products`: + `stock int not null default 0`, + `active boolean not null default true`
- `collections` (nueva): `id uuid pk, name text, slug text unique, description text, created_at`
- `product_collections` (nueva): `product_id uuid fk, collection_id uuid fk, pk(product_id, collection_id)`
- `discounts` (nueva): `id uuid pk, code text unique, percent int check 1..100, active bool, expires_at timestamptz, created_at`
- `orders`: + `customer_email text` (órdenes guest)
- RLS: políticas admin (leer/escribir) en las tablas nuevas, igual patrón que
  `0006_admin_rls_policies` (subconsulta `app_users.role='admin'`). Lecturas
  públicas donde aplique (colecciones para la tienda futura).

## Datos Demo (seed)

Marcado como demo (borrable). ~40 órdenes en 90 días (estados/totales variados,
`customer_email` ficticios), ~15 clientes `app_users` (role customer), stock por
producto, 4 descuentos, 5 colecciones (Colombia, Argentina, Brasil, Mundial 2026,
Ofertas) con productos asignados.

> Nota: los clientes demo se crean como filas `app_users` directamente (sin
> `auth.users`) para el CRM — son registros de perfil para visualización. Las
> órdenes demo referencian `customer_email`, no `user_id` (guest), para evitar
> dependencias con auth. Documentado como simplificación de seed.

## Módulos

### Dashboard (`/admin`)
KPI cards (Ingresos pagado, Órdenes, Ticket promedio, Clientes). Gráfico líneas
(ventas 90 días), barras (top 5 productos), donut (órdenes por estado), tabla 5
órdenes recientes. Selector de rango 7/30/90 días.

### Productos (`/admin/productos`)
Tabla interactiva: nombre, SKU, categoría, precio, stock, estado. Búsqueda,
orden por columna, paginación, filtro categoría. Badge stock bajo (≤5). Editar,
eliminar (con confirmación), toggle activo. Formulario extendido con
stock/colecciones/activo.

### Órdenes (`/admin/ordenes`)
Tabla: id corto, cliente, total, estado (badge), fecha. Búsqueda + filtro estado
+ orden. Detalle `/admin/ordenes/[id]`: items, totales, cliente, cambiar estado.
Paginación.

### Clientes (`/admin/clientes`)
Tabla: email, rol, # órdenes, gasto total, registro. Búsqueda + orden. Detalle
`/admin/clientes/[id]`: datos + historial de órdenes.

### Inventario (`/admin/inventario`)
Tabla enfocada en stock: producto, stock, estado (OK/bajo/agotado). Edición
rápida del stock. Filtro "solo bajo stock". KPIs: total SKUs, agotados, bajo
stock.

### Descuentos (`/admin/descuentos`)
Tabla: código, %, estado, expira. CRUD con confirmación. Validación: código
único, % 1-100, fecha futura.

### Colecciones (`/admin/colecciones`)
Tabla/grid: nombre, slug, # productos. CRUD. Asignar productos (multiselect).
(Vitrina pública `/colecciones/[slug]` fuera de alcance — solo gestión admin.)

## Testing

- **TDD (Vitest)** en lógica pura: agregaciones de métricas, validación de
  descuentos/colecciones, helpers de tabla (búsqueda/orden/paginación), cálculo
  de gasto por cliente, mapeos de queries admin.
- **E2E (Playwright)**: login admin → dashboard → CRUD producto → cambiar estado
  de orden. Charts = humo visual ligero.
- Componentes Recharts: no e2e pesado.

## Plan de Implementación (subsistemas → planes separados)

1. **CRM Foundation** — migraciones de schema, seed demo, shell sidebar/topbar,
   instalar Recharts. Prerequisito.
2. **Dashboard** — KPIs + charts.
3. **Productos + Inventario** — tabla interactiva + stock + form extendido.
4. **Órdenes** — tabla + detalle + cambio de estado.
5. **Clientes** — lista + detalle.
6. **Descuentos + Colecciones** — CRUD de ambos.

Cada plan produce software funcional por sí solo. Acceso siempre vía sesión admin
+ RLS (sin service-role en el panel).
