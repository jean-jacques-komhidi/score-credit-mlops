import { useState, useEffect, useRef } from "react"
import { useTheme } from "../context/ThemeContext"
import Header from "../components/Header"
import MetricCard from "../components/MetricCard"
import { checkHealth, getHistorique, getStats } from "../services/api"
import {
  Users, AlertTriangle, CheckCircle, XCircle, Activity, BarChart2, RefreshCw
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
  const risqueParMois = {}

  historique.forEach(item => {
    const date = new Date(item.date)
    const key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0")
    const label = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })

    if (!moisMap[key]) moisMap[key] = { label, accordes: 0, refuses: 0 }
    if (item.decision === "ACCORDÉ") moisMap[key].accordes++
    else moisMap[key].refuses++

    if (riskCount[item.niveau_risque] !== undefined) riskCount[item.niveau_risque]++

    if (!risqueParMois[key]) risqueParMois[key] = { label, total: 0, count: 0 }
    risqueParMois[key].total += item.probabilite_defaut
    risqueParMois[key].count++
  })

  const sortedMois = Object.keys(moisMap).sort().slice(-6)
  const sortedRisque = Object.keys(risqueParMois).sort().slice(-6)

  return {
    histogramme: {
      labels: sortedMois.map(k => moisMap[k].label),
      accordes: sortedMois.map(k => moisMap[k].accordes),
      refuses: sortedMois.map(k => moisMap[k].refuses),
    },
    camembert: riskCount,
    courbe: {
      labels: sortedRisque.map(k => risqueParMois[k].label),
      values: sortedRisque.map(k =>
        Math.round((risqueParMois[k].total / risqueParMois[k].count) * 10) / 10
      ),
    }
  }
}

