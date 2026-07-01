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

function AnimatedRow({ run, isDark, delay }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const rowStyle = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(8px)",
    transition: "opacity 0.5s ease " + delay + "ms, transform 0.5s ease " + delay + "ms"
  }

  const rowClass = "text-sm border-t " + (isDark ? "border-zinc-800 hover:bg-zinc-800/50" : "border-gray-100 hover:bg-gray-50")
  const nameClass = "py-3 font-medium " + (isDark ? "text-zinc-300" : "text-gray-700")
  const aucClass = "py-3 text-right font-bold " + (run.auc_roc > 0.7 ? (isDark ? "text-green-400" : "text-green-500") : (isDark ? "text-orange-400" : "text-orange-500"))
  const scoreClass = "py-3 text-right " + (isDark ? "text-zinc-300" : "text-gray-600")
  const badgeClass = "text-xs px-2 py-1 rounded-full " + (isDark ? "bg-green-500/15 text-green-400" : "bg-green-100 text-green-700")

  return (
    <tr style={rowStyle} className={rowClass}>
      <td className={nameClass}>{run.nom}</td>
      <td className={aucClass}>{run.auc_roc}</td>
      <td className={scoreClass}>{run.score_metier}</td>
      <td className="py-3 text-center">
        <span className={badgeClass}>{run.statut}</span>
      </td>
    </tr>
  )
}

