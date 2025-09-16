import React, { useEffect, useRef, useState } from 'react'
import { CButton } from '@coreui/react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const CHAT_ENDPOINT = `${API_BASE}/api/epi/chat` 

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text:
        "Bonjour 👋 Pose-moi une question (ex: 'stock chaussur 38', 'prévision chaussur 38 6 mois', 'à commander 2 mois sécurité 5').",
    },
  ])
  const listRef = useRef(null)

  const scrollToBottom = () => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }
  useEffect(scrollToBottom, [messages, open])

  async function sendMessage(text) {
    const token = localStorage.getItem('token') // si tu en as un, sinon ignore
    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message: text }),
    })
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await res.json() : null

    if (!res.ok) {
      const reason = data?.message || `${res.status} ${res.statusText}`
      throw new Error(reason)
    }
    return data
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setMessages((m) => [...m, { from: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const data = await sendMessage(text)
      setMessages((m) => [...m, { from: 'bot', text: data?.reply ?? "Pardon, je n'ai pas compris." }])
    } catch (e) {
      const msg =
        String(e.message || '')
          .toLowerCase()
          .includes('not found') || String(e.message || '').startsWith('404')
          ? "❌ Endpoint introuvable. Vérifie que l'API répond sur POST /api/epi/chat."
          : `❌ Erreur API: ${e.message}`
      setMessages((m) => [...m, { from: 'bot', text: msg }])
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
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #eee', fontWeight: 600 }}>
            Assistant EPI
          </div>

          <div ref={listRef} style={{ height: 360, overflowY: 'auto', padding: 12, background: '#fafafa' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start', margin: '6px 0' }}>
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
