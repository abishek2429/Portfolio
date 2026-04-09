# Portfolio

This repository currently contains a static HTML/CSS portfolio.

## Current Status

- React: not configured
- TypeScript: not configured
- Tailwind CSS: not configured
- shadcn/ui structure: not configured

Because this stack is not present yet, follow the setup steps below first, then use the integrated component files added in this repo.

## Setup to Support shadcn + Tailwind + TypeScript

Run these commands from the project root:

```bash
# 1) Create a Next.js app with TypeScript (recommended base for shadcn)
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 2) Initialize shadcn
npx shadcn@latest init

# 3) Install required dependencies for the provided components
npm install three @radix-ui/react-slot class-variance-authority lucide-react clsx tailwind-merge
```

## Default Paths and Why They Matter

- Default shadcn component path: `components/ui`
- Default global styles path in App Router projects: `src/app/globals.css` (or `app/globals.css` if not using `src`)

If your current setup does not use `components/ui`, create it.

Why this is important:
- Keeps all reusable UI primitives in one predictable location
- Matches shadcn generator defaults and community conventions
- Keeps imports consistent like `@/components/ui/...`
- Reduces refactor effort when adding future shadcn components

## Files Added for Integration

- `components/ui/web-gl-shader.tsx`
- `components/ui/liquid-glass-button.tsx`
- `lib/utils.ts`
- `demo.tsx`

## Component Analysis Checklist

1. Structure and dependencies
- `WebGLShader`: uses `three`, `useEffect`, `useRef`
- `LiquidButton`: uses `@radix-ui/react-slot`, `class-variance-authority`, `cn` utility
- `DemoOne`: composes both components

2. Arguments and state
- `WebGLShader` has no props and manages internal render-loop state via refs
- `LiquidButton` accepts variant, size, className, and native button props

3. Providers/hooks/context
- No extra context providers are required
- Hooks used: `useEffect`, `useRef`, `useState`

4. Questions to confirm before production usage
- What props/data should drive CTA text and shader intensity?
- Is any global state manager required for button/loading behavior?
- Are there required brand assets, logos, or image sources?
- Should mobile use reduced effects for performance?
- Where should this demo section live (home hero, landing page, or dedicated route)?

## Notes on Images and Icons

- The provided components do not require image assets.
- If you add hero/project imagery, use known Unsplash URLs and load through Next Image config when using Next.js.
- If logos/icons are needed, use `lucide-react` components for consistency.
