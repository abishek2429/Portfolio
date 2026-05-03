import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Html, Stars } from "@react-three/drei"
import * as THREE from "three"
import { useMemo } from "react"
import { SECTIONS, CAMERA_WAYPOINTS, type Section } from "./data"

/* ──────────────────────────────────────────────────────
   CURVE
   ────────────────────────────────────────────────────── */
function buildCurve() {
  return new THREE.CatmullRomCurve3(CAMERA_WAYPOINTS, false, "catmullrom", 0.5)
}

/* ──────────────────────────────────────────────────────
   PLANET SHADER MATERIAL
   ────────────────────────────────────────────────────── */
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform float time;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 color3;
  uniform vec3 glowColor;
  uniform float hoverIntensity;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  // Hash function for noise
  vec3 hash33(vec3 p) {
      p = fract(p * vec3(443.897, 441.423, 437.195));
      p += dot(p, p.yxz + 19.19);
      return fract((p.xxy + p.yxx) * p.zyx);
  }

  // 3D Simplex noise
  float snoise(vec3 p) {
      const float K1 = 0.333333333;
      const float K2 = 0.166666667;
      
      vec3 i = floor(p + (p.x + p.y + p.z) * K1);
      vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
      
      vec3 e = step(vec3(0.0), d0 - d0.yzx);
      vec3 i1 = e * (1.0 - e.zxy);
      vec3 i2 = 1.0 - e.zxy * (1.0 - e);
      
      vec3 d1 = d0 - (i1 - 1.0 * K2);
      vec3 d2 = d0 - (i2 - 2.0 * K2);
      vec3 d3 = d0 - (1.0 - 3.0 * K2);
      
      vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
      vec4 n = h * h * h * h * vec4(
          dot(d0, hash33(i) - 0.5),
          dot(d1, hash33(i + i1) - 0.5),
          dot(d2, hash33(i + i2) - 0.5),
          dot(d3, hash33(i + 1.0) - 0.5)
      );
      
      return dot(n, vec4(31.316));
  }

  // FBM (Fractal Brownian Motion)
  float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 6; ++i) {
      v += a * snoise(x);
      x = x * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  // Cloud layer fbm
  float cloudFbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(200.0);
    for (int i = 0; i < 4; ++i) {
      v += a * snoise(x);
      x = x * 2.5 + shift;
      a *= 0.4;
    }
    return v;
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 lightDir = normalize(vec3(1.0, 0.8, 0.6));
    
    // 1. Geography Noise (Land vs Ocean)
    vec3 p = vWorldPosition * 0.45;
    float terrain = fbm(p + time * 0.015);
    
    // 2. Map terrain to colors & specular
    vec3 surfaceColor;
    float specularStrength = 0.0;
    float shininess = 1.0;
    
    if (terrain < -0.05) {
      // Deep Ocean
      surfaceColor = mix(color1 * 0.5, color1, smoothstep(-0.4, -0.05, terrain));
      specularStrength = 0.8; // Water is highly reflective
      shininess = 64.0;
    } else if (terrain < 0.25) {
      // Lowlands / Continents
      surfaceColor = mix(color1, color2, smoothstep(-0.05, 0.25, terrain));
      specularStrength = 0.1; // Land is matte
      shininess = 4.0;
    } else {
      // Highlands / Mountains
      surfaceColor = mix(color2, color3, smoothstep(0.25, 0.6, terrain));
      specularStrength = 0.05;
      shininess = 2.0;
    }

    // 3. Clouds
    vec3 cp = vWorldPosition * 0.7;
    // Rotate clouds slightly over time
    float angle = time * 0.02;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    cp.xz = rot * cp.xz;
    
    float clouds = cloudFbm(cp);
    clouds = smoothstep(0.1, 0.8, clouds); // Threshold clouds
    
    // Clouds block specular reflection from surface
    specularStrength *= (1.0 - clouds * 0.8);
    
    // Mix clouds into surface color
    vec3 cloudColor = vec3(0.95, 0.95, 1.0);
    surfaceColor = mix(surfaceColor, cloudColor, clouds * 0.8);

    // 4. Lighting Calculation
    // Diffuse
    float NdotL = max(dot(normal, lightDir), 0.0);
    // Wrap lighting slightly for atmospheric scattering feel
    float diffuse = NdotL * 0.8 + 0.2; 
    
    // Specular (Blinn-Phong)
    vec3 halfVector = normalize(lightDir + viewDir);
    float NdotH = max(dot(normal, halfVector), 0.0);
    float specular = pow(NdotH, shininess) * specularStrength;
    
    // Ambient
    float ambient = 0.2;
    
    vec3 finalColor = surfaceColor * (diffuse + ambient) + vec3(1.0) * specular;

    // 5. Atmospheric Rim Lighting
    float rimPower = 1.0 - max(dot(viewDir, normal), 0.0);
    rimPower = smoothstep(0.5, 1.0, rimPower);
    
    // Outer glow from hover/active state
    finalColor += glowColor * rimPower * 1.5;
    finalColor += glowColor * hoverIntensity * 1.2;

    // 6. Day/Night Term (Dark side of planet)
    // Darken the side facing away from the light source
    float shadowTerm = smoothstep(-0.2, 0.2, dot(normal, lightDir));
    finalColor *= shadowTerm + 0.05; // Never completely black

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function PlanetMaterial({ color1, color2, color3, glow, hovered, isActive }: any) {
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      color1: { value: new THREE.Color(color1) },
      color2: { value: new THREE.Color(color2) },
      color3: { value: new THREE.Color(color3) },
      glowColor: { value: new THREE.Color(glow) },
      hoverIntensity: { value: 0 },
    }),
    [color1, color2, color3, glow]
  );

  useFrame((state) => {
    uniforms.time.value = state.clock.elapsedTime;
    const targetIntensity = hovered ? 0.3 : isActive ? 0.15 : 0.0;
    // Lerp hover intensity
    uniforms.hoverIntensity.value += (targetIntensity - uniforms.hoverIntensity.value) * 0.1;
  });

  return (
    <shaderMaterial
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
    />
  );
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
    bodyRef.current.position.copy(section.position)
    if (atmRef.current)  atmRef.current.position.copy(section.position)
    if (ringRef.current) {
      ringRef.current.position.copy(section.position)
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
        <sphereGeometry args={[section.radius, 128, 128]} />
        <PlanetMaterial
          color1={section.surfaceColors[0]}
          color2={section.surfaceColors[1]}
          color3={section.surfaceColors[2]}
          glow={section.color}
          hovered={hovered}
          isActive={isActive}
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
