import React from 'react'

// Pages privées
const Dashboard       = React.lazy(() => import('./views/dashboard/Dashboard.js'))
const AffectationForm = React.lazy(() => import('./views/AffectationForm/AffectationForm.js'))
const Colors          = React.lazy(() => import('./views/theme/colors/Colors.js'))
const Typography      = React.lazy(() => import('./views/theme/typography/Typography.js'))
const Materiel        = React.lazy(() => import('./views/theme/Materiel/Materiel.js'))

// ⚠️ IMPORTS DIRECTS VERS LES FICHIERS RÉELS (sans index.js)
// 👉 Variante A (probable chez toi : fichiers en minuscule)
const Manager         = React.lazy(() => import('./views/theme/Manager/manager.js'))
const Employer        = React.lazy(() => import('./views/theme/Employer/employer.js'))

// 👉 Variante B (si tes fichiers sont en Majuscule, décommente ceci et commente la Variante A)
// const Manager      = React.lazy(() => import('./views/theme/Manager/Manager.js'))
// const Employer     = React.lazy(() => import('./views/theme/Employer/Employer.js'))

// Pages invité
const Login           = React.lazy(() => import('./views/pages/login/Login.js'))
const Register        = React.lazy(() => import('./views/pages/register/Register.js'))

// Base
const Accordion       = React.lazy(() => import('./views/base/accordion/Accordion.js'))
const Breadcrumbs     = React.lazy(() => import('./views/base/breadcrumbs/Breadcrumbs.js'))
const Cards           = React.lazy(() => import('./views/base/cards/Cards.js'))
const Carousels       = React.lazy(() => import('./views/base/carousels/Carousels.js'))
const Collapses       = React.lazy(() => import('./views/base/collapses/Collapses.js'))
const ListGroups      = React.lazy(() => import('./views/base/list-groups/ListGroups.js'))
const Navs            = React.lazy(() => import('./views/base/navs/Navs.js'))
const Paginations     = React.lazy(() => import('./views/base/paginations/Paginations.js'))
const Placeholders    = React.lazy(() => import('./views/base/placeholders/Placeholders.js'))
const Popovers        = React.lazy(() => import('./views/base/popovers/Popovers.js'))
const Progress        = React.lazy(() => import('./views/base/progress/Progress.js'))
const Spinners        = React.lazy(() => import('./views/base/spinners/Spinners.js'))
const Tabs            = React.lazy(() => import('./views/base/tabs/Tabs.js'))
const Tables          = React.lazy(() => import('./views/base/tables/Tables.js'))
const Tooltips        = React.lazy(() => import('./views/base/tooltips/Tooltips.js'))

// Buttons
const Buttons         = React.lazy(() => import('./views/buttons/buttons/Buttons.js'))
const ButtonGroups    = React.lazy(() => import('./views/buttons/button-groups/ButtonGroups.js'))
const Dropdowns       = React.lazy(() => import('./views/buttons/dropdowns/Dropdowns.js'))

// Forms
const ChecksRadios    = React.lazy(() => import('./views/forms/checks-radios/ChecksRadios.js'))
const FloatingLabels  = React.lazy(() => import('./views/forms/floating-labels/FloatingLabels.js'))
const FormControl     = React.lazy(() => import('./views/forms/form-control/FormControl.js'))
const InputGroup      = React.lazy(() => import('./views/forms/input-group/InputGroup.js'))
const Layout          = React.lazy(() => import('./views/forms/layout/Layout.js'))
const Range           = React.lazy(() => import('./views/forms/range/Range.js'))
const Select          = React.lazy(() => import('./views/forms/select/Select.js'))
const Validation      = React.lazy(() => import('./views/forms/validation/Validation.js'))

const Charts          = React.lazy(() => import('./views/charts/Charts.js'))

// Icons
const CoreUIIcons     = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons.js'))
const Flags           = React.lazy(() => import('./views/icons/flags/Flags.js'))
const Brands          = React.lazy(() => import('./views/icons/brands/Brands.js'))

// Notifications
const Alerts          = React.lazy(() => import('./views/notifications/alerts/Alerts.js'))
const Badges          = React.lazy(() => import('./views/notifications/badges/Badges.js'))
const Modals          = React.lazy(() => import('./views/notifications/modals/Modals.js'))
const Toasts          = React.lazy(() => import('./views/notifications/toasts/Toasts.js'))

const Widgets         = React.lazy(() => import('./views/widgets/Widgets.js'))

