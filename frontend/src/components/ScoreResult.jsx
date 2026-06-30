// ScoreResult.jsx
import { useTheme } from "../context/ThemeContext"
import { CheckCircle2, XCircle, TrendingDown, TrendingUp } from "lucide-react"

export default function ScoreResult({ result }) {
  const { isDark } = useTheme()
  const isAccorde = result.decision === "ACCORDÉ"

  const riskConfig = {
    FAIBLE: { color: "green", label: "FAIBLE" },
    "MODÉRÉ": { color: "yellow", label: "MODÉRÉ" },
    "ÉLEVÉ": { color: "orange", label: "ÉLEVÉ" },
    "TRÈS ÉLEVÉ": { color: "red", label: "TRÈS ÉLEVÉ" },
  }

  const risk = riskConfig[result.niveau_risque] || riskConfig.FAIBLE

  const colorMapLight = {
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", bar: "bg-green-500" },
    yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", bar: "bg-yellow-500" },
    orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", bar: "bg-orange-500" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", bar: "bg-red-500" },
  }
  const colorMapDark = {
    green: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", bar: "bg-green-500" },
    yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", bar: "bg-yellow-500" },
    orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", bar: "bg-orange-500" },
    red: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", bar: "bg-red-500" },
  }
  const rc = isDark ? colorMapDark[risk.color] : colorMapLight[risk.color]

  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors
      ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm"}`}>

      {/* Header */}
      <div className={`px-6 py-4 border-b ${isDark ? "border-zinc-800" : "border-gray-100"}`}>
        <h2 className={`font-bold text-base ${isDark ? "text-white" : "text-gray-800"}`}>
          Résultat de l'analyse
        </h2>
      </div>

      <div className="p-6">

        {/* Décision — bandeau principal */}
        <div className={`rounded-2xl p-5 mb-5 flex items-center justify-center gap-3 border
          ${isAccorde
            ? isDark ? "bg-green-500/10 border-green-500/30" : "bg-green-50 border-green-200"
            : isDark ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200"}`}>
          {isAccorde
            ? <CheckCircle2 size={28} className={isDark ? "text-green-400" : "text-green-600"} />
            : <XCircle size={28} className={isDark ? "text-red-400" : "text-red-600"} />
          }
          <span className={`text-2xl font-bold tracking-wide
            ${isAccorde
              ? isDark ? "text-green-400" : "text-green-700"
              : isDark ? "text-red-400" : "text-red-700"}`}>
            {result.decision}
          </span>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className={`rounded-xl p-4 ${isDark ? "bg-zinc-800" : "bg-gray-50"}`}>
            <p className={`text-xs font-medium mb-1 ${isDark ? "text-zinc-500" : "text-gray-500"}`}>
              Probabilité de défaut
            </p>
            <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
              {result.probabilite_defaut}%
            </p>
          </div>
          <div className={`rounded-xl p-4 ${isDark ? "bg-zinc-800" : "bg-gray-50"}`}>
            <p className={`text-xs font-medium mb-1 ${isDark ? "text-zinc-500" : "text-gray-500"}`}>
              Score de risque
            </p>
            <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
              {result.score}
            </p>
          </div>
        </div>

        {/* Niveau de risque */}
        <div className={`rounded-xl p-4 mb-5 border ${rc.bg} ${rc.border}`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold uppercase tracking-wider ${rc.text}`}>
              Niveau de risque
            </p>
            {risk.color === "green"
              ? <TrendingDown size={16} className={rc.text} />
              : <TrendingUp size={16} className={rc.text} />
            }
          </div>
          <p className={`text-xl font-bold mt-1 ${rc.text}`}>
            {risk.label}
          </p>
        </div>

        {/* Barre de progression */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-xs font-medium ${isDark ? "text-zinc-500" : "text-gray-500"}`}>
              Risque de défaut
            </p>
            <p className={`text-xs font-bold ${rc.text}`}>
              {result.probabilite_defaut}%
            </p>
          </div>
          <div className={`w-full h-2.5 rounded-full ${isDark ? "bg-zinc-800" : "bg-gray-100"}`}>
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${rc.bar}`}
              style={{ width: `${Math.min(result.probabilite_defaut, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}