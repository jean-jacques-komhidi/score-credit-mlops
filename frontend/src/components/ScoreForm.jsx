// ScoreForm.jsx
import { useState } from "react"
import { useTheme } from "../context/ThemeContext"
import { User, Briefcase, Home, CreditCard, SlidersHorizontal, Search, AlertCircle } from "lucide-react"

const defaultValues = {
  age: 33,
  anciennete: 5,
  AMT_INCOME_TOTAL: 150000,
  AMT_CREDIT: 500000,
  AMT_ANNUITY: 25000,
  AMT_GOODS_PRICE: 450000,
  EXT_SOURCE_2: 0.6,
  EXT_SOURCE_3: 0.5,
  CNT_CHILDREN: 1,
  CNT_FAM_MEMBERS: 3,
  NAME_CONTRACT_TYPE: 0,
  FLAG_OWN_CAR: 1,
  FLAG_OWN_REALTY: 1,
  CODE_GENDER_M: 0,
}

const RULES = {
  age: [18, 70, "Âge entre 18 et 70 ans"],
  anciennete: [0, 50, "Ancienneté entre 0 et 50 ans"],
  AMT_INCOME_TOTAL: [10000, 50000000, "Revenu doit être supérieur à 10 000 FCFA"],
  AMT_CREDIT: [10000, 100000000, "Montant du crédit doit être supérieur à 10 000 FCFA"],
  AMT_ANNUITY: [1000, 10000000, "Mensualité doit être supérieure à 1 000 FCFA"],
  AMT_GOODS_PRICE: [10000, 100000000, "Prix du bien doit être supérieur à 10 000 FCFA"],
  CNT_CHILDREN: [0, 15, "Nombre d'enfants entre 0 et 15"],
  CNT_FAM_MEMBERS: [1, 20, "Membres de la famille entre 1 et 20"],
}

function validate(formData) {
  const errors = {}
  for (const [key, [min, max, msg]] of Object.entries(RULES)) {
    const val = formData[key]
    if (val === "" || val === null || isNaN(val)) {
      errors[key] = "Ce champ est requis"
    } else if (val < min || val > max) {
      errors[key] = msg
    }
  }
  if (formData.AMT_ANNUITY >= formData.AMT_CREDIT) {
    errors.AMT_ANNUITY = "La mensualité doit être inférieure au montant du crédit"
  }
  if (formData.CNT_FAM_MEMBERS < formData.CNT_CHILDREN) {
    errors.CNT_FAM_MEMBERS = "Doit être ≥ au nombre d'enfants"
  }
  return errors
}

