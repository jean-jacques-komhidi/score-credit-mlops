import { useState, useEffect, useRef } from "react"
import { useTheme } from "../context/ThemeContext"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"
import { rechercherClients, creerClient } from "../services/api"
import {
  Users, Search, Phone, Mail, MapPin,
  ChevronRight, X, RefreshCw, UserPlus, Plus, Loader2
} from "lucide-react"

// ─────────────────────────────────────────────
// MODAL NOUVEAU CLIENT
// ─────────────────────────────────────────────
function ModalNouveauClient({ isDark, onClose, onClientCree }) {
  const [form, setForm] = useState({
    nom: "", prenom: "", date_naissance: "", telephone: "",
    email: "", adresse: "", num_piece: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nom || !form.prenom) { setError("Le nom et le prénom sont obligatoires"); return }
    setLoading(true)
    setError(null)
    try {
      const client = await creerClient(form)
      onClientCree(client)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border rounded-xl px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400 " +
    (isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400")
  const labelClass = "block text-xs font-medium uppercase tracking-wide mb-1.5 " + (isDark ? "text-zinc-500" : "text-gray-400")
  const borderB = isDark ? "border-zinc-800" : "border-gray-100"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={"relative w-full sm:max-w-lg mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden " +
        (isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white")}>

        <div className={"flex items-center justify-between px-5 py-4 border-b " + borderB}>
          <div>
            <h2 className={"font-semibold text-base " + (isDark ? "text-white" : "text-gray-800")}>
              Nouveau client
            </h2>
            <p className={"text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")}>
              Remplissez les informations du client
            </p>
          </div>
          <button onClick={onClose}
            className={"p-2 rounded-lg transition-colors " +
              (isDark ? "hover:bg-zinc-800 text-zinc-500" : "hover:bg-gray-100 text-gray-400")}>
            <X size={17} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[60vh] sm:max-h-96 overflow-y-auto">
          {error && (
            <div className={"rounded-xl px-4 py-3 text-xs border " +
              (isDark ? "bg-red-500/10 border-red-900 text-red-400" : "bg-red-50 border-red-200 text-red-700")}>
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nom *</label>
              <input name="nom" value={form.nom} onChange={handleChange} placeholder="DIALLO" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Prénom *</label>
              <input name="prenom" value={form.prenom} onChange={handleChange} placeholder="Mamadou" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date de naissance</label>
              <input type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>N° Pièce d'identité</label>
              <input name="num_piece" value={form.num_piece} onChange={handleChange} placeholder="CNI-123456" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input name="telephone" value={form.telephone} onChange={handleChange} placeholder="+221 77 000 00 00" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@exemple.com" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Adresse</label>
              <input name="adresse" value={form.adresse} onChange={handleChange} placeholder="Rue, Ville, Pays" className={inputClass} />
            </div>
          </div>
        </div>

        <div className={"flex gap-3 px-5 py-4 border-t " + borderB}>
          <button onClick={onClose}
            className={"flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all " +
              (isDark ? "border-zinc-700 text-zinc-400 hover:bg-zinc-800" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            {loading ? "Création..." : "Créer le client"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────
export default function Clients() {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [showModal, setShowModal] = useState(false)
  const timer = useRef(null)

  const fetchClients = async (q = "") => {
    setLoading(true)
    try {
      const data = await rechercherClients(q)
      setClients(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClients() }, [])

  const handleSearch = (val) => {
    setQuery(val)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fetchClients(val), 400)
  }

  const handleClientCree = (client) => {
    fetchClients(query)
    navigate("/clients/" + client.id)
  }

  const pageClass = "min-h-screen transition-colors duration-300 " + (isDark ? "bg-zinc-950" : "bg-gray-50")
  const cardClass = "rounded-2xl border transition-colors overflow-hidden " +
    (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")
  const inputClass = "w-full border rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 pl-9 " +
    (isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-zinc-500" : "bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-gray-300")
  const headClass = "text-xs uppercase tracking-wider " + (isDark ? "text-zinc-600" : "text-gray-400")
  const borderB = isDark ? "border-zinc-800" : "border-gray-100"

  return (
    <div className={pageClass}>
      <Header title="Clients" subtitle="Liste et gestion des clients enregistrés" />

      <main className="lg:ml-64 pt-14 lg:pt-24 px-4 lg:px-8 pb-8">

        {/* Barre d'actions */}
        <div className="flex items-center justify-between mt-4 lg:mt-0 mb-4 lg:mb-6">
          <div className="relative w-full max-w-sm">
            <Search size={14} className={"absolute left-3 top-1/2 -translate-y-1/2 " + (isDark ? "text-zinc-500" : "text-gray-400")} />
            <input
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher un client..."
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            <button
              onClick={() => fetchClients(query)}
              className={"flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all " +
                (isDark ? "border-zinc-800 text-zinc-400 hover:bg-zinc-800" : "border-gray-200 text-gray-500 hover:bg-gray-50")}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3 lg:px-4 py-2.5 rounded-xl text-xs lg:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all">
              <Plus size={14} />
              <span className="hidden sm:inline">Nouveau client</span>
              <span className="sm:hidden">Nouveau</span>
            </button>
          </div>
        </div>

        {/* Compteur */}
        <div className="flex items-center justify-between mb-3">
          <span className={"text-xs " + (isDark ? "text-zinc-600" : "text-gray-400")}>
            {clients.length} client{clients.length > 1 ? "s" : ""} {query ? "trouvé" + (clients.length > 1 ? "s" : "") : "enregistré" + (clients.length > 1 ? "s" : "")}
          </span>
        </div>

        {/* Tableau / Cards */}
        <div className={cardClass}>
          {loading ? (
            <div className="text-center py-14">
              <Loader2 size={26} className={"animate-spin mx-auto mb-3 " + (isDark ? "text-zinc-600" : "text-gray-300")} />
              <p className={"text-sm " + (isDark ? "text-zinc-500" : "text-gray-400")}>Chargement...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-14">
              <Users size={36} className={"mx-auto mb-3 " + (isDark ? "text-zinc-700" : "text-gray-300")} />
              <p className={"font-medium text-sm mb-3 " + (isDark ? "text-zinc-400" : "text-gray-500")}>
                {query ? "Aucun client trouvé" : "Aucun client enregistré"}
              </p>
              {!query && (
                <button onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all">
                  <Plus size={14} />
                  Créer le premier client
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Vue tableau — desktop */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={"border-b " + borderB}>
                      <th className={"text-left py-3 px-6 " + headClass}>Client</th>
                      <th className={"text-left py-3 " + headClass}>N° Client</th>
                      <th className={"text-left py-3 " + headClass}>Contact</th>
                      <th className={"text-left py-3 " + headClass}>Adresse</th>
                      <th className={"text-left py-3 " + headClass}>Depuis</th>
                      <th className={"text-center py-3 pr-6 " + headClass}>Voir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.id}
                        onClick={() => navigate("/clients/" + client.id)}
                        className={"border-t cursor-pointer transition-colors " +
                          (isDark ? "border-zinc-800/50 hover:bg-zinc-800/30" : "border-gray-50 hover:bg-gray-50/80")}>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className={"w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 " +
                              (isDark ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-600")}>
                              {client.prenom?.[0]}{client.nom?.[0]}
                            </div>
                            <p className={"font-medium text-sm " + (isDark ? "text-white" : "text-gray-800")}>
                              {client.prenom} {client.nom}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className={"text-xs px-2 py-0.5 rounded-full border font-medium " +
                            (isDark ? "border-zinc-700 text-zinc-400" : "border-gray-200 text-gray-500")}>
                            {client.numero_client}
                          </span>
                        </td>
                        <td className={"py-3.5 " + (isDark ? "text-zinc-400" : "text-gray-500")}>
                          <div className="space-y-0.5">
                            {client.telephone && (
                              <p className="text-xs flex items-center gap-1.5">
                                <Phone size={10} className={isDark ? "text-zinc-600" : "text-gray-400"} />
                                {client.telephone}
                              </p>
                            )}
                            {client.email && (
                              <p className="text-xs flex items-center gap-1.5">
                                <Mail size={10} className={isDark ? "text-zinc-600" : "text-gray-400"} />
                                {client.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className={"py-3.5 text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")}>
                          {client.adresse && (
                            <p className="flex items-center gap-1.5">
                              <MapPin size={10} className={isDark ? "text-zinc-600" : "text-gray-400"} />
                              {client.adresse}
                            </p>
                          )}
                        </td>
                        <td className={"py-3.5 text-xs " + (isDark ? "text-zinc-600" : "text-gray-400")}>
                          {client.date_creation}
                        </td>
                        <td className="py-3.5 text-center pr-6">
                          <ChevronRight size={14} className={isDark ? "text-zinc-600" : "text-gray-400"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vue cards — mobile */}
              <div className="lg:hidden divide-y " style={{ divideColor: isDark ? "#27272a" : "#f9fafb" }}>
                {clients.map(client => (
                  <div key={client.id}
                    onClick={() => navigate("/clients/" + client.id)}
                    className={"flex items-center gap-3 p-4 cursor-pointer transition-colors " +
                      (isDark ? "hover:bg-zinc-800/30" : "hover:bg-gray-50/80")}>
                    <div className={"w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 " +
                      (isDark ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-600")}>
                      {client.prenom?.[0]}{client.nom?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={"font-medium text-sm " + (isDark ? "text-white" : "text-gray-800")}>
                          {client.prenom} {client.nom}
                        </p>
                        <span className={"text-xs px-1.5 py-0.5 rounded border font-medium flex-shrink-0 " +
                          (isDark ? "border-zinc-700 text-zinc-500" : "border-gray-200 text-gray-400")}>
                          {client.numero_client}
                        </span>
                      </div>
                      <div className={"flex items-center gap-3 text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")}>
                        {client.telephone && <span className="flex items-center gap-1"><Phone size={10} />{client.telephone}</span>}
                        {client.email && <span className="flex items-center gap-1 min-w-0 truncate"><Mail size={10} />{client.email}</span>}
                      </div>
                    </div>
                    <ChevronRight size={14} className={isDark ? "text-zinc-600" : "text-gray-400"} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {showModal && (
        <ModalNouveauClient
          isDark={isDark}
          onClose={() => setShowModal(false)}
          onClientCree={handleClientCree}
        />
      )}
    </div>
  )
}