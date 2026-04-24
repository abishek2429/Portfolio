import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Html, Stars } from "@react-three/drei"
import * as THREE from "three"
import { ArrowUpRight, MapPinned, Rocket } from "lucide-react"

type SectionId = "home" | "missions" | "skills" | "contact"

type Planet = {
  id: SectionId
  name: string
  color: string
  position: [number, number, number]
  radius: number
  description: string
}

const planets: Planet[] = [
  {
    id: "home",
    name: "Home",
    color: "#3ddc84",
    position: [0, 0, 0],
    radius: 1.8,
    description: "Commander dossier and identity core.",
  },
  {
    id: "missions",
    name: "Missions",
    color: "#f5c842",
    position: [20, 1, -14],
    radius: 2.3,
    description: "Project log and shipped outcomes.",
  },
  {
    id: "skills",
    name: "Skills",
    color: "#4af3ff",
    position: [-18, -1, -30],
    radius: 2.0,
    description: "Capability constellation and tool stack.",
  },
  {
    id: "contact",
    name: "Contact",
    color: "#ff5f5f",
    position: [10, 0, -48],
    radius: 2.4,
    description: "Recruitment transmission node.",
  },
]

const sectionContent: Record<SectionId, { title: string; lines: string[] }> = {
  home: {
    title: "Abishek S",
    lines: [
      "Full-Stack Developer and UI/UX Designer",
      "Coimbatore, Tamil Nadu, India",
      "Builds product-focused interfaces and complete systems",
    ],
  },
  missions: {
    title: "Mission Log",
    lines: [
      "OrbitUI - accessible component system",
      "NightOwl - focus app with retention",
      "Mappr - data visualization tool",
      "Pulseboard - real-time analytics cockpit",
    ],
  },
  skills: {
    title: "Skill Constellation",
    lines: [
      "React, TypeScript, Node.js, Next.js",
      "Tailwind CSS, Figma, design systems",
      "GitHub, Docker, Linux, PostgreSQL",
      "Learning Three.js and Rust",
    ],
  },
  contact: {
    title: "Transmission Hub",
    lines: [
      "Email: abishek02781@gmail.com",
      "GitHub: github.com/abishek2429",
      "LinkedIn: linkedin.com/in/abishek-s-a86209247",
      "Open for full-time, freelance, and collaboration",
    ],
  },
}

function PlanetNode({ planet, active, unlocked }: { planet: Planet; active: boolean; unlocked: boolean }) {
  const mesh = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!mesh.current) return
    mesh.current.rotation.y += 0.003
    mesh.current.position.y = planet.position[1] + Math.sin(state.clock.elapsedTime * 1.3 + planet.radius) * 0.2
  })

  return (
    <group position={planet.position}>
      <mesh ref={mesh}>
        <sphereGeometry args={[planet.radius, 36, 36]} />
        <meshStandardMaterial
          color={planet.color}
          emissive={active ? planet.color : "#000000"}
          emissiveIntensity={active ? 0.9 : 0.25}
          roughness={0.45}
          metalness={0.15}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[planet.radius * 1.55, 20, 20]} />
        <meshBasicMaterial color={planet.color} transparent opacity={0.08} />
      </mesh>

      <Html center position={[0, planet.radius + 1.55, 0]} distanceFactor={10}>
        <div
          className="rounded-full border border-white/25 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white"
          style={{ boxShadow: active ? `0 0 24px ${planet.color}` : "none" }}
        >
          {planet.name} {unlocked ? "Unlocked" : "Locked"}
        </div>
      </Html>
    </group>
  )
}

function Ship({ position }: { position: THREE.Vector3 }) {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!group.current) return
    group.current.position.copy(position)
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 2.5) * 0.08
    group.current.position.y += Math.sin(state.clock.elapsedTime * 8) * 0.06
  })

  return (
    <group ref={group}>
      <mesh>
        <capsuleGeometry args={[0.55, 1.4, 8, 16]} />
        <meshStandardMaterial color="#eff9ff" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.55, 0.25]}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial color="#4af3ff" emissive="#4af3ff" emissiveIntensity={1.3} />
      </mesh>
      <mesh position={[0, -0.95, 0]}>
        <coneGeometry args={[0.34, 0.9, 10]} />
        <meshStandardMaterial color="#f5c842" emissive="#f5c842" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}

