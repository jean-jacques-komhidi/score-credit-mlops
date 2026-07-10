import { useTheme } from "../context/ThemeContext"
import { CheckCircle, XCircle } from "lucide-react"
import { useEffect, useState } from "react"

// ─────────────────────────────────────────────
// SEUILS ALIGNÉS AVEC LE BACKEND (SEUIL_DECISION = 0.30)
// ─────────────────────────────────────────────
// < 20%  → FAIBLE    → vert
// 20-35% → MODÉRÉ    → ambre
// 35-50% → ÉLEVÉ     → orange
// > 50%  → TRÈS ÉLEVÉ → rouge

const getColor = (p) => {
  if (p < 20) return "#059669"   // vert   — FAIBLE
  if (p < 35) return "#d97706"   // ambre  — MODÉRÉ
  if (p < 50) return "#ea580c"   // orange — ÉLEVÉ
  return "#dc2626"               // rouge  — TRÈS ÉLEVÉ
}

const getProbaColor = (p) => {
  if (p < 20) return "text-emerald-500"
  if (p < 35) return "text-amber-500"
  if (p < 50) return "text-orange-500"
  return "text-red-500"
}

const getBarColor = (p) => {
  if (p < 20) return "bg-emerald-500"
  if (p < 35) return "bg-amber-500"
  if (p < 50) return "bg-orange-500"
  return "bg-red-500"
}

