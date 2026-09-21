import navigation from './navigation.jsx'

const themes = {
  dashboard: {
    aside: 'border-emerald-100 bg-[#f8fcf8] shadow-emerald-950/5',
    brand: 'bg-[#397a5a] shadow-emerald-900/20',
    active: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200',
    idle: 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-200',
  },
  store: {
    aside: 'border-blue-100 bg-[#f8faff] shadow-blue-950/5',
    brand: 'bg-[#315f9f] shadow-blue-900/20',
    active: 'bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200',
    idle: 'text-slate-500 hover:bg-blue-50 hover:text-blue-800 dark:text-slate-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-200',
  },
  customers: {
    aside: 'border-rose-100 bg-[#fcf8f9] shadow-rose-950/5',
    brand: 'bg-[#7a2746] shadow-rose-950/20',
    active: 'bg-[#f3dfe6] text-[#681d3a] dark:bg-rose-500/20 dark:text-rose-200',
    idle: 'text-slate-500 hover:bg-[#f8edf1] hover:text-[#7a2746] dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-200',
  },
}

function Sidebar({ activePage, onSelectPage }) {
  const theme = themes[activePage] || themes.store

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[76px] flex-col border-r px-3 py-5 shadow-sm transition-colors md:w-60 md:px-4 dark:border-white/10 dark:bg-[#202020] dark:shadow-black/20 ${
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
