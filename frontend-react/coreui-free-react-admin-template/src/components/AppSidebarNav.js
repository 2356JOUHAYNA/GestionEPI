import React, { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import PropTypes from 'prop-types'

import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'

import { CBadge, CNavLink, CSidebarNav } from '@coreui/react'

export const AppSidebarNav = ({ items }) => {
  const isAuth = !!localStorage.getItem('token')

  // --- Filtrage des items selon l'état d'auth ---
  const filteredItems = useMemo(() => {
    if (!items) return []

    // Noms à masquer quand on est connectée
    const hideWhenAuth = new Set(['Login', 'Register', 'Inscription'])

    const prune = (arr) =>
      arr.reduce((acc, it) => {
        // 1) cacher Login/Register/Inscription si connectée
        if (isAuth && hideWhenAuth.has(it.name)) return acc

        // 2) cacher les items privés si pas connectée (si tu mets private: true dans _nav.js)
        if (!isAuth && it.private) return acc

        // 3) traiter récursivement les sous-éléments
        const copy = { ...it }
        if (it.items) {
          copy.items = prune(it.items)
          // si le groupe devient vide → on le retire
          if (!copy.items.length) return acc
        }
        acc.push(copy)
        return acc
      }, [])

    return prune(items)
  }, [items, isAuth])

  const navLink = (name, icon, badge, indent = false) => (
    <>
      {icon
        ? icon
        : indent && (
            <span className="nav-icon">
              <span className="nav-icon-bullet"></span>
            </span>
          )}
      {name}
      {badge && (
        <CBadge color={badge.color} className="ms-auto" size="sm">
          {badge.text}
        </CBadge>
      )}
    </>
  )

  const navItem = (item, index, indent = false) => {
    const { component, name, badge, icon, ...rest } = item
    const Component = component
    return (
      <Component as="div" key={index}>
        {rest.to || rest.href ? (
          <CNavLink
            {...(rest.to && { as: NavLink })}
            {...(rest.href && { target: '_blank', rel: 'noopener noreferrer' })}
            {...rest}
          >
            {navLink(name, icon, badge, indent)}
          </CNavLink>
        ) : (
          navLink(name, icon, badge, indent)
        )}
      </Component>
    )
  }

  const navGroup = (item, index) => {
    const { component, name, icon, items, ...rest } = item
    const Component = component
    return (
      <Component compact as="div" key={index} toggler={navLink(name, icon)} {...rest}>
        {items?.map((child, idx) =>
          child.items ? navGroup(child, idx) : navItem(child, idx, true),
        )}
      </Component>
    )
  }

  return (
    <CSidebarNav as={SimpleBar}>
      {filteredItems.map((item, index) =>
        item.items ? navGroup(item, index) : navItem(item, index),
      )}
    </CSidebarNav>
  )
}

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
}
