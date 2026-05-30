# Assets visuales / 3D — Guía de intención

Estado actual: **placeholders genéricos por categoría**. No hay assets reales de
Higgsfield todavía. Este documento describe qué deben mostrar las imágenes/3D
cuando se reemplacen los placeholders, para que el diseño ya esté pensado.

## Qué hay ahora (placeholder)

- Ilustraciones SVG genéricas, una por categoría, en `public/placeholders/`:
  - `balon.svg`, `uniforme.svg`, `zapato.svg`, `merchandising.svg`
- Se sirven vía el helper `src/lib/products/placeholderImage.ts`
  (`placeholderImage(category)` → `/placeholders/<category>.svg`).
- Se usan en: `ProductCard` (catálogo), página de detalle `productos/[id]`,
  y filas del carrito `CartItemRow`.
- Son **referenciales**: comunican la categoría, no el producto real.

## Qué debe ser (objetivo Higgsfield / 3D)

La idea es que cada producto tenga un **render 3D interactivo** (rotación, zoom)
sobre un **fondo ambiental** temático del Mundial, generado/servido por Higgsfield.
La tabla `product_3d` ya existe para esto:

| Columna | Significado |
|---|---|
| `model_url` | URL del modelo 3D del producto (GLB/GLTF) |
| `background_url` | URL del fondo/escena ambiental 3D |
| `lighting_preset` | Preset de iluminación (ej. `stadium`) |

### Intención por categoría

- **Uniforme** — camiseta/kit en 3D, vista frontal y trasera, tela con caída
  realista. Fondo: vestuario o túnel de estadio, luz cálida lateral.
- **Zapato (botines)** — botín en 3D, gira 360°, detalle de tacos y material.
  Fondo: césped de cancha con líneas, luz cenital de estadio nocturno.
- **Balón** — balón en 3D rotando, paneles y textura térmica visibles.
  Fondo: arco/portería o centro de cancha, luz difusa de día.
- **Merchandising** — gorra, bufanda, termo, etc. en 3D.
  Fondo: tribuna/hinchada, ambiente festivo, luz vibrante.

### Iluminación / ambiente (general)

- Energía Mundial 2026: vibrante pero premium, no recargado.
- Coherente con el tema neutral de la tienda (shadcn neutral): el producto es el
  protagonista, el fondo aporta contexto sin competir.
- Presets sugeridos en `lighting_preset`: `stadium` (default), `pitch-day`,
  `tunnel`, `stands`.

## Cómo reemplazar los placeholders (cuando haya assets)

1. Cargar los assets en Higgsfield y guardar sus URLs en `product_3d`
   (`model_url`, `background_url`, `lighting_preset`) por producto — gestionable
   desde el panel admin (extensión futura del formulario de producto).
2. Crear un visor 3D (`ProductViewer`, Three.js/Babylon.js) que renderice
   `model_url` sobre `background_url` con `lighting_preset`.
3. Sustituir los `<img src={placeholderImage(...)}>` en `ProductCard`,
   `productos/[id]` y `CartItemRow` por el visor (o una imagen de preview del 3D
   para las miniaturas, reservando el visor interactivo para el detalle).
4. Mantener `placeholderImage()` como **fallback** si un producto aún no tiene
   `model_url` (degradación elegante a 2D).

## Notas

- Para miniaturas (catálogo, carrito) probablemente baste una imagen 2D de
  preview del render; el 3D interactivo full se reserva al detalle por
  rendimiento.
- Si se usan imágenes 2D reales (fotos de producto) antes que el 3D, el mismo
  patrón aplica: añadir una columna `image_url` a `products` o reutilizar
  `product_3d.background_url`/un campo nuevo, y servirlas con `next/image`
  (configurar dominios remotos en `next.config.ts`).
