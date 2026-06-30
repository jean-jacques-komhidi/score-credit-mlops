import { Link } from "react-router-dom"
import { Sun, Moon, User } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"

export default function Header({ title, subtitle }) {
  const { isDark, toggleTheme } = useTheme()
  const { user } = useUser()

  return (
    <header className={`fixed top-0 left-64 right-0 z-10 px-8 py-4 flex items-center justify-between
      border-b transition-colors duration-300
      ${isDark
        ? "bg-zinc-950 border-zinc-800 text-white"
        : "bg-white border-gray-100 text-gray-800"}`}>

      {/* Titre */}
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className={`text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>{subtitle}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">

        {/* Toggle mode */}
        <button
          onClick={toggleTheme}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
            ${isDark
              ? "bg-zinc-900 text-yellow-400 hover:bg-zinc-800"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Profil */}
        <Link
          to="/profil"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all
            ${isDark
              ? "bg-zinc-900 hover:bg-zinc-800"
              : "bg-gray-100 hover:bg-gray-200"}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold">{user.prenom} {user.nom}</p>
            <p className={`text-xs ${isDark ? "text-zinc-500" : "text-gray-400"}`}>{user.role}</p>
          </div>
        </Link>
      </div>
    </header>
  )
}