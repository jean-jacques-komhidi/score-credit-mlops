import { useState } from "react"
import { NavLink } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import { useNotifications } from "../context/NotificationsContext"
import {
  LayoutDashboard, Search, Bell, Activity,
  User, Moon, Sun, Settings, Users, Menu, X
} from "lucide-react"

export default function Sidebar() {
  const { isDark, toggleTheme } = useTheme()
  const { unreadCount } = useNotifications()
  const [mobileOpen, setMobileOpen] = useState(false)

  const baseLink = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all "
  const activeClass = baseLink + (isDark
    ? "bg-zinc-800 text-white"
    : "bg-gray-100 text-gray-900")
  const inactiveClass = baseLink + (isDark
    ? "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200"
    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800")

  const sectionLabel = "text-xs font-medium uppercase tracking-widest px-3 mb-1.5 " +
    (isDark ? "text-zinc-700" : "text-gray-300")

  const sidebarClass = "flex flex-col border-r " +
    (isDark ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-100")

  const Logo = () => (
    <div className={"flex items-center gap-3 px-4 py-4 border-b " +
      (isDark ? "border-zinc-800" : "border-gray-100")}>
      <div className={"w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 " +
        (isDark ? "bg-zinc-800" : "bg-gray-100")}>
        <span className={"font-bold text-xs " + (isDark ? "text-zinc-300" : "text-gray-600")}>SC</span>
      </div>
      <div>
        <p className={"font-semibold text-sm " + (isDark ? "text-white" : "text-gray-800")}>Score Crédit</p>
        <p className={"text-xs " + (isDark ? "text-zinc-600" : "text-gray-400")}>MLOps Dashboard</p>
      </div>
    </div>
  )

  const NavLinks = ({ onClose }) => (
    <>
      <p className={sectionLabel}>MENU PRINCIPAL</p>

      <NavLink to="/" end onClick={onClose}
        className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <LayoutDashboard size={16} />
        Tableau de bord
      </NavLink>

      <NavLink to="/clients" onClick={onClose}
        className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Users size={16} />
        Clients
      </NavLink>

      <NavLink to="/analyse" onClick={onClose}
        className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Search size={16} />
        Analyse
      </NavLink>

      <NavLink to="/notifications" onClick={onClose}
        className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Bell size={16} />
        <span className="flex-1">Notifications</span>
        {unreadCount > 0 && (
          <span className={"text-xs px-1.5 py-0.5 rounded-full font-medium " +
            (isDark ? "bg-zinc-700 text-zinc-300" : "bg-gray-200 text-gray-600")}>
            {unreadCount}
          </span>
        )}
      </NavLink>

      <div className="pt-3 pb-1">
        <p className={sectionLabel}>MLOPS</p>
      </div>

      <NavLink to="/monitoring" onClick={onClose}
        className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Activity size={16} />
        Monitoring
      </NavLink>

      <div className="pt-3 pb-1">
        <p className={sectionLabel}>COMPTE</p>
      </div>

      <NavLink to="/profil" onClick={onClose}
        className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <User size={16} />
        Mon profil
      </NavLink>

      <button
        onClick={() => { toggleTheme(); onClose && onClose() }}
        className={inactiveClass + " w-full text-left"}>
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
        Mode {isDark ? "clair" : "sombre"}
      </button>
    </>
  )

  const Footer = ({ onClose }) => (
    <div className={"border-t px-3 py-3 space-y-1 " + (isDark ? "border-zinc-800" : "border-gray-100")}>
      <NavLink to="/parametres" onClick={onClose}
        className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Settings size={16} />
        Paramètres
      </NavLink>
      <div className={"flex items-center gap-2.5 px-3 py-2 rounded-lg " +
        (isDark ? "bg-zinc-900" : "bg-gray-50")}>
        <div className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 " +
          (isDark ? "bg-zinc-800 text-zinc-300" : "bg-gray-200 text-gray-600")}>
          KJ
        </div>
        <div className="min-w-0">
          <p className={"text-xs font-medium truncate " + (isDark ? "text-zinc-200" : "text-gray-700")}>
            Komhidi Jean Jacques
          </p>
          <p className={"text-xs truncate " + (isDark ? "text-zinc-600" : "text-gray-400")}>
            Master 2 UCAO
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* ── DESKTOP ── */}
      <aside className={"hidden lg:flex fixed left-0 top-0 h-full w-64 z-50 flex-col " + sidebarClass}>
        <Logo />
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLinks onClose={null} />
        </nav>
        <Footer onClose={null} />
      </aside>

      {/* ── MOBILE header ── */}
      <div className={"lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b " +
        (isDark ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-100")}>
        <div className="flex items-center gap-2">
          <div className={"w-6 h-6 rounded-md flex items-center justify-center " +
            (isDark ? "bg-zinc-800" : "bg-gray-100")}>
            <span className={"font-bold text-xs " + (isDark ? "text-zinc-300" : "text-gray-600")}>SC</span>
          </div>
          <p className={"font-semibold text-sm " + (isDark ? "text-white" : "text-gray-800")}>Score Crédit</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className={"p-2 rounded-lg border transition-colors " +
            (isDark ? "border-zinc-800 text-zinc-400 hover:bg-zinc-800" : "border-gray-200 text-gray-500 hover:bg-gray-50")}>
          <Menu size={18} />
        </button>
      </div>

      {/* ── MOBILE drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className={"absolute left-0 top-0 h-full w-72 flex flex-col " + sidebarClass}>
            <div className={"flex items-center justify-between px-4 py-4 border-b " +
              (isDark ? "border-zinc-800" : "border-gray-100")}>
              <div className="flex items-center gap-2.5">
                <div className={"w-7 h-7 rounded-lg flex items-center justify-center " +
                  (isDark ? "bg-zinc-800" : "bg-gray-100")}>
                  <span className={"font-bold text-xs " + (isDark ? "text-zinc-300" : "text-gray-600")}>SC</span>
                </div>
                <p className={"font-semibold text-sm " + (isDark ? "text-white" : "text-gray-800")}>Score Crédit</p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className={"p-1.5 rounded-lg transition-colors " +
                  (isDark ? "hover:bg-zinc-800 text-zinc-500" : "hover:bg-gray-100 text-gray-400")}>
                <X size={17} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              <NavLinks onClose={() => setMobileOpen(false)} />
            </nav>
            <Footer onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}