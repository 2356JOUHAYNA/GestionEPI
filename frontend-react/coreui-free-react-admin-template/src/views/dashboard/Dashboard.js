// src/views/dashboard/Dashboard.js
import React, { useEffect, useMemo, useState } from 'react'
import {
  CButton, CBadge, CCard, CCardBody, CCardFooter, CCardHeader,
  CCol, CRow, CTable, CTableBody, CTableDataCell, CTableHead,
  CTableHeaderCell, CTableRow, CFormSelect, CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilChart, cilReload } from '@coreui/icons'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

/* ========= CONFIG ========= */
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const HORIZON_MONTHS = 6
const USE_MOCK = false // mettre à false pour la vraie API

const WidgetsDropdown = () => null
const WidgetsBrand = () => null

export default function Dashboard() {
  /* ===== States ===== */
  const [materiels, setMateriels] = useState([]) // [{id, nom}]
  const [tailles, setTailles] = useState([])     // [{id, nom}]
  const [selectedMateriel, setSelectedMateriel] = useState(null) // id
  const [selectedTaille, setSelectedTaille] = useState(null)     // id

  const [forecastData, setForecastData] = useState([]) // [{date, prev}]
  const [materielName, setMaterielName] = useState('')
  const [tailleName, setTailleName] = useState('')

  const [recoRows, setRecoRows] = useState([]) // tableau reco global
  const [loading, setLoading] = useState(true)
  const [loadingGraph, setLoadingGraph] = useState(false)
  const [error, setError] = useState(null)

  const MOCK_FORECAST = [
    { date: '2025-09', prev: 716 },
    { date: '2025-10', prev: 0 },
    { date: '2025-11', prev: 185 },
    { date: '2025-12', prev: 679 },
    { date: '2026-01', prev: 163 },
    { date: '2026-02', prev: 357 },
  ]
  const MOCK_RECO = [
    { materiel: 'Casque de sécurité',     taille: 'M',  stock_actuel: 15, demande_window: 25, a_commander: 10 },
    { materiel: 'Gants de protection',    taille: 'L',  stock_actuel: 30, demande_window: 20, a_commander: 0  },
    { materiel: 'Chaussures de sécurité', taille: '42', stock_actuel: 8,  demande_window: 15, a_commander: 7  },
  ]

  /* ===== helpers ===== */
  const currentMateriel = useMemo(
    () => materiels.find(m => Number(m.id) === Number(selectedMateriel)) || null,
    [materiels, selectedMateriel]
  )
  const currentTaille = useMemo(
    () => tailles.find(t => Number(t.id) === Number(selectedTaille)) || null,
    [tailles, selectedTaille]
  )

  /* ===== Load lists + reco at mount ===== */
  useEffect(() => {
    const ac = new AbortController()
    const bootstrap = async () => {
      setLoading(true)
      setError(null)
      try {
        // 1) Materiels
        const mRes = await fetch(`${API}/api/epi/materiels`, { signal: ac.signal })
        if (!mRes.ok) throw new Error(`Materiels: ${mRes.status} ${mRes.statusText}`)
        const mJson = await mRes.json()
        setMateriels(mJson || [])
        const firstMaterielId = (mJson?.[0]?.id) ?? null
        setSelectedMateriel(firstMaterielId)

        // 2) Tailles for first materiel
        if (firstMaterielId) {
          const tRes = await fetch(`${API}/api/epi/materiels/${firstMaterielId}/tailles`, { signal: ac.signal })
          if (!tRes.ok) throw new Error(`Tailles: ${tRes.status} ${tRes.statusText}`)
          const tJson = await tRes.json()
          setTailles(tJson || [])
          setSelectedTaille((tJson?.[0]?.id) ?? null)
        }

        // 3) Recommandations (globales)
        const r = await fetch(`${API}/api/epi/reco-appro?months=2&safety=5`, { signal: ac.signal })
        if (r.ok) {
          const rows = await r.json()
          const mapped = (Array.isArray(rows) ? rows : []).map(x => ({
            materiel: x.materiel ?? '',
            taille: String(x.taille ?? ''),
            stock_actuel: Number(x.stock_actuel ?? 0) || 0,
            demande_window: Number((x.demande_window ?? x.demande) ?? 0) || 0,
            a_commander: Number(x.a_commander ?? 0) || 0,
          }))
          setRecoRows(mapped.length ? mapped : MOCK_RECO)
        } else {
          setRecoRows(MOCK_RECO)
          setError(prev => (prev ? `${prev} | ` : '') + `Reco: ${r.status} ${r.statusText}`)
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          setError(e.message)
          setRecoRows(MOCK_RECO)
        }
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
    return () => ac.abort()
  }, [])

  /* ===== Fetch previsions when materiel/taille change ===== */
  useEffect(() => {
    if (!selectedMateriel || !selectedTaille) return
    const ac = new AbortController()
    const loadForecast = async () => {
      setLoadingGraph(true)
      setError(null)
      try {
        if (USE_MOCK) {
          setForecastData(MOCK_FORECAST)
          setMaterielName(currentMateriel?.nom ?? '')
          setTailleName(currentTaille?.nom ?? '')
        } else {
          const f = await fetch(
            `${API}/api/epi/previsions?materiel_id=${selectedMateriel}&taille_id=${selectedTaille}&months=${HORIZON_MONTHS}`,
            { signal: ac.signal }
          )
          if (f.ok) {
            const rows = await f.json()
            const data = (Array.isArray(rows) ? rows : []).map(r => ({
              date: r.periode ?? r.date ?? '',
              prev: Number(r.qte_prevue ?? r.prev ?? 0) || 0,
            }))
            setForecastData(data.length ? data : MOCK_FORECAST)
            // noms renvoyés par l'API (version enrichie du backend)
            if (rows?.length) {
              setMaterielName(rows[0].materiel_nom ?? (currentMateriel?.nom ?? ''))
              setTailleName(rows[0].taille_nom ?? (currentTaille?.nom ?? ''))
            } else {
              setMaterielName(currentMateriel?.nom ?? '')
              setTailleName(currentTaille?.nom ?? '')
            }
          } else {
            setForecastData(MOCK_FORECAST)
            setMaterielName(currentMateriel?.nom ?? '')
            setTailleName(currentTaille?.nom ?? '')
            setError(prev => (prev ? `${prev} | ` : '') + `Prévisions: ${f.status} ${f.statusText}`)
          }
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          setError(e.message)
          setForecastData(MOCK_FORECAST)
          setMaterielName(currentMateriel?.nom ?? '')
          setTailleName(currentTaille?.nom ?? '')
        }
      } finally {
        setLoadingGraph(false)
      }
    }
    loadForecast()
    return () => ac.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMateriel, selectedTaille])

  /* ===== Handlers ===== */
  const onChangeMateriel = async (e) => {
    const id = Number(e.target.value) || null
    setSelectedMateriel(id)
    setSelectedTaille(null)
    setTailles([])
    if (!id) return
    try {
      const tRes = await fetch(`${API}/api/epi/materiels/${id}/tailles`)
      if (tRes.ok) {
        const tJson = await tRes.json()
        setTailles(tJson || [])
        setSelectedTaille((tJson?.[0]?.id) ?? null)
      }
    } catch {}
  }
  const onChangeTaille = (e) => setSelectedTaille(Number(e.target.value) || null)

  const onExport = () => {
    const blob = new Blob([JSON.stringify(recoRows, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recommandations_${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Chargement…</span>
          </div>
          <p className="text-muted">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold text-primary">Tableau de Bord EPI</h2>
          <p className="text-muted mb-0">Gestion et prévisions des équipements de protection individuelle</p>
        </div>
        <CButton color="primary" className="shadow-sm" onClick={() => window.location.reload()}>
          <CIcon icon={cilReload} className="me-2" />
          Actualiser
        </CButton>
      </div>

      {error && (
        <CCard className="mb-4 border-warning shadow-sm">
          <CCardBody className="bg-warning-subtle">
            <div className="d-flex align-items-center">
              <CIcon icon={cilChart} className="text-warning me-2" size="lg" />
              <div>
                <strong className="text-warning">Mode Démo</strong>
                <div className="text-warning-emphasis small">
                  Données d'exemple possibles — {error}
                </div>
              </div>
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* ===== Graph Prévisions ===== */}
      <CCard className="mb-5 shadow-sm border-0">
        <CCardHeader className="bg-gradient border-0 py-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h4 className="card-title mb-1 fw-semibold">📈 Prévisions EPI</h4>
              <div className="small text-body-secondary">
                {materielName && tailleName
                  ? <>Matériel : <strong>{materielName}</strong> — Taille : <strong>{tailleName}</strong></>
                  : <>Analyse prévisionnelle sur les prochains {HORIZON_MONTHS} mois</>}
              </div>
            </div>

            {/* Filtres */}
            <div className="d-flex align-items-center gap-2">
              <CFormSelect
                value={selectedMateriel ?? ''}
                onChange={onChangeMateriel}
                aria-label="Choisir un matériel"
                className="min-w-200"
              >
                <option value="">— Matériel —</option>
                {materiels.map(m => (
                  <option key={m.id} value={m.id}>{m.nom}</option>
                ))}
              </CFormSelect>

              <CFormSelect
                value={selectedTaille ?? ''}
                onChange={onChangeTaille}
                aria-label="Choisir une taille"
                disabled={!tailles.length}
                className="min-w-160"
              >
                <option value="">— Taille —</option>
                {tailles.map(t => (
                  <option key={t.id} value={t.id}>{t.nom}</option>
                ))}
              </CFormSelect>

              <CBadge color="primary" className="px-3 py-2">Horizon: {HORIZON_MONTHS} mois</CBadge>
            </div>
          </div>
        </CCardHeader>

        <CCardBody className="p-4">
          <div style={{ width: '100%', height: 400, position: 'relative' }}>
            {loadingGraph && (
              <div className="position-absolute top-0 bottom-0 start-0 end-0 d-flex align-items-center justify-content-center"
                   style={{ background: 'rgba(255,255,255,0.6)', zIndex: 2 }}>
                <CSpinner color="primary" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis dataKey="date" stroke="#6c757d" fontSize={12} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#6c757d" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  labelFormatter={(label) =>
                    materielName && tailleName ? `${label} — ${materielName} (${tailleName})` : label
                  }
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="prev"
                  name={materielName && tailleName ? `Prévision — ${materielName} (${tailleName})` : 'Quantité Prévue'}
                  stroke="#321fdb"
                  strokeWidth={3}
                  dot={{ fill: '#321fdb', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#321fdb', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CCardBody>
      </CCard>

      <WidgetsBrand className="mb-4" withCharts />

      {/* ===== Tableau Recommandations (global) ===== */}
      <CRow>
        <CCol xs>
          <CCard className="shadow-sm border-0">
            <CCardHeader className="bg-gradient border-0 py-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="card-title mb-1 fw-semibold">Recommandations de Commande</h4>
                  <div className="small text-body-secondary">
                    Analyse basée sur une fenêtre de 2 mois avec stock de sécurité de 5 unités
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <CBadge color="info" className="px-2 py-1">Fenêtre: 2 mois</CBadge>
                  <CBadge color="secondary" className="px-2 py-1">Sécurité: 5 unités</CBadge>
                </div>
              </div>
            </CCardHeader>
            <CCardBody className="p-0">
              <div className="table-responsive">
                <CTable align="middle" className="mb-0" hover>
                  <CTableHead className="bg-light">
                    <CTableRow>
                      <CTableHeaderCell className="fw-semibold py-3 ps-4">Matériel</CTableHeaderCell>
                      <CTableHeaderCell className="fw-semibold py-3">Taille</CTableHeaderCell>
                      <CTableHeaderCell className="text-center fw-semibold py-3">Stock Actuel</CTableHeaderCell>
                      <CTableHeaderCell className="text-center fw-semibold py-3">Demande (2 mois)</CTableHeaderCell>
                      <CTableHeaderCell className="text-center fw-semibold py-3 pe-4">À Commander</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {recoRows.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={5} className="text-center text-muted py-5">
                          <div>
                            <CIcon icon={cilChart} size="xl" className="text-muted mb-2" />
                            <div>Aucune donnée disponible</div>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      recoRows.map((r) => (
                        <CTableRow
                          key={`${r.materiel}-${r.taille}`}
                          className={r.a_commander > 0
                            ? 'table-danger-subtle border-start border-danger border-3'
                            : 'border-start border-success border-3'}
                        >
                          <CTableDataCell className="fw-medium py-3 ps-4">{r.materiel}</CTableDataCell>
                          <CTableDataCell className="py-3">
                            <CBadge color="light" className="text-dark">{r.taille}</CBadge>
                          </CTableDataCell>
                          <CTableDataCell className="text-center py-3"><span className="fw-medium">{r.stock_actuel}</span></CTableDataCell>
                          <CTableDataCell className="text-center py-3"><span className="fw-medium">{r.demande_window ?? '-'}</span></CTableDataCell>
                          <CTableDataCell className="text-center py-3 pe-4">
                            {r.a_commander > 0 ? (
                              <CBadge color="danger" className="px-3 py-2 rounded-pill fw-medium" style={{ fontSize: '0.85rem' }}>
                                {r.a_commander} unités
                              </CBadge>
                            ) : (
                              <CBadge color="success" className="px-3 py-2 rounded-pill fw-medium" style={{ fontSize: '0.85rem' }}>
                                ✓ Stock OK
                              </CBadge>
                            )}
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
              </div>
            </CCardBody>
            {recoRows.length > 0 && (
              <CCardFooter className="bg-light border-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    {recoRows.filter(r => r.a_commander > 0).length} article(s) à commander sur {recoRows.length} analysé(s)
                  </small>
                  <CButton color="primary" size="sm" onClick={onExport}>
                    <CIcon icon={cilCloudDownload} className="me-1" />
                    Exporter
                  </CButton>
                </div>
              </CCardFooter>
            )}
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}