const routes = [
  // Invités
  { path: '/login',       name: 'Login',        element: Login,       guestOnly: true },
  { path: '/register',    name: 'Inscription',  element: Register,    guestOnly: true },

  // Privées
  { path: '/dashboard',   name: 'Dashboard',    element: Dashboard,       private: true },
  { path: '/affectation', name: 'Affectation',  element: AffectationForm, private: true },

  { path: '/theme',              name: 'Theme',        element: Colors,      private: true },
  { path: '/theme/colors',       name: 'Colors',       element: Colors,      private: true },
  { path: '/theme/typography',   name: 'Typography',   element: Typography,  private: true },

  { path: '/theme/materiel',     name: 'Matériel',     element: Materiel,    private: true },
  { path: '/manager',            name: 'Managers',     element: Manager,     private: true },
  { path: '/theme/employer',     name: 'Employés',     element: Employer,    private: true },

  { path: '/base',               name: 'Base',             element: Cards,        private: true },
  { path: '/base/accordion',     name: 'Accordion',        element: Accordion,    private: true },
  { path: '/base/breadcrumbs',   name: 'Breadcrumbs',      element: Breadcrumbs,  private: true },
  { path: '/base/cards',         name: 'Cards',            element: Cards,        private: true },
  { path: '/base/carousels',     name: 'Carousel',         element: Carousels,    private: true },
  { path: '/base/collapses',     name: 'Collapse',         element: Collapses,    private: true },
  { path: '/base/list-groups',   name: 'List Groups',      element: ListGroups,   private: true },
  { path: '/base/navs',          name: 'Navs',             element: Navs,         private: true },
  { path: '/base/paginations',   name: 'Paginations',      element: Paginations,  private: true },
  { path: '/base/placeholders',  name: 'Placeholders',     element: Placeholders, private: true },
  { path: '/base/popovers',      name: 'Popovers',         element: Popovers,     private: true },
  { path: '/base/progress',      name: 'Progress',         element: Progress,     private: true },
  { path: '/base/spinners',      name: 'Spinners',         element: Spinners,     private: true },
  { path: '/base/tabs',          name: 'Tabs',             element: Tabs,         private: true },
  { path: '/base/tables',        name: 'Tables',           element: Tables,       private: true },
  { path: '/base/tooltips',      name: 'Tooltips',         element: Tooltips,     private: true },

  { path: '/buttons',               name: 'Buttons',        element: Buttons,      private: true },
  { path: '/buttons/buttons',       name: 'Buttons',        element: Buttons,      private: true },
  { path: '/buttons/dropdowns',     name: 'Dropdowns',      element: Dropdowns,    private: true },
  { path: '/buttons/button-groups', name: 'Button Groups',  element: ButtonGroups, private: true },

  { path: '/charts', name: 'Charts', element: Charts, private: true },

  { path: '/forms',                 name: 'Forms',            element: FormControl,    private: true },
  { path: '/forms/form-control',    name: 'Form Control',     element: FormControl,    private: true },
  { path: '/forms/select',          name: 'Select',           element: Select,         private: true },
  { path: '/forms/checks-radios',   name: 'Checks & Radios',  element: ChecksRadios,   private: true },
  { path: '/forms/range',           name: 'Range',            element: Range,          private: true },
  { path: '/forms/input-group',     name: 'Input Group',      element: InputGroup,     private: true },
  { path: '/forms/floating-labels', name: 'Floating Labels',  element: FloatingLabels, private: true },
  { path: '/forms/layout',          name: 'Layout',           element: Layout,         private: true },
  { path: '/forms/validation',      name: 'Validation',       element: Validation,     private: true },

  { path: '/icons',               name: 'Icons',         element: CoreUIIcons, private: true },
  { path: '/icons/coreui-icons',  name: 'CoreUI Icons',  element: CoreUIIcons, private: true },
  { path: '/icons/flags',         name: 'Flags',         element: Flags,       private: true },
  { path: '/icons/brands',        name: 'Brands',        element: Brands,      private: true },

  { path: '/notifications',        name: 'Notifications', element: Alerts, private: true },
  { path: '/notifications/alerts', name: 'Alerts',        element: Alerts, private: true },
  { path: '/notifications/badges', name: 'Badges',        element: Badges, private: true },
  { path: '/notifications/modals', name: 'Modals',        element: Modals, private: true },
  { path: '/notifications/toasts', name: 'Toasts',        element: Toasts, private: true },

  { path: '/widgets', name: 'Widgets', element: Widgets, private: true },
]

export default routes
