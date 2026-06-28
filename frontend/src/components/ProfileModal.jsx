import { useState } from "react"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"
import { X, User, Mail, Briefcase, Building, Save, Edit, CheckCircle } from "lucide-react"

export default function ProfileModal({ onClose }) {
  const { isDark } = useTheme()
  const { user, updateUser } = useUser()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...user })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateUser(form)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputClass = `w-full border rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
    ${isDark
      ? "bg-slate-700 border-slate-600 text-white"
      : "bg-gray-50 border-gray-200 text-gray-800"}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>

      <div
        className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]
          ${isDark ? "bg-slate-800 text-white" : "bg-white text-gray-800"}`}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 pt-6 pb-14 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
            <X size={16} className="text-white" />
          </button>
          <h2 className="text-white font-bold text-lg">Mon Profil</h2>
          <p className="text-blue-200 text-sm mt-0.5">Gérez vos informations personnelles</p>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto flex-1">

          {/* Avatar */}
          <div className="flex flex-col items-center -mt-10 mb-4 px-6">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
            </div>
            <p className="font-bold text-lg mt-3">{user.prenom} {user.nom}</p>
            <span className={`text-xs px-3 py-1 rounded-full mt-1 font-medium
              ${isDark ? "bg-blue-900/50 text-blue-300" : "bg-blue-50 text-blue-600"}`}>
              {user.role}
            </span>
          </div>

          {/* Message succès */}
          {saved && (
            <div className="mx-6 mb-4 flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-xl px-4 py-2 text-sm">
              <CheckCircle size={16} />
              Profil mis à jour avec succès !
            </div>
          )}

          {/* Stats rapides */}
          <div className={`mx-6 mb-5 grid grid-cols-2 gap-3 p-4 rounded-2xl
            ${isDark ? "bg-slate-700/50" : "bg-gray-50"}`}>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">XGBoost</p>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>Modèle actif</p>
            </div>
            <div className={`text-center border-l ${isDark ? "border-slate-600" : "border-gray-200"}`}>
              <p className="text-lg font-bold text-green-600">0.7294</p>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>AUC-ROC</p>
            </div>
          </div>

          {/* Infos */}
          <div className="px-6 space-y-3 mb-4">
            {[
              { icon: User, label: "Prénom", key: "prenom" },
              { icon: User, label: "Nom", key: "nom" },
              { icon: Briefcase, label: "Rôle", key: "role" },
              { icon: Mail, label: "Email", key: "email" },
              { icon: Building, label: "Organisation", key: "organisation" },
            ].map(({ icon: Icon, label, key }) => (
              <div key={key}>
                <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5
                  ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                  <Icon size={11} /> {label}
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className={inputClass}
                  />
                ) : (
                  <p className={`text-sm font-medium px-4 py-2.5 rounded-xl
                    ${isDark ? "bg-slate-700/50 text-white" : "bg-gray-50 text-gray-800"}`}>
                    {user[key]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Boutons — toujours visibles en bas */}
        <div className={`px-6 py-4 flex gap-3 border-t flex-shrink-0
          ${isDark ? "border-slate-700 bg-slate-800" : "border-gray-100 bg-white"}`}>
          {editing ? (
            <>
              <button
                onClick={() => { setEditing(false); setForm({ ...user }) }}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all
                  ${isDark
                    ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                <Save size={16} /> Sauvegarder
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all
                  ${isDark
                    ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                Fermer
              </button>
              <button
                onClick={() => setEditing(true)}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                <Edit size={16} /> Modifier
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}