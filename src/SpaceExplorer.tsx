import { Suspense, useState, useCallback, useEffect, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import LaunchOverlay from "./LaunchOverlay"
import SpaceScene from "./SpaceScene"
import JourneyProgress from "./JourneyProgress"
import { SECTIONS, STOPS } from "./data"

/* ─────────────────────────────────────────────────────
   PLANET MODAL  — opens when user clicks a planet
   ───────────────────────────────────────────────────── */
function PlanetModal({
  sectionId,
  onClose,
}: {
  sectionId: string | null
  onClose: () => void
}) {
  const s = SECTIONS.find((x) => x.id === sectionId)
  const visible = !!s

  /* close on Escape */
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [visible, onClose])

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.3s ease",
      }}
    >
      {s && (
        /* Modal card — stop click from closing */
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "min(640px, 92vw)",
            maxHeight: "88vh",
            overflowY: "auto",
            background: "rgba(5,6,22,0.96)",
            border: `1px solid ${s.color}35`,
            borderRadius: "24px",
            boxShadow: `0 0 80px ${s.color}22, 0 40px 80px rgba(0,0,0,0.7)`,
            transform: visible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.97)",
            transition: "transform 0.35s cubic-bezier(0.2,0.8,0.2,1)",
            fontFamily: "'Space Grotesk', sans-serif",
            position: "relative",
          }}
        >
          {/* Colour top bar */}
          <div style={{
            height: "4px",
            borderRadius: "24px 24px 0 0",
            background: `linear-gradient(to right, ${s.color}, ${s.color}44, transparent)`,
          }} />

          {/* Header */}
          <div style={{ padding: "28px 32px 0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                {/* Badge */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "3px 12px", borderRadius: 999,
                  border: `1px solid ${s.color}45`, background: `${s.color}14`,
                  fontSize: 9, letterSpacing: "0.3em", color: s.color,
                  textTransform: "uppercase", marginBottom: 14,
                  fontFamily: "'Share Tech Mono', monospace",
                }}>
                  {s.icon} {s.content.badge}
                </div>
                {/* Title */}
                <div style={{
                  fontSize: "clamp(24px,4vw,34px)", fontWeight: 800,
                  color: "#fff", lineHeight: 1.1, marginBottom: 6,
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                  {s.content.title}
                </div>
                {/* Subtitle */}
                <div style={{
                  fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 24,
                  fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.06em",
                }}>
                  {s.content.subtitle}
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.7)", fontSize: 16,
                  cursor: "pointer", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: 4,
                }}
              >
                ✕
              </button>
            </div>

            {/* Divider */}
            <div style={{
              height: 1,
              background: `linear-gradient(to right, ${s.color}55, transparent)`,
              marginBottom: 20,
            }} />
          </div>

          {/* Detail items */}
          <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
            {s.content.items.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "14px 16px", borderRadius: 14,
                background: `${s.color}0d`, border: `1px solid ${s.color}1e`,
                fontSize: 14, color: "rgba(255,255,255,0.88)", lineHeight: 1.5,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}

            {/* Contact links if this is the contact section */}
            {s.id === "contact" && (
              <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                <a href="mailto:abishek02781@gmail.com" style={linkStyle("#3ddc84")}>📧 Email</a>
                <a href="https://github.com/abishek2429" target="_blank" rel="noreferrer" style={linkStyle("#fff")}>💻 GitHub</a>
                <a href="https://linkedin.com/in/abishek-s-a86209247" target="_blank" rel="noreferrer" style={linkStyle("#60a5fa")}>🔗 LinkedIn</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function linkStyle(color: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 18px", borderRadius: 999,
    border: `1px solid ${color}40`, background: `${color}14`,
    color, fontSize: 11, fontFamily: "'Share Tech Mono', monospace",
    letterSpacing: "0.18em", textDecoration: "none",
    transition: "background 0.2s",
  }
}

/* ─────────────────────────────────────────────────────
   TOP HUD
   ───────────────────────────────────────────────────── */
function TopHud({ currentIndex, cameraT }: { currentIndex: number; cameraT: number }) {
  const pct = Math.round(Math.min(cameraT / (STOPS[STOPS.length - 1] || 1), 1) * 100)
  const s   = currentIndex > 0 ? SECTIONS[currentIndex - 1] : SECTIONS[0]

  return (
    <>
      <div className="hud-panel" style={{ position: "fixed", top: 18, left: 24, zIndex: 20, pointerEvents: "none", minWidth: 230 }}>
        <div className="hud-label">Commander</div>
        <div className="font-orbitron" style={{ fontSize: "clamp(15px,2vw,20px)", fontWeight: 700 }}>ABISHEK S</div>
        <div className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", marginTop: 4 }}>
          FULL-STACK DEV · UI/UX DESIGNER
        </div>
      </div>

      <div className="hud-panel" style={{ position: "fixed", top: 18, right: 54, zIndex: 20, pointerEvents: "none", textAlign: "right", minWidth: 110 }}>
        <div className="hud-label" style={{ textAlign: "right" }}>Journey</div>
        <div className="font-orbitron" style={{ fontSize: 18, fontWeight: 700, color: "var(--gold)" }}>{pct}%</div>
        <div className="font-mono" style={{ fontSize: 10, color: s.color, marginTop: 3 }}>
          {s.icon} {s.name.toUpperCase()}
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────
   NAV ARROWS + DOTS
   ───────────────────────────────────────────────────── */
function NavArrows({
  currentIndex,
  onNav,
  locked,
}: {
  currentIndex: number
  onNav: (dir: 1 | -1) => void
  locked: boolean
}) {
  const canPrev = currentIndex > 0
  const canNext = currentIndex < STOPS.length - 1

  const btn = (active: boolean): React.CSSProperties => ({
    width: 44, height: 44, borderRadius: "50%",
    border: `1px solid rgba(255,255,255,${active && !locked ? 0.28 : 0.07})`,
    background: `rgba(255,255,255,${active && !locked ? 0.08 : 0.02})`,
    color: `rgba(255,255,255,${active && !locked ? 0.95 : 0.18})`,
    fontSize: 18, cursor: active && !locked ? "pointer" : "default",
    display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(10px)", transition: "all 0.2s", userSelect: "none",
    pointerEvents: active && !locked ? "auto" : "none",
  })

  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 22, display: "flex", alignItems: "center", gap: 16,
    }}>
      <button id="nav-prev" onClick={() => onNav(-1)} style={btn(canPrev)} aria-label="Previous">←</button>

      {/* Planet dots */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {STOPS.map((_, i) => {
          const active = i === currentIndex
          const color  = i === 0 ? "#ffffff" : (SECTIONS[i - 1]?.color ?? "#fff")
          return (
            <div key={i} style={{
              width: active ? 26 : 8, height: 8, borderRadius: 4,
              background: active ? color : "rgba(255,255,255,0.22)",
              boxShadow: active ? `0 0 10px ${color}90` : "none",
              transition: "width 0.3s, background 0.3s, box-shadow 0.3s",
            }} />
          )
        })}
      </div>

      <button id="nav-next" onClick={() => onNav(1)} style={btn(canNext)} aria-label="Next">→</button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   BOTTOM LINKS
   ───────────────────────────────────────────────────── */
function BottomLinks() {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 18px", borderRadius: 999, fontSize: 11,
    fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.2em",
    textDecoration: "none", backdropFilter: "blur(12px)", transition: "background 0.2s",
  }
  return (
    <div style={{ position: "fixed", bottom: 80, left: 24, zIndex: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
      <a href="mailto:abishek02781@gmail.com"
        style={{ ...base, border: "1px solid rgba(61,220,132,0.4)", background: "rgba(61,220,132,0.12)", color: "#c8ffe0" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(61,220,132,0.22)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(61,220,132,0.12)" }}>
        📧 RECRUIT ME
      </a>
      <a href="https://github.com/abishek2429" target="_blank" rel="noreferrer"
        style={{ ...base, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)" }}>
        💻 GITHUB
      </a>
      <a href="https://linkedin.com/in/abishek-s-a86209247" target="_blank" rel="noreferrer"
        style={{ ...base, border: "1px solid rgba(96,165,250,0.38)", background: "rgba(96,165,250,0.10)", color: "#bfdbfe" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(96,165,250,0.18)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(96,165,250,0.10)" }}>
        🔗 LINKEDIN
      </a>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   "CLICK PLANET" HINT  — shows when camera has arrived
   ───────────────────────────────────────────────────── */
function ClickHint({ visible }: { visible: boolean }) {
  return (
    <div style={{
      position: "fixed", top: "50%", left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 18, pointerEvents: "none",
      opacity: visible ? 1 : 0, transition: "opacity 0.5s ease",
      textAlign: "center",
    }}>
      <div style={{
        padding: "6px 18px", borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(4,5,18,0.7)", backdropFilter: "blur(10px)",
        fontSize: 11, color: "rgba(255,255,255,0.55)",
        fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.22em",
      }}>
        CLICK PLANET TO VIEW DETAILS
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   ROOT
   ───────────────────────────────────────────────────── */
export default function SpaceExplorer() {
  const [launched, setLaunched]       = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cameraT, setCameraT]           = useState(0)
  const [modalId, setModalId]           = useState<string | null>(null)

  /* Refs for stale-closure-safe nav logic */
  const isFlyingRef       = useRef(false)
  const currentIndexRef   = useRef(0)
  const lastNavTimeRef    = useRef(0)

  /* Keep ref in sync */
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])

  /* ── Camera position callback ── */
  const handlePositionChange = useCallback((t: number) => {
    setCameraT(t)
    /* Flying = camera not yet arrived at target */
    isFlyingRef.current = Math.abs(t - STOPS[currentIndexRef.current]) > 0.015
  }, [])

  /* ── Navigate ──
     + 200 ms debounce so one wheel-tick doesn't fire twice  */
  const navigate = useCallback((dir: 1 | -1) => {
    const now = Date.now()
    if (now - lastNavTimeRef.current < 400) return  // debounce 400ms
    lastNavTimeRef.current = now

    setCurrentIndex((prev) => {
      const next = prev + dir
      if (next < 0 || next >= STOPS.length) return prev
      return next
    })
  }, [])

  /* ── Input listeners (wheel / keyboard / touch) ── */
  useEffect(() => {
    if (!launched) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      navigate(e.deltaY > 0 ? 1 : -1)
    }

    let ty = 0
    const onTouchStart = (e: TouchEvent) => { ty = e.touches[0].clientY }
    const onTouchEnd   = (e: TouchEvent) => {
      const diff = ty - e.changedTouches[0].clientY
      if (Math.abs(diff) > 40) navigate(diff > 0 ? 1 : -1)
    }

    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown","PageDown"," "].includes(e.key)) { e.preventDefault(); navigate(1) }
      if (["ArrowUp","PageUp"].includes(e.key))          { e.preventDefault(); navigate(-1) }
    }

    window.addEventListener("wheel",      onWheel,      { passive: false })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchend",   onTouchEnd,   { passive: true })
    window.addEventListener("keydown",    onKey)
    return () => {
      window.removeEventListener("wheel",      onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchend",   onTouchEnd)
      window.removeEventListener("keydown",    onKey)
    }
  }, [launched, navigate])

  const targetT     = STOPS[currentIndex]
  const isFlying    = Math.abs(cameraT - targetT) > 0.015
  const onAPlanet   = currentIndex > 0           // not at intro stop
  const showHint    = onAPlanet && !isFlying && !modalId

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#03040e", overflow: "hidden" }}>

      {/* Three.js canvas */}
      <Canvas
        style={{ position: "absolute", inset: 0 }}
        camera={{ position: [0, 4, 16], fov: 60, near: 0.1, far: 400 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <SpaceScene
            targetT={targetT}
            onPositionChange={handlePositionChange}
            scrollOffset={cameraT}
            onPlanetClick={(id) => setModalId(id)}
          />
        </Suspense>
      </Canvas>

      {/* Launch overlay */}
      {!launched && <LaunchOverlay onComplete={() => setLaunched(true)} />}

      {/* HUD (after launch) */}
      {launched && (
        <>
          <TopHud currentIndex={currentIndex} cameraT={cameraT} />
          <JourneyProgress scrollOffset={cameraT} />
          <BottomLinks />
          <NavArrows currentIndex={currentIndex} onNav={navigate} locked={isFlying} />
          <ClickHint visible={showHint} />
        </>
      )}

      {/* Planet modal (click-to-open) */}
      <PlanetModal sectionId={modalId} onClose={() => setModalId(null)} />
    </div>
  )
}
