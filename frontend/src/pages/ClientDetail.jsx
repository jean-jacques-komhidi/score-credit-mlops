import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import Header from "../components/Header"
import { getDetailClient, modifierClient, supprimerClient } from "../services/api"
import {
  User, Phone, Mail, MapPin, CreditCard, Calendar, Clock,
  Edit2, Trash2, Save, X, ArrowLeft, CheckCircle, XCircle,
  TrendingUp, AlertTriangle, RefreshCw, Loader2
} from "lucide-react"

// ─────────────────────────────────────────────
// MODAL SUPPRESSION
// ─────────────────────────────────────────────
function ModalSuppression({ client, isDark, onConfirm, onCancel, loading }) {
  const borderB = isDark ? "border-zinc-800" : "border-gray-100"
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className={"relative w-full sm:max-w-md mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 " +
        (isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white")}>
        <div className={"w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 " +
          (isDark ? "bg-red-500/15" : "bg-red-50")}>
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h2 className={"text-base font-semibold text-center mb-2 " + (isDark ? "text-white" : "text-gray-800")}>
          Supprimer ce client ?
        </h2>
        <p className={"text-sm text-center mb-6 " + (isDark ? "text-zinc-400" : "text-gray-500")}>
          <strong>{client.prenom} {client.nom}</strong> ({client.numero_client}) et toutes ses analyses seront supprimés. Action irréversible.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className={"flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all " +
              (isDark ? "border-zinc-700 text-zinc-400 hover:bg-zinc-800" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {loading ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE DÉTAIL CLIENT
// ─────────────────────────────────────────────
export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDark } = useTheme()

  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const fetchClient = async () => {
    setLoading(true)
    try {
      const data = await getDetailClient(parseInt(id))
      setClient(data)
      setEditForm({
        nom: data.nom, prenom: data.prenom,
        date_naissance: data.date_naissance || "",
        telephone: data.telephone || "",
        email: data.email || "",
        adresse: data.adresse || "",
        num_piece: data.num_piece || "",
      })
    } catch (e) {
      setError("Client introuvable")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClient() }, [id])

  const handleSave = async () => {
    if (!editForm.nom || !editForm.prenom) { setError("Le nom et le prénom sont obligatoires"); return }
    setSaving(true)
    setError(null)
    try {
      const updated = await modifierClient(parseInt(id), editForm)
      setClient(prev => ({ ...prev, ...updated }))
      setEditMode(false)
      setSuccess("Client modifié avec succès !")
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await supprimerClient(parseInt(id))
      navigate("/clients")
    } catch (e) {
      setError(e.message)
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const pageClass = "min-h-screen transition-colors duration-300 " + (isDark ? "bg-zinc-950" : "bg-gray-50")
  const cardClass = "rounded-xl border transition-colors " + (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm")
  const labelClass = "block text-xs font-medium uppercase tracking-wide mb-1.5 " + (isDark ? "text-zinc-500" : "text-gray-400")
  const valueClass = "text-sm font-medium " + (isDark ? "text-zinc-200" : "text-gray-700")
  const infoLabelClass = "text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")
  const inputClass = "w-full border rounded-xl px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400 " +
    (isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-gray-50 border-gray-200 text-gray-800")
  const borderB = isDark ? "border-zinc-800" : "border-gray-100"

  if (loading) {
    return (
      <div className={pageClass}>
        <Header title="Détail client" subtitle="Chargement..." />
        <main className="lg:ml-64 pt-14 lg:pt-24 flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className={"animate-spin " + (isDark ? "text-zinc-600" : "text-gray-300")} />
        </main>
      </div>
    )
  }

  if (error && !client) {
    return (
      <div className={pageClass}>
        <Header title="Détail client" subtitle="Erreur" />
        <main className="lg:ml-64 pt-14 lg:pt-24 px-4 lg:px-8 text-center py-20">
          <p className={"text-sm mb-4 " + (isDark ? "text-zinc-400" : "text-gray-500")}>{error}</p>
          <button onClick={() => navigate("/clients")}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">
            Retour aux clients
          </button>
        </main>
      </div>
    )
  }

  const nbAccordes = client.analyses?.filter(a => a.decision === "ACCORDÉ").length || 0
  const nbRefuses = client.analyses?.filter(a => a.decision === "REFUSÉ").length || 0
  const derniereAnalyse = client.analyses?.[0] || null

  return (
    <div className={pageClass}>
      <Header
        title={client.prenom + " " + client.nom}
        subtitle={"N° " + client.numero_client}
      />

      <main className="lg:ml-64 pt-14 lg:pt-24 px-4 lg:px-8 pb-8">

        {/* Retour */}
        <button onClick={() => navigate("/clients")}
          className={"flex items-center gap-1.5 text-xs mt-4 lg:mt-0 mb-5 transition-colors " +
            (isDark ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-600")}>
          <ArrowLeft size={14} />
          Retour à la liste
        </button>

        {/* Alertes */}
        {success && (
          <div className={"mb-4 rounded-xl px-4 py-3 text-xs flex items-center gap-2 border " +
            (isDark ? "bg-emerald-500/10 border-emerald-900 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700")}>
            <CheckCircle size={14} /> {success}
          </div>
        )}
        {error && (
          <div className={"mb-4 rounded-xl px-4 py-3 text-xs flex items-center gap-2 border " +
            (isDark ? "bg-red-500/10 border-red-900 text-red-400" : "bg-red-50 border-red-200 text-red-700")}>
            <X size={14} /> {error}
          </div>
        )}

        {/* Layout — 1 col mobile, 3 col desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

          {/* ── Colonne gauche ── */}
          <div className="space-y-4">

            {/* Avatar + actions */}
            <div className={cardClass + " p-5"}>
              <div className="text-center mb-5">
                <div className={"w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-3 " +
                  (isDark ? "bg-zinc-800 text-zinc-200" : "bg-gray-100 text-gray-600")}>
                  {client.prenom?.[0]}{client.nom?.[0]}
                </div>
                <h2 className={"font-semibold text-base " + (isDark ? "text-white" : "text-gray-800")}>
                  {client.prenom} {client.nom}
                </h2>
                <span className={"text-xs px-2.5 py-0.5 rounded-full border font-medium " +
                  (isDark ? "border-zinc-700 text-zinc-400" : "border-gray-200 text-gray-500")}>
                  {client.numero_client}
                </span>
              </div>

              <div className="space-y-2">
                {!editMode ? (
                  <button onClick={() => setEditMode(true)}
                    className={"w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border transition-all " +
                      (isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
                    <Edit2 size={13} /> Modifier
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={saving}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white">
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      {saving ? "..." : "Sauvegarder"}
                    </button>
                    <button onClick={() => { setEditMode(false); setError(null) }}
                      className={"px-3 py-2.5 rounded-xl text-xs border transition-all " +
                        (isDark ? "border-zinc-700 text-zinc-400 hover:bg-zinc-800" : "border-gray-200 text-gray-500 hover:bg-gray-50")}>
                      <X size={13} />
                    </button>
                  </div>
                )}
                <button onClick={() => navigate("/analyse")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all">
                  <TrendingUp size={13} /> Nouvelle analyse
                </button>
                <button onClick={() => setShowDeleteModal(true)}
                  className={"w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border transition-all " +
                    (isDark ? "border-red-900 text-red-400 hover:bg-red-500/10" : "border-red-200 text-red-600 hover:bg-red-50")}>
                  <Trash2 size={13} /> Supprimer le client
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className={cardClass + " p-5"}>
              <p className={"text-xs font-medium uppercase tracking-wider mb-4 " + (isDark ? "text-zinc-600" : "text-gray-400")}>
                Statistiques
              </p>
              <div className="space-y-3">
                {[
                  { label: "Total analyses", value: client.nb_analyses || 0 },
                  { label: "Accordés", value: nbAccordes, color: "emerald" },
                  { label: "Refusés", value: nbRefuses, color: "red" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className={"text-xs " + (isDark ? "text-zinc-400" : "text-gray-500")}>{label}</span>
                    <span className={"text-sm font-semibold " +
                      (color === "emerald" ? (isDark ? "text-emerald-400" : "text-emerald-600") :
                       color === "red" ? (isDark ? "text-red-400" : "text-red-600") :
                       (isDark ? "text-white" : "text-gray-800"))}>
                      {value}
                    </span>
                  </div>
                ))}
                {derniereAnalyse && (
                  <div className={"pt-3 border-t " + borderB}>
                    <p className={"text-xs mb-1.5 " + (isDark ? "text-zinc-500" : "text-gray-400")}>Dernière décision</p>
                    <span className={"text-xs px-2.5 py-1 rounded-full border font-medium " +
                      (derniereAnalyse.decision === "ACCORDÉ"
                        ? (isDark ? "border-emerald-800 text-emerald-400" : "border-emerald-200 text-emerald-700")
                        : (isDark ? "border-red-800 text-red-400" : "border-red-200 text-red-700"))}>
                      {derniereAnalyse.decision}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Colonnes droites ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Infos personnelles */}
            <div className={cardClass + " p-5"}>
              <div className={"flex items-center gap-2 mb-5 pb-4 border-b " + borderB}>
                <User size={15} className={isDark ? "text-zinc-500" : "text-gray-400"} />
                <h3 className={"font-semibold text-sm " + (isDark ? "text-white" : "text-gray-800")}>
                  Informations personnelles
                </h3>
              </div>

              {editMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: "nom", label: "Nom *", placeholder: "NOM" },
                    { name: "prenom", label: "Prénom *", placeholder: "Prénom" },
                    { name: "telephone", label: "Téléphone", placeholder: "+221 77 000 00 00" },
                    { name: "email", label: "Email", placeholder: "email@exemple.com", type: "email" },
                    { name: "date_naissance", label: "Date de naissance", type: "date" },
                    { name: "num_piece", label: "N° Pièce d'identité", placeholder: "CNI-123456" },
                  ].map(({ name, label, placeholder, type }) => (
                    <div key={name}>
                      <label className={labelClass}>{label}</label>
                      <input
                        type={type || "text"}
                        value={editForm[name]}
                        onChange={e => setEditForm(p => ({ ...p, [name]: e.target.value }))}
                        placeholder={placeholder}
                        className={inputClass}
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Adresse</label>
                    <input value={editForm.adresse}
                      onChange={e => setEditForm(p => ({ ...p, adresse: e.target.value }))}
                      placeholder="Rue, Ville, Pays" className={inputClass} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: User, label: "Nom complet", value: client.prenom + " " + client.nom },
                    { icon: CreditCard, label: "N° Pièce d'identité", value: client.num_piece },
                    { icon: Phone, label: "Téléphone", value: client.telephone },
                    { icon: Mail, label: "Email", value: client.email },
                    { icon: Calendar, label: "Date de naissance", value: client.date_naissance },
                    { icon: Clock, label: "Client depuis", value: client.date_creation },
                    { icon: MapPin, label: "Adresse", value: client.adresse },
                  ].filter(f => f.value).map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2.5">
                      <Icon size={13} className={"mt-0.5 flex-shrink-0 " + (isDark ? "text-zinc-600" : "text-gray-400")} />
                      <div>
                        <p className={infoLabelClass}>{label}</p>
                        <p className={valueClass}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historique analyses */}
            <div className={cardClass + " overflow-hidden"}>
              <div className={"flex items-center justify-between p-5 border-b " + borderB}>
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className={isDark ? "text-zinc-500" : "text-gray-400"} />
                  <h3 className={"font-semibold text-sm " + (isDark ? "text-white" : "text-gray-800")}>
                    Historique des analyses
                  </h3>
                </div>
                <span className={"text-xs px-2.5 py-1 rounded-full border " +
                  (isDark ? "border-zinc-800 text-zinc-500" : "border-gray-200 text-gray-400")}>
                  {client.nb_analyses || 0}
                </span>
              </div>

              {!client.analyses || client.analyses.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle size={28} className={"mx-auto mb-3 " + (isDark ? "text-zinc-700" : "text-gray-300")} />
                  <p className={"text-sm " + (isDark ? "text-zinc-500" : "text-gray-400")}>
                    Aucune analyse pour ce client
                  </p>
                  <button onClick={() => navigate("/analyse")}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium">
                    Lancer une analyse
                  </button>
                </div>
              ) : (
                <>
                  {/* Tableau desktop */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={"text-xs uppercase tracking-wider border-b " + borderB +
                          " " + (isDark ? "text-zinc-600" : "text-gray-400")}>
                          <th className="text-left py-3 px-5">Date</th>
                          <th className="text-right py-3">Crédit</th>
                          <th className="text-right py-3">Revenu</th>
                          <th className="text-center py-3">Risque</th>
                          <th className="text-right py-3">Prob.</th>
                          <th className="text-center py-3 pr-5">Décision</th>
                        </tr>
                      </thead>
                      <tbody>
                        {client.analyses.map(a => {
                          const riskCls = "text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap " + (
                            a.niveau_risque === "FAIBLE"     ? (isDark ? "border-emerald-800 text-emerald-400" : "border-emerald-200 text-emerald-700") :
                            a.niveau_risque === "MODÉRÉ"     ? (isDark ? "border-amber-800 text-amber-400"     : "border-amber-200 text-amber-700") :
                            a.niveau_risque === "ÉLEVÉ"      ? (isDark ? "border-orange-800 text-orange-400"   : "border-orange-200 text-orange-700") :
                            (isDark ? "border-red-800 text-red-400" : "border-red-200 text-red-700")
                          )
                          const decCls = "text-xs px-2 py-0.5 rounded-full border font-medium " + (
                            a.decision === "ACCORDÉ"
                              ? (isDark ? "border-emerald-800 text-emerald-400" : "border-emerald-200 text-emerald-700")
                              : (isDark ? "border-red-800 text-red-400" : "border-red-200 text-red-700")
                          )
                          return (
                            <tr key={a.id} className={"border-t text-sm transition-colors " +
                              (isDark ? "border-zinc-800/50 hover:bg-zinc-800/20" : "border-gray-50 hover:bg-gray-50/80")}>
                              <td className={"py-3 px-5 text-xs " + (isDark ? "text-zinc-400" : "text-gray-500")}>{a.date}</td>
                              <td className={"py-3 text-right text-xs " + (isDark ? "text-zinc-300" : "text-gray-600")}>{a.credit?.toLocaleString()} FCFA</td>
                              <td className={"py-3 text-right text-xs " + (isDark ? "text-zinc-300" : "text-gray-600")}>{a.revenu?.toLocaleString()} FCFA</td>
                              <td className="py-3 text-center"><span className={riskCls}>{a.niveau_risque}</span></td>
                              <td className={"py-3 text-right text-xs font-medium " + (a.probabilite_defaut > 50 ? "text-red-500" : "text-emerald-500")}>
                                {a.probabilite_defaut}%
                              </td>
                              <td className="py-3 text-center pr-5"><span className={decCls}>{a.decision}</span></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Cards mobile */}
                  <div className="sm:hidden divide-y" style={{ divideColor: isDark ? "#27272a" : "#f9fafb" }}>
                    {client.analyses.map(a => {
                      const decCls = "text-xs px-2 py-0.5 rounded-full border font-medium " + (
                        a.decision === "ACCORDÉ"
                          ? (isDark ? "border-emerald-800 text-emerald-400" : "border-emerald-200 text-emerald-700")
                          : (isDark ? "border-red-800 text-red-400" : "border-red-200 text-red-700")
                      )
                      return (
                        <div key={a.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className={"text-xs " + (isDark ? "text-zinc-500" : "text-gray-400")}>{a.date}</span>
                            <span className={decCls}>{a.decision}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className={"text-xs " + (isDark ? "text-zinc-600" : "text-gray-400")}>Crédit</p>
                              <p className={"text-xs font-medium " + (isDark ? "text-zinc-300" : "text-gray-700")}>{a.credit?.toLocaleString()} FCFA</p>
                            </div>
                            <div>
                              <p className={"text-xs " + (isDark ? "text-zinc-600" : "text-gray-400")}>Probabilité</p>
                              <p className={"text-xs font-bold " + (a.probabilite_defaut > 50 ? "text-red-500" : "text-emerald-500")}>
                                {a.probabilite_defaut}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {showDeleteModal && (
        <ModalSuppression
          client={client}
          isDark={isDark}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleting}
        />
      )}
    </div>
  )
}