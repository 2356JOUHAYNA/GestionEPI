import React, { useEffect, useState } from 'react'
import {
  CCard, CCardBody, CCardHeader,
  CForm, CFormInput, CFormLabel,
  CButton, CAlert, CSpinner, CBadge,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CFormSelect,
  CContainer, CRow, CCol
} from '@coreui/react'
import axios from 'axios'

const BASE_URL = 'http://localhost:8000/api/epi'
const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']

const ServiceGenerauxByMatricule = () => {
  const [matricule, setMatricule] = useState('')
  const [pdfNomEmploye, setPdfNomEmploye] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [employe, setEmploye] = useState(null)
  const [catalogue, setCatalogue] = useState([])
  const [taillesByMateriel, setTaillesByMateriel] = useState({})
  const [lignes, setLignes] = useState([])
  const [saving, setSaving] = useState(false)

  // Charger le catalogue des matériels
  useEffect(() => {
    axios.get(`${BASE_URL}/materiels`, { headers: { Accept: 'application/json' } })
      .then(res => {
        const arr = Array.isArray(res.data) ? res.data : []
        setCatalogue(arr.map(m => ({
          ...m,
          nom: m?.nom ?? m?.libelle ?? '—',
        })))
      })
      .catch(() => setCatalogue([]))
  }, [])

  // Charger tailles d’un matériel (cache par id matériel) + normaliser libellé
  const fetchTailles = async (materielId) => {
    if (!materielId || taillesByMateriel[materielId]) return
    try {
      const { data } = await axios.get(`${BASE_URL}/materiels/${materielId}/tailles`, { headers: { Accept: 'application/json' } })
      const list = (Array.isArray(data) ? data : []).map(t => ({
        id: t.id,
        libelle: t.libelle ?? t.nom ?? '—',
      }))
      setTaillesByMateriel(prev => ({ ...prev, [materielId]: list }))
    } catch {
      setTaillesByMateriel(prev => ({ ...prev, [materielId]: [] }))
    }
  }

  // Rechercher employé + aplatir les affectations du manager
  const search = async () => {
    if (!matricule.trim()) return
    setLoading(true)
    setError('')
    setEmploye(null)
    setLignes([])

    try {
      const empRes = await axios.get(
        `${BASE_URL}/employes/${encodeURIComponent(matricule)}`,
        { headers: { Accept: 'application/json' } }
      )
      const emp = empRes.data
      setEmploye(emp)

      const affRes = await axios.get(
        `${BASE_URL}/employes/${encodeURIComponent(matricule)}/manager-affectations`,
        { headers: { Accept: 'application/json' } }
      )
      const source = Array.isArray(affRes.data) ? affRes.data : []

      const flat = []
      source.forEach(aff => {
        const details = Array.isArray(aff.details) ? aff.details : []
        details.forEach(d => {
          const frequence = d?.frequence ?? d?.materiel?.frequence ?? null
          const frequence_label = d?.frequence_label ?? d?.materiel?.frequence_label ?? null
          const materielId = d?.materiel?.id
          const materielNom = d?.materiel?.nom ?? d?.materiel?.libelle ?? '—'
          const tailleId = d?.taille?.id
          const tailleLib = d?.taille?.libelle ?? d?.taille?.nom ?? '—'

          flat.push({
            lineKey: `${aff.id}-${d.id}`,
            affectation_id: aff.id,
            detail_id: d.id,
            materiel_id: materielId,
            materiel_nom: materielNom,
            taille_id: tailleId,
            taille_libelle: tailleLib,
            quantite_disponible: d?.quantite_restante ?? d?.quantite ?? 0,
            frequence,
            frequence_label,
            distribuer_qte: 1,
            mois: new Array(12).fill(false),
          })

          if (materielId) fetchTailles(materielId)
        })
      })

      setLignes(flat)
    } catch {
      setError('❌ Employé introuvable ou erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  // Helpers d’édition locale
  const handleChangeLigne = (idx, field, value) => {
    setLignes(prev => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  const handleChangeMateriel = (idx, newMaterielId) => {
    setLignes(prev => {
      const l = { ...prev[idx] }
      const mat = catalogue.find(m => String(m.id) === String(newMaterielId))
      l.materiel_id = newMaterielId
      l.materiel_nom = mat ? (mat.nom ?? mat.libelle ?? '—') : l.materiel_nom
      l.taille_id = ''
      l.taille_libelle = '—'
      return prev.map((row, i) => (i === idx ? l : row))
    })
    fetchTailles(newMaterielId)
  }

  const toggleMois = (idx, i) => {
    setLignes(prev => {
      const copy = [...prev]
      const flags = [...copy[idx].mois]
      flags[i] = !flags[i]
      copy[idx] = { ...copy[idx], mois: flags }
      return copy
    })
  }

  // Distribuer UNE ligne
  const distributeOne = async (idx) => {
    const row = lignes[idx]
    if (!employe) return alert("Aucun employé chargé.")
    if (!row.distribuer_qte || row.distribuer_qte < 1) return alert('Quantité invalide.')
    if (row.distribuer_qte > row.quantite_disponible) return alert('Quantité demandée > disponible.')

    try {
      setSaving(true)
      await axios.post(`${BASE_URL}/distributions`, {
        employe_id: employe.id,
        affectation_id: row.affectation_id,
        detail_id: row.detail_id,
        quantite: row.distribuer_qte,
        override_materiel_id: row.materiel_id || null,
        override_taille_id: row.taille_id || null,
        trace_mois: row.mois,
      })
      await search()
    } catch (err) {
      const msg = err?.response?.data?.message
        || (typeof err?.response?.data === 'string' ? err.response.data : null)
        || 'Erreur distribution.'
      alert(`❌ ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  // ✅ PDF d’une affectation + un de ses détails
  // Route: GET /api/epi/distributions/pdf/{affectation}/{detail}?nom=...
  const printPDF = (idx) => {
    const row = lignes[idx]
    if (!row) return
    if (!row.affectation_id || !row.detail_id) {
      return alert("IDs manquants : affectation ou détail.")
    }
    const nomParam = pdfNomEmploye.trim()
      ? `?nom=${encodeURIComponent(pdfNomEmploye.trim())}`
      : ''
    const url = `${BASE_URL}/distributions/pdf/${row.affectation_id}/${row.detail_id}${nomParam}`
    window.open(url, '_blank')
  }

  // (Optionnel) PDF fiche employé complète — à adapter si tu utilises une autre route
  // Fiche PDF : toutes les distributions de l’employé pour aujourd’hui
const printPDFEmploye = () => {
  if (!employe?.id) return
  const params = pdfNomEmploye.trim()
    ? `?nom=${encodeURIComponent(pdfNomEmploye.trim())}`  // optionnel si tu l’utilises
    : ''
  const url = `${BASE_URL}/distributions/pdf-employe-jour/${employe.id}${params}`
  window.open(url, '_blank')
}


  // Suppression d’une ligne d’affectation
  const deleteLine = async (row) => {
    if (!window.confirm('Supprimer cette ligne d’affectation ?')) return
    try {
      setSaving(true)
      await axios.delete(`${BASE_URL}/affectations/${row.affectation_id}/details/${row.detail_id}`, { headers: { Accept: 'application/json' } })
      await search()
    } catch (e) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : 'Suppression impossible.'
      alert('❌ ' + msg)
    } finally {
      setSaving(false)
    }
  }

  const renderFreq = (row) => {
    if (row.frequence_label) return row.frequence_label
    if (row.frequence) return String(row.frequence)
    return '—'
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '2rem 0'
    }}>
      <CContainer>
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-white mb-2" style={{ fontSize: '2.5rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            🧰 Distribution EPI
          </h1>
          <p className="text-white-50" style={{ fontSize: '1.1rem' }}>
            Service généraux - Gestion des équipements de protection individuelle
          </p>
        </div>

        <CCard className="shadow-lg border-0" style={{ borderRadius: 15, overflow: 'hidden' }}>
          <CCardHeader className="text-white fw-bold py-3" style={{
            background: 'linear-gradient(45deg, #4a69bd, #718096)',
            fontSize: '1.2rem',
            borderBottom: '3px solid #3742fa'
          }}>
            <div className="d-flex align-items-center">
              <span className="me-2" style={{ fontSize: '1.5rem' }}>🔍</span>
              Recherche et distribution
            </div>
          </CCardHeader>

          <CCardBody className="p-4" style={{ backgroundColor: '#f8fafc' }}>
            {/* Recherche */}
            <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: 10 }}>
              <CCardBody className="bg-white">
                <CForm className="d-flex gap-3 mb-0 align-items-end">
                  <div className="flex-grow-1">
                    <CFormLabel className="fw-bold text-muted mb-2">
                      <span className="me-2">👤</span>Matricule employé
                    </CFormLabel>
                    <CFormInput
                      placeholder="Ex: EMP001"
                      value={matricule}
                      onChange={(e) => setMatricule(e.target.value)}
                      style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '12px 16px', fontSize: '1rem' }}
                      className="form-control-lg"
                    />
                  </div>
                  <div className="flex-grow-1">
                    <CFormLabel className="fw-bold text-muted mb-2">
                      <span className="me-2">✏️</span>Nom de l'employé (PDF)
                    </CFormLabel>
                    <CFormInput
                      placeholder="Ex: Ahmed Ben Ali"
                      value={pdfNomEmploye}
                      onChange={(e) => setPdfNomEmploye(e.target.value)}
                      style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '12px 16px', fontSize: '1rem' }}
                      className="form-control-lg"
                    />
                  </div>
                  <div>
                    <CButton
                      color="primary"
                      onClick={search}
                      size="lg"
                      disabled={loading}
                      style={{ borderRadius: 8, padding: '12px 24px', fontWeight: 600, background: 'linear-gradient(45deg, #667eea, #764ba2)', border: 'none', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)' }}
                    >
                      {loading ? (<><CSpinner size="sm" className="me-2" />Recherche...</>) : '🔍 Rechercher'}
                    </CButton>
                  </div>
                  {employe && (
                    <div>
                      <CButton
                        color="success"
                        onClick={printPDFEmploye}
                        size="lg"
                        style={{ borderRadius: 8, padding: '12px 24px', fontWeight: 600, background: 'linear-gradient(45deg, #2ed573, #7bed9f)', border: 'none', boxShadow: '0 4px 15px rgba(46, 213, 115, 0.3)' }}
                      >
                        🖨️ Imprimer la fiche
                      </CButton>
                    </div>
                  )}
                </CForm>
              </CCardBody>
            </CCard>

            {error && (
              <CAlert color="danger" className="mb-4" style={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 15px rgba(231, 76, 60, 0.2)' }}>
                {error}
              </CAlert>
            )}

            {/* Carte employé */}
            {employe && (
              <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: 10 }}>
                <CCardBody style={{ background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)', color: 'white', borderRadius: 10 }}>
                  <CRow className="align-items-center">
                    <CCol md={8}>
                      <div className="d-flex align-items-center mb-2">
                        <div className="me-3" style={{ fontSize: '3rem', opacity: 0.8 }}>👤</div>
                        <div>
                          <h4 className="mb-1 fw-bold">
                            {employe.nom} {employe.prenom}
                          </h4>
                          <div className="d-flex flex-wrap gap-2">
                            <CBadge color="light" text="dark" className="px-2 py-1">📋 {employe.matricule}</CBadge>
                            <CBadge color="warning" className="px-2 py-1">💼 {employe.fonction || 'Non défini'}</CBadge>
                            <CBadge color="info" className="px-2 py-1">👨‍💼 Manager: {employe.manager?.nom || 'Aucun'}</CBadge>
                          </div>
                        </div>
                      </div>
                    </CCol>
                    <CCol md={4} className="text-end">
                      <div className="text-white-75">
                        <small>Articles disponibles:</small>
                        <div className="h3 mb-0 fw-bold">{lignes.length}</div>
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            )}

            {/* Tableau */}
            {lignes.length > 0 && (
              <CCard className="border-0 shadow-sm" style={{ borderRadius: 10 }}>
                <CCardHeader className="bg-light border-0" style={{ borderRadius: '10px 10px 0 0' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <h5 className="mb-0 fw-bold text-dark">📦 Matériels à distribuer</h5>
                    <CBadge color="primary" className="px-3 py-2">
                      {lignes.length} article{lignes.length > 1 ? 's' : ''}
                    </CBadge>
                  </div>
                </CCardHeader>
                <CCardBody className="p-0">
                  <div className="table-responsive">
                    <CTable className="mb-0" hover>
                      <CTableHead>
                        <CTableRow style={{ backgroundColor: '#f1f5f9' }}>
                          <CTableHeaderCell className="fw-bold text-center py-3" style={{ color: '#475569' }}>🔧 Matériel</CTableHeaderCell>
                          <CTableHeaderCell className="fw-bold text-center py-3" style={{ color: '#475569' }}>📏 Taille</CTableHeaderCell>
                          <CTableHeaderCell className="fw-bold text-center py-3" style={{ color: '#475569' }}>⏱️ Fréquence</CTableHeaderCell>
                          <CTableHeaderCell className="fw-bold text-center py-3" style={{ color: '#475569' }}>📊 Stock</CTableHeaderCell>
                          <CTableHeaderCell className="fw-bold text-center py-3" style={{ color: '#475569' }}>🔢 Quantité</CTableHeaderCell>
                          <CTableHeaderCell className="fw-bold text-center py-3" style={{ color: '#475569' }}>📅 Suivi mensuel</CTableHeaderCell>
                          <CTableHeaderCell className="fw-bold text-center py-3" style={{ color: '#475569' }}>⚡ Actions</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {lignes.map((row, idx) => (
                          <CTableRow key={row.lineKey} className="align-middle">
                            <CTableDataCell style={{ minWidth: 220 }}>
                              <CFormSelect
                                value={row.materiel_id ?? ''}
                                onChange={e => handleChangeMateriel(idx, e.target.value)}
                                style={{ borderRadius: 6, border: '2px solid #e2e8f0' }}
                              >
                                <option value="" disabled>— Sélectionner —</option>
                                {catalogue.map(m => (
                                  <option key={m.id} value={m.id}>{m.nom ?? m.libelle ?? '—'}</option>
                                ))}
                              </CFormSelect>
                            </CTableDataCell>

                            <CTableDataCell style={{ minWidth: 140 }}>
                              <CFormSelect
                                value={row.taille_id ?? ''}
                                onChange={e => handleChangeLigne(idx, 'taille_id', e.target.value)}
                                style={{ borderRadius: 6, border: '2px solid #e2e8f0' }}
                              >
                                <option value="" disabled>— Sélectionner —</option>
                                {(taillesByMateriel[row.materiel_id]
                                  ?? (row.taille_id ? [{ id: row.taille_id, libelle: row.taille_libelle }] : []))
                                  .map(t => (
                                    <option key={t.id} value={t.id}>
                                      {t.libelle ?? t.nom ?? '—'}
                                    </option>
                                ))}
                              </CFormSelect>
                            </CTableDataCell>

                            <CTableDataCell className="text-center">
                              <CBadge color="secondary" className="px-3 py-2">
                                {renderFreq(row)}
                              </CBadge>
                            </CTableDataCell>

                            <CTableDataCell className="text-center">
                              <CBadge
                                color={row.quantite_disponible > 10 ? 'success' : row.quantite_disponible > 0 ? 'warning' : 'danger'}
                                className="px-3 py-2"
                              >
                                {row.quantite_disponible}
                              </CBadge>
                            </CTableDataCell>

                            <CTableDataCell style={{ maxWidth: 100 }}>
                              <CFormInput
                                type="number"
                                min="1"
                                max={Number(row.quantite_disponible) || 1}
                                value={row.distribuer_qte}
                                onChange={e => handleChangeLigne(idx, 'distribuer_qte', Math.max(1, Number(e.target.value) || 1))}
                                style={{ borderRadius: 6, border: '2px solid #e2e8f0', textAlign: 'center' }}
                              />
                            </CTableDataCell>

                            <CTableDataCell>
                              <div className="d-flex flex-wrap justify-content-center" style={{ gap: 4 }}>
                                {months.map((m, i) => (
                                  <label
                                    key={i}
                                    className="d-flex flex-column align-items-center"
                                    style={{
                                      fontSize: 10,
                                      cursor: 'pointer',
                                      padding: 4,
                                      borderRadius: 4,
                                      backgroundColor: row.mois[i] ? '#e3f2fd' : 'transparent',
                                      border: row.mois[i] ? '1px solid #2196f3' : '1px solid #e0e0e0'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={row.mois[i]}
                                      onChange={() => toggleMois(idx, i)}
                                      style={{ marginBottom: 2 }}
                                    />
                                    <span>{m}</span>
                                  </label>
                                ))}
                              </div>
                            </CTableDataCell>

                            <CTableDataCell style={{ minWidth: 280 }}>
                              <div className="d-flex gap-2 justify-content-center">
                                <CButton
                                  color="success"
                                  size="sm"
                                  disabled={saving}
                                  onClick={() => distributeOne(idx)}
                                  style={{ borderRadius: 6, fontWeight: 600, boxShadow: '0 2px 8px rgba(46, 213, 115, 0.3)' }}
                                >
                                  ✅ Distribuer
                                </CButton>
                                <CButton
                                  color="info"
                                  size="sm"
                                  onClick={() => printPDF(idx)}
                                  style={{ borderRadius: 6, fontWeight: 600, boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)' }}
                                >
                                  🖨️
                                </CButton>
                                <CButton
                                  color="danger"
                                  size="sm"
                                  onClick={() => deleteLine(row)}
                                  disabled={saving}
                                  style={{ borderRadius: 6, fontWeight: 600, boxShadow: '0 2px 8px rgba(231, 76, 60, 0.3)' }}
                                >
                                  🗑️
                                </CButton>
                              </div>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </div>
                </CCardBody>
              </CCard>
            )}

            {/* Aucune donnée */}
            {!loading && !error && lignes.length === 0 && employe && (
              <CCard className="text-center border-0 shadow-sm" style={{ borderRadius: 10 }}>
                <CCardBody className="py-5">
                  <div style={{ fontSize: '4rem', opacity: 0.3 }}>📭</div>
                  <h5 className="text-muted mt-3">Aucun matériel à distribuer</h5>
                  <p className="text-muted">Cet employé n'a pas de matériel en attente de distribution.</p>
                </CCardBody>
              </CCard>
            )}
          </CCardBody>
        </CCard>
      </CContainer>
      
    </div>
  )
}

export default ServiceGenerauxByMatricule
