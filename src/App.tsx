import { useState, useEffect, useRef } from "react"
import questMarkdown from "./content/mini-quests.md?raw"

type Quest = { emoji: string text: string }

function parseQuests(markdown: string): Quest[] {
  const quests = markdown
    .split("\n")
    .filter((line) => line.trimStart().startsWith("- "))
    .map((line) => {
      const [emoji, ...text] = line.trimStart().slice(2).split("|")
      return { emoji: emoji.trim(), text: text.join("|").trim() }
    })
    .filter((quest) => quest.emoji && quest.text)

  if (!quests.length) {
    throw new Error("Add at least one quest to src/content/mini-quests.md")
  }

  return quests
}

const QUESTS = parseQuests(questMarkdown)

const STORAGE_KEY = "walkquest_completions"
const QUEST_SELECTIONS_KEY = "walkquest_selections"
const COMPLETION_TIMES_KEY = "walkquest_completion_times"
const HISTORY_RESET_KEY = "walkquest_history_reset_v1"

function loadCompletions(): Record<string, string> {
  try {
    if (!localStorage.getItem(HISTORY_RESET_KEY)) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(COMPLETION_TIMES_KEY)
      localStorage.setItem(HISTORY_RESET_KEY, "true")
    }

    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
  } catch {
    return {}
  }
}
function saveCompletions(c: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
}
function loadCompletionTimes() {
  try {
    const stored: Record<string, unknown> = JSON.parse(
      localStorage.getItem(COMPLETION_TIMES_KEY) || "{}",
    )
    return Object.fromEntries(
      Object.entries(stored).filter(
        ([, time]) =>
          typeof time === "string" && !Number.isNaN(new Date(time).getTime()),
      ),
    ) as Record<string, string>
  } catch {
    return {}
  }
}
function saveCompletionTimes(times: Record<string, string>) {
  localStorage.setItem(COMPLETION_TIMES_KEY, JSON.stringify(times))
}
function loadQuestSelections(): Record<string, number> {
  try {
    const stored: Record<string, unknown> = JSON.parse(
      localStorage.getItem(QUEST_SELECTIONS_KEY) || "{}",
    )
    return Object.fromEntries(
      Object.entries(stored).filter(
        ([, index]) =>
          Number.isInteger(index) &&
          index as number >= 0 &&
          index as number < QUESTS.length,
      ),
    ) as Record<string, number>
  } catch {
    return {}
  }
}
function saveQuestSelections(selections: Record<string, number>) {
  localStorage.setItem(QUEST_SELECTIONS_KEY, JSON.stringify(selections))
}
function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}
function todayKey() {
  const n = new Date()
  return dateKey(n.getFullYear(), n.getMonth(), n.getDate())
}
function questIndexForDate(y: number, m: number, d: number) {
  const seed = y * 10000 + (m + 1) * 100 + d
  return seed % QUESTS.length
}
function questForDate(y: number, m: number, d: number, selectedIndex?: number) {
  return QUESTS[selectedIndex ?? questIndexForDate(y, m, d)]
}
function formatCompletionTime(completedAt: string) {
  const date = new Date(completedAt)
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date)
  const timeLabel = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
  return `${dateLabel} at ${timeLabel}`
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const COMPLETION_PRAISES = [
  "Tremendous",
  "Spectacular",
  "Braggable",
  "Glorious",
  "Dazzling",
  "Legendary",
  "Phenomenal",
  "Magnificent",
  "Stupendous",
  "Fearless",
  "Heroic",
  "Radiant",
  "Splendiferous",
  "Colossal",
  "Triumphant",
  "Astounding",
  "Swashbuckling",
  "Marvelous",
  "Unstoppable",
  "Epic",
]