export default function ScoreForm({ onSubmit, loading }) {
  const { isDark } = useTheme()
  const [formData, setFormData] = useState(defaultValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    const parsed = value === "" ? "" : parseFloat(value)
    setFormData(prev => ({ ...prev, [name]: parsed }))
  }

  const handleBlur = (e) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }))
  }

  const handleRadio = (name, value) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validationErrors = validate(formData)
    setErrors(validationErrors)
    setTouched(Object.fromEntries(Object.keys(RULES).map(k => [k, true])))

    if (Object.keys(validationErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    const payload = {
      ...formData,
      DAYS_BIRTH: formData.age * -365,
      DAYS_EMPLOYED: formData.anciennete * -365,
    }
    delete payload.age
    delete payload.anciennete
    onSubmit(payload)
  }

  const fieldError = (key) => touched[key] && errors[key]

  const getInputClass = (key) => `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2
    ${fieldError(key)
      ? isDark
        ? "border-red-500/50 focus:ring-red-500/30 bg-red-500/10"
        : "border-red-400 focus:ring-red-300 bg-red-50"
      : isDark
        ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-blue-400"
        : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-blue-400"}`

  const labelClass = `block text-[11px] font-semibold uppercase tracking-wide mb-1.5
    ${isDark ? "text-zinc-500" : "text-gray-500"}`

  const sectionClass = `rounded-2xl p-5 mb-4 border transition-colors
    ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm"}`

  const sectionHeader = (icon, bg, bgDark, title) => (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? bgDark : bg}`}>
        {icon}
      </div>
      <h3 className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-800"}`}>
        {title}
      </h3>
    </div>
  )

  const RadioPair = ({ name, value, options }) => (
    <div className="flex gap-2">
      {options.map(opt => (
        <button key={opt.value} type="button"
          onClick={() => handleRadio(name, opt.value)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
            ${value === opt.value
              ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-900/30"
              : isDark
                ? "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}>
          {opt.label}
        </button>
      ))}
    </div>
  )

  const FieldError = ({ field }) =>
    fieldError(field) ? (
      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle size={11} /> {errors[field]}
      </p>
    ) : null

  const errorCount = Object.keys(errors).length

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* Bandeau d'erreur global */}
      {errorCount > 0 && Object.keys(touched).length > 0 && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm flex items-start gap-2 border
          ${isDark
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-red-50 border-red-200 text-red-700"}`}>
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">
              {errorCount} champ{errorCount > 1 ? "s" : ""} à corriger avant l'analyse
            </p>
            <p className={`text-xs mt-0.5 ${isDark ? "text-red-400/80" : "text-red-600"}`}>
              Vérifiez les valeurs surlignées en rouge ci-dessous
            </p>
          </div>
        </div>
      )}

      {/* Section 1 — Informations personnelles */}
      <div className={sectionClass}>
        {sectionHeader(<User size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />, "bg-blue-50", "bg-blue-500/15", "Informations personnelles")}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Âge (années)</label>
            <input type="number" name="age" value={formData.age}
              onChange={handleChange} onBlur={handleBlur} min="18" max="70"
              className={getInputClass("age")} />
            <FieldError field="age" />
          </div>
          <div>
            <label className={labelClass}>Nombre d'enfants</label>
            <input type="number" name="CNT_CHILDREN" value={formData.CNT_CHILDREN}
              onChange={handleChange} onBlur={handleBlur} min="0" max="15"
              className={getInputClass("CNT_CHILDREN")} />
            <FieldError field="CNT_CHILDREN" />
          </div>
          <div>
            <label className={labelClass}>Membres de la famille</label>
            <input type="number" name="CNT_FAM_MEMBERS" value={formData.CNT_FAM_MEMBERS}
              onChange={handleChange} onBlur={handleBlur} min="1" max="20"
              className={getInputClass("CNT_FAM_MEMBERS")} />
            <FieldError field="CNT_FAM_MEMBERS" />
          </div>
          <div>
            <label className={labelClass}>Genre</label>
            <RadioPair name="CODE_GENDER_M" value={formData.CODE_GENDER_M}
              options={[{ value: 0, label: "Femme" }, { value: 1, label: "Homme" }]} />
          </div>
        </div>
      </div>

      {/* Section 2 — Situation professionnelle */}
      <div className={sectionClass}>
        {sectionHeader(<Briefcase size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />, "bg-emerald-50", "bg-emerald-500/15", "Situation professionnelle")}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Ancienneté (années)</label>
            <input type="number" name="anciennete" value={formData.anciennete}
              onChange={handleChange} onBlur={handleBlur} min="0" max="50"
              className={getInputClass("anciennete")} />
            <FieldError field="anciennete" />
          </div>
          <div>
            <label className={labelClass}>Revenu annuel (FCFA)</label>
            <input type="number" name="AMT_INCOME_TOTAL" value={formData.AMT_INCOME_TOTAL}
              onChange={handleChange} onBlur={handleBlur} min="0"
              className={getInputClass("AMT_INCOME_TOTAL")} />
            <FieldError field="AMT_INCOME_TOTAL" />
          </div>
        </div>
      </div>

      {/* Section 3 — Patrimoine */}
      <div className={sectionClass}>
        {sectionHeader(<Home size={16} className={isDark ? "text-orange-400" : "text-orange-600"} />, "bg-orange-50", "bg-orange-500/15", "Patrimoine")}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Possède une voiture</label>
            <RadioPair name="FLAG_OWN_CAR" value={formData.FLAG_OWN_CAR}
              options={[{ value: 0, label: "Non" }, { value: 1, label: "Oui" }]} />
          </div>
          <div>
            <label className={labelClass}>Possède un bien immobilier</label>
            <RadioPair name="FLAG_OWN_REALTY" value={formData.FLAG_OWN_REALTY}
              options={[{ value: 0, label: "Non" }, { value: 1, label: "Oui" }]} />
          </div>
        </div>
      </div>

      {/* Section 4 — Crédit */}
      <div className={sectionClass}>
        {sectionHeader(<CreditCard size={16} className={isDark ? "text-purple-400" : "text-purple-600"} />, "bg-purple-50", "bg-purple-500/15", "Informations du crédit")}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Montant du crédit (FCFA)</label>
            <input type="number" name="AMT_CREDIT" value={formData.AMT_CREDIT}
              onChange={handleChange} onBlur={handleBlur} min="0"
              className={getInputClass("AMT_CREDIT")} />
            <FieldError field="AMT_CREDIT" />
          </div>
          <div>
            <label className={labelClass}>Mensualité (FCFA)</label>
            <input type="number" name="AMT_ANNUITY" value={formData.AMT_ANNUITY}
              onChange={handleChange} onBlur={handleBlur} min="0"
              className={getInputClass("AMT_ANNUITY")} />
            <FieldError field="AMT_ANNUITY" />
          </div>
          <div>
            <label className={labelClass}>Prix du bien (FCFA)</label>
            <input type="number" name="AMT_GOODS_PRICE" value={formData.AMT_GOODS_PRICE}
              onChange={handleChange} onBlur={handleBlur} min="0"
              className={getInputClass("AMT_GOODS_PRICE")} />
            <FieldError field="AMT_GOODS_PRICE" />
          </div>
          <div>
            <label className={labelClass}>Type de contrat</label>
            <RadioPair name="NAME_CONTRACT_TYPE" value={formData.NAME_CONTRACT_TYPE}
              options={[{ value: 0, label: "Cash" }, { value: 1, label: "Revolving" }]} />
          </div>
        </div>
      </div>

      {/* Section 5 — Scores externes */}
      <div className={sectionClass}>
        {sectionHeader(<SlidersHorizontal size={16} className={isDark ? "text-indigo-400" : "text-indigo-600"} />, "bg-indigo-50", "bg-indigo-500/15", "Scores de solvabilité externes")}
        <p className={`text-xs mb-4 -mt-1 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
          Issus de bureaux de crédit externes (0 = très risqué, 1 = très fiable)
        </p>
        <div className="space-y-5">
          {[
            { key: "EXT_SOURCE_2", label: "Score externe 2" },
            { key: "EXT_SOURCE_3", label: "Score externe 3" },
          ].map(({ key, label }) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1.5">
                <label className={labelClass}>{label}</label>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md
                  ${isDark ? "text-blue-400 bg-blue-500/15" : "text-blue-600 bg-blue-50"}`}>
                  {formData[key]}
                </span>
              </div>
              <input type="range" name={key} value={formData[key]}
                onChange={handleChange} min="0" max="1" step="0.01"
                className="w-full accent-blue-600" />
              <div className={`flex justify-between text-[10px] mt-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                <span>0 — Risqué</span>
                <span>1 — Fiable</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bouton */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 text-sm">
        <Search size={16} />
        {loading ? "Analyse en cours..." : "Analyser le dossier"}
      </button>
    </form>
  )
}