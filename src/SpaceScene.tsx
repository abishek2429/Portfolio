import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Html, Stars } from "@react-three/drei"
import * as THREE from "three"
import { SECTIONS, CAMERA_WAYPOINTS, type Section } from "./data"

/* ──────────────────────────────────────────────────────
   CURVE
   ────────────────────────────────────────────────────── */
function buildCurve() {
  return new THREE.CatmullRomCurve3(CAMERA_WAYPOINTS, false, "catmullrom", 0.5)
}

/* ──────────────────────────────────────────────────────
   PLANET
   ────────────────────────────────────────────────────── */
function Planet({
  section,
  scrollOffset,
  onPlanetClick,
}: {
  section: Section
  scrollOffset: number
  onPlanetClick: (id: string) => void
}) {
  const bodyRef  = useRef<THREE.Mesh>(null)
  const atmRef   = useRef<THREE.Mesh>(null)
  const ringRef  = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const glowRef = useRef<THREE.PointLight>(null)

  const proximity = Math.max(0, 1 - Math.abs(scrollOffset - section.scrollT) / 0.14)
  const isActive  = proximity > 0.45

  useFrame((state) => {
    if (!bodyRef.current) return
    const t   = state.clock.elapsedTime
    const bob = Math.sin(t * 1.1 + section.scrollT * 8) * 0.15
    bodyRef.current.rotation.y += 0.0025
    bodyRef.current.position.y = section.position.y + bob
    if (atmRef.current)  atmRef.current.position.y  = section.position.y + bob
    if (ringRef.current) {
      ringRef.current.position.y = section.position.y + bob
      ringRef.current.rotation.z += 0.0008
    }
    if (glowRef.current) {
      glowRef.current.intensity = isActive
        ? 30 + Math.sin(t * 3) * 8
        : 6 + proximity * 12
    }
  })

  return (
    <group>
      {/* Planet body */}
      <mesh
        ref={bodyRef}
        position={section.position}
        onClick={() => onPlanetClick(section.id)}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
      >
        <sphereGeometry args={[section.radius, 64, 64]} />
        <meshStandardMaterial
          color={section.surfaceColors[1]}
          emissive={section.color}
          emissiveIntensity={hovered ? 0.65 : isActive ? 0.4 : 0.08 + proximity * 0.15}
          roughness={0.68}
          metalness={0.14}
        />
      </mesh>

      {/* Atmosphere shell */}
      <mesh ref={atmRef} position={section.position}>
        <sphereGeometry args={[section.radius * 1.2, 32, 32]} />
        <meshBasicMaterial
          color={section.color}
          transparent
          opacity={0.04 + proximity * 0.13}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Saturn-style ring for Missions planet */}
      {section.id === "missions" && (
        <mesh
          ref={ringRef}
          position={section.position}
          rotation={[Math.PI / 2.4, 0, 0]}
        >
          <torusGeometry args={[section.radius * 1.7, 0.26, 6, 80]} />
          <meshBasicMaterial
            color={section.color}
            transparent
            opacity={0.28}
          />
        </mesh>
      )}

      {/* Orbiting moon for Skills planet */}
      {section.id === "skills" && (
        <OrbitingMoon
          center={section.position}
          radius={section.radius + 1.8}
          color={section.color}
        />
      )}

      {/* Planet glow point light */}
      <pointLight
        ref={glowRef}
        position={section.position}
        color={section.color}
        intensity={6 + proximity * 12}
        distance={18}
      />

      {/* Name label — always visible, centered above planet */}
      <Html
        center
        position={[
          section.position.x,
          section.position.y + section.radius + 1.4,
          section.position.z,
        ]}
        distanceFactor={12}
        zIndexRange={[10, 20]}
      >
        <div
          style={{
            padding: "4px 13px",
            borderRadius: "999px",
            border: `1px solid ${section.color}60`,
            background: "rgba(2,3,14,0.82)",
            color: section.color,
            fontSize: "9px",
            fontFamily: "'Orbitron', sans-serif",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            boxShadow: isActive ? `0 0 18px ${section.color}80` : "none",
            transition: "box-shadow 0.25s",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          {section.icon} {section.name}
        </div>
      </Html>
    </group>
  )
}

/* ──────────────────────────────────────────────────────
   ORBITING MOON (for skills planet)
   ────────────────────────────────────────────────────── */
function OrbitingMoon({
  center,
  radius,
  color,
}: {
  center: THREE.Vector3
  radius: number
  color: string
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * 0.6
    ref.current.position.set(
      center.x + Math.cos(t) * radius,
      center.y + Math.sin(t * 0.4) * 0.5,
      center.z + Math.sin(t) * radius,
    )
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.32, 12, 12]} />
      <meshStandardMaterial color="#aabbcc" emissive={color} emissiveIntensity={0.3} roughness={0.8} />
    </mesh>
  )
}

