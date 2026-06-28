import { useTheme } from "../context/ThemeContext"
import { TrendingUp, TrendingDown } from "lucide-react"

export default function MetricCard({ title, value, subtitle, icon: Icon, color, trend, trendValue }) {
  const { isDark } = useTheme()

  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20",
  }

  return (
    <div className={`rounded-2xl p-5 shadow-sm border transition-colors duration-300
      ${isDark
        ? "bg-slate-800 border-slate-700"
        : "bg-white border-gray-100"}`}>

      {/* Header card */}
      <div className="flex items-center justify-between mb-4">
        <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}>
          {title}
        </p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>

      {/* Valeur principale */}
      <p className={`text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-gray-800"}`}>
        {value}
      </p>

      {/* Sous-titre + trend */}
      <div className="flex items-center gap-2">
        <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>
          {subtitle}
        </p>
        {trendValue && (
          <div className={`flex items-center gap-1 text-xs font-medium
            ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
            {trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  )
}