// src/components/header/AppHeaderDropdown.js
import React from 'react'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilSettings } from '@coreui/icons'
import API from '../../api.js'
import avatar8 from './../../assets/images/avatars/8.jpg'

const AppHeaderDropdown = () => {
  
export default function AppHeaderDropdown() {
  // Utilisateur stocké après login
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })()

  const onLogout = async () => {
    try {
      await API.post('/auth/logout')
    } catch {
      // même si l'appel échoue, on nettoie côté front
    }

    // Nettoyage local
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (API?.defaults?.headers?.common?.Authorization) {
      delete API.defaults.headers.common.Authorization
    }

    // HashRouter : remplacer l'URL pour éviter "Retour" vers une page privée
    window.location.replace(`${window.location.origin}/#/login`)
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar src={avatar8} size="md" />
      </CDropdownToggle>

      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">
          {user?.name ? `Bonjour, ${user.name}` : 'Compte'}
        </CDropdownHeader>

        <CDropdownItem as="button" type="button">
          <CIcon icon={cilUser} className="me-2" />
          Profil
        </CDropdownItem>

        <CDropdownItem as="button" type="button">
          <CIcon icon={cilSettings} className="me-2" />
          Paramètres
        </CDropdownItem>

        <CDropdownDivider />

        <CDropdownItem as="button" type="button" onClick={onLogout}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Se déconnecter
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}
