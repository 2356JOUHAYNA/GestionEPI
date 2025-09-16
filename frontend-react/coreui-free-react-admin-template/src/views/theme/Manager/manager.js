import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  CRow, CCol, CCard, CCardHeader, CCardBody, CContainer,
  CForm, CFormLabel, CFormInput, CButton,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CAlert, CBadge, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilTrash, cilPencil, cilSave, cilReload, cilPeople } from '@coreui/icons'

const API = 'http://127.0.0.1:8000/api'

// modèle vide
const emptyManager = () => ({ id: null, nom: '', matricule: '' })

export default function UserManagerTeams() {
  // --- Managers CRUD
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [form, setForm] = useState(emptyManager())
  const isEdit = useMemo(() => form.id != null, [form])

  // --- Employés rattachés
  const [openTeamForId, setOpenTeamForId] = useState(null)
  const [team, setTeam] = useState([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [matriculeToAdd, setMatriculeToAdd] = useState('')

  const flash = (type, text) => setMsg({ type, text })
  const clearFlash = () => setMsg({ type: '', text: '' })

  // --------- LOADERS ---------
  const loadManagers = async () => {
    setLoading(true); clearFlash()
    try {
      const { data } = await axios.get(`${API}/epi/managers`)
      const list = Array.isArray(data) ? data : (data?.data ?? [])
      setManagers(list)
    } catch {
      flash('danger', "Impossible de charger les managers.")
    } finally {
      setLoading(false)
    }
  }

  const loadTeam = async (managerId) => {
    if (!managerId) { setTeam([]); return }
    setTeamLoading(true)
    try {
      const { data } = await axios.get(`${API}/epi/managers/${managerId}/employes`)
      const list = Array.isArray(data) ? data : (data?.data ?? [])
      setTeam(list)
    } catch {
      setTeam([])
      flash('danger', "Impossible de charger les employés.")
    } finally {
      setTeamLoading(false)
    }
  }

  useEffect(() => { loadManagers() }, [])
  useEffect(() => { loadTeam(openTeamForId) }, [openTeamForId])

  // --------- CRUD MANAGER ---------
  const saveManager = async (e) => {
    e.preventDefault(); clearFlash()
    if (!form.nom.trim() || !form.matricule.trim()) {
      flash('warning', 'Nom et matricule sont requis.')
      return
    }
    try {
      if (isEdit) {
        await axios.put(`${API}/epi/managers/${form.id}`, form)
        flash('success', 'Manager mis à jour ✅')
      } else {
        await axios.post(`${API}/epi/managers`, form)
        flash('success', 'Manager créé ✅')
      }
      setForm(emptyManager())
      await loadManagers()
    } catch (err) {
      const m = err?.response?.data?.message || "Erreur lors de l’enregistrement."
      flash('danger', m)
    }
  }

  const startEdit = (m) => { setForm({ id: m.id, nom: m.nom ?? '', matricule: m.matricule ?? '' }); clearFlash() }
  const deleteManager = async (m) => {
    clearFlash()
    if (!window.confirm(`Supprimer le manager "${m.nom}" ?`)) return
    try {
      await axios.delete(`${API}/epi/managers/${m.id}`)
      flash('success', 'Manager supprimé ✅')
      await loadManagers()
      if (String(openTeamForId) === String(m.id)) { setOpenTeamForId(null); setTeam([]) }
    } catch (err) {
      const mmsg = err?.response?.data?.message || 'Erreur lors de la suppression.'
      flash('danger', mmsg)
    }
  }

  // --------- EMPLOYÉS: ajout / retrait ---------
  const addEmployeeToTeam = async () => {
    clearFlash()
    if (!openTeamForId) return
    const matricule = (matriculeToAdd || '').trim()
    if (!matricule) return
    try {
      await axios.post(`${API}/epi/managers/${openTeamForId}/employes`, { matricule })
      setMatriculeToAdd('')
      await loadTeam(openTeamForId)
      flash('success', 'Employé ajouté ✅')
    } catch (err) {
      const code = err?.response?.status
      const m = err?.response?.data?.message
      if (code === 404) flash('danger', "Employé introuvable (matricule).")
      else if (code === 409) flash('warning', "Cet employé est déjà rattaché.")
      else flash('danger', m || "Erreur d’ajout.")
    }
  }

  const removeEmployeeFromTeam = async (emp) => {
    clearFlash()
    if (!openTeamForId) return
    if (!window.confirm(`Retirer "${emp.nom} ${emp.prenom ?? ''}" ?`)) return
    try {
      await axios.delete(`${API}/epi/managers/${openTeamForId}/employes/${emp.id}`)
      await loadTeam(openTeamForId)
      flash('success', 'Employé retiré ✅')
    } catch (err) {
      const m = err?.response?.data?.message || "Erreur lors du retrait."
      flash('danger', m)
    }
  }

  // --------- STYLES réutilisés (même thème que tes autres pages) ---------
  const heroStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 12,
    padding: '28px 18px',
    color: '#fff',
    boxShadow: '0 10px 25px rgba(102,126,234,0.25)',
    marginBottom: 16,
  }
  const cardStyle = { border: 'none', borderRadius: 14, boxShadow: '0 6px 18px rgba(0,0,0,.06)' }
  const headerBlue = {
    background: 'linear-gradient(45deg, #4a69bd, #718096)',
    color: '#fff',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottom: '3px solid #3742fa',
  }

  // --------- UI ---------
  return (
    <div style={{ background: '#f5f7fb', minHeight: '100vh', padding: '18px 0' }}>
      <CContainer>

        {/* Bandeau titre (même look que “Gestion du Stock des Matériels”) */}
        <div style={heroStyle} className="d-flex align-items-center justify-content-between">
          <div>
            <h2 className="mb-1 fw-bold">Gestion des managers</h2>
            <div className="text-white-50">Service généraux — Mappings manager ↔ employés</div>
          </div>
          <CBadge color="success" className="px-3 py-2 fs-6">
            {managers.length} managers
          </CBadge>
        </div>

        {!!msg.text && <CAlert color={msg.type} className="mb-3">{msg.text}</CAlert>}

        {/* Formulaire créer/modifier */}
        <CCard className="mb-3" style={cardStyle}>
          <CCardHeader className="fw-bold py-3" style={headerBlue}>Créer / Modifier un manager</CCardHeader>
          <CCardBody>
            <CForm onSubmit={saveManager}>
              <CRow className="g-3 align-items-end">
                <CCol md={5}>
                  <CFormLabel>Nom *</CFormLabel>
                  <CFormInput placeholder="Ex: Khaoula B." value={form.nom}
                    onChange={(e)=>setForm(f=>({...f, nom: e.target.value}))} />
                </CCol>
                <CCol md={5}>
                  <CFormLabel>Matricule *</CFormLabel>
                  <CFormInput placeholder="Ex: MNG-001" value={form.matricule}
                    onChange={(e)=>setForm(f=>({...f, matricule: e.target.value}))} />
                </CCol>
                <CCol md={2} className="d-flex gap-2">
                  <CButton type="submit" color="success" className="w-100">
                    <CIcon icon={isEdit ? cilSave : cilPlus} className="me-1" />
                    {isEdit ? 'Mettre à jour' : 'Ajouter'}
                  </CButton>
                  <CButton type="button" color="info" variant="outline" className="w-100" onClick={loadManagers}>
                    <CIcon icon={cilReload} className="me-1" /> Rafraîchir
                  </CButton>
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* Liste des managers */}
        <CCard className="mb-3" style={cardStyle}>
          <CCardHeader className="fw-bold py-3" style={headerBlue}>Managers</CCardHeader>
          <CCardBody className="p-0">
            <CTable hover className="mb-0">
              <CTableHead>
                <CTableRow style={{ background: '#f1f5f9' }}>
                  <CTableHeaderCell style={{width: 60}}>#</CTableHeaderCell>
                  <CTableHeaderCell>Nom</CTableHeaderCell>
                  <CTableHeaderCell>Matricule</CTableHeaderCell>
                  <CTableHeaderCell style={{width: 360}}>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {loading ? (
                  <CTableRow><CTableDataCell colSpan={4} className="text-center py-4"><CSpinner/> Chargement…</CTableDataCell></CTableRow>
                ) : managers.length === 0 ? (
                  <CTableRow><CTableDataCell colSpan={4} className="text-center py-4 text-muted">Aucun manager.</CTableDataCell></CTableRow>
                ) : (
                  managers.map((m, idx) => (
                    <CTableRow key={m.id}>
                      <CTableDataCell>{idx+1}</CTableDataCell>
                      <CTableDataCell>{m.nom}</CTableDataCell>
                      <CTableDataCell><CBadge color="secondary" className="px-3 py-2">{m.matricule || '-'}</CBadge></CTableDataCell>
                      <CTableDataCell>
                        <CButton size="sm" color="primary" variant="outline" className="me-2" onClick={()=>startEdit(m)}>
                          <CIcon icon={cilPencil} /> Modifier
                        </CButton>
                        <CButton size="sm" color="danger" variant="outline" className="me-2" onClick={()=>deleteManager(m)}>
                          <CIcon icon={cilTrash} /> Supprimer
                        </CButton>
                        {openTeamForId === m.id ? (
                          <CButton size="sm" color="secondary" variant="outline" onClick={()=>{ setOpenTeamForId(null); setTeam([]) }}>
                            Fermer employés
                          </CButton>
                        ) : (
                          <CButton size="sm" color="success" onClick={()=>setOpenTeamForId(m.id)}>
                            <CIcon icon={cilPeople} className="me-1" /> Employés
                          </CButton>
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>

        {/* Panneau Employés */}
        {openTeamForId && (
          <CCard style={cardStyle}>
            <CCardHeader className="fw-bold py-3" style={headerBlue}>
              {(() => {
                const m = managers.find(x => String(x.id) === String(openTeamForId))
                return <>Employés de <strong>{m?.nom || `#${openTeamForId}`}</strong></>
              })()}
            </CCardHeader>
            <CCardBody>
              <CRow className="g-3 align-items-end mb-3">
                <CCol md={4}>
                  <CFormLabel>Matricule employé</CFormLabel>
                  <CFormInput placeholder="Ex: EM01" value={matriculeToAdd} onChange={(e)=>setMatriculeToAdd(e.target.value)} />
                </CCol>
                <CCol md="auto">
                  <CButton color="success" onClick={addEmployeeToTeam}>
                    <CIcon icon={cilPlus} className="me-1" /> Ajouter
                  </CButton>
                </CCol>
                <CCol className="text-end">
                  <CButton color="info" variant="outline" onClick={()=>loadTeam(openTeamForId)}>
                    <CIcon icon={cilReload} className="me-1" /> Rafraîchir
                  </CButton>
                </CCol>
              </CRow>

              <div className="table-responsive">
                <CTable hover>
                  <CTableHead>
                    <CTableRow style={{ background: '#f1f5f9' }}>
                      <CTableHeaderCell style={{width: 60}}>#</CTableHeaderCell>
                      <CTableHeaderCell>Nom</CTableHeaderCell>
                      <CTableHeaderCell>Matricule</CTableHeaderCell>
                      <CTableHeaderCell>Action</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {teamLoading ? (
                      <CTableRow><CTableDataCell colSpan={4} className="text-center py-4"><CSpinner/> Chargement…</CTableDataCell></CTableRow>
                    ) : team.length === 0 ? (
                      <CTableRow><CTableDataCell colSpan={4} className="text-center text-muted">Aucun employé.</CTableDataCell></CTableRow>
                    ) : (
                      team.map((e, i) => (
                        <CTableRow key={e.id}>
                          <CTableDataCell>{i+1}</CTableDataCell>
                          <CTableDataCell>{`${e.nom ?? ''} ${e.prenom ?? ''}`.trim()}</CTableDataCell>
                          <CTableDataCell><CBadge color="secondary" className="px-3 py-2">{e.matricule || '-'}</CBadge></CTableDataCell>
                          <CTableDataCell>
                            <CButton size="sm" color="danger" variant="outline" onClick={()=>removeEmployeeFromTeam(e)}>
                              <CIcon icon={cilTrash} /> Retirer
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
              </div>
            </CCardBody>
          </CCard>
        )}
      </CContainer>
    </div>
  )
}
