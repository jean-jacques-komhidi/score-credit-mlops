import { Link } from "react-router-dom"
import { Sun, Moon, User } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"

export default function Header({ title, subtitle }) {
  const { isDark, toggleTheme } = useTheme()
  const { user } = useUser()

  return (
    <header className={"fixed top-0 left-0 lg:left-64 right-0 z-10 px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between border-b transition-colors duration-300 " +
      (isDark ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-100")}>

      {/* Titre desktop */}
      <div className="hidden lg:block">
        <h1 className={"text-base font-semibold " + (isDark ? "text-white" : "text-gray-800")}>
          {title}
        </h1>
        {subtitle && (
          <p className={"text-xs mt-0.5 " + (isDark ? "text-zinc-500" : "text-gray-400")}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Titre centré mobile */}
      <div className="lg:hidden flex-1 text-center">
        <h1 className={"text-sm font-semibold " + (isDark ? "text-white" : "text-gray-800")}>
          {title}
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">

        {/* Toggle thème */}
        <button
          onClick={toggleTheme}
          className={"w-8 h-8 rounded-lg flex items-center justify-center transition-all border " +
            (isDark
              ? "border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              : "border-gray-200 text-gray-500 hover:bg-gray-50")}>
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Profil */}
        <Link
          to="/profil"
          className={"flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all " +
            (isDark
              ? "border-zinc-800 hover:bg-zinc-800"
              : "border-gray-200 hover:bg-gray-50")}>
          <div className={"w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 " +
            (isDark ? "bg-zinc-700" : "bg-gray-200")}>
            <User size={13} className={isDark ? "text-zinc-300" : "text-gray-500"} />
          </div>
          <div className="text-left hidden lg:block">
            <p className={"text-xs font-medium " + (isDark ? "text-zinc-200" : "text-gray-700")}>
              {user.prenom} {user.nom}
            </p>
            <p className={"text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")}>
              {user.role}
            </p>
          </div>
        </Link>
      </div>
    </header>
  )
}