// src/components/AppSidebar.js
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'

import { AppSidebarNav } from './AppSidebarNav'
import navigation from '../_nav'

// ⬇️ importe ton logo (grand) ; mets le vrai nom de fichier si différent
import menaraLogo from 'src/assets/images/logo-removebg-preview.png'
// (optionnel) logo compact quand la sidebar est réduite ; tu peux réutiliser le même
import menaraLogoSmall from 'src/assets/images/logo-removebg-preview.png'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => dispatch({ type: 'set', sidebarShow: visible })}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/">
          {/* Logo plein (sidebar ouverte) */}
          <img
            src={menaraLogo}
            alt="Menara"
            className="sidebar-brand-full"
            height={36}
            style={{ objectFit: 'contain' }}
          />
          {/* Logo réduit (sidebar repliée) */}
          <img
            src={menaraLogoSmall}
            alt="Menara"
            className="sidebar-brand-narrow"
            height={28}
            style={{ objectFit: 'contain' }}
          />
        </CSidebarBrand>

        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>

      <AppSidebarNav items={navigation} />

      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