export default function App() {
  const now = new Date()
  const todayY = now.getFullYear()
  const todayM = now.getMonth()
  const todayD = now.getDate()
  const tk = todayKey()

  const [accepted, setAccepted] = useState(false)
  const [completions, setCompletions] =
    useState<Record<string, string>>(loadCompletions)
  const [completionTimes, setCompletionTimes] =
    useState<Record<string, string>>(loadCompletionTimes)
  const [questSelections, setQuestSelections] =
    useState<Record<string, number>>(loadQuestSelections)
  const [viewYear, setViewYear] = useState(todayY)
  const [viewMonth, setViewMonth] = useState(todayM)
  const [stampDay, setStampDay] = useState<number | null>(null)
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null)
  const [justCompleted, setJustCompleted] = useState(false)
  const [completionPraise, setCompletionPraise] = useState(
    COMPLETION_PRAISES[0],
  )
  const [questEmojiWiggle, setQuestEmojiWiggle] = useState(false)
  const stampRef = useRef<HTMLDivElement | null>(null)

  const alreadyDone = Boolean(completions[tk])
  const todayQuest = questForDate(todayY, todayM, todayD, questSelections[tk])

  useEffect(() => {
    if (alreadyDone) setAccepted(true)
  }, [alreadyDone])

  function handleAccept() {
    setAccepted(true)
    setQuestEmojiWiggle(true)
    setTimeout(() => setQuestEmojiWiggle(false), 500)
  }

  function handlePickNewQuest() {
    if (alreadyDone) {
      const updatedCompletions = { ...completions }
      delete updatedCompletions[tk]
      setCompletions(updatedCompletions)
      saveCompletions(updatedCompletions)
      const updatedCompletionTimes = { ...completionTimes }
      delete updatedCompletionTimes[tk]
      setCompletionTimes(updatedCompletionTimes)
      saveCompletionTimes(updatedCompletionTimes)
      setAccepted(false)
      setJustCompleted(false)
    }

    const currentIndex =
      questSelections[tk] ?? questIndexForDate(todayY, todayM, todayD)
    let nextIndex = currentIndex
    if (QUESTS.length > 1) {
      while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * QUESTS.length)
      }
    }
    const updated = { ...questSelections, [tk]: nextIndex }
    setQuestSelections(updated)
    saveQuestSelections(updated)
    setQuestEmojiWiggle(true)
    setTimeout(() => setQuestEmojiWiggle(false), 500)
  }

  function handleComplete() {
    const updated = { ...completions, [tk]: todayQuest.emoji }
    const updatedCompletionTimes = {
      ...completionTimes,
      [tk]: new Date().toISOString(),
    }
    setCompletions(updated)
    saveCompletions(updated)
    setCompletionTimes(updatedCompletionTimes)
    saveCompletionTimes(updatedCompletionTimes)
    setStampDay(todayD)
    setViewYear(todayY)
    setViewMonth(todayM)
    setJustCompleted(true)
    setCompletionPraise(
      COMPLETION_PRAISES[Math.floor(Math.random() * COMPLETION_PRAISES.length)],
    )
    setTimeout(() => {
      stampRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 150)
    setTimeout(() => setStampDay(null), 2000)
  }

  // Calendar
  const firstDow = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const isCurrent = viewYear === todayY && viewMonth === todayM

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (!isCurrent) {
      if (viewMonth === 11) {
        setViewMonth(0)
        setViewYear((y) => y + 1)
      } else setViewMonth((m) => m + 1)
    }
  }

  const cells: Array<{ day: number | null }> = []
  for (let i = 0; i < firstDow; i++) cells.push({ day: null })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d })
  while (cells.length % 7 !== 0) cells.push({ day: null })

  // Count completions this month
  const monthCompletions = Object.keys(completions).filter((k) => {
    const [ky, km] = k.split("-").map(Number)
    return ky === viewYear && km - 1 === viewMonth
  }).length
  const selectedQuest = selectedStamp
    ? (() => {
        const [year, month, day] = selectedStamp.split("-").map(Number)
        return {
          ...questForDate(year, month - 1, day, questSelections[selectedStamp]),
          day,
          month: month - 1,
          year,
          completedAt: completionTimes[selectedStamp],
        }
      })()
    : null

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, #1a0a2e 0%, #0f0520 60%, #1a0a2e 100%)",
        fontFamily: "Nunito, sans-serif",
        color: "#fff",
      }}
    >
      {/* Stars bg decoration */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: i % 3 === 0 ? "3px" : "2px",
              height: i % 3 === 0 ? "3px" : "2px",
              borderRadius: "50%",
              background: "#c4b5fd",
              opacity: 0.3 + (i % 4) * 0.15,
              top: `${(i * 37 + 11) % 95}%`,
              left: `${(i * 53 + 7) % 95}%`,
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "420px",
          margin: "0 auto",
          padding: "24px 16px 64px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
            <span style={{ fontSize: "1.6rem" }}>🥾</span>
            <h1
              style={{
                fontFamily: "Fredoka, sans-serif",
                fontWeight: 700,
                fontSize: "2.2rem",
                background:
                  "linear-gradient(135deg, #c4b5fd, #818cf8, #f472b6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: 0,
              }}
            >
              Walking Quests
            </h1>
            <span style={{ fontSize: "1.6rem" }}>🗺️</span>
          </div>
          <p
            style={{
              color: "#9b5ef8",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {MONTHS[todayM]} {todayD}, {todayY}
          </p>
        </div>

        {/* Quest Card */}
        <div
          className="quest-card"
          style={{ padding: "28px 24px", marginBottom: "20px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                fontFamily: "Fredoka, sans-serif",
                fontWeight: 600,
                fontSize: "0.75rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#a78bfa",
              }}
            >
              Daily Quest
            </span>
            <button
              type="button"
              className="reroll-button"
              onClick={handlePickNewQuest}
              aria-label="Pick a different quest"
              title={
                alreadyDone
                  ? "Pick a new quest and reset today's completion"
                  : "Pick a different quest"
              }
            >
              ♻
            </button>
          </div>

          <div
            style={{
              textAlign: "center",
              fontSize: "5rem",
              lineHeight: 1,
              marginBottom: "20px",
            }}
            className={questEmojiWiggle ? "wiggle" : ""}
          >
            {todayQuest.emoji}
          </div>

          <p
            style={{
              fontFamily: "Fredoka, sans-serif",
              fontWeight: 500,
              fontSize: "1.2rem",
              color: "#e9d5ff",
              textAlign: "center",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {todayQuest.text}
          </p>
        </div>

        {/* Accept / complete flow */}
        {!alreadyDone && (
          <div style={{ marginBottom: "24px" }}>
            {!accepted ? (
              <button
                className="btn-accept"
                style={{ width: "100%", padding: "16px" }}
                onClick={handleAccept}
              >
                I take this quest!! 🎒
              </button>
            ) : (
              <div className="float-up" style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontFamily: "Fredoka, sans-serif",
                    fontWeight: 700,
                    fontSize: "1.6rem",
                    color: "#fbbf24",
                    marginBottom: "14px",
                    textShadow: "0 0 20px rgba(251,191,36,0.5)",
                  }}
                >
                  Go forth! ⚡
                </p>
                <button
                  className="btn-complete"
                  style={{ width: "100%", padding: "16px" }}
                  onClick={handleComplete}
                >
                  Complete Quest ✓
                </button>
              </div>
            )}
          </div>
        )}

        {alreadyDone && (
          <div
            className="float-up"
            style={{
              textAlign: "center",
              marginBottom: "24px",
              padding: "16px 20px",
              background: "rgba(16,185,129,0.15)",
              border: "2px solid #10b981",
              borderRadius: "18px",
            }}
          >
            <p
              style={{
                fontFamily: "Fredoka, sans-serif",
                fontWeight: 700,
                fontSize: "1.15rem",
                color: "#34d399",
                margin: 0,
              }}
            >
              {justCompleted
                ? `Quest complete! ${completionPraise}! 🎉`
                : `Quest already stamped! ${completions[tk]}`}
            </p>
            {!justCompleted && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#6ee7b7",
                  marginTop: "4px",
                }}
              >
                Back tomorrow for a new adventure.
              </p>
            )}
          </div>
        )}

        {/* Calendar */}
        <div className="calendar-wrap" style={{ padding: "20px" }}>
          {/* Month header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <button className="nav-btn" onClick={prevMonth}>
              ‹
            </button>
            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontFamily: "Fredoka, sans-serif",
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  color: "#e9d5ff",
                  margin: 0,
                }}
              >
                {MONTHS[viewMonth]} {viewYear}
              </h2>
              {monthCompletions > 0 && (
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: "#a78bfa",
                    margin: "2px 0 0",
                    fontWeight: 700,
                  }}
                >
                  {monthCompletions} quest{monthCompletions !== 1 ? "s" : ""}{" "}
                  completed
                </p>
              )}
            </div>
            <button
              className="nav-btn"
              onClick={nextMonth}
              disabled={isCurrent}
            >
              ›
            </button>
          </div>

          {/* Day labels */}
          <div className="calendar-grid" style={{ marginBottom: "6px" }}>
            {DAYS.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  color: "#7c3aed",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "2px 0",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="calendar-grid">
            {cells.map((cell, i) => {
              if (!cell.day) return <div key={i} className="day-cell empty" />

              const k = dateKey(viewYear, viewMonth, cell.day)
              const isToday = isCurrent && cell.day === todayD
              const stamp = completions[k]
              const isStamping = stampDay === cell.day && isCurrent
              const isPast =
                viewYear < todayY ||
                (viewYear === todayY &&
                  (viewMonth < todayM ||
                    (viewMonth === todayM && cell.day < todayD)))

              const rotationSeed =
                (viewYear * 10000 + (viewMonth + 1) * 100 + cell.day) * 9301 +
                49297
              const rot = ((rotationSeed % 233280) / 233280) * 16 - 8

              return (
                <div
                  key={i}
                  ref={isStamping ? stampRef : undefined}
                  className={`day-cell ${
                    stamp ? "has-stamp" : isToday ? "today" : "plain"
                  } ${isStamping ? "stamp-cell-animate" : ""}`}
                  style={
                    stamp
                      ? {
                          "--stamp-rot": `${rot.toFixed(1)}deg`,
                        } as React.CSSProperties
                      : undefined
                  }
                >
                  {stamp && isPast ? (
                    <button
                      type="button"
                      className={`stamp-emoji ${
                        isStamping ? "stamp-animate" : ""
                      }`}
                      aria-label={
                        isPast
                          ? `View quest completed on ${MONTHS[viewMonth]} ${cell.day}, ${viewYear}`
                          : `Quest completed on ${MONTHS[viewMonth]} ${cell.day}, ${viewYear}`
                      }
                      aria-expanded={isPast ? selectedStamp === k : undefined}
                      onMouseEnter={() => {
                        if (isPast) setSelectedStamp(k)
                      }}
                      onFocus={() => {
                        if (isPast) setSelectedStamp(k)
                      }}
                      onClick={() => {
                        if (isPast)
                          setSelectedStamp((current) =>
                            current === k ? null : k,
                          )
                      }}
                    >
                      {stamp}
                    </button>
                  ) : stamp ? (
                    <div
                      className={`stamp-emoji ${
                        isStamping ? "stamp-animate" : ""
                      }`}
                      aria-label={`Quest completed on ${MONTHS[viewMonth]} ${cell.day}, ${viewYear}`}
                    >
                      {stamp}
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.72rem", fontWeight: 800 }}>
                      {cell.day}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {selectedQuest && (
            <div className="past-quest" role="status" aria-live="polite">
              <div className="past-quest-date">
                {formatCompletionTime(selectedQuest.completedAt)}
              </div>
              <div className="past-quest-content">
                <span aria-hidden="true">{selectedQuest.emoji}</span>
                <p>{selectedQuest.text}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            color: "#4a2080",
            fontSize: "0.7rem",
            marginTop: "28px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          One quest · One walk · Every day
        </p>
      </div>
    </div>
  )
}
