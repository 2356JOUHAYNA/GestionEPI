// src/views/theme/Manager/Manager.js
import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  CRow, CCol, CCard, CCardHeader, CCardBody, CContainer,
  CForm, CFormLabel, CFormInput, CButton,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CAlert, CBadge, CInputGroup, CInputGroupText, CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilTrash, cilPencil, cilSave, cilX, cilReload } from '@coreui/icons'

const API = 'http://127.0.0.1:8000/api'

const emptyManager = () => ({ id: null, nom: '', matricule: '' })

export default function Manager() {
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  // Form manager (create/update)
  const [form, setForm] = useState(emptyManager())
  const isEdit = useMemo(() => form.id != null, [form])

  // Team management (expanded manager)
  const [opened, setOpened] = useState(null)        // manager id
  const [team, setTeam] = useState([])              // employes of opened manager
  const [teamLoading, setTeamLoading] = useState(false)
  const [addMatricule, setAddMatricule] = useState('')

  // Helpers
  const flash = (type, text) => setMsg({ type, text })
  const clearFlash = () => setMsg({ type: '', text: '' })

  // Load managers
  const loadManagers = async () => {
    setLoading(true)
    clearFlash()
    try {
      const { data } = await axios.get(`${API}/epi/managers`)
      setManagers(data || [])
    } catch (e) {
      flash('danger', "Impossible de charger les managers.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadManagers()
  }, [])

  // Create / Update
  const saveManager = async (e) => {
    e.preventDefault()
    clearFlash()
    if (!form.nom.trim() || !form.matricule.trim()) {
      flash('warning', 'Nom et matricule sont requis.')
      return
    }

    try {
      if (isEdit) {
        await axios.put(`${API}/epi/managers/${form.id}`, {
          nom: form.nom.trim(),
          matricule: form.matricule.trim(),
        })
        flash('success', 'Manager mis à jour ✅')
      } else {
        await axios.post(`${API}/epi/managers`, {
          nom: form.nom.trim(),
          matricule: form.matricule.trim(),
        })
        flash('success', 'Manager créé ✅')
      }
      setForm(emptyManager())
      loadManagers()
    } catch (err) {
      const m =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.matricule?.[0] ||
        'Erreur lors de l’enregistrement.'
      flash('danger', m)
    }
  }

  const startEdit = (m) => {
    setForm({ id: m.id, nom: m.nom ?? '', matricule: m.matricule ?? '' })
    clearFlash()
  }

  const cancelEdit = () => setForm(emptyManager())

  // Delete
  const deleteManager = async (m) => {
    clearFlash()
    if (!window.confirm(`Supprimer le manager "${m.nom}" ?`)) return
    try {
      await axios.delete(`${API}/epi/managers/${m.id}`)
      flash('success', 'Manager supprimé ✅')
      if (opened === m.id) {
        setOpened(null)
        setTeam([])
      }
      loadManagers()
    } catch (err) {
      const code = err?.response?.status
      const msg = err?.response?.data?.message
      if (code === 409) {
        flash('warning', msg || 'Suppression refusée : des employés sont rattachés.')
      } else {
        flash('danger', msg || 'Erreur lors de la suppression.')
      }
    }
  }

  // Team: list / add / remove
  const openTeam = async (managerId) => {
    if (opened === managerId) {
      setOpened(null)
      setTeam([])
      return
    }
    setOpened(managerId)
    setTeam([])
    setAddMatricule('')
    await loadTeam(managerId)
  }

  const loadTeam = async (managerId) => {
    setTeamLoading(true)
    try {
      const { data } = await axios.get(`${API}/epi/managers/${managerId}/employes`)
      setTeam(Array.isArray(data) ? data : [])
    } catch (e) {
      flash('danger', 'Impossible de charger l’équipe.')
    } finally {
      setTeamLoading(false)
    }
  }

  const attachByMatricule = async () => {
    if (!addMatricule.trim()) return
    try {
      await axios.post(`${API}/epi/managers/${opened}/employes`, { matricule: addMatricule.trim() })
      setAddMatricule('')
      await loadTeam(opened)
      flash('success', 'Employé ajouté à l’équipe ✅')
    } catch (err) {
      const m = err?.response?.data?.message || 'Employé introuvable ou erreur.'
      flash('danger', m)
    }
  }

  const detach = async (empId) => {
    if (!window.confirm('Retirer cet employé de l’équipe ?')) return
    try {
      await axios.delete(`${API}/epi/managers/${opened}/employes/${empId}`)
      await loadTeam(opened)
      flash('success', 'Employé retiré ✅')
    } catch (err) {
      const m = err?.response?.data?.message || 'Erreur lors du retrait.'
      flash('danger', m)
    }
  }

  // UI
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
            👨‍💼 Gestion des managers
          </h1>
          <p className="text-white-50" style={{ fontSize: '1.1rem' }}>
            CRUD + gestion des équipes rattachées
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
                <span className="me-2" style={{ fontSize: '1.5rem' }}>📝</span>
                Formulaire — créer / mettre à jour
              </div>
              <CBadge color="light" text="dark" className="px-3 py-2">
                {loading ? 'Chargement…' : `${managers.length} manager${managers.length > 1 ? 's' : ''}`}
              </CBadge>
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

            <CForm onSubmit={saveManager} className="mb-0">
              <CRow className="g-3 align-items-end">
                <CCol md={5}>
                  <CFormLabel className="fw-bold text-muted mb-2">
                    <span className="me-2">👤</span>Nom *
                  </CFormLabel>
                  <CFormInput
                    value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    placeholder="Ex: Khaoula B."
                    style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '12px 16px' }}
                    className="form-control-lg"
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel className="fw-bold text-muted mb-2">
                    <span className="me-2">🆔</span>Matricule *
                  </CFormLabel>
                  <CFormInput
                    value={form.matricule}
                    onChange={(e) => setForm((f) => ({ ...f, matricule: e.target.value }))}
                    placeholder="Ex: MNG-001"
                    style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '12px 16px' }}
                    className="form-control-lg"
                  />
                </CCol>
                <CCol md={3} className="d-flex gap-2">
                  <CButton
                    type="submit"
                    color="success"
                    style={{
                      borderRadius: 8,
                      padding: '12px 20px',
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #2ed573, #7bed9f)',
                      border: 'none',
                      boxShadow: '0 4px 15px rgba(46, 213, 115, 0.3)',
                    }}
                  >
                    <CIcon icon={isEdit ? cilSave : cilPlus} className="me-1" />
                    {isEdit ? 'Mettre à jour' : 'Ajouter'}
                  </CButton>
                  {isEdit && (
                    <CButton type="button" color="secondary" variant="outline" onClick={cancelEdit} style={{ borderRadius: 8 }}>
                      <CIcon icon={cilX} className="me-1" /> Annuler
                    </CButton>
                  )}
                  <CButton
                    type="button"
                    color="info"
                    variant="outline"
                    onClick={loadManagers}
                    disabled={loading}
                    style={{ borderRadius: 8 }}
                  >
                    <CIcon icon={cilReload} className="me-1" /> Rafraîchir
                  </CButton>
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* Liste des managers */}
        <CCard className="shadow-lg border-0 mt-4" style={{ borderRadius: 15, overflow: 'hidden' }}>
          <CCardHeader
            className="text-white fw-bold py-3"
            style={{
              background: 'linear-gradient(45deg, #4a69bd, #718096)',
              fontSize: '1.2rem',
              borderBottom: '3px solid #3742fa',
            }}
          >
            <div className="d-flex align-items-center">
              <span className="me-2" style={{ fontSize: '1.5rem' }}>📋</span>
              Managers & équipes
            </div>
          </CCardHeader>

          <CCardBody className="p-0">
            <div className="table-responsive">
              <CTable className="mb-0" hover>
                <CTableHead>
                  <CTableRow style={{ backgroundColor: '#f1f5f9' }}>
                    <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569', width: 60 }}>#</CTableHeaderCell>
                    <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569' }}>Nom</CTableHeaderCell>
                    <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569' }}>Matricule</CTableHeaderCell>
                    <CTableHeaderCell className="fw-bold py-3" style={{ color: '#475569', width: 320 }}>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading && managers.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={4} className="text-center py-4">
                        <CSpinner /> <span className="ms-2">Chargement…</span>
                      </CTableDataCell>
                    </CTableRow>
                  ) : managers.map((m, idx) => (
                    <React.Fragment key={m.id}>
                      <CTableRow className="align-middle">
                        <CTableDataCell>{idx + 1}</CTableDataCell>
                        <CTableDataCell className="fw-semibold">{m.nom}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="secondary" className="px-3 py-2 rounded-pill">{m.matricule}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex flex-wrap gap-2">
                            <CButton color="primary" variant="outline" size="sm" onClick={() => startEdit(m)} style={{ borderRadius: 6, fontWeight: 600 }}>
                              <CIcon icon={cilPencil} className="me-1" /> Modifier
                            </CButton>
                            <CButton color="danger" variant="outline" size="sm" onClick={() => deleteManager(m)} style={{ borderRadius: 6, fontWeight: 600 }}>
                              <CIcon icon={cilTrash} className="me-1" /> Supprimer
                            </CButton>
                            <CButton
                              color={opened === m.id ? 'secondary' : 'success'}
                              variant="outline"
                              size="sm"
                              onClick={() => openTeam(m.id)}
                              style={{ borderRadius: 6, fontWeight: 600 }}
                            >
                              {opened === m.id ? 'Fermer équipe' : 'Équipe'}
                            </CButton>
                          </div>
                        </CTableDataCell>
                      </CTableRow>

                      {/* Bloc équipe (expand) */}
                      {opened === m.id && (
                        <CTableRow>
                          <CTableDataCell colSpan={4} className="bg-white">
                            <div className="p-3">
                              <div className="mb-3 d-flex align-items-center justify-content-between">
                                <strong className="fs-5">👥 Équipe de {m.nom}</strong>
                                <CButton
                                  size="sm"
                                  color="info"
                                  variant="outline"
                                  onClick={() => loadTeam(m.id)}
                                  disabled={teamLoading}
                                  style={{ borderRadius: 8 }}
                                >
                                  <CIcon icon={cilReload} className="me-1" />
                                  Rafraîchir
                                </CButton>
                              </div>

                              <CInputGroup className="mb-3" style={{ maxWidth: 560 }}>
                                <CInputGroupText>Matricule employé</CInputGroupText>
                                <CFormInput
                                  placeholder="Ex: EMP-0042"
                                  value={addMatricule}
                                  onChange={(e) => setAddMatricule(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && attachByMatricule()}
                                  style={{ borderRadius: 8, border: '2px solid #e2e8f0' }}
                                />
                                <CButton
                                  color="success"
                                  onClick={attachByMatricule}
                                  style={{
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    background: 'linear-gradient(45deg, #2ed573, #7bed9f)',
                                    border: 'none',
                                  }}
                                >
                                  <CIcon icon={cilPlus} className="me-1" /> Ajouter
                                </CButton>
                              </CInputGroup>

                              <div className="table-responsive">
                                <CTable bordered small className="mb-0">
                                  <CTableHead>
                                    <CTableRow style={{ backgroundColor: '#f8fafc' }}>
                                      <CTableHeaderCell style={{ width: 60 }}>#</CTableHeaderCell>
                                      <CTableHeaderCell>Nom</CTableHeaderCell>
                                      <CTableHeaderCell>Matricule</CTableHeaderCell>
                                      <CTableHeaderCell style={{ width: 140 }}>Action</CTableHeaderCell>
                                    </CTableRow>
                                  </CTableHead>
                                  <CTableBody>
                                    {team.length === 0 && (
                                      <CTableRow>
                                        <CTableDataCell colSpan={4} className="text-center text-muted py-3">
                                          {teamLoading ? 'Chargement…' : 'Aucun employé.'}
                                        </CTableDataCell>
                                      </CTableRow>
                                    )}
                                    {team.map((e, i) => (
                                      <CTableRow key={e.id}>
                                        <CTableDataCell>{i + 1}</CTableDataCell>
                                        <CTableDataCell>{e.nom ?? e.name ?? '-'}</CTableDataCell>
                                        <CTableDataCell>
                                          <CBadge color="light" textColor="dark" className="px-3 py-2 rounded-pill">
                                            {e.matricule ?? '-'}
                                          </CBadge>
                                        </CTableDataCell>
                                        <CTableDataCell>
                                          <CButton color="danger" variant="ghost" size="sm" onClick={() => detach(e.id)} style={{ borderRadius: 6 }}>
                                            <CIcon icon={cilTrash} /> Retirer
                                          </CButton>
                                        </CTableDataCell>
                                      </CTableRow>
                                    ))}
                                  </CTableBody>
                                </CTable>
                              </div>
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      )}
                    </React.Fragment>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          </CCardBody>
        </CCard>
      </CContainer>
    </div>
  )
}
