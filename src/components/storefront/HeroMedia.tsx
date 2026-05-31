// Placeholder for the Higgsfield 3D-style hero video (Fase 2). Swap the inner
// gradient block for a <video> once the asset exists. See docs/3D-ASSETS.md.
export function HeroMedia() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-card to-muted/40 lg:aspect-square">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(45deg,currentColor_0_1px,transparent_1px_16px)]" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="rounded-full bg-background/70 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur">Video 3D próximamente</span>
      </div>
    </div>
  )
}
