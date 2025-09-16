import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <span>© 2025 Menara Prefa - Tous droits réservés</span>
      </div>
      <div className="ms-auto">
        <span>Développé par l’équipe IT</span>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
