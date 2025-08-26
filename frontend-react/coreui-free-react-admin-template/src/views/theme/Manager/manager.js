import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  CRow, CCol, CCard, CCardHeader, CCardBody,
  CForm, CFormLabel, CFormInput, CButton,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CAlert, CBadge, CInputGroup, CInputGroupText,
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

  // ─────────────────────────────────────────────────────────────
  // Helpers
  const flash = (type, text) => setMsg({ type, text })
  const clearFlash = () => setMsg({ type: '', text: '' })

  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // Delete
  const deleteManager = async (m) => {
    clearFlash()
    if (!window.confirm(`Supprimer le manager "${m.nom}" ?`)) return
    try {
      await axios.delete(`${API}/epi/managers/${m.id}`)
      flash('success', 'Manager supprimé ✅')
      // si on supprime le manager actuellement ouvert, on replie le bloc équipe
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

  // ─────────────────────────────────────────────────────────────
  // Team: list / add / remove
  const openTeam = async (managerId) => {
    if (opened === managerId) {
      // toggle: close
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

  // ─────────────────────────────────────────────────────────────

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Gestion des managers</strong>
            <CBadge color="info" className="ms-2">CRUD + équipes</CBadge>
          </CCardHeader>
          <CCardBody>

            {msg.text && <CAlert color={msg.type} className="mb-3">{msg.text}</CAlert>}

            {/* Formulaire create/update */}
            <CForm onSubmit={saveManager} className="mb-4">
              <CRow className="g-3 align-items-end">
                <CCol md={5}>
                  <CFormLabel>Nom *</CFormLabel>
                  <CFormInput
                    value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    placeholder="Ex: Khaoula B."
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>Matricule *</CFormLabel>
                  <CFormInput
                    value={form.matricule}
                    onChange={(e) => setForm((f) => ({ ...f, matricule: e.target.value }))}
                    placeholder="Ex: MNG-001"
                  />
                </CCol>
                <CCol md={3} className="d-flex gap-2">
                  <CButton type="submit" color="success">
                    <CIcon icon={isEdit ? cilSave : cilPlus} className="me-1" />
                    {isEdit ? 'Mettre à jour' : 'Ajouter'}
                  </CButton>
                  {isEdit && (
                    <CButton type="button" color="secondary" variant="outline" onClick={cancelEdit}>
                      <CIcon icon={cilX} className="me-1" /> Annuler
                    </CButton>
                  )}
                  <CButton type="button" color="info" variant="outline" onClick={loadManagers} disabled={loading}>
                    <CIcon icon={cilReload} className="me-1" /> Rafraîchir
                  </CButton>
                </CCol>
              </CRow>
            </CForm>

            {/* Liste managers */}
            <CTable striped bordered responsive small>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell style={{ width: 60 }}>#</CTableHeaderCell>
                  <CTableHeaderCell>Nom</CTableHeaderCell>
                  <CTableHeaderCell>Matricule</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: 260 }}>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {managers.map((m, idx) => (
                  <React.Fragment key={m.id}>
                    <CTableRow>
                      <CTableDataCell>{idx + 1}</CTableDataCell>
                      <CTableDataCell>{m.nom}</CTableDataCell>
                      <CTableDataCell><CBadge color="secondary">{m.matricule}</CBadge></CTableDataCell>
                      <CTableDataCell className="d-flex gap-2">
                        <CButton color="primary" variant="outline" size="sm" onClick={() => startEdit(m)}>
                          <CIcon icon={cilPencil} className="me-1" /> Modifier
                        </CButton>
                        <CButton color="danger" variant="outline" size="sm" onClick={() => deleteManager(m)}>
                          <CIcon icon={cilTrash} className="me-1" /> Supprimer
                        </CButton>
                        <CButton
                          color={opened === m.id ? 'secondary' : 'success'}
                          variant="outline"
                          size="sm"
                          onClick={() => openTeam(m.id)}
                        >
                          {opened === m.id ? 'Fermer équipe' : 'Équipe'}
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>

                    {/* Bloc équipe (expand) */}
                    {opened === m.id && (
                      <CTableRow>
                        <CTableDataCell colSpan={4}>
                          <div className="mb-3 d-flex align-items-center justify-content-between">
                            <strong>Équipe de {m.nom}</strong>
                            <CButton
                              size="sm"
                              color="info"
                              variant="outline"
                              onClick={() => loadTeam(m.id)}
                              disabled={teamLoading}
                            >
                              <CIcon icon={cilReload} className="me-1" />
                              Rafraîchir
                            </CButton>
                          </div>

                          <CInputGroup className="mb-3" style={{ maxWidth: 520 }}>
                            <CInputGroupText>Matricule employé</CInputGroupText>
                            <CFormInput
                              placeholder="Ex: EMP-0042"
                              value={addMatricule}
                              onChange={(e) => setAddMatricule(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && attachByMatricule()}
                            />
                            <CButton color="success" onClick={attachByMatricule}>
                              <CIcon icon={cilPlus} className="me-1" /> Ajouter
                            </CButton>
                          </CInputGroup>

                          <CTable bordered small>
                            <CTableHead>
                              <CTableRow>
                                <CTableHeaderCell style={{ width: 60 }}>#</CTableHeaderCell>
                                <CTableHeaderCell>Nom</CTableHeaderCell>
                                <CTableHeaderCell>Matricule</CTableHeaderCell>
                                <CTableHeaderCell style={{ width: 120 }}>Action</CTableHeaderCell>
                              </CTableRow>
                            </CTableHead>
                            <CTableBody>
                              {team.length === 0 && (
                                <CTableRow>
                                  <CTableDataCell colSpan={4} className="text-center text-muted">
                                    {teamLoading ? 'Chargement…' : 'Aucun employé.'}
                                  </CTableDataCell>
                                </CTableRow>
                              )}
                              {team.map((e, i) => (
                                <CTableRow key={e.id}>
                                  <CTableDataCell>{i + 1}</CTableDataCell>
                                  <CTableDataCell>{e.nom ?? e.name ?? '-'}</CTableDataCell>
                                  <CTableDataCell>
                                    <CBadge color="light" textColor="dark">{e.matricule ?? '-'}</CBadge>
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CButton color="danger" variant="ghost" size="sm" onClick={() => detach(e.id)}>
                                      <CIcon icon={cilTrash} /> Retirer
                                    </CButton>
                                  </CTableDataCell>
                                </CTableRow>
                              ))}
                            </CTableBody>
                          </CTable>
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </React.Fragment>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}
