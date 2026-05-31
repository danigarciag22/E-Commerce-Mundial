# CRM Team — Roles, Permissions & Profiles — Design

**Fecha:** 2026-05-31
**Estado:** Validado (decisiones autónomas), listo para planes

## Resumen

Convertir el CRM de un solo rol admin a un **equipo con roles y permisos**, más
**perfiles de trabajador** (foto + tarjeta de rol). Dos planes: A) RBAC + gestión
de equipo; B) Perfiles + avatares (Supabase Storage).

## Roles

`app_users.role` se expande de `('admin','customer')` a:

| Rol | CRM | Permisos |
|-----|-----|----------|
| **admin** | sí | todo, incl. gestión de equipo |
| **manager** | sí | dashboard, productos, inventario, órdenes, descuentos, colecciones (sin equipo) |
| **staff** | sí | dashboard, inventario, órdenes (fulfilment) |
| **viewer** | sí | dashboard (solo lectura) |
| **customer** | no | tienda solamente |

## Permisos (capabilities)

`view_dashboard, manage_products, manage_inventory, manage_orders,
manage_discounts, manage_collections, manage_team`.

Matriz (en código, pura + testeada `can(role, permission)`):
- **admin:** todos.
- **manager:** todos menos `manage_team`.
- **staff:** `view_dashboard, manage_inventory, manage_orders`.
- **viewer:** `view_dashboard`.
- **customer:** ninguno.

## Aplicación de permisos

- **App layer (primario):** `getUser()` ya trae `profile.role`. Nuevos guards:
  `requireCrm()` (cualquier rol de equipo; customer/anon → redirect),
  `requirePermission(perm)` (redirect a `/admin` si falta). Sidebar filtra ítems
  por permiso. Acciones de escritura llaman al guard del permiso correspondiente.
- **RLS (defensa en profundidad):** función SECURITY DEFINER `crm_role()` devuelve
  el rol del caller. Políticas por rol:
  - products insert/delete, collections/product_collections all, discounts manage →
    `crm_role() in ('admin','manager')`
  - products update (incl. stock), orders update → `crm_role() in ('admin','manager','staff')`
  - orders read, app_users read-all → `crm_role() in ('admin','manager','staff','viewer')`
  - app_users update (cambiar roles) → `crm_role() = 'admin'`
  - `is_admin()` se conserva (compat); el usuario admin actual no cambia.

> RLS es coarse por rol; el control fino por sección lo hace el app layer
> (guards). Equipo interno de confianza → trade-off aceptable y documentado.

## Gestión de equipo (`/admin/equipo`, permiso `manage_team`)

- Lista de miembros del equipo (app_users con rol ≠ customer): avatar, nombre,
  email, rol, selector de rol (admin cambia).
- Promover a un cliente registrado a rol de equipo por email.
- (Invitar trabajadores nuevos = crear usuario auth → requiere service-role key;
  diferido. Por ahora se gestionan usuarios ya registrados.)

## Perfiles + Avatares (Plan B)

- `app_users` + `full_name text`, `avatar_url text`.
- Bucket Storage `avatars` (lectura pública; escritura: el usuario sube a su
  propia carpeta `{uid}/...` vía su sesión, política Storage RLS).
- `/admin/perfil`: form (nombre + subir foto) + **tarjeta de perfil** (avatar,
  nombre, email, badge de rol).
- Avatar mostrado en topbar del CRM y en la lista de equipo.

## Testing

- TDD puro: matriz de permisos `can()`, helpers de rol/label.
- E2E: admin ve "Equipo"; cambia rol; perfil muestra tarjeta. (Multi-rol e2e
  real requiere usuarios sembrados por rol — se cubre con skip-guard donde haga
  falta.)

## Planes

- **A — RBAC + Equipo:** expandir roles (migración + check), `crm_role()` + RLS,
  permisos `can()`, guards, sidebar por permiso, página `/admin/equipo`.
- **B — Perfiles + Avatares:** columnas, bucket Storage + políticas, página
  `/admin/perfil`, avatar en topbar/equipo.
