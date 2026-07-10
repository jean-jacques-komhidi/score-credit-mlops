import { useTheme } from "../context/ThemeContext"
import { TrendingUp, TrendingDown, Info } from "lucide-react"
import { useState, useEffect } from "react"

const featureLabels = {
  EXT_SOURCE_3: "Score de solvabilité externe 3",
  EXT_SOURCE_2: "Score de solvabilité externe 2",
  CREDIT_INCOME_RATIO: "Ratio crédit / revenu",
  ANNUITY_INCOME_RATIO: "Ratio mensualité / revenu",
  CREDIT_DURATION: "Durée du crédit",
  CREDIT_GOODS_RATIO: "Ratio crédit / valeur du bien",
  AGE_YEARS: "Âge du client",
  YEARS_EMPLOYED: "Ancienneté professionnelle",
  AMT_CREDIT: "Montant du crédit",
  AMT_INCOME_TOTAL: "Revenu annuel",
  AMT_GOODS_PRICE: "Prix du bien",
  AMT_ANNUITY: "Mensualité",
  CNT_CHILDREN: "Nombre d'enfants",
  CODE_GENDER_M: "Genre",
  FLAG_OWN_CAR: "Possession d'une voiture",
  FLAG_OWN_REALTY: "Possession d'un bien immobilier",
  DAYS_EMPLOYED_ANOMALY: "Anomalie d'emploi",
  DAYS_BIRTH: "Âge du client",
  DAYS_EMPLOYED: "Ancienneté professionnelle",
  CNT_FAM_MEMBERS: "Membres de la famille",
  NAME_CONTRACT_TYPE: "Type de contrat",
}

const getLabel = (feature) => featureLabels[feature] || feature.replace(/_/g, " ")

function FeatureBar({ f, i, maxImpact, isDark, type }) {
  const label = type === "lime" ? (f.label || getLabel(f.feature)) : getLabel(f.feature)
  const pct = maxImpact > 0 ? (Math.abs(f.impact) / maxImpact) * 100 : 0
  const isRisk = f.direction === "risque"
  const delay = i * 80
  const [barWidth, setBarWidth] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), delay)
    const t2 = setTimeout(() => setBarWidth(pct), delay + 120)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [pct, delay])

  const itemStyle = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateX(0)" : "translateX(-8px)",
    transition: "opacity 0.35s ease " + delay + "ms, transform 0.35s ease " + delay + "ms"
  }
  const barStyle = {
    width: barWidth + "%",
    transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)"
  }

  const riskColor = isRisk
    ? (isDark ? "text-red-400" : "text-red-600")
    : (isDark ? "text-emerald-400" : "text-emerald-600")

  const barColor = type === "lime"
    ? (isRisk ? "bg-orange-500" : "bg-blue-500")
    : (isRisk ? "bg-red-500" : "bg-emerald-500")

  const trackColor = isDark ? "bg-zinc-800" : "bg-gray-100"

  return (
    <div style={itemStyle}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {isRisk
            ? <TrendingUp size={12} className={"flex-shrink-0 " + riskColor} />
            : <TrendingDown size={12} className={"flex-shrink-0 " + riskColor} />
          }
          <span className={"text-xs truncate " + (isDark ? "text-zinc-300" : "text-gray-700")} title={label}>
            {label}
          </span>
        </div>
        <span className={"text-xs font-medium ml-2 flex-shrink-0 " + riskColor}>
          {isRisk ? "+" : ""}{(f.impact * 100).toFixed(1)}%
        </span>
      </div>
      <div className={"w-full h-1.5 rounded-full " + trackColor}>
        <div style={barStyle} className={"h-1.5 rounded-full " + barColor} />
      </div>
      <p className={"text-xs mt-0.5 " + (isDark ? "text-zinc-600" : "text-gray-400")}>
        {isRisk ? "↑ Augmente le risque" : "↓ Réduit le risque"}
      </p>
    </div>
  )
}

export default function ShapChart({ result }) {
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState("shap")

  if (!result?.shap_features) return null

  const shapFeatures = result.shap_features || []
  const limeFeatures = result.lime_features || []
  const maxShap = shapFeatures.length > 0 ? Math.max(...shapFeatures.map(f => Math.abs(f.impact))) : 1
  const maxLime = limeFeatures.length > 0 ? Math.max(...limeFeatures.map(f => Math.abs(f.impact))) : 1

  const borderB = isDark ? "border-zinc-800" : "border-gray-100"

  const tabActive = "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all "
  const tabShapOn = tabActive + (isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-600 text-white")
  const tabLimeOn = tabActive + (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-500 text-white")
  const tabOff = tabActive + (isDark ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-600")

  return (
    <div className={"rounded-2xl border overflow-hidden " + (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")}>

      {/* Header */}
      <div className={"flex items-center gap-2 px-5 py-4 border-b " + borderB}>
        <Info size={15} className={isDark ? "text-zinc-500" : "text-gray-400"} />
        <h3 className={"font-semibold text-sm " + (isDark ? "text-white" : "text-gray-800")}>
          Explication de la décision
        </h3>
      </div>

      {/* Explication texte */}
      <div className={"px-5 py-4 border-b text-xs leading-relaxed whitespace-pre-line " +
        (isDark ? borderB + " text-zinc-400 bg-zinc-950/30" : borderB + " text-gray-500 bg-gray-50/50")}>
        {result.explication}
      </div>

      {/* Toggle SHAP / LIME */}
      <div className={"flex items-center justify-between px-5 py-3 border-b " + borderB}>
        <div className="flex gap-1.5">
          <button onClick={() => setActiveTab("shap")} className={activeTab === "shap" ? tabShapOn : tabOff}>
            SHAP
          </button>
          <button
            onClick={() => setActiveTab("lime")}
            disabled={limeFeatures.length === 0}
            className={activeTab === "lime" ? tabLimeOn : tabOff}>
            LIME
          </button>
        </div>
        <span className={"text-xs " + (isDark ? "text-zinc-600" : "text-gray-400")}>
          {activeTab === "shap" ? "Valeurs de Shapley" : "Approximation locale linéaire"}
        </span>
      </div>

      {/* Contenu */}
      <div className="px-5 py-4">
        <p className={"text-xs font-semibold uppercase tracking-wider mb-4 " + (isDark ? "text-zinc-600" : "text-gray-400")}>
          Impact des facteurs
        </p>

        {activeTab === "shap" && (
          <div className="space-y-4">
            {shapFeatures.map((f, i) => (
              <FeatureBar key={i} f={f} i={i} maxImpact={maxShap} isDark={isDark} type="shap" />
            ))}
          </div>
        )}

        {activeTab === "lime" && (
          <div className="space-y-4">
            {limeFeatures.length === 0 ? (
              <p className={"text-sm text-center py-6 " + (isDark ? "text-zinc-600" : "text-gray-400")}>
                LIME non disponible pour cette prédiction
              </p>
            ) : (
              limeFeatures.map((f, i) => (
                <FeatureBar key={i} f={f} i={i} maxImpact={maxLime} isDark={isDark} type="lime" />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}