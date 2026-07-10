import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"
import Header from "../components/Header"
import { getModelInfo } from "../services/api"
import {
  User, Database, CloudUpload, Sun, Moon, AlertTriangle, Server, CheckCircle
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
  const [modelInfo, setModelInfo] = useState({
    model_name: "XGBoost",
    version: "1.0.0",
    auc_roc: "0.7294",
    score_metier: "35 289"
  })

  useEffect(() => {
    getModelInfo()
      .then(info => setModelInfo(info))
      .catch(() => {})
  }, [])

  const handleSave = () => {
    updateUser(userForm)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const pageClass = "min-h-screen transition-colors duration-300 " + (isDark ? "bg-zinc-950" : "bg-gray-50")
  const sectionClass = "rounded-xl border mb-4 transition-colors " +
    (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")
  const inputClass = "w-full border rounded-xl px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400 " +
    (isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-gray-50 border-gray-200 text-gray-800")
  const labelClass = "block text-xs font-medium uppercase tracking-wide mb-1.5 " +
    (isDark ? "text-zinc-500" : "text-gray-400")
  const borderB = isDark ? "border-zinc-800" : "border-gray-100"

  const SectionHeader = ({ icon, title, desc }) => (
    <div className={"flex items-center gap-3 px-5 py-4 border-b " + borderB}>
      <div className={"w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 " +
        (isDark ? "bg-zinc-800" : "bg-gray-100")}>
        {icon}
      </div>
      <div>
        <h2 className={"font-semibold text-sm " + (isDark ? "text-white" : "text-gray-800")}>{title}</h2>
        {desc && <p className={"text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")}>{desc}</p>}
      </div>
    </div>
  )

  return (
    <div className={pageClass}>
      <Header title="Paramètres" subtitle="Configuration du système et du profil" />

      <main className="lg:ml-64 pt-14 lg:pt-24 px-4 lg:px-8 pb-8">
        <div className="max-w-4xl mt-4 lg:mt-0">

          {/* Message succès */}
          {saved && (
            <div className={"mb-4 flex items-center gap-2 border rounded-xl px-4 py-3 text-xs " +
              (isDark ? "bg-emerald-500/10 border-emerald-900 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700")}>
              <CheckCircle size={13} />
              Paramètres sauvegardés avec succès !
            </div>
          )}

          {/* Section 1 — Profil */}
          <div className={sectionClass}>
            <SectionHeader
              icon={<User size={15} className={isDark ? "text-zinc-400" : "text-gray-500"} />}
              title="Profil utilisateur"
              desc="Vos informations personnelles"
            />
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Prénom", key: "prenom" },
                  { label: "Nom", key: "nom" },
                  { label: "Rôle", key: "role" },
                  { label: "Email", key: "email" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className={labelClass}>{label}</label>
                    <input
                      type="text"
                      value={userForm[key]}
                      onChange={e => setUserForm({ ...userForm, [key]: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className={labelClass}>Organisation</label>
                  <input
                    type="text"
                    value={userForm.organisation}
                    onChange={e => setUserForm({ ...userForm, organisation: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 — Apparence */}
          <div className={sectionClass}>
            <SectionHeader
              icon={isDark
                ? <Sun size={15} className="text-zinc-400" />
                : <Moon size={15} className="text-gray-500" />}
              title="Apparence"
              desc="Personnalisez l'affichage de l'interface"
            />
            <div className="p-5">
              <div className={"flex items-center justify-between rounded-xl px-4 py-3.5 " +
                (isDark ? "bg-zinc-800/60" : "bg-gray-50")}>
                <div>
                  <p className={"text-sm font-medium " + (isDark ? "text-white" : "text-gray-800")}>
                    Mode {isDark ? "sombre" : "clair"} actif
                  </p>
                  <p className={"text-xs mt-0.5 " + (isDark ? "text-zinc-500" : "text-gray-400")}>
                    Basculer instantanément entre les deux thèmes
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={"flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all " +
                    (isDark
                      ? "border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-100")}>
                  {isDark ? <Sun size={13} /> : <Moon size={13} />}
                  {isDark ? "Clair" : "Sombre"}
                </button>
              </div>
            </div>
          </div>

          {/* Section 3 — Seuils Data Drift */}
          <div className={sectionClass}>
            <SectionHeader
              icon={<AlertTriangle size={15} className={isDark ? "text-zinc-400" : "text-gray-500"} />}
              title="Seuils d'alerte Data Drift"
              desc="Définissez les niveaux de surveillance"
            />
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={labelClass}>Seuil d'alerte</label>
                    <span className={"text-xs font-semibold tabular-nums " +
                      (isDark ? "text-amber-400" : "text-amber-600")}>
                      {driftSeuils.alerte}%
                    </span>
                  </div>
                  <input type="range" min="10" max="50"
                    value={driftSeuils.alerte}
                    onChange={e => setDriftSeuils({ ...driftSeuils, alerte: parseInt(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer" />
                  <p className={"text-xs mt-1.5 " + (isDark ? "text-zinc-600" : "text-gray-400")}>
                    Surveillance renforcée au-delà
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={labelClass}>Seuil critique</label>
                    <span className={"text-xs font-semibold tabular-nums " +
                      (isDark ? "text-red-400" : "text-red-600")}>
                      {driftSeuils.critique}%
                    </span>
                  </div>
                  <input type="range" min="20" max="80"
                    value={driftSeuils.critique}
                    onChange={e => setDriftSeuils({ ...driftSeuils, critique: parseInt(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer" />
                  <p className={"text-xs mt-1.5 " + (isDark ? "text-zinc-600" : "text-gray-400")}>
                    Réentraînement immédiat au-delà
                  </p>
                </div>
              </div>

              <div className={"p-4 rounded-xl space-y-2 " + (isDark ? "bg-zinc-800/60" : "bg-gray-50")}>
                {[
                  { color: "bg-emerald-500", label: `< ${driftSeuils.alerte}% — Normal, monitoring hebdomadaire` },
                  { color: "bg-amber-500", label: `${driftSeuils.alerte}%–${driftSeuils.critique}% — Alerte, monitoring quotidien` },
                  { color: "bg-red-500", label: `> ${driftSeuils.critique}% — Critique, réentraînement immédiat` },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <span className={"w-1.5 h-1.5 rounded-full flex-shrink-0 " + color} />
                    <span className={isDark ? "text-zinc-400" : "text-gray-600"}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4 — Configuration API */}
          <div className={sectionClass}>
            <SectionHeader
              icon={<Server size={15} className={isDark ? "text-zinc-400" : "text-gray-500"} />}
              title="Configuration API"
              desc="Endpoints des services backend"
            />
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["FastAPI connectée", "MLFlow connecté"].map(label => (
                  <div key={label}
                    className={"flex items-center gap-2.5 px-4 py-3 rounded-xl " +
                      (isDark ? "bg-zinc-800/60" : "bg-gray-50")}>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
                    <span className={"text-xs font-medium " + (isDark ? "text-emerald-400" : "text-emerald-600")}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5 — Infos système dynamiques */}
          <div className={sectionClass}>
            <SectionHeader
              icon={<Database size={15} className={isDark ? "text-zinc-400" : "text-gray-500"} />}
              title="Informations système"
              desc="État actuel du modèle en production"
            />
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Modèle actif",  value: modelInfo.model_name || "XGBoost" },
                  { label: "Version",        value: `v${modelInfo.version || "1.0.0"}` },
                  { label: "AUC-ROC",        value: modelInfo.auc_roc || "0.7294" },
                  { label: "Score métier",   value: modelInfo.score_metier?.toLocaleString() || "35 289" },
                  { label: "Dataset",        value: "307k lignes" },
                  { label: "Features",       value: "178" },
                ].map(({ label, value }) => (
                  <div key={label}
                    className={"px-4 py-3 rounded-xl " + (isDark ? "bg-zinc-800/60" : "bg-gray-50")}>
                    <p className={"text-xs mb-0.5 " + (isDark ? "text-zinc-500" : "text-gray-400")}>{label}</p>
                    <p className={"text-sm font-semibold tabular-nums " + (isDark ? "text-white" : "text-gray-800")}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bouton sauvegarder */}
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
            <CloudUpload size={15} />
            Sauvegarder tous les paramètres
          </button>

        </div>
      </main>
    </div>
  )
}