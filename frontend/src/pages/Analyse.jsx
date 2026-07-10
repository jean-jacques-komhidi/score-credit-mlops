import { useState, useRef, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import Header from "../components/Header"
import ScoreForm from "../components/ScoreForm"
import ScoreResult from "../components/ScoreResult"
import ShapChart from "../components/ShapChart"
import { predictCredit, rechercherClients, getModelInfo } from "../services/api"
import {
  SearchX, Loader2, Search, ChevronRight,
  Phone, Mail, CreditCard, Calendar, X
} from "lucide-react"

// ─────────────────────────────────────────────
// RECHERCHE CLIENT
// ─────────────────────────────────────────────
function ClientSearch({ isDark, onClientSelectionne }) {
  const [query, setQuery] = useState("")
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const timer = useRef(null)

  const handleSearch = async (val) => {
    setQuery(val)
    clearTimeout(timer.current)
    if (val.length < 2) { setClients([]); setSearched(false); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await rechercherClients(val)
        setClients(results)
        setSearched(true)
      } catch (e) {
        setClients([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  const inputClass = "w-full border rounded-xl px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 pl-10 " +
    (isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" : "bg-white border-gray-200 text-gray-800 placeholder-gray-400")

  const cardClass = "rounded-xl border p-3.5 mb-2 cursor-pointer transition-all " +
    (isDark ? "bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800" : "bg-white border-gray-100 hover:border-gray-300 shadow-sm")

  return (
    <div>
      <div className={"rounded-2xl border p-4 lg:p-5 mb-4 " + (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className={"w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 " + (isDark ? "bg-zinc-800" : "bg-gray-100")}>
            <Search size={15} className={isDark ? "text-zinc-400" : "text-gray-500"} />
          </div>
          <div>
            <h3 className={"font-semibold text-sm " + (isDark ? "text-white" : "text-gray-800")}>
              Rechercher un client
            </h3>
            <p className={"text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")}>
              Nom, prénom, N° client ou email
            </p>
          </div>
        </div>

        <div className="relative">
          <Search size={15} className={"absolute left-3.5 top-1/2 -translate-y-1/2 " + (isDark ? "text-zinc-500" : "text-gray-400")} />
          <input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Ex: Diallo, CLT-0001..."
            className={inputClass}
          />
          {loading && (
            <Loader2 size={15} className={"absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin " + (isDark ? "text-zinc-500" : "text-gray-400")} />
          )}
        </div>
      </div>

      {searched && clients.length === 0 && (
        <div className={"text-center py-8 text-sm rounded-xl border-2 border-dashed " + (isDark ? "border-zinc-800 text-zinc-600" : "border-gray-200 text-gray-400")}>
          Aucun client trouvé pour «&nbsp;{query}&nbsp;»
        </div>
      )}

      <div className="space-y-2">
        {clients.map(client => (
          <div key={client.id} className={cardClass} onClick={() => onClientSelectionne(client)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={"w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 " +
                  (isDark ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-600")}>
                  {client.prenom?.[0]}{client.nom?.[0]}
                </div>
                <div>
                  <p className={"font-medium text-sm " + (isDark ? "text-white" : "text-gray-800")}>
                    {client.prenom} {client.nom}
                  </p>
                  <p className={"text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")}>
                    {client.numero_client}{client.telephone ? " · " + client.telephone : ""}
                  </p>
                </div>
              </div>
              <ChevronRight size={15} className={isDark ? "text-zinc-600" : "text-gray-300"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// FICHE CLIENT SÉLECTIONNÉ
// ─────────────────────────────────────────────
function ClientCard({ client, isDark, onDeselect }) {
  const labelClass = "text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")
  const valueClass = "text-sm font-medium " + (isDark ? "text-zinc-200" : "text-gray-700")

  return (
    <div className={"rounded-xl border p-4 mb-4 " + (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={"w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 " +
            (isDark ? "bg-zinc-800 text-zinc-200" : "bg-gray-100 text-gray-600")}>
            {client.prenom?.[0]}{client.nom?.[0]}
          </div>
          <div>
            <p className={"font-semibold text-sm " + (isDark ? "text-white" : "text-gray-800")}>
              {client.prenom} {client.nom}
            </p>
            <span className={"text-xs px-2 py-0.5 rounded-full border font-medium " +
              (isDark ? "border-zinc-700 text-zinc-400" : "border-gray-200 text-gray-500")}>
              {client.numero_client}
            </span>
          </div>
        </div>
        <button
          onClick={onDeselect}
          className={"p-1.5 rounded-lg transition-colors " +
            (isDark ? "hover:bg-zinc-800 text-zinc-500" : "hover:bg-gray-100 text-gray-400")}>
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {client.telephone && (
          <div className="flex items-center gap-2">
            <Phone size={12} className={isDark ? "text-zinc-600" : "text-gray-400"} />
            <div>
              <p className={labelClass}>Téléphone</p>
              <p className={valueClass}>{client.telephone}</p>
            </div>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-2 min-w-0">
            <Mail size={12} className={"flex-shrink-0 " + (isDark ? "text-zinc-600" : "text-gray-400")} />
            <div className="min-w-0">
              <p className={labelClass}>Email</p>
              <p className={valueClass + " truncate"}>{client.email}</p>
            </div>
          </div>
        )}
        {client.date_naissance && (
          <div className="flex items-center gap-2">
            <Calendar size={12} className={isDark ? "text-zinc-600" : "text-gray-400"} />
            <div>
              <p className={labelClass}>Naissance</p>
              <p className={valueClass}>{client.date_naissance}</p>
            </div>
          </div>
        )}
        {client.num_piece && (
          <div className="flex items-center gap-2">
            <CreditCard size={12} className={isDark ? "text-zinc-600" : "text-gray-400"} />
            <div>
              <p className={labelClass}>Pièce d'identité</p>
              <p className={valueClass}>{client.num_piece}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────
export default function Analyse() {
  const { isDark } = useTheme()
  const [clientSelectionne, setClientSelectionne] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [etape, setEtape] = useState("recherche")
  const [modelInfo, setModelInfo] = useState({ model_name: "scoring", version: "1.0.0" })
  const resultRef = useRef(null)

  // Charger les infos du modèle actif
  useEffect(() => {
    getModelInfo()
      .then(info => setModelInfo(info))
      .catch(() => {})
  }, [])

  const handleClientSelectionne = (client) => {
    setClientSelectionne(client)
    setEtape("analyse")
    setResult(null)
    setError(null)
  }

  const handleDeselect = () => {
    setClientSelectionne(null)
    setEtape("recherche")
    setResult(null)
    setError(null)
  }

  const handleSubmit = async (formData) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = { ...formData }
      if (clientSelectionne?.id) payload.client_id = clientSelectionne.id
      const data = await predictCredit(payload)
      setResult(data)
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const pageClass = "min-h-screen transition-colors duration-300 " + (isDark ? "bg-zinc-950" : "bg-gray-50")
  const modelLabel = `${modelInfo.model_name} v${modelInfo.version}`

  const emptyState = (
    <div className={"rounded-2xl border-2 border-dashed p-10 text-center " +
      (isDark ? "border-zinc-800" : "border-gray-200")}>
      <div className={"w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 " +
        (isDark ? "bg-zinc-800" : "bg-gray-100")}>
        <SearchX size={22} className={isDark ? "text-zinc-600" : "text-gray-400"} />
      </div>
      <p className={"font-medium text-sm " + (isDark ? "text-zinc-400" : "text-gray-500")}>
        {etape === "recherche"
          ? "Recherchez un client pour commencer"
          : "Remplissez le formulaire pour obtenir un résultat"}
      </p>
      <p className={"text-xs mt-1 " + (isDark ? "text-zinc-600" : "text-gray-400")}>
        {etape === "recherche"
          ? "Saisissez un nom, prénom ou numéro client"
          : `Le modèle ${modelLabel} calculera le score de risque`}
      </p>
    </div>
  )

  return (
    <div className={pageClass}>
      <Header title="Analyse de dossier" subtitle="Évaluez le risque de crédit d'un client" />

      <main className="lg:ml-64 pt-14 lg:pt-24 px-4 lg:px-8 pb-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-4 lg:mt-0">

          {/* ── Colonne gauche ── */}
          <div>
            {etape === "recherche" && (
              <ClientSearch isDark={isDark} onClientSelectionne={handleClientSelectionne} />
            )}
            {etape === "analyse" && clientSelectionne && (
              <>
                <ClientCard
                  client={clientSelectionne}
                  isDark={isDark}
                  onDeselect={handleDeselect}
                />
                <ScoreForm
                  onSubmit={handleSubmit}
                  loading={loading}
                  client={clientSelectionne}
                />
              </>
            )}
          </div>

          {/* ── Colonne droite — Résultat ── */}
          <div
            ref={resultRef}
            className="lg:sticky lg:top-24 space-y-4 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">

            {error && (
              <div className={"rounded-xl border p-4 text-sm flex items-center gap-2 " +
                (isDark ? "bg-red-500/10 border-red-900 text-red-400" : "bg-red-50 border-red-200 text-red-700")}>
                <SearchX size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {!result && !loading && emptyState}

            {loading && (
              <div className={"rounded-2xl border p-10 text-center " +
                (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")}>
                <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
                <p className={"font-medium text-sm " + (isDark ? "text-zinc-300" : "text-gray-600")}>
                  Analyse en cours...
                </p>
                <p className={"text-xs mt-1 " + (isDark ? "text-zinc-500" : "text-gray-400")}>
                  Modèle {modelLabel} — calcul du score de risque
                </p>
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