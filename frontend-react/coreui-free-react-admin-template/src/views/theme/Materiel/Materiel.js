// src/views/theme/Materiel/Materiel.js
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  CCard, CCardHeader, CCardBody,
  CRow, CCol, CContainer,
  CForm, CFormLabel, CFormInput, CFormSelect,
  CButton, CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CAlert, CBadge, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilTrash } from '@coreui/icons'

const API = 'http://127.0.0.1:8000/api' // remplace par ton instance axios/baseURL si besoin

const emptyTaille = () => ({ nom: '', quantite: '' })

const Materiel = () => {
  const [nom, setNom] = useState('')
  const [categorieId, setCategorieId] = useState('')
  const [categories, setCategories] = useState([])
  const [tailles, setTailles] = useState([emptyTaille()])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  // --- liste & suppression
  const [materiels, setMateriels] = useState([])
  const [loadingList, setLoadingList] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Charger les catégories (optionnelles)
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { data } = await axios.get(`${API}/epi/categories`)
        setCategories(data || [])
      } catch (_) {
        // non bloquant
      }
    }
    fetchCats()
  }, [])

  // Charger la liste des matériels
  const loadMateriels = async () => {
    try {
      setLoadingList(true)
      const { data } = await axios.get(`${API}/epi/materiels/with-tailles`)
      setMateriels(Array.isArray(data) ? data : [])
    } catch (_) {
      setMateriels([])
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadMateriels()
  }, [])

  const addRow = () => setTailles((arr) => [...arr, emptyTaille()])
  const delRow = (idx) => setTailles((arr) => arr.filter((_, i) => i !== idx))
  const setRow = (idx, patch) =>
    setTailles((arr) => arr.map((r, i) => (i === idx ? { ...r, ...patch } : r)))

  const normalizeRows = (rows) => {
    const cleaned = rows
      .map(r => ({
        nom: String(r.nom || '').trim(),
        quantite: String(r.quantite || '').trim(),
      }))
      .filter(r => r.nom.length > 0)

    const seen = new Set()
    const uniques = []
    for (const r of cleaned) {
      const key = r.nom.toUpperCase()
      if (!seen.has(key)) {
        seen.add(key)
        uniques.push(r)
      }
    }
    return uniques
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })

    const taillesPrepared = normalizeRows(tailles).map(t => ({
      nom: t.nom,
      ...(t.quantite !== '' ? { quantite: Number(t.quantite) } : {}),
    }))

    if (!nom.trim()) {
      setMsg({ type: 'danger', text: 'Le nom du matériel est requis.' })
      return
    }
    if (taillesPrepared.length === 0) {
      setMsg({ type: 'danger', text: 'Ajoute au moins une taille.' })
      return
    }

    const payload = {
      nom: nom.trim(),
      categorie_id: categorieId || null,
      tailles: taillesPrepared,
    }

    try {
      setLoading(true)
      const { data } = await axios.post(`${API}/epi/materiels/full`, payload)
      setMsg({ type: 'success', text: `Matériel créé : ${data.nom} ✅` })
      setNom('')
      setCategorieId('')
      setTailles([emptyTaille()])
      loadMateriels() // rafraîchir la liste
    } catch (err) {
      const m = err?.response?.data?.message
        || err?.response?.data?.errors?.nom?.[0]
        || 'Erreur lors de la création.'
      setMsg({ type: 'danger', text: m })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, nomMateriel) => {
    if (!window.confirm(`Supprimer « ${nomMateriel} » ?`)) return
    try {
      setDeletingId(id)
      await axios.delete(`${API}/epi/materiels/${id}`)
      setMsg({ type: 'success', text: `« ${nomMateriel} » supprimé.` })
      loadMateriels()
    } catch (err) {
      const m =
        err?.response?.data?.message ||
        (err?.response?.status === 409
          ? 'Suppression refusée : le matériel est utilisé.'
          : null) ||
        'Suppression impossible.'
      setMsg({ type: 'danger', text: m })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        padding: '2rem 0',
      }}
    >
      <CContainer>
        {/* Header global */}
        <div className="text-center mb-4">
          <h1
            className="text-white mb-2"
            style={{ fontSize: '2.5rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
          >
            🧱 Gestion du matériel
          </h1>
          <p className="text-white-50" style={{ fontSize: '1.1rem' }}>
            Service généraux — Création de matériel et de tailles
          </p>
        </div>

        {/* Carte formulaire */}
        <CCard className="shadow-lg border-0" style={{ borderRadius: 15, overflow: 'hidden' }}>
          <CCardHeader
            className="text-white fw-bold py-3"
            style={{
              background: 'linear-gradient(45deg, #4a69bd, #718096)',
              fontSize: '1.2rem',
              borderBottom: '3px solid #3742fa',
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <span className="me-2" style={{ fontSize: '1.5rem' }}>🛠️</span>
                Créer un matériel & ses tailles
              </div>
              <CBadge color="light" text="dark" className="px-3 py-2">Formulaire</CBadge>
            </div>
          </CCardHeader>

          <CCardBody className="p-4" style={{ backgroundColor: '#f8fafc' }}>
            {msg.text && (
              <CAlert
                color={msg.type}
                className="mb-4"
                style={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}
              >
                {msg.text}
              </CAlert>
            )}

            <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: 10 }}>
              <CCardBody className="bg-white">
                <CForm onSubmit={handleSubmit} className="mb-0">
                  <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormLabel className="fw-bold text-muted mb-2">
                        <span className="me-2">🏷️</span>Nom du matériel *
                      </CFormLabel>
                      <CFormInput
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        placeholder="Ex: Chaussure de sécurité"
                        style={{
                          borderRadius: 8,
                          border: '2px solid #e2e8f0',
                          padding: '12px 16px',
                          fontSize: '1rem',
                        }}
                        className="form-control-lg"
                      />
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel className="fw-bold text-muted mb-2">
                        <span className="me-2">🧩</span>Catégorie (optionnelle)
                      </CFormLabel>
                      <CFormSelect
                        value={categorieId}
                        onChange={(e) => setCategorieId(e.target.value)}
                        style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '10px 12px' }}
                      >
                        <option value="">-- Aucune --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.nom}</option>
                        ))}
                      </CFormSelect>
                    </CCol>
                  </CRow>

                  <div className="mb-2 d-flex align-items-center justify-content-between">
                    <strong>Tailles</strong>
                    <CButton
                      type="button"
                      color="primary"
                      variant="outline"
                      size="sm"
                      onClick={addRow}
                      style={{ borderRadius: 8 }}
                    >
                      <CIcon icon={cilPlus} className="me-1" /> Ajouter une ligne
                    </CButton>
                  </div>

                  <div className="table-responsive">
                    <CTable className="mb-0" hover>
                      <CTableHead>
                        <CTableRow style={{ backgroundColor: '#f1f5f9' }}>
                          <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569', width: '50%' }}>
                            Nom de la taille *
                          </CTableHeaderCell>
                          <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569', width: '35%' }}>
                            Quantité initiale (optionnelle)
                          </CTableHeaderCell>
                          <CTableHeaderCell className="fw-bold text-center py-3" style={{ color: '#475569', width: '15%' }}>
                            Actions
                          </CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {tailles.map((t, idx) => (
                          <CTableRow key={idx} className="align-middle">
                            <CTableDataCell>
                              <CFormInput
                                value={t.nom}
                                onChange={(e) => setRow(idx, { nom: e.target.value })}
                                placeholder="Ex: S, M, L, 38, 39..."
                                style={{ borderRadius: 8, border: '2px solid #e2e8f0' }}
                              />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput
                                type="number"
                                min="0"
                                value={t.quantite}
                                onChange={(e) => setRow(idx, { quantite: e.target.value })}
                                placeholder="0"
                                style={{ borderRadius: 8, border: '2px solid #e2e8f0' }}
                              />
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              <CButton
                                type="button"
                                color="danger"
                                variant="outline"
                                size="sm"
                                disabled={tailles.length === 1}
                                onClick={() => delRow(idx)}
                                title="Supprimer la ligne"
                                style={{ borderRadius: 6, fontWeight: 600 }}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </div>

                  <div className="mt-4">
                    <CButton
                      type="submit"
                      color="success"
                      disabled={loading}
                      style={{
                        borderRadius: 8,
                        padding: '12px 24px',
                        fontWeight: 600,
                        background: 'linear-gradient(45deg, #2ed573, #7bed9f)',
                        border: 'none',
                        boxShadow: '0 4px 15px rgba(46, 213, 115, 0.3)',
                      }}
                    >
                      {loading ? <><CSpinner size="sm" className="me-2" />Enregistrement...</> : 'Enregistrer'}
                    </CButton>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCardBody>
        </CCard>

        {/* Liste + suppression */}
        <CCard className="shadow-lg border-0" style={{ borderRadius: 15, overflow: 'hidden' }}>
          <CCardHeader
            className="text-white fw-bold py-3"
            style={{
              background: 'linear-gradient(45deg, #4a69bd, #718096)',
              fontSize: '1.2rem',
              borderBottom: '3px solid #3742fa',
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <span className="me-2" style={{ fontSize: '1.5rem' }}>📦</span>
                Liste des matériels
              </div>
              <CBadge color="light" text="dark" className="px-3 py-2">
                {loadingList ? 'Chargement...' : `${materiels.length} élément${materiels.length > 1 ? 's' : ''}`}
              </CBadge>
            </div>
          </CCardHeader>

          <CCardBody className="p-0">
            <div className="table-responsive">
              <CTable className="mb-0" hover>
                <CTableHead>
                  <CTableRow style={{ backgroundColor: '#f1f5f9' }}>
                    <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569' }}>Matériel</CTableHeaderCell>
                    <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569' }}>Nb tailles</CTableHeaderCell>
                    <CTableHeaderCell className="fw-bold text-center py-3" style={{ color: '#475569' }}>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {materiels.map((m) => (
                    <CTableRow key={m.id} className="align-middle">
                      <CTableDataCell className="fw-semibold">{m.nom}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="primary" className="px-3 py-2">
                          {Array.isArray(m.tailles) ? m.tailles.length : 0}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          disabled={deletingId === m.id}
                          onClick={() => handleDelete(m.id, m.nom)}
                          title={`Supprimer ${m.nom}`}
                          style={{ borderRadius: 6, fontWeight: 600 }}
                        >
                          <CIcon icon={cilTrash} className="me-1" />
                          Supprimer
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                  {materiels.length === 0 && !loadingList && (
                    <CTableRow>
                      <CTableDataCell colSpan={3} className="text-center text-muted py-4">
                        Aucun matériel
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </div>
          </CCardBody>
        </CCard>
      </CContainer>
    </div>
  )
}

export default Materiel
