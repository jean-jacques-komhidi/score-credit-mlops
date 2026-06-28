import { useState } from "react"
import { useTheme } from "../context/ThemeContext"
import Header from "../components/Header"
import ScoreForm from "../components/ScoreForm"
import ScoreResult from "../components/ScoreResult"
import ShapChart from "../components/ShapChart"
import { predictCredit } from "../services/api"
import { SearchX, Loader2 } from "lucide-react"

export default function Analyse() {
  const { isDark } = useTheme()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (formData) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await predictCredit(formData)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-300
      ${isDark ? "bg-slate-950" : "bg-gray-50"}`}>

      <Header
        title="Analyse de dossier"
        subtitle="Évaluez le risque de crédit d'un client"
      />

      <main className="ml-64 pt-24 px-8 pb-8">
        <div className="grid grid-cols-2 gap-6">

          {/* Colonne gauche — Formulaire */}
          <div>
            <ScoreForm onSubmit={handleSubmit} loading={loading} />
          </div>

          {/* Colonne droite — Résultat + SHAP */}
          <div className="sticky top-24 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 rounded-xl p-4 text-sm flex items-center gap-2">
                <SearchX size={16} />
                {error}
              </div>
            )}

            {!result && !loading && (
              <div className={`rounded-2xl border-2 border-dashed p-12 text-center
                ${isDark ? "border-slate-700 text-slate-500" : "border-gray-200 text-gray-400"}`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4
                  ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>
                  <SearchX size={32} className="text-gray-400" />
                </div>
                <p className="font-semibold text-base">Aucune analyse en cours</p>
                <p className="text-sm mt-1">Remplissez le formulaire pour obtenir un résultat</p>
              </div>
            )}

            {loading && (
              <div className={`rounded-2xl border p-12 text-center
                ${isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-gray-100 text-gray-500"}`}>
                <div className="flex justify-center mb-4">
                  <Loader2 size={40} className="animate-spin text-blue-600" />
                </div>
                <p className="font-semibold text-base">Analyse en cours...</p>
                <p className="text-sm mt-1">Le modèle XGBoost calcule le score</p>
              </div>
            )}

            {result && (
              <>
                <ScoreResult result={result} />
                <ShapChart result={result} />
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}