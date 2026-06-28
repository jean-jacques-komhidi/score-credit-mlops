import { Sun, Moon, Bell, User } from "lucide-react"
import { useTheme } from "../context/ThemeContext"

export default function Header({ title, subtitle }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className={`fixed top-0 left-64 right-0 z-10 px-8 py-4 flex items-center justify-between
      border-b transition-colors duration-300
      ${isDark
        ? "bg-slate-900 border-slate-700 text-white"
        : "bg-white border-gray-100 text-gray-800"}`}>

      {/* Titre */}
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-400"}`}>{subtitle}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">

        {/* Toggle mode */}
        <button
          onClick={toggleTheme}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
            ${isDark
              ? "bg-slate-800 text-yellow-400 hover:bg-slate-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-all
          ${isDark
            ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profil */}
        <div className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all
          ${isDark
            ? "bg-slate-800 hover:bg-slate-700"
            : "bg-gray-100 hover:bg-gray-200"}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold">Jean Jacques</p>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>Analyste crédit</p>
          </div>
        </div>

      </div>
    </header>
  )
}