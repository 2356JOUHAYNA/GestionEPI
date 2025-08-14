import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'

import {
  CRow,
  CCol,
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
  CDropdownToggle,
  CWidgetStatsA,
} from '@coreui/react'
import { getStyle } from '@coreui/utils'
import { CChartLine, CChartBar } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import { cilArrowBottom, cilArrowTop, cilOptions } from '@coreui/icons'

const WidgetsDropdown = (props) => {
  const widgetChartRef1 = useRef(null)
  const widgetChartRef2 = useRef(null)

  const [stats, setStats] = useState({
    materiels_total: 0,
    stock_disponible: 0,
    affectations_par_fonction: [],
    affectations_par_mois: [],
  })

  useEffect(() => {
    axios
      .get('http://localhost:8000/api/dashboard/stats')
      .then((response) => setStats(response.data))
      .catch((error) => console.error('Erreur API:', error))
  }, [])

  useEffect(() => {
    document.documentElement.addEventListener('ColorSchemeChange', () => {
      if (widgetChartRef1.current) {
        setTimeout(() => {
          widgetChartRef1.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-primary')
          widgetChartRef1.current.update()
        })
      }
      if (widgetChartRef2.current) {
        setTimeout(() => {
          widgetChartRef2.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-info')
          widgetChartRef2.current.update()
        })
      }
    })
  }, [widgetChartRef1, widgetChartRef2])

  return (
    <CRow className={props.className} xs={{ gutter: 4 }}>
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsA
          color="primary"
          value={<>{stats.materiels_total} <span className="fs-6 fw-normal">(total)</span></>}
          title="Total Matériels"
          action={
            <CDropdown alignment="end">
              <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
                <CIcon icon={cilOptions} />
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem>Actualiser</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          }
          chart={<CChartLine ref={widgetChartRef1} className="mt-3 mx-3" style={{ height: '70px' }}
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
              datasets: [{
                label: 'Matériels',
                backgroundColor: 'transparent',
                borderColor: 'rgba(255,255,255,.55)',
                pointBackgroundColor: getStyle('--cui-primary'),
                data: [40, 50, 55, 60, 70, 80, 90],
              }],
            }}
            options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } }, elements: { line: { borderWidth: 1 }, point: { radius: 4 } } }}
          />}
        />
      </CCol>

      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsA
          color="info"
          value={<>{stats.stock_disponible} <span className="fs-6 fw-normal">(stock)</span></>}
          title="Stock Disponible"
          action={
            <CDropdown alignment="end">
              <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
                <CIcon icon={cilOptions} />
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem>Actualiser</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          }
          chart={<CChartLine ref={widgetChartRef2} className="mt-3 mx-3" style={{ height: '70px' }}
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
              datasets: [{
                label: 'Stock',
                backgroundColor: 'transparent',
                borderColor: 'rgba(255,255,255,.55)',
                pointBackgroundColor: getStyle('--cui-info'),
                data: [30, 60, 40, 80, 20, 50, 70],
              }],
            }}
            options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } }, elements: { line: { borderWidth: 1 }, point: { radius: 4 } } }}
          />}
        />
      </CCol>

      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsA
          color="warning"
          value={<>{stats.affectations_par_fonction.length} <span className="fs-6 fw-normal">(fonctions)</span></>}
          title="Fonctions Actives"
          chart={<CChartLine className="mt-3" style={{ height: '70px' }}
            data={{
              labels: ['1', '2', '3', '4', '5', '6', '7'],
              datasets: [{ label: 'Fonctions', data: stats.affectations_par_fonction.map((f) => f.total), fill: true, backgroundColor: 'rgba(255,255,255,.2)', borderColor: 'rgba(255,255,255,.55)' }],
            }}
            options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } }, elements: { line: { borderWidth: 2, tension: 0.4 }, point: { radius: 0 } } }}
          />}
        />
      </CCol>

      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsA
          color="danger"
          value={<>{stats.affectations_par_mois.reduce((sum, m) => sum + m.total, 0)} <span className="fs-6 fw-normal">(affectations)</span></>}
          title="Affectations / Mois"
          chart={<CChartBar className="mt-3 mx-3" style={{ height: '70px' }}
            data={{
              labels: stats.affectations_par_mois.map((m) => `M${m.month}`),
              datasets: [{ label: 'Par Mois', data: stats.affectations_par_mois.map((m) => m.total), backgroundColor: 'rgba(255,255,255,.2)', borderColor: 'rgba(255,255,255,.55)', barPercentage: 0.6 }],
            }}
            options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { display: false } } }}
          />}
        />
      </CCol>
    </CRow>
  )
}

WidgetsDropdown.propTypes = {
  className: PropTypes.string,
}

export default WidgetsDropdown
