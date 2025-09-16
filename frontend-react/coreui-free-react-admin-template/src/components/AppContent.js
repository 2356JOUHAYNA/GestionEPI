import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import routes from '../routes'

export default function AppContent() {
  const isAuth = !!localStorage.getItem('token')

  return (
    <Suspense fallback={<div className="pt-3 text-center">Chargement…</div>}>
      <Routes>
        {routes.map((r, i) => {
          const Element = r.element
          if (!Element) return null

          if (r.private) {
            return (
              <Route
                key={i}
                path={r.path}
                element={isAuth ? <Element /> : <Navigate to="/login" replace />}
              />
            )
          }
          if (r.guestOnly) {
            return (
              <Route
                key={i}
                path={r.path}
                element={!isAuth ? <Element /> : <Navigate to="/affectation" replace />}
              />
            )
          }
          return <Route key={i} path={r.path} element={<Element />} />
        })}

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to={isAuth ? '/affectation' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={isAuth ? '/affectation' : '/login'} replace />} />
      </Routes>
    </Suspense>
  )
}
