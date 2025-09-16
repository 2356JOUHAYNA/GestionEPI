import React, { useEffect, useState } from 'react'
import {
  CCard, CCardBody, CCardHeader,
  CRow, CCol, CContainer,
  CForm, CFormLabel, CFormInput, CFormSelect, CButton,
  CAlert, CSpinner, CBadge,
} from '@coreui/react'
import axios from 'axios'

const BASE_URL = 'http://localhost:8000/api/epi'

const AffectationForm = () => {
  const [managers, setManagers] = useState([])
  const [materiels, setMateriels] = useState([])
  const [tailles, setTailles] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    manager_id: '',
    date: '',
    commentaire: '',
    affectations: [],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [manRes, matRes] = await Promise.all([
          axios.get(`${BASE_URL}/managers`),
          axios.get(`${BASE_URL}/materiels`),
        ])
        setManagers(manRes.data)
        setMateriels(matRes.data)
      } catch (err) {
        console.error(err)
        setError("Erreur lors du chargement des données.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const fetchTailles = async (materielId, idx) => {
    if (!materielId) return
    try {
      const res = await axios.get(`${BASE_URL}/materiels/${materielId}/tailles`)
      setTailles(prev => ({ ...prev, [idx]: res.data }))
    } catch (err) {
      console.error(err)
    }
  }

  const handleGlobalChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleAddMateriel = () => {
    setFormData({
      ...formData,
      affectations: [...formData.affectations, {
        materiel_id: '',
        tailles: [{ taille_id: '', quantite: '' }]
      }]
    })
  }

  const handleRemoveMateriel = (idx) => {
    const updated = [...formData.affectations]
    updated.splice(idx, 1)
    const taillesCopy = { ...tailles }
    delete taillesCopy[idx]
    setTailles(taillesCopy)
    setFormData({ ...formData, affectations: updated })
  }

  const handleMaterielChange = (idx, value) => {
    const updated = [...formData.affectations]
    updated[idx].materiel_id = value
    updated[idx].tailles = [{ taille_id: '', quantite: '' }]
    setFormData({ ...formData, affectations: updated })
    fetchTailles(value, idx)
  }

  const handleTailleChange = (matIdx, tailleIdx, field, value) => {
    const updated = [...formData.affectations]
    updated[matIdx].tailles[tailleIdx][field] = value
    setFormData({ ...formData, affectations: updated })
  }

  const addTailleLine = (matIdx) => {
    const updated = [...formData.affectations]
    updated[matIdx].tailles.push({ taille_id: '', quantite: '' })
    setFormData({ ...formData, affectations: updated })
  }

  const removeTailleLine = (matIdx, tailleIdx) => {
    const updated = [...formData.affectations]
    updated[matIdx].tailles.splice(tailleIdx, 1)
    setFormData({ ...formData, affectations: updated })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await axios.post(`${BASE_URL}/affectations`, formData)
      alert("✅ Affectation enregistrée avec succès")
      setFormData({
        manager_id: '',
        date: '',
        commentaire: '',
        affectations: [],
      })
      setTailles({})
    } catch (err) {
      console.error(err?.response?.data || err)
      alert("❌ Erreur lors de l’enregistrement")
    } finally {
      setSubmitting(false)
    }
  }

  const getTotalQuantite = () =>
    formData.affectations.reduce(
      (total, aff) =>
        total + aff.tailles.reduce((s, t) => s + (parseInt(t.quantite) || 0), 0),
      0
    )

  /* ================================= UI ================================ */
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
            Affectation de Matériel EPI
          </h1>
          <p className="text-white-50" style={{ fontSize: '1.1rem' }}>
            Gestion des équipements de protection individuelle
          </p>
        </div>

        {/* Carte formulaire */}
        <CCard className="shadow-lg border-0 mb-4" style={{ borderRadius: 15, overflow: 'hidden' }}>
          <CCardHeader
            className="text-white fw-bold py-3"
            style={{
              background: 'linear-gradient(45deg, #4a69bd, #718096)',
              fontSize: '1.2rem',
              borderBottom: '3px solid #3742fa',
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>Affectation</div>
              {/* ✅ Badge corrigé (plus de gris) */}
              <CBadge
                color="success"
                className="px-3 py-2"
                style={{ fontSize: '1rem', fontWeight: '600' }}
              >
                Total: {getTotalQuantite()} unités
              </CBadge>
            </div>
          </CCardHeader>

          <CCardBody className="p-4" style={{ backgroundColor: '#f8fafc' }}>
            {error && (
              <CAlert color="danger" className="mb-4">
                {error}
              </CAlert>
            )}

            {loading ? (
              <div className="text-center py-5">
                <CSpinner /> <span className="ms-2">Chargement…</span>
              </div>
            ) : (
              <CForm onSubmit={handleSubmit}>
                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormLabel className="fw-bold text-muted mb-2">Manager Responsable</CFormLabel>
                    <CFormSelect
                      name="manager_id"
                      value={formData.manager_id}
                      onChange={handleGlobalChange}
                      required
                      style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '10px 12px' }}
                    >
                      <option value="">-- Sélectionner --</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.matricule} - {m.nom}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel className="fw-bold text-muted mb-2">Date d’affectation</CFormLabel>
                    <CFormInput
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleGlobalChange}
                      required
                      style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '10px 12px' }}
                    />
                  </CCol>

                  <CCol xs={12}>
                    <CFormLabel className="fw-bold text-muted mb-2">Commentaire</CFormLabel>
                    <CFormInput
                      name="commentaire"
                      value={formData.commentaire}
                      onChange={handleGlobalChange}
                      placeholder="Notes ou observations…"
                      style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '10px 12px' }}
                    />
                  </CCol>
                </CRow>

                {/* Liste des matériels */}
                <div className="mt-4">
                  {formData.affectations.map((aff, idx) => (
                    <CCard key={idx} className="mb-3 shadow-sm" style={{ borderRadius: 12 }}>
                      <CCardBody>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-bold text-primary mb-0">Matériel #{idx + 1}</h6>
                          <CButton
                            color="danger"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMateriel(idx)}
                            style={{ borderRadius: 6 }}
                          >
                            Supprimer
                          </CButton>
                        </div>

                        <CFormSelect
                          value={aff.materiel_id}
                          onChange={(e) => handleMaterielChange(idx, e.target.value)}
                          required
                          style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '10px 12px' }}
                        >
                          <option value="">-- Sélectionner un matériel --</option>
                          {materiels.map(m => (
                            <option key={m.id} value={m.id}>{m.nom}</option>
                          ))}
                        </CFormSelect>

                        <div className="mt-3">
                          {aff.tailles.map((t, i) => (
                            <CRow key={i} className="g-2 mb-2">
                              <CCol md={6}>
                                <CFormSelect
                                  value={t.taille_id}
                                  onChange={(e) => handleTailleChange(idx, i, 'taille_id', e.target.value)}
                                  required
                                  style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '10px 12px' }}
                                >
                                  <option value="">-- Choisir la taille --</option>
                                  {(tailles[idx] || []).map(taille => (
                                    <option key={taille.id} value={taille.id}>
                                      {taille.nom || taille.libelle}
                                    </option>
                                  ))}
                                </CFormSelect>
                              </CCol>
                              <CCol md={4}>
                                <CFormInput
                                  type="number"
                                  min="1"
                                  placeholder="Quantité"
                                  value={t.quantite}
                                  onChange={(e) => handleTailleChange(idx, i, 'quantite', e.target.value)}
                                  required
                                  style={{ borderRadius: 8, border: '2px solid #e2e8f0', padding: '10px 12px' }}
                                />
                              </CCol>
                              <CCol md={2} className="d-grid">
                                {aff.tailles.length > 1 && (
                                  <CButton
                                    color="danger"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeTailleLine(idx, i)}
                                    style={{ borderRadius: 6 }}
                                  >
                                    -
                                  </CButton>
                                )}
                              </CCol>
                            </CRow>
                          ))}
                          <CButton
                            size="sm"
                            color="secondary"
                            variant="outline"
                            onClick={() => addTailleLine(idx)}
                            style={{ borderRadius: 8 }}
                          >
                            + Ajouter une taille
                          </CButton>
                        </div>
                      </CCardBody>
                    </CCard>
                  ))}

                  <div className="text-center">
                    <CButton
                      type="button"
                      color="primary"
                      variant="outline"
                      onClick={handleAddMateriel}
                      style={{ borderRadius: 8, fontWeight: 600 }}
                    >
                      + Ajouter un matériel
                    </CButton>
                  </div>
                </div>

                {/* Bouton enregistrer */}
                <div className="text-center pt-4">
                  <CButton
                    type="submit"
                    color="success"
                    disabled={submitting}
                    style={{
                      borderRadius: 8,
                      padding: '12px 24px',
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #2ed573, #7bed9f)',
                      border: 'none',
                      boxShadow: '0 4px 15px rgba(46, 213, 115, 0.3)',
                    }}
                  >
                    {submitting ? (
                      <>Enregistrement…</>
                    ) : (
                      <>Enregistrer l’affectation</>
                    )}
                  </CButton>
                </div>
              </CForm>
            )}
          </CCardBody>
        </CCard>
      </CContainer>
    </div>
  )
}

export default AffectationForm
