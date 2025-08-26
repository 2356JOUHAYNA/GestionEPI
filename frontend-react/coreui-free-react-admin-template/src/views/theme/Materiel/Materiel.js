// src/views/theme/Materiel/Materiel.js
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  CCard, CCardHeader, CCardBody,
  CRow, CCol,
  CForm, CFormLabel, CFormInput, CFormSelect,
  CButton, CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CAlert, CBadge,
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
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Gestion de matériel</strong>
            <CBadge color="info" className="ms-2">Créer matériel + tailles</CBadge>
          </CCardHeader>
          <CCardBody>
            {msg.text && <CAlert color={msg.type} className="mb-3">{msg.text}</CAlert>}

            <CForm onSubmit={handleSubmit}>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Nom du matériel *</CFormLabel>
                  <CFormInput
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ex: Chaussure de sécurité"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Catégorie (optionnelle)</CFormLabel>
                  <CFormSelect
                    value={categorieId}
                    onChange={(e) => setCategorieId(e.target.value)}
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
                <CButton type="button" color="primary" variant="outline" size="sm" onClick={addRow}>
                  <CIcon icon={cilPlus} className="me-1" /> Ajouter une ligne
                </CButton>
              </div>

              <CTable striped bordered small>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: '50%' }}>Nom de la taille *</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '35%' }}>Quantité initiale (optionnelle)</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '15%' }}>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {tailles.map((t, idx) => (
                    <CTableRow key={idx}>
                      <CTableDataCell>
                        <CFormInput
                          value={t.nom}
                          onChange={(e) => setRow(idx, { nom: e.target.value })}
                          placeholder="Ex: S, M, L, 38, 39..."
                        />
                      </CTableDataCell>
                      <CTableDataCell>
                        <CFormInput
                          type="number"
                          min="0"
                          value={t.quantite}
                          onChange={(e) => setRow(idx, { quantite: e.target.value })}
                          placeholder="0"
                        />
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CButton
                          type="button"
                          color="danger"
                          variant="ghost"
                          size="sm"
                          disabled={tailles.length === 1}
                          onClick={() => delRow(idx)}
                          title="Supprimer la ligne"
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <div className="mt-3">
                <CButton type="submit" color="success" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>

      {/* Liste + suppression */}
      <CCol xs={12}>
        <CCard>
          <CCardHeader>
            <strong>Liste des matériels</strong>
            <CBadge color="secondary" className="ms-2">
              {loadingList ? 'Chargement...' : `${materiels.length}`}
            </CBadge>
          </CCardHeader>
          <CCardBody>
            <CTable striped bordered small>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Matériel</CTableHeaderCell>
                  <CTableHeaderCell>Nb tailles</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {materiels.map((m) => (
                  <CTableRow key={m.id}>
                    <CTableDataCell>{m.nom}</CTableDataCell>
                    <CTableDataCell>{Array.isArray(m.tailles) ? m.tailles.length : 0}</CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CButton
                        color="danger"
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === m.id}
                        onClick={() => handleDelete(m.id, m.nom)}
                        title={`Supprimer ${m.nom}`}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
                {materiels.length === 0 && !loadingList && (
                  <CTableRow>
                    <CTableDataCell colSpan={3} className="text-center">
                      Aucun matériel
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Materiel
