// src/_nav.js
import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilClipboard,
  cilCalculator,
  cilChartPie,
  cilBell,
  cilDescription,
  cilDrop,
  cilNotes,
  cilPuzzle,
  cilCursor,
  cilPencil,
  cilStar,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  // --- Pages privées
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    private: true,
  },

  // {
  //   component: CNavItem,
  //   name: 'Affectations',
  //   to: '/affectation',
  //   icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />,
  //   private: true,
  // },

  // ----- Section Thèmes
  { component: CNavTitle, name: 'Gestion', private: true },

  {
    component: CNavItem,
    name: 'Managers',
    to: '/manager',
    icon: <span style={{
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'white',
    marginRight: '20px'   // <-- espace entre le rond et le texte
  }}></span>,
    private: true,
  },
  {
    component: CNavItem,
    name: 'Stock',
    to: '/theme/colors',
    icon: <span style={{
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'white',
    marginRight: '20px'   // <-- espace entre le rond et le texte
  }}></span>,
    private: true,
  },
  {
    component: CNavItem,
    name: 'Tailles',
    to: '/theme/typography',
    icon: <span style={{
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'white',
    marginRight: '20px'   // <-- espace entre le rond et le texte
  }}></span>,
    private: true,
  },
  {
    component: CNavItem,
    name: 'Matériel',
    to: '/theme/materiel',
    icon: <span style={{
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'white',
    marginRight: '20px'   // <-- espace entre le rond et le texte
  }}></span>,
    private: true,
  },
  {
    component: CNavItem,
    name: 'Employés',
    to: '/theme/employer',
    icon: <span style={{
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'white',
    marginRight: '20px'   // <-- espace entre le rond et le texte
  }}></span>,
    private: true,
  },

  // ----- Section Composants
  { component: CNavTitle, name: 'Composants', private: true },
  {
    component: CNavGroup,
    name: 'Base',
    to: '/base',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
    private: true,
    items: [
      { component: CNavItem, name: 'Cards',  to: '/base/cards',  private: true },
      { component: CNavItem, name: 'Tables', to: '/base/tables', private: true },
    ],
  },

  // --- Pages publiques / invité
  { component: CNavTitle, name: 'Pages' },
  {
    component: CNavItem,
    name: 'Login',
    to: '/login',
    icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
    guestOnly: true,
  },
  {
    component: CNavItem,
    name: 'Inscription',
    to: '/register',
    icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
    guestOnly: true,
  },

  // {
  //   component: CNavItem,
  //   name: 'Documentation',
  //   href: 'https://coreui.io/react/docs/',
  //   icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
  // },
]

export default _nav
