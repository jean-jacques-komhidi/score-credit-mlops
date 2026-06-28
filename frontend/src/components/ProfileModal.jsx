import { useState } from "react"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"
import { X, User, Mail, Briefcase, Building, Save, Edit } from "lucide-react"

export default function ProfileModal({ onClose }) {
  const { isDark } = useTheme()
  const { user, updateUser } = useUser()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...user })

  const handleSave = () => {
    updateUser(form)
    setEditing(false)
  }

  const inputClass = `w-full border rounded-xl px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
    ${isDark
      ? "bg-slate-700 border-slate-600 text-white"
      : "bg-gray-50 border-gray-200 text-gray-800"}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 transition-colors
        ${isDark ? "bg-slate-800 text-white" : "bg-white text-gray-800"}`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg">Mon Profil</h2>
          <button onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
              ${isDark ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}>
            <X size={18} />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-3">
            <User size={40} className="text-white" />
          </div>
          <p className="font-bold text-lg">{user.prenom} {user.nom}</p>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-400"}`}>{user.role}</p>
        </div>

        {/* Stats rapides */}
        <div className={`grid grid-cols-2 gap-3 mb-6 p-4 rounded-xl
          ${isDark ? "bg-slate-700/50" : "bg-gray-50"}`}>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">XGBoost</p>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>Modèle actif</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">0.7294</p>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>AUC-ROC</p>
          </div>
        </div>

        {/* Infos */}
        <div className="space-y-3 mb-6">
          {[
            { icon: User, label: "Prénom", key: "prenom" },
            { icon: User, label: "Nom", key: "nom" },
            { icon: Briefcase, label: "Rôle", key: "role" },
            { icon: Mail, label: "Email", key: "email" },
            { icon: Building, label: "Organisation", key: "organisation" },
          ].map(({ icon: Icon, label, key }) => (
            <div key={key}>
              <label className={`text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1
                ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                <Icon size={12} /> {label}
              </label>
              {editing ? (
                <input
                  type="text"
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className={inputClass}
                />
              ) : (
                <p className={`text-sm font-medium px-4 py-2 rounded-xl
                  ${isDark ? "bg-slate-700/50 text-white" : "bg-gray-50 text-gray-800"}`}>
                  {user[key]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all
                  ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                Annuler
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                <Save size={16} /> Sauvegarder
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="w-full py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              <Edit size={16} /> Modifier le profil
            </button>
          )}
        </div>
      </div>
    </div>
  )
}