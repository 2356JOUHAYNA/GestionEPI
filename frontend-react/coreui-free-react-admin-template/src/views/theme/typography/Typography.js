// src/views/theme/Taille/TailleCrud.js
import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard, CCardBody, CCardHeader,
  CRow, CCol, CContainer,
  CForm, CFormLabel, CFormInput, CFormSelect, CButton,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CAlert, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilTrash } from '@coreui/icons'
import axios from 'axios'

const BASE_URL = 'http://localhost:8000/api/epi'

/* ------------------------------- Helpers ------------------------------- */
const isNum = (s) => /^\d+$/.test(String(s ?? ''))
const normalizeSize = (v) => {
  const s = String(v ?? '').trim()
  return s ? (isNum(s) ? s : s.toUpperCase()) : ''
}
const sortSizes = (a, b) => {
  const A = normalizeSize(a), B = normalizeSize(b)
  const na = isNum(A), nb = isNum(B)
  if (na && nb) return Number(A) - Number(B)
  if (na && !nb) return -1
  if (!na && nb) return 1
  return A.localeCompare(B)
}
const pickErrorMessage = (err) => {
  const d = err?.response?.data
  if (!d) return err?.message || 'Erreur inconnue.'
  if (typeof d === 'string') return d
  if (d.message) return d.message
  if (d.errors && typeof d.errors === 'object') {
    const first = Object.values(d.errors)[0]
    if (Array.isArray(first) && first.length) return first[0]
  }
  return JSON.stringify(d)
}

