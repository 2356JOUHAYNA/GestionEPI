// src/views/pages/login/Login.js
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../../api.js'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
} from '@coreui/react'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await API.post('/auth/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // 👉 redirection vers l'écran d’affectation
      navigate('/base/cards', { replace: true })
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.email?.[0] ||
        err?.response?.data?.errors?.password?.[0] ||
        'Identifiants incorrects.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 12px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo + titre */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <img
            src="/logomenaraprefa.png"
            alt="Menara Préfa"
            style={{ height: 60 }}
          />
          <div
            style={{
              color: 'white',
              fontWeight: 700,
              marginTop: 8,
              fontSize: 18,
              textShadow: '0 1px 2px rgba(0,0,0,.2)',
            }}
          >
            Menara Préfa
          </div>
        </div>

        <CCard className="shadow-lg" style={{ border: 'none', borderRadius: 14 }}>
          <CCardHeader
            className="fw-bold"
            style={{
              border: 'none',
              borderTopLeftRadius: 14,
              borderTopRightRadius: 14,
              background: 'linear-gradient(45deg,#4a69bd,#718096)',
              color: 'white',
              fontSize: 18,
            }}
          >
            Connexion
          </CCardHeader>

          <CCardBody style={{ padding: 22 }}>
            {error && (
              <CAlert color="danger" className="mb-3" style={{ borderRadius: 10 }}>
                {error}
              </CAlert>
            )}

            <CForm onSubmit={onSubmit} autoComplete="on">
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

              <div className="mb-4">
                <label className="form-label">Mot de passe</label>
                <CFormInput
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              <CButton
                color="primary"
                type="submit"
                disabled={loading}
                className="w-100"
                style={{
                  border: 'none',
                  fontWeight: 600,
                  padding: '10px 12px',
                  borderRadius: 10,
                }}
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </CButton>
            </CForm>

            {/* Lien vers Inscription */}
            <div className="text-center" style={{ marginTop: 14, fontSize: 14, color: '#64748b' }}>
              Pas de compte ?
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="btn btn-link p-0 ms-1"
                style={{ textDecoration: 'none', fontWeight: 600 }}
              >
                Créer un compte
              </button>
            </div>
          </CCardBody>
        </CCard>
      </div>
    </div>
  )
}
