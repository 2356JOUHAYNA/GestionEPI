// src/_nav.js
import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilCalculator,
  cilChartPie,
  cilChartLine,
  cilBell,
  cilDescription,
  cilDrop,
  cilPuzzle,
  cilPencil,
  cilStar,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },

  
  

  { component: CNavTitle, name: 'Composants' },
  {
    component: CNavGroup,
    name: 'Gestion',
    to: '/base',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
    items: [
      { component: CNavItem, name: 'Affectation de Matériel EPI', to: '/base/cards' },
      { component: CNavItem, name: 'Distribution EPI', to: '/base/tables' },
    ],
  },
 
  {
    component: CNavItem,
    name: 'Notifications',
    to: '/notifications/alerts',
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
  },
 

  { component: CNavTitle, name: 'Pages' },
  {
    component: CNavItem,
    name: 'Login',
    to: '/login',
    icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Inscription',
    to: '/register',
    icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
  },
  

  { component: CNavTitle, name: 'EPI' },
  {
    component: CNavItem,
    name: 'Prévision EPI',
    to: '/epi/forecast',
    icon: <CIcon icon={cilChartLine} customClassName="nav-icon" />,
  },
]

export default _nav
