import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react"
import {
  ArrowUpRight,
  BadgeInfo,
  BrainCircuit,
  BookOpen,
  Code2,
  ContactRound,
  Cpu,
  Github,
  Globe2,
  HeartPulse,
  Layers3,
  Mail,
  MapPinned,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Triangle,
  UserRound,
  WandSparkles,
  Signal,
} from "lucide-react"

import { LiquidButton } from "@/components/ui/liquid-glass-button"
import { cn } from "@/lib/utils"

type SectionId = "home" | "missions" | "skills" | "contact"

type Toast = {
  id: number
  title: string
  message: string
}

type PlanetSpec = {
  id: SectionId
  name: string
  label: string
  orbit: number
  size: number
  angle: number
  duration: number
  color: string
  glow: string
  description: string
}

const planetSpecs: PlanetSpec[] = [
  {
    id: "home",
    name: "About",
    label: "HOME PLANET",
    orbit: 7,
    size: 122,
    angle: -16,
    duration: 20,
    color: "#3DDC84",
    glow: "rgba(61, 220, 132, 0.42)",
    description: "A living dossier with background, personality, and the spark behind the work.",
  },
  {
    id: "missions",
    name: "Missions",
    label: "MISSION LOG",
    orbit: 12,
    size: 142,
    angle: 112,
    duration: 28,
    color: "#F5C842",
    glow: "rgba(245, 200, 66, 0.35)",
    description: "Four shipped projects, each with a scar, a lesson, and measurable impact.",
  },
  {
    id: "skills",
    name: "Skills",
    label: "CONSTELLATION",
    orbit: 17,
    size: 128,
    angle: 228,
    duration: 34,
    color: "#4AF3FF",
    glow: "rgba(74, 243, 255, 0.34)",
    description: "Capability clusters mapped like star systems, with current unlocks and learning trails.",
  },
  {
    id: "contact",
    name: "Signal",
    label: "TRANSMISSION",
    orbit: 22,
    size: 132,
    angle: 306,
    duration: 40,
    color: "#FF4D4D",
    glow: "rgba(255, 77, 77, 0.4)",
    description: "A direct channel for full-time work, freelance missions, and collaboration.",
  },
]

const missions = [
  {
    title: "OrbitUI",
    difficulty: "★★★☆☆",
    type: "Open Source Library",
    summary:
      "A headless component system built for speed, accessibility, and developer experience.",
    stack: ["React", "TypeScript", "Rollup", "Storybook", "ARIA"],
    result: "Cut component integration time by 60% with zero accessibility debt.",
  },
  {
    title: "NightOwl",
    difficulty: "★★★★☆",
    type: "Productivity Web App",
    summary:
      "A late-night focus app with timers, ambience, and a distraction-free writing mode.",
    stack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Tailwind"],
    result: "Reached 350+ active users in the first month with 47-minute average sessions.",
  },
  {
    title: "Mappr",
    difficulty: "★★★★★",
    type: "Data Visualization Tool",
    summary:
      "A drag-and-drop geo-visualization platform for turning CSV data into live maps.",
    stack: ["React", "D3.js", "Express", "Mapbox GL JS", "PostGIS"],
    result: "Featured in data journalism newsletters and stress-tested at 1.2M data points.",
  },
  {
    title: "Pulseboard",
    difficulty: "★★★☆☆",
    type: "Analytics Dashboard",
    summary: "A real-time analytics cockpit for indie makers who need signal, not enterprise clutter.",
    stack: ["React", "Recharts", "WebSockets", "Node.js", "PostgreSQL"],
    result: "Zero-config setup under 5 minutes and adoption by 12 indie projects in week one.",
  },
]

