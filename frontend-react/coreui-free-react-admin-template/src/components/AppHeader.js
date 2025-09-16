// src/components/AppHeader.js
import React, { useEffect, useRef, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CHeader,
  CContainer,
  CHeaderToggler,
  CHeaderBrand,
  CButton,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilMenu,
  cilSettings,
  cilSun,
  cilMoon,
  cilAccountLogout,
} from '@coreui/icons'
import axios from 'axios'
import { AppBreadcrumb } from './index'

const TITLES = {
  '/dashboard': 'Dashboard',
  '/base/tables': 'Tables',
  '/theme/materiel': 'Matériel',
  '/theme/colors': 'Couleurs',
  '/theme/typography': 'Typographie',
  '/theme/employer': 'Employés',
  '/manager': 'Managers',
}
const pretty = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const AppHeader = () => {
  const headerRef = useRef(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const location = useLocation()

  const pageTitle = useMemo(() => {
    const p = location.pathname
    if (TITLES[p]) return TITLES[p]
    const seg = p.split('/').filter(Boolean).pop() || 'Dashboard'
    return pretty(seg)
  }, [location.pathname])

  const { colorMode, setColorMode } =
    useColorModes('coreui-free-react-admin-template-theme')
  const toggleMode = () => setColorMode(colorMode === 'dark' ? 'light' : 'dark')

  useEffect(() => {
    const onScroll = () => {
      if (!headerRef.current) return
      headerRef.current.classList.toggle(
        'shadow-sm',
        document.documentElement.scrollTop > 0,
      )
    }
    document.addEventListener('scroll', onScroll)
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  // Déconnexion
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          await axios.post(
            'http://localhost:8000/api/logout',
            {},
            { headers: { Authorization: `Bearer ${token}` } },
          )
        } catch (_) {
          /* on ignore les erreurs API pour quand même déconnecter côté client */
        }
      }
    } finally {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      navigate('/login', { replace: true })
    }
  }

  return (
    <CHeader position="sticky" className="ui-topbar p-0" ref={headerRef}>
      <CContainer
        fluid
        className="ui-topbar-row border-bottom px-4 d-flex align-items-center justify-content-between"
      >
        <div className="d-flex align-items-center">
          <CHeaderToggler
            className="px-2"
            onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
          >
            <CIcon icon={cilMenu} size="lg" />
          </CHeaderToggler>

        <CHeaderBrand className="ms-2 fw-medium ui-topbar-title">
            {pageTitle}
          </CHeaderBrand>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* ⚙️ Dropdown avec uniquement Déconnexion */}
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false} className="btn btn-link text-body p-0">
              <CIcon icon={cilSettings} size="lg" />
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem onClick={handleLogout} className="text-danger">
                <CIcon icon={cilAccountLogout} className="me-2" /> Déconnexion
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>

          {/* 🌙/☀️ toggle thème */}
          <CButton color="link" className="text-body p-0" onClick={toggleMode}>
            <CIcon icon={colorMode === 'dark' ? cilSun : cilMoon} size="lg" />
          </CButton>
        </div>
      </CContainer>

      <CContainer fluid className="px-4 ui-breadcrumb-row">
        <AppBreadcrumb />
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
