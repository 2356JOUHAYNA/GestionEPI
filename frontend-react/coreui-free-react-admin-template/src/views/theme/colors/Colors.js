// src/views/stock/StockPage.jsx
import React, { useEffect, useState } from 'react'
import {
  CCard, CCardBody, CCardHeader,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CForm, CFormSelect, CFormInput, CButton
} from '@coreui/react'
import axios from 'axios'

const StockPage = () => {
  const [materiels, setMateriels] = useState([])
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({
    materiel_id: '', type_mouvement: 'IN', quantite: '', date_mouvement: '', motif: ''
  })

  const load = async () => {
    const [stockRes, matRes] = await Promise.all([
      axios.get('http://localhost:8000/api/epi/stocks'),
      axios.get('http://localhost:8000/api/epi/materiels'),
    ])
    setRows(stockRes.data)
    setMateriels(matRes.data)
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    await axios.post('http://localhost:8000/api/epi/stocks/move', form)
    setForm({ materiel_id: '', type_mouvement: 'IN', quantite: '', date_mouvement: '', motif: '' })
    load()
  }

  return (
    <div className="d-grid gap-3">
      <CCard>
        <CCardHeader className="bg-dark text-white">📦 Stock courant</CCardHeader>
        <CCardBody>
          <CTable bordered hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Matériel</CTableHeaderCell>
                <CTableHeaderCell>Stock</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {rows.map(r => (
                <CTableRow key={r.id}>
                  <CTableDataCell>{r.nom}</CTableDataCell>
                  <CTableDataCell>{r.stock ?? 0}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardHeader className="bg-info text-white">➕ Mouvement de stock</CCardHeader>
        <CCardBody>
          <CForm onSubmit={submit} className="row g-3">
            <div className="col-md-4">
              <CFormSelect value={form.materiel_id}
                onChange={e => setForm({ ...form, materiel_id: e.target.value })} required>
                <option value="">-- Matériel --</option>
                {materiels.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </CFormSelect>
            </div>
            <div className="col-md-2">
              <CFormSelect value={form.type_mouvement}
                onChange={e => setForm({ ...form, type_mouvement: e.target.value })}>
                <option value="IN">Entrée</option>
                <option value="OUT">Sortie</option>
                <option value="ADJ">Ajustement</option>
              </CFormSelect>
            </div>
            <div className="col-md-2">
              <CFormInput type="number" min="1" placeholder="Qté"
                value={form.quantite}
                onChange={e => setForm({ ...form, quantite: e.target.value })} required />
            </div>
            <div className="col-md-2">
              <CFormInput type="date"
                value={form.date_mouvement}
                onChange={e => setForm({ ...form, date_mouvement: e.target.value })} required />
            </div>
            <div className="col-md-2">
              <CFormInput placeholder="Motif" value={form.motif}
                onChange={e => setForm({ ...form, motif: e.target.value })} />
            </div>
            <div className="col-12 text-end">
              <CButton type="submit" color="primary">Enregistrer</CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default StockPage