function CameraRig({ target }: { target: THREE.Vector3 }) {
  const { camera } = useThree()

  useFrame((_, delta) => {
    const desired = new THREE.Vector3(target.x, target.y + 4.8, target.z + 11.5)
    camera.position.lerp(desired, Math.min(delta * 3.2, 1))
    camera.lookAt(target.x, target.y + 0.5, target.z - 7)
  })

  return null
}

function SpaceScene({
  shipPosition,
  activeSection,
  unlocked,
}: {
  shipPosition: THREE.Vector3
  activeSection: SectionId
  unlocked: Record<SectionId, boolean>
}) {
  const debris = useMemo(
    () =>
      Array.from({ length: 180 }, (_, index) => {
        const x = ((index * 11) % 90) - 45
        const y = ((index * 7) % 18) - 9
        const z = -((index * 17) % 110)
        return [x, y, z] as [number, number, number]
      }),
    []
  )

  return (
    <>
      <color attach="background" args={["#050814"]} />
      <fog attach="fog" args={["#050814", 18, 140]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[12, 10, 8]} intensity={1.15} color="#dbeeff" />
      <pointLight position={[0, 0, 0]} intensity={80} distance={160} color="#4af3ff" />

      <Stars radius={150} depth={100} count={5000} factor={6} saturation={0.2} fade speed={0.55} />

      {debris.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.05 + (index % 3) * 0.04, 6, 6]} />
          <meshBasicMaterial color={index % 2 === 0 ? "#4af3ff" : "#f5c842"} transparent opacity={0.5} />
        </mesh>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.8, -24]}>
        <planeGeometry args={[220, 220, 1, 1]} />
        <meshStandardMaterial color="#09111d" roughness={1} metalness={0} />
      </mesh>

      <mesh position={[0, 0, -24]}>
        <sphereGeometry args={[9, 32, 32]} />
        <meshStandardMaterial color="#f5c842" emissive="#f5c842" emissiveIntensity={1.2} />
      </mesh>

      {planets.map((planet) => (
        <PlanetNode
          key={planet.id}
          planet={planet}
          active={planet.id === activeSection}
          unlocked={unlocked[planet.id]}
        />
      ))}

      <Ship position={shipPosition} />
      <CameraRig target={shipPosition} />
    </>
  )
}

