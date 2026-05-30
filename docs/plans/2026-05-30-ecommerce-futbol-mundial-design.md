# Ecommerce Fútbol Mundial — Documento de Diseño

**Fecha:** 2026-05-30
**Estado:** Validado, listo para implementación

## Resumen

Tienda ecommerce dedicada al mundial de fútbol. Vende mezcla de productos:
uniformes, zapatos, balones, merchandising. Mercado nacional (Colombia) con
pasarela de pago multi-país. Visualización 3D de productos con fondos
ambientales generados/servidos vía Higgsfield. Panel admin con CRUD de
productos y métricas. Optimizado para SEO.

## Stack Tecnológico

> **Nota de versiones:** No se fija ninguna versión específica. Durante el build
> se usa Context7 (MCP) para obtener documentación de la versión más actual de
> cada tecnología antes de implementar.

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend:** Node.js + TypeScript, vía Next.js API routes
- **Base de datos:** Supabase (PostgreSQL gestionado + Auth + Storage)
- **3D:** Three.js / Babylon.js renderizando modelos Higgsfield
- **Pagos:** Stripe y/o Mercado Pago (multi-país)
- **Deploy:** Vercel (frontend + serverless functions + CDN)

### Skills / herramientas de apoyo durante el desarrollo

- **Context7** — docs actualizadas de cada tecnología
- **Superpowers** — workflow (brainstorming, writing-plans, TDD)
- **frontend-design** — calidad de UI
- **ui-ux-pro-max** — diseño UX

## Arquitectura

**Renderizado (clave para SEO):**
- SSR para páginas de producto (indexables, Core Web Vitals)
- ISR para catálogo
- CSR para visualizador 3D y dashboard admin

**Supabase maneja:**
- PostgreSQL: productos, órdenes, usuarios, métricas
- Auth: login / registro, roles (admin / customer)
- Storage: imágenes de producto

**3D & Visualización (Higgsfield):**
Cada producto incluye:
- Modelo 3D (uniforme / zapato / balón)
- Fondo ambiental 3D (cancha, estadio, etc.)
- Iluminación dinámica (preset)
- Interacción: rotación, zoom, vistas múltiples

El admin selecciona el modelo Higgsfield por producto y previsualiza el render
3D antes de publicar. Backend valida URLs Higgsfield antes de renderizar. Si el
modelo 3D falla, fallback a imagen 2D.

## Esquema de Base de Datos

```
products      (id, name, price, sku, description, category)
product_3d    (product_id, model_url, background_url, lighting_preset)
orders        (id, user_id, items, total, status, payment_intent_id)
users         (id, email, role, created_at)
```

Constraints: FK entre tablas, SKU único. Row Level Security (RLS) en tablas
sensibles.

## Data Flow — Compra

1. User navega productos (SSR) con filtros dinámicos (categoría, precio)
2. Abre producto → renderiza 3D Higgsfield con rotación/zoom
3. Selecciona variante (talla, color) → agrega al carrito
4. Checkout → formulario dirección + Stripe/Mercado Pago
5. Webhook confirma pago → crea orden en BD, envía email de confirmación

## Componentes Principales

- `ProductCard` — thumbnail, precio, badge 3D
- `ProductViewer` — canvas Three.js, modelo Higgsfield, controles
- `Cart` — resumen items, botón checkout (estado: zustand + localStorage)
- `Checkout` — form dirección, selección pago, resumen final
- `AdminDashboard` — CRUD productos, preview 3D, métricas
- `MetricsBoard` — gráficos de ventas, órdenes, clientes

## Seguridad & Error Handling

**Pagos:**
- Verificación de signature en webhooks Stripe/Mercado Pago
- Retry logic si webhook falla (queue en BD)
- Log de transacciones en tabla audit

**Auth:**
- Next.js middleware protege rutas admin
- Supabase RLS en tablas sensibles
- Rate limit en endpoints de pago

**3D & Storage:**
- Validar URLs Higgsfield en backend
- Cache de modelos 3D en CDN Vercel
- Fallback a imagen 2D si el 3D falla

**Datos:**
- Constraints PostgreSQL (FK, SKU único)
- Validación de input en frontend + backend
- Passwords gestionados por Supabase Auth

## Testing

- **Unit:** componentes React (Vitest)
- **Integration:** API endpoints (pago, CRUD)
- **E2E:** flujo de compra completo (Playwright)

## Fases de Implementación

> El timeline es flexible (dedicación full-time). El orden es prioritario, no
> fijado a semanas estrictas.

**Fase 1 — MVP:**
- Setup: proyecto Next.js, Supabase, Vercel
- Productos: CRUD básico, listado SSR, búsqueda/filtros
- Carrito: estado local (zustand), persistencia localStorage
- Checkout: integración Stripe/Mercado Pago, webhook de confirmación
- Auth: login/registro básico (Supabase)

**Fase 2:**
- 3D: integración Higgsfield, visualizador Three.js por producto
- Admin: panel productos (create/edit/delete), preview 3D
- Métricas básicas: total ventas, órdenes hoy, clientes únicos

**Fase 3+:**
- Optimizaciones SEO avanzadas, velocidad, refinamiento UX
- Features premium: wishlists, reseñas, recomendaciones