/* ──────────────────────────────────────────────────────
   SPACESHIP (camera-relative, always in view)
   ────────────────────────────────────────────────────── */
function Spaceship() {
  const wrapRef   = useRef<THREE.Group>(null)
  const flameRef  = useRef<THREE.Mesh>(null)
  const flame2Ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!wrapRef.current) return
    const t = state.clock.elapsedTime
    /* Gentle drift */
    wrapRef.current.rotation.x = -Math.PI / 2 + 0.24 + Math.sin(t * 1.4) * 0.03
    wrapRef.current.rotation.z = Math.sin(t * 2.0) * 0.025
    wrapRef.current.position.y = -0.52 + Math.sin(t * 3.2) * 0.06

    if (flameRef.current) {
      const s = 0.8 + Math.sin(t * 10) * 0.2
      flameRef.current.scale.set(s, s + 0.15, s)
    }
    if (flame2Ref.current) {
      const s2 = 0.85 + Math.sin(t * 14 + 1) * 0.15
      flame2Ref.current.scale.set(s2, s2, s2)
    }
  })

  return (
    <group ref={wrapRef} position={[0.28, -0.52, 2.1]} rotation={[-Math.PI / 2 + 0.24, 0, 0]}>
      {/* Hull */}
      <mesh>
        <capsuleGeometry args={[0.36, 1.05, 8, 16]} />
        <meshStandardMaterial color="#ddf2ff" metalness={0.9} roughness={0.12} />
      </mesh>

      {/* Cockpit window */}
      <mesh position={[0, 0.44, 0.16]}>
        <sphereGeometry args={[0.2, 20, 20]} />
        <meshStandardMaterial
          color="#4af3ff"
          emissive="#4af3ff"
          emissiveIntensity={1.8}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Detail stripe */}
      <mesh position={[0, 0.1, 0]}>
        <torusGeometry args={[0.37, 0.04, 6, 24]} />
        <meshStandardMaterial color="#4af3ff" emissive="#4af3ff" emissiveIntensity={0.6} />
      </mesh>

      {/* Left wing */}
      <mesh position={[-0.52, -0.08, 0]} rotation={[0.08, 0.18, 0.52]}>
        <boxGeometry args={[0.52, 0.06, 0.42]} />
        <meshStandardMaterial color="#b4cbdf" metalness={0.82} roughness={0.22} />
      </mesh>

      {/* Right wing */}
      <mesh position={[0.52, -0.08, 0]} rotation={[0.08, -0.18, -0.52]}>
        <boxGeometry args={[0.52, 0.06, 0.42]} />
        <meshStandardMaterial color="#b4cbdf" metalness={0.82} roughness={0.22} />
      </mesh>

      {/* Nozzle */}
      <mesh position={[0, -0.7, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.25, 0.4, 12]} />
        <meshStandardMaterial color="#556677" metalness={0.92} roughness={0.08} />
      </mesh>

      {/* Exhaust flame – outer */}
      <mesh ref={flameRef} position={[0, -1.02, 0]}>
        <coneGeometry args={[0.16, 0.52, 12]} />
        <meshBasicMaterial color="#f5c842" transparent opacity={0.78} />
      </mesh>

      {/* Exhaust flame – inner */}
      <mesh ref={flame2Ref} position={[0, -1.18, 0]}>
        <coneGeometry args={[0.08, 0.42, 8]} />
        <meshBasicMaterial color="#4af3ff" transparent opacity={0.6} />
      </mesh>

      {/* Engine glow */}
      <pointLight position={[0, -1.05, 0]} color="#f5c842" intensity={5} distance={3.5} />
    </group>
  )
}

