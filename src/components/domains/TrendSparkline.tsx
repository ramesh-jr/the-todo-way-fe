import type { TrendPoint } from "@/types"

interface TrendSparklineProps {
  points: TrendPoint[]
}

interface RatedPoint {
  period_start: string
  rating: number
}

const WIDTH = 120
const HEIGHT = 28
const PADDING = 3
const MIN_RATING = 1
const MAX_RATING = 5

export function TrendSparkline({ points }: TrendSparklineProps) {
  const rated: RatedPoint[] = points
    .filter((p): p is TrendPoint & { rating: number } => p.rating !== null)
    .map((p) => ({ period_start: p.period_start, rating: p.rating }))

  if (rated.length < 2) {
    return (
      <p className="text-muted-foreground text-xs">
        Not enough reflections yet
      </p>
    )
  }

  const innerWidth = WIDTH - PADDING * 2
  const innerHeight = HEIGHT - PADDING * 2
  const step = innerWidth / (rated.length - 1)

  const path = rated
    .map((p, i) => {
      const x = PADDING + i * step
      const y =
        PADDING +
        (1 - (p.rating - MIN_RATING) / (MAX_RATING - MIN_RATING)) * innerHeight
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(" ")

  return (
    <svg
      role="img"
      aria-label="Recent reflection trend"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      className="text-primary"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
