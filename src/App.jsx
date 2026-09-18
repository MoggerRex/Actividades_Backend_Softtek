import { useEffect, useState } from 'react'
import StorePage from './StorePage.jsx'
import DashboardPage from './DashboardPage.jsx'

const navigation = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    id: 'store',
    label: 'Tienda',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18" />
        <path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25" />
        <circle cx="18" cy="20" r="2" />
        <circle cx="8" cy="20" r="2" />
      </svg>
    ),
  },
]

const getPageFromLocation = () => {
  const page = window.location.hash.slice(1)
  return navigation.some((item) => item.id === page) ? page : 'store'
}

function App() {
  const [activePage, setActivePage] = useState(getPageFromLocation)
  const isDashboard = activePage === 'dashboard'

  useEffect(() => {
    const syncPageWithLocation = () => setActivePage(getPageFromLocation())

    if (!navigation.some((item) => `#${item.id}` === window.location.hash)) {
      window.history.replaceState(null, '', '#store')
    }

    window.addEventListener('popstate', syncPageWithLocation)
    window.addEventListener('hashchange', syncPageWithLocation)

    return () => {
      window.removeEventListener('popstate', syncPageWithLocation)
      window.removeEventListener('hashchange', syncPageWithLocation)
    }
  }, [])

  const selectPage = (page) => {
    if (page === activePage) return
    window.history.pushState(null, '', `#${page}`)
    setActivePage(page)
  }

  const selectSection = (nextSection) => {
    setSection(nextSection)
    setMenuOpen(false)
    setError('')
  }

  const categoryValues = { uno: 0, dos: 0, ninguno: 0 }
  serviceSummary.categorias.forEach((item) => {
    categoryValues[item.categoria] = Number(item.personas)
  })
  const totalPeople = Object.values(categoryValues).reduce((total, value) => total + value, 0)
  const serviceCards = serviceSummary.servicios.map((service, index) => ({
    key: `servicio-${service.id_servicio}`,
    label: service.nombre,
    people: Number(service.personas),
    color: index % 2 === 0 ? 'gold' : 'teal',
  }))
  serviceCards.push({
    key: 'ninguno',
    label: 'Ningún servicio',
    people: categoryValues.ninguno,
    color: 'coral',
  })

  const rankingPorPersona = useMemo(() => groupByServicio(ranking.porPersona), [ranking.porPersona])
  const rankingPorSemana = useMemo(() => groupByServicio(ranking.porSemana), [ranking.porSemana])
  const rankingPorArea = useMemo(() => groupByServicio(ranking.porArea), [ranking.porArea])

  return (
    <div className={`min-h-screen text-slate-800 ${isDashboard ? 'bg-[#eef7f0]' : 'bg-[#f4f7fb]'}`}>
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[76px] flex-col border-r px-3 py-5 shadow-sm md:w-60 md:px-4 ${
        isDashboard
          ? 'border-emerald-100 bg-[#f8fcf8] shadow-emerald-950/5'
          : 'border-blue-100 bg-[#f8faff] shadow-blue-950/5'
      }`}>
        <div className="mb-8 flex items-center justify-center md:justify-start md:px-2">
          <div className={`grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-sm ${
            isDashboard
              ? 'bg-[#397a5a] shadow-emerald-900/20'
              : 'bg-[#315f9f] shadow-blue-900/20'
          }`}>
            SQL
          </div>
        </div>

        <nav className="space-y-2" aria-label="Navegación principal">
          {navigation.map((item) => {
            const isActive = activePage === item.id

            return (
              <button
                key={item.id}
                className={`flex w-full items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors md:justify-start ${
                  isDashboard
                    ? isActive
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-800'
                    : isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-slate-500 hover:bg-blue-50 hover:text-blue-800'
                }`}
                type="button"
                onClick={() => selectPage(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={item.label}
              >
                <span className="size-5 shrink-0">{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="min-h-screen pl-[76px] md:pl-60">
        {activePage === 'store' ? <StorePage /> : <DashboardPage />}
      </div>
    </div>
  )
}

export default App