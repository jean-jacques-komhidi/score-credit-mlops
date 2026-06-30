// Sidebar.jsx
import { NavLink } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"
import { useNotifications } from "../context/NotificationsContext"
import { LayoutDashboard, Search, TrendingUp, Settings, Activity, Bell, User, Sun, Moon } from "lucide-react"

const mainItems = [
  { path: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { path: "/analyse", icon: Search, label: "Analyse" },
]

const mloPsItems = [
  { path: "/monitoring", icon: Activity, label: "Monitoring" },
]

export default function Sidebar() {
  const { isDark, toggleTheme } = useTheme()
  const { user } = useUser()
  const { unreadCount } = useNotifications()

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
    ${isActive
      ? "bg-blue-600 text-white shadow-md"
      : isDark
        ? "text-zinc-300 hover:bg-zinc-900"
        : "text-gray-600 hover:bg-gray-100"
    }`

  const groupLabelClass = `text-[11px] font-semibold uppercase tracking-wider px-4 mb-2
    ${isDark ? "text-zinc-600" : "text-gray-400"}`

  return (
    <aside className={`fixed top-0 left-0 h-full w-64 z-10 flex flex-col shadow-xl transition-colors duration-300
      ${isDark ? "bg-zinc-950 text-white" : "bg-white text-gray-800"}`}>

      {/* Logo */}
      <div className={`px-6 py-6 border-b ${isDark ? "border-zinc-800" : "border-gray-100"}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={22} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-base">Score Crédit</p>
            <p className={`text-xs ${isDark ? "text-zinc-500" : "text-gray-400"}`}>MLOps Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">

        {/* Menu principal */}
        <div>
          <p className={groupLabelClass}>Menu principal</p>
          <div className="space-y-1">
            {mainItems.map(({ path, icon: Icon, label }) => (
              <NavLink key={path} to={path} end className={navLinkClass}>
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}

            <NavLink to="/notifications" className={navLinkClass}>
              {() => (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Bell size={18} />
                    <span>Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          </div>
        </div>

        {/* MLOps */}
        <div>
          <p className={groupLabelClass}>MLOps</p>
          <div className="space-y-1">
            {mloPsItems.map(({ path, icon: Icon, label }) => (
              <NavLink key={path} to={path} end className={navLinkClass}>
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Compte */}
        <div>
          <p className={groupLabelClass}>Compte</p>
          <div className="space-y-1">
            <NavLink to="/profil" className={navLinkClass}>
              <User size={18} />
              <span>Mon profil</span>
            </NavLink>

            <button
              onClick={toggleTheme}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                ${isDark ? "text-zinc-300 hover:bg-zinc-900" : "text-gray-600 hover:bg-gray-100"}`}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              <span>{isDark ? "Mode clair" : "Mode sombre"}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className={`px-4 py-4 border-t space-y-2 ${isDark ? "border-zinc-800" : "border-gray-100"}`}>
        <NavLink to="/parametres" className={navLinkClass}>
          <Settings size={18} />
          <span>Paramètres</span>
        </NavLink>
        <div className={`px-4 pt-2 border-t ${isDark ? "border-zinc-800" : "border-gray-100"}`}>
          <p className={`text-xs ${isDark ? "text-zinc-500" : "text-gray-400"}`}>{user.organisation}</p>
          <p className="text-xs font-semibold">{user.prenom} {user.nom}</p>
        </div>
      </div>
    </aside>
  )
}