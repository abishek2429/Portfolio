export interface ProjectDetailedDescription {
  overview: string;
  problem_statement: string;
  proposed_solution: string;
  main_features: string[];
}

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  detailed_description: ProjectDetailedDescription;
  technologies: string[];
  image: string;
  github_url: string | null;
  project_url: string | null;
  featured: boolean;
}

export const projectsData: Project[] = [
  {
    id: "repsi",
    title: "RepSI",
    category: "Enterprise SaaS & Fitness OS",
    description: "A production-grade Gym Management SaaS platform engineered with multi-tenant architecture, asynchronous FastAPI microservices, and direct payment reconciliation.",
    detailed_description: {
      overview: "RepSI is a comprehensive Gym Management SaaS platform built to unify facility operations, member lifecycles, and financial accounting. It provides multi-tenant workspace isolation, automated GST billing, member payment verification, and contactless QR check-ins across web and mobile ecosystems.",
      problem_statement: "Fitness facilities frequently struggle with fragmented software tooling for member billing, manual ledger receipts, attendance tracking, and trainer scheduling—leading to lost membership renewals, administrative friction, and unverified manual bank transfers.",
      proposed_solution: "Architected a scalable multi-tenant platform with an asynchronous FastAPI backend, tenant-isolated PostgreSQL database modeling, and zero-fee direct manual payment verification workflows backed by atomic ledger transactions.",
      main_features: [
        "Multi-tenant workspace architecture supporting single and multi-branch gym organizations with strict data isolation",
        "Asynchronous FastAPI REST API (Python 3.12) with tenant context middleware and SQLAlchemy ORM",
        "Direct manual payment proof verification supporting custom UPI IDs and merchant QR codes with atomic ledger updates",
        "Contactless smartphone QR attendance check-in system with automatic overdue payment restriction enforcement",
        "Real-time operational dashboard with sales pipelines, automated GST billing, and CRM lead conversion tracking"
      ]
    },
    technologies: ["FastAPI", "Python", "PostgreSQL", "Next.js", "Docker", "SQLAlchemy"],
    image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
      <rect width="800" height="500" fill="%23E5D5C1"/>
      <rect x="24" y="24" width="752" height="452" rx="4" fill="%23F2E9DC" stroke="%235C4033" stroke-width="1.5" stroke-opacity="0.2"/>
      <line x1="24" y1="70" x2="776" y2="70" stroke="%235C4033" stroke-width="1" stroke-opacity="0.15"/>
      <circle cx="50" cy="47" r="4" fill="%23C19A6B"/>
      <circle cx="66" cy="47" r="4" fill="%238B6F52" opacity="0.6"/>
      <circle cx="82" cy="47" r="4" fill="%238B6F52" opacity="0.4"/>
      <text x="110" y="52" font-family="monospace" font-size="12" fill="%235C4033" letter-spacing="1">REPSI // MULTI-TENANT FITNESS BACKEND ARCHITECTURE</text>
      <text x="640" y="52" font-family="monospace" font-size="11" fill="%23C19A6B">FASTAPI v1.0.1</text>
      
      <!-- Metrics Row -->
      <rect x="60" y="105" width="200" height="90" rx="3" fill="%23E5D5C1" stroke="%235C4033" stroke-width="1" stroke-opacity="0.2"/>
      <text x="75" y="130" font-family="monospace" font-size="10" fill="%238B6F52">TENANT ISOLATION</text>
      <text x="75" y="158" font-family="serif" font-size="22" fill="%23352820">Multi-Branch</text>
      <text x="75" y="180" font-family="monospace" font-size="10" fill="%235C4033">Schema / Row context</text>

      <rect x="290" y="105" width="200" height="90" rx="3" fill="%23E5D5C1" stroke="%23C19A6B" stroke-width="1.5"/>
      <text x="305" y="130" font-family="monospace" font-size="10" fill="%238B6F52">MANUAL RECONCILIATION</text>
      <text x="305" y="158" font-family="serif" font-size="22" fill="%23352820">Atomic Ledger</text>
      <text x="305" y="180" font-family="monospace" font-size="10" fill="%23C19A6B">PAY-REF Validation</text>

      <rect x="520" y="105" width="200" height="90" rx="3" fill="%23E5D5C1" stroke="%235C4033" stroke-width="1" stroke-opacity="0.2"/>
      <text x="535" y="130" font-family="monospace" font-size="10" fill="%238B6F52">ATTENDANCE LATENCY</text>
      <text x="535" y="158" font-family="serif" font-size="22" fill="%23352820">&lt; 1.0s Scan</text>
      <text x="535" y="180" font-family="monospace" font-size="10" fill="%235C4033">QR + Biometric Hook</text>

      <!-- Architecture Block -->
      <rect x="60" y="225" width="660" height="205" rx="3" fill="%23ECE0D0" stroke="%235C4033" stroke-width="1" stroke-opacity="0.15"/>
      <text x="80" y="255" font-family="monospace" font-size="11" fill="%238B6F52">// ASYNCHRONOUS API ROUTE PIPELINE</text>
      
      <line x1="80" y1="300" x2="680" y2="300" stroke="%235C4033" stroke-width="1" stroke-dasharray="3,3" stroke-opacity="0.3"/>
      
      <rect x="80" y="280" width="130" height="40" rx="2" fill="%23352820"/>
      <text x="95" y="305" font-family="monospace" font-size="11" fill="%23F2E9DC">POST /billing</text>
      
      <rect x="250" y="280" width="140" height="40" rx="2" fill="%235C4033"/>
      <text x="265" y="305" font-family="monospace" font-size="11" fill="%23F2E9DC">POST /attendance</text>
      
      <rect x="430" y="280" width="120" height="40" rx="2" fill="%238B6F52"/>
      <text x="445" y="305" font-family="monospace" font-size="11" fill="%23F2E9DC">GET /members</text>
      
      <rect x="590" y="280" width="110" height="40" rx="2" fill="%23C19A6B"/>
      <text x="605" y="305" font-family="monospace" font-size="11" fill="%23352820">GET /crm</text>
      
      <text x="80" y="360" font-family="monospace" font-size="11" fill="%235C4033">Stack: FastAPI (Python 3.12) • SQLAlchemy 2.0 • PostgreSQL • Next.js • Docker Compose</text>
      <text x="80" y="385" font-family="serif" font-size="13" font-style="italic" fill="%238B6F52">Built for gym owners, trainers, front-desk staff, and active members.</text>
    </svg>`,
    github_url: null,
    project_url: null,
    featured: true
  },
  {
    id: "codexcape",
    title: "CodeXcape",
    category: "Collaborative Web Application",
    description: "A gamified two-player cooperative coding escape room with real-time puzzle solving, sandbox debugging, and synchronized state telemetry.",
    detailed_description: {
      overview: "CodeXcape immerses developer pairs into a timed collaborative challenge where solving algorithmic puzzles and debugging sandbox code reveals hidden clues to unlock subsequent chambers. It explores real-time peer learning through interactive game design.",
      problem_statement: "Technical interview preparation and algorithmic practice are predominantly solitary, high-stress experiences that lack dynamic real-time collaboration, peer learning, and engaging feedback loops.",
      proposed_solution: "Engineered a low-latency, real-time synchronized technical escape room using React, Node.js, and Socket.io, enabling pairs of developers to collaboratively inspect sandbox environments, solve algorithm riddles, and trigger chamber progression.",
      main_features: [
        "Real-time two-player cooperative state synchronization via WebSockets and Socket.io",
        "Interactive web-based coding sandbox for live code execution and puzzle evaluation",
        "Timed chamber progression state machine with countdown telemetry and failure modes",
        "Educational game design reinforcing algorithmic thinking, debugging, and teamwork"
      ]
    },
    technologies: ["React", "Node.js", "Socket.io", "WebGL", "Tailwind CSS"],
    image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
      <rect width="800" height="500" fill="%23352820"/>
      <rect x="24" y="24" width="752" height="452" rx="4" fill="%23271D17" stroke="%235C4033" stroke-width="1"/>
      <line x1="24" y1="70" x2="776" y2="70" stroke="%235C4033" stroke-width="1" stroke-opacity="0.3"/>
      <text x="50" y="52" font-family="monospace" font-size="12" fill="%23C19A6B" letter-spacing="2">CODEXCAPE // MULTIPLAYER ESCAPE ROOM</text>
      <text x="630" y="52" font-family="monospace" font-size="11" fill="%238B6F52">ROOM: CHAMBER-03</text>

      <!-- Player 1 & Player 2 Terminals -->
      <rect x="60" y="110" width="310" height="230" rx="3" fill="%23352820" stroke="%235C4033" stroke-width="1"/>
      <text x="80" y="140" font-family="monospace" font-size="11" fill="%23C19A6B">PLAYER 1 // SANDBOX TERMINAL</text>
      <line x1="80" y1="155" x2="350" y2="155" stroke="%235C4033" stroke-width="1" stroke-opacity="0.3"/>
      <text x="80" y="185" font-family="monospace" font-size="11" fill="%23F2E9DC">function decryptCipher(str) {</text>
      <text x="100" y="210" font-family="monospace" font-size="11" fill="%238B6F52">const shift = key % 26;</text>
      <text x="100" y="235" font-family="monospace" font-size="11" fill="%23C19A6B">return applyTransform(str);</text>
      <text x="80" y="260" font-family="monospace" font-size="11" fill="%23F2E9DC">}</text>
      <text x="80" y="305" font-family="monospace" font-size="11" fill="%23C19A6B">&gt; TESTS: 4/4 PASSING</text>

      <rect x="410" y="110" width="310" height="230" rx="3" fill="%23352820" stroke="%235C4033" stroke-width="1"/>
      <text x="430" y="140" font-family="monospace" font-size="11" fill="%23C19A6B">PLAYER 2 // CHAMBER TELEMETRY</text>
      <line x1="430" y1="155" x2="700" y2="155" stroke="%235C4033" stroke-width="1" stroke-opacity="0.3"/>
      <text x="430" y="185" font-family="monospace" font-size="11" fill="%238B6F52">SOCKET.IO SYNC: </text>
      <text x="590" y="185" font-family="monospace" font-size="11" fill="%23C19A6B">CONNECTED</text>
      <text x="430" y="215" font-family="monospace" font-size="11" fill="%238B6F52">ROUND TIMER: </text>
      <text x="590" y="215" font-family="serif" font-size="20" fill="%23F2E9DC">04:32</text>
      <text x="430" y="245" font-family="monospace" font-size="11" fill="%238B6F52">VAULT LOCK: </text>
      <text x="590" y="245" font-family="monospace" font-size="11" fill="%23C19A6B">ENGAGED</text>
      <rect x="430" y="280" width="270" height="35" rx="2" fill="%23271D17" stroke="%23C19A6B" stroke-width="1"/>
      <text x="450" y="302" font-family="monospace" font-size="11" fill="%23C19A6B">SHARED KEY: 0x7E3A [VERIFIED]</text>

      <!-- Bottom Status -->
      <rect x="60" y="365" width="660" height="70" rx="3" fill="%23271D17" stroke="%235C4033" stroke-width="1"/>
      <text x="80" y="405" font-family="monospace" font-size="11" fill="%238B6F52">Architecture: React • Node.js • Socket.io WebSockets • WebGL Canvas Rendering</text>
    </svg>`,
    github_url: "https://github.com/abishek2429/CodeXcape",
    project_url: null,
    featured: true
  },
  {
    id: "eduvault",
    title: "EduVault",
    category: "Full-Stack Educational Platform",
    description: "A collaborative educational platform and department-level LMS engineered with automated descriptive assessment evaluation and secure document vaulting.",
    detailed_description: {
      overview: "EduVault is a full-featured collaborative educational platform engineered to manage student submissions, streamline grading, and evaluate open-ended subjective assessments using semantic similarity pipelines.",
      problem_statement: "Evaluating subjective, descriptive student assessments across large engineering cohorts causes substantial grading delays, inconsistent criteria, and administrative overhead, while fragmented document repositories lead to lost submissions.",
      proposed_solution: "Designed a centralized department LMS combining role-based authentication, structured document vaulting, and an automated descriptive answer grading (ASAG) pipeline based on semantic similarity scoring.",
      main_features: [
        "Role-based access control with distinct Admin, Instructor, and Student privilege tiers",
        "Automated Subjective Answer Grading (ASAG) utilizing semantic text similarity",
        "Centralized secure document vault for coursework submissions and syllabus archives",
        "Real-time notifications for assignment updates, evaluation returns, and peer discussions"
      ]
    },
    technologies: ["Java", "Firebase", "REST API", "Android", "ASAG"],
    image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
      <rect width="800" height="500" fill="%23F2E9DC"/>
      <rect x="24" y="24" width="752" height="452" rx="4" fill="%23E5D5C1" stroke="%235C4033" stroke-width="1.5" stroke-opacity="0.2"/>
      <line x1="24" y1="70" x2="776" y2="70" stroke="%235C4033" stroke-width="1" stroke-opacity="0.15"/>
      <text x="50" y="52" font-family="monospace" font-size="12" fill="%23352820" letter-spacing="1">EDUVAULT // ACADEMIC ASSESSMENT &amp; DOCUMENT PLATFORM</text>
      <text x="630" y="52" font-family="monospace" font-size="11" fill="%23C19A6B">LMS CORE</text>

      <!-- Roles Matrix -->
      <rect x="60" y="105" width="200" height="110" rx="3" fill="%23F2E9DC" stroke="%235C4033" stroke-width="1" stroke-opacity="0.2"/>
      <text x="75" y="130" font-family="monospace" font-size="11" fill="%238B6F52">ROLE PERMISSIONS</text>
      <text x="75" y="160" font-family="serif" font-size="20" fill="%23352820">3-Tier RBAC</text>
      <text x="75" y="188" font-family="monospace" font-size="10" fill="%235C4033">Admin / Faculty / Student</text>

      <rect x="290" y="105" width="200" height="110" rx="3" fill="%23F2E9DC" stroke="%235C4033" stroke-width="1" stroke-opacity="0.2"/>
      <text x="305" y="130" font-family="monospace" font-size="11" fill="%238B6F52">DESCRIPTIVE GRADING</text>
      <text x="305" y="160" font-family="serif" font-size="20" fill="%23352820">ASAG Pipeline</text>
      <text x="305" y="188" font-family="monospace" font-size="10" fill="%23C19A6B">Semantic Text Similarity</text>

      <rect x="520" y="105" width="200" height="110" rx="3" fill="%23F2E9DC" stroke="%235C4033" stroke-width="1" stroke-opacity="0.2"/>
      <text x="535" y="130" font-family="monospace" font-size="11" fill="%238B6F52">DOCUMENT VAULT</text>
      <text x="535" y="160" font-family="serif" font-size="20" fill="%23352820">Secure Store</text>
      <text x="535" y="188" font-family="monospace" font-size="10" fill="%235C4033">Assignments &amp; Submissions</text>

      <!-- Architecture Pipeline -->
      <rect x="60" y="240" width="660" height="185" rx="3" fill="%23F2E9DC" stroke="%235C4033" stroke-width="1" stroke-opacity="0.2"/>
      <text x="80" y="270" font-family="monospace" font-size="11" fill="%238B6F52">// AUTOMATED ASSESSMENT EVALUATION FLOW</text>
      
      <rect x="80" y="300" width="160" height="45" rx="2" fill="%23E5D5C1" stroke="%235C4033" stroke-width="1"/>
      <text x="95" y="327" font-family="monospace" font-size="11" fill="%23352820">Student Submission</text>
      
      <line x1="240" y1="322" x2="280" y2="322" stroke="%23C19A6B" stroke-width="2"/>
      
      <rect x="280" y="300" width="180" height="45" rx="2" fill="%23352820"/>
      <text x="295" y="327" font-family="monospace" font-size="11" fill="%23F2E9DC">NLP Semantic Match</text>
      
      <line x1="460" y1="322" x2="500" y2="322" stroke="%23C19A6B" stroke-width="2"/>
      
      <rect x="500" y="300" width="190" height="45" rx="2" fill="%23E5D5C1" stroke="%23C19A6B" stroke-width="1.5"/>
      <text x="515" y="327" font-family="monospace" font-size="11" fill="%23352820">Grading &amp; Notification</text>
      
      <text x="80" y="390" font-family="monospace" font-size="11" fill="%235C4033">Built with Java • Firebase Realtime Data • REST APIs • Android Client</text>
    </svg>`,
    github_url: "https://github.com/abishek2429/EduVault",
    project_url: null,
    featured: true
  }
];
