import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard, CCardBody,
  CRow, CCol,
  CForm, CFormLabel, CFormInput, CFormSelect, CButton,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CAlert, CSpinner, CBadge,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilTrash } from '@coreui/icons'
import axios from 'axios'

const BASE_URL = 'http://localhost:8000/api/epi'

/* ------------------------------- Helpers ------------------------------- */
const isNum = (s) => /^\d+$/.test(String(s ?? ''))
const normalizeSize = (v) => {
  const s = String(v ?? '').trim()
  return s ? (isNum(s) ? s : s.toUpperCase()) : ''
}
const sortSizes = (a, b) => {
  const A = normalizeSize(a), B = normalizeSize(b)
  const na = isNum(A), nb = isNum(B)
  if (na && nb) return Number(A) - Number(B)
  if (na && !nb) return -1
  if (!na && nb) return 1
  return A.localeCompare(B)
}
const pickErrorMessage = (err) => {
  const d = err?.response?.data
  if (!d) return err?.message || 'Erreur inconnue.'
  if (typeof d === 'string') return d
  if (d.message) return d.message
  if (d.errors && typeof d.errors === 'object') {
    const first = Object.values(d.errors)[0]
    if (Array.isArray(first) && first.length) return first[0]
  }
  return JSON.stringify(d)
}
const mapType = (t) => (t === 'Entrée' ? 'IN' : t === 'Sortie' ? 'OUT' : t)

