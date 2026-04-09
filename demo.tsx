import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  Flame,
  Github,
  Mail,
  Sparkles,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { LiquidButton } from "@/components/ui/liquid-glass-button"

const contributionLevels = [
  "bg-[#0d1a12]",
  "bg-[#163b22]",
  "bg-[#1f6b33]",
  "bg-[#33a24a]",
  "bg-[#64d279]",
]

type ContributionDay = {
  date: string
  count: number
  level: number
}

type ContributionApiResponse = {
  contributions?: Array<{
    date: string
    count: number
    level?: number
  }>
}

const GITHUB_USERNAME = "abishek2429"
const CALENDAR_WEEKS = 42
const DAYS_PER_WEEK = 7

function dateToISO(date: Date) {
  return date.toISOString().slice(0, 10)
}

function toLevel(count: number) {
  if (count <= 0) return 0
  if (count <= 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

export default function DemoOne() {
  const [contributions, setContributions] = useState<ContributionDay[]>([])
  const [isLoadingContributions, setIsLoadingContributions] = useState(true)
  const [contributionsError, setContributionsError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadContributions() {
      setIsLoadingContributions(true)
      setContributionsError(null)

      try {
        const response = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=last`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(`GitHub contributions API returned ${response.status}`)
        }

        const data = (await response.json()) as ContributionApiResponse
        const records = Array.isArray(data.contributions) ? data.contributions : []

        const normalized = records
          .map((entry) => ({
            date: entry.date,
            count: Number(entry.count) || 0,
            level: typeof entry.level === "number" ? entry.level : toLevel(Number(entry.count) || 0),
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        const dayMap = new Map(normalized.map((entry) => [entry.date, entry]))
        const latestDate = normalized.length ? normalized[normalized.length - 1].date : undefined
        const endDate = latestDate ? new Date(`${latestDate}T00:00:00Z`) : new Date()

        const totalDays = CALENDAR_WEEKS * DAYS_PER_WEEK
        const startDate = new Date(endDate)
        startDate.setUTCDate(startDate.getUTCDate() - (totalDays - 1))

        const fullRange: ContributionDay[] = []
        for (let i = 0; i < totalDays; i++) {
          const cursor = new Date(startDate)
          cursor.setUTCDate(startDate.getUTCDate() + i)
          const iso = dateToISO(cursor)
          const day = dayMap.get(iso)

          fullRange.push({
            date: iso,
            count: day?.count ?? 0,
            level: day?.level ?? toLevel(day?.count ?? 0),
          })
        }

        setContributions(fullRange)
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setContributionsError("Unable to load live GitHub contribution data right now.")
        }
      } finally {
        setIsLoadingContributions(false)
      }
    }

    void loadContributions()

    return () => {
      controller.abort()
    }
  }, [])

  const contributionWeeks = useMemo(() => {
    const columns: ContributionDay[][] = []
    for (let week = 0; week < CALENDAR_WEEKS; week++) {
      columns.push(contributions.slice(week * DAYS_PER_WEEK, week * DAYS_PER_WEEK + DAYS_PER_WEEK))
    }
    return columns
  }, [contributions])

  const monthLabels = useMemo(() => {
    let previousMonth = ""

    return contributionWeeks.map((week) => {
      const weekStart = week[0]
      if (!weekStart) return ""

      const month = new Date(`${weekStart.date}T00:00:00Z`).toLocaleString("en-US", {
        month: "short",
        timeZone: "UTC",
      })

      if (month === previousMonth) return ""
      previousMonth = month
      return month
    })
  }, [contributionWeeks])

  const totalContributions = useMemo(
    () => contributions.reduce((sum, day) => sum + day.count, 0),
    [contributions]
  )
  const activeDays = useMemo(
    () => contributions.filter((day) => day.count > 0).length,
    [contributions]
  )
  const bestDay = useMemo(
    () => contributions.reduce((max, day) => Math.max(max, day.count), 0),
    [contributions]
  )

  const metrics = [
    { label: "Contributions", value: totalContributions, icon: CalendarDays },
    { label: "Active Days", value: activeDays, icon: Github },
    { label: "Best Day", value: bestDay, icon: Flame },
  ]
  const projects = [
    {
      title: "Pulse Dashboard",
      blurb: "A realtime analytics workspace with clean visual hierarchy and responsive data states.",
    },
    {
      title: "Atlas Commerce",
      blurb: "A conversion-focused shopping platform with crafted interactions and sharp performance.",
    },
    {
      title: "Nebula Studio",
      blurb: "A design system playground that accelerates product experiments across teams.",
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(80,208,255,0.15),transparent_35%),radial-gradient(circle_at_90%_24%,rgba(74,222,128,0.16),transparent_30%),radial-gradient(circle_at_35%_100%,rgba(250,204,21,0.1),transparent_34%)]" />
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#1f7dff]/20 blur-3xl anim-float-slow" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-[#22c55e]/15 blur-3xl anim-float" />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 md:px-8 md:pt-14">
        <section className="anim-rise rounded-3xl border border-white/10 bg-[#070b14]/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/70">
                <Sparkles className="h-3.5 w-3.5" />
                Developer Portfolio
              </div>
              <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-7xl">Abishek</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">
                Frontend developer crafting clean interfaces, thoughtful interactions, and performant products.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <LiquidButton className="rounded-full border-white/25 px-6 text-white" size="xl">
                Contact Me
                <Mail className="ml-2 h-4 w-4" />
              </LiquidButton>
              <LiquidButton className="rounded-full border-white/20 px-6 text-white/90" size="xl">
                View Projects
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </LiquidButton>
            </div>
          </div>
        </section>

        <section className="anim-rise rounded-3xl border border-white/10 bg-[#050910]/90 shadow-[0_20px_60px_rgba(0,0,0,0.42)]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 md:px-8">
            <div className="flex items-center gap-3 text-xl font-semibold">
              <Github className="h-5 w-5 text-white/90" />
              <span>OPEN SOURCE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold">{totalContributions}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/60">rolling</span>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5 md:px-8 md:py-6">
            <div className="flex flex-wrap gap-7">
              {metrics.map((metric) => (
                <div key={metric.label} className="flex items-center gap-2 text-base">
                  <metric.icon className="h-4 w-4 text-white/65" />
                  <span className="font-semibold text-white">{metric.value}</span>
                  <span className="text-white/60">{metric.label}</span>
                </div>
              ))}
            </div>

            <div className="relative overflow-x-auto pb-1">
              <div className="min-w-[720px]">
                <div
                  className="mb-3 grid gap-1.5 px-1 text-sm text-[#7d8da6]"
                  style={{ gridTemplateColumns: "repeat(42, minmax(0, 1fr))" }}
                >
                  {monthLabels.map((month, col) => (
                    <div key={`month-${col}`} className="h-6">
                      {month}
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5 p-1">
                  {contributionWeeks.map((week, col) => (
                    <div key={`col-${col}`} className="flex flex-col gap-1.5">
                      {week.map((day, row) => (
                        <div
                          key={`${day.date}-${row}`}
                          className={`h-4 w-4 rounded-[3px] border border-black/20 ${contributionLevels[day.level] ?? contributionLevels[0]} transition-transform duration-200 hover:scale-110`}
                          title={`${day.count} contributions on ${day.date}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {(isLoadingContributions || contributionsError) && (
                  <p className="mt-3 text-sm text-white/60">
                    {isLoadingContributions
                      ? "Loading live GitHub contributions..."
                      : contributionsError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {projects.map((project, index) => (
            <article
              key={project.title}
              className="anim-rise rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <Briefcase className="h-5 w-5 text-[#9ad2ff]" />
              <h3 className="mt-4 text-lg font-semibold">{project.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{project.blurb}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