const skillConstellations = [
  {
    title: "The Builder",
    icon: Code2,
    tone: "from-[#3DDC84] to-[#7CF3A6]",
    nodes: [
      "React.js — component-driven UI, hooks, context, performance optimization",
      "Next.js — SSR, SSG, API routes, full-stack React apps",
      "Node.js — REST APIs, middleware, authentication systems",
      "TypeScript — typed frontend and backend development",
    ],
  },
  {
    title: "The Stylist",
    icon: Layers3,
    tone: "from-[#4AF3FF] to-[#B0F7FF]",
    nodes: [
      "Tailwind CSS — utility-first styling, responsive design, dark mode",
      "Figma — wireframing, prototyping, design systems",
      "CSS / SCSS — animations, custom properties, advanced layouts",
    ],
  },
  {
    title: "The Operator",
    icon: ShieldCheck,
    tone: "from-[#F5C842] to-[#FCE69C]",
    nodes: [
      "Git & GitHub — branching strategies, pull request workflows",
      "Docker — containerization and portable development environments",
      "Linux — command line, shell scripting, server management",
      "PostgreSQL — schema design and query optimization",
    ],
  },
  {
    title: "Currently Leveling",
    icon: BrainCircuit,
    tone: "from-[#FF4D4D] to-[#FF9A9A]",
    nodes: ["Three.js & React Three Fiber — 3D web experiences", "Rust — systems programming and performance"],
  },
]

const stars = Array.from({ length: 48 }, (_, index) => {
  const left = (index * 13) % 100
  const top = (index * 29) % 100
  const size = 1 + (index % 3)
  const opacity = 0.2 + ((index * 7) % 10) / 20

  return {
    id: index,
    left: `${left}%`,
    top: `${top}%`,
    size,
    opacity,
  }
})

const rankThresholds = [
  { label: "Cadet", min: 0 },
  { label: "Lieutenant", min: 25 },
  { label: "Commander", min: 60 },
  { label: "Legend", min: 90 },
] as const

const sectionMeta: Record<
  SectionId,
  {
    eyebrow: string
    title: string
    lead: string
    accent: string
    icon: typeof UserRound
  }
> = {
  home: {
    eyebrow: "Commander Dossier",
    title: "Abishek S",
    lead:
      "Full-stack developer and UI/UX designer based in Coimbatore, building systems that feel alive.",
    accent: "#3DDC84",
    icon: UserRound,
  },
  missions: {
    eyebrow: "Mission Log",
    title: "Four completed missions",
    lead:
      "Each project shipped something meaningful, taught hard lessons, and left a visible scar on the timeline.",
    accent: "#F5C842",
    icon: Rocket,
  },
  skills: {
    eyebrow: "Skill Constellation",
    title: "Capability clusters",
    lead: "Disciplines organized like star systems, with current unlocks and a clear upgrade path.",
    accent: "#4AF3FF",
    icon: Star,
  },
  contact: {
    eyebrow: "Transmission Hub",
    title: "Open channel",
    lead: "Recruitment-ready, available for freelance work, and open to collaboration.",
    accent: "#FF4D4D",
    icon: ContactRound,
  },
}

const contactLinks = [
  {
    label: "Email",
    value: "abishek02781@gmail.com",
    href: "mailto:abishek02781@gmail.com",
    icon: Mail,
  },
  {
    label: "GitHub",
    value: "github.com/abishek2429",
    href: "https://github.com/abishek2429",
    icon: Github,
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/abishek-s-a86209247",
    href: "https://linkedin.com/in/abishek-s-a86209247",
    icon: Globe2,
  },
]

function getRank(xp: number) {
  return [...rankThresholds].reverse().find((tier) => xp >= tier.min) ?? rankThresholds[0]
}

