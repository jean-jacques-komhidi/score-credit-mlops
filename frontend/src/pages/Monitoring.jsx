import { useState, useEffect, useRef } from "react"
import { useTheme } from "../context/ThemeContext"
import Header from "../components/Header"
import { getMlflowRuns, getDriftStats, lancerRetrain, getRetrainStatus } from "../services/api"
import {
  Activity, RefreshCw, Loader2,
  CheckCircle, AlertTriangle, XCircle, Database, Award,
  Zap, TrendingUp, TrendingDown, BarChart2
} from "lucide-react"

export default function Monitoring() {
  const { isDark } = useTheme()
  const [mlflowRuns, setMlflowRuns] = useState([])
  const [driftStats, setDriftStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retrainStatus, setRetrainStatus] = useState(null)
  const [launching, setLaunching] = useState(false)
  const [retrainError, setRetrainError] = useState(null)
  const pollRef = useRef(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [runs, drift, status] = await Promise.all([
        getMlflowRuns(),
        getDriftStats(),
        getRetrainStatus()
      ])
      setMlflowRuns(runs)
      setDriftStats(drift)
      setRetrainStatus(status)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const startPolling = () => {
    pollRef.current = setInterval(async () => {
      try {
        const status = await getRetrainStatus()
        setRetrainStatus(status)
        if (!status.running) {
          clearInterval(pollRef.current)
          const [runs, drift] = await Promise.all([getMlflowRuns(), getDriftStats()])
          setMlflowRuns(runs)
          setDriftStats(drift)
        }
      } catch (e) {
        console.error(e)
      }
    }, 2000)
  }

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const handleRetrain = async () => {
    setLaunching(true)
    setRetrainError(null)
    try {
      await lancerRetrain()
      startPolling()
    } catch (e) {
      setRetrainError(e.message)
    } finally {
      setLaunching(false)
    }
  }

  const pageClass = "min-h-screen transition-colors duration-300 " + (isDark ? "bg-zinc-950" : "bg-gray-50")
  const cardClass = "rounded-xl border transition-colors " + (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")
  const borderB = isDark ? "border-zinc-800" : "border-gray-100"
  const headClass = "text-xs font-medium uppercase tracking-wider " + (isDark ? "text-zinc-600" : "text-gray-400")

  const bestRun = mlflowRuns[0]
  const isRunning = retrainStatus?.running
  const lastResult = retrainStatus?.last_result
  const currentVersion = retrainStatus?.current_version || "1.0.0"

  const statutConfig = {
    "NORMAL":   { icon: CheckCircle,   color: isDark ? "text-emerald-400 border-emerald-900" : "text-emerald-600 border-emerald-200" },
    "ALERTE":   { icon: AlertTriangle, color: isDark ? "text-amber-400 border-amber-900"     : "text-amber-600 border-amber-200" },
    "CRITIQUE": { icon: XCircle,       color: isDark ? "text-red-400 border-red-900"         : "text-red-600 border-red-200" },
  }

  const hasCritical = driftStats?.drift_features?.some(f => f.statut === "CRITIQUE")
  const hasAlert    = driftStats?.drift_features?.some(f => f.statut === "ALERTE")

  return (
    <div className={pageClass}>
      <Header title="Monitoring" subtitle="Suivi MLFlow et détection de data drift" />

      <main className="lg:ml-64 pt-14 lg:pt-24 px-4 lg:px-8 pb-8">

        {/* Header */}
        <div className="flex items-center justify-between mt-4 lg:mt-0 mb-5">
          <div className="flex items-center gap-2">
            <Activity size={15} className={isDark ? "text-zinc-500" : "text-gray-400"} />
            <span className={"font-semibold text-sm " + (isDark ? "text-white" : "text-gray-800")}>
              Tableau de monitoring
            </span>
            <span className={"text-xs px-2 py-0.5 rounded-full border font-medium " +
              (isDark ? "border-zinc-700 text-zinc-500" : "border-gray-200 text-gray-400")}>
              v{currentVersion}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchAll}
              className={"flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all " +
                (isDark ? "border-zinc-800 text-zinc-400 hover:bg-zinc-800" : "border-gray-200 text-gray-500 hover:bg-gray-50")}>
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            <button
              onClick={handleRetrain}
              disabled={isRunning || launching}
              className={"flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-xs font-semibold transition-all " +
                (isRunning || launching
                  ? (isDark ? "border border-zinc-800 text-zinc-600 cursor-not-allowed" : "border border-gray-200 text-gray-400 cursor-not-allowed")
                  : hasCritical
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white")}>
              {isRunning || launching
                ? <Loader2 size={13} className="animate-spin" />
                : <Zap size={13} />}
              <span className="hidden sm:inline">
                {isRunning ? "Réentraînement en cours..." : launching ? "Lancement..." : "Réentraîner le modèle"}
              </span>
              <span className="sm:hidden">
                {isRunning ? "En cours..." : "Réentraîner"}
              </span>
            </button>
          </div>
        </div>

        {/* Erreur lancement */}
        {retrainError && (
          <div className={"mb-4 rounded-xl border px-4 py-3 text-xs " +
            (isDark ? "bg-red-500/10 border-red-900 text-red-400" : "bg-red-50 border-red-200 text-red-700")}>
            ❌ {retrainError}
          </div>
        )}

        {/* Barre de progression */}
        {(isRunning || (retrainStatus?.progress > 0 && retrainStatus?.progress < 100)) && (
          <div className={"mb-5 rounded-xl border p-4 " +
            (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 size={13} className={"animate-spin " + (isDark ? "text-blue-400" : "text-blue-600")} />
                <span className={"text-xs font-medium " + (isDark ? "text-white" : "text-gray-800")}>
                  Réentraînement multi-modèles en cours
                </span>
              </div>
              <span className={"text-xs font-semibold tabular-nums " + (isDark ? "text-blue-400" : "text-blue-600")}>
                {retrainStatus?.progress || 0}%
              </span>
            </div>
            <div className={"w-full h-1.5 rounded-full mb-2 " + (isDark ? "bg-zinc-800" : "bg-gray-100")}>
              <div
                className="h-1.5 rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: (retrainStatus?.progress || 0) + "%" }}
              />
            </div>
            <p className={"text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")}>
              {retrainStatus?.message}
            </p>
          </div>
        )}

        {/* Résultat dernier réentraînement */}
        {retrainStatus?.progress === 100 && lastResult && (
          <div className={"mb-5 rounded-xl border p-4 " +
            (lastResult.improved
              ? (isDark ? "bg-emerald-500/5 border-emerald-900" : "bg-emerald-50 border-emerald-200")
              : (isDark ? "bg-amber-500/5 border-amber-900" : "bg-amber-50 border-amber-200"))}>

            <div className="flex items-center gap-2 mb-3">
              {lastResult.improved
                ? <CheckCircle size={14} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
                : <AlertTriangle size={14} className={isDark ? "text-amber-400" : "text-amber-600"} />}
              <span className={"text-xs font-semibold " +
                (lastResult.improved
                  ? (isDark ? "text-emerald-400" : "text-emerald-700")
                  : (isDark ? "text-amber-400" : "text-amber-700"))}>
                {lastResult.improved
                  ? `${lastResult.best_model} v${lastResult.new_version} déployé avec succès !`
                  : `Ancien modèle conservé — pas d'amélioration`}
              </span>
            </div>

            {/* Métriques AUC + Score métier */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className={"rounded-lg p-2.5 " + (isDark ? "bg-zinc-800/50" : "bg-white/70")}>
                <p className={"text-xs mb-0.5 " + (isDark ? "text-zinc-500" : "text-gray-400")}>AUC-ROC avant</p>
                <p className={"text-sm font-bold tabular-nums " + (isDark ? "text-zinc-300" : "text-gray-600")}>
                  {lastResult.old_auc}
                </p>
              </div>
              <div className={"rounded-lg p-2.5 " + (isDark ? "bg-zinc-800/50" : "bg-white/70")}>
                <p className={"text-xs mb-0.5 " + (isDark ? "text-zinc-500" : "text-gray-400")}>AUC-ROC après</p>
                <p className={"text-sm font-bold tabular-nums flex items-center gap-1 " +
                  (lastResult.improved
                    ? (isDark ? "text-emerald-400" : "text-emerald-600")
                    : (isDark ? "text-amber-400" : "text-amber-600"))}>
                  {lastResult.new_auc}
                  {lastResult.improved
                    ? <TrendingUp size={11} />
                    : <TrendingDown size={11} />}
                </p>
              </div>
              <div className={"rounded-lg p-2.5 " + (isDark ? "bg-zinc-800/50" : "bg-white/70")}>
                <p className={"text-xs mb-0.5 " + (isDark ? "text-zinc-500" : "text-gray-400")}>Score métier avant</p>
                <p className={"text-sm font-bold tabular-nums " + (isDark ? "text-zinc-300" : "text-gray-600")}>
                  {lastResult.old_score_metier?.toLocaleString() || "—"}
                </p>
              </div>
              <div className={"rounded-lg p-2.5 " + (isDark ? "bg-zinc-800/50" : "bg-white/70")}>
                <p className={"text-xs mb-0.5 " + (isDark ? "text-zinc-500" : "text-gray-400")}>Score métier après</p>
                <p className={"text-sm font-bold tabular-nums " +
                  (lastResult.improved
                    ? (isDark ? "text-emerald-400" : "text-emerald-600")
                    : (isDark ? "text-amber-400" : "text-amber-600"))}>
                  {lastResult.new_score_metier?.toLocaleString() || "—"}
                </p>
              </div>
            </div>

            {/* Comparaison 4 modèles */}
            {lastResult.resultats && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart2 size={12} className={isDark ? "text-zinc-500" : "text-gray-400"} />
                  <p className={"text-xs font-medium " + (isDark ? "text-zinc-500" : "text-gray-400")}>
                    Comparaison des modèles entraînés
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(lastResult.resultats)
                    .sort((a, b) => b[1].auc - a[1].auc)
                    .map(([nom, res]) => {
                      const isBest = nom === lastResult.best_model
                      return (
                        <div key={nom}
                          className={"rounded-lg p-2.5 border " +
                            (isBest
                              ? (isDark ? "border-emerald-900 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50")
                              : (isDark ? "border-zinc-700 bg-zinc-800/30" : "border-gray-200 bg-white/50"))}>
                          <div className="flex items-center gap-1 mb-1">
                            {isBest && <span className="text-xs">🏆</span>}
                            <p className={"text-xs font-medium truncate " +
                              (isBest
                                ? (isDark ? "text-emerald-400" : "text-emerald-700")
                                : (isDark ? "text-zinc-300" : "text-gray-600"))}>
                              {nom}
                            </p>
                          </div>
                          <p className={"text-xs font-semibold tabular-nums " +
                            (isBest
                              ? (isDark ? "text-emerald-400" : "text-emerald-600")
                              : (isDark ? "text-zinc-400" : "text-gray-500"))}>
                            {res.auc}
                          </p>
                          <p className={"text-xs tabular-nums " + (isDark ? "text-zinc-600" : "text-gray-400")}>
                            Score : {res.score_metier?.toLocaleString() || "—"}
                          </p>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            <p className={"text-xs mt-3 " + (isDark ? "text-zinc-600" : "text-gray-400")}>
              {lastResult.n_prod_samples} échantillons production · {lastResult.timestamp}
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <Loader2 size={26} className={"animate-spin mx-auto mb-3 " + (isDark ? "text-zinc-600" : "text-gray-300")} />
            <p className={"text-sm " + (isDark ? "text-zinc-500" : "text-gray-400")}>Chargement...</p>
          </div>
        ) : (
          <>
            {/* Bandeau statut drift */}
            {driftStats && (
              <div className={"flex items-center gap-3 px-4 py-3 rounded-xl border mb-5 " +
                (hasCritical
                  ? (isDark ? "border-red-900 bg-red-500/5" : "border-red-200 bg-red-50/50")
                  : hasAlert
                    ? (isDark ? "border-amber-900 bg-amber-500/5" : "border-amber-200 bg-amber-50/50")
                    : (isDark ? "border-emerald-900 bg-emerald-500/5" : "border-emerald-200 bg-emerald-50/50"))}>
                <span className={"w-2 h-2 rounded-full flex-shrink-0 " +
                  (hasCritical ? "bg-red-500" : hasAlert ? "bg-amber-500" : "bg-emerald-500")} />
                <span className={"text-xs font-medium " +
                  (hasCritical
                    ? (isDark ? "text-red-400" : "text-red-700")
                    : hasAlert
                      ? (isDark ? "text-amber-400" : "text-amber-700")
                      : (isDark ? "text-emerald-400" : "text-emerald-700"))}>
                  Data Drift — {hasCritical
                    ? "Drift critique — Réentraînement recommandé !"
                    : hasAlert
                      ? "Dérive modérée détectée sur certaines features"
                      : "Aucune dérive détectée — Distribution normale"}
                </span>
                <span className={"text-xs ml-auto " + (isDark ? "text-zinc-500" : "text-gray-400")}>
                  {driftStats.total_predictions} prédictions analysées
                </span>
              </div>
            )}

            {/* 4 KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-5">
              <div className={cardClass + " p-4"}>
                <p className={"text-xs mb-1 " + (isDark ? "text-zinc-500" : "text-gray-400")}>Meilleur AUC-ROC</p>
                <p className={"text-xl font-bold tabular-nums " + (isDark ? "text-white" : "text-gray-800")}>
                  {bestRun?.auc_roc || "—"}
                </p>
                <p className={"text-xs mt-0.5 " + (isDark ? "text-zinc-600" : "text-gray-400")}>
                  {bestRun?.modele || "—"}
                </p>
              </div>
              <div className={cardClass + " p-4"}>
                <p className={"text-xs mb-1 " + (isDark ? "text-zinc-500" : "text-gray-400")}>Score métier</p>
                <p className={"text-xl font-bold tabular-nums " + (isDark ? "text-white" : "text-gray-800")}>
                  {lastResult?.new_score_metier?.toLocaleString() || bestRun?.score_metier || "—"}
                </p>
                <p className={"text-xs mt-0.5 " + (isDark ? "text-zinc-600" : "text-gray-400")}>
                  {lastResult?.best_model || "Meilleur run"}
                </p>
              </div>
              <div className={cardClass + " p-4"}>
                <p className={"text-xs mb-1 " + (isDark ? "text-zinc-500" : "text-gray-400")}>Version modèle</p>
                <p className={"text-xl font-bold tabular-nums " + (isDark ? "text-white" : "text-gray-800")}>
                  v{currentVersion}
                </p>
                <p className={"text-xs mt-0.5 " + (isDark ? "text-zinc-600" : "text-gray-400")}>
                  {mlflowRuns.length} expériences
                </p>
              </div>
              <div className={cardClass + " p-4"}>
                <p className={"text-xs mb-1 " + (isDark ? "text-zinc-500" : "text-gray-400")}>Statut drift</p>
                <p className={"text-xl font-bold " +
                  (hasCritical
                    ? (isDark ? "text-red-400" : "text-red-600")
                    : hasAlert
                      ? (isDark ? "text-amber-400" : "text-amber-600")
                      : (isDark ? "text-emerald-400" : "text-emerald-600"))}>
                  {hasCritical ? "CRITIQUE" : hasAlert ? "ALERTE" : "NORMAL"}
                </p>
                <p className={"text-xs mt-0.5 " + (isDark ? "text-zinc-600" : "text-gray-400")}>
                  {driftStats?.drift_features?.length || 0} features analysées
                </p>
              </div>
            </div>

            {/* Grille MLFlow + Drift */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">

              {/* ── MLFlow Runs ── */}
              <div>
                <p className={"text-xs font-medium uppercase tracking-wider mb-3 " + headClass}>
                  Expériences MLFlow
                </p>
                <div className={cardClass}>
                  {mlflowRuns.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity size={26} className={"mx-auto mb-3 " + (isDark ? "text-zinc-700" : "text-gray-300")} />
                      <p className={"text-sm " + (isDark ? "text-zinc-500" : "text-gray-400")}>
                        Aucun run MLFlow disponible
                      </p>
                      <p className={"text-xs mt-1 " + (isDark ? "text-zinc-600" : "text-gray-400")}>
                        Lancez le serveur MLFlow sur le port 5000
                      </p>
                    </div>
                  ) : (
                    <div>
                      {bestRun && (
                        <div className={"p-4 border-b " + borderB}>
                          <div className="flex items-center gap-2 mb-3">
                            <Award size={13} className={isDark ? "text-zinc-500" : "text-gray-400"} />
                            <p className={"text-xs font-medium " + (isDark ? "text-zinc-400" : "text-gray-500")}>
                              Meilleur modèle en production
                            </p>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={"font-semibold text-sm " + (isDark ? "text-white" : "text-gray-800")}>
                                {bestRun.nom || bestRun.modele}
                              </p>
                              <p className={"text-xs mt-0.5 " + (isDark ? "text-zinc-500" : "text-gray-400")}>
                                ID : {bestRun.run_id} · {bestRun.statut}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={"text-lg font-bold " + (isDark ? "text-white" : "text-gray-800")}>
                                {bestRun.auc_roc}
                              </p>
                              <p className={"text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")}>AUC-ROC</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[360px]">
                          <thead>
                            <tr className={"border-b " + borderB}>
                              <th className={"text-left py-2.5 px-4 " + headClass}>Modèle</th>
                              <th className={"text-center py-2.5 " + headClass}>AUC-ROC</th>
                              <th className={"text-center py-2.5 " + headClass}>Score métier</th>
                              <th className={"text-center py-2.5 pr-4 " + headClass}>Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mlflowRuns.map((run, i) => {
                              const isBest = i === 0
                              const rowClass = "border-t transition-colors " +
                                (isDark ? "border-zinc-800/50 hover:bg-zinc-800/20" : "border-gray-50 hover:bg-gray-50/80")
                              return (
                                <tr key={run.run_id} className={rowClass}>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <p className={"text-xs font-medium " + (isDark ? "text-zinc-200" : "text-gray-700")}>
                                        {run.modele}
                                      </p>
                                      {isBest && (
                                        <span className={"text-xs px-1.5 py-0.5 rounded border font-medium " +
                                          (isDark ? "border-amber-900 text-amber-400" : "border-amber-200 text-amber-600")}>
                                          Best
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className={"py-3 text-center text-xs font-semibold tabular-nums " +
                                    (isBest
                                      ? (isDark ? "text-emerald-400" : "text-emerald-600")
                                      : (isDark ? "text-zinc-300" : "text-gray-600"))}>
                                    {run.auc_roc}
                                  </td>
                                  <td className={"py-3 text-center text-xs tabular-nums " +
                                    (isDark ? "text-zinc-400" : "text-gray-500")}>
                                    {run.score_metier ? Number(run.score_metier).toLocaleString() : "—"}
                                  </td>
                                  <td className="py-3 text-center pr-4">
                                    <span className={isDark ? "text-emerald-400" : "text-emerald-600"}>✓</span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Data Drift ── */}
              <div>
                <p className={"text-xs font-medium uppercase tracking-wider mb-3 " + headClass}>
                  Analyse du Data Drift
                </p>
                <div className={cardClass}>
                  {!driftStats ? (
                    <div className="text-center py-12">
                      <Database size={26} className={"mx-auto mb-3 " + (isDark ? "text-zinc-700" : "text-gray-300")} />
                      <p className={"text-sm " + (isDark ? "text-zinc-500" : "text-gray-400")}>
                        Données insuffisantes
                      </p>
                    </div>
                  ) : (
                    <div>
                      {driftStats.drift_features?.map((f, i) => {
                        const cfg = statutConfig[f.statut] || statutConfig["NORMAL"]
                        const Icon = cfg.icon
                        const isLast = i === driftStats.drift_features.length - 1
                        const ecartPct = f.ecart_pct || 0
                        const zScore = f.z_score || 0
                        const barColor = f.statut === "NORMAL" ? "bg-emerald-500" :
                                         f.statut === "ALERTE" ? "bg-amber-500" : "bg-red-500"
                        const zBadgeClass = zScore > 2
                          ? (isDark ? "border-red-900 text-red-400" : "border-red-200 text-red-600")
                          : zScore > 1
                            ? (isDark ? "border-amber-900 text-amber-400" : "border-amber-200 text-amber-600")
                            : (isDark ? "border-emerald-900 text-emerald-400" : "border-emerald-200 text-emerald-600")

                        return (
                          <div key={f.feature} className={"p-4 " + (!isLast ? "border-b " + borderB : "")}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={"w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 " + cfg.color}>
                                  <Icon size={13} />
                                </div>
                                <p className={"text-sm font-medium " + (isDark ? "text-white" : "text-gray-800")}>
                                  {f.feature}
                                </p>
                              </div>
                              <span className={"text-xs px-2 py-0.5 rounded-full border font-medium " + cfg.color}>
                                {f.statut}
                              </span>
                            </div>

                            {/* Écart + Z-score */}
                            <div className="mb-3">
                              <div className="flex justify-between items-center text-xs mb-1">
                                <span className={isDark ? "text-zinc-500" : "text-gray-400"}>Écart</span>
                                <div className="flex items-center gap-2">
                                  <span className={"text-xs px-1.5 py-0.5 rounded border font-medium " + zBadgeClass}>
                                    Z={zScore}
                                  </span>
                                  <span className={"font-medium " +
                                    (f.statut === "NORMAL"
                                      ? (isDark ? "text-emerald-400" : "text-emerald-600")
                                      : f.statut === "ALERTE"
                                        ? (isDark ? "text-amber-400" : "text-amber-600")
                                        : (isDark ? "text-red-400" : "text-red-600"))}>
                                    {ecartPct}%
                                  </span>
                                </div>
                              </div>
                              <div className={"w-full h-1.5 rounded-full " + (isDark ? "bg-zinc-800" : "bg-gray-100")}>
                                <div
                                  className={"h-1.5 rounded-full transition-all duration-700 " + barColor}
                                  style={{ width: Math.min(ecartPct, 100) + "%" }}
                                />
                              </div>
                              <p className={"text-xs mt-1 " + (isDark ? "text-zinc-600" : "text-gray-400")}>
                                {zScore <= 1
                                  ? "Distribution normale"
                                  : zScore <= 2
                                    ? "Dérive modérée"
                                    : "Dérive significative"}
                              </p>
                            </div>

                            {/* Ref vs Production */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className={"rounded-lg p-2.5 " + (isDark ? "bg-zinc-800/50" : "bg-gray-50")}>
                                <p className={"text-xs mb-0.5 " + (isDark ? "text-zinc-500" : "text-gray-400")}>Référence</p>
                                <p className={"text-xs font-semibold tabular-nums " + (isDark ? "text-zinc-200" : "text-gray-700")}>
                                  {f.ref_mean?.toLocaleString()} FCFA
                                </p>
                              </div>
                              <div className={"rounded-lg p-2.5 " + (isDark ? "bg-zinc-800/50" : "bg-gray-50")}>
                                <p className={"text-xs mb-0.5 " + (isDark ? "text-zinc-500" : "text-gray-400")}>Production</p>
                                <p className={"text-xs font-semibold tabular-nums " + (isDark ? "text-zinc-200" : "text-gray-700")}>
                                  {f.prod_mean?.toLocaleString()} FCFA
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}