/* ──────────────────────────────────────────────────────
   ASTEROIDS
   ────────────────────────────────────────────────────── */
function AsteroidField() {
  const pts = useRef(
    Array.from({ length: 220 }, (_, i) => {
      const x  = (i * 11) % 90 - 45
      const y  = (i * 7)  % 18 - 9
      const z  = -((i * 17) % 110)
      const sz = 0.04 + (i % 4) * 0.04
      const col = i % 3 === 0 ? "#4af3ff" : i % 3 === 1 ? "#f5c842" : "#3ddc84"
      return { x, y, z, sz, col } as const
    })
  ).current

  return (
    <>
      {pts.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.sz, 5, 5]} />
          <meshBasicMaterial color={p.col} transparent opacity={0.4} />
        </mesh>
      ))}
    </>
  )
}

/* ──────────────────────────────────────────────────────
   NEBULAS
   ────────────────────────────────────────────────────── */
function Nebulas() {
  const data = [
    { pos: [-28,  6, -48] as const, color: "#1a0b38", r: 20 },
    { pos: [ 36, -9, -68] as const, color: "#001c26", r: 24 },
    { pos: [-24,  4, -88] as const, color: "#280a0e", r: 22 },
  ]
  return (
    <>
      {data.map((n, i) => (
        <mesh key={i} position={n.pos}>
          <sphereGeometry args={[n.r, 10, 10]} />
          <meshBasicMaterial color={n.color} transparent opacity={0.16} side={THREE.BackSide} />
        </mesh>
      ))}
    </>
  )
}

/* ──────────────────────────────────────────────────────
   CAMERA RIG — snap-to-planet, prop-driven
   ────────────────────────────────────────────────────── */
function CameraRig({
  targetT,
  onPositionChange,
}: {
  targetT: number
  onPositionChange: (t: number) => void
}) {
  const curve    = useRef(buildCurve()).current
  const currentT = useRef(0)
  const lookAt   = useRef(new THREE.Vector3()).current

  useFrame(({ camera }, delta) => {
    /* Cinematic eased travel: ~1.4 s to reach next planet */
    currentT.current = THREE.MathUtils.lerp(
      currentT.current,
      targetT,
      Math.min(delta * 2.2, 1),
    )

    const t     = Math.min(currentT.current, 0.9999)
    const pos   = curve.getPointAt(t)
    const ahead = curve.getPointAt(Math.min(t + 0.012, 0.9999))

    camera.position.copy(pos)
    lookAt.lerp(ahead, Math.min(delta * 5, 1))
    camera.lookAt(lookAt)
    camera.up.set(0, 1, 0)

    onPositionChange(currentT.current)
  })

  return null
}

/* ──────────────────────────────────────────────────────
   SCENE ROOT
   ────────────────────────────────────────────────────── */
export interface SpaceSceneProps {
  targetT: number
  onPositionChange: (t: number) => void
  scrollOffset: number
  onPlanetClick: (id: string) => void
}

export default function SpaceScene({ targetT, onPositionChange, scrollOffset, onPlanetClick }: SpaceSceneProps) {
  return (
    <>
      <color attach="background" args={["#03040e"]} />
      <fog attach="fog" args={["#03040e", 22, 170]} />

      <ambientLight intensity={0.38} />
      <directionalLight position={[14, 12, 8]} intensity={1.1} color="#dbeeff" />
      <pointLight position={[0, 0, 0]} color="#4af3ff" intensity={50} distance={200} />

      <Stars radius={170} depth={80} count={7000} factor={5} saturation={0.1} fade speed={0.35} />

      <Nebulas />
      <AsteroidField />

      {SECTIONS.map((s) => (
        <Planet key={s.id} section={s} scrollOffset={scrollOffset} onPlanetClick={onPlanetClick} />
      ))}

      <Spaceship />
      <CameraRig targetT={targetT} onPositionChange={onPositionChange} />
    </>
  )
}
