import { SECTIONS } from "./data"

interface JourneyProgressProps {
  scrollOffset: number
}

export default function JourneyProgress({ scrollOffset }: JourneyProgressProps) {
  const totalH = 240 // px height of the track

  return (
    <div
      className="journey-progress"
      style={{ height: totalH + 40 }}
      aria-hidden="true"
    >
      {/* Track line */}
      <div className="journey-line" style={{ height: totalH }}>
        <div
          className="journey-line-fill"
          style={{ height: `${Math.min(scrollOffset / 0.95, 1) * 100}%` }}
        />
      </div>

      {/* Planet dots — absolutely positioned on the track */}
      {SECTIONS.map((s, i) => {
        const pct = s.scrollT / 0.95
        const reached = scrollOffset >= s.scrollT - 0.05
        return (
          <div
            key={s.id}
            className={`journey-dot${reached ? " reached" : ""}`}
            title={s.name}
            style={{
              position: "absolute",
              top: `${pct * totalH}px`,
              backgroundColor: reached ? s.color : undefined,
              borderColor: reached ? s.color : undefined,
              boxShadow: reached ? `0 0 8px ${s.color}` : undefined,
            }}
          />
        )
      })}
    </div>
  )
}
