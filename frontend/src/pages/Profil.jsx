import { useState } from "react"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"
import Header from "../components/Header"
import { User, Mail, Briefcase, Building, Save, Edit2, CheckCircle, TrendingUp, Target } from "lucide-react"

export default function Profil() {
  const { isDark } = useTheme()
  const { user, updateUser } = useUser()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...user })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateUser(form)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inputClass = `w-full border rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
    ${isDark
      ? "bg-zinc-900 border-zinc-800 text-white"
      : "bg-gray-50 border-gray-200 text-gray-800"}`

  const labelClass = `text-[11px] font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1.5
    ${isDark ? "text-zinc-500" : "text-gray-400"}`

  const cardClass = `rounded-2xl border p-6 transition-colors
    ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm"}`

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-black" : "bg-gray-50"}`}>
      <Header title="Mon Profil" subtitle="Gérez vos informations personnelles" />

      <main className="ml-64 pt-24 px-8 pb-8 max-w-4xl">

        {/* Message succès */}
        {saved && (
          <div className="mb-6 flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-xl px-4 py-3 text-sm">
            <CheckCircle size={16} />
            Profil mis à jour avec succès !
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">

          {/* Colonne gauche — Avatar et stats */}
          <div className="col-span-1 space-y-4">
            <div className={`${cardClass} flex flex-col items-center text-center`}>
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-3">
                <User size={36} className="text-white" />
              </div>
              <p className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-800"}`}>
                {user.prenom} {user.nom}
              </p>
              <span className={`text-xs px-3 py-1 rounded-full mt-2 font-medium
                ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                {user.role}
              </span>
            </div>

            {/* Stats modèle */}
            <div className={cardClass}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                Modèle actif
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? "bg-blue-900/30" : "bg-blue-50"}`}>
                    <TrendingUp size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? "text-zinc-500" : "text-gray-400"}`}>Algorithme</p>
                    <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-800"}`}>XGBoost</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? "bg-green-900/30" : "bg-green-50"}`}>
                    <Target size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? "text-zinc-500" : "text-gray-400"}`}>AUC-ROC</p>
                    <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-800"}`}>0.7294</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite — Formulaire infos */}
          <div className="col-span-2">
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-5">
                <h2 className={`font-bold text-base ${isDark ? "text-white" : "text-gray-800"}`}>
                  Informations personnelles
                </h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all">
                    <Edit2 size={14} /> Modifier
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: User, label: "Prénom", key: "prenom" },
                  { icon: User, label: "Nom", key: "nom" },
                  { icon: Briefcase, label: "Rôle", key: "role" },
                  { icon: Mail, label: "Email", key: "email" },
                ].map(({ icon: Icon, label, key }) => (
                  <div key={key}>
                    <label className={labelClass}><Icon size={11} /> {label}</label>
                    {editing ? (
                      <input type="text" value={form[key]}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                        className={inputClass} />
                    ) : (
                      <p className={`text-sm font-medium px-4 py-2.5 rounded-xl
                        ${isDark ? "bg-zinc-800 text-white" : "bg-gray-50 text-gray-800"}`}>
                        {user[key]}
                      </p>
                    )}
                  </div>
                ))}

                <div className="col-span-2">
                  <label className={labelClass}><Building size={11} /> Organisation</label>
                  {editing ? (
                    <input type="text" value={form.organisation}
                      onChange={e => setForm({ ...form, organisation: e.target.value })}
                      className={inputClass} />
                  ) : (
                    <p className={`text-sm font-medium px-4 py-2.5 rounded-xl
                      ${isDark ? "bg-zinc-800 text-white" : "bg-gray-50 text-gray-800"}`}>
                      {user.organisation}
                    </p>
                  )}
                </div>
              </div>

              {editing && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setEditing(false); setForm({ ...user }) }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                      ${isDark
                        ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                    <Save size={16} /> Sauvegarder
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}