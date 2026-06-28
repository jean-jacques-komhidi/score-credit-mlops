import { useState } from "react"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"
import Header from "../components/Header"
import {
  Settings, User, Bell, Database, Shield,
  Save, Sun, Moon, AlertTriangle, Activity
} from "lucide-react"

export default function Parametres() {
  const { isDark, toggleTheme } = useTheme()
  const { user, updateUser } = useUser()

  const [userForm, setUserForm] = useState({ ...user })
  const [driftSeuils, setDriftSeuils] = useState({
    alerte: 20,
    critique: 40
  })
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

  const sectionClass = `rounded-2xl border p-6 mb-6 transition-colors
    ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100 shadow-sm"}`

  const inputClass = `w-full border rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
    ${isDark
      ? "bg-slate-700 border-slate-600 text-white"
      : "bg-gray-50 border-gray-200 text-gray-800"}`

  const labelClass = `block text-xs font-semibold uppercase tracking-wider mb-2
    ${isDark ? "text-slate-400" : "text-gray-400"}`

  return (
    <div className={`min-h-screen transition-colors duration-300
      ${isDark ? "bg-slate-950" : "bg-gray-50"}`}>

      <Header
        title="Paramètres"
        subtitle="Configuration du système et du profil"
      />

      <main className="ml-64 pt-24 px-8 pb-8 max-w-4xl">

        {/* Message succès */}
        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm flex items-center gap-2">
            <Save size={16} />
            Paramètres sauvegardés avec succès !
          </div>
        )}

        {/* Section 1 — Profil */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-5">
            <User size={20} className="text-blue-600" />
            <h2 className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-800"}`}>
              Profil utilisateur
            </h2>
          </div>
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
          <div className="flex items-center gap-2 mb-5">
            <Sun size={20} className="text-yellow-500" />
            <h2 className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-800"}`}>
              Apparence
            </h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${isDark ? "text-white" : "text-gray-800"}`}>
                Mode d'affichage
              </p>
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                Actuellement : {isDark ? "Mode sombre 🌙" : "Mode clair ☀️"}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all
                ${isDark
                  ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                  : "bg-slate-800/10 text-slate-700 hover:bg-slate-800/20"}`}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {isDark ? "Passer en clair" : "Passer en sombre"}
            </button>
          </div>
        </div>

        {/* Section 3 — Seuils Data Drift */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={20} className="text-orange-500" />
            <h2 className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-800"}`}>
              Seuils d'alerte Data Drift
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>
                🟡 Seuil d'alerte (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10" max="50"
                  value={driftSeuils.alerte}
                  onChange={e => setDriftSeuils({ ...driftSeuils, alerte: parseInt(e.target.value) })}
                  className="flex-1 accent-yellow-500"
                />
                <span className="text-sm font-bold text-yellow-500 w-12">
                  {driftSeuils.alerte}%
                </span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                Surveillance renforcée au-delà de ce seuil
              </p>
            </div>
            <div>
              <label className={labelClass}>
                🔴 Seuil critique (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="20" max="80"
                  value={driftSeuils.critique}
                  onChange={e => setDriftSeuils({ ...driftSeuils, critique: parseInt(e.target.value) })}
                  className="flex-1 accent-red-500"
                />
                <span className="text-sm font-bold text-red-500 w-12">
                  {driftSeuils.critique}%
                </span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                Réentraînement immédiat au-delà de ce seuil
              </p>
            </div>
          </div>

          {/* Aperçu des règles */}
          <div className={`mt-4 p-4 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-gray-50"}`}>
            <p className={`text-xs font-semibold mb-2 ${isDark ? "text-slate-300" : "text-gray-600"}`}>
              Règles actives :
            </p>
            <div className="space-y-1 text-xs">
              <p className="text-green-500">🟢 &lt; {driftSeuils.alerte}% — Normal (monitoring hebdomadaire)</p>
              <p className="text-yellow-500">🟡 {driftSeuils.alerte}% - {driftSeuils.critique}% — Alerte (monitoring quotidien)</p>
              <p className="text-red-500">🔴 &gt; {driftSeuils.critique}% — Critique (réentraînement immédiat)</p>
            </div>
          </div>
        </div>

        {/* Section 4 — Configuration API */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-5">
            <Activity size={20} className="text-green-500" />
            <h2 className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-800"}`}>
              Configuration API
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>URL API FastAPI</label>
              <input
                type="text"
                value={apiConfig.url}
                onChange={e => setApiConfig({ ...apiConfig, url: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>URL MLFlow</label>
              <input
                type="text"
                value={apiConfig.mlflow}
                onChange={e => setApiConfig({ ...apiConfig, mlflow: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Statut connexions */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl
              ${isDark ? "bg-slate-700/50" : "bg-gray-50"}`}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-500">FastAPI connectée</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl
              ${isDark ? "bg-slate-700/50" : "bg-gray-50"}`}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-500">MLFlow connecté</span>
            </div>
          </div>
        </div>

        {/* Section 5 — Infos système */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-5">
            <Database size={20} className="text-purple-500" />
            <h2 className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-800"}`}>
              Informations système
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Modèle actif", value: "XGBoost 3.2.0" },
              { label: "AUC-ROC", value: "0.7294" },
              { label: "Score métier", value: "35 289" },
              { label: "Dataset", value: "Home Credit (307k)" },
              { label: "Features", value: "178 colonnes" },
              { label: "Version API", value: "1.0.0" },
            ].map(({ label, value }) => (
              <div key={label} className={`px-4 py-3 rounded-xl
                ${isDark ? "bg-slate-700/50" : "bg-gray-50"}`}>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>{label}</p>
                <p className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-800"}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton sauvegarder */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
          <Save size={20} />
          Sauvegarder tous les paramètres
        </button>

      </main>
    </div>
  )
}