import { NavLink } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import { LayoutDashboard, Search, TrendingUp, Settings, Activity } from "lucide-react"

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { path: "/analyse", icon: Search, label: "Analyse" },
  { path: "/monitoring", icon: Activity, label: "Monitoring" },
]

export default function Sidebar() {
  const { isDark } = useTheme()

  return (
    <aside className={`fixed top-0 left-0 h-full w-64 z-10 flex flex-col shadow-xl transition-colors duration-300
      ${isDark ? "bg-slate-900 text-white" : "bg-white text-gray-800"}`}>

      {/* Logo */}
      <div className={`px-6 py-6 border-b ${isDark ? "border-slate-700" : "border-gray-100"}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={22} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-base">Score Crédit</p>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>MLOps Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-wider px-4 mb-3
          ${isDark ? "text-slate-500" : "text-gray-400"}`}>
          Menu principal
        </p>
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
              ${isActive
                ? "bg-blue-600 text-white shadow-md"
                : isDark
                  ? "text-slate-300 hover:bg-slate-800"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={`px-4 py-4 border-t space-y-2 ${isDark ? "border-slate-700" : "border-gray-100"}`}>
        <button className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full font-medium transition-all
          ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-gray-600 hover:bg-gray-100"}`}>
          <Settings size={20} />
          <span>Paramètres</span>
        </button>
        <div className={`px-4 pt-2 border-t ${isDark ? "border-slate-700" : "border-gray-100"}`}>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>Master 2 UCAO</p>
          <p className="text-xs font-semibold">KOMHIDI Jean Jacques</p>
        </div>
      </div>
    </aside>
  )
}