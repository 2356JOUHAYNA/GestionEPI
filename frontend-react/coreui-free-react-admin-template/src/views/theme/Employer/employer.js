// src/views/theme/Employer/employer.js
import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  CCard, CCardHeader, CCardBody,
  CRow, CCol, CContainer,
  CForm, CFormLabel, CFormInput, CFormSelect,
  CButton, CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CBadge, CAlert, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilX, cilReload } from '@coreui/icons'

const API = 'http://127.0.0.1:8000/api'

const EmployerCrud = () => {
  // --- données
  const [rows, setRows] = useState([])
  const [managers, setManagers] = useState([])
  const [fonctions, setFonctions] = useState([])

  // --- formulaire
  const [nom, setNom] = useState('')
  const [matricule, setMatricule] = useState('')
  const [managerId, setManagerId] = useState('')
  const [fonctionId, setFonctionId] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  // maps utilitaires
  const managersById = useMemo(() => {
    const m = new Map()
    managers.forEach((x) => m.set(x.id, x))
    return m
  }, [managers])

  const fonctionsById = useMemo(() => {
    const m = new Map()
    fonctions.forEach((x) => m.set(x.id, x))
    return m
  }, [fonctions])

  useEffect(() => {
    refresh()
  }, [])

  const refresh = async () => {
    setMsg({ type: '', text: '' })
    try {
      const [eRes, mRes] = await Promise.all([
        axios.get(`${API}/epi/employes`),
        axios.get(`${API}/epi/managers`),
      ])
      setRows(eRes.data || [])
      setManagers(mRes.data || [])
    } catch (e) {
      setMsg({ type: 'danger', text: `Erreur de chargement: ${e.message}` })
    }

    try {
      const { data } = await axios.get(`${API}/epi/fonctions`)
      setFonctions(data || [])
    } catch (_) {
      setFonctions([])
    }
  }

  const resetForm = () => {
    setNom('')
    setMatricule('')
    setManagerId('')
    setFonctionId('')
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })

    if (!nom.trim() || !matricule.trim()) {
      setMsg({ type: 'danger', text: 'Nom et matricule sont requis.' })
      return
    }

    const payload = {
      nom: nom.trim(),
      matricule: matricule.trim(),
      ...(managerId ? { manager_id: Number(managerId) } : { manager_id: null }),
      ...(fonctionId ? { fonction_id: Number(fonctionId) } : { fonction_id: null }),
    }

    try {
      setLoading(true)
      if (editingId) {
        await axios.put(`${API}/epi/employes/${editingId}`, payload)
        setMsg({ type: 'success', text: 'Employé mis à jour ✅' })
      } else {
        await axios.post(`${API}/epi/employes`, payload)
        setMsg({ type: 'success', text: 'Employé ajouté ✅' })
      }
      resetForm()
      await refresh()
    } catch (err) {
      const m =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.matricule?.[0] ||
        'Erreur lors de l’enregistrement.'
      setMsg({ type: 'danger', text: m })
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (r) => {
    setEditingId(r.id)
    setNom(r.nom || '')
    setMatricule(r.matricule || '')
    setManagerId(r.manager_id || '')
    setFonctionId(r.fonction_id || '')
    setMsg({ type: 'info', text: `Mode édition pour ${r.nom}` })
  }

  const cancelEdit = () => {
    resetForm()
    setMsg({ type: 'secondary', text: 'Édition annulée.' })
  }

  const remove = async (id) => {
    if (!window.confirm('Supprimer cet employé ?')) return
    try {
      await axios.delete(`${API}/epi/employes/${id}`)
      setMsg({ type: 'success', text: 'Employé supprimé ✅' })
      await refresh()
    } catch (err) {
      const m = err?.response?.data?.message || 'Suppression impossible.'
      setMsg({ type: 'danger', text: m })
    }
  }

  const getFonctionLabel = (f) => (f ? (f.nom_fonction ?? f.nom ?? '') : '')

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        padding: '2rem 0',
      }}
    >
      <CContainer>
        {/* Header */}
        <div className="text-center mb-4">
          <h1
            className="text-white mb-2"
            style={{ fontSize: '2.5rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
          >
            👥 Gestion des employés
          </h1>
          <p className="text-white-50" style={{ fontSize: '1.1rem' }}>
            Service généraux — CRUD des employés
          </p>
        </div>

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
                <span className="me-2" style={{ fontSize: '1.5rem' }}>📋</span>
                Gestion & enregistrement
              </div>
              <div className="d-flex gap-2">
                {editingId ? (
                  <CButton
                    color="secondary"
                    variant="outline"
                    size="sm"
                    onClick={cancelEdit}
                    style={{ borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none' }}
                  >
                    <CIcon icon={cilX} className="me-1" /> Annuler
                  </CButton>
                ) : null}
                <CButton
                  color="secondary"
                  variant="outline"
                  size="sm"
                  onClick={refresh}
                  style={{ borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none' }}
                >
                  <CIcon icon={cilReload} className="me-1" /> Rafraîchir
                </CButton>
              </div>
            </div>
          </CCardHeader>

          <CCardBody className="p-4" style={{ backgroundColor: '#f8fafc' }}>
            {msg.text ? (
              <CAlert
                color={msg.type}
                className="mb-4"
                style={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}
              >
                {msg.text}
              </CAlert>
            ) : null}

            {/* Formulaire */}
            <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: 10 }}>
              <CCardBody className="bg-white">
                <CForm onSubmit={handleSubmit} className="mb-0">
                  <CRow className="mb-3">
                    <CCol md={4}>
                      <CFormLabel className="fw-bold text-muted mb-2">
                        <span className="me-2">📝</span>Nom *
                      </CFormLabel>
                      <CFormInput
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        placeholder="Ex: A. Dupont"
                        style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '12px 16px', fontSize: '1rem' }}
                        className="form-control-lg"
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel className="fw-bold text-muted mb-2">
                        <span className="me-2">🔎</span>Matricule *
                      </CFormLabel>
                      <CFormInput
                        value={matricule}
                        onChange={(e) => setMatricule(e.target.value)}
                        placeholder="Ex: EM-001"
                        style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '12px 16px', fontSize: '1rem' }}
                        className="form-control-lg"
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel className="fw-bold text-muted mb-2">
                        <span className="me-2">👨‍💼</span>Manager (optionnel)
                      </CFormLabel>
                      <CFormSelect
                        value={managerId}
                        onChange={(e) => setManagerId(e.target.value)}
                        style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '10px 12px' }}
                      >
                        <option value="">-- Aucun --</option>
                        {managers.map((m) => (
                          <option key={m.id} value={m.id}>{m.nom} ({m.matricule})</option>
                        ))}
                      </CFormSelect>
                    </CCol>
                  </CRow>

                  <CRow className="mb-4">
                    <CCol md={4}>
                      <CFormLabel className="fw-bold text-muted mb-2">
                        <span className="me-2">🏷️</span>Fonction (optionnelle)
                      </CFormLabel>
                      <CFormSelect
                        value={fonctionId}
                        onChange={(e) => setFonctionId(e.target.value)}
                        style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '10px 12px' }}
                      >
                        <option value="">-- Aucune --</option>
                        {fonctions.map((f) => (
                          <option key={f.id} value={f.id}>{getFonctionLabel(f)}</option>
                        ))}
                      </CFormSelect>
                    </CCol>
                  </CRow>

                  <div className="d-flex gap-2">
                    <CButton
                      type="submit"
                      color={editingId ? 'success' : 'primary'}
                      disabled={loading}
                      style={{
                        borderRadius: 8,
                        padding: '12px 24px',
                        fontWeight: 600,
                        background: editingId
                          ? 'linear-gradient(45deg, #2ed573, #7bed9f)'
                          : 'linear-gradient(45deg, #667eea, #764ba2)',
                        border: 'none',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                      }}
                    >
                      {loading ? (
                        <><CSpinner size="sm" className="me-2" />Enregistrement...</>
                      ) : (
                        <>
                          <CIcon icon={editingId ? cilPencil : cilPlus} className="me-2" />
                          {editingId ? 'Mettre à jour' : 'Ajouter'}
                        </>
                      )}
                    </CButton>

                    {editingId ? (
                      <CButton
                        type="button"
                        color="secondary"
                        variant="outline"
                        onClick={cancelEdit}
                        style={{ borderRadius: 8, padding: '12px 24px', fontWeight: 600 }}
                      >
                        <CIcon icon={cilX} className="me-2" /> Annuler
                      </CButton>
                    ) : null}
                  </div>
                </CForm>
              </CCardBody>
            </CCard>

            {/* Tableau */}
            <CCard className="border-0 shadow-sm" style={{ borderRadius: 10 }}>
              <CCardHeader className="bg-light border-0" style={{ borderRadius: '10px 10px 0 0' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-0 fw-bold text-dark">📦 Liste des employés</h5>
                  <CBadge color="primary" className="px-3 py-2">
                    {rows.length} élément{rows.length > 1 ? 's' : ''}
                  </CBadge>
                </div>
              </CCardHeader>
              <CCardBody className="p-0">
                <div className="table-responsive">
                  <CTable className="mb-0" hover>
                    <CTableHead>
                      <CTableRow style={{ backgroundColor: '#f1f5f9' }}>
                        <CTableHeaderCell className="fw-bold text-center py-3" style={{ color: '#475569', width: 70 }}>#</CTableHeaderCell>
                        <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569' }}>Nom</CTableHeaderCell>
                        <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569' }}>Matricule</CTableHeaderCell>
                        <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569' }}>Manager</CTableHeaderCell>
                        <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569' }}>Fonction</CTableHeaderCell>
                        <CTableHeaderCell className="fw-bold text-center py-3" style={{ color: '#475569', width: 240 }}>Actions</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {rows.map((r, idx) => {
                        const m = managersById.get(r.manager_id)
                        const f = fonctionsById.get(r.fonction_id)
                        return (
                          <CTableRow key={r.id} className="align-middle">
                            <CTableDataCell className="text-center">{idx + 1}</CTableDataCell>
                            <CTableDataCell className="fw-semibold">{r.nom}</CTableDataCell>
                            <CTableDataCell>
                              <CBadge color="secondary" className="px-3 py-2">{r.matricule}</CBadge>
                            </CTableDataCell>
                            <CTableDataCell>{m ? `${m.nom} (${m.matricule})` : '—'}</CTableDataCell>
                            <CTableDataCell>{f ? getFonctionLabel(f) : '—'}</CTableDataCell>
                            <CTableDataCell className="text-center">
                              <div className="d-flex gap-2 justify-content-center">
                                <CButton
                                  size="sm"
                                  color="primary"
                                  variant="outline"
                                  onClick={() => startEdit(r)}
                                  style={{ borderRadius: 6, fontWeight: 600 }}
                                >
                                  <CIcon icon={cilPencil} className="me-1" />
                                  Modifier
                                </CButton>
                                <CButton
                                  size="sm"
                                  color="danger"
                                  variant="outline"
                                  onClick={() => remove(r.id)}
                                  style={{ borderRadius: 6, fontWeight: 600 }}
                                >
                                  <CIcon icon={cilTrash} className="me-1" />
                                  Supprimer
                                </CButton>
                              </div>
                            </CTableDataCell>
                          </CTableRow>
                        )
                      })}
                      {rows.length === 0 && (
                        <CTableRow>
                          <CTableDataCell colSpan={6} className="text-center text-muted py-4">
                            Aucun employé.
                          </CTableDataCell>
                        </CTableRow>
                      )}
                    </CTableBody>
                  </CTable>
                </div>
              </CCardBody>
            </CCard>
          </CCardBody>
        </CCard>
      </CContainer>
    </div>
  )
}

export default EmployerCrud