function App() {
  const [screen, setScreen] = useState<"control" | "space">("control")
  const [selectedSection, setSelectedSection] = useState<SectionId>("home")
  const [launchState, setLaunchState] = useState<"idle" | "countdown" | "warp">("idle")
  const [countdown, setCountdown] = useState(3)
  const [xp, setXp] = useState(0)
  const [legendToast, setLegendToast] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [blackHoleClicks, setBlackHoleClicks] = useState(0)
  const [blackHoleActive, setBlackHoleActive] = useState(false)
  const [visited, setVisited] = useState<Record<SectionId, boolean>>({
    home: false,
    missions: false,
    skills: false,
    contact: false,
  })
  const rootRef = useRef<HTMLDivElement | null>(null)
  const pointerRafRef = useRef<number | null>(null)

  const rank = useMemo(() => getRank(xp), [xp])
  const section = sectionMeta[selectedSection]
  const currentPlanet = planetSpecs.find((planet) => planet.id === selectedSection) ?? planetSpecs[0]
  const systemStatus = screen === "space" ? "Solar system online" : "Mission control ready"

  useEffect(() => {
    const rootElement = rootRef.current
    if (!rootElement) return

    const handlePointerMove = (event: globalThis.MouseEvent) => {
      if (screen !== "space") return

      if (pointerRafRef.current !== null) {
        window.cancelAnimationFrame(pointerRafRef.current)
      }

      pointerRafRef.current = window.requestAnimationFrame(() => {
        const horizontalRatio = (event.clientX / window.innerWidth) * 2 - 1
        const verticalRatio = (event.clientY / window.innerHeight) * 2 - 1

        const x = Math.max(-3, Math.min(3, horizontalRatio * 3))
        const y = Math.max(-2, Math.min(2, verticalRatio * 2))

        rootElement.style.setProperty("--tilt-x", `${y}deg`)
        rootElement.style.setProperty("--tilt-y", `${x}deg`)
      })
    }

    window.addEventListener("mousemove", handlePointerMove, { passive: true })
    return () => {
      if (pointerRafRef.current !== null) {
        window.cancelAnimationFrame(pointerRafRef.current)
      }
      window.removeEventListener("mousemove", handlePointerMove)
    }
  }, [screen])

  useEffect(() => {
    if (screen !== "space") return

    setVisited((previous) => {
      if (previous[selectedSection]) return previous

      const next = { ...previous, [selectedSection]: true }
      setXp((value) => value + 20)

      if (selectedSection === "home") {
        pushToast("Dossier accessed", "Home planet unlocked and your profile is now in view.")
      }

      if (selectedSection === "missions") {
        pushToast("Mission log opened", "Four completed missions are now available for review.")
      }

      if (selectedSection === "skills") {
        pushToast("Skill tree unlocked", "The constellation map is now live.")
      }

      if (selectedSection === "contact") {
        pushToast("Transmission channel open", "The distress ping has been answered.")
      }

      return next
    })
  }, [screen, selectedSection])

  useEffect(() => {
    if (legendToast || xp < 90) return

    setLegendToast(true)
    pushToast("Legend unlocked", "You crossed 90 XP and revealed the hidden rank badge.")
  }, [legendToast, xp])

  useEffect(() => {
    if (!blackHoleActive) return

    const timer = window.setTimeout(() => {
      setBlackHoleActive(false)
      setBlackHoleClicks(0)
      setLaunchState("idle")
      setScreen("control")
      setSelectedSection("home")
      pushToast("Temporal reset", "You weren’t supposed to find that.")
    }, 1400)

    return () => window.clearTimeout(timer)
  }, [blackHoleActive])

  function pushToast(title: string, message: string) {
    const id = window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 4200)

    setToasts((current) => [...current, { id, title, message }])
  }

  function beginLaunch() {
    if (launchState !== "idle") return

    setXp((value) => value + 10)
    setLaunchState("countdown")
    setCountdown(3)
    pushToast("Launch sequence armed", "Warp drive charging and cockpit HUD stabilizing.")

    window.setTimeout(() => setCountdown(2), 700)
    window.setTimeout(() => setCountdown(1), 1400)
    window.setTimeout(() => {
      setLaunchState("warp")
      setScreen("space")
      setSelectedSection("home")
      pushToast("Warp drive engaged", "Welcome to Commander Abishek’s solar system.")
    }, 2100)
    window.setTimeout(() => {
      setLaunchState("idle")
    }, 3200)
  }

  function activateBlackHole() {
    if (screen !== "space" || blackHoleActive) return

    setBlackHoleClicks((value) => {
      const next = value + 1
      if (next >= 3) {
        setBlackHoleActive(true)
        pushToast("Gravity anomaly", "A hidden singularity has been detected.")
        return 0
      }
      return next
    })
  }

  function handlePlanetSelect(sectionId: SectionId) {
    if (launchState !== "idle" && screen === "control") return
    setSelectedSection(sectionId)
  }

  const detailLines = useMemo(() => {
    if (selectedSection === "home") {
      return [
        "Role: Full-Stack Developer & UI/UX Designer",
        "Location: Coimbatore, Tamil Nadu, India",
        "Status: Open to missions and recruitment",
      ]
    }

    if (selectedSection === "missions") {
      return [
        "Four shipped missions with measurable user impact.",
        "Built for speed, clarity, and product outcomes.",
        "Each mission is documented with a difficulty rating and stack.",
      ]
    }

    if (selectedSection === "skills") {
      return [
        "Frontend, backend, design, and operations as separate constellations.",
        "Strong with React, Next.js, Node.js, TypeScript, and Tailwind CSS.",
        "Learning: Three.js, React Three Fiber, and Rust.",
      ]
    }

    return [
      "Open for full-time, freelance, and collaboration missions.",
      "Fast response time via email and social channels.",
      "Recruit me. I’m ready.",
    ]
  }, [selectedSection])

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative min-h-screen overflow-hidden text-white",
        blackHoleActive && "animate-[shake_0.7s_ease-in-out_2]"
      )}
      style={{ ["--tilt-x" as never]: "0deg", ["--tilt-y" as never]: "0deg" } as CSSProperties}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(74,243,255,0.14),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(245,200,66,0.12),transparent_24%),radial-gradient(circle_at_55%_82%,rgba(61,220,132,0.1),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:96px_96px]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {stars.map((star) => (
          <span
            key={star.id}
            className="absolute rounded-full bg-white star-twinkle"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {launchState === "countdown" && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-[#04040D]/70 backdrop-blur-sm">
          <div className="text-center">
            <div className="font-display text-7xl text-[#FF4D4D] md:text-9xl">{countdown}</div>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.5em] text-white/70">
              Warp drive charging
            </p>
          </div>
        </div>
      )}

      {launchState === "warp" && (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden bg-[#04040D]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(74,243,255,0.18),transparent_35%),radial-gradient(circle_at_center,rgba(245,200,66,0.1),transparent_55%)]" />
          {Array.from({ length: 90 }, (_, index) => {
            const position = (index * 37) % 100
            const lane = 10 + (index % 80)
            const duration = 0.45 + (index % 8) * 0.08
            return (
              <span
                key={index}
                className="absolute left-1/2 top-1/2 h-[2px] rounded-full bg-[#4AF3FF] opacity-80 warp-streak"
                style={{
                  width: `${lane}px`,
                  transform: `translate(-50%, -50%) translateY(${position - 50}vh)`,
                  animationDuration: `${duration}s`,
                }}
              />
            )
          })}
        </div>
      )}

      {blackHoleActive && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-[#04040D]/80 backdrop-blur-md">
          <div className="relative h-48 w-48 md:h-72 md:w-72">
            <div className="absolute inset-0 rounded-full border border-[#4AF3FF]/30 bg-[#0a0c16] shadow-[0_0_90px_rgba(74,243,255,0.35)] black-hole-core" />
            <div className="absolute inset-6 rounded-full border border-[#FF4D4D]/40 opacity-80 black-hole-ring" />
            <div className="absolute inset-10 rounded-full border border-[#F5C842]/25 opacity-70 black-hole-ring" />
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(74,243,255,0.12),transparent_58%)]" />
          </div>
        </div>
      )}

      <header className="relative z-20 border-b border-white/10 bg-[#050712]/55 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F5C842]/25 bg-[#F5C842]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[#F5C842]">
              <Sparkles className="h-3.5 w-3.5" />
              Commander Abishek
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white/70">
              {systemStatus}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/75">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              XP {xp}
            </div>
            <div className="rounded-full border border-[#4AF3FF]/20 bg-[#4AF3FF]/10 px-3 py-2 text-[#4AF3FF]">
              Rank {rank.label}
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              {screen === "space" ? "Exploration mode" : "Mission control"}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 pb-16 md:px-8 lg:grid-cols-[0.94fr_1.06fr] lg:py-8">
        <section className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.55em] text-[#F5C842]/90">
                  Mission Control
                </p>
                <h1 className="mt-3 font-display text-4xl tracking-tight text-white md:text-6xl">
                  Space Explorer Portfolio
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/72 md:text-base">
                  You do not scroll this portfolio. You launch it, fly the system, and recruit Commander Abishek by
                  uncovering each planet.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-right">
                <div className="font-display text-2xl text-[#4AF3FF] md:text-3xl">{rank.label}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.45em] text-white/60">
                  {Math.min(xp, 100)} XP
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Open to missions", value: "Yes", icon: ShieldCheck },
                { label: "Primary orbit", value: "Product + Code", icon: Cpu },
                { label: "Signal strength", value: "Strong", icon: HeartPulse },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <item.icon className="h-4 w-4 text-[#4AF3FF]" />
                  <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.35em] text-white/55">
                    {item.label}
                  </div>
                  <div className="mt-2 font-display text-2xl text-white">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <LiquidButton
                className="rounded-full border border-[#F5C842]/30 bg-[#F5C842]/15 px-6 text-[#F5C842] hover:bg-[#F5C842]/25"
                size="xl"
                onClick={beginLaunch}
                disabled={launchState !== "idle"}
              >
                Launch Mission
                <Rocket className="ml-2 h-4 w-4" />
              </LiquidButton>

              <LiquidButton
                asChild
                className="rounded-full border border-white/15 bg-white/5 px-6 text-white/90 hover:bg-white/10"
                size="xl"
              >
                <a href="mailto:abishek02781@gmail.com">
                  Recruit Me
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </a>
              </LiquidButton>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-[#3DDC84]">
                <BadgeInfo className="h-4 w-4" />
                Dossier
              </div>
              <div className="mt-4 space-y-3">
                <h2 className="font-display text-3xl text-white">Abishek S</h2>
                <p className="text-sm leading-7 text-white/72">
                  Full-stack developer and designer based in Coimbatore, Tamil Nadu. He builds things that feel alive
                  and ships work that blends engineering with craft.
                </p>
                <div className="space-y-2 font-mono text-[11px] uppercase tracking-[0.28em] text-white/60">
                  {detailLines.map((line) => (
                    <div key={line} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-[#4AF3FF]">
                <MapPinned className="h-4 w-4" />
                Coordinates
              </div>
              <div className="mt-4 space-y-3">
                <div className="font-display text-3xl text-white">Coimbatore, Tamil Nadu</div>
                <p className="text-sm leading-7 text-white/72">
                  Open to full-time, freelance, and collaboration missions. Response window: fast.
                </p>
                <div className="grid gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-white/60">
                  {[
                    "Email: abishek02781@gmail.com",
                    "GitHub: github.com/abishek2429",
                    "LinkedIn: linkedin.com/in/abishek-s-a86209247",
                  ].map((item) => (
                    <div key={item} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl md:p-6">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-[#F5C842]">
              <WandSparkles className="h-4 w-4" />
              Narrative Arc
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {[
                "Stranger reading a dossier",
                "Curious explorer in orbit",
                "Discovering the human details",
                "Ready to recruit Commander Abishek",
              ].map((step, index) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="font-display text-2xl text-[#4AF3FF]">0{index + 1}</div>
                  <p className="mt-3 text-sm leading-6 text-white/75">{step}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="relative min-h-[36rem] lg:min-h-[46rem]">
          <div
            className="relative mx-auto aspect-square w-[min(92vw,44rem)] max-w-full overflow-visible"
            onClick={screen === "space" ? activateBlackHole : undefined}
          >
            <div
              className={cn(
                "relative h-full w-full rounded-full border border-[#4AF3FF]/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),rgba(255,255,255,0.015)_28%,rgba(4,4,13,0)_62%)] shadow-[inset_0_0_100px_rgba(74,243,255,0.06)] transition-transform duration-300",
                screen === "space" && "space-stage"
              )}
            >
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(245,200,66,0.26),rgba(245,200,66,0.12)_14%,rgba(245,200,66,0.02)_30%,transparent_58%)] sun-glow" />
              <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#F5C842]/30 bg-[radial-gradient(circle_at_35%_35%,#fff7c7,#f5c842_42%,#9c6d0c_100%)] shadow-[0_0_80px_rgba(245,200,66,0.35)] sun-core" />
              <div className="absolute left-1/2 top-1/2 h-[2px] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4AF3FF]/18" />

              {planetSpecs.map((planet) => {
                const isActive = selectedSection === planet.id

                return (
                  <button
                    key={planet.id}
                    type="button"
                    aria-pressed={isActive}
                    className={cn(
                      "planet-orbit group absolute left-1/2 top-1/2 rounded-full border border-white/6",
                      isActive && "planet-orbit-active"
                    )}
                    style={{
                      width: `${planet.orbit * 2.15}rem`,
                      height: `${planet.orbit * 2.15}rem`,
                      marginLeft: `-${planet.orbit * 1.075}rem`,
                      marginTop: `-${planet.orbit * 1.075}rem`,
                      animationDuration: `${planet.duration}s`,
                      animationDelay: `${planet.angle * -18}ms`,
                    }}
                    onClick={(event) => {
                      event.stopPropagation()
                      handlePlanetSelect(planet.id)
                    }}
                  >
                    <span
                      className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 planet-core"
                      style={{
                        width: `${planet.size / 3.5}px`,
                        height: `${planet.size / 3.5}px`,
                        background:
                          selectedSection === planet.id
                            ? `radial-gradient(circle at 30% 30%, #ffffff 0%, ${planet.color} 36%, #0d1120 100%)`
                            : `radial-gradient(circle at 30% 30%, #ffffff 0%, ${planet.color} 34%, #0d1120 100%)`,
                        boxShadow: `0 0 0 10px ${planet.glow}, 0 0 42px ${planet.glow}`,
                      }}
                    >
                      {planet.id === "missions" && (
                        <span className="absolute -right-5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#d5b35a] shadow-[0_0_14px_rgba(245,200,66,0.65)] moon-orbit" />
                      )}

                      {planet.id === "contact" && (
                        <span className="absolute inset-0 rounded-full border border-[#FF4D4D]/30 pulse-ring" />
                      )}
                    </span>

                    <span className="absolute left-1/2 top-[calc(50%+4.9rem)] -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.34em] text-white/72 opacity-0 transition-opacity group-hover:opacity-100">
                      {planet.name}
                    </span>
                  </button>
                )
              })}

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-[8.2rem] rounded-full border border-white/10 bg-black/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.35em] text-white/65">
                Tap a planet to deploy details
              </div>
            </div>
          </div>

          {screen === "space" && (
            <button
              type="button"
              className="absolute bottom-6 right-4 z-20 inline-flex items-center gap-2 rounded-full border border-[#FF4D4D]/30 bg-[#FF4D4D]/12 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.35em] text-[#FF8A8A] shadow-[0_0_24px_rgba(255,77,77,0.18)] backdrop-blur-xl transition hover:bg-[#FF4D4D]/18 md:bottom-10 md:right-10"
              onClick={(event) => {
                event.stopPropagation()
                handlePlanetSelect("contact")
              }}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF4D4D] animate-pulse" />
              Distress signal
            </button>
          )}
        </section>
      </main>

      <section className="relative z-20 mx-auto w-full max-w-7xl px-4 pb-14 md:px-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-2xl md:p-6">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-white/60">
              <Triangle className="h-4 w-4 text-[#4AF3FF]" />
              {section.eyebrow}
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl text-white md:text-4xl">{section.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72 md:text-base">{section.lead}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <section.icon className="h-5 w-5" style={{ color: section.accent }} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {detailLines.map((line) => (
                <div key={line} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white/75">
                  {line}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-2xl md:p-6">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-[#F5C842]">
              <BookOpen className="h-4 w-4" />
              Orbit Readout
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/55">Current Planet</div>
                <div className="mt-3 font-display text-2xl text-white">{currentPlanet.name}</div>
                <p className="mt-2 text-sm leading-6 text-white/70">{currentPlanet.description}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/55">Rank Progress</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#3DDC84,#4AF3FF,#F5C842)]"
                      style={{ width: `${Math.min((xp / 90) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/65">
                    {rank.min}/90
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Every planet visited adds 20 XP. Launching adds 10 XP. Rank upgrades unlock at 25, 60, and 90 XP.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="relative z-20 mx-auto grid w-full max-w-7xl gap-4 px-4 pb-20 md:px-8 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-2xl md:p-6">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-[#4AF3FF]">
            <Layers3 className="h-4 w-4" />
            Mission Log
          </div>
          <div className="mt-4 grid gap-3">
            {missions.map((mission) => (
              <div key={mission.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-2xl text-white">{mission.title}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white/55">
                      {mission.type}
                    </div>
                  </div>
                  <div className="rounded-full border border-[#F5C842]/20 bg-[#F5C842]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-[#F5C842]">
                    Difficulty {mission.difficulty}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/72">{mission.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {mission.stack.map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/65">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-4 border-l-2 border-[#3DDC84]/70 pl-3 text-sm leading-6 text-white/72">
                  {mission.result}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-2xl md:p-6">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-[#3DDC84]">
            <Cpu className="h-4 w-4" />
            Skill Constellation
          </div>
          <div className="mt-4 grid gap-3">
            {skillConstellations.map((cluster) => (
              <div key={cluster.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-xl bg-gradient-to-br p-2", cluster.tone)}>
                    <cluster.icon className="h-4 w-4 text-[#04040D]" />
                  </div>
                  <div>
                    <div className="font-display text-2xl text-white">{cluster.title}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/55">
                      Unlock level: active
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm leading-7 text-white/72">
                  {cluster.nodes.map((node) => (
                    <div key={node} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                      {node}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="relative z-20 mx-auto w-full max-w-7xl px-4 pb-24 md:px-8">
        <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-2xl md:p-6">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-[#FF4D4D]">
            <ContactRound className="h-4 w-4" />
            Transmission Hub
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="font-display text-3xl text-white md:text-4xl">Recruit me. I&apos;m ready.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                Open to full-time, freelance, and collaboration missions. If the mission needs product judgment,
                interactive interfaces, or end-to-end delivery, the channel is open.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {contactLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-[#4AF3FF]/30 hover:bg-white/[0.07]"
                  >
                    <item.icon className="h-4 w-4 text-[#4AF3FF]" />
                    <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.35em] text-white/55">
                      {item.label}
                    </div>
                    <div className="mt-2 break-words text-sm leading-6 text-white/85">{item.value}</div>
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-4">
              <div className="rounded-[1.5rem] border border-white/8 bg-[radial-gradient(circle_at_center,rgba(74,243,255,0.14),rgba(4,4,13,0.95)_60%)] p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/60">
                  Availability status
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-[#3DDC84] shadow-[0_0_18px_rgba(61,220,132,0.75)]" />
                  <div className="font-display text-3xl text-[#3DDC84]">Open</div>
                </div>
                <div className="mt-3 grid gap-2 text-sm leading-6 text-white/72">
                  <div>Role: Full-Stack Developer & UI/UX Designer</div>
                  <div>Email: abishek02781@gmail.com</div>
                  <div>GitHub: github.com/abishek2429</div>
                  <div>LinkedIn: linkedin.com/in/abishek-s-a86209247</div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#4AF3FF]/15 bg-[#4AF3FF]/8 p-4 text-sm leading-7 text-white/76">
                  Status line: building things that feel alive.
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>

      <div className="pointer-events-none fixed right-4 top-4 z-30 flex w-[min(92vw,24rem)] flex-col gap-3 md:right-8 md:top-8">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-card pointer-events-auto rounded-2xl border border-[#F5C842]/20 bg-[#0a0d18]/88 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#F5C842]">
              Achievement toast
            </div>
            <div className="mt-1 font-display text-lg text-white">{toast.title}</div>
            <p className="mt-1 text-sm leading-6 text-white/72">{toast.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
