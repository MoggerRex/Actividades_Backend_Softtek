import { useEffect, useState } from 'react'
import Sidebar from './components/layout/Sidebar.jsx'
import navigation from './components/layout/navigation.jsx'
import DashboardPage from './components/pages/DashboardPage.jsx'
import StorePage from './components/pages/StorePage.jsx'
import CustomersPage from './components/pages/CustomersPage.jsx'

const getPageFromLocation = () => {
  const page = window.location.hash.slice(1)
  return navigation.some((item) => item.id === page) ? page : 'store'
}

function App() {
  const [activePage, setActivePage] = useState(getPageFromLocation)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const isDashboard = activePage === 'dashboard'
  const isCustomers = activePage === 'customers'

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

  return (
    <div className={`min-h-screen text-slate-800 transition-colors dark:bg-[#1a1a1a] dark:text-slate-100 ${
      isDashboard ? 'bg-[#eef7f0]' : isCustomers ? 'bg-[#f8f3f5]' : 'bg-[#f4f7fb]'
    }`}>
      <Sidebar
        activePage={activePage}
        onSelectPage={selectPage}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />

      <div className={`min-h-screen transition-[padding] ${isSidebarOpen ? 'pl-[92px] md:pl-[260px]' : 'pl-[72px] md:pl-[84px]'}`}>
        {activePage === 'dashboard' && <DashboardPage />}
        {activePage === 'store' && <StorePage />}
        {activePage === 'customers' && <CustomersPage />}
      </div>
    </div>
  )
}

export default App
