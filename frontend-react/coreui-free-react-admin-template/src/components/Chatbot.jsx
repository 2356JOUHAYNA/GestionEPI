// src/components/Chatbot.jsx
import React, { useEffect, useRef, useState } from 'react'
import { CButton } from '@coreui/react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const PRIMARY_ENDPOINT = `${API}/api/epi/chat`   // si tes routes sont sous /api/epi
const FALLBACK_ENDPOINT = `${API}/api/chat`      // fallback si tu déplaces la route

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text:
        "Bonjour 👋 Pose-moi une question (ex: 'stock casque M', 'prévision gants L 3 mois', 'à commander 2 mois sécurité 5').",
    },
  ])
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  const scrollToBottom = () => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }
  useEffect(scrollToBottom, [messages, open])

  const postChat = async (url, text) => {
    const token = localStorage.getItem('token')
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message: text }),
    })

    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`)
      err.status = res.status
      throw err
    }

    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setMessages((m) => [...m, { from: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      // Essai 1 : /api/epi/chat
      let data = await postChat(PRIMARY_ENDPOINT, text)

      // Fallback automatique si pas de reply (ex: 404 sur la première route)
      if (!data?.reply) {
        try {
          data = await postChat(FALLBACK_ENDPOINT, text)
        } catch {
          // on ignore, l'erreur d'origine sera gérée ci-dessous
        }
      }

      setMessages((m) => [
        ...m,
        { from: 'bot', text: data?.reply || "Pardon, je n'ai pas compris." },
      ])
    } catch (e) {
      const hint =
        e?.status === 404
          ? "Endpoint introuvable. Vérifie ta route Laravel: POST /api/epi/chat (ou /api/chat)."
          : "Erreur de connexion à l'API."
      setMessages((m) => [...m, { from: 'bot', text: hint }])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.isComposing) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      {/* bouton flottant */}
      <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 9999 }}>
        <CButton
          color="primary"
          className="rounded-circle shadow"
          style={{ width: 56, height: 56 }}
          onClick={() => setOpen((o) => !o)}
          aria-label="Ouvrir le chatbot"
        >
          💬
        </CButton>
      </div>

      {open && (
        <div
          style={{
            position: 'fixed',
            right: 24,
            bottom: 96,
            width: 360,
            maxWidth: '90vw',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid #eee',
              fontWeight: 600,
            }}
          >
            Assistant EPI
          </div>

          <div
            ref={listRef}
            style={{ height: 360, overflowY: 'auto', padding: 12, background: '#fafafa' }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start',
                  margin: '6px 0',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    whiteSpace: 'pre-wrap',
                    background: m.from === 'user' ? '#321fdb' : '#fff',
                    color: m.from === 'user' ? '#fff' : '#333',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: '8px 10px',
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div style={{ color: '#666', fontSize: 13 }}>… le bot réfléchit</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #eee' }}>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Écrivez un message…"
              style={{
                flex: 1,
                resize: 'none',
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: '8px 10px',
              }}
            />
            <CButton color="primary" onClick={send} disabled={loading || !input.trim()}>
              Envoyer
            </CButton>
          </div>
        </div>
      )}
    </>
  )
}
