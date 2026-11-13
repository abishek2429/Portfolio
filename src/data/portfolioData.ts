import { Project, projectsData } from './projectsData';

export type { Project };
export { projectsData };

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  period: string;
  status: string;
  cgpa?: string;
  description: string;
  focusAreas: string[];
}

export interface SkillItem {
  name: string;
  note?: string;
}

export interface SkillCategory {
  id: string;
  title: string;
  description: string;
  skills: SkillItem[];
}

export interface GoalPoint {
  title: string;
  area: string;
}

export interface GoalGroup {
  id: string;
  phase: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  items: GoalPoint[];
}

export interface PortfolioData {
  profile: {
    name: string;
    domain: string;
    title: string;
    intro: string;
    tagline: string;
    location: string;
    coordinates: string;
    availability: string;
    email: string;
    website: string;
    github: string;
    githubUsername: string;
    linkedin: string;
    linkedinUsername: string;
    technicalInterests: {
      title: string;
      description: string;
      icon: string;
    }[];
    aboutNarrative: string[];
  };
  education: EducationItem[];
  projects: Project[];
  skills: SkillCategory[];
  goals: GoalGroup[];
  siteMetadata: {
    established: string;
    version: string;
    typeface: string;
    paletteSummary: string;
    license: string;
  };
}

