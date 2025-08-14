import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CAlert,
} from '@coreui/react'
import axios from 'axios'

const AffectationForm = () => {
  const [formData, setFormData] = useState({
    employe: '',
    materiel: '',
    taille: '',
    date: '',
    commentaire: '',
  })

  const [employes, setEmployes] = useState([])
  const [materiels, setMateriels] = useState([])
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, matRes] = await Promise.all([
          axios.get('http://localhost:8000/api/epi/employes'),
          axios.get('http://localhost:8000/api/epi/materiels'),
        ])
        setEmployes(empRes.data)
        setMateriels(matRes.data)
      } catch (error) {
        setLoadError(true)
        console.error('Erreur de chargement des données :', error)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:8000/api/epi/affectations', formData)
      alert('✅ Affectation enregistrée avec succès')
      setFormData({ employe: '', materiel: '', taille: '', date: '', commentaire: '' })
    } catch (error) {
      alert("❌ Erreur lors de l'enregistrement")
      console.error(error)
    }
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>Affectation de Matériel</CCardHeader>
      <CCardBody>
        {loadError && (
          <CAlert color="danger">Impossible de charger les données depuis la base de données.</CAlert>
        )}
        <CForm onSubmit={handleSubmit}>
          <div className="mb-3">
            <CFormLabel>Employé</CFormLabel>
            <CFormSelect name="employe" value={formData.employe} onChange={handleChange} required>
              <option value="">-- Choisir un employé --</option>
              {employes.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.matricule} - {emp.nom}
                </option>
              ))}
            </CFormSelect>
          </div>

          <div className="mb-3">
            <CFormLabel>Matériel</CFormLabel>
            <CFormSelect name="materiel" value={formData.materiel} onChange={handleChange} required>
              <option value="">-- Choisir un matériel --</option>
              {materiels.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.nom}
                </option>
              ))}
            </CFormSelect>
          </div>

          <div className="mb-3">
            <CFormLabel>Taille</CFormLabel>
            <CFormInput
              type="text"
              name="taille"
              value={formData.taille}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Date d'affectation</CFormLabel>
            <CFormInput
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Commentaire</CFormLabel>
            <CFormInput
              type="text"
              name="commentaire"
              value={formData.commentaire}
              onChange={handleChange}
            />
          </div>

          <CButton color="success" type="submit">
            Enregistrer
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default AffectationForm
