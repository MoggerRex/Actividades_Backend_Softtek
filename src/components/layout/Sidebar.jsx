import navigation from './navigation.jsx'

const themes = {
  dashboard: {
    aside: 'border-slate-200 bg-[#f8fcf8] shadow-emerald-950/5',
    brand: 'bg-[#16a05d] shadow-emerald-900/30',
    active: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/25 dark:text-emerald-300',
    idle: 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-400 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300',
  },
  store: {
    aside: 'border-slate-200 bg-[#f8faff] shadow-blue-950/5',
    brand: 'bg-[#2563eb] shadow-blue-900/30',
    active: 'bg-blue-100 text-blue-900 dark:bg-blue-500/25 dark:text-blue-300',
    idle: 'text-slate-500 hover:bg-blue-50 hover:text-blue-800 dark:text-slate-400 dark:hover:bg-blue-500/15 dark:hover:text-blue-300',
  },
  customers: {
    aside: 'border-slate-200 bg-[#fcf8f9] shadow-rose-950/5',
    brand: 'bg-[#be185d] shadow-rose-950/30',
    active: 'bg-[#f3dfe6] text-[#681d3a] dark:bg-rose-500/25 dark:text-rose-300',
    idle: 'text-slate-500 hover:bg-[#f8edf1] hover:text-[#7a2746] dark:text-slate-400 dark:hover:bg-rose-500/15 dark:hover:text-rose-300',
  },
}

function Sidebar({ activePage, onSelectPage }) {
  const theme = themes[activePage] || themes.store

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[76px] flex-col border-r px-3 py-5 shadow-sm transition-colors md:w-60 md:px-4 dark:border-white/10 dark:bg-[#0f0f0f] dark:shadow-black/40 ${
      theme.aside
    }`}>
      <div className="mb-8 flex items-center justify-center md:justify-start md:px-2">
        <div className={`grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-sm ${theme.brand}`}>
          SQL
        </div>
      </div>

      <nav className="space-y-2" aria-label="Navegación principal">
        {navigation.map((item) => {
          const isActive = activePage === item.id

          return (
            <button
              key={item.id}
              className={`flex w-full items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors md:justify-start ${isActive ? theme.active : theme.idle}`}
              type="button"
              onClick={() => onSelectPage(item.id)}
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
  )
}

export default Sidebar