export const portfolioData: PortfolioData = {
  profile: {
    name: "ABISHEK S",
    domain: "abishek.app",
    title: "Software Developer",
    intro: "Software developer interested in backend engineering, application development, algorithms, system design and cloud technologies.",
    tagline: "Constructing reliable backend services, robust application architectures, and algorithmically sound systems with deliberate attention to scalability, correctness, and performance.",
    location: "Coimbatore, Tamil Nadu, India",
    coordinates: "11°00'N 76°57'E",
    availability: "Open for Software Engineering opportunities and select collaborations",
    email: "abishek027181@gmail.com",
    website: "https://abishek.app",
    github: "https://github.com/abishek2429",
    githubUsername: "abishek2429",
    linkedin: "https://linkedin.com/in/abishek-s-a86209247",
    linkedinUsername: "abishek-s-a86209247",
    technicalInterests: [
      {
        title: "Backend Engineering",
        description: "Designing performant REST APIs, service pipelines, resilient concurrency, and normalized data storage.",
        icon: "Server"
      },
      {
        title: "Application Development",
        description: "Building cohesive end-to-end applications with strict type contracts, modular architecture, and low latency.",
        icon: "Code2"
      },
      {
        title: "Algorithms & Problem-Solving",
        description: "Analyzing computational complexity, structuring optimal data models, and implementing efficient algorithms.",
        icon: "Cpu"
      },
      {
        title: "System Design & Cloud",
        description: "Architecting decoupled services, evaluating distributed trade-offs, and deploying containerized environments.",
        icon: "Cloud"
      }
    ],
    aboutNarrative: [
      "I am a software developer based in Coimbatore, Tamil Nadu, India, driven by an interest in backend systems, distributed architectures, and purposeful application development.",
      "My work focuses on decomposing complex engineering problems into clean, maintainable primitives. From structuring relational schemas and crafting deterministic APIs to analyzing algorithmic trade-offs, I prioritize correctness, durability, and system clarity over superficial complexity.",
      "I am constantly expanding my foundation across systems architecture, cloud infrastructure, and modern engineering practices—aiming to build software that operates reliably at scale and solves genuine problems."
    ]
  },
  education: [
    {
      id: "psg-mca",
      degree: "Master of Computer Applications (MCA)",
      institution: "PSG College of Technology",
      location: "Coimbatore, Tamil Nadu, India",
      period: "2025 – Present",
      status: "In Progress",
      cgpa: "7.77",
      description: "Postgraduate program focused on advanced software engineering, distributed systems, scalable application architecture, database engineering, and modern cloud technologies.",
      focusAreas: [
        "Enterprise Application Architecture",
        "Distributed Systems & Cloud Computing",
        "Advanced Database Engineering",
        "Algorithmic Analysis & Optimization"
      ]
    },
    {
      id: "psg-bsc",
      degree: "Bachelor of Science in Computer Science",
      institution: "PSG College of Technology",
      location: "Coimbatore, Tamil Nadu, India",
      period: "2022 – 2025",
      status: "Completed",
      description: "Undergraduate curriculum building rigorous foundational competencies in computer science, core data structures, algorithms, operating systems, and software design principles.",
      focusAreas: [
        "Data Structures & Algorithms",
        "Database Management Systems & SQL",
        "Operating Systems & Computer Networks",
        "Object-Oriented Software Design"
      ]
    }
  ],
  projects: projectsData,
  skills: [
    {
      id: "programming",
      title: "Programming",
      description: "Core languages utilized for system logic, algorithms, and application development.",
      skills: [
        { name: "Java" },
        { name: "Python" },
        { name: "C" },
        { name: "Kotlin" }
      ]
    },
    {
      id: "backend",
      title: "Backend",
      description: "Server architecture, microservices, and enterprise API engineering.",
      skills: [
        { name: "Spring Boot" },
        { name: "REST APIs" }
      ]
    },
    {
      id: "frontend",
      title: "Frontend",
      description: "Interface development, web standards, and client-side application engineering.",
      skills: [
        { name: "React" },
        { name: "HTML" },
        { name: "CSS" },
        { name: "JavaScript" }
      ]
    },
    {
      id: "database",
      title: "Database",
      description: "Relational modeling, schema design, and document data storage.",
      skills: [
        { name: "PostgreSQL" },
        { name: "MongoDB" },
        { name: "MySQL" }
      ]
    },
    {
      id: "devops-cloud",
      title: "DevOps & Cloud",
      description: "Containerization, CI/CD deployment pipelines, and cloud computing infrastructure.",
      skills: [
        { name: "Docker" },
        { name: "Jenkins" },
        { name: "Ansible" },
        { name: "AWS" }
      ]
    },
    {
      id: "tools",
      title: "Tools",
      description: "Version control systems, development environments, and Unix operating systems.",
      skills: [
        { name: "Git" },
        { name: "GitHub" },
        { name: "Linux" },
        { name: "IntelliJ IDEA" },
        { name: "Visual Studio Code" }
      ]
    }
  ],
  goals: [
    {
      id: "current-focus",
      phase: "Phase 01 // Present Horizon",
      badge: "Current Focus",
      title: "Active Foundations & Core Milestones",
      subtitle: "Deliberate technical practice, hands-on backend construction, and algorithmic growth",
      description: "Targeted daily engineering practice focused on foundational problem solving, enterprise backend patterns, cloud fundamentals, and building tangible software.",
      items: [
        {
          title: "Improving Data Structures and Algorithms",
          area: "Algorithmic Efficiency & Problem Solving"
        },
        {
          title: "Developing backend applications using Java and Spring Boot",
          area: "Enterprise Backend Architecture"
        },
        {
          title: "Learning cloud infrastructure",
          area: "Scalable Cloud Engineering"
        },
        {
          title: "Understanding DevOps and CI/CD automation",
          area: "Continuous Delivery & Containers"
        },
        {
          title: "Building original real-world software projects",
          area: "Practical Systems Construction"
        }
      ]
    },
    {
      id: "long-term",
      phase: "Phase 02 // Future Horizon",
      badge: "Long-Term Goals",
      title: "Engineering Ambitions & Career Direction",
      subtitle: "Sustained progression toward high-impact systems engineering and technical leadership",
      description: "Long-term ambition to architect durable distributed systems, master cloud platforms, and solve demanding operational challenges within high-standard engineering cultures.",
      items: [
        {
          title: "Become a strong software engineer",
          area: "Technical Craft & Engineering Rigor"
        },
        {
          title: "Design and develop scalable backend systems",
          area: "High-Throughput Distributed Architecture"
        },
        {
          title: "Gain expertise in cloud engineering",
          area: "Cloud-Native Systems & Reliability"
        },
        {
          title: "Understand distributed systems",
          area: "Consensus, Fault Tolerance & Networking"
        },
        {
          title: "Work with engineering teams at reputed product-based companies",
          area: "Collaborative High-Impact Product Engineering"
        }
      ]
    }
  ],
  siteMetadata: {
    established: "2026",
    version: "1.0.0-editorial",
    typeface: "Newsreader / Playfair Display & Plus Jakarta Sans",
    paletteSummary: "Warm Cream (#F2E9DC), Soft Beige (#E5D5C1), Muted Brown (#8B6F52), Deep Brown (#5C4033), Espresso (#352820), Caramel (#C19A6B)",
    license: "MIT — Content & Design copyright Abishek S"
  }
};

