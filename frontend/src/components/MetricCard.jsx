import { useEffect, useState } from "react"
import { useTheme } from "../context/ThemeContext"

function useCountUp(target, duration = 1000) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (target === null || target === undefined) return
    const num = parseFloat(target)
    if (isNaN(num)) return
    let startTime = null
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(num * eased * 10) / 10)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])
  return display
}

export default function MetricCard({ title, value, suffix = "", subtitle, icon: Icon, color, badge }) {
  const { isDark } = useTheme()
  const animated = useCountUp(value)

  const colorMap = {
    blue:   { icon: isDark ? "text-blue-400"   : "text-blue-600",   bg: isDark ? "bg-zinc-800" : "bg-gray-100" },
    green:  { icon: isDark ? "text-emerald-400" : "text-emerald-600", bg: isDark ? "bg-zinc-800" : "bg-gray-100" },
    red:    { icon: isDark ? "text-red-400"     : "text-red-600",    bg: isDark ? "bg-zinc-800" : "bg-gray-100" },
    orange: { icon: isDark ? "text-amber-400"   : "text-amber-600",  bg: isDark ? "bg-zinc-800" : "bg-gray-100" },
  }
  const c = colorMap[color] || colorMap.blue

  const isNumeric = value !== null && value !== undefined && !isNaN(parseFloat(value))
  const displayValue = value === null || value === undefined
    ? "..."
    : !isNumeric
      ? value
      : suffix
        ? (Number.isInteger(parseFloat(value)) ? Math.round(animated) : animated.toFixed(1)) + suffix
        : Math.round(animated)

  return (
    <div className={"rounded-xl p-3.5 lg:p-4 border flex items-center gap-3 transition-colors " +
      (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")}>
      <div className={"w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center flex-shrink-0 " + c.bg}>
        <Icon size={17} className={c.icon} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={"text-xs font-medium truncate " + (isDark ? "text-zinc-500" : "text-gray-400")}>
          {title}
        </p>
        <p className={"text-lg lg:text-xl font-bold tabular-nums " + (isDark ? "text-white" : "text-gray-800")}>
          {displayValue}
        </p>
        <p className={"text-xs truncate " + (isDark ? "text-zinc-600" : "text-gray-400")}>
          {subtitle}
        </p>
      </div>
    </div>
  )
}