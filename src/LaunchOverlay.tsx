import { useEffect, useMemo, useRef, useState } from "react"

/* Deterministic pseudo-random from index */
function seeded(n: number, offset = 0) {
  return ((Math.sin(n * 9301 + offset * 49297 + 233) * 233280) % 1 + 1) % 1
}

interface LaunchOverlayProps {
  onComplete: () => void
}

export default function LaunchOverlay({ onComplete }: LaunchOverlayProps) {
  const [phase, setPhase]       = useState<"idle" | "countdown" | "launching" | "fading">("idle")
  const [countdownNum, setCNum] = useState(3)
  const [statusText, setStatus] = useState("INITIALISING SYSTEMS...")
  const doneRef = useRef(false)

  useEffect(() => {
    if (doneRef.current) return

    // Step 1 – brief idle, then start countdown
    const t1 = setTimeout(() => {
      setPhase("countdown")
      setStatus("SYSTEMS CHECK... OK")
      setCNum(3)
    }, 200)

    const t2 = setTimeout(() => {
      setStatus("FUEL LOADED... 100%")
      setCNum(2)
    }, 600)

    const t3 = setTimeout(() => {
      setStatus("TRAJECTORY SET...")
      setCNum(1)
    }, 1000)

    const t4 = setTimeout(() => {
      setStatus("🚀 IGNITION!")
      setCNum(0)
    }, 1400)

    const t5 = setTimeout(() => {
      setPhase("launching")
      setStatus("↑ ENTERING ORBIT ↑")
    }, 1600)

    const t6 = setTimeout(() => {
      setPhase("fading")
    }, 2400)

    const t7 = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true
        onComplete()
      }
    }, 3200)

    return () => {
      [t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout)
    }
  }, [])

  /* Random stars */
  const stars = useMemo(
    () =>
      Array.from({ length: 180 }, (_, i) => ({
        x:     seeded(i, 0) * 100,
        y:     seeded(i, 1) * 100,
        size:  seeded(i, 2) * 2.5 + 0.5,
        dur:   `${seeded(i, 3) * 4 + 2}s`,
        delay: `${seeded(i, 4) * 5}s`,
      })),
    []
  )

  /* Warp lines (during launch phase) */
  const warpLines = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        x:     seeded(i, 5) * 100,
        height: seeded(i, 6) * 35 + 20,
        dur:   `${seeded(i, 7) * 0.35 + 0.35}s`,
        delay: `${seeded(i, 8) * 0.5}s`,
      })),
    []
  )

  const isLaunching = phase === "launching" || phase === "fading"
  const showFlame   = phase !== "idle"

  return (
    <div
      className={`launch-overlay${phase === "fading" ? " fading" : ""}`}
    >
      {/* Stars */}
      {stars.map((s, i) => (
        <div
          key={i}
          className="launch-star"
          style={{
            left:   `${s.x}%`,
            top:    `${s.y}%`,
            width:  s.size,
            height: s.size,
            "--dur":   s.dur,
            "--delay": s.delay,
          } as React.CSSProperties}
        />
      ))}

      {/* Warp lines */}
      {isLaunching &&
        warpLines.map((l, i) => (
          <div
            key={i}
            className="warp-line"
            style={{
              left:   `${l.x}%`,
              height: `${l.height}vh`,
              top:    "0",
              "--dur":   l.dur,
              "--delay": l.delay,
            } as React.CSSProperties}
          />
        ))}

      {/* Title HUD */}
      <div className="launch-hud">
        <div className="launch-hud-title">Space Portfolio</div>
        <div className="launch-hud-name font-orbitron">ABISHEK S</div>
        <div className="launch-hud-sub">FULL-STACK DEV · UI/UX DESIGNER</div>
      </div>

      {/* Earth */}
      <div className="earth-container">
        <div className="earth-disc">
          <div
            className="earth-cloud"
            style={{ width: "70%", height: "70%", top: "15%", left: "5%", "--dur": "38s" } as React.CSSProperties}
          />
          <div
            className="earth-cloud"
            style={{ width: "50%", height: "50%", top: "35%", left: "40%", "--dur": "55s" } as React.CSSProperties}
          />
        </div>
        <div className="earth-atmosphere" />
      </div>

      {/* Launchpad */}
      <div className="launchpad" style={{ zIndex: 2 }}>
        <div className="launchpad-arm" />
        <div className="launchpad-base" />
      </div>

      {/* Rocket */}
      <div
        className={`rocket-wrapper${isLaunching ? " launching" : ""}`}
        style={{ zIndex: 3 }}
      >
        <svg
          className="rocket-svg"
          viewBox="0 0 60 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M30 5 Q40 30 40 70 L20 70 Q20 30 30 5Z" fill="#dbeeff" />
          <circle cx="30" cy="38" r="8" fill="#4af3ff" opacity="0.9" />
          <circle cx="30" cy="38" r="5" fill="#b0f0ff" opacity="0.6" />
          <path d="M20 70 L8 95 L20 88Z"  fill="#8899cc" />
          <path d="M40 70 L52 95 L40 88Z" fill="#8899cc" />
          <rect x="24" y="88" width="12" height="10" rx="3" fill="#556677" />
          <rect x="20" y="58" width="20" height="4"  rx="2" fill="#4af3ff" opacity="0.5" />
          <circle cx="30" cy="20" r="2" fill="#f5c842" opacity="0.8" />
        </svg>

        {/* Exhaust */}
        <div className={`exhaust${showFlame ? "" : " off"}`}>
          <div className="flame-outer" />
          <div className="flame-inner" />
        </div>
      </div>

      {/* Countdown status bar */}
      <div
        className="launch-status"
        style={{
          opacity:    phase === "fading" ? 0 : 1,
          transition: "opacity 0.6s",
        }}
      >
        {phase === "countdown" ? (
          <span style={{
            color:      "var(--gold)",
            fontFamily: "Orbitron, sans-serif",
            fontSize:   "14px",
          }}>
            T–{countdownNum}&nbsp;·&nbsp;{statusText}
          </span>
        ) : phase === "launching" ? (
          <span style={{ color: "var(--cyan)", letterSpacing: "0.3em" }}>
            {statusText}
          </span>
        ) : (
          <span style={{ opacity: 0.4 }}>STANDBY…</span>
        )}
      </div>
    </div>
  )
}
