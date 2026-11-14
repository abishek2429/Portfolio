export interface ProjectItem {
  id: string;
  name: string;
  category: string;
  oneLiner: string; // One short sentence describing the project
  previewImage: string; // High-resolution bespoke preview composition
  projectUrl: string | null; // Configurable deployed project URL
  githubUrl: string | null; // Fallback GitHub repo URL
  accentColor: string; // Primary project accent
  year: string;
}

// Backward compatibility alias
export type Project = ProjectItem;

export const projectsData: ProjectItem[] = [
  {
    id: "repsi",
    name: "RepSI",
    category: "Fitness OS & Gym SaaS",
    year: "2024",
    oneLiner: "A production-grade multi-tenant gym management SaaS unifying facility operations, direct payment reconciliation, and contactless QR attendance.",
    projectUrl: null, // Deployed URL is not yet live
    githubUrl: null, // Private repository
    accentColor: "#C19A6B",
    previewImage: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="100%" height="100%">
      <defs>
        <linearGradient id="repsiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%23E5D5C1"/>
          <stop offset="100%" stop-color="%23D9C4AD"/>
        </linearGradient>
        <radialGradient id="repsiGlow" cx="70%" cy="30%" r="60%">
          <stop offset="0%" stop-color="%23C19A6B" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="%23C19A6B" stop-opacity="0"/>
        </radialGradient>
      </defs>
      
      <!-- Canvas Background -->
      <rect width="1200" height="750" fill="url(%23repsiGrad)"/>
      <rect width="1200" height="750" fill="url(%23repsiGlow)"/>

      <!-- Editorial Frame -->
      <rect x="40" y="40" width="1120" height="670" rx="12" fill="%23F2E9DC" stroke="%235C4033" stroke-width="1.5" stroke-opacity="0.2"/>
      
      <!-- Top Exhibition Bar -->
      <line x1="40" y1="110" x2="1160" y2="110" stroke="%235C4033" stroke-width="1" stroke-opacity="0.15"/>
      <circle cx="80" cy="75" r="5" fill="%23C19A6B"/>
      <text x="100" y="80" font-family="'JetBrains Mono', monospace" font-size="12" fill="%235C4033" letter-spacing="2">REPSI // MULTI-TENANT GYM MANAGEMENT PLATFORM</text>
      <text x="1120" y="80" font-family="'JetBrains Mono', monospace" font-size="11" fill="%238B6F52" text-anchor="end">EDITION // 2024</text>

      <!-- Center Showcase Composition -->
      <!-- Large Watermark -->
      <text x="600" y="420" font-family="'Newsreader', 'Playfair Display', serif" font-size="160" font-weight="700" fill="%23352820" fill-opacity="0.04" text-anchor="middle" letter-spacing="-4">REPSI</text>

      <!-- Main Visual Cards Presentation -->
      <g transform="translate(100, 160)">
        <!-- Left: Telemetry & Status Card -->
        <rect x="0" y="20" width="460" height="420" rx="8" fill="%23E5D5C1" stroke="%235C4033" stroke-width="1" stroke-opacity="0.25"/>
        <line x1="0" y1="80" x2="460" y2="80" stroke="%235C4033" stroke-width="1" stroke-opacity="0.15"/>
        <text x="35" y="55" font-family="'JetBrains Mono', monospace" font-size="11" fill="%238B6F52">FACILITY TELEMETRY</text>
        <circle cx="420" cy="50" r="4" fill="%23C19A6B"/>

        <!-- Abstract Metric Ring -->
        <circle cx="130" cy="180" r="60" fill="none" stroke="%23DAC4AC" stroke-width="12"/>
        <circle cx="130" cy="180" r="60" fill="none" stroke="%23C19A6B" stroke-width="12" stroke-dasharray="280" stroke-dashoffset="75" stroke-linecap="round"/>
        <text x="130" y="186" font-family="'Newsreader', serif" font-size="28" font-weight="600" fill="%23352820" text-anchor="middle">98%</text>
        <text x="130" y="260" font-family="'JetBrains Mono', monospace" font-size="10" fill="%235C4033" text-anchor="middle">ACTIVE CAPACITY</text>

        <!-- Right Stats Inside Card -->
        <g transform="translate(240, 130)">
          <text x="0" y="20" font-family="'JetBrains Mono', monospace" font-size="10" fill="%238B6F52">TENANCY</text>
          <text x="0" y="45" font-family="'Newsreader', serif" font-size="24" fill="%23352820">Multi-Branch</text>
          <text x="0" y="90" font-family="'JetBrains Mono', monospace" font-size="10" fill="%238B6F52">RECONCILIATION</text>
          <text x="0" y="115" font-family="'Newsreader', serif" font-size="24" fill="%23C19A6B">Direct UPI</text>
        </g>

        <!-- Bottom Pill inside left card -->
        <rect x="35" y="320" width="390" height="55" rx="6" fill="%23F2E9DC" stroke="%235C4033" stroke-width="1" stroke-opacity="0.2"/>
        <circle cx="65" cy="347" r="6" fill="%23C19A6B"/>
        <text x="85" y="352" font-family="'JetBrains Mono', monospace" font-size="12" fill="%23352820">Multi-Tenant Isolation &amp; Automated Billing</text>
      </g>

      <!-- Right: Smartphone Contactless QR Visual -->
      <g transform="translate(620, 140)">
        <rect x="40" y="0" width="420" height="460" rx="16" fill="%23352820" stroke="%235C4033" stroke-width="2"/>
        <rect x="60" y="20" width="380" height="420" rx="10" fill="%23271D17"/>
        
        <!-- Screen Header -->
        <rect x="90" y="50" width="320" height="40" rx="6" fill="%23352820"/>
        <text x="110" y="75" font-family="'JetBrains Mono', monospace" font-size="11" fill="%23C19A6B">PASS IDENTIFIER // QR SCAN</text>

        <!-- Stylized QR Code Matrix -->
        <g transform="translate(160, 125)">
          <rect x="0" y="0" width="180" height="180" rx="8" fill="%23F2E9DC"/>
          <!-- Position Marks -->
          <rect x="15" y="15" width="40" height="40" fill="%23352820"/>
          <rect x="23" y="23" width="24" height="24" fill="%23F2E9DC"/>
          <rect x="125" y="15" width="40" height="40" fill="%23352820"/>
          <rect x="133" y="23" width="24" height="24" fill="%23F2E9DC"/>
          <rect x="15" y="125" width="40" height="40" fill="%23352820"/>
          <rect x="23" y="133" width="24" height="24" fill="%23F2E9DC"/>
          <!-- Decorative Pattern Nodes -->
          <rect x="70" y="30" width="12" height="12" fill="%23C19A6B"/>
          <rect x="95" y="30" width="12" height="24" fill="%23352820"/>
          <rect x="70" y="70" width="35" height="12" fill="%23352820"/>
          <rect x="120" y="70" width="20" height="20" fill="%23C19A6B"/>
          <rect x="70" y="100" width="15" height="30" fill="%23352820"/>
          <rect x="100" y="110" width="40" height="15" fill="%23352820"/>
          <rect x="70" y="145" width="45" height="15" fill="%23C19A6B"/>
        </g>

        <!-- Verified Status Banner -->
        <rect x="90" y="340" width="320" height="50" rx="6" fill="%23C19A6B"/>
        <text x="250" y="371" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="600" fill="%23271D17" text-anchor="middle" letter-spacing="1">ACCESS GRANTED • &lt; 1.0s</text>
      </g>
    </svg>`
  },
  {
    id: "codexcape",
    name: "CodeXcape",
    category: "Collaborative Web Platform",
    year: "2024",
    oneLiner: "A real-time cooperative coding escape room challenging developer pairs to solve algorithmic puzzles in synchronized chambers.",
    projectUrl: null, // Deployed live site not deployed yet
    githubUrl: "https://github.com/abishek2429/CodeXcape", // Active repository
    accentColor: "#C86D51",
    previewImage: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="100%" height="100%">
      <defs>
        <linearGradient id="codeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%232A1D16"/>
          <stop offset="100%" stop-color="%231E1510"/>
        </linearGradient>
        <radialGradient id="codeGlow" cx="30%" cy="40%" r="60%">
          <stop offset="0%" stop-color="%23C86D51" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="%23C86D51" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Canvas Background -->
      <rect width="1200" height="750" fill="url(%23codeGrad)"/>
      <rect width="1200" height="750" fill="url(%23codeGlow)"/>

      <!-- Editorial Frame -->
      <rect x="40" y="40" width="1120" height="670" rx="12" fill="%23241812" stroke="%23C86D51" stroke-width="1.5" stroke-opacity="0.3"/>
      
      <!-- Top Exhibition Bar -->
      <line x1="40" y1="110" x2="1160" y2="110" stroke="%23C86D51" stroke-width="1" stroke-opacity="0.25"/>
      <circle cx="80" cy="75" r="5" fill="%23C86D51"/>
      <text x="100" y="80" font-family="'JetBrains Mono', monospace" font-size="12" fill="%23C86D51" letter-spacing="2">CODEXCAPE // COOPERATIVE ESCAPE ROOM</text>
      <text x="1120" y="80" font-family="'JetBrains Mono', monospace" font-size="11" fill="%23B5A89B" text-anchor="end">2-PLAYER WEBSOCKET SYNC</text>

      <!-- Center Large Watermark -->
      <text x="600" y="420" font-family="'Newsreader', 'Playfair Display', serif" font-size="140" font-weight="700" fill="%23F2E9DC" fill-opacity="0.03" text-anchor="middle" letter-spacing="-3">CODEXCAPE</text>

      <!-- Dual Cooperative Chamber Interfaces -->
      <g transform="translate(90, 160)">
        <!-- Chamber Alpha: Player 1 Sandbox Terminal -->
        <rect x="0" y="0" width="480" height="440" rx="10" fill="%231A120D" stroke="%235C4033" stroke-width="1.5"/>
        <rect x="0" y="0" width="480" height="55" rx="10" fill="%232D1F17"/>
        <circle cx="35" cy="28" r="5" fill="%23C86D51"/>
        <text x="55" y="32" font-family="'JetBrains Mono', monospace" font-size="11" fill="%23F2E9DC">CHAMBER 01 // CODE SANDBOX</text>
        <rect x="360" y="16" width="95" height="24" rx="4" fill="%231A120D"/>
        <text x="407" y="32" font-family="'JetBrains Mono', monospace" font-size="10" fill="%23C86D51" text-anchor="middle">LIVE SYNC</text>

        <!-- Code Interface Representation -->
        <g transform="translate(35, 95)" font-family="'JetBrains Mono', monospace" font-size="13">
          <text x="0" y="20" fill="%23C86D51">const <tspan fill="%23F2E9DC">chamberKey</tspan> = <tspan fill="%23D1AC80">decodePayload</tspan>(buffer);</text>
          <text x="0" y="55" fill="%23B5A89B">// Solve algorithmic cipher to unlock door</text>
          <text x="0" y="90" fill="%23C86D51">function <tspan fill="%23F2E9DC">syncState</tspan>(playerA, playerB) {</text>
          <text x="25" y="125" fill="%23F2E9DC">return playerA.key === playerB.target;</text>
          <text x="0" y="160" fill="%23C86D51">}</text>

          <rect x="0" y="210" width="410" height="60" rx="6" fill="%232D1F17" stroke="%23C86D51" stroke-width="1" stroke-opacity="0.4"/>
          <text x="20" y="245" fill="%23C86D51" font-size="11">&gt; STATUS: 4/4 PUZZLE CONSTRAINTS MET</text>
        </g>
      </g>

      <!-- Center Synced Socket Link Connection -->
      <g transform="translate(570, 340)">
        <circle cx="30" cy="30" r="28" fill="%23C86D51" fill-opacity="0.2"/>
        <circle cx="30" cy="30" r="16" fill="%23C86D51"/>
        <line x1="30" y1="-140" x2="30" y2="200" stroke="%23C86D51" stroke-width="2" stroke-dasharray="6,4" stroke-opacity="0.4"/>
      </g>

      <!-- Chamber Beta: Player 2 Telemetry & Chamber Vault -->
      <g transform="translate(630, 160)">
        <rect x="0" y="0" width="480" height="440" rx="10" fill="%231A120D" stroke="%235C4033" stroke-width="1.5"/>
        <rect x="0" y="0" width="480" height="55" rx="10" fill="%232D1F17"/>
        <circle cx="35" cy="28" r="5" fill="%23D1AC80"/>
        <text x="55" y="32" font-family="'JetBrains Mono', monospace" font-size="11" fill="%23F2E9DC">CHAMBER 02 // VAULT TELEMETRY</text>

        <!-- Timer Display -->
        <rect x="35" y="90" width="410" height="95" rx="8" fill="%23241812" stroke="%23C86D51" stroke-width="1"/>
        <text x="60" y="125" font-family="'JetBrains Mono', monospace" font-size="11" fill="%23B5A89B">REMAINING ROUND TIMER</text>
        <text x="60" y="165" font-family="'Newsreader', serif" font-size="36" font-weight="700" fill="%23F2E9DC">04:32.18</text>
        <circle cx="410" cy="138" r="14" fill="%23C86D51"/>

        <!-- Vault Key State -->
        <g transform="translate(35, 215)">
          <rect x="0" y="0" width="410" height="150" rx="8" fill="%23241812" stroke="%235C4033" stroke-width="1"/>
          <text x="25" y="35" font-family="'JetBrains Mono', monospace" font-size="11" fill="%23B5A89B">COOPERATIVE CRYPTOGRAM</text>
          <text x="25" y="75" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="600" fill="%23D1AC80">KEY: 0x7E3A-SYNC</text>
          
          <rect x="25" y="100" width="360" height="30" rx="4" fill="%232D1F17"/>
          <text x="40" y="120" font-family="'JetBrains Mono', monospace" font-size="11" fill="%23C86D51">DOOR 03 UNLOCK STAGE: ENGAGED</text>
        </g>
      </g>
    </svg>`
  },
  {
    id: "eduvault",
    name: "EduVault",
    category: "Academic Assessment Platform",
    year: "2023",
    oneLiner: "A centralized academic platform and department vault featuring automated subjective grading powered by semantic NLP.",
    projectUrl: null, // Deployed live site not deployed yet
    githubUrl: "https://github.com/abishek2429/EduVault", // Active repository
    accentColor: "#8B6F52",
    previewImage: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="100%" height="100%">
      <defs>
        <linearGradient id="eduGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%23F2E9DC"/>
          <stop offset="100%" stop-color="%23E5D5C1"/>
        </linearGradient>
        <radialGradient id="eduGlow" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stop-color="%238B6F52" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="%238B6F52" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Canvas Background -->
      <rect width="1200" height="750" fill="url(%23eduGrad)"/>
      <rect width="1200" height="750" fill="url(%23eduGlow)"/>

      <!-- Editorial Frame -->
      <rect x="40" y="40" width="1120" height="670" rx="12" fill="%23F7F2EB" stroke="%235C4033" stroke-width="1.5" stroke-opacity="0.2"/>
      
      <!-- Top Exhibition Bar -->
      <line x1="40" y1="110" x2="1160" y2="110" stroke="%235C4033" stroke-width="1" stroke-opacity="0.15"/>
      <circle cx="80" cy="75" r="5" fill="%238B6F52"/>
      <text x="100" y="80" font-family="'JetBrains Mono', monospace" font-size="12" fill="%235C4033" letter-spacing="2">EDUVAULT // ACADEMIC ASSESSMENT &amp; DOCUMENT VAULT</text>
      <text x="1120" y="80" font-family="'JetBrains Mono', monospace" font-size="11" fill="%238B6F52" text-anchor="end">ASAG NLP PIPELINE</text>

      <!-- Center Watermark -->
      <text x="600" y="420" font-family="'Newsreader', 'Playfair Display', serif" font-size="150" font-weight="700" fill="%23352820" fill-opacity="0.04" text-anchor="middle" letter-spacing="-3">EDUVAULT</text>

      <!-- Visual Layered Vault Composition -->
      <g transform="translate(100, 160)">
        <!-- Left: Coursework Document Stack Presentation -->
        <g transform="translate(0, 20)">
          <!-- Background Sheet -->
          <rect x="25" y="0" width="420" height="400" rx="8" fill="%23E5D5C1" stroke="%235C4033" stroke-width="1" stroke-opacity="0.15"/>
          <!-- Middle Sheet -->
          <rect x="12" y="15" width="420" height="400" rx="8" fill="%23EFE5D7" stroke="%235C4033" stroke-width="1" stroke-opacity="0.2"/>
          <!-- Foreground Active Sheet -->
          <rect x="0" y="30" width="420" height="400" rx="8" fill="%23FFFFFF" stroke="%235C4033" stroke-width="1.5" stroke-opacity="0.3"/>

          <!-- Document Header -->
          <rect x="30" y="65" width="220" height="15" rx="3" fill="%23352820"/>
          <rect x="30" y="90" width="140" height="10" rx="2" fill="%238B6F52" opacity="0.6"/>

          <!-- Mock Document Paragraph Lines -->
          <line x1="30" y1="135" x2="380" y2="135" stroke="%23352820" stroke-width="3" stroke-opacity="0.15"/>
          <line x1="30" y1="160" x2="360" y2="160" stroke="%23352820" stroke-width="3" stroke-opacity="0.15"/>
          <line x1="30" y1="185" x2="340" y2="185" stroke="%23352820" stroke-width="3" stroke-opacity="0.15"/>
          <line x1="30" y1="210" x2="370" y2="210" stroke="%23352820" stroke-width="3" stroke-opacity="0.15"/>

          <!-- Evaluation Feedback Stamp -->
          <rect x="30" y="270" width="360" height="80" rx="6" fill="%23F2E9DC" stroke="%23C19A6B" stroke-width="1.5"/>
          <text x="50" y="305" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="600" fill="%235C4033">EVALUATION: 94% SEMANTIC MATCH</text>
          <text x="50" y="330" font-family="'Newsreader', serif" font-size="14" font-style="italic" fill="%238B6F52">High conceptual correlation across rubric descriptors</text>
        </g>

        <!-- Right: Semantic Matching Spectrum & RBAC Vault Visual -->
        <g transform="translate(520, 20)">
          <!-- RBAC Tiers -->
          <rect x="0" y="30" width="480" height="175" rx="10" fill="%23F2E9DC" stroke="%235C4033" stroke-width="1" stroke-opacity="0.25"/>
          <text x="35" y="65" font-family="'JetBrains Mono', monospace" font-size="11" fill="%238B6F52">ROLE-BASED VAULT TIERS</text>
          
          <g transform="translate(35, 90)">
            <rect x="0" y="0" width="125" height="85" rx="6" fill="%23352820"/>
            <text x="62" y="35" font-family="'Newsreader', serif" font-size="16" fill="%23F2E9DC" text-anchor="middle">Admin</text>
            <text x="62" y="60" font-family="'JetBrains Mono', monospace" font-size="9" fill="%23C19A6B" text-anchor="middle">FULL ACCESS</text>

            <rect x="142" y="0" width="125" height="85" rx="6" fill="%235C4033"/>
            <text x="204" y="35" font-family="'Newsreader', serif" font-size="16" fill="%23F2E9DC" text-anchor="middle">Faculty</text>
            <text x="204" y="60" font-family="'JetBrains Mono', monospace" font-size="9" fill="%23DAC4AC" text-anchor="middle">RUBRIC SCORING</text>

            <rect x="284" y="0" width="125" height="85" rx="6" fill="%238B6F52"/>
            <text x="346" y="35" font-family="'Newsreader', serif" font-size="16" fill="%23F2E9DC" text-anchor="middle">Student</text>
            <text x="346" y="60" font-family="'JetBrains Mono', monospace" font-size="9" fill="%23F2E9DC" text-anchor="middle">SUBMISSION</text>
          </g>

          <!-- NLP Semantic Similarity Spectrum -->
          <g transform="translate(0, 235)">
            <rect x="0" y="0" width="480" height="195" rx="10" fill="%23352820" stroke="%235C4033" stroke-width="1.5"/>
            <text x="35" y="40" font-family="'JetBrains Mono', monospace" font-size="11" fill="%23C19A6B">ASAG NLP PIPELINE TELEMETRY</text>

            <!-- Curve Wave Representation -->
            <path d="M 40 140 Q 140 70, 240 120 T 440 80" fill="none" stroke="%23C19A6B" stroke-width="3"/>
            <circle cx="240" cy="120" r="6" fill="%23F2E9DC"/>
            <circle cx="440" cy="80" r="6" fill="%23C19A6B"/>

            <text x="35" y="175" font-family="'JetBrains Mono', monospace" font-size="11" fill="%23DAC4AC">AUTOMATED DESCRIPTIVE GRADING (ASAG)</text>
          </g>
        </g>
      </g>
    </svg>`
  }
];

export function getProjectAction(project: ProjectItem): {
  url: string | null;
  label: string;
  isAvailable: boolean;
  type: 'live' | 'github' | 'soon';
} {
  if (project.projectUrl && project.projectUrl.trim().length > 0) {
    return {
      url: project.projectUrl,
      label: 'Explore Project',
      isAvailable: true,
      type: 'live',
    };
  }
  if (project.githubUrl && project.githubUrl.trim().length > 0) {
    return {
      url: project.githubUrl,
      label: 'Explore Project',
      isAvailable: true,
      type: 'github',
    };
  }
  return {
    url: null,
    label: 'Coming Soon',
    isAvailable: false,
    type: 'soon',
  };
}
