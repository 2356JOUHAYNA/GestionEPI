// src/views/pages/register/Register.js
import React, { useState } from 'react'
import API from '../../../api.js'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CAlert,
} from '@coreui/react'

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setErreur('')
    setLoading(true)
    try {
      await API.post('/auth/register', form)
      // ✅ Inscription OK -> redirection vers Login
      window.location.hash = '#/login'
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.password?.[0] ||
        'Impossible de créer le compte.'
      setErreur(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 540 }}>
        {/* Logo + Titre */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img
            src="/logomenaraprefa.png"
            alt="Menara Préfa"
            style={{ height: 60, marginBottom: 8 }}
          />
          <h2 style={{ color: 'white', fontWeight: 700, margin: 0 }}>
            Menara Préfa
          </h2>
        </div>

        <CCard className="shadow-lg" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <CCardHeader
            className="text-white fw-bold"
            style={{
              background: 'linear-gradient(45deg, #4a69bd, #718096)',
              fontSize: '1.1rem',
            }}
          >
            Inscription
          </CCardHeader>

          <CCardBody style={{ padding: 24 }}>
            {erreur && (
              <CAlert color="danger" className="mb-3">
                {erreur}
              </CAlert>
            )}

            <CForm onSubmit={onSubmit} autoComplete="on">
              <div className="mb-3">
                <label className="form-label">Nom complet</label>
                <CFormInput
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  autoComplete="name"
                  disabled={loading}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email</label>
                <CFormInput
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Mot de passe</label>
                <CFormInput
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  required
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Confirmer le mot de passe</label>
                <CFormInput
                  type="password"
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={onChange}
                  required
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>

              <CButton
                color="dark"
                type="submit"
                disabled={loading}
                className="w-100"
                style={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  height: 48,
                  fontWeight: 600,
                }}
              >
                {loading ? 'Création…' : 'Créer mon compte'}
              </CButton>
            </CForm>

            {/* Ligne “déjà un compte ?” */}
            <div className="text-center mt-3">
              <span className="text-muted">Déjà un compte ? </span>
              <a href="#/login" style={{ fontWeight: 600 }}>
                Se connecter
              </a>
            </div>
          </CCardBody>
        </CCard>
      </div>
    </div>
  )
}