// ─────────────────────────────────────────────
// SPEEDOMETER
// ─────────────────────────────────────────────
function Speedometer({ proba, isDark }) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    setAnimated(0)
    const timeout = setTimeout(() => {
      let startTime = null
      const duration = 1200
      const animate = (now) => {
        if (!startTime) startTime = now
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setAnimated(Math.round(eased * proba * 10) / 10)
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }, 100)
    return () => clearTimeout(timeout)
  }, [proba])

  const cx = 130
  const cy = 110
  const r  = 90

  const toRad = (deg) => (deg * Math.PI) / 180

  const arcPath = (startDeg, endDeg) => {
    const s  = toRad(startDeg)
    const e  = toRad(endDeg)
    const x1 = cx + r * Math.cos(s)
    const y1 = cy - r * Math.sin(s)
    const x2 = cx + r * Math.cos(e)
    const y2 = cy - r * Math.sin(e)
    return "M " + x1 + " " + y1 + " A " + r + " " + r + " 0 0 1 " + x2 + " " + y2
  }

  const pct        = animated / 100
  const colorAngle = 180 - pct * 180
  const color      = getColor(animated)

  const needleRad = toRad(180 - pct * 180)
  const nx = cx + 72 * Math.cos(needleRad)
  const ny = cy - 72 * Math.sin(needleRad)

  // Marqueurs alignés sur les seuils métier
  const markers = [
    { value: 0,   label: "0%" },
    { value: 20,  label: "20%" },
    { value: 35,  label: "35%" },
    { value: 50,  label: "50%" },
    { value: 100, label: "100%" },
  ]

  // Zones de couleur sur l'arc
  const zones = [
    { from: 180, to: 180 - (20/100)*180,  color: "#059669" }, // vert   0-20%
    { from: 180 - (20/100)*180, to: 180 - (35/100)*180, color: "#d97706" }, // ambre  20-35%
    { from: 180 - (35/100)*180, to: 180 - (50/100)*180, color: "#ea580c" }, // orange 35-50%
    { from: 180 - (50/100)*180, to: 0,    color: "#dc2626" }, // rouge  50-100%
  ]

  const tickColor  = isDark ? "#52524e" : "#9ca3af"
  const trackColor = isDark ? "#27272a" : "#e5e7eb"
  const needleColor= isDark ? "#e4e4e7" : "#18181b"

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg width="260" height="190" viewBox="0 0 260 190">
        {/* Arc de fond */}
        <path d={arcPath(180, 0)} fill="none" stroke={trackColor} strokeWidth="16" strokeLinecap="round" />

        {/* Zones colorées statiques (fond) */}
        {zones.map((z, i) => (
          <path key={i} d={arcPath(z.from, z.to)} fill="none"
            stroke={z.color} strokeWidth="16" strokeLinecap="butt" opacity="0.15" />
        ))}

        {/* Arc animé de la valeur actuelle */}
        <path d={arcPath(180, colorAngle)} fill="none"
          stroke={color} strokeWidth="16" strokeLinecap="round"
          style={{ transition: "all 0.05s linear" }} />

        {/* Marqueurs */}
        {markers.map(({ value, label }) => {
          const angle = toRad(180 - (value / 100) * 180)
          const lx = cx + (r + 16) * Math.cos(angle)
          const ly = cy - (r + 16) * Math.sin(angle)
          return (
            <text key={value} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize="9" fill={tickColor}>{label}</text>
          )
        })}

        {/* Ligne de seuil de décision à 30% */}
        {(() => {
          const seuilAngle = toRad(180 - (30/100)*180)
          const sx1 = cx + (r - 12) * Math.cos(seuilAngle)
          const sy1 = cy - (r - 12) * Math.sin(seuilAngle)
          const sx2 = cx + (r + 8) * Math.cos(seuilAngle)
          const sy2 = cy - (r + 8) * Math.sin(seuilAngle)
          return (
            <g>
              <line x1={sx1} y1={sy1} x2={sx2} y2={sy2}
                stroke="#dc2626" strokeWidth="2" strokeDasharray="3,2" />
              <text x={sx2 + 2} y={sy2 - 4} fontSize="7" fill="#dc2626" textAnchor="middle">
                30%
              </text>
            </g>
          )
        })()}

        {/* Aiguille */}
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={needleColor} strokeWidth="2" strokeLinecap="round"
          style={{ transition: "all 0.05s linear" }} />
        <circle cx={cx} cy={cy} r="6" fill={needleColor} />
        <circle cx={cx} cy={cy} r="3.5" fill={color} />

        {/* Valeur centrale */}
        <rect x={cx - 52} y={cy + 16} width="104" height="46" rx="8"
          fill={isDark ? "#09090b" : "#ffffff"}
          stroke={isDark ? "#27272a" : "#e5e7eb"} strokeWidth="1" />
        <text x={cx} y={cy + 38} textAnchor="middle" fontSize="24" fontWeight="bold" fill={color}
          style={{ transition: "fill 0.3s" }}>
          {animated.toFixed(1)}%
        </text>
        <text x={cx} y={cy + 54} textAnchor="middle" fontSize="9" fill={tickColor}>
          Probabilité de défaut
        </text>
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────
// SCORE RESULT
// ─────────────────────────────────────────────
export default function ScoreResult({ result }) {
  const { isDark } = useTheme()
  if (!result) return null

  const isAccorde = result.decision === "ACCORDÉ"
  const proba     = result.probabilite_defaut

  const riskCfg = {
    "FAIBLE":     { text: isDark ? "text-emerald-400" : "text-emerald-700", border: isDark ? "border-emerald-800" : "border-emerald-200" },
    "MODÉRÉ":     { text: isDark ? "text-amber-400"   : "text-amber-700",   border: isDark ? "border-amber-800"   : "border-amber-200" },
    "ÉLEVÉ":      { text: isDark ? "text-orange-400"  : "text-orange-700",  border: isDark ? "border-orange-800"  : "border-orange-200" },
    "TRÈS ÉLEVÉ": { text: isDark ? "text-red-400"     : "text-red-700",     border: isDark ? "border-red-800"     : "border-red-200" },
  }
  const rc = riskCfg[result.niveau_risque] || riskCfg["MODÉRÉ"]

  const decisionColor = isAccorde
    ? (isDark ? "text-emerald-400 border-emerald-800" : "text-emerald-700 border-emerald-200")
    : (isDark ? "text-red-400 border-red-800" : "text-red-700 border-red-200")

  const probaColor = getProbaColor(proba)

  return (
    <div className={"rounded-2xl border overflow-hidden " +
      (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")}>
      <div className="p-5 lg:p-6">

        {/* Décision */}
        <div className={"flex items-center justify-center gap-2.5 py-4 rounded-xl border mb-4 font-bold text-xl " + decisionColor}>
          {isAccorde ? <CheckCircle size={24} /> : <XCircle size={24} />}
          {result.decision}
        </div>

        {/* Speedometer */}
        <div className={"rounded-xl p-3 mb-4 " + (isDark ? "bg-zinc-800/40" : "bg-gray-50")}>
          <Speedometer proba={proba} isDark={isDark} />
        </div>

        {/* Légende des seuils */}
        <div className={"rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between flex-wrap gap-2 " +
          (isDark ? "bg-zinc-800/40" : "bg-gray-50")}>
          {[
            { label: "Faible",     color: "bg-emerald-500", range: "< 20%" },
            { label: "Modéré",     color: "bg-amber-500",   range: "20-35%" },
            { label: "Élevé",      color: "bg-orange-500",  range: "35-50%" },
            { label: "Très élevé", color: "bg-red-500",     range: "> 50%" },
          ].map(z => (
            <div key={z.label} className="flex items-center gap-1.5">
              <span className={"w-2 h-2 rounded-full flex-shrink-0 " + z.color} />
              <span className={"text-xs " + (isDark ? "text-zinc-400" : "text-gray-500")}>
                {z.label} <span className={isDark ? "text-zinc-600" : "text-gray-400"}>({z.range})</span>
              </span>
            </div>
          ))}
        </div>

        {/* Niveau de risque */}
        <div className={"rounded-xl border px-4 py-3 mb-4 flex items-center justify-between " +
          (isDark ? "border-zinc-800" : "border-gray-100")}>
          <div>
            <p className={"text-xs uppercase tracking-wider mb-0.5 " + (isDark ? "text-zinc-500" : "text-gray-400")}>
              Niveau de risque
            </p>
            <p className={"font-bold text-base " + rc.text}>{result.niveau_risque}</p>
          </div>
          <span className={"text-xs px-2.5 py-1 rounded-full border font-medium " + rc.text + " " + rc.border}>
            {result.niveau_risque}
          </span>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={"rounded-xl p-3 " + (isDark ? "bg-zinc-800/40" : "bg-gray-50")}>
            <p className={"text-xs mb-1 " + (isDark ? "text-zinc-500" : "text-gray-400")}>Score de risque</p>
            <p className={"text-lg font-bold tabular-nums " + probaColor}>{result.score?.toFixed(4)}</p>
          </div>
          <div className={"rounded-xl p-3 " + (isDark ? "bg-zinc-800/40" : "bg-gray-50")}>
            <p className={"text-xs mb-1 " + (isDark ? "text-zinc-500" : "text-gray-400")}>Score métier</p>
            <p className={"text-lg font-bold tabular-nums " + (isDark ? "text-white" : "text-gray-800")}>
              {result.score_metier}
            </p>
          </div>
        </div>

        {/* Barre de risque avec seuil */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className={isDark ? "text-zinc-500" : "text-gray-400"}>Risque de défaut</span>
            <span className={"font-medium " + probaColor}>{proba}%</span>
          </div>
          <div className={"relative w-full h-2 rounded-full " + (isDark ? "bg-zinc-800" : "bg-gray-100")}>
            <div
              className={"h-2 rounded-full transition-all duration-1000 " + getBarColor(proba)}
              style={{ width: proba + "%" }}
            />
            {/* Ligne de seuil à 30% */}
            <div
              className="absolute top-0 h-2 w-0.5 bg-red-500 opacity-70"
              style={{ left: "30%" }}
              title="Seuil de décision : 30%"
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className={isDark ? "text-zinc-700" : "text-gray-300"}>0%</span>
            <span className="text-red-500 opacity-70" style={{ marginLeft: "30%" }}>|seuil</span>
            <span className={isDark ? "text-zinc-700" : "text-gray-300"}>100%</span>
          </div>
        </div>

      </div>
    </div>
  )
}