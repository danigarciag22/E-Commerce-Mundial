import { BadgeCheck, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

// Social proof is presentational (no reviews table yet). Replace with real
// aggregated review data when the reviews feature ships.
const RATING = 4.8
const TOTAL = 125

const DISTRIBUTION = [
  { stars: 5, pct: 82 },
  { stars: 4, pct: 12 },
  { stars: 3, pct: 4 },
  { stars: 2, pct: 1 },
  { stars: 1, pct: 1 },
]

const FIT_STEPS = ['Pequeño', 'Exacto', 'Grande'] as const
const FIT_INDEX = 1 // tiende a "Ajuste exacto"

type Review = {
  author: string
  initials: string
  date: string
  rating: number
  title: string
  body: string
  tone: string
}

const REVIEWS: Review[] = [
  {
    author: 'Martín G.',
    initials: 'MG',
    date: '12 may 2026',
    rating: 5,
    title: 'Calidad de nivel mundial',
    body: 'La tela aireada se siente premium y el escudo bordado es impecable. Llegó en 2 días con caja sellada.',
    tone: 'from-muted via-card to-muted/40',
  },
  {
    author: 'Lucía R.',
    initials: 'LR',
    date: '3 may 2026',
    rating: 5,
    title: 'Talle exacto, idéntico a la foto',
    body: 'Pedí mi talla habitual (M) y quedó perfecta. Los colores son vivos y la costura no se nota. Volvería a comprar.',
    tone: 'from-muted/60 via-card to-muted/30',
  },
  {
    author: 'Diego P.',
    initials: 'DP',
    date: '28 abr 2026',
    rating: 4,
    title: 'Excelente, envío rapidísimo',
    body: 'Muy buen producto y atención. Le doy 4 porque quería que viniera con bolsa de regalo, pero la calidad es indiscutible.',
    tone: 'from-card via-muted/50 to-muted/30',
  },
]

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      aria-label={`${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'size-4',
            i <= Math.round(value)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted-foreground/40',
          )}
          aria-hidden
        />
      ))}
    </span>
  )
}

export function ProductReviews() {
  return (
    <section
      aria-labelledby="reviews-heading"
      className="mt-16 border-t border-border pt-10"
    >
      <h2 id="reviews-heading" className="text-2xl font-bold tracking-tight text-foreground">
        Opiniones de clientes
      </h2>

      <div className="mt-6 grid gap-10 lg:grid-cols-[260px_1fr]">
        {/* Aggregate summary + distribution + fit */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold tabular-nums leading-none text-foreground">
                {RATING.toFixed(1)}
              </span>
              <span className="pb-1 text-sm text-muted-foreground">/ 5</span>
            </div>
            <Stars value={RATING} />
            <p className="text-sm text-muted-foreground">
              Basado en {TOTAL} opiniones verificadas
            </p>
          </div>

          <ul className="flex flex-col gap-1.5">
            {DISTRIBUTION.map(({ stars, pct }) => (
              <li key={stars} className="flex items-center gap-2 text-sm">
                <span className="inline-flex w-10 shrink-0 items-center gap-1 tabular-nums text-muted-foreground">
                  {stars}
                  <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-amber-400"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-9 shrink-0 text-right tabular-nums text-muted-foreground">
                  {pct}%
                </span>
              </li>
            ))}
          </ul>

          {/* Fit gauge */}
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/30 p-4">
            <span className="text-sm font-medium text-foreground">Ajuste</span>
            <div className="relative h-1.5 rounded-full bg-muted">
              <span className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-foreground/70" />
              <span
                className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow-sm"
                style={{ left: `${(FIT_INDEX / (FIT_STEPS.length - 1)) * 100}%` }}
                aria-hidden
              />
            </div>
            <div className="flex justify-between text-[0.7rem] font-medium">
              {FIT_STEPS.map((step, i) => (
                <span
                  key={step}
                  className={cn(
                    i === FIT_INDEX ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              La mayoría coincide: este producto tiende a un <strong className="font-semibold text-foreground">ajuste exacto</strong>.
            </p>
          </div>
        </div>

        {/* Individual reviews */}
        <ul className="flex flex-col divide-y divide-border">
          {REVIEWS.map((review) => (
            <li key={review.author} className="flex flex-col gap-3 py-5 first:pt-0">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold text-foreground">
                  {review.initials}
                </span>
                <div className="flex flex-col">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    {review.author}
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-500">
                      <BadgeCheck className="size-3.5" aria-hidden />
                      Compra verificada
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
                <Stars value={review.rating} className="ml-auto" />
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-semibold text-foreground">{review.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{review.body}</p>
              </div>

              {/* User-uploaded photos (placeholder tiles until real uploads) */}
              <div className="flex gap-2">
                {[0, 1].map((n) => (
                  <span
                    key={n}
                    className={cn(
                      'relative size-16 overflow-hidden rounded-lg border border-border bg-gradient-to-br',
                      review.tone,
                    )}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(45deg,currentColor_0_1px,transparent_1px_12px)]"
                    />
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