/* ----------------------------- Composant ------------------------------- */
const TailleCrud = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [materiels, setMateriels] = useState([])
  const [materielId, setMaterielId] = useState('')
  const [tailles, setTailles] = useState([])

  // création
  const [newNom, setNewNom] = useState('')
  const [newQte, setNewQte] = useState('')

  // édition
  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [editNom, setEditNom] = useState('')
  const [editQte, setEditQte] = useState('')

  // filtre local
  const [q, setQ] = useState('')

  /* ------------------------- Chargement init --------------------------- */
  const loadMateriels = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${BASE_URL}/materiels`, { headers: { Accept: 'application/json' } })
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setMateriels(list)
    } catch (e) {
      console.error(e)
      setError("Échec du chargement des matériels.")
    } finally {
      setLoading(false)
    }
  }

  const loadTailles = async (id) => {
    if (!id) { setTailles([]); return }
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${BASE_URL}/materiels/${id}/tailles`, { headers: { Accept: 'application/json' } })
      const list = Array.isArray(res.data) ? res.data : []
      setTailles(list.sort((a, b) => sortSizes(a.nom, b.nom)))
    } catch (e) {
      console.error(e)
      setError("Échec du chargement des tailles.")
      setTailles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMateriels() }, [])
  useEffect(() => { loadTailles(materielId) }, [materielId])

  // dédoublage visuel des matériels par nom (optionnel)
  const uniqueMateriels = useMemo(() => {
    const byName = new Map()
    for (const m of (materiels || [])) {
      const key = String(m.nom || '').trim().toLowerCase()
      if (!key) continue
      const cur = byName.get(key)
      if (!cur || Number(m.id) < Number(cur.id)) byName.set(key, m)
    }
    return Array.from(byName.values()).sort((a, b) =>
      String(a.nom || '').localeCompare(String(b.nom || ''), 'fr', { sensitivity: 'base', numeric: true })
    )
  }, [materiels])

  /* ------------------------------ Actions ------------------------------ */
  const handleCreate = async (e) => {
    e.preventDefault()
    if (!materielId) return setError('Choisis un matériel.')
    const nom = normalizeSize(newNom)
    if (!nom) return setError('Le libellé de la taille est requis.')
    const quantite = Math.max(0, Number(newQte || 0))

    try {
      await axios.post(`${BASE_URL}/tailles`, {
        materiel_id: Number(materielId),
        nom,
        quantite,
      }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })

      setNewNom(''); setNewQte('')
      await loadTailles(materielId)
    } catch (e) {
      console.error(e?.response?.data || e)
      setError(pickErrorMessage(e))
    }
  }

  const openEdit = (t) => {
    setEditRow(t)
    setEditNom(normalizeSize(t.nom))
    setEditQte(Number(t.quantite ?? 0))
    setEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editRow) return
    const nom = normalizeSize(editNom)
    const quantite = Math.max(0, Number(editQte || 0))
    if (!nom) return setError('Le libellé de la taille est requis.')

    try {
      await axios.put(`${BASE_URL}/tailles/${editRow.id}`, {
        nom, quantite
      }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })

      setEditOpen(false)
      await loadTailles(materielId)
    } catch (e) {
      console.error(e?.response?.data || e)
      setError(pickErrorMessage(e))
    }
  }

  const handleDelete = async (t) => {
    if (!window.confirm(`Supprimer la taille "${t.nom}" ?`)) return
    try {
      await axios.delete(`${BASE_URL}/tailles/${t.id}`, { headers: { Accept: 'application/json' } })
      await loadTailles(materielId)
    } catch (e) {
      console.error(e?.response?.data || e)
      setError(pickErrorMessage(e))
    }
  }

  // filtre local
  const taillesFiltrees = useMemo(() => {
    const ql = String(q || '').trim().toLowerCase()
    if (!ql) return tailles
    return tailles.filter(t =>
      String(t.nom || '').toLowerCase().includes(ql)
      || String(t.quantite ?? '').includes(ql)
    )
  }, [q, tailles])

  /* -------------------------------- UI --------------------------------- */
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
            📏 Gestion des Tailles
          </h1>
          <p className="text-white-50" style={{ fontSize: '1.1rem' }}>
            Service généraux — Création, édition et suppression des tailles par matériel
          </p>
        </div>

        {/* Carte principale */}
        <CCard className="shadow-lg border-0" style={{ borderRadius: 15, overflow: 'hidden' }}>
          <CCardHeader
            className="text-white fw-bold py-3"
            style={{
              background: 'linear-gradient(45deg, #4a69bd, #718096)',
              fontSize: '1.2rem',
              borderBottom: '3px solid #3742fa',
            }}
          >
            <div className="d-flex align-items-center">
              <span className="me-2" style={{ fontSize: '1.5rem' }}>🧰</span>
              Gestion & Enregistrement
            </div>
          </CCardHeader>

          <CCardBody className="p-4" style={{ backgroundColor: '#f8fafc' }}>
            {error && (
              <CAlert
                color="danger"
                className="mb-4"
                style={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 15px rgba(231, 76, 60, 0.2)' }}
              >
                {error}
              </CAlert>
            )}

            {/* Choix du matériel + recherche */}
            <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: 10 }}>
              <CCardBody className="bg-white">
                <CRow className="g-3 mb-0">
                  <CCol md={6}>
                    <CFormLabel className="fw-bold text-muted mb-2">
                      <span className="me-2">🔧</span>Matériel
                    </CFormLabel>
                    <CFormSelect
                      value={materielId}
                      onChange={(e) => setMaterielId(e.target.value)}
                      style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '10px 12px' }}
                    >
                      <option value="">-- Sélectionner un matériel --</option>
                      {uniqueMateriels.map(m => (
                        <option key={m.id} value={m.id}>{m.nom}</option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel className="fw-bold text-muted mb-2">
                      <span className="me-2">🔎</span>Recherche
                    </CFormLabel>
                    <CFormInput
                      placeholder="Filtrer les tailles"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '12px 16px', fontSize: '1rem' }}
                      className="form-control-lg"
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* Formulaire création */}
            <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: 10 }}>
              <CCardBody className="bg-white">
                <CForm onSubmit={handleCreate} className="mb-0">
                  <CRow className="g-3 align-items-end">
                    <CCol md={6}>
                      <CFormLabel className="fw-bold text-muted mb-2">
                        <span className="me-2">🏷️</span>Nom de la taille
                      </CFormLabel>
                      <CFormInput
                        placeholder="Ex : 38, M, XL…"
                        value={newNom}
                        onChange={(e) => setNewNom(e.target.value)}
                        style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '12px 16px', fontSize: '1rem' }}
                        className="form-control-lg"
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel className="fw-bold text-muted mb-2">
                        <span className="me-2">📦</span>Quantité
                      </CFormLabel>
                      <CFormInput
                        type="number"
                        min="0"
                        placeholder="Quantité"
                        value={newQte}
                        onChange={(e) => setNewQte(e.target.value)}
                        style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '12px 16px', fontSize: '1rem' }}
                        className="form-control-lg"
                      />
                    </CCol>
                    <CCol md={2} className="d-grid">
                      <CButton
                        type="submit"
                        color="success"
                        disabled={!materielId}
                        style={{
                          borderRadius: 8,
                          padding: '12px 24px',
                          fontWeight: 600,
                          background: 'linear-gradient(45deg, #2ed573, #7bed9f)',
                          border: 'none',
                          boxShadow: '0 4px 15px rgba(46, 213, 115, 0.3)',
                        }}
                      >
                        Ajouter
                      </CButton>
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>

            {/* Liste */}
            <CCard className="border-0 shadow-sm" style={{ borderRadius: 10 }}>
              <CCardHeader className="bg-light border-0" style={{ borderRadius: '10px 10px 0 0' }}>
                <h5 className="mb-0 fw-bold text-dark">📋 Tailles du matériel sélectionné</h5>
              </CCardHeader>
              <CCardBody className="p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <CSpinner /> <span className="ms-2">Chargement…</span>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <CTable className="mb-0" hover>
                      <CTableHead>
                        <CTableRow style={{ backgroundColor: '#f1f5f9' }}>
                          <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569', width: '40%' }}>
                            Taille
                          </CTableHeaderCell>
                          <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569', width: '20%' }}>
                            Quantité
                          </CTableHeaderCell>
                          <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569', width: '20%' }}>
                            Créée le
                          </CTableHeaderCell>
                          <CTableHeaderCell className="fw-bold text-center py-3" style={{ color: '#475569', width: '20%' }}>
                            Actions
                          </CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {(!taillesFiltrees || taillesFiltrees.length === 0) ? (
                          <CTableRow>
                            <CTableDataCell colSpan={4} className="text-center text-body-secondary py-4">
                              Aucune taille pour ce matériel.
                            </CTableDataCell>
                          </CTableRow>
                        ) : taillesFiltrees.map(t => (
                          <CTableRow key={t.id} className="align-middle">
                            <CTableDataCell className="text-uppercase fw-semibold">{t.nom}</CTableDataCell>
                            <CTableDataCell>{t.quantite ?? 0}</CTableDataCell>
                            <CTableDataCell>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</CTableDataCell>
                            <CTableDataCell className="text-center">
                              <CButton
                                color="warning"
                                className="me-2"
                                onClick={() => openEdit(t)}
                                style={{ borderRadius: 6, fontWeight: 600 }}
                              >
                                <CIcon icon={cilPencil} className="me-1" /> Modifier
                              </CButton>
                              <CButton
                                color="danger"
                                onClick={() => handleDelete(t)}
                                style={{ borderRadius: 6, fontWeight: 600 }}
                              >
                                <CIcon icon={cilTrash} className="me-1" /> Supprimer
                              </CButton>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </div>
                )}
              </CCardBody>
            </CCard>
          </CCardBody>
        </CCard>
      </CContainer>

      {/* Modale édition */}
      <CModal visible={editOpen} onClose={() => setEditOpen(false)}>
        <CModalHeader onClose={() => setEditOpen(false)}>
          <CModalTitle>Modifier la taille</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CRow className="g-3">
            <CCol md={6}>
              <CFormLabel>Nom</CFormLabel>
              <CFormInput
                value={editNom}
                onChange={(e) => setEditNom(e.target.value)}
                style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '10px 12px' }}
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Quantité</CFormLabel>
              <CFormInput
                type="number"
                min="0"
                value={editQte}
                onChange={(e) => setEditQte(e.target.value)}
                style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '10px 12px' }}
              />
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setEditOpen(false)} style={{ borderRadius: 8 }}>
            Annuler
          </CButton>
          <CButton color="warning" onClick={handleUpdate} style={{ borderRadius: 8, fontWeight: 600 }}>
            <CIcon icon={cilPencil} className="me-1" /> Enregistrer
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default TailleCrud
