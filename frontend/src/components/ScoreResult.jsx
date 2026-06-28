export default function ScoreResult({ result }) {
  const getColor = (niveau) => {
    switch (niveau) {
      case "FAIBLE": return "text-green-600 bg-green-50 border-green-200"
      case "MODÉRÉ": return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "ÉLEVÉ": return "text-orange-600 bg-orange-50 border-orange-200"
      case "TRÈS ÉLEVÉ": return "text-red-600 bg-red-50 border-red-200"
      default: return "text-gray-600"
    }
  }

  const getDecisionColor = (decision) => {
    return decision === "ACCORDÉ"
      ? "text-green-700 bg-green-100 border-green-300"
      : "text-red-700 bg-red-100 border-red-300"
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
      <h2 className="text-xl font-bold text-gray-700 mb-4">📊 Résultat de l'analyse</h2>

      {/* Décision */}
      <div className={`border-2 rounded-xl p-4 mb-4 text-center ${getDecisionColor(result.decision)}`}>
        <p className="text-3xl font-bold">{result.decision === "ACCORDÉ" ? "✅" : "❌"} {result.decision}</p>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">Probabilité de défaut</p>
          <p className="text-2xl font-bold text-gray-800">{result.probabilite_defaut}%</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">Score de risque</p>
          <p className="text-2xl font-bold text-gray-800">{result.score}</p>
        </div>
      </div>

      {/* Niveau de risque */}
      <div className={`border rounded-xl p-3 text-center ${getColor(result.niveau_risque)}`}>
        <p className="text-sm font-medium">Niveau de risque</p>
        <p className="text-xl font-bold">{result.niveau_risque}</p>
      </div>

      {/* Barre de progression */}
      <div className="mt-4">
        <p className="text-sm text-gray-500 mb-1">Risque de défaut</p>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${
              result.probabilite_defaut < 20 ? "bg-green-500" :
              result.probabilite_defaut < 50 ? "bg-yellow-500" :
              result.probabilite_defaut < 70 ? "bg-orange-500" : "bg-red-500"
            }`}
            style={{ width: `${result.probabilite_defaut}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{result.probabilite_defaut}%</p>
      </div>
    </div>
  )
}