/* ============================== Composant ============================== */
const MaterielCrud = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [categories, setCategories] = useState([])
  const [materiels, setMateriels] = useState([])

  /* --------------------------- Création (form) -------------------------- */
  const [categorieId, setCategorieId] = useState('')
  const [materielChoisiId, setMaterielChoisiId] = useState('')
  const [taillesDuMateriel, setTaillesDuMateriel] = useState([])
  const [rows, setRows] = useState([{ tailleId: '', nom: '', quantite: '' }])
  const [mvtType, setMvtType] = useState('Entrée')
  const [mvtDate, setMvtDate] = useState('')
  const [stockGlobal, setStockGlobal] = useState('')

  /* ------------------------------ Édition ------------------------------- */
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [editNom, setEditNom] = useState('')
  const [editCategorieId, setEditCategorieId] = useState('')
  const [rowsEdit, setRowsEdit] = useState([{ tailleId: null, nom: '', quantite: 0 }])
  const [editStockTotalCurrent, setEditStockTotalCurrent] = useState(0)
  const [editStockTotalTarget, setEditStockTotalTarget] = useState('')
  const [sizeIdByName, setSizeIdByName] = useState(new Map())
  const [currentAggByName, setCurrentAggByName] = useState(new Map())

  /* ------------------------------ Suppression --------------------------- */
  const [delOpen, setDelOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  /* ------------------------------ Historique ---------------------------- */
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyRows, setHistoryRows] = useState([])
  const [historyItem, setHistoryItem] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  /* --------------------------- Chargement init -------------------------- */
  const loadAll = async () => {
    setLoading(true); setError(null)
    try {
      const catRes = await axios.get(`${BASE_URL}/categories`, { headers: { Accept: 'application/json' } })
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.data ?? [])

      // lecture agrégée – ce endpoint doit retourner tailles + quantités courantes
      let mats = []
      try {
        const withAgg = await axios.get(`${BASE_URL}/materiels/with-tailles-agg`, { headers: { Accept: 'application/json' } })
        mats = Array.isArray(withAgg.data) ? withAgg.data : withAgg.data?.data ?? []
        mats = mats.map(m => {
          const tailles = Array.isArray(m.tailles) ? m.tailles : []
          const stock_total = tailles.reduce((s, t) => s + (Number(t.quantite) || 0), 0)
          return { ...m, tailles, stock_total }
        })
      } catch (e) {
        console.error('with-tailles-agg error:', e?.response?.data || e)
      }
      setMateriels(mats)
    } catch (e) {
      console.error(e)
      setError('Échec du chargement des données.')
    } finally { setLoading(false) }
  }
  useEffect(() => { loadAll() }, [])

  const categoriesMap = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c.nom])),
    [categories]
  )

  const uniqueMateriels = useMemo(() => {
    const byName = new Map()
    for (const m of (materiels || [])) {
      const key = String(m.nom || '').trim().toLowerCase()
      if (!key) continue
      const cur = byName.get(key)
      if (!cur || Number(m.id) < Number(cur.id)) byName.set(key, m)
    }
    return Array.from(byName.values()).sort((a, b) =>
      String(a.nom || '').localeCompare(String(b.nom || ''), 'fr', { sensitivity: 'base', numeric: true })
    )
  }, [materiels])

  /* ----------------------------- Création API --------------------------- */
  useEffect(() => {
    setTaillesDuMateriel([])
    setRows([{ tailleId: '', nom: '', quantite: '' }])
    if (!materielChoisiId) return
    axios.get(`${BASE_URL}/materiels/${materielChoisiId}/tailles`, { headers: { Accept: 'application/json' } })
      .then(res => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.tailles ?? res.data ?? []
        const byName = new Map()
        raw.forEach(t => {
          const nom = normalizeSize(t.nom)
          if (!nom) return
          if (!byName.has(nom)) byName.set(nom, { id: t.id, nom })
        })
        const list = Array.from(byName.values()).sort((a, b) => sortSizes(a.nom, b.nom))
        setTaillesDuMateriel(list)
      })
      .catch(() => setTaillesDuMateriel([]))
  }, [materielChoisiId])

  const setRow = (i, patch) => setRows(prev => { const cp = [...prev]; cp[i] = { ...cp[i], ...patch }; return cp })
  const addRow = () => setRows(prev => [...prev, { tailleId: '', nom: '', quantite: '' }])
  const rmRow  = (i)   => setRows(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i))
  const clearRows = () => setRows([{ tailleId: '', nom: '', quantite: '' }])
  const tailleIdsPris = useMemo(() => new Set(rows.map(r => String(r.tailleId || '')).filter(Boolean)), [rows])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError(null)
    if (!materielChoisiId) return setError('Veuillez sélectionner un matériel.')
    if (!categorieId) return setError('Veuillez choisir une catégorie.')
    const typeNorm = mapType(mvtType)
    const dateToUse = mvtDate || new Date().toISOString().split('T')[0]

    // agrégation par taille_id
    const agg = new Map()
    for (const r of rows) {
      const q = Number(r.quantite || 0)
      if (q <= 0) continue
      if (taillesDuMateriel.length > 0) {
        if (!r.tailleId) return setError('Veuillez choisir une taille dans la liste.')
        const key = String(r.tailleId)
        agg.set(key, (agg.get(key) || 0) + q)
      }
    }

    let payload
    if (agg.size > 0) {
      payload = {
        materiel_id: Number(materielChoisiId),
        type: typeNorm,
        date: dateToUse,
        tailles: Array.from(agg, ([taille_id, quantite]) => ({ taille_id: Number(taille_id), quantite: Number(quantite) })),
      }
    } else {
      if (stockGlobal === '' || Number(stockGlobal) <= 0) {
        return setError('Aucune taille sélectionnée et stock global nul.')
      }
      payload = { materiel_id: Number(materielChoisiId), type: typeNorm, quantite: Number(stockGlobal), date: dateToUse }
    }

    try {
      await axios.post(`${BASE_URL}/mouvements`, payload, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })
      // reset
      setMaterielChoisiId(''); setCategorieId(''); setStockGlobal(''); setTaillesDuMateriel([]); clearRows()
      setMvtType('Entrée'); setMvtDate('')
      await loadAll()
    } catch (err) {
      console.error(err?.response?.data || err)
      setError(pickErrorMessage(err))
    }
  }

  /* ------------------------------ ÉDITION ------------------------------- */
  const openEdit = async (m) => {
    setEditItem(m)
    setEditNom(m.nom || '')
    setEditCategorieId(String(m.categorie_id ?? m.categorie?.id ?? ''))

    const agg = new Map()
    let total = 0
    for (const t of (m.tailles || [])) {
      const nom = normalizeSize(t.nom)
      const q = Number(t.quantite || 0)
      agg.set(nom, q)
      total += q
    }
    setCurrentAggByName(agg)
    setEditStockTotalCurrent(total)
    setEditStockTotalTarget(String(total))

    try {
      const tr = await axios.get(`${BASE_URL}/materiels/${m.id}/tailles`, { headers: { Accept: 'application/json' } })
      const raw = Array.isArray(tr.data) ? tr.data : tr.data?.tailles ?? []
      const idMap = new Map()
      raw.forEach(t => {
        const nom = normalizeSize(t.nom)
        if (!nom) return
        if (!idMap.has(nom)) idMap.set(nom, Number(t.id))
      })
      setSizeIdByName(idMap)

      const lignes = Array.from(agg, ([nom, q]) => ({
        tailleId: idMap.get(nom) ?? null,
        nom, quantite: q,
      })).sort((a, b) => sortSizes(a.nom, b.nom))
      setRowsEdit(lignes.length ? lignes : [{ tailleId: null, nom: '', quantite: 0 }])
    } catch {
      setSizeIdByName(new Map())
      const lignes = Array.from(agg, ([nom, q]) => ({ tailleId: null, nom, quantite: q }))
      setRowsEdit(lignes.length ? lignes : [{ tailleId: null, nom: '', quantite: 0 }])
    }

    setEditOpen(true)
  }

  const setRowEdit = (i, patch) => setRowsEdit(prev => { const cp = [...prev]; cp[i] = { ...cp[i], ...patch }; return cp })
  const addRowEdit = () => setRowsEdit(prev => [...prev, { tailleId: null, nom: '', quantite: 0 }])
  const rmRowEdit  = (i)   => setRowsEdit(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i))

  const handleUpdate = async () => {
    if (!editItem) return
    setSaving(true); setError(null)

    try {
      // 1) update nom/catégorie si changé
      const body = {}
      if (editNom.trim() && editNom.trim() !== editItem.nom) body.nom = editNom.trim()
      if (editCategorieId && String(editCategorieId) !== String(editItem.categorie_id ?? editItem.categorie?.id ?? '')) {
        body.categorie_id = Number(editCategorieId)
      }
      if (Object.keys(body).length) {
        await axios.put(`${BASE_URL}/materiels/${editItem.id}`, body, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })
      }

      // 2) diffs par taille -> mouvements
      const desiredByName = new Map()
      rowsEdit.forEach(r => {
        const nom = normalizeSize(r.nom)
        if (!nom) return
        const q = Math.max(0, Number(r.quantite || 0))
        desiredByName.set(nom, (desiredByName.get(nom) || 0) + q)
      })

      const current = currentAggByName
      const allNames = new Set([...current.keys(), ...desiredByName.keys()])
      const deltasIn = []
      const deltasOut = []

      for (const nom of allNames) {
        const cur = Number(current.get(nom) || 0)
        const wanted = Number(desiredByName.get(nom) || 0)
        const delta = wanted - cur
        if (delta === 0) continue
        const tailleId = sizeIdByName.get(nom) ?? null
        const rec = { ...(tailleId ? { taille_id: tailleId } : {}), quantite: Math.abs(delta) }
        if (delta > 0) deltasIn.push(rec)
        else deltasOut.push(rec)
      }

      const today = new Date().toISOString().split('T')[0]
      if (deltasIn.length) {
        await axios.post(`${BASE_URL}/mouvements`, {
          materiel_id: editItem.id, type: 'IN', date: today, tailles: deltasIn,
        }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })
      }
      if (deltasOut.length) {
        await axios.post(`${BASE_URL}/mouvements`, {
          materiel_id: editItem.id, type: 'OUT', date: today, tailles: deltasOut,
        }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })
      }

      // 3) ajustement global si nouveau total renseigné
      const desiredTotal = Array.from(desiredByName.values()).reduce((s, n) => s + Number(n || 0), 0)
      const targetTotal = editStockTotalTarget === '' ? desiredTotal : Number(editStockTotalTarget)
      const deltaTotal = targetTotal - desiredTotal
      if (deltaTotal !== 0) {
        await axios.post(`${BASE_URL}/mouvements`, {
          materiel_id: editItem.id,
          type: deltaTotal > 0 ? 'IN' : 'OUT',
          quantite: Math.abs(deltaTotal),
          date: today,
        }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })
      }

      setEditOpen(false)
      await loadAll()
    } catch (e) {
      console.error(e?.response?.data || e)
      setError(pickErrorMessage(e))
    } finally { setSaving(false) }
  }

  /* ------------------------------ Suppression --------------------------- */
  const doDelete = async () => {
    if (!toDelete) return
    try {
      // ⬇️ Seule modification : on vide le stock (mouvements) du matériel
      await axios.delete(`${BASE_URL}/mouvements/by-materiel/${toDelete.id}`, { headers: { Accept: 'application/json' } })
      setDelOpen(false); setToDelete(null)
      await loadAll()
    } catch (e) {
      console.error(e?.response?.data || e)
      setError(pickErrorMessage(e))
    }
  }

  /* ------------------------------ Historique ---------------------------- */
  const openHistory = async (m) => {
    setHistoryItem(m); setHistoryRows([]); setHistoryOpen(true); setHistoryLoading(true)
    try {
      const res = await axios.get(`${BASE_URL}/stocks/${m.id}/history`, { headers: { Accept: 'application/json' } })
      let rows = Array.isArray(res.data) ? res.data : res.data?.data ?? []

      // rajoute le nom de taille si le backend ne le donne pas
      const needMap = rows.some(r => !r.taille_nom && r.taille_id)
      if (needMap) {
        try {
          const tRes = await axios.get(`${BASE_URL}/materiels/${m.id}/tailles`, { headers: { Accept: 'application/json' } })
          const raw = Array.isArray(tRes.data) ? tRes.data : tRes.data?.tailles ?? []
          const idToName = new Map(raw.map(t => [Number(t.id), t.nom]))
          rows = rows.map(r => ({ ...r, taille_nom: r.taille_nom ?? (r.taille_id ? idToName.get(Number(r.taille_id)) : null) }))
        } catch {}
      }
      setHistoryRows(rows)
    } catch (e) {
      console.error(e?.response?.data || e)
      setHistoryRows([])
    } finally { setHistoryLoading(false) }
  }

  /* ================================= UI ================================ */
  return (
    <CCard className="shadow-sm">
      <CCardBody>
        <h3 className="mb-4">📦 Gestion du Stock des Matériels</h3>
        {error && <CAlert color="danger" className="mb-3">{error}</CAlert>}

        {/* -------------------- Formulaire d’ajout -------------------- */}
        <CForm onSubmit={handleCreate} className="mb-4">
          <CRow className="g-3">
            <CCol md={6}>
              <CFormLabel>Type de matériel</CFormLabel>
              <CFormSelect value={materielChoisiId} onChange={(e) => setMaterielChoisiId(e.target.value)}>
                <option value="">-- Sélectionner un matériel --</option>
                {uniqueMateriels.map(m => (
                  <option key={m.id} value={m.id}>{m.nom}</option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol md={6}>
              <CFormLabel>Catégorie</CFormLabel>
              <CFormSelect value={categorieId} onChange={(e) => setCategorieId(e.target.value)}>
                <option value="">-- Sélectionner --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </CFormSelect>
            </CCol>

            {/* lignes tailles */}
            <CCol xs={12}>
              <CFormLabel>Répartition par taille</CFormLabel>
              {rows.map((r, i) => {
                const options = taillesDuMateriel.filter(t => !(
                  r.tailleId !== String(t.id) && [...tailleIdsPris].includes(String(t.id))
                ))
                return (
                  <CRow key={i} className="g-2 mb-2">
                    <CCol md={6}>
                      {taillesDuMateriel.length > 0 ? (
                        <CFormSelect
                          value={r.tailleId}
                          onChange={(e) => {
                            const id = e.target.value
                            const nomT = taillesDuMateriel.find(t => String(t.id) === String(id))?.nom || ''
                            setRow(i, { tailleId: id, nom: nomT })
                          }}
                        >
                          <option value="">-- Choisir la taille --</option>
                          {options.map(t => <option key={t.id} value={String(t.id)}>{t.nom}</option>)}
                        </CFormSelect>
                      ) : (
                        <CFormInput placeholder="Ex : 40, M, XL…" value={r.nom}
                                    onChange={(e) => setRow(i, { nom: normalizeSize(e.target.value) })} />
                      )}
                    </CCol>
                    <CCol md={4}>
                      <CFormInput type="number" min="0" placeholder="Quantité"
                                  value={r.quantite} onChange={(e) => setRow(i, { quantite: e.target.value })} />
                    </CCol>
                    <CCol md={2} className="d-grid">
                      <CButton type="button" color="danger" variant="outline"
                               onClick={() => rmRow(i)} disabled={rows.length === 1}>Suppr.</CButton>
                    </CCol>
                  </CRow>
                )
              })}
              <div className="d-flex flex-wrap gap-2 mb-2">
                <CButton size="sm" color="secondary" variant="outline" type="button" onClick={addRow}>+ Ajouter une ligne</CButton>
                <CButton size="sm" color="danger" variant="outline" type="button" onClick={clearRows}>Vider</CButton>
              </div>
              {taillesDuMateriel.length === 0 && (
                <>
                  <small className="text-body-secondary d-block mb-1">
                    Ce matériel n’a pas de tailles (ou aucune sélection). Saisis un mouvement global :
                  </small>
                  <CRow className="g-2">
                    <CCol md={6}>
                      <CFormLabel className="mb-1">Quantité globale</CFormLabel>
                      <CFormInput type="number" min="0" value={stockGlobal}
                                  onChange={(e) => setStockGlobal(e.target.value)} />
                    </CCol>
                  </CRow>
                </>
              )}
            </CCol>

            {/* Mouvement */}
            <CCol md={3} sm={6}>
              <CFormLabel>Type de mouvement</CFormLabel>
              <CFormSelect value={mvtType} onChange={(e) => setMvtType(e.target.value)}>
                <option>Entrée</option><option>Sortie</option>
              </CFormSelect>
            </CCol>
            <CCol md={3} sm={6}>
              <CFormLabel>Date du mouvement</CFormLabel>
              <CFormInput type="date" value={mvtDate} onChange={(e) => setMvtDate(e.target.value)} />
            </CCol>

            <CCol xs={12}>
              <CButton type="submit" color="success">Ajouter</CButton>
            </CCol>
          </CRow>
        </CForm>

        <hr className="mb-3" />
        <h5 className="mb-3">🧾 Liste des matériels</h5>

        {loading ? (
          <div className="text-center py-5"><CSpinner /> Chargement…</div>
        ) : (
          <CTable hover bordered>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell style={{ width: '26%' }}>Nom</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '12%' }}>Stock total</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '18%' }}>Catégorie</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '18%' }}>Tailles</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '8%' }} className="text-end">Quantités</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '18%' }}>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {materiels.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center text-body-secondary">Aucun matériel</CTableDataCell>
                </CTableRow>
              ) : materiels.map((m) => {
                const sizeList = (m.tailles || []).slice().sort((a, b) => sortSizes(a.nom, b.nom))
                const stockTotal = m.stock_total ?? sizeList.reduce((s, t) => s + (Number(t.quantite) || 0), 0)
                return (
                  <CTableRow key={m.id}>
                    <CTableDataCell className="text-capitalize">{m.nom}</CTableDataCell>
                    <CTableDataCell>{stockTotal}</CTableDataCell>
                    <CTableDataCell>{m.categorie?.nom || categoriesMap[m.categorie_id] || '—'}</CTableDataCell>
                    <CTableDataCell>
                      {sizeList.length === 0 ? <span className="text-body-secondary">—</span> : (
                        <div className="d-flex flex-column gap-1">
                          {sizeList.map((t) => (
                            <CBadge key={`${m.id}-${t.nom}`} color={isNum(t.nom) ? 'primary' : 'info'}
                                    className="px-3 py-2 rounded-pill text-white fw-semibold">
                              {t.nom}
                            </CBadge>
                          ))}
                        </div>
                      )}
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      {sizeList.length === 0 ? <span className="text-body-secondary">—</span> : (
                        <div className="d-flex flex-column gap-2">
                          {sizeList.map((t) => (
                            <div key={`${m.id}-${t.nom}-q`} className="fw-semibold">{Number(t.quantite) || 0}</div>
                          ))}
                        </div>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton color="info" variant="outline" className="me-2" onClick={() => openHistory(m)}>Historique</CButton>
                      <CButton color="warning" className="me-2" onClick={() => openEdit(m)}>
                        <CIcon icon={cilPencil} className="me-1" /> Modifier
                      </CButton>
                      <CButton color="danger" onClick={() => { setToDelete(m); setDelOpen(true) }}>
                        <CIcon icon={cilTrash} className="me-1" /> Supprimer
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                )
              })}
            </CTableBody>
          </CTable>
        )}

        {/* -------- Modale Historique -------- */}
        <CModal visible={historyOpen} onClose={() => setHistoryOpen(false)} size="lg">
          <CModalHeader onClose={() => setHistoryOpen(false)}>
            <CModalTitle>Historique — {historyItem?.nom}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            {historyLoading ? (
              <div className="text-center py-4"><CSpinner /> Chargement…</div>
            ) : historyRows.length === 0 ? (
              <div className="text-body-secondary">Aucun mouvement.</div>
            ) : (
              <CTable hover bordered small>
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Type</CTableHeaderCell>
                    <CTableHeaderCell>Taille</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Quantité</CTableHeaderCell>
                    <CTableHeaderCell>Motif</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {historyRows.map((r, i) => (
                    <CTableRow key={i}>
                      <CTableDataCell>{r.date_mouvement ?? r.date}</CTableDataCell>
                      <CTableDataCell>{r.type_mouvement ?? r.type}</CTableDataCell>
                      <CTableDataCell>{r.taille_nom ?? r.taille?.nom ?? (r.taille_id ?? '—')}</CTableDataCell>
                      <CTableDataCell className="text-end">{r.quantite}</CTableDataCell>
                      <CTableDataCell>{r.motif ?? '—'}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            )}
          </CModalBody>
        </CModal>

        {/* -------- Modale Édition -------- */}
        <CModal visible={editOpen} onClose={() => setEditOpen(false)} size="lg">
          <CModalHeader onClose={() => setEditOpen(false)}>
            <CModalTitle>Modifier le matériel</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CRow className="g-3">
              <CCol xs={12}>
                <CFormLabel>Nom</CFormLabel>
                <CFormInput value={editNom} onChange={(e) => setEditNom(e.target.value)} />
              </CCol>
              <CCol xs={12}>
                <CFormLabel>Catégorie</CFormLabel>
                <CFormSelect value={editCategorieId} onChange={(e) => setEditCategorieId(e.target.value)}>
                  <option value="">-- Sélectionner --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </CFormSelect>
              </CCol>

              <CCol md={6}>
                <CFormLabel>Stock total actuel</CFormLabel>
                <CFormInput value={editStockTotalCurrent} disabled />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Nouveau stock total (optionnel)</CFormLabel>
                <CFormInput type="number" min="0" value={editStockTotalTarget}
                            onChange={(e) => setEditStockTotalTarget(e.target.value)} />
              </CCol>

              <CCol xs={12} className="mt-2">
                <CFormLabel>Tailles (nom + quantité souhaitée)</CFormLabel>
                {rowsEdit.map((r, i) => (
                  <CRow key={i} className="g-2 mb-2">
                    <CCol sm={6}>
                      <CFormInput placeholder="Ex : 40, M, XL…" value={r.nom}
                                  onChange={(e) => setRowEdit(i, { nom: normalizeSize(e.target.value) })} />
                    </CCol>
                    <CCol sm={4}>
                      <CFormInput type="number" min="0" placeholder="Quantité" value={r.quantite}
                                  onChange={(e) => setRowEdit(i, { quantite: e.target.value })} />
                    </CCol>
                    <CCol sm={2} className="d-grid">
                      <CButton type="button" color="danger" variant="outline"
                               onClick={() => rmRowEdit(i)} disabled={rowsEdit.length === 1}>Suppr.</CButton>
                    </CCol>
                  </CRow>
                ))}
                <div className="d-flex flex-wrap gap-2">
                  <CButton size="sm" color="secondary" variant="outline" type="button" onClick={addRowEdit}>
                    + Ajouter une ligne
                  </CButton>
                </div>
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Annuler</CButton>
            <CButton color="warning" onClick={handleUpdate} disabled={saving}>
              <CIcon icon={cilPencil} className="me-1" />
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </CButton>
          </CModalFooter>
        </CModal>

        {/* -------- Modale Suppression -------- */}
        <CModal visible={delOpen} onClose={() => setDelOpen(false)}>
          <CModalHeader onClose={() => setDelOpen(false)}>
            <CModalTitle>Supprimer</CModalTitle>
          </CModalHeader>
          <CModalBody>Supprimer le matériel <strong>{toDelete?.nom}</strong> ?</CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={() => setDelOpen(false)}>Annuler</CButton>
            <CButton color="danger" onClick={doDelete}><CIcon icon={cilTrash} className="me-1" /> Supprimer</CButton>
          </CModalFooter>
        </CModal>
      </CCardBody>
    </CCard>
  )
}

export default MaterielCrud
