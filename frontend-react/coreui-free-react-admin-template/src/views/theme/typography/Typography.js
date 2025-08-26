import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard, CCardBody,
  CRow, CCol,
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
    <CCard className="shadow-sm">
      <CCardBody>
        <h3 className="mb-4">📏 Gestion des Tailles</h3>
        {error && <CAlert color="danger" className="mb-3">{error}</CAlert>}

        {/* Choix du matériel */}
        <CRow className="g-3 mb-1">
          <CCol md={6}>
            <CFormLabel>Matériel</CFormLabel>
            <CFormSelect value={materielId} onChange={(e) => setMaterielId(e.target.value)}>
              <option value="">-- Sélectionner un matériel --</option>
              {uniqueMateriels.map(m => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol md={6}>
            <CFormLabel>Recherche</CFormLabel>
            <CFormInput placeholder="Filtrer les tailles" value={q} onChange={(e) => setQ(e.target.value)} />
          </CCol>
        </CRow>

        {/* Formulaire création */}
        <CForm onSubmit={handleCreate} className="mb-4">
          <CRow className="g-2 align-items-end">
            <CCol md={6}>
              <CFormLabel>Nom de la taille</CFormLabel>
              <CFormInput
                placeholder="Ex : 38, M, XL…"
                value={newNom}
                onChange={(e) => setNewNom(e.target.value)}
              />
            </CCol>
            <CCol md={4}>
              <CFormLabel>Quantité</CFormLabel>
              <CFormInput
                type="number"
                min="0"
                placeholder="Quantité"
                value={newQte}
                onChange={(e) => setNewQte(e.target.value)}
              />
            </CCol>
            <CCol md={2} className="d-grid">
              <CButton type="submit" color="success" disabled={!materielId}>Ajouter</CButton>
            </CCol>
          </CRow>
        </CForm>

        {/* Liste */}
        {loading ? (
          <div className="text-center py-5"><CSpinner /> Chargement…</div>
        ) : (
          <CTable hover bordered>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell style={{ width: '40%' }}>Taille</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '20%' }}>Quantité</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '20%' }}>Créée le</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '20%' }}>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {(!taillesFiltrees || taillesFiltrees.length === 0) ? (
                <CTableRow>
                  <CTableDataCell colSpan={4} className="text-center text-body-secondary">
                    Aucune taille pour ce matériel.
                  </CTableDataCell>
                </CTableRow>
              ) : taillesFiltrees.map(t => (
                <CTableRow key={t.id}>
                  <CTableDataCell className="text-uppercase">{t.nom}</CTableDataCell>
                  <CTableDataCell>{t.quantite ?? 0}</CTableDataCell>
                  <CTableDataCell>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</CTableDataCell>
                  <CTableDataCell>
                    <CButton color="warning" className="me-2" onClick={() => openEdit(t)}>
                      <CIcon icon={cilPencil} className="me-1" /> Modifier
                    </CButton>
                    <CButton color="danger" onClick={() => handleDelete(t)}>
                      <CIcon icon={cilTrash} className="me-1" /> Supprimer
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        )}

        {/* Modale édition */}
        <CModal visible={editOpen} onClose={() => setEditOpen(false)}>
          <CModalHeader onClose={() => setEditOpen(false)}>
            <CModalTitle>Modifier la taille</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CRow className="g-3">
              <CCol md={6}>
                <CFormLabel>Nom</CFormLabel>
                <CFormInput value={editNom} onChange={(e) => setEditNom(e.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Quantité</CFormLabel>
                <CFormInput type="number" min="0" value={editQte} onChange={(e) => setEditQte(e.target.value)} />
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={() => setEditOpen(false)}>Annuler</CButton>
            <CButton color="warning" onClick={handleUpdate}>
              <CIcon icon={cilPencil} className="me-1" /> Enregistrer
            </CButton>
          </CModalFooter>
        </CModal>
      </CCardBody>
    </CCard>
  )
}

export default TailleCrud
