// src/views/Forecast.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react'
import api from '../utils/api'
import {
  CCard, CCardHeader, CCardBody, CForm, CRow, CCol,
  CFormTextarea, CFormInput, CFormSwitch, CButton,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CAlert, CSpinner, CBadge,
} from '@coreui/react'

/* ========================= Chatbot (widget flottant) ========================= */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Chatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Bonjour 👋 Pose-moi une question (ex: 'stock casque M', 'prévision gants L 3 mois', 'à commander 2 mois sécurité 5')." }
  ])
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  const scrollToBottom = () => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }
  useEffect(scrollToBottom, [messages, open])

  const send = async () => {
    const text = input.trim()
    if (!text) return
    setMessages(m => [...m, { from: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const r = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept':'application/json' },
        body: JSON.stringify({ message: text })
      })
      const data = await r.json()
      setMessages(m => [...m, { from: 'bot', text: data?.reply || "Pardon, je n'ai pas compris." }])
    } catch (e) {
      setMessages(m => [...m, { from: 'bot', text: "Erreur de connexion à l'API." }])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 9999 }}>
        <CButton color="primary" className="rounded-circle shadow" style={{ width: 56, height: 56 }}
          onClick={() => setOpen(o => !o)}>
          💬
        </CButton>
      </div>

      {open && (
        <div style={{
          position: 'fixed', right: 24, bottom: 96, width: 360, maxWidth: '90vw',
          background: '#fff', border: '1px solid #ddd', borderRadius: 12,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 9999
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #eee', fontWeight: 600 }}>
            Assistant EPI
          </div>

          <div ref={listRef} style={{ height: 360, overflowY: 'auto', padding: 12, background: '#fafafa' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start', margin: '6px 0'
              }}>
                <div style={{
                  maxWidth: '80%', whiteSpace: 'pre-wrap',
                  background: m.from === 'user' ? '#321fdb' : '#fff',
                  color: m.from === 'user' ? '#fff' : '#333',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12, padding: '8px 10px'
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div style={{ color: '#666', fontSize: 13 }}>… le bot réfléchit</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #eee' }}>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Écrivez un message…"
              style={{ flex: 1, resize: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '8px 10px' }}
            />
            <CButton color="primary" onClick={send} disabled={loading || !input.trim()}>
              Envoyer
            </CButton>
          </div>
        </div>
      )}
    </>
  )
}

/* ========================= Page Forecast ========================= */
const SAMPLE_SERIES = {
  horizon_months: 6,
  series: [
    {
      materiel_id: 1,
      taille_id: 2,
      points: [
        { ds: '2024-01-01', y: 12 },
        { ds: '2024-02-01', y: 8 },
        { ds: '2024-03-01', y: 10 },
        { ds: '2024-04-01', y: 0 },
        { ds: '2024-05-01', y: 14 },
        { ds: '2024-06-01', y: 9 },
      ],
    },
  ],
}

export default function Forecast() {
  const [useDb, setUseDb] = useState(false)
  const [months, setMonths] = useState(12)
  const [horizon, setHorizon] = useState(6)

  // 🔽 NOUVEAU : champs qui acceptent NOMS **ou** IDs (séparés par des virgules)
  const [materielQuery, setMaterielQuery] = useState('') // ex: "Casque, Gants, 5"
  const [tailleQuery, setTailleQuery] = useState('')     // ex: "M, L, 2"

  const [rawJson, setRawJson] = useState(JSON.stringify(SAMPLE_SERIES, null, 2))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])

  // ---- helpers ----
  const splitTerms = (txt) =>
    (txt || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

  const isNumeric = (s) => /^\d+$/.test(s)

  // Résout une liste de termes (noms/IDs) -> IDs via API
  // type = 'materiels' | 'tailles'
  const resolveIds = async (terms, type) => {
    // Garder les IDs déjà numériques
    const ids = terms.filter(isNumeric).map(s => parseInt(s, 10))

    // Noms à résoudre
    const names = terms.filter(t => !isNumeric(t))
    if (names.length === 0) return ids

    // Essaye un endpoint avec filtre q=term, sinon fallback (liste complète + filtrage)
    const trySearchOne = async (term) => {
      try {
        // Endpoint principal attendu (à implémenter côté Laravel)
        // /api/epi/materiels?q=Casque → [{id, nom}, ...]
        // /api/epi/tailles?q=M       → [{id, nom}, ...]
        const { data } = await api.get(`/epi/${type}`, { params: { q: term } })
        if (Array.isArray(data) && data.length > 0) {
          // prend le premier match (adapter selon logique)
          return data[0].id
        }
      } catch (_) {
        // Fallback: récupérer tout puis filtrer côté client
        try {
          const { data } = await api.get(`/epi/${type}`)
          if (Array.isArray(data)) {
            const found = data.find(item =>
              String(item.nom || item.name || '').toLowerCase() === term.toLowerCase()
            ) || data.find(item =>
              String(item.nom || item.name || '').toLowerCase().includes(term.toLowerCase())
            )
            if (found) return found.id
          }
        } catch {
          // ignore
        }
      }
      return null
    }

    const resolved = await Promise.all(names.map(trySearchOne))
    resolved.forEach(id => { if (id != null) ids.push(id) })
    return ids
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setRows([])
    setLoading(true)

    try {
      let payload

      if (useDb) {
        // 🔽 Résolution noms -> IDs avant envoi
        const materielTerms = splitTerms(materielQuery) // noms ou ids
        const tailleTerms   = splitTerms(tailleQuery)   // noms ou ids

        const materiel_ids = await resolveIds(materielTerms, 'materiels')
        const taille_ids   = await resolveIds(tailleTerms, 'tailles')

        if (materielTerms.length && materiel_ids.length === 0) {
          throw new Error("Aucun matériel correspondant aux termes saisis.")
        }
        if (tailleTerms.length && taille_ids.length === 0) {
          throw new Error("Aucune taille correspondante aux termes saisis.")
        }

        const mh = Number(horizon)
        const mm = Number(months)
        payload = {
          from_db: true,
          months: Number.isFinite(mm) ? mm : 12,
          horizon_months: Number.isFinite(mh) ? mh : 6,
          materiel_ids,
          taille_ids,
        }
      } else {
        // Mode manuel (payload JSON)
        let data
        try {
          data = JSON.parse(rawJson)
        } catch {
          throw new Error("Le JSON fourni n'est pas valide.")
        }
        const mh = Number(horizon)
        if (Number.isFinite(mh) && mh > 0) data.horizon_months = mh
        payload = data
      }

      const { data } = await api.post('/epi/forecast', payload)
      if (data?.error) setError(String(data.error))
      setRows(Array.isArray(data?.forecasts) ? data.forecasts : [])
      if (!data?.forecasts?.length && data?.note && !data?.error) {
        setError(String(data.note))
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Erreur lors de la prévision.'
      setError(String(msg))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const grouped = useMemo(() => {
    const g = {}
    for (const r of rows) {
      const key = `${r.materiel_id}#${r.taille_id ?? 'null'}`
      if (!g[key]) g[key] = []
      g[key].push(r)
    }
    Object.values(g).forEach((arr) =>
      arr.sort((a, b) => String(a.periode).localeCompare(String(b.periode))),
    )
    return g
  }, [rows])

  return (
    <div className="container-fluid px-4">
      <CCard className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
        <CCardHeader
          className="d-flex justify-content-between align-items-center border-0"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            padding: '1.5rem',
          }}
        >
          <div className="d-flex align-items-center">
            <div className="me-3" style={{ fontSize: '1.5rem' }}></div>
            <div>
              <h4 className="mb-0 fw-bold">Prévision des consommations</h4>
              <small className="opacity-75">Équipements de Protection Individuelle (EPI)</small>
            </div>
          </div>
          <CBadge color="light" className="text-dark fw-bold px-3 py-2" style={{ fontSize: '0.9rem', borderRadius: '20px' }}>
             AI
          </CBadge>
        </CCardHeader>

        <CCardBody style={{ padding: '2rem' }}>
          <CForm onSubmit={handleSubmit}>
            {/* Configuration */}
            <div className="mb-4">
              <h5 className="mb-3 text-muted d-flex align-items-center">
                <span className="me-2">⚙️</span>
                Configuration
              </h5>
              <div
                className="p-4 mb-4"
                style={{
                  background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)',
                  borderRadius: '10px',
                  border: '1px solid #e3e7ff',
                }}
              >
                <CRow className="g-4">
                  <CCol md={6} lg={3}>
                    <div className="position-relative">
                      <CFormSwitch
                        id="useDbSwitch"
                        label="Générer depuis la base de données"
                        checked={useDb}
                        onChange={(e) => setUseDb(e.target.checked)}
                        style={{ fontSize: '1.1rem' }}
                      />
                      <small className="text-muted d-block mt-1">
                        Utiliser les données historiques des stocks
                      </small>
                    </div>
                  </CCol>

                  <CCol md={6} lg={3}>
                    <CFormInput
                      type="number"
                      label={<span className="fw-semibold"><span className="me-1"></span>Horizon (mois)</span>}
                      min={1}
                      max={24}
                      value={horizon}
                      onChange={(e) => setHorizon(parseInt(e.target.value || '0', 10) || 0)}
                      className="form-control-lg"
                      style={{ borderRadius: '8px' }}
                    />
                  </CCol>

                  {useDb && (
                    <>
                      <CCol md={6} lg={2}>
                        <CFormInput
                          type="number"
                          label={<span className="fw-semibold"><span className="me-1"></span>Historique (mois)</span>}
                          min={6}
                          max={48}
                          value={months}
                          onChange={(e) => setMonths(parseInt(e.target.value || '0', 10) || 0)}
                          className="form-control-lg"
                          style={{ borderRadius: '8px' }}
                        />
                      </CCol>

                      {/* 🔽 NOUVEAU : champs noms/IDs */}
                      <CCol md={6} lg={2}>
                        <CFormInput
                          label={<span className="fw-semibold"><span className="me-1">🔧</span>Matériels (noms ou IDs)</span>}
                          placeholder="ex: Casque, Gants, 5"
                          value={materielQuery}
                          onChange={(e) => setMaterielQuery(e.target.value)}
                          className="form-control-lg"
                          style={{ borderRadius: '8px' }}
                        />
                      </CCol>

                      <CCol md={6} lg={2}>
                        <CFormInput
                          label={<span className="fw-semibold"><span className="me-1">📏</span>Tailles (noms ou IDs)</span>}
                          placeholder="ex: M, L, 2"
                          value={tailleQuery}
                          onChange={(e) => setTailleQuery(e.target.value)}
                          className="form-control-lg"
                          style={{ borderRadius: '8px' }}
                        />
                      </CCol>
                    </>
                  )}
                </CRow>
              </div>
            </div>

            {/* JSON manuel */}
            {!useDb && (
              <div className="mb-4">
                <h5 className="mb-3 text-muted d-flex align-items-center">
                  <span className="me-2"></span>
                  Données personnalisées
                </h5>
                <div
                  className="p-4"
                  style={{
                    background: 'linear-gradient(135deg, #fff8f0 0%, #fff4e8 100%)',
                    borderRadius: '10px',
                    border: '1px solid #ffe8d1',
                  }}
                >
                  <CFormTextarea
                    label={<span className="fw-semibold"><span className="me-1">🔗</span>Payload JSON (series)</span>}
                    rows={12}
                    value={rawJson}
                    onChange={(e) => setRawJson(e.target.value)}
                    spellCheck={false}
                    style={{
                      fontFamily: 'Monaco, "Lucida Console", monospace',
                      fontSize: '0.9rem',
                      borderRadius: '8px',
                      border: '2px solid #f0f0f0',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Boutons */}
            <div className="mb-4">
              <div
                className="p-4 text-center"
                style={{
                  background: 'linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%)',
                  borderRadius: '10px',
                  border: '1px solid #d1fae5',
                }}
              >
                <CButton
                  type="submit"
                  color="primary"
                  disabled={loading}
                  size="lg"
                  className="me-3 px-5 py-2"
                  style={{
                    borderRadius: '25px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    fontWeight: '600',
                  }}
                >
                  {loading ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <span className="me-2"></span>
                      Lancer la prévision
                    </>
                  )}
                </CButton>

                {!useDb && (
                  <CButton
                    type="button"
                    color="secondary"
                    variant="outline"
                    size="lg"
                    className="px-4 py-2"
                    style={{ borderRadius: '25px', fontWeight: '600' }}
                    onClick={() => setRawJson(JSON.stringify(SAMPLE_SERIES, null, 2))}
                  >
                    <span className="me-2">💡</span>
                    Charger l'exemple
                  </CButton>
                )}
              </div>
            </div>
          </CForm>

          {/* Erreurs */}
          {error && (
            <CAlert
              color="danger"
              className="mb-4"
              style={{
                borderRadius: '10px',
                border: '1px solid #fecaca',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              }}
            >
              <div className="d-flex align-items-center">
                <span className="me-2" style={{ fontSize: '1.2rem' }}>⚠️</span>
                <strong>{error}</strong>
              </div>
            </CAlert>
          )}

          {/* Résultats */}
          {rows.length > 0 && (
            <div>
              <h5 className="mb-4 text-muted d-flex align-items-center">
                <span className="me-2"></span>
                Résultats de la prévision
                <CBadge color="success" className="ms-2">
                  {Object.keys(grouped).length} série(s)
                </CBadge>
              </h5>

              {Object.entries(grouped).map(([key, arr]) => {
                const [mid, tid] = key.split('#')
                return (
                  <div
                    key={key}
                    className="mb-5"
                    style={{
                      background: 'linear-gradient(135deg, #fafbff 0%, #f4f6ff 100%)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid #e0e7ff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0 fw-bold text-primary">
                        <span className="me-2"></span>
                        Matériel #{mid} — Taille #{tid === 'null' ? '—' : tid}
                      </h6>
                      <CBadge color="info" className="px-3 py-1">
                        {arr.length} période(s)
                      </CBadge>
                    </div>

                    <div className="table-responsive">
                      <CTable
                        hover
                        className="mb-0"
                        style={{
                          borderRadius: '8px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      >
                        <CTableHead
                          style={{
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            color: 'white',
                          }}
                        >
                          <CTableRow>
                            <CTableHeaderCell className="fw-bold py-3">📅 Période</CTableHeaderCell>
                            <CTableHeaderCell className="fw-bold py-3 text-center">
                              📊 Prévu
                            </CTableHeaderCell>
                            <CTableHeaderCell className="fw-bold py-3 text-center">
                              📉 Min
                            </CTableHeaderCell>
                            <CTableHeaderCell className="fw-bold py-3 text-center">
                              📈 Max
                            </CTableHeaderCell>
                            <CTableHeaderCell className="fw-bold py-3 text-center">
                              🤖 Modèle
                            </CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {arr.map((r, i) => (
                            <CTableRow
                              key={`${r.periode}-${i}`}
                              style={{
                                background: i % 2 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(248,250,252,0.8)',
                              }}
                            >
                              <CTableDataCell className="fw-semibold py-3">{r.periode}</CTableDataCell>
                              <CTableDataCell className="text-center py-3">
                                <span className="fw-bold text-primary fs-6">{r.qte_prevue}</span>
                              </CTableDataCell>
                              <CTableDataCell className="text-center py-3 text-success">
                                {r.qte_inf}
                              </CTableDataCell>
                              <CTableDataCell className="text-center py-3 text-warning">
                                {r.qte_sup}
                              </CTableDataCell>
                              <CTableDataCell className="text-center py-3">
                                <CBadge
                                  color={r.modele === 'prophet' ? 'success' : 'secondary'}
                                  className="px-3 py-1"
                                  style={{ borderRadius: '15px', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem' }}
                                >
                                  {r.modele}
                                </CBadge>
                              </CTableDataCell>
                            </CTableRow>
                          ))}
                        </CTableBody>
                      </CTable>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* Chatbot flottant disponible sur la page Forecast */}
      <Chatbot />
    </div>
  )
}
