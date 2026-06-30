import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import Header from "../components/Header"
import MetricCard from "../components/MetricCard"
import { getMlflowRuns, getDriftStats } from "../services/api"
import {
  Activity, BarChart2, RefreshCw, AlertTriangle,
  CheckCircle, TrendingUp, Database, Zap, FileText, ExternalLink
} from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function Monitoring() {
  const { isDark } = useTheme()
  const [runs, setRuns] = useState([])
  const [drift, setDrift] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [runsData, driftData] = await Promise.all([
        getMlflowRuns(),
        getDriftStats()
      ])
      setRuns(runsData)
      setDrift(driftData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getBadgeColor = (statut) => {
    if (isDark) {
      switch (statut) {
        case "NORMAL": return "bg-green-500/15 text-green-400"
        case "ALERTE": return "bg-yellow-500/15 text-yellow-400"
        case "CRITIQUE": return "bg-red-500/15 text-red-400"
        default: return "bg-zinc-800 text-zinc-400"
      }
    }
    switch (statut) {
      case "NORMAL": return "bg-green-100 text-green-700"
      case "ALERTE": return "bg-yellow-100 text-yellow-700"
      case "CRITIQUE": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getBadgeIcon = (statut) => {
    switch (statut) {
      case "NORMAL": return "🟢"
      case "ALERTE": return "🟡"
      case "CRITIQUE": return "🔴"
      default: return "⚪"
    }
  }

  const cardClass = `rounded-2xl border p-6 transition-colors
    ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm"}`

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-black" : "bg-gray-50"}`}>

      <Header
        title="Monitoring"
        subtitle="Performance des modèles et analyse du data drift"
      />

      <main className="ml-64 pt-24 px-8 pb-8">

        {/* Header actions */}
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
            ${drift?.statut_global === "NORMAL"
              ? isDark ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-green-50 text-green-700 border border-green-200"
              : isDark ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`}>
            <Activity size={16} />
            {drift?.statut_global === "NORMAL"
              ? "Système stable — Pas de drift détecté"
              : "Drift détecté — Surveillance renforcée"}
          </div>
          <button
            onClick={fetchData}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${isDark
                ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {/* Cards métriques */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          <MetricCard
            title="Runs MLFlow"
            value={loading ? "..." : runs.length}
            subtitle="Expériences loggées"
            icon={BarChart2}
            color="blue"
          />
          <MetricCard
            title="Meilleur AUC-ROC"
            value={loading ? "..." : runs.length > 0
              ? Math.max(...runs.map(r => r.auc_roc)).toFixed(4)
              : "N/A"}
            subtitle="XGBoost"
            icon={TrendingUp}
            color="green"
          />
          <MetricCard
            title="Prédictions totales"
            value={loading ? "..." : drift?.total_predictions || 0}
            subtitle="En production"
            icon={Database}
            color="orange"
          />
          <MetricCard
            title="Statut Drift"
            value={loading ? "..." : drift?.statut_global || "N/A"}
            subtitle="Analyse des distributions"
            icon={drift?.statut_global === "NORMAL" ? CheckCircle : AlertTriangle}
            color={drift?.statut_global === "NORMAL" ? "green" : "orange"}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">

          {/* Section MLFlow Runs */}
          <div className={cardClass}>
            <div className="flex items-center gap-2 mb-5">
              <Zap size={20} className="text-blue-600" />
              <h2 className={`font-bold text-base ${isDark ? "text-white" : "text-gray-800"}`}>
                Runs MLFlow
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                <p className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-400"}`}>Chargement...</p>
              </div>
            ) : runs.length === 0 ? (
              <p className={`text-sm text-center py-8 ${isDark ? "text-zinc-400" : "text-gray-400"}`}>
                Aucun run MLFlow trouvé
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className={`text-xs uppercase tracking-wider
                    ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                    <th className="text-left pb-3">Modèle</th>
                    <th className="text-right pb-3">AUC-ROC</th>
                    <th className="text-right pb-3">Score Métier</th>
                    <th className="text-center pb-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run, i) => (
                    <tr key={i} className={`text-sm border-t transition-colors
                      ${isDark ? "border-zinc-800 hover:bg-zinc-800/50" : "border-gray-100 hover:bg-gray-50"}`}>
                      <td className={`py-3 font-medium ${isDark ? "text-zinc-300" : "text-gray-700"}`}>
                        {run.nom}
                      </td>
                      <td className={`py-3 text-right font-bold
                        ${run.auc_roc > 0.7
                          ? (isDark ? "text-green-400" : "text-green-500")
                          : (isDark ? "text-orange-400" : "text-orange-500")}`}>
                        {run.auc_roc}
                      </td>
                      <td className={`py-3 text-right ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                        {run.score_metier}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full
                          ${isDark ? "bg-green-500/15 text-green-400" : "bg-green-100 text-green-700"}`}>
                          {run.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section Data Drift */}
          <div className={cardClass}>
            <div className="flex items-center gap-2 mb-5">
              <Activity size={20} className="text-purple-600" />
              <h2 className={`font-bold text-base ${isDark ? "text-white" : "text-gray-800"}`}>
                Analyse Data Drift
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                <p className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-400"}`}>Chargement...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {drift?.drift_features?.map((f, i) => (
                  <div key={i} className={`p-4 rounded-xl border
                    ${isDark ? "bg-zinc-800/60 border-zinc-700" : "bg-gray-50 border-gray-100"}`}>

                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-medium text-sm ${isDark ? "text-white" : "text-gray-800"}`}>
                        {f.feature}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBadgeColor(f.statut)}`}>
                        {getBadgeIcon(f.statut)} {f.statut}
                      </span>
                    </div>

                    {/* Barre de drift */}
                    <div className={`w-full h-2 rounded-full mb-2 ${isDark ? "bg-zinc-700" : "bg-gray-200"}`}>
                      <div
                        className={`h-2 rounded-full transition-all duration-700
                          ${f.ecart_pct > 40 ? "bg-red-500" :
                            f.ecart_pct > 20 ? "bg-yellow-500" : "bg-green-500"}`}
                        style={{ width: `${Math.min(f.ecart_pct * 2, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className={isDark ? "text-zinc-400" : "text-gray-500"}>
                        Réf: {f.ref_mean?.toLocaleString()} FCFA
                      </span>
                      <span className={`font-bold ${
                        f.ecart_pct > 40 ? "text-red-500" :
                        f.ecart_pct > 20 ? "text-yellow-500" : "text-green-500"}`}>
                        Écart: {f.ecart_pct}%
                      </span>
                      <span className={isDark ? "text-zinc-400" : "text-gray-500"}>
                        Prod: {f.prod_mean?.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                ))}

                {/* Lien rapport — vraiment cliquable */}
                <a
                  href={`${API_URL}/api/drift-report`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-4 p-4 rounded-xl border flex items-center gap-3 transition-all group
                    ${isDark
                      ? "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15"
                      : "bg-blue-50 border-blue-200 hover:bg-blue-100"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isDark ? "bg-blue-500/20" : "bg-blue-100"}`}>
                    <FileText size={18} className={isDark ? "text-blue-400" : "text-blue-600"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isDark ? "text-blue-300" : "text-blue-700"}`}>
                      Rapport Evidently complet
                    </p>
                    <p className={`text-xs ${isDark ? "text-blue-400/70" : "text-blue-500"}`}>
                      Cliquez pour ouvrir dans un nouvel onglet
                    </p>
                  </div>
                  <ExternalLink size={16} className={`flex-shrink-0 transition-transform group-hover:translate-x-0.5
                    ${isDark ? "text-blue-400" : "text-blue-500"}`} />
                </a>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  )
}