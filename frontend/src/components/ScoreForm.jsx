import { useState } from "react"
import { useTheme } from "../context/ThemeContext"
import { User, Briefcase, Home, CreditCard, SlidersHorizontal } from "lucide-react"

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

export default function ScoreForm({ onSubmit, loading }) {
  const { isDark } = useTheme()
  const [formData, setFormData] = useState(defaultValues)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: parseFloat(value) })
  }

  const handleRadio = (name, value) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Conversion age et ancienneté en jours négatifs
    const payload = {
      ...formData,
      DAYS_BIRTH: formData.age * -365,
      DAYS_EMPLOYED: formData.anciennete * -365,
    }
    delete payload.age
    delete payload.anciennete
    onSubmit(payload)
  }

  const inputClass = `w-full border rounded-xl px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
    ${isDark
      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
      : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"}`

  const labelClass = `block text-xs font-semibold uppercase tracking-wider mb-2
    ${isDark ? "text-slate-400" : "text-gray-500"}`

  const sectionClass = `rounded-2xl p-5 mb-4 border transition-colors
    ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100 shadow-sm"}`

  return (
    <form onSubmit={handleSubmit}>

      {/* Section 1 — Informations personnelles */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-blue-600" />
          <h3 className={`font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
            Informations personnelles
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Âge (années)</label>
            <input type="number" name="age" value={formData.age}
              onChange={handleChange} min="18" max="70" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nombre d'enfants</label>
            <input type="number" name="CNT_CHILDREN" value={formData.CNT_CHILDREN}
              onChange={handleChange} min="0" max="10" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Membres de la famille</label>
            <input type="number" name="CNT_FAM_MEMBERS" value={formData.CNT_FAM_MEMBERS}
              onChange={handleChange} min="1" max="15" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Genre</label>
            <div className="flex gap-2 mt-1">
              <button type="button"
                onClick={() => handleRadio("CODE_GENDER_M", 0)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all
                  ${formData.CODE_GENDER_M === 0
                    ? "bg-blue-600 text-white border-blue-600"
                    : isDark ? "bg-slate-700 text-slate-300 border-slate-600" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                Femme
              </button>
              <button type="button"
                onClick={() => handleRadio("CODE_GENDER_M", 1)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all
                  ${formData.CODE_GENDER_M === 1
                    ? "bg-blue-600 text-white border-blue-600"
                    : isDark ? "bg-slate-700 text-slate-300 border-slate-600" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                Homme
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 — Situation professionnelle */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4">
          <Briefcase size={18} className="text-green-600" />
          <h3 className={`font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
            Situation professionnelle
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Ancienneté (années)</label>
            <input type="number" name="anciennete" value={formData.anciennete}
              onChange={handleChange} min="0" max="40" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Revenu annuel (FCFA)</label>
            <input type="number" name="AMT_INCOME_TOTAL" value={formData.AMT_INCOME_TOTAL}
              onChange={handleChange} min="0" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Section 3 — Patrimoine */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4">
          <Home size={18} className="text-orange-600" />
          <h3 className={`font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
            Patrimoine
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Possède une voiture</label>
            <div className="flex gap-2 mt-1">
              <button type="button"
                onClick={() => handleRadio("FLAG_OWN_CAR", 0)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all
                  ${formData.FLAG_OWN_CAR === 0
                    ? "bg-blue-600 text-white border-blue-600"
                    : isDark ? "bg-slate-700 text-slate-300 border-slate-600" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                Non
              </button>
              <button type="button"
                onClick={() => handleRadio("FLAG_OWN_CAR", 1)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all
                  ${formData.FLAG_OWN_CAR === 1
                    ? "bg-blue-600 text-white border-blue-600"
                    : isDark ? "bg-slate-700 text-slate-300 border-slate-600" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                Oui
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Possède un bien immobilier</label>
            <div className="flex gap-2 mt-1">
              <button type="button"
                onClick={() => handleRadio("FLAG_OWN_REALTY", 0)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all
                  ${formData.FLAG_OWN_REALTY === 0
                    ? "bg-blue-600 text-white border-blue-600"
                    : isDark ? "bg-slate-700 text-slate-300 border-slate-600" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                Non
              </button>
              <button type="button"
                onClick={() => handleRadio("FLAG_OWN_REALTY", 1)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all
                  ${formData.FLAG_OWN_REALTY === 1
                    ? "bg-blue-600 text-white border-blue-600"
                    : isDark ? "bg-slate-700 text-slate-300 border-slate-600" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                Oui
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4 — Crédit */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-purple-600" />
          <h3 className={`font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
            Informations du crédit
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Montant du crédit (FCFA)</label>
            <input type="number" name="AMT_CREDIT" value={formData.AMT_CREDIT}
              onChange={handleChange} min="0" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Mensualité (FCFA)</label>
            <input type="number" name="AMT_ANNUITY" value={formData.AMT_ANNUITY}
              onChange={handleChange} min="0" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Prix du bien (FCFA)</label>
            <input type="number" name="AMT_GOODS_PRICE" value={formData.AMT_GOODS_PRICE}
              onChange={handleChange} min="0" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Type de contrat</label>
            <div className="flex gap-2 mt-1">
              <button type="button"
                onClick={() => handleRadio("NAME_CONTRACT_TYPE", 0)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all
                  ${formData.NAME_CONTRACT_TYPE === 0
                    ? "bg-blue-600 text-white border-blue-600"
                    : isDark ? "bg-slate-700 text-slate-300 border-slate-600" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                Cash
              </button>
              <button type="button"
                onClick={() => handleRadio("NAME_CONTRACT_TYPE", 1)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all
                  ${formData.NAME_CONTRACT_TYPE === 1
                    ? "bg-blue-600 text-white border-blue-600"
                    : isDark ? "bg-slate-700 text-slate-300 border-slate-600" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                Revolving
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5 — Scores externes */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-2">
          <SlidersHorizontal size={18} className="text-indigo-600" />
          <h3 className={`font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
            Scores de solvabilité externes
          </h3>
        </div>
        <p className={`text-xs mb-4 ${isDark ? "text-slate-400" : "text-gray-400"}`}>
          Ces scores proviennent de bureaux de crédit externes (0 = très risqué, 1 = très fiable)
        </p>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <label className={labelClass}>Score externe 2</label>
              <span className="text-xs font-bold text-blue-600">{formData.EXT_SOURCE_2}</span>
            </div>
            <input type="range" name="EXT_SOURCE_2" value={formData.EXT_SOURCE_2}
              onChange={handleChange} min="0" max="1" step="0.01"
              className="w-full accent-blue-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 — Risqué</span>
              <span>1 — Fiable</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className={labelClass}>Score externe 3</label>
              <span className="text-xs font-bold text-blue-600">{formData.EXT_SOURCE_3}</span>
            </div>
            <input type="range" name="EXT_SOURCE_3" value={formData.EXT_SOURCE_3}
              onChange={handleChange} min="0" max="1" step="0.01"
              className="w-full accent-blue-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 — Risqué</span>
              <span>1 — Fiable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200">
        {loading ? "⚙️ Analyse en cours..." : "🔍 Analyser le dossier"}
      </button>
    </form>
  )
}