function DriftCard({ feature: f, isDark, delay, getBadgeColor, getBadgeIcon, getDriftBarColor }) {
  const [barWidth, setBarWidth] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), delay)
    const t2 = setTimeout(() => setBarWidth(Math.min(f.ecart_pct * 2, 100)), delay + 200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [delay, f.ecart_pct])

  const cardStyle = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(12px)",
    transition: "opacity 0.5s ease " + delay + "ms, transform 0.5s ease " + delay + "ms"
  }

  const barStyle = {
    width: barWidth + "%",
    transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)"
  }

  const cardClass = "p-4 rounded-xl border " + (isDark ? "bg-zinc-800/60 border-zinc-700" : "bg-gray-50 border-gray-100")
  const titleClass = "font-medium text-sm " + (isDark ? "text-white" : "text-gray-800")
  const trackClass = "w-full h-2 rounded-full mb-2 " + (isDark ? "bg-zinc-700" : "bg-gray-200")
  const refClass = isDark ? "text-zinc-400" : "text-gray-500"
  const ecartClass = "font-bold " + (f.ecart_pct > 40 ? "text-red-500" : f.ecart_pct > 20 ? "text-yellow-500" : "text-green-500")

  return (
    <div style={cardStyle} className={cardClass}>
      <div className="flex items-center justify-between mb-2">
        <span className={titleClass}>{f.feature}</span>
        <span className={"text-xs px-2 py-1 rounded-full font-medium " + getBadgeColor(f.statut)}>
          {getBadgeIcon(f.statut)} {f.statut}
        </span>
      </div>
      <div className={trackClass}>
        <div style={barStyle} className={"h-2 rounded-full " + getDriftBarColor(f.ecart_pct)} />
      </div>
      <div className="flex justify-between text-xs">
        <span className={refClass}>Réf: {f.ref_mean?.toLocaleString()} FCFA</span>
        <span className={ecartClass}>Écart: {f.ecart_pct}%</span>
        <span className={refClass}>Prod: {f.prod_mean?.toLocaleString()} FCFA</span>
      </div>
    </div>
  )
}

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

  useEffect(() => { fetchData() }, [])

  const getBadgeColor = (statut) => {
    if (isDark) {
      if (statut === "NORMAL") return "bg-green-500/15 text-green-400"
      if (statut === "ALERTE") return "bg-yellow-500/15 text-yellow-400"
      if (statut === "CRITIQUE") return "bg-red-500/15 text-red-400"
      return "bg-zinc-800 text-zinc-400"
    }
    if (statut === "NORMAL") return "bg-green-100 text-green-700"
    if (statut === "ALERTE") return "bg-yellow-100 text-yellow-700"
    if (statut === "CRITIQUE") return "bg-red-100 text-red-700"
    return "bg-gray-100 text-gray-700"
  }

  const getBadgeIcon = (statut) => {
    if (statut === "NORMAL") return "🟢"
    if (statut === "ALERTE") return "🟡"
    if (statut === "CRITIQUE") return "🔴"
    return "⚪"
  }

  const getDriftBarColor = (pct) => {
    if (pct > 40) return "bg-red-500"
    if (pct > 20) return "bg-yellow-500"
    return "bg-green-500"
  }

  const isNormal = drift?.statut_global === "NORMAL"
  const pageClass = "min-h-screen transition-colors duration-300 " + (isDark ? "bg-black" : "bg-gray-50")
  const cardClass = "rounded-2xl border p-6 transition-colors " + (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")
  const statusClass = "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium " + (isNormal
    ? (isDark ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-green-50 text-green-700 border border-green-200")
    : (isDark ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30" : "bg-yellow-50 text-yellow-700 border border-yellow-200"))
  const refreshClass = "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all " + (isDark ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-800" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200")
  const titleClass = "font-bold text-base " + (isDark ? "text-white" : "text-gray-800")
  const headClass = "text-xs uppercase tracking-wider " + (isDark ? "text-zinc-500" : "text-gray-400")
  const loadClass = "text-sm " + (isDark ? "text-zinc-400" : "text-gray-400")
  const emptyClass = "text-sm text-center py-8 " + (isDark ? "text-zinc-400" : "text-gray-400")

  const reportLinkStyle = {
    marginTop: "1rem",
    padding: "1rem",
    borderRadius: "0.75rem",
    border: "1px solid " + (isDark ? "rgba(59,130,246,0.3)" : "rgb(191,219,254)"),
    background: isDark ? "rgba(59,130,246,0.1)" : "rgb(239,246,255)",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    textDecoration: "none",
    transition: "all 0.2s"
  }

  const reportIconStyle = {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "0.75rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: isDark ? "rgba(59,130,246,0.2)" : "rgb(219,234,254)"
  }

  const reportTitleClass = "text-sm font-semibold " + (isDark ? "text-blue-300" : "text-blue-700")
  const reportSubClass = "text-xs " + (isDark ? "text-blue-400" : "text-blue-500")
  const reportIconClass = isDark ? "text-blue-400" : "text-blue-600"
  const externalClass = "flex-shrink-0 " + (isDark ? "text-blue-400" : "text-blue-500")

  return (
    <div className={pageClass}>
      <Header title="Monitoring" subtitle="Performance des modèles et analyse du data drift" />

      <main className="ml-64 pt-24 px-8 pb-8">

        <div className="flex items-center justify-between mb-6">
          <div className={statusClass}>
            <Activity size={16} />
            {isNormal ? "Système stable — Pas de drift détecté" : "Drift détecté — Surveillance renforcée"}
          </div>
          <button onClick={fetchData} className={refreshClass}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        <div className="grid grid-cols-4 gap-5 mb-8">
          <MetricCard
            title="Runs MLFlow"
            value={loading ? null : runs.length}
            subtitle="Expériences loggées"
            icon={BarChart2}
            color="blue"
          />
          <MetricCard
            title="Meilleur AUC-ROC"
            value={loading ? null : runs.length > 0 ? parseFloat(Math.max(...runs.map(r => r.auc_roc)).toFixed(4)) : null}
            subtitle="XGBoost"
            icon={TrendingUp}
            color="green"
          />
          <MetricCard
            title="Prédictions totales"
            value={loading ? null : drift?.total_predictions || 0}
            subtitle="En production"
            icon={Database}
            color="orange"
          />
          <MetricCard
            title="Statut Drift"
            value={loading ? null : drift?.statut_global || "N/A"}
            subtitle="Analyse des distributions"
            icon={isNormal ? CheckCircle : AlertTriangle}
            color={isNormal ? "green" : "orange"}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">

          <div className={cardClass}>
            <div className="flex items-center gap-2 mb-5">
              <Zap size={20} className="text-blue-600" />
              <h2 className={titleClass}>Runs MLFlow</h2>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                <p className={loadClass}>Chargement...</p>
              </div>
            ) : runs.length === 0 ? (
              <p className={emptyClass}>Aucun run MLFlow trouvé</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className={headClass}>
                    <th className="text-left pb-3">Modèle</th>
                    <th className="text-right pb-3">AUC-ROC</th>
                    <th className="text-right pb-3">Score Métier</th>
                    <th className="text-center pb-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run, i) => (
                    <AnimatedRow key={i} run={run} isDark={isDark} delay={i * 120} />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className={cardClass}>
            <div className="flex items-center gap-2 mb-5">
              <Activity size={20} className="text-purple-600" />
              <h2 className={titleClass}>Analyse Data Drift</h2>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                <p className={loadClass}>Chargement...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {drift?.drift_features?.map((f, i) => (
                  <DriftCard
                    key={i}
                    feature={f}
                    isDark={isDark}
                    delay={i * 150}
                    getBadgeColor={getBadgeColor}
                    getBadgeIcon={getBadgeIcon}
                    getDriftBarColor={getDriftBarColor}
                  />
                ))}
                <a href={API_URL + "/api/drift-report"} target="_blank" rel="noopener noreferrer" style={reportLinkStyle}>
                  <div style={reportIconStyle}>
                    <FileText size={18} className={reportIconClass} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className={reportTitleClass}>Rapport Evidently complet</p>
                    <p className={reportSubClass}>Cliquez pour ouvrir dans un nouvel onglet</p>
                  </div>
                  <ExternalLink size={16} className={externalClass} />
                </a>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}