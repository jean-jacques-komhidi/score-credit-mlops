import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { useNotifications } from "../context/NotificationsContext"
import Header from "../components/Header"
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Activity, RefreshCw } from "lucide-react"
import { getStats, getDriftStats, getActionsLog } from "../services/api"

export default function Notifications() {
  const { isDark } = useTheme()
  const { markAsRead } = useNotifications()
  const [alertes, setAlertes] = useState([])
  const [historique, setHistorique] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [stats, drift, actions] = await Promise.all([
        getStats(),
        getDriftStats(),
        getActionsLog()
      ])

      const notifs = []

      if (stats.total > 0) {
        notifs.push({
          id: "stats",
          icon: CheckCircle,
          titre: "Résumé des analyses",
          message: `${stats.total} dossier(s) — Taux d'accord : ${stats.taux_accord}%`,
          temps: "Aujourd'hui",
          couleur: "text-green-500",
          bg: "bg-green-50"
        })
      }

      drift.drift_features.forEach((f, i) => {
        notifs.push({
          id: `drift-${i}`,
          icon: f.statut === "NORMAL" ? CheckCircle : AlertTriangle,
          titre: `Drift ${f.statut} — ${f.feature}`,
          message: `Écart : ${f.ecart_pct}% entre référence et production`,
          temps: "Récent",
          couleur: f.statut === "NORMAL" ? "text-green-500" :
                   f.statut === "ALERTE" ? "text-yellow-500" : "text-red-500",
          bg: f.statut === "NORMAL" ? "bg-green-50" :
              f.statut === "ALERTE" ? "bg-yellow-50" : "bg-red-50"
        })
      })

      notifs.push({
        id: "model",
        icon: TrendingUp,
        titre: "Modèle XGBoost actif",
        message: "AUC-ROC : 0.7294 — Score métier : 35 289",
        temps: "Permanent",
        couleur: "text-blue-500",
        bg: "bg-blue-50"
      })

      setAlertes(notifs)

      const hist = actions.map(a => ({
        id: a.id,
        icon: a.type === "prediction" ? Activity : Clock,
        titre: a.titre,
        message: a.message,
        temps: a.date,
        couleur: a.statut === "success" ? "text-green-500" :
                 a.statut === "warning" ? "text-orange-500" :
                 a.statut === "error" ? "text-red-500" : "text-blue-500",
        bg: a.statut === "success" ? "bg-green-50" :
            a.statut === "warning" ? "bg-orange-50" :
            a.statut === "error" ? "bg-red-50" : "bg-blue-50"
      }))
      setHistorique(hist)

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    markAsRead()
  }, [])

  const NotifCard = ({ notif }) => (
    <div className={`rounded-2xl p-4 border flex items-start gap-3 transition-colors
      ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm"}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-zinc-800" : notif.bg}`}>
        <notif.icon size={17} className={notif.couleur} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
          {notif.titre}
        </p>
        <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
          {notif.message}
        </p>
        <p className="text-xs text-blue-500 mt-1.5 font-medium">{notif.temps}</p>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-black" : "bg-gray-50"}`}>
      <Header title="Notifications" subtitle="Alertes système et historique des actions" />

      <main className="ml-64 pt-24 px-8 pb-8 max-w-4xl">

        <div className="flex items-center justify-between mb-6">
          <p className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
            {alertes.length + historique.length} notifications au total
          </p>
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

        {/* Alertes système */}
        <div className="mb-8">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3
            ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
            Alertes système
          </p>
          {loading ? (
            <p className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-400"}`}>Chargement...</p>
          ) : (
            <div className="space-y-3">
              {alertes.map(notif => <NotifCard key={notif.id} notif={notif} />)}
            </div>
          )}
        </div>

        {/* Historique */}
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3
            ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
            Historique des actions ({historique.length})
          </p>
          {historique.length === 0 ? (
            <div className={`rounded-2xl border-2 border-dashed p-8 text-center
              ${isDark ? "border-zinc-800 text-zinc-500" : "border-gray-200 text-gray-400"}`}>
              <p className="text-sm">Aucune action enregistrée — Faites une analyse pour commencer !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historique.map(notif => <NotifCard key={notif.id} notif={notif} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}