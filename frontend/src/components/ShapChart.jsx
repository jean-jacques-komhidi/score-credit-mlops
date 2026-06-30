import { useTheme } from "../context/ThemeContext"
import { TrendingUp, TrendingDown, Info } from "lucide-react"

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
  AMT_ANNUITY: "Mensualité",
  CNT_CHILDREN: "Nombre d'enfants",
  CODE_GENDER_M: "Genre",
  FLAG_OWN_CAR: "Possession d'une voiture",
  FLAG_OWN_REALTY: "Possession d'un bien immobilier",
  DAYS_EMPLOYED_ANOMALY: "Anomalie d'emploi",
  FLAG_EMP_PHONE: "Téléphone professionnel",
  FLAG_WORK_PHONE: "Téléphone au travail",
  FLAG_PHONE: "Téléphone fixe",
  FLAG_MOBIL: "Téléphone mobile",
  FLAG_EMAIL: "Adresse email",
  REGION_POPULATION_RELATIVE: "Densité de population régionale",
  REGION_RATING_CLIENT: "Note de la région du client",
  REGION_RATING_CLIENT_W_CITY: "Note région (avec ville)",
  OBS_30_CNT_SOCIAL_CIRCLE: "Entourage social (30 jours)",
  OBS_60_CNT_SOCIAL_CIRCLE: "Entourage social (60 jours)",
  DEF_30_CNT_SOCIAL_CIRCLE: "Défauts entourage (30 jours)",
  DEF_60_CNT_SOCIAL_CIRCLE: "Défauts entourage (60 jours)",
  AMT_REQ_CREDIT_BUREAU_YEAR: "Demandes bureau crédit (1 an)",
  AMT_REQ_CREDIT_BUREAU_MON: "Demandes bureau crédit (1 mois)",
  AMT_REQ_CREDIT_BUREAU_QRT: "Demandes bureau crédit (trimestre)",
  AMT_REQ_CREDIT_BUREAU_WEEK: "Demandes bureau crédit (semaine)",
  AMT_REQ_CREDIT_BUREAU_DAY: "Demandes bureau crédit (jour)",
  AMT_REQ_CREDIT_BUREAU_HOUR: "Demandes bureau crédit (heure)",
  DAYS_BIRTH: "Âge en jours",
  DAYS_EMPLOYED: "Ancienneté en jours",
  DAYS_REGISTRATION: "Jours depuis enregistrement",
  DAYS_ID_PUBLISH: "Jours depuis publication ID",
  DAYS_LAST_PHONE_CHANGE: "Jours depuis changement téléphone",
  CNT_FAM_MEMBERS: "Membres de la famille",
  HOUR_APPR_PROCESS_START: "Heure de la demande",
  NAME_CONTRACT_TYPE: "Type de contrat",
  "NAME_EDUCATION_TYPE_Higher education": "Niveau d'études supérieures",
  "NAME_EDUCATION_TYPE_Secondary / secondary special": "Niveau secondaire",
  NAME_INCOME_TYPE_Working: "Type de revenu : Salarié",
  "NAME_INCOME_TYPE_Commercial associate": "Type de revenu : Commercial",
  NAME_INCOME_TYPE_Pensioner: "Type de revenu : Retraité",
  NAME_INCOME_TYPE_State_servant: "Type de revenu : Fonctionnaire",
  NAME_FAMILY_STATUS_Married: "Statut : Marié(e)",
  "NAME_FAMILY_STATUS_Single / not married": "Statut : Célibataire",
  "NAME_HOUSING_TYPE_House / apartment": "Logement : Maison/Appartement",
  OCCUPATION_TYPE_Laborers: "Profession : Ouvrier",
  OCCUPATION_TYPE_Core_staff: "Profession : Personnel principal",
  OCCUPATION_TYPE_Managers: "Profession : Manager",
  OCCUPATION_TYPE_Drivers: "Profession : Chauffeur",
  WEEKDAY_APPR_PROCESS_START_MONDAY: "Demande le lundi",
  WEEKDAY_APPR_PROCESS_START_TUESDAY: "Demande le mardi",
  WEEKDAY_APPR_PROCESS_START_WEDNESDAY: "Demande le mercredi",
  WEEKDAY_APPR_PROCESS_START_THURSDAY: "Demande le jeudi",
  WEEKDAY_APPR_PROCESS_START_FRIDAY: "Demande le vendredi",
  WEEKDAY_APPR_PROCESS_START_SATURDAY: "Demande le samedi",
  WEEKDAY_APPR_PROCESS_START_SUNDAY: "Demande le dimanche",
}

const getLabel = (feature) => {
  return featureLabels[feature] || feature.replace(/_/g, " ")
}

export default function ShapChart({ result }) {
  const { isDark } = useTheme()

  if (!result?.shap_features) return null

  const maxImpact = Math.max(...result.shap_features.map(f => Math.abs(f.impact)))

  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors
      ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm"}`}>

      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center gap-2
        ${isDark ? "border-zinc-800" : "border-gray-100"}`}>
        <Info size={18} className={isDark ? "text-blue-400" : "text-blue-600"} />
        <h3 className={`font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
          Explication de la décision
        </h3>
      </div>

      {/* Explication texte naturel */}
      <div className={`px-6 py-4 border-b text-sm leading-relaxed whitespace-pre-line
        ${isDark ? "border-zinc-800 text-zinc-300 bg-zinc-950/50" : "border-gray-100 text-gray-600 bg-gray-50"}`}>
        {result.explication}
      </div>

      {/* Graphique SHAP */}
      <div className="px-6 py-5">
        <p className={`text-xs font-semibold uppercase tracking-wider mb-5
          ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
          Impact des facteurs sur la décision
        </p>

        <div className="space-y-4">
          {result.shap_features.map((f, i) => {
            const label = getLabel(f.feature)
            const pct = (Math.abs(f.impact) / maxImpact) * 100
            const isRisk = f.direction === "risque"

            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {isRisk
                      ? <TrendingUp size={14} className="text-red-500 flex-shrink-0" />
                      : <TrendingDown size={14} className="text-green-500 flex-shrink-0" />
                    }
                    <span className={`text-xs font-medium ${isDark ? "text-zinc-300" : "text-gray-700"}`}>
                      {label}
                    </span>
                  </div>
                  <span className={`text-xs font-bold ml-2 flex-shrink-0
                    ${isRisk ? "text-red-500" : "text-green-500"}`}>
                    {isRisk ? "+" : ""}{(f.impact * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Barre de progression */}
                <div className={`w-full h-2 rounded-full ${isDark ? "bg-zinc-800" : "bg-gray-100"}`}>
                  <div
                    className={`h-2 rounded-full transition-all duration-700
                      ${isRisk ? "bg-red-500" : "bg-green-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className={`text-xs mt-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                  {isRisk ? "↑ Augmente le risque de défaut" : "↓ Réduit le risque de défaut"}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}