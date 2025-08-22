// src/views/dashboard/Dashboard.js
import React, { useEffect, useState } from 'react'
import classNames from 'classnames'
import {
  CButton, CButtonGroup, CCard, CCardBody, CCardFooter, CCardHeader,
  CCol, CProgress, CRow, CTable, CTableBody, CTableDataCell, CTableHead,
  CTableHeaderCell, CTableRow, CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cibGoogle, cibFacebook, cibLinkedin, cibTwitter,
  cilCloudDownload, cilUser, cilUserFemale, cilChart, cilReload
} from '@coreui/icons'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// ========= CONFIG API =========
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const DEFAULT_MATERIEL_ID = 1
const DEFAULT_TAILLE_ID = 1
const HORIZON_MONTHS = 6

// 🔒 Mettre à false quand l'API est prête pour les prévisions
const USE_MOCK = true

// Placeholders sûrs (évite les erreurs si les widgets n'existent pas)
const WidgetsDropdown = () => null
const WidgetsBrand = () => null

export default function Dashboard() {
  // --- KPI démo CoreUI ---
  const progressExample = [
    { title: 'Visites', value: '29.703 Utilisateurs', percent: 40, color: 'success' },
    { title: 'Uniques', value: '24.093 Utilisateurs', percent: 20, color: 'info' },
    { title: 'Pages vues', value: '78.706 Vues', percent: 60, color: 'warning' },
    { title: 'Nouveaux', value: '22.123 Utilisateurs', percent: 80, color: 'danger' },
    { title: 'Taux de rebond', value: 'Taux moyen', percent: 40.15, color: 'primary' },
  ]
  const progressGroupExample2 = [
    { title: 'Hommes', icon: cilUser, value: 53 },
    { title: 'Femmes', icon: cilUserFemale, value: 43 },
  ]
  const progressGroupExample3 = [
    { title: 'Recherche Organique', icon: cibGoogle, percent: 56, value: '191,235' },
    { title: 'Facebook', icon: cibFacebook, percent: 15, value: '51,223' },
    { title: 'Twitter', icon: cibTwitter, percent: 11, value: '37,564' },
    { title: 'LinkedIn', icon: cibLinkedin, percent: 8, value: '27,319' },
  ]

  // --- EPI states ---
  const [forecastData, setForecastData] = useState([]) // [{date, prev}]
  const [recoRows, setRecoRows] = useState([])         // [{materiel, taille, stock_actuel, demande_window, a_commander}]
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Données mock pour le graphe (toujours valides)
  const MOCK_FORECAST = [
    { date: '2025-01', prev: 45 },
    { date: '2025-02', prev: 52 },
    { date: '2025-03', prev: 48 },
    { date: '2025-04', prev: 61 },
    { date: '2025-05', prev: 55 },
    { date: '2025-06', prev: 67 },
  ]

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        // ===== Prévisions =====
        if (USE_MOCK) {
          setForecastData(MOCK_FORECAST)
        } else {
          const f = await fetch(
            `${API}/api/epi/previsions?materiel_id=${DEFAULT_MATERIEL_ID}&taille_id=${DEFAULT_TAILLE_ID}&months=${HORIZON_MONTHS}`
          )
          if (f.ok) {
            const rows = await f.json()
            setForecastData(rows.map(x => ({
              date: x.periode,
              prev: Number(x.qte_prevue) || 0,
            })))
          } else {
            setForecastData(MOCK_FORECAST) // fallback
          }
        }

        // ===== Recommandations =====
        const r = await fetch(`${API}/api/epi/reco-appro?months=2&safety=5`)
        if (r.ok) {
          const rows = await r.json()
          setRecoRows(rows)
        } else {
          setRecoRows([
            { materiel: 'Casque de sécurité', taille: 'M', stock_actuel: 15, demande_window: 25, a_commander: 10 },
            { materiel: 'Gants de protection', taille: 'L', stock_actuel: 30, demande_window: 20, a_commander: 0 },
            { materiel: 'Chaussures de sécurité', taille: '42', stock_actuel: 8, demande_window: 15, a_commander: 7 },
          ])
        }
      } catch (e) {
        setError(e.message)
        setForecastData(MOCK_FORECAST)
        setRecoRows([
          { materiel: 'Sample Item', taille: 'M', stock_actuel: 10, demande_window: 15, a_commander: 5 },
        ])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

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
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold text-primary">Tableau de Bord EPI</h2>
          <p className="text-muted mb-0">Gestion et prévisions des équipements de protection individuelle</p>
        </div>
        <CButton 
          color="primary" 
          className="shadow-sm"
          onClick={() => window.location.reload()}
        >
          <CIcon icon={cilReload} className="me-2" />
          Actualiser
        </CButton>
      </div>

      <WidgetsDropdown className="mb-4" />

      {error && (
        <CCard className="mb-4 border-warning shadow-sm">
          <CCardBody className="bg-warning-subtle">
            <div className="d-flex align-items-center">
              <CIcon icon={cilChart} className="text-warning me-2" size="lg" />
              <div>
                <strong className="text-warning">Mode Démo</strong>
                <div className="text-warning-emphasis small">
                  Données d'exemple affichées - {error}
                </div>
              </div>
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* ===== Graph Prévisions ===== */}
      <CCard className="mb-5 shadow-sm border-0">
        <CCardHeader className="bg-gradient border-0 py-3">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h4 className="card-title mb-1 fw-semibold">📈 Prévisions EPI</h4>
              <div className="small text-body-secondary">
                Analyse prévisionnelle sur les prochains {HORIZON_MONTHS} mois
              </div>
            </div>
            <div className="d-flex gap-2">
              <CBadge color="primary" className="px-3 py-2">
                Horizon: {HORIZON_MONTHS} mois
              </CBadge>
            </div>
          </div>
        </CCardHeader>
        <CCardBody className="p-4">
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={forecastData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6c757d"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  allowDecimals={false} 
                  stroke="#6c757d"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
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
                  name="Quantité Prévue"
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

      {/* ===== Carte KPI démo ===== */}
      <CCard className="mb-5 shadow-sm border-0">
        <CCardHeader className="bg-light border-0 py-3">
          <CRow className="align-items-center">
            <CCol sm={6}>
              <h4 className="card-title mb-1 fw-semibold">📊 Statistiques Trafic</h4>
              <div className="small text-body-secondary">Janvier - Juillet 2023</div>
            </CCol>
            <CCol sm={6} className="d-none d-md-block">
              <div className="d-flex justify-content-end align-items-center gap-2">
                <CButtonGroup>
                  {['Jour', 'Mois', 'Année'].map((v) => (
                    <CButton 
                      key={v} 
                      color="outline-secondary" 
                      size="sm"
                      active={v === 'Mois'}
                      className="border-0"
                    >
                      {v}
                    </CButton>
                  ))}
                </CButtonGroup>
                <CButton color="primary" size="sm" className="ms-2">
                  <CIcon icon={cilCloudDownload} />
                </CButton>
              </div>
            </CCol>
          </CRow>
        </CCardHeader>

        <CCardBody className="py-4">
          <CRow xs={{ cols: 1, gutter: 4 }} sm={{ cols: 2 }} lg={{ cols: 4 }} xl={{ cols: 5 }} className="text-center">
            {progressExample.map((item, i, items) => (
              <CCol className={classNames({ 'd-none d-xl-block': i + 1 === items.length })} key={i}>
                <div className="bg-light rounded-3 p-3 h-100">
                  <div className="text-body-secondary small mb-1">{item.title}</div>
                  <div className="fw-bold text-truncate mb-2" style={{ fontSize: '0.9rem' }}>
                    {item.value}
                  </div>
                  <div className="small text-muted mb-2">{item.percent}%</div>
                  <CProgress 
                    thin 
                    color={item.color} 
                    value={item.percent}
                    className="rounded-pill"
                    style={{ height: '6px' }}
                  />
                </div>
              </CCol>
            ))}
          </CRow>
        </CCardBody>
      </CCard>

      <WidgetsBrand className="mb-4" withCharts />

      {/* ===== Tableau À commander ===== */}
      <CRow>
        <CCol xs>
          <CCard className="shadow-sm border-0">
            <CCardHeader className="bg-gradient border-0 py-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="card-title mb-1 fw-semibold">🛒 Recommandations de Commande</h4>
                  <div className="small text-body-secondary">
                    Analyse basée sur une fenêtre de 2 mois avec stock de sécurité de 5 unités
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <CBadge color="info" className="px-2 py-1">
                    Fenêtre: 2 mois
                  </CBadge>
                  <CBadge color="secondary" className="px-2 py-1">
                    Sécurité: 5 unités
                  </CBadge>
                </div>
              </div>
            </CCardHeader>
            <CCardBody className="p-0">
              <div className="table-responsive">
                <CTable align="middle" className="mb-0" hover>
                  <CTableHead className="bg-light">
                    <CTableRow>
                      <CTableHeaderCell className="fw-semibold py-3 ps-4">
                        Matériel
                      </CTableHeaderCell>
                      <CTableHeaderCell className="fw-semibold py-3">
                        Taille
                      </CTableHeaderCell>
                      <CTableHeaderCell className="text-center fw-semibold py-3">
                        Stock Actuel
                      </CTableHeaderCell>
                      <CTableHeaderCell className="text-center fw-semibold py-3">
                        Demande (2 mois)
                      </CTableHeaderCell>
                      <CTableHeaderCell className="text-center fw-semibold py-3 pe-4">
                        À Commander
                      </CTableHeaderCell>
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
                      recoRows.map((r, idx) => (
                        <CTableRow 
                          key={idx} 
                          className={r.a_commander > 0 ? 'table-danger-subtle border-start border-danger border-3' : 'border-start border-success border-3'}
                        >
                          <CTableDataCell className="fw-medium py-3 ps-4">
                            {r.materiel}
                          </CTableDataCell>
                          <CTableDataCell className="py-3">
                            <CBadge color="light" className="text-dark">
                              {r.taille}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell className="text-center py-3">
                            <span className="fw-medium">{r.stock_actuel}</span>
                          </CTableDataCell>
                          <CTableDataCell className="text-center py-3">
                            <span className="fw-medium">
                              {r.demande_window ?? r.demande ?? '-'}
                            </span>
                          </CTableDataCell>
                          <CTableDataCell className="text-center py-3 pe-4">
                            {r.a_commander > 0 ? (
                              <CBadge 
                                color="danger" 
                                className="px-3 py-2 rounded-pill fw-medium"
                                style={{ fontSize: '0.85rem' }}
                              >
                                {r.a_commander} unités
                              </CBadge>
                            ) : (
                              <CBadge 
                                color="success" 
                                className="px-3 py-2 rounded-pill fw-medium"
                                style={{ fontSize: '0.85rem' }}
                              >
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
                  <CButton color="primary" size="sm">
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