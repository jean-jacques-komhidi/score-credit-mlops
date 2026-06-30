import { useTheme } from "../context/ThemeContext"

export default function MetricCard({ title, value, subtitle, icon: Icon, color, badge }) {
  const { isDark } = useTheme()

  const colorMap = {
    blue: { bg: isDark ? "bg-blue-500/15" : "bg-blue-50", text: isDark ? "text-blue-400" : "text-blue-600" },
    green: { bg: isDark ? "bg-green-500/15" : "bg-green-50", text: isDark ? "text-green-400" : "text-green-600" },
    red: { bg: isDark ? "bg-red-500/15" : "bg-red-50", text: isDark ? "text-red-400" : "text-red-600" },
    orange: { bg: isDark ? "bg-orange-500/15" : "bg-orange-50", text: isDark ? "text-orange-400" : "text-orange-600" },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`rounded-2xl p-4 border flex items-center gap-3 transition-colors
      ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm"}`}>

      {/* Icône */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
        <Icon size={20} className={c.text} />
      </div>

      {/* Contenu */}
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-medium truncate ${isDark ? "text-zinc-500" : "text-gray-500"}`}>
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <p className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
            {value}
          </p>
          {badge && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
              {badge}
            </span>
          )}
        </div>
        <p className={`text-[11px] truncate ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
          {subtitle}
        </p>
      </div>
    </div>
  )
}