function Graphiques({ historique, isDark }) {
  const histRef = useRef(null)
  const camRef = useRef(null)
  const courbeRef = useRef(null)
  const charts = useRef({})

  const gridColor = isDark ? "#27272a" : "#e5e7eb"
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
                {
                  label: "Accordés",
                  data: data.histogramme.accordes,
                  backgroundColor: isDark ? "rgba(16,185,129,0.7)" : "rgba(16,185,129,0.8)",
                  borderRadius: 4,
                  borderSkipped: false,
                },
                {
                  label: "Refusés",
                  data: data.histogramme.refuses,
                  backgroundColor: isDark ? "rgba(239,68,68,0.7)" : "rgba(239,68,68,0.8)",
                  borderRadius: 4,
                  borderSkipped: false,
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: { duration: 1000, easing: "easeOutQuart" },
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  ticks: { color: textColor, font: { size: 11 } },
                  grid: { display: false },
                  border: { color: gridColor }
                },
                y: {
                  ticks: { color: textColor, font: { size: 11 } },
                  grid: { color: gridColor },
                  border: { display: false }
                }
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
              datasets: [{
                data: [riskData["FAIBLE"], riskData["MODÉRÉ"], riskData["ÉLEVÉ"], riskData["TRÈS ÉLEVÉ"]],
                backgroundColor: ["#10b981", "#f59e0b", "#f97316", "#ef4444"],
                borderWidth: 2,
                borderColor: isDark ? "#09090b" : "#ffffff",
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: { animateRotate: true, animateScale: true, duration: 1200, easing: "easeOutQuart" },
              cutout: "60%",
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const pct = total > 0 ? Math.round(ctx.parsed / total * 100) : 0
                      return " " + ctx.label + " : " + ctx.parsed + " (" + pct + "%)"
                    }
                  }
                }
              }
            }
          })
        }

        if (courbeRef.current) {
          charts.current.courbe = new Chart(courbeRef.current, {
            type: "line",
            data: {
              labels: data.courbe.labels,
              datasets: [{
                label: "Risque moyen (%)",
                data: data.courbe.values,
                borderColor: "#3b82f6",
                backgroundColor: isDark ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.08)",
                borderWidth: 2,
                pointRadius: 5,
                pointBackgroundColor: "#3b82f6",
                pointBorderColor: isDark ? "#09090b" : "#ffffff",
                pointBorderWidth: 2,
                tension: 0.35,
                fill: true,
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: { duration: 1200, easing: "easeOutQuart" },
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  ticks: { color: textColor, font: { size: 11 } },
                  grid: { display: false },
                  border: { color: gridColor }
                },
                y: {
                  ticks: {
                    color: textColor,
                    font: { size: 11 },
                    callback: function(v) { return v + "%" }
                  },
                  grid: { color: gridColor },
                  border: { display: false },
                  min: 0,
                }
              }
            }
          })
        }

        observer.disconnect()
      }
    }, { threshold: 0.1 })

    if (histRef.current) {
      observer.observe(histRef.current)
    }

    return () => {
      observer.disconnect()
      Object.values(charts.current).forEach(c => c?.destroy())
    }
  }, [historique, isDark])

  if (historique.length === 0) return null

  const data = buildChartData(historique)
  const total = Object.values(data.camembert).reduce((a, b) => a + b, 0)
  const riskColors = { FAIBLE: "#10b981", "MODÉRÉ": "#f59e0b", "ÉLEVÉ": "#f97316", "TRÈS ÉLEVÉ": "#ef4444" }
  const riskLabelsDisplay = { FAIBLE: "Faible", "MODÉRÉ": "Modéré", "ÉLEVÉ": "Élevé", "TRÈS ÉLEVÉ": "Très élevé" }

  const cardClass = "rounded-2xl border p-5 transition-colors " + (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")
  const labelClass = "font-bold text-sm " + (isDark ? "text-white" : "text-gray-800")
  const subClass = "text-xs mt-0.5 mb-4 " + (isDark ? "text-zinc-500" : "text-gray-400")
  const legendColor = isDark ? "#d4d4d8" : "#4b5563"

  return (
    <div className="mb-8 space-y-5">
      <div className="grid grid-cols-2 gap-5">

        <div className={cardClass}>
          <p className={labelClass}>Décisions par mois</p>
          <p className={subClass}>Accordés vs refusés sur les 6 derniers mois</p>
          <div className="flex items-center gap-4 mb-3">
            {[["#10b981", "Accordés"], ["#ef4444", "Refusés"]].map(function(item) {
              return (
                <span key={item[1]} className="flex items-center gap-1.5 text-xs" style={{ color: legendColor }}>
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: item[0] }} />
                  {item[1]}
                </span>
              )
            })}
          </div>
          <div style={{ position: "relative", height: "200px" }}>
            <canvas ref={histRef} role="img" aria-label="Histogramme des décisions de crédit par mois" />
          </div>
        </div>

        <div className={cardClass}>
          <p className={labelClass}>Répartition par niveau de risque</p>
          <p className={subClass}>Distribution des profils analysés</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
            {Object.entries(riskColors).map(function(entry) {
              const key = entry[0]
              const color = entry[1]
              return (
                <span key={key} className="flex items-center gap-1.5 text-xs" style={{ color: legendColor }}>
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
                  {riskLabelsDisplay[key]} {total > 0 ? Math.round(data.camembert[key] / total * 100) : 0}%
                </span>
              )
            })}
          </div>
          <div style={{ position: "relative", height: "200px" }}>
            <canvas ref={camRef} role="img" aria-label="Camembert de répartition des niveaux de risque" />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <p className={labelClass}>Évolution du risque moyen</p>
        <p className={subClass}>Probabilité de défaut moyenne sur les 6 derniers mois</p>
        <div className="flex items-center gap-4 mb-3">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: legendColor }}>
            <span className="w-6 h-0.5 inline-block rounded" style={{ background: "#3b82f6" }} />
            Risque moyen (%)
          </span>
        </div>
        <div style={{ position: "relative", height: "180px" }}>
          <canvas ref={courbeRef} role="img" aria-label="Courbe d'évolution de la probabilité de défaut moyenne" />
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

  useEffect(() => { fetchData() }, [])

  const isOK = apiStatus?.status === "OK"
  const pageClass = "min-h-screen transition-colors duration-300 " + (isDark ? "bg-black" : "bg-gray-50")
  const statusClass = "flex items-center gap-2 px-4 py-3 rounded-xl w-fit text-sm font-medium " + (isOK
    ? (isDark ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-green-50 text-green-700 border border-green-200")
    : (isDark ? "bg-red-500/10 text-red-400 border border-red-500/30" : "bg-red-50 text-red-700 border border-red-200"))
  const refreshClass = "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all " + (isDark ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-800" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200")
  const tableClass = "rounded-2xl shadow-sm border p-6 transition-colors duration-300 " + (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100")
  const headClass = "text-xs uppercase tracking-wider " + (isDark ? "text-zinc-500" : "text-gray-400")
  const titleClass = "font-bold text-lg " + (isDark ? "text-white" : "text-gray-800")
  const countClass = "text-xs px-3 py-1 rounded-full " + (isDark ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-500")

  return (
    <div className={pageClass}>
      <Header title="Tableau de bord" subtitle="Vue d'ensemble du système de scoring crédit" />

      <main className="ml-64 pt-24 px-8 pb-8">

        <div className="flex items-center justify-between mb-6">
          <div className={statusClass}>
            <Activity size={16} />
            {isOK ? "API connectée — XGBoost opérationnel" : "API non disponible"}
          </div>
          <button onClick={fetchData} className={refreshClass}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        <div className="grid grid-cols-4 gap-5 mb-8">
          <MetricCard
            title="Dossiers analysés"
            value={loading ? null : stats?.total || 0}
            subtitle="Total historique"
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Taux d'accord"
            value={loading ? null : stats?.taux_accord || 0}
            suffix="%"
            subtitle="Crédits accordés"
            icon={CheckCircle}
            color="green"
          />
          <MetricCard
            title="Dossiers refusés"
            value={loading ? null : stats?.refuses || 0}
            subtitle="Risque trop élevé"
            icon={XCircle}
            color="red"
          />
          <MetricCard
            title="Risque moyen"
            value={loading ? null : stats?.proba_moyenne || 0}
            suffix="%"
            subtitle="Probabilité de défaut"
            icon={AlertTriangle}
            color="orange"
          />
        </div>

        {!loading && <Graphiques historique={historique} isDark={isDark} />}

        <div className={tableClass}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart2 size={20} className="text-blue-600" />
              <h2 className={titleClass}>Historique des analyses</h2>
            </div>
            <span className={countClass}>{historique.length} entrées</span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
              <p className={"text-sm " + (isDark ? "text-zinc-400" : "text-gray-400")}>Chargement des données...</p>
            </div>
          ) : historique.length === 0 ? (
            <div className="text-center py-12">
              <p className={"text-sm " + (isDark ? "text-zinc-400" : "text-gray-400")}>
                Aucune analyse effectuée pour le moment. Allez dans la page Analyse pour commencer !
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className={headClass}>
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
                  const rowClass = "text-sm border-t transition-colors " + (isDark ? "border-zinc-800 hover:bg-zinc-800/50" : "border-gray-100 hover:bg-gray-50")
                  const cellClass = "py-3 " + (isDark ? "text-zinc-300" : "text-gray-600")
                  const probaClass = "py-3 text-right font-medium " + (item.probabilite_defaut > 50 ? "text-red-500" : "text-green-500")
                  const riskClass = "px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap " + (
                    item.niveau_risque === "FAIBLE" ? (isDark ? "bg-green-500/15 text-green-400" : "bg-green-100 text-green-700") :
                    item.niveau_risque === "MODÉRÉ" ? (isDark ? "bg-yellow-500/15 text-yellow-400" : "bg-yellow-100 text-yellow-700") :
                    item.niveau_risque === "ÉLEVÉ" ? (isDark ? "bg-orange-500/15 text-orange-400" : "bg-orange-100 text-orange-700") :
                    (isDark ? "bg-red-500/15 text-red-400" : "bg-red-100 text-red-700")
                  )
                  const decisionClass = "px-3 py-1 rounded-full text-xs font-bold " + (
                    item.decision === "ACCORDÉ"
                      ? (isDark ? "bg-green-500/15 text-green-400" : "bg-green-100 text-green-700")
                      : (isDark ? "bg-red-500/15 text-red-400" : "bg-red-100 text-red-700")
                  )

                  return (
                    <tr key={item.id} className={rowClass}>
                      <td className={cellClass}>{item.date}</td>
                      <td className={cellClass + " text-right"}>{item.revenu?.toLocaleString()} FCFA</td>
                      <td className={cellClass + " text-right"}>{item.credit?.toLocaleString()} FCFA</td>
                      <td className={cellClass + " text-center"}>{item.age} ans</td>
                      <td className="py-3 text-center">
                        <span className={riskClass}>{riskLabel}</span>
                      </td>
                      <td className={probaClass}>{item.probabilite_defaut}%</td>
                      <td className="py-3 text-center">
                        <span className={decisionClass}>{item.decision}</span>
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