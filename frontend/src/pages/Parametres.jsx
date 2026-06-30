import { useState } from "react"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"
import Header from "../components/Header"
import {
  User, Database, CloudUpload, Sun, Moon, AlertTriangle, Server, CheckCircle2
} from "lucide-react"

export default function Parametres() {
  const { isDark, toggleTheme } = useTheme()
  const { user, updateUser } = useUser()

  const [userForm, setUserForm] = useState({ ...user })
  const [driftSeuils, setDriftSeuils] = useState({ alerte: 20, critique: 40 })
  const [apiConfig, setApiConfig] = useState({
    url: "http://127.0.0.1:8000",
    mlflow: "http://127.0.0.1:5000"
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateUser(userForm)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const sectionClass = `rounded-2xl border p-6 mb-5 transition-colors
    ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm"}`

  const inputClass = `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
    ${isDark
      ? "bg-zinc-800 border-zinc-700 text-white"
      : "bg-gray-50 border-gray-200 text-gray-800"}`

  const labelClass = `block text-[11px] font-semibold uppercase tracking-wide mb-1.5
    ${isDark ? "text-zinc-500" : "text-gray-400"}`

  const sectionHeader = (icon, bg, title, desc) => (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        {icon}
      </div>
      <div>
        <h2 className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-800"}`}>{title}</h2>
        {desc && <p className={`text-xs ${isDark ? "text-zinc-500" : "text-gray-400"}`}>{desc}</p>}
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-black" : "bg-gray-50"}`}>

      <Header title="Paramètres" subtitle="Configuration du système et du profil" />

      <main className="ml-64 pt-24 px-8 pb-8 max-w-4xl">

        {/* Message succès */}
        {saved && (
          <div className={`mb-5 rounded-xl p-4 text-sm flex items-center gap-2 border
            ${isDark
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-green-50 border-green-200 text-green-700"}`}>
            <CheckCircle2 size={16} />
            Paramètres sauvegardés avec succès !
          </div>
        )}

        {/* Section 1 — Profil */}
        <div className={sectionClass}>
          {sectionHeader(
            <User size={17} className={isDark ? "text-blue-400" : "text-blue-600"} />,
            isDark ? "bg-blue-500/15" : "bg-blue-50",
            "Profil utilisateur",
            "Vos informations personnelles"
          )}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Prénom", key: "prenom" },
              { label: "Nom", key: "nom" },
              { label: "Rôle", key: "role" },
              { label: "Email", key: "email" },
              { label: "Organisation", key: "organisation" },
            ].map(({ label, key }) => (
              <div key={key} className={key === "organisation" ? "col-span-2" : ""}>
                <label className={labelClass}>{label}</label>
                <input
                  type="text"
                  value={userForm[key]}
                  onChange={e => setUserForm({ ...userForm, [key]: e.target.value })}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 2 — Apparence */}
        <div className={sectionClass}>
          {sectionHeader(
            isDark ? <Sun size={17} className="text-yellow-400" /> : <Moon size={17} className="text-yellow-600" />,
            isDark ? "bg-yellow-500/15" : "bg-yellow-50",
            "Apparence",
            "Personnalisez l'affichage de l'interface"
          )}
          <div className={`flex items-center justify-between rounded-xl px-4 py-3.5
            ${isDark ? "bg-zinc-800/60" : "bg-gray-50"}`}>
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-800"}`}>
                Mode {isDark ? "sombre" : "clair"} actif
              </p>
              <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                Basculer instantanément entre les deux thèmes
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all
                ${isDark
                  ? "bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"}`}>
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
              {isDark ? "Clair" : "Sombre"}
            </button>
          </div>
        </div>

        {/* Section 3 — Seuils Data Drift */}
        <div className={sectionClass}>
          {sectionHeader(
            <AlertTriangle size={17} className={isDark ? "text-orange-400" : "text-orange-600"} />,
            isDark ? "bg-orange-500/15" : "bg-orange-50",
            "Seuils d'alerte Data Drift",
            "Définissez les niveaux de surveillance"
          )}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={labelClass}>Seuil d'alerte</label>
                <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md">
                  {driftSeuils.alerte}%
                </span>
              </div>
              <input type="range" min="10" max="50"
                value={driftSeuils.alerte}
                onChange={e => setDriftSeuils({ ...driftSeuils, alerte: parseInt(e.target.value) })}
                className="w-full accent-yellow-500" />
              <p className={`text-xs mt-1.5 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                Surveillance renforcée au-delà
              </p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={labelClass}>Seuil critique</label>
                <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">
                  {driftSeuils.critique}%
                </span>
              </div>
              <input type="range" min="20" max="80"
                value={driftSeuils.critique}
                onChange={e => setDriftSeuils({ ...driftSeuils, critique: parseInt(e.target.value) })}
                className="w-full accent-red-500" />
              <p className={`text-xs mt-1.5 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                Réentraînement immédiat au-delà
              </p>
            </div>
          </div>

          <div className={`mt-5 p-4 rounded-xl space-y-2 ${isDark ? "bg-zinc-800/60" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className={isDark ? "text-zinc-300" : "text-gray-600"}>
                &lt; {driftSeuils.alerte}% — Normal, monitoring hebdomadaire
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className={isDark ? "text-zinc-300" : "text-gray-600"}>
                {driftSeuils.alerte}%–{driftSeuils.critique}% — Alerte, monitoring quotidien
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className={isDark ? "text-zinc-300" : "text-gray-600"}>
                &gt; {driftSeuils.critique}% — Critique, réentraînement immédiat
              </span>
            </div>
          </div>
        </div>

        {/* Section 4 — Configuration API */}
        <div className={sectionClass}>
          {sectionHeader(
            <Server size={17} className={isDark ? "text-green-400" : "text-green-600"} />,
            isDark ? "bg-green-500/15" : "bg-green-50",
            "Configuration API",
            "Endpoints des services backend"
          )}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>URL API FastAPI</label>
              <input type="text" value={apiConfig.url}
                onChange={e => setApiConfig({ ...apiConfig, url: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>URL MLFlow</label>
              <input type="text" value={apiConfig.mlflow}
                onChange={e => setApiConfig({ ...apiConfig, mlflow: e.target.value })}
                className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {["FastAPI connectée", "MLFlow connecté"].map(label => (
              <div key={label} className={`flex items-center gap-2 px-4 py-3 rounded-xl
                ${isDark ? "bg-zinc-800/60" : "bg-gray-50"}`}>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                <span className="text-sm font-medium text-green-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5 — Infos système */}
        <div className={sectionClass}>
          {sectionHeader(
            <Database size={17} className={isDark ? "text-purple-400" : "text-purple-600"} />,
            isDark ? "bg-purple-500/15" : "bg-purple-50",
            "Informations système",
            "État actuel du modèle en production"
          )}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Modèle actif", value: "XGBoost" },
              { label: "AUC-ROC", value: "0.7294" },
              { label: "Score métier", value: "35 289" },
              { label: "Dataset", value: "307k lignes" },
              { label: "Features", value: "178" },
              { label: "Version API", value: "1.0.0" },
            ].map(({ label, value }) => (
              <div key={label} className={`px-4 py-3 rounded-xl ${isDark ? "bg-zinc-800/60" : "bg-gray-50"}`}>
                <p className={`text-[11px] ${isDark ? "text-zinc-500" : "text-gray-400"}`}>{label}</p>
                <p className={`font-bold text-sm mt-0.5 ${isDark ? "text-white" : "text-gray-800"}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton sauvegarder */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 text-sm">
          <CloudUpload size={16} />
          Sauvegarder tous les paramètres
        </button>

      </main>
    </div>
  )
}