function App() {
  const [shipPosition, setShipPosition] = useState(() => new THREE.Vector3(0, 0, 8))
  const [activeSection, setActiveSection] = useState<SectionId>("home")
  const [unlocked, setUnlocked] = useState<Record<SectionId, boolean>>({
    home: true,
    missions: false,
    skills: false,
    contact: false,
  })
  const keys = useRef(new Set<string>())

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      keys.current.add(event.key.toLowerCase())
    }

    const onKeyUp = (event: KeyboardEvent) => {
      keys.current.delete(event.key.toLowerCase())
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [])

  useEffect(() => {
    let raf = 0

    const step = () => {
      setShipPosition((current) => {
        const next = current.clone()
        const speed = 0.34
        const forward = keys.current.has("w") || keys.current.has("arrowup")
        const backward = keys.current.has("s") || keys.current.has("arrowdown")
        const left = keys.current.has("a") || keys.current.has("arrowleft")
        const right = keys.current.has("d") || keys.current.has("arrowright")

        if (forward) next.z -= speed
        if (backward) next.z += speed
        if (left) next.x -= speed
        if (right) next.x += speed

        next.x = THREE.MathUtils.clamp(next.x, -46, 46)
        next.z = THREE.MathUtils.clamp(next.z, -58, 18)
        return next
      })

      raf = window.requestAnimationFrame(step)
    }

    raf = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(raf)
  }, [])

  const nearest = useMemo(() => {
    return planets
      .map((planet) => ({ planet, distance: shipPosition.distanceTo(new THREE.Vector3(...planet.position)) }))
      .sort((a, b) => a.distance - b.distance)[0]
  }, [shipPosition])

  const canDock = nearest.distance < nearest.planet.radius + 2.8
  const xp = Object.values(unlocked).filter(Boolean).length * 25
  const section = sectionContent[activeSection]

  function dockNearest() {
    if (!canDock) return
    setActiveSection(nearest.planet.id)
    setUnlocked((current) => ({ ...current, [nearest.planet.id]: true }))
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050814] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(74,243,255,0.18),transparent_28%),radial-gradient(circle_at_82%_10%,rgba(245,200,66,0.14),transparent_24%),radial-gradient(circle_at_50%_78%,rgba(61,220,132,0.12),transparent_28%)]" />
      <Canvas className="absolute inset-0" camera={{ position: [0, 5.5, 18], fov: 58 }}>
        <SpaceScene shipPosition={shipPosition} activeSection={activeSection} unlocked={unlocked} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:120px_120px] opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.52)_100%)]" />

      <header className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex items-start justify-between gap-4 md:left-8 md:right-8 md:top-6">
        <div className="max-w-xl rounded-3xl border border-white/15 bg-black/50 p-4 backdrop-blur-xl md:p-5">
          <div className="text-[11px] uppercase tracking-[0.35em] text-[#4af3ff]">Space Career Quest</div>
          <h1 className="mt-2 font-display text-2xl md:text-4xl">Travel the galaxy in 3D</h1>
          <p className="mt-2 text-sm leading-6 text-white/75 md:text-base">
            Pilot the character with WASD or arrow keys, fly toward a planet, and dock to unlock that part of the portfolio.
          </p>
        </div>

        <div className="rounded-3xl border border-white/15 bg-black/50 px-4 py-3 text-right backdrop-blur-xl md:px-5">
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/60">XP</div>
          <div className="font-display text-3xl text-[#f5c842]">{xp}</div>
        </div>
      </header>

      <aside className="pointer-events-none absolute left-4 top-[42%] z-10 w-[min(92vw,24rem)] -translate-y-1/2 space-y-3 md:left-8 md:w-[26rem]">
        <div className="rounded-3xl border border-white/15 bg-black/50 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#4af3ff]">
            <Rocket className="h-4 w-4" />
            Flight HUD
          </div>
          <div className="mt-3 text-sm text-white/82">Nearest planet: {nearest.planet.name}</div>
          <div className="mt-1 text-sm text-white/68">Distance: {nearest.distance.toFixed(1)} units</div>
          <div className="mt-1 text-sm text-white/68">{nearest.planet.description}</div>

          <button
            type="button"
            className="pointer-events-auto mt-4 inline-flex items-center gap-2 rounded-full border border-[#4af3ff]/45 bg-[#4af3ff]/18 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#b7fbff] disabled:cursor-not-allowed disabled:opacity-45"
            onClick={dockNearest}
            disabled={!canDock}
          >
            Dock Now
            <MapPinned className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-3xl border border-white/15 bg-black/50 p-4 backdrop-blur-xl">
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#f5c842]">{section.title}</div>
          <div className="mt-3 space-y-2">
            {section.lines.map((line) => (
              <div key={line} className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white/82">
                {line}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <footer className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-3 md:left-8 md:right-8 md:flex-row md:items-end md:justify-between">
        <div className="rounded-3xl border border-white/15 bg-black/50 p-4 backdrop-blur-xl">
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/55">Controls</div>
          <div className="mt-2 text-sm text-white/75">WASD or arrow keys to steer. Dock near a planet to unlock it.</div>
        </div>

        <div className="pointer-events-auto flex flex-wrap gap-2">
          <a
            href="mailto:abishek02781@gmail.com"
            className="inline-flex items-center gap-2 rounded-full border border-[#3ddc84]/40 bg-[#3ddc84]/18 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#c8ffe0]"
          >
            Recruit Me
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <a
            href="https://github.com/abishek2429"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
          >
            GitHub
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </footer>

      <div className="pointer-events-none absolute right-4 top-24 z-10 w-[min(92vw,18rem)] rounded-3xl border border-white/15 bg-black/50 p-4 backdrop-blur-xl md:right-8">
        <div className="text-[11px] uppercase tracking-[0.3em] text-white/55">Sector status</div>
        <div className="mt-2 grid gap-2 text-sm text-white/78">
          <div>Home: {unlocked.home ? "Unlocked" : "Locked"}</div>
          <div>Missions: {unlocked.missions ? "Unlocked" : "Locked"}</div>
          <div>Skills: {unlocked.skills ? "Unlocked" : "Locked"}</div>
          <div>Contact: {unlocked.contact ? "Unlocked" : "Locked"}</div>
        </div>
      </div>
    </div>
  )
}

export default App
