import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import Header from "../components/Header"
import MetricCard from "../components/MetricCard"
import { checkHealth, getHistorique, getStats } from "../services/api"
import {
  Users, AlertTriangle, CheckCircle, XCircle, Activity, BarChart2, RefreshCw
} from "lucide-react"

const RISK_LABELS = {
  "FAIBLE": "FAIBLE",
  "MODÉRÉ": "MODÉRÉ",
  "ÉLEVÉ": "ÉLEVÉ",
  "TRÈS ÉLEVÉ": "TRÈS ÉLEVÉ",
}

export default function Dashboard() {
  const { isDark } = useTheme()
  const [apiStatus, setApiStatus] = useState(null)
  const [historique, setHistorique] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [health, hist, st] = await Promise.all([
        checkHealth(),
        getHistorique(),
        getStats()
      ])
      setApiStatus(health)
      setHistorique(hist)
      setStats(st)
    } catch (error) {
      console.error(error)
      setApiStatus({ status: "ERROR" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className={`min-h-screen transition-colors duration-300
      ${isDark ? "bg-black" : "bg-gray-50"}`}>

      <Header
        title="Tableau de bord"
        subtitle="Vue d'ensemble du système de scoring crédit"
      />

      <main className="ml-64 pt-24 px-8 pb-8">

        {/* Statut API */}
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl w-fit text-sm font-medium
            ${apiStatus?.status === "OK"
              ? isDark ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-green-50 text-green-700 border border-green-200"
              : isDark ? "bg-red-500/10 text-red-400 border border-red-500/30" : "bg-red-50 text-red-700 border border-red-200"}`}>
            <Activity size={16} />
            {apiStatus?.status === "OK" ? "API connectée — XGBoost opérationnel" : "API non disponible"}
          </div>

          {/* Bouton refresh */}
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

        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          <MetricCard
            title="Dossiers analysés"
            value={loading ? "..." : stats?.total || 0}
            subtitle="Total historique"
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Taux d'accord"
            value={loading ? "..." : `${stats?.taux_accord || 0}%`}
            subtitle="Crédits accordés"
            icon={CheckCircle}
            color="green"
          />
          <MetricCard
            title="Dossiers refusés"
            value={loading ? "..." : stats?.refuses || 0}
            subtitle="Risque trop élevé"
            icon={XCircle}
            color="red"
          />
          <MetricCard
            title="Risque moyen"
            value={loading ? "..." : `${stats?.proba_moyenne || 0}%`}
            subtitle="Probabilité de défaut"
            icon={AlertTriangle}
            color="orange"
          />
        </div>

        {/* Tableau historique */}
        <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300
          ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100"}`}>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart2 size={20} className="text-blue-600" />
              <h2 className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-800"}`}>
                Historique des analyses
              </h2>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full
              ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-500"}`}>
              {historique.length} entrées
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
              <p className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-400"}`}>
                Chargement des données...
              </p>
            </div>
          ) : historique.length === 0 ? (
            <div className="text-center py-12">
              <p className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-400"}`}>
                Aucune analyse effectuée pour le moment.
                Allez dans la page Analyse pour commencer !
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className={`text-xs uppercase tracking-wider
                  ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                  <th className="text-left pb-3">Date</th>
                  <th className="text-right pb-3">Revenu</th>
                  <th className="text-right pb-3">Crédit</th>
                  <th className="text-center pb-3">Âge</th>
                  <th className="text-center pb-3">Risque</th>
                  <th className="text-right pb-3">Probabilité</th>
                  <th className="text-center pb-3">Décision</th>
                </tr>
              </thead>
              <tbody>
                {historique.map((item) => {
                  const riskLabel = RISK_LABELS[item.niveau_risque] || item.niveau_risque
                  return (
                    <tr key={item.id} className={`text-sm border-t transition-colors
                      ${isDark ? "border-zinc-800 hover:bg-zinc-800/50" : "border-gray-100 hover:bg-gray-50"}`}>
                      <td className={`py-3 ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                        {item.date}
                      </td>
                      <td className={`py-3 text-right ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                        {item.revenu?.toLocaleString()} FCFA
                      </td>
                      <td className={`py-3 text-right ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                        {item.credit?.toLocaleString()} FCFA
                      </td>
                      <td className={`py-3 text-center ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                        {item.age} ans
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap
                          ${item.niveau_risque === "FAIBLE" ? (isDark ? "bg-green-500/15 text-green-400" : "bg-green-100 text-green-700") :
                            item.niveau_risque === "MODÉRÉ" ? (isDark ? "bg-yellow-500/15 text-yellow-400" : "bg-yellow-100 text-yellow-700") :
                            item.niveau_risque === "ÉLEVÉ" ? (isDark ? "bg-orange-500/15 text-orange-400" : "bg-orange-100 text-orange-700") :
                            (isDark ? "bg-red-500/15 text-red-400" : "bg-red-100 text-red-700")}`}>
                          {riskLabel}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-medium
                        ${item.probabilite_defaut > 50 ? "text-red-500" : "text-green-500"}`}>
                        {item.probabilite_defaut}%
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold
                          ${item.decision === "ACCORDÉ"
                            ? (isDark ? "bg-green-500/15 text-green-400" : "bg-green-100 text-green-700")
                            : (isDark ? "bg-red-500/15 text-red-400" : "bg-red-100 text-red-700")}`}>
                          {item.decision}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}