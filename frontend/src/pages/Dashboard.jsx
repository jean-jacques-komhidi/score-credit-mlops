import { useState, useEffect, useRef } from "react"
import { useTheme } from "../context/ThemeContext"
import Header from "../components/Header"
import MetricCard from "../components/MetricCard"
import { checkHealth, getHistorique, getStats, getModelInfo } from "../services/api"
import {
  Users, AlertTriangle, CheckCircle, XCircle, Activity, BarChart2, RefreshCw, Loader2
} from "lucide-react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

const RISK_LABELS = {
  "FAIBLE": "FAIBLE",
  "MODÉRÉ": "MODÉRÉ",
  "ÉLEVÉ": "ÉLEVÉ",
  "TRÈS ÉLEVÉ": "TRÈS ÉLEVÉ",
}

function buildChartData(historique) {
  const moisMap = {}
  const riskCount = { FAIBLE: 0, "MODÉRÉ": 0, "ÉLEVÉ": 0, "TRÈS ÉLEVÉ": 0 }
  const risqueParJour = {}

  historique.forEach(item => {
    const date = new Date(item.date)
    const moisKey = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0")
    const moisLabel = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
    if (!moisMap[moisKey]) moisMap[moisKey] = { label: moisLabel, accordes: 0, refuses: 0 }
    if (item.decision === "ACCORDÉ") moisMap[moisKey].accordes++
    else moisMap[moisKey].refuses++
    if (riskCount[item.niveau_risque] !== undefined) riskCount[item.niveau_risque]++
    const jourKey = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0")
    const jourLabel = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
    if (!risqueParJour[jourKey]) risqueParJour[jourKey] = { label: jourLabel, total: 0, count: 0 }
    risqueParJour[jourKey].total += item.probabilite_defaut
    risqueParJour[jourKey].count++
  })

  const sortedMois = Object.keys(moisMap).sort().slice(-6)
  const sortedJours = Object.keys(risqueParJour).sort().slice(-7)

  return {
    histogramme: {
      labels: sortedMois.map(k => moisMap[k].label),
      accordes: sortedMois.map(k => moisMap[k].accordes),
      refuses: sortedMois.map(k => moisMap[k].refuses),
    },
    camembert: riskCount,
    courbe: {
      labels: sortedJours.map(k => risqueParJour[k].label),
      values: sortedJours.map(k =>
        Math.round((risqueParJour[k].total / risqueParJour[k].count) * 10) / 10
      ),
    }
  }
}

function RiskBadge({ niveau, isDark }) {
  const cfg = {
    "FAIBLE":     isDark ? "text-emerald-400 border-emerald-800" : "text-emerald-700 border-emerald-200",
    "MODÉRÉ":     isDark ? "text-amber-400 border-amber-800"    : "text-amber-700 border-amber-200",
    "ÉLEVÉ":      isDark ? "text-orange-400 border-orange-800"  : "text-orange-700 border-orange-200",
    "TRÈS ÉLEVÉ": isDark ? "text-red-400 border-red-800"        : "text-red-700 border-red-200",
  }
  return (
    <span className={"text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap " +
      (cfg[niveau] || (isDark ? "text-zinc-400 border-zinc-700" : "text-gray-500 border-gray-200"))}>
      {RISK_LABELS[niveau] || niveau}
    </span>
  )
}

function Graphiques({ historique, isDark }) {
  const histRef = useRef(null)
  const camRef = useRef(null)
  const courbeRef = useRef(null)
  const charts = useRef({})
  const gridColor = isDark ? "#27272a" : "#f3f4f6"
  const textColor = isDark ? "#71717a" : "#9ca3af"

  useEffect(() => {
    if (historique.length === 0) return
    const data = buildChartData(historique)
    let initiated = false
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !initiated) {
        initiated = true
        Object.values(charts.current).forEach(c => c?.destroy())
        charts.current = {}

        if (histRef.current) {
          charts.current.hist = new Chart(histRef.current, {
            type: "bar",
            data: {
              labels: data.histogramme.labels,
              datasets: [
                { label: "Accordés", data: data.histogramme.accordes, backgroundColor: isDark ? "rgba(5,150,105,0.7)" : "rgba(5,150,105,0.85)", borderRadius: 4, borderSkipped: false },
                { label: "Refusés", data: data.histogramme.refuses, backgroundColor: isDark ? "rgba(220,38,38,0.7)" : "rgba(220,38,38,0.85)", borderRadius: 4, borderSkipped: false }
              ]
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              animation: { duration: 1000, easing: "easeOutQuart" },
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false }, border: { color: gridColor } },
                y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor }, border: { display: false } }
              }
            }
          })
        }

        if (camRef.current) {
          const riskData = data.camembert
          const total = Object.values(riskData).reduce((a, b) => a + b, 0)
          charts.current.cam = new Chart(camRef.current, {
            type: "doughnut",
            data: {
              labels: ["Faible", "Modéré", "Élevé", "Très élevé"],
              datasets: [{ data: [riskData["FAIBLE"], riskData["MODÉRÉ"], riskData["ÉLEVÉ"], riskData["TRÈS ÉLEVÉ"]], backgroundColor: ["#059669", "#d97706", "#ea580c", "#dc2626"], borderWidth: 2, borderColor: isDark ? "#09090b" : "#ffffff" }]
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              animation: { animateRotate: true, animateScale: true, duration: 1200, easing: "easeOutQuart" },
              cutout: "60%",
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => { const pct = total > 0 ? Math.round(ctx.parsed / total * 100) : 0; return " " + ctx.label + " : " + ctx.parsed + " (" + pct + "%)" } } }
              }
            }
          })
        }

        if (courbeRef.current) {
          charts.current.courbe = new Chart(courbeRef.current, {
            type: "line",
            data: {
              labels: data.courbe.labels,
              datasets: [{ label: "Risque moyen (%)", data: data.courbe.values, borderColor: "#2563eb", backgroundColor: isDark ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.06)", borderWidth: 2, pointRadius: 4, pointBackgroundColor: "#2563eb", pointBorderColor: isDark ? "#09090b" : "#ffffff", pointBorderWidth: 2, tension: 0.35, fill: true }]
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              animation: { duration: 1200, easing: "easeOutQuart" },
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false }, border: { color: gridColor } },
                y: { ticks: { color: textColor, font: { size: 10 }, callback: v => v + "%" }, grid: { color: gridColor }, border: { display: false }, min: 0 }
              }
            }
          })
        }
        observer.disconnect()
      }
    }, { threshold: 0.1 })

    if (histRef.current) observer.observe(histRef.current)
    return () => { observer.disconnect(); Object.values(charts.current).forEach(c => c?.destroy()) }
  }, [historique, isDark])

  if (historique.length === 0) return null

  const data = buildChartData(historique)
  const total = Object.values(data.camembert).reduce((a, b) => a + b, 0)
  const riskColors = { FAIBLE: "#059669", "MODÉRÉ": "#d97706", "ÉLEVÉ": "#ea580c", "TRÈS ÉLEVÉ": "#dc2626" }
  const riskLabelsDisplay = { FAIBLE: "Faible", "MODÉRÉ": "Modéré", "ÉLEVÉ": "Élevé", "TRÈS ÉLEVÉ": "Très élevé" }
  const cardClass = "rounded-2xl border p-4 lg:p-5 transition-colors " + (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")
  const labelClass = "font-semibold text-sm " + (isDark ? "text-white" : "text-gray-800")
  const subClass = "text-xs mt-0.5 mb-3 " + (isDark ? "text-zinc-500" : "text-gray-400")
  const legendColor = isDark ? "#71717a" : "#9ca3af"

  return (
    <div className="mb-6 lg:mb-8 space-y-4 lg:space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <div className={cardClass}>
          <p className={labelClass}>Décisions par mois</p>
          <p className={subClass}>Accordés vs refusés sur les 6 derniers mois</p>
          <div className="flex items-center gap-4 mb-3">
            {[["#059669", "Accordés"], ["#dc2626", "Refusés"]].map(item => (
              <span key={item[1]} className="flex items-center gap-1.5 text-xs" style={{ color: legendColor }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: item[0] }} />
                {item[1]}
              </span>
            ))}
          </div>
          <div style={{ position: "relative", height: "180px" }}>
            <canvas ref={histRef} role="img" aria-label="Histogramme des décisions par mois" />
          </div>
        </div>

        <div className={cardClass}>
          <p className={labelClass}>Répartition par niveau de risque</p>
          <p className={subClass}>Distribution des profils analysés</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
            {Object.entries(riskColors).map(([key, color]) => (
              <span key={key} className="flex items-center gap-1.5 text-xs" style={{ color: legendColor }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
                {riskLabelsDisplay[key]} {total > 0 ? Math.round(data.camembert[key] / total * 100) : 0}%
              </span>
            ))}
          </div>
          <div style={{ position: "relative", height: "180px" }}>
            <canvas ref={camRef} role="img" aria-label="Camembert des niveaux de risque" />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <p className={labelClass}>Évolution du risque moyen</p>
        <p className={subClass}>Probabilité de défaut moyenne par jour</p>
        <div className="flex items-center gap-4 mb-3">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: legendColor }}>
            <span className="w-5 h-0.5 inline-block rounded" style={{ background: "#2563eb" }} />
            Risque moyen (%)
          </span>
        </div>
        <div style={{ position: "relative", height: "160px" }}>
          <canvas ref={courbeRef} role="img" aria-label="Courbe du risque moyen par jour" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { isDark } = useTheme()
  const [apiStatus, setApiStatus] = useState(null)
  const [historique, setHistorique] = useState([])
  const [stats, setStats] = useState(null)
  const [modelInfo, setModelInfo] = useState({ model_name: "scoring", version: "1.0.0" })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const offsetRef = useRef(0)
  const observerRef = useRef(null)
  const sentinelRef = useRef(null)

  const fetchStats = async () => {
    try {
      const [health, st, info] = await Promise.all([checkHealth(), getStats(), getModelInfo()])
      setApiStatus(health)
      setStats(st)
      setModelInfo(info)
    } catch {
      setApiStatus({ status: "ERROR" })
    }
  }

  const fetchHistorique = async (reset = false) => {
    if (reset) {
      offsetRef.current = 0
      setHistorique([])
      setHasMore(true)
    }
    if (reset) setLoading(true)
    else setLoadingMore(true)

    try {
      const data = await getHistorique(20, offsetRef.current)
      const items = data.items || []
      setTotal(data.total || 0)
      setHasMore(data.has_more || false)
      setHistorique(prev => reset ? items : [...prev, ...items])
      offsetRef.current += items.length
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchStats(), fetchHistorique(true)])
  }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        fetchHistorique(false)
      }
    }, { threshold: 0.1 })
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasMore, loadingMore, loading])

  const isOK = apiStatus?.status === "OK"
  const modelLabel = `${modelInfo.model_name} v${modelInfo.version}`
  const pageClass = "min-h-screen transition-colors duration-300 " + (isDark ? "bg-zinc-950" : "bg-gray-50")
  const tableClass = "rounded-2xl border transition-colors overflow-hidden " + (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")
  const headClass = "text-xs uppercase tracking-wider " + (isDark ? "text-zinc-600" : "text-gray-400")
  const cellClass = "py-3 text-xs " + (isDark ? "text-zinc-300" : "text-gray-600")
  const borderB = isDark ? "border-zinc-800" : "border-gray-100"

  return (
    <div className={pageClass}>
      <Header title="Tableau de bord" subtitle="Vue d'ensemble du système de scoring crédit" />

      <main className="lg:ml-64 pt-14 lg:pt-24 px-4 lg:px-8 pb-8">

        <div className="flex items-center justify-between mb-4 lg:mb-6 mt-4 lg:mt-0">
          <div className={"flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border " +
            (isOK
              ? (isDark ? "border-zinc-800 text-emerald-400" : "border-gray-200 text-emerald-600")
              : (isDark ? "border-zinc-800 text-red-400" : "border-gray-200 text-red-600"))}>
            <span className={"w-1.5 h-1.5 rounded-full flex-shrink-0 " + (isOK ? "bg-emerald-500" : "bg-red-500")} />
            <span className="hidden sm:inline">
              {isOK ? `API connectée — ${modelLabel} opérationnel` : "API non disponible"}
            </span>
            <span className="sm:hidden">{isOK ? "API OK" : "Hors ligne"}</span>
          </div>
          <button
            onClick={fetchAll}
            className={"flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all " +
              (isDark ? "border-zinc-800 text-zinc-400 hover:bg-zinc-800" : "border-gray-200 text-gray-500 hover:bg-gray-50")}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-6 lg:mb-8">
          <MetricCard title="Dossiers analysés" value={loading ? null : stats?.total || 0} subtitle="Total historique" icon={Users} color="blue" />
          <MetricCard title="Taux d'accord" value={loading ? null : stats?.taux_accord || 0} suffix="%" subtitle="Crédits accordés" icon={CheckCircle} color="green" />
          <MetricCard title="Refusés" value={loading ? null : stats?.refuses || 0} subtitle="Risque trop élevé" icon={XCircle} color="red" />
          <MetricCard title="Risque moyen" value={loading ? null : stats?.proba_moyenne || 0} suffix="%" subtitle="Prob. de défaut" icon={AlertTriangle} color="orange" />
        </div>

        {!loading && <Graphiques historique={historique} isDark={isDark} />}

        <div className={tableClass}>
          <div className={"flex items-center justify-between p-4 lg:p-6 border-b " + borderB}>
            <div className="flex items-center gap-2 lg:gap-3">
              <BarChart2 size={16} className={isDark ? "text-zinc-500" : "text-gray-400"} />
              <h2 className={"font-semibold text-sm lg:text-base " + (isDark ? "text-white" : "text-gray-800")}>
                Historique des analyses
              </h2>
            </div>
            <span className={"text-xs px-2.5 py-1 rounded-full border " +
              (isDark ? "border-zinc-800 text-zinc-500" : "border-gray-200 text-gray-400")}>
              {historique.length} / {total}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 size={28} className={"animate-spin mx-auto mb-3 " + (isDark ? "text-zinc-600" : "text-gray-300")} />
              <p className={"text-sm " + (isDark ? "text-zinc-500" : "text-gray-400")}>Chargement...</p>
            </div>
          ) : historique.length === 0 ? (
            <div className="text-center py-12">
              <p className={"text-sm " + (isDark ? "text-zinc-500" : "text-gray-400")}>
                Aucune analyse effectuée pour le moment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className={"border-b " + borderB}>
                    <th className={"text-left py-3 px-4 lg:px-6 " + headClass}>Date</th>
                    <th className={"text-left py-3 " + headClass}>Client</th>
                    <th className={"text-right py-3 hidden sm:table-cell " + headClass}>Revenu</th>
                    <th className={"text-right py-3 hidden lg:table-cell " + headClass}>Crédit</th>
                    <th className={"text-center py-3 hidden lg:table-cell " + headClass}>Âge</th>
                    <th className={"text-center py-3 " + headClass}>Risque</th>
                    <th className={"text-right py-3 " + headClass}>Prob.</th>
                    <th className={"text-center py-3 pr-4 lg:pr-6 " + headClass}>Décision</th>
                  </tr>
                </thead>
                <tbody>
                  {historique.map((item) => {
                    const rowClass = "border-t transition-colors " +
                      (isDark ? "border-zinc-800/50 hover:bg-zinc-800/30" : "border-gray-50 hover:bg-gray-50/80")
                    const decisionClass = "text-xs px-2 py-0.5 rounded-full font-medium border " + (
                      item.decision === "ACCORDÉ"
                        ? (isDark ? "text-emerald-400 border-emerald-800" : "text-emerald-700 border-emerald-200")
                        : (isDark ? "text-red-400 border-red-800" : "text-red-700 border-red-200")
                    )
                    return (
                      <tr key={item.id} className={rowClass}>
                        <td className={cellClass + " px-4 lg:px-6 whitespace-nowrap"}>{item.date}</td>
                        <td className="py-3">
                          {item.client_nom
                            ? <span className={"text-xs font-medium " + (isDark ? "text-zinc-300" : "text-gray-700")}>{item.client_nom}</span>
                            : <span className={"text-xs " + (isDark ? "text-zinc-700" : "text-gray-300")}>—</span>
                          }
                        </td>
                        <td className={cellClass + " text-right hidden sm:table-cell whitespace-nowrap"}>
                          {item.revenu?.toLocaleString()} FCFA
                        </td>
                        <td className={cellClass + " text-right hidden lg:table-cell whitespace-nowrap"}>
                          {item.credit?.toLocaleString()} FCFA
                        </td>
                        <td className={cellClass + " text-center hidden lg:table-cell"}>{item.age} ans</td>
                        <td className="py-3 text-center">
                          <RiskBadge niveau={item.niveau_risque} isDark={isDark} />
                        </td>
                        <td className={"py-3 text-right text-xs font-medium " +
                          (item.probabilite_defaut > 50 ? "text-red-500" : "text-emerald-500")}>
                          {item.probabilite_defaut}%
                        </td>
                        <td className="py-3 text-center pr-4 lg:pr-6">
                          <span className={decisionClass}>{item.decision}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div ref={sentinelRef} className="py-4 text-center">
                {loadingMore && (
                  <Loader2 size={18} className={"animate-spin mx-auto " + (isDark ? "text-zinc-600" : "text-gray-300")} />
                )}
                {!hasMore && historique.length > 0 && (
                  <p className={"text-xs " + (isDark ? "text-zinc-700" : "text-gray-300")}>
                    — Toutes les analyses sont affichées —
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}