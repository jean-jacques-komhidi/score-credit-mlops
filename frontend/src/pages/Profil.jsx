import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"
import Header from "../components/Header"
import { getModelInfo } from "../services/api"
import { User, Mail, Briefcase, Building, Save, Edit2, CheckCircle, TrendingUp, Target } from "lucide-react"

export default function Profil() {
  const { isDark } = useTheme()
  const { user, updateUser } = useUser()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...user })
  const [saved, setSaved] = useState(false)
  const [modelInfo, setModelInfo] = useState({ model_name: "XGBoost", version: "1.0.0", auc_roc: 0.7294 })

  useEffect(() => {
    getModelInfo()
      .then(info => setModelInfo(info))
      .catch(() => {})
  }, [])

  const handleSave = () => {
    updateUser(form)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inputClass = "w-full border rounded-xl px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400 " +
    (isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" : "bg-gray-50 border-gray-200 text-gray-800")

  const labelClass = "text-xs font-medium uppercase tracking-wide mb-1.5 flex items-center gap-1.5 " +
    (isDark ? "text-zinc-500" : "text-gray-400")

  const cardClass = "rounded-xl border transition-colors " +
    (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")

  const pageClass = "min-h-screen transition-colors duration-300 " + (isDark ? "bg-zinc-950" : "bg-gray-50")

  return (
    <div className={pageClass}>
      <Header title="Mon Profil" subtitle="Gérez vos informations personnelles" />

      <main className="lg:ml-64 pt-14 lg:pt-24 px-4 lg:px-8 pb-8">
        <div className="max-w-4xl mt-4 lg:mt-0">

          {/* Message succès */}
          {saved && (
            <div className={"mb-5 flex items-center gap-2 border rounded-xl px-4 py-3 text-xs " +
              (isDark ? "bg-emerald-500/10 border-emerald-900 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700")}>
              <CheckCircle size={14} />
              Profil mis à jour avec succès !
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

            {/* ── Colonne gauche ── */}
            <div className="space-y-4">

              {/* Avatar */}
              <div className={cardClass + " p-5 flex flex-col items-center text-center"}>
                <div className={"w-16 h-16 rounded-full flex items-center justify-center mb-3 " +
                  (isDark ? "bg-zinc-800" : "bg-gray-100")}>
                  <User size={28} className={isDark ? "text-zinc-400" : "text-gray-500"} />
                </div>
                <p className={"font-semibold text-base " + (isDark ? "text-white" : "text-gray-800")}>
                  {user.prenom} {user.nom}
                </p>
                <span className={"text-xs px-2.5 py-0.5 rounded-full border font-medium mt-2 " +
                  (isDark ? "border-zinc-700 text-zinc-400" : "border-gray-200 text-gray-500")}>
                  {user.role}
                </span>
                {user.organisation && (
                  <p className={"text-xs mt-1.5 " + (isDark ? "text-zinc-500" : "text-gray-400")}>
                    {user.organisation}
                  </p>
                )}
              </div>

              {/* Stats modèle — dynamiques */}
              <div className={cardClass + " p-5"}>
                <p className={"text-xs font-medium uppercase tracking-wider mb-4 " +
                  (isDark ? "text-zinc-600" : "text-gray-400")}>
                  Modèle actif
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={"w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 " +
                      (isDark ? "bg-zinc-800" : "bg-gray-100")}>
                      <TrendingUp size={14} className={isDark ? "text-zinc-400" : "text-gray-500"} />
                    </div>
                    <div>
                      <p className={"text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")}>Algorithme</p>
                      <p className={"text-sm font-semibold " + (isDark ? "text-white" : "text-gray-800")}>
                        {modelInfo.model_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={"w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 " +
                      (isDark ? "bg-zinc-800" : "bg-gray-100")}>
                      <Target size={14} className={isDark ? "text-zinc-400" : "text-gray-500"} />
                    </div>
                    <div>
                      <p className={"text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")}>AUC-ROC</p>
                      <p className={"text-sm font-semibold " + (isDark ? "text-white" : "text-gray-800")}>
                        {modelInfo.auc_roc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={"w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 " +
                      (isDark ? "bg-zinc-800" : "bg-gray-100")}>
                      <Target size={14} className={isDark ? "text-zinc-400" : "text-gray-500"} />
                    </div>
                    <div>
                      <p className={"text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")}>Version</p>
                      <p className={"text-sm font-semibold " + (isDark ? "text-white" : "text-gray-800")}>
                        v{modelInfo.version}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={"w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 " +
                      (isDark ? "bg-zinc-800" : "bg-gray-100")}>
                      <CheckCircle size={14} className={isDark ? "text-zinc-400" : "text-gray-500"} />
                    </div>
                    <div>
                      <p className={"text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")}>Statut</p>
                      <p className={"text-sm font-semibold " + (isDark ? "text-emerald-400" : "text-emerald-600")}>
                        Opérationnel
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Colonne droite ── */}
            <div className="lg:col-span-2">
              <div className={cardClass + " p-5"}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className={"font-semibold text-sm " + (isDark ? "text-white" : "text-gray-800")}>
                    Informations personnelles
                  </h2>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className={"flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all " +
                        (isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
                      <Edit2 size={12} /> Modifier
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: User,     label: "Prénom",       key: "prenom" },
                    { icon: User,     label: "Nom",          key: "nom" },
                    { icon: Briefcase,label: "Rôle",         key: "role" },
                    { icon: Mail,     label: "Email",        key: "email" },
                  ].map(({ icon: Icon, label, key }) => (
                    <div key={key}>
                      <label className={labelClass}>
                        <Icon size={10} /> {label}
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={form[key]}
                          onChange={e => setForm({ ...form, [key]: e.target.value })}
                          className={inputClass}
                        />
                      ) : (
                        <p className={"text-sm font-medium px-3.5 py-2.5 rounded-xl " +
                          (isDark ? "bg-zinc-800 text-white" : "bg-gray-50 text-gray-800")}>
                          {user[key]}
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="sm:col-span-2">
                    <label className={labelClass}>
                      <Building size={10} /> Organisation
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.organisation}
                        onChange={e => setForm({ ...form, organisation: e.target.value })}
                        className={inputClass}
                      />
                    ) : (
                      <p className={"text-sm font-medium px-3.5 py-2.5 rounded-xl " +
                        (isDark ? "bg-zinc-800 text-white" : "bg-gray-50 text-gray-800")}>
                        {user.organisation}
                      </p>
                    )}
                  </div>
                </div>

                {editing && (
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => { setEditing(false); setForm({ ...user }) }}
                      className={"flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all " +
                        (isDark ? "border-zinc-700 text-zinc-400 hover:bg-zinc-800" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                      <Save size={14} /> Sauvegarder
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}