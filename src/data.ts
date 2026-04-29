import * as THREE from "three"

export interface SectionItem {
  icon: string
  text: string
}

export interface Section {
  id: string
  name: string
  icon: string
  color: string
  glowColor: string
  /** World position of the planet centre */
  position: THREE.Vector3
  radius: number
  /** Scroll offset (0–1) when camera is closest to this planet */
  scrollT: number
  /** Three base colors for procedural surface shader */
  surfaceColors: [string, string, string]
  content: {
    title: string
    subtitle: string
    badge: string
    items: SectionItem[]
  }
}

export const SECTIONS: Section[] = [
  {
    id: "about",
    name: "Home Base",
    icon: "👨‍🚀",
    color: "#3ddc84",
    glowColor: "rgba(61,220,132,0.35)",
    position: new THREE.Vector3(3.5, 0, -22),
    radius: 2.5,
    scrollT: 0.17,
    surfaceColors: ["#0d2e1a", "#1a5c32", "#6ec98a"],
    content: {
      title: "Abishek S",
      subtitle: "Full-Stack Dev & UI/UX Designer",
      badge: "Commander",
      items: [
        { icon: "📍", text: "Coimbatore, Tamil Nadu, India" },
        { icon: "💻", text: "Full-Stack Development" },
        { icon: "🎨", text: "UI/UX & Design Systems" },
        { icon: "🌐", text: "Open for opportunities" },
      ],
    },
  },
  {
    id: "education",
    name: "Academy",
    icon: "🎓",
    color: "#60a5fa",
    glowColor: "rgba(96,165,250,0.35)",
    position: new THREE.Vector3(-5.5, 1.5, -40),
    radius: 2.1,
    scrollT: 0.34,
    surfaceColors: ["#07112a", "#14306e", "#7eb9ff"],
    content: {
      title: "Education",
      subtitle: "Academic Journey",
      badge: "Scholar",
      items: [
        { icon: "🏛️", text: "B.Tech – Computer Science" },
        { icon: "📚", text: "AI/ML & Web Technologies" },
        { icon: "🎯", text: "Specialised in UI Engineering" },
        { icon: "🏆", text: "Class of 2024" },
      ],
    },
  },
  {
    id: "missions",
    name: "Missions",
    icon: "🚀",
    color: "#f5c842",
    glowColor: "rgba(245,200,66,0.35)",
    position: new THREE.Vector3(7, -1.2, -58),
    radius: 3.0,
    scrollT: 0.52,
    surfaceColors: ["#2a1a00", "#6b4200", "#fde68a"],
    content: {
      title: "Mission Log",
      subtitle: "Shipped Projects",
      badge: "Captain",
      items: [
        { icon: "🛸", text: "OrbitUI — Accessible component system" },
        { icon: "🌙", text: "NightOwl — Focus app with retention" },
        { icon: "🗺️", text: "Mappr — Data visualisation tool" },
        { icon: "📊", text: "Pulseboard — Real-time analytics cockpit" },
      ],
    },
  },
  {
    id: "skills",
    name: "Arsenal",
    icon: "⚡",
    color: "#4af3ff",
    glowColor: "rgba(74,243,255,0.35)",
    position: new THREE.Vector3(-6, 0.5, -76),
    radius: 2.4,
    scrollT: 0.70,
    surfaceColors: ["#001419", "#004d5e", "#7cf0ff"],
    content: {
      title: "Skill Constellation",
      subtitle: "Tools & Technologies",
      badge: "Engineer",
      items: [
        { icon: "⚛️", text: "React · TypeScript · Node.js · Next.js" },
        { icon: "🎨", text: "Tailwind CSS · Figma · Design Systems" },
        { icon: "🐳", text: "GitHub · Docker · Linux · PostgreSQL" },
        { icon: "🌌", text: "Three.js · GLSL · WebGL" },
      ],
    },
  },
  {
    id: "contact",
    name: "Relay Station",
    icon: "📡",
    color: "#ff5f5f",
    glowColor: "rgba(255,95,95,0.35)",
    position: new THREE.Vector3(3, 0, -94),
    radius: 2.0,
    scrollT: 0.88,
    surfaceColors: ["#1e0606", "#5c1414", "#fca5a5"],
    content: {
      title: "Transmission Hub",
      subtitle: "Let's Connect",
      badge: "Admiral",
      items: [
        { icon: "📧", text: "abishek02781@gmail.com" },
        { icon: "💻", text: "github.com/abishek2429" },
        { icon: "🔗", text: "linkedin.com/in/abishek-s-a86209247" },
        { icon: "💼", text: "Open for Full-time & Freelance" },
      ],
    },
  },
]

/**
 * Camera waypoints along the journey path.
 * Roughly one "near" waypoint per planet, plus approach / departure points.
 */
export const CAMERA_WAYPOINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 4, 16),    // 0.00 – launch/start
  new THREE.Vector3(0, 2, 4),     // 0.06 – clearing atmosphere
  new THREE.Vector3(1, 1, -8),    // 0.10 – deep space entry
  new THREE.Vector3(3, 0.5, -17), // 0.14 – approaching p1
  new THREE.Vector3(5, 0, -22),   // 0.17 – 📍 near planet 1 (About)
  new THREE.Vector3(2, 0.5, -29), // 0.24 – departing
  new THREE.Vector3(-4, 1.5, -35),// 0.30 – approaching p2
  new THREE.Vector3(-7, 1.5, -40),// 0.34 – 📍 near planet 2 (Education)
  new THREE.Vector3(-2, 0.5, -47),// 0.41 – departing
  new THREE.Vector3(5, -0.5, -53),// 0.47 – approaching p3
  new THREE.Vector3(9, -1.2, -58),// 0.52 – 📍 near planet 3 (Missions)
  new THREE.Vector3(2, -0.3, -65),// 0.59 – departing
  new THREE.Vector3(-5, 0.5, -71),// 0.65 – approaching p4
  new THREE.Vector3(-8, 0.5, -76),// 0.70 – 📍 near planet 4 (Skills)
  new THREE.Vector3(-2, 0.3, -83),// 0.78 – departing
  new THREE.Vector3(1.5, 0.5, -87), // 0.84 – approaching p5
  new THREE.Vector3(5, 0.8, -92),   // 0.88 – 📍 near planet 5 (Contact)
  new THREE.Vector3(2, 2, -100),    // 0.95 – end of journey
]

/**
 * Snap stops for planet-to-planet navigation.
 * Index 0 = intro/launch (t=0), indices 1-5 = each planet's scrollT.
 */
export const STOPS: number[] = [...SECTIONS.map((s) => s.scrollT)]
