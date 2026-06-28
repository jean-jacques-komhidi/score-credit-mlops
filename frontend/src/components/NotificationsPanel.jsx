import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { X, Bell, TrendingUp, AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react"
import { getStats, getDriftStats, getActionsLog } from "../services/api"

export default function NotificationsPanel({ onClose }) {
  const { isDark } = useTheme()
  const [alertes, setAlertes] = useState([])
  const [historique, setHistorique] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, drift, actions] = await Promise.all([
          getStats(),
          getDriftStats(),
          getActionsLog()
        ])

        const notifs = []

        // Stats prédictions
        if (stats.total > 0) {
          notifs.push({
            id: "stats",
            icon: CheckCircle,
            titre: "Résumé des analyses",
            message: `${stats.total} dossier(s) — Taux d'accord : ${stats.taux_accord}%`,
            temps: "Aujourd'hui",
            couleur: "text-green-500"
          })
        }

        // Drift
        drift.drift_features.forEach((f, i) => {
          notifs.push({
            id: `drift-${i}`,
            icon: f.statut === "NORMAL" ? CheckCircle : AlertTriangle,
            titre: `Drift ${f.statut} — ${f.feature}`,
            message: `Écart : ${f.ecart_pct}% entre référence et production`,
            temps: "Récent",
            couleur: f.statut === "NORMAL" ? "text-green-500" :
                     f.statut === "ALERTE" ? "text-yellow-500" : "text-red-500"
          })
        })

        // Modèle
        notifs.push({
          id: "model",
          icon: TrendingUp,
          titre: "Modèle XGBoost actif",
          message: "AUC-ROC : 0.7294 — Score métier : 35 289",
          temps: "Permanent",
          couleur: "text-blue-500"
        })

        setAlertes(notifs)

        // Historique depuis PostgreSQL
        const hist = actions.map(a => ({
          id: a.id,
          icon: a.type === "prediction" ? Activity : Clock,
          titre: a.titre,
          message: a.message,
          temps: a.date,
          couleur: a.statut === "success" ? "text-green-500" :
                   a.statut === "warning" ? "text-orange-500" :
                   a.statut === "error" ? "text-red-500" : "text-blue-500"
        }))
        setHistorique(hist)

      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1" onClick={onClose} />

      <div className={`w-96 h-full shadow-2xl flex flex-col transition-colors
        ${isDark ? "bg-slate-800 text-white" : "bg-white text-gray-800"}`}>

        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between
          ${isDark ? "border-slate-700" : "border-gray-100"}`}>
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-blue-600" />
            <h2 className="font-bold text-lg">Notifications</h2>
            {alertes.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {alertes.length}
              </span>
            )}
          </div>
          <button onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center
              ${isDark ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Alertes système */}
          <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider
            ${isDark ? "text-slate-400" : "text-gray-400"}`}>
            Alertes système
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center">
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                Chargement...
              </p>
            </div>
          ) : alertes.map((notif) => (
            <div key={notif.id} className={`px-4 py-3 border-b flex items-start gap-3 transition-colors
              ${isDark ? "border-slate-700 hover:bg-slate-700/50" : "border-gray-50 hover:bg-gray-50"}`}>
              <notif.icon size={18} className={`mt-0.5 flex-shrink-0 ${notif.couleur}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-800"}`}>
                  {notif.titre}
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                  {notif.message}
                </p>
                <p className="text-xs text-blue-500 mt-1">{notif.temps}</p>
              </div>
            </div>
          ))}

          {/* Historique actions depuis PostgreSQL */}
          <div className={`px-4 py-2 mt-2 text-xs font-semibold uppercase tracking-wider
            ${isDark ? "text-slate-400" : "text-gray-400"}`}>
            Historique des actions ({historique.length})
          </div>

          {historique.length === 0 ? (
            <div className="px-6 py-4 text-center">
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                Aucune action enregistrée — Faites une analyse pour commencer !
              </p>
            </div>
          ) : historique.map((notif) => (
            <div key={notif.id} className={`px-4 py-3 border-b flex items-start gap-3 transition-colors
              ${isDark ? "border-slate-700 hover:bg-slate-700/50" : "border-gray-50 hover:bg-gray-50"}`}>
              <notif.icon size={18} className={`mt-0.5 flex-shrink-0 ${notif.couleur}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-800"}`}>
                  {notif.titre}
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                  {notif.message}
                </p>
                <p className="text-xs text-blue-500 mt-1">{notif.temps}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isDark ? "border-slate-700" : "border-gray-100"}`}>
          <p className={`text-xs text-center ${isDark ? "text-slate-400" : "text-gray-400"}`}>
            {alertes.length + historique.length} notifications au total
          </p>
        </div>
      </div>
    </div>
  )
}