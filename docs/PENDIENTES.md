# Pendientes

Tareas que quedaron abiertas o que dependen de configuración externa / acción del owner.
Última actualización: 2026-05-31.

---

## Auth — OAuth social (Google / Apple / Facebook)

**Estado:** código listo (botones + `signInWithOAuth` + ruta `/auth/callback`). Falta config en dashboards.

**URL de callback de Supabase** (va en "redirect URIs autorizados" de cada provider):
```
https://xaffgvilsjkcpjmtreia.supabase.co/auth/v1/callback
```

- [ ] **Google** — Google Cloud Console → OAuth consent screen → Credentials → OAuth client ID (Web app) → pegar callback → copiar Client ID + Secret → Supabase → Authentication → Providers → Google → Enable.
- [ ] **Facebook** — developers.facebook.com → Create App (Consumer) → producto "Facebook Login" → Settings/Basic (App ID + Secret, Privacy Policy URL) → Facebook Login → Valid OAuth Redirect URIs = callback → pasar app a Live → Supabase Providers → Facebook → Enable.
- [ ] **Apple** — requiere Apple Developer ($99/año). Services ID + Key (.p8) "Sign in with Apple", Return URL = callback → Supabase Providers → Apple → pegar Services ID, Team ID, Key ID, .p8.
- [ ] **Redirect URLs de la app** — Supabase → Authentication → URL Configuration → Redirect URLs, agregar:
  ```
  http://localhost:3000/auth/callback
  https://TU-DOMINIO-VERCEL/auth/callback
  ```
  (sin esto Supabase rechaza el `redirectTo` aunque el provider esté bien)

Mientras no estén configurados, los botones redirigen a `/login?error=oauth` (manejado).

---

## Auth — otros

- [ ] **Aplicar migración `0016_handle_new_user_full_name.sql`** — actualiza el trigger para copiar `full_name` desde el metadata de auth a `app_users.full_name`. El archivo ya está en `supabase/migrations/`. (El nombre ya se guarda en el metadata de auth desde el signup; solo falta sincronizar a la tabla.)
- [ ] **Configurar SMTP en Supabase** — el flujo de recuperar contraseña (`/recuperar`) y la confirmación de email dependen del envío de correo. El remitente por defecto de Supabase tiene rate limits bajos; configurar un SMTP propio (Resend, SendGrid, etc.) en Authentication → Emails.
- [ ] **"Mantener mi sesión iniciada"** — hoy es presentacional (supabase-ssr persiste vía cookies igual). Para control real persistente/sesión: manejar `maxAge` de cookies según el checkbox.
- [ ] **Quitar el banner admin dev de `/login`** antes de lanzar. Hoy lee `NEXT_PUBLIC_DEV_ADMIN_*` de `.env.local` (gitignored, no se renderiza en producción), pero conviene borrar el bloque del componente.
- [ ] **Rotar contraseña admin** — las credenciales admin de prueba quedaron en el historial git de commits anteriores. Rotar la contraseña es lo más simple (vs reescribir historial).

---

## Carrito / Wishlist / Checkout

- [ ] *(Opcional, premium)* **Carrito + Wishlist en DB por usuario (cross-device)** — hoy ambos son localStorage con `ownerId` (se limpian en logout, fusionan en login). Para seguir al usuario entre dispositivos: tablas `carts`/`cart_items` + `wishlists` con RLS + capa de sync. Declinado por ahora.
- [ ] **Express pay (Google Pay / PayPal)** en el checkout — botones visuales; falta integrar los SDKs reales (handlers en `ExpressButton`, `src/app/checkout/page.tsx`).
- [ ] **Campos de tarjeta embebidos (MP Bricks)** — hoy el pago redirige a Mercado Pago Checkout Pro (funcional). Para cobrar sin salir del sitio, montar el SDK de [Mercado Pago Bricks – CardPayment](https://www.mercadopago.com.co/developers/en/docs/checkout-bricks) en el contenedor marcado del checkout.
- [ ] **Persistir datos de Entrega** — el formulario de envío (nombre/dirección/ciudad/teléfono) es front-end only; no se guarda en la orden. Definir si se persiste en `orders` o se delega a MP. Tabla `orders` no tiene columnas de dirección hoy.
- [ ] **Umbral de envío gratis** — `FREE_SHIPPING_THRESHOLD` ($200k) y `SHIPPING_COST` ($15k) en `src/lib/cart/promos.ts`. Ajustar a gusto.

---

## Deploy / pagos

- [ ] **Deploy en Vercel** — conectar Vercel↔GitHub + cargar env vars desde `.env.vercel` (`SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`).
- [ ] **Smoke test de Mercado Pago en vivo** — el webhook necesita una URL pública (requiere deploy).

---

## Fase 2

- [ ] **3D Higgsfield** — hero VIDEO estilo 3D (swap del componente `HeroMedia`). Owner aún no tiene Higgsfield.
- [ ] **Fotografía real de producto** — la galería de la PDP usa placeholders; reemplazar por fotos de estudio / lifestyle / detalle reales.
