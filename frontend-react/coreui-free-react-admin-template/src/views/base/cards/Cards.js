import React, { useEffect, useState } from 'react'
import {
  CCard, CCardBody, CCardHeader, CForm, CFormInput, CFormLabel, CFormSelect,
  CButton, CAlert, CSpinner, CRow, CCol, CBadge
} from '@coreui/react'
import axios from 'axios'

const AffectationForm = () => {
  const [managers, setManagers] = useState([])
  const [materiels, setMateriels] = useState([])
  const [tailles, setTailles] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
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
          axios.get('http://localhost:8000/api/epi/managers'),
          axios.get('http://localhost:8000/api/epi/materiels')
        ])
        setManagers(manRes.data)
        setMateriels(matRes.data)
      } catch (err) {
        setLoadError(true)
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const fetchTailles = async (materielId, idx) => {
    if (!materielId) return
    try {
      const response = await axios.get(`http://localhost:8000/api/epi/materiels/${materielId}/tailles`)
      setTailles(prev => ({ ...prev, [idx]: response.data }))
    } catch (error) {
      console.error("Erreur lors du chargement des tailles", error)
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
      await axios.post('http://localhost:8000/api/epi/affectations', formData)
      alert("✅ Affectation enregistrée avec succès")
      setFormData({
        manager_id: '',
        date: '',
        commentaire: '',
        affectations: [],
      })
      setTailles({})
    } catch (err) {
      if (err.response) {
        console.error("Erreur backend :", err.response.data)
        alert("❌ Erreur serveur : " + JSON.stringify(err.response.data))
      } else {
        console.error("Erreur inconnue :", err)
        alert("❌ Erreur inconnue : " + err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const getTotalQuantite = () => {
    return formData.affectations.reduce((total, aff) => {
      return total + aff.tailles.reduce((sum, t) => sum + (parseInt(t.quantite) || 0), 0)
    }, 0)
  }

  return (
    <div className="container-fluid">
      <style jsx>{`
        .form-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          border: none;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .form-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 50px rgba(0,0,0,0.15);
        }

        .card-header-custom {
          background: linear-gradient(45deg, #764ba2 , #20c997);
          border: none;
          padding: 1.5rem 2rem;
          position: relative;
          overflow: hidden;
        }

        .card-header-custom::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><defs><radialGradient id="a" cx="50%" cy="40%" r="50%"><stop offset="0%" stop-color="white" stop-opacity="0.1"/><stop offset="100%" stop-color="white" stop-opacity="0"/></radialGradient></defs><rect width="100" height="20" fill="url(%23a)"/></svg>');
        }

        .card-body-custom {
          background: linear-gradient(to bottom, #ffffff, #f8f9ff);
          padding: 2rem;
        }

        .form-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: white;
          border-radius: 15px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          border-left: 4px solid #764ba2 ;
          transition: all 0.3s ease;
        }

        .form-section:hover {
          transform: translateX(5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12);
        }

        .materiel-card {
          background: linear-gradient(135deg, #f8f9ff, #ffffff);
          border: 2px solid transparent;
          border-radius: 15px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .materiel-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #007bff, #6f42c1, #e83e8c);
        }

        .materiel-card:hover {
          border-color: rgba(0,123,255,0.3);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,123,255,0.15);
        }

        .taille-row {
          background: rgba(0,123,255,0.05);
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 0.5rem;
          border-left: 3px solid #007bff;
          transition: all 0.2s ease;
        }

        .taille-row:hover {
          background: rgba(0,123,255,0.1);
          transform: translateX(5px);
        }

        .btn-custom {
          border-radius: 25px;
          padding: 0.5rem 1.5rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
          border: none;
          position: relative;
          overflow: hidden;
        }

        .btn-custom::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          transition: all 0.3s ease;
          transform: translate(-50%, -50%);
        }

        .btn-custom:hover::before {
          width: 300px;
          height: 300px;
        }

        .btn-primary-custom {
          background: linear-gradient(45deg, #007bff, #6f42c1);
          color: white;
        }

        .btn-success-custom {
          background: linear-gradient(45deg,#764ba2 ,#764ba2 );
          color: white;
        }

        .btn-info-custom {
          background: linear-gradient(45deg, #17a2b8, #007bff);
          color: white;
        }

        .btn-danger-custom {
          background: linear-gradient(45deg, #dc3545, #e83e8c);
          color: white;
        }

        .form-label-custom {
          color: #495057;
          font-weight: 600;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-control-custom {
          border: 2px solid #e9ecef;
          border-radius: 10px;
          padding: 0.75rem;
          transition: all 0.3s ease;
        }

        .form-control-custom:focus {
          border-color: #007bff;
          box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
          transform: translateY(-1px);
        }

        .section-title {
          background: linear-gradient(45deg, #764ba2 , #764ba2 );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }

        .stats-badge {
          background: linear-gradient(45deg, #6f42c1, #e83e8c);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 3rem;
          gap: 1rem;
        }

        .spinner-custom {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <CCard className="form-card fade-in">
        <CCardHeader className="card-header-custom text-center">
          <h3 className="mb-0 text-white">
            <i className="fas fa-clipboard-list me-2"></i>
            Affectation de Matériel EPI
          </h3>
          <p className="mb-0 mt-2 text-white-50">Gestion des équipements de protection individuelle</p>
        </CCardHeader>
        
        <CCardBody className="card-body-custom">
          {loadError && (
            <CAlert color="danger" className="mb-4 border-0 rounded-3 shadow-sm">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Erreur lors du chargement des données
            </CAlert>
          )}
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner-custom"></div>
              <p className="text-muted">Chargement des données...</p>
            </div>
          ) : (
            <CForm onSubmit={handleSubmit}>
              {/* Section Informations Générales */}
              <div className="form-section">
                <h5 className="section-title">
                  <i className="fas fa-info-circle"></i>
                  Informations Générales
                </h5>
                
                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormLabel className="form-label-custom">
                      <i className="fas fa-user-tie"></i>
                      Manager Responsable
                    </CFormLabel>
                    <CFormSelect 
                      className="form-control-custom" 
                      name="manager_id" 
                      value={formData.manager_id} 
                      onChange={handleGlobalChange} 
                      required
                    >
                      <option value="">-- Sélectionner un manager --</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.matricule} - {m.nom}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  
                  <CCol md={6}>
                    <CFormLabel className="form-label-custom">
                      <i className="fas fa-calendar-alt"></i>
                      Date d'affectation
                    </CFormLabel>
                    <CFormInput 
                      className="form-control-custom" 
                      type="date" 
                      name="date" 
                      value={formData.date} 
                      onChange={handleGlobalChange} 
                      required 
                    />
                  </CCol>
                </CRow>
                
                <div className="mt-3">
                  <CFormLabel className="form-label-custom">
                    <i className="fas fa-comment"></i>
                    Commentaire
                  </CFormLabel>
                  <CFormInput 
                    className="form-control-custom" 
                    name="commentaire" 
                    value={formData.commentaire} 
                    onChange={handleGlobalChange}
                    placeholder="Ajouter des notes ou observations..."
                  />
                </div>
              </div>

              {/* Section Matériels */}
              <div className="form-section">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="section-title mb-0">
                    <i className="fas fa-boxes"></i>
                    Matériels à Affecter
                  </h5>
                  {formData.affectations.length > 0 && (
                    <CBadge className="stats-badge">
                      <i className="fas fa-chart-bar me-1"></i>
                      Total: {getTotalQuantite()} unités
                    </CBadge>
                  )}
                </div>

                {formData.affectations.map((aff, idx) => (
                  <div className="materiel-card fade-in" key={idx}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="text-primary mb-0 fw-bold">
                        <i className="fas fa-box me-2"></i>
                        Matériel #{idx + 1}
                      </h6>
                      <CButton 
                        className="btn-custom btn-danger-custom btn-sm"
                        onClick={() => handleRemoveMateriel(idx)}
                      >
                        <i className="fas fa-trash me-1"></i>
                        Supprimer
                      </CButton>
                    </div>
                    
                    <CFormLabel className="form-label-custom">
                      <i className="fas fa-hard-hat"></i>
                      Type de matériel
                    </CFormLabel>
                    <CFormSelect 
                      className="form-control-custom mb-3" 
                      value={aff.materiel_id} 
                      onChange={(e) => handleMaterielChange(idx, e.target.value)} 
                      required
                    >
                      <option value="">-- Sélectionner un matériel --</option>
                      {materiels.map(m => (
                        <option key={m.id} value={m.id}>{m.nom}</option>
                      ))}
                    </CFormSelect>

                    <CFormLabel className="form-label-custom">
                      <i className="fas fa-ruler"></i>
                      Répartition par taille
                    </CFormLabel>
                    
                    {aff.tailles.map((t, i) => (
                      <div key={i} className="taille-row">
                        <CRow className="g-2 align-items-center">
                          <CCol md={5}>
                            <CFormSelect
                              className="form-control-custom"
                              value={t.taille_id}
                              onChange={e => handleTailleChange(idx, i, 'taille_id', e.target.value)}
                              required
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
                              className="form-control-custom"
                              type="number"
                              min="1"
                              placeholder="Quantité"
                              value={t.quantite}
                              onChange={e => handleTailleChange(idx, i, 'quantite', e.target.value)}
                              required
                            />
                          </CCol>
                          
                          <CCol md={3} className="text-end">
                            {aff.tailles.length > 1 && (
                              <CButton 
                                className="btn-custom btn-danger-custom btn-sm"
                                onClick={() => removeTailleLine(idx, i)}
                              >
                                <i className="fas fa-minus"></i>
                              </CButton>
                            )}
                          </CCol>
                        </CRow>
                      </div>
                    ))}

                    <div className="mt-3">
                      <CButton 
                        className="btn-custom btn-info-custom btn-sm"
                        onClick={() => addTailleLine(idx)}
                      >
                        <i className="fas fa-plus me-1"></i>
                        Ajouter une taille
                      </CButton>
                    </div>
                  </div>
                ))}

                <div className="text-center">
                  <CButton 
                    className="btn-custom btn-primary-custom"
                    onClick={handleAddMateriel}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Ajouter un matériel
                  </CButton>
                </div>
              </div>

              {/* Bouton de soumission */}
              <div className="text-center pt-3">
                <CButton 
                  type="submit" 
                  className="btn-custom btn-success-custom btn-lg px-5"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-2"></i>
                      Enregistrer l'Affectation
                    </>
                  )}
                </CButton>
              </div>
            </CForm>
          )}
        </CCardBody>
      </CCard>
    </div>
  )
}

export default AffectationForm