import navigation from './navigation.jsx'

const themes = {
  dashboard: {
    aside: 'bg-[#f8fcf8] shadow-emerald-950/5',
    brand: 'bg-[#16a05d] shadow-emerald-900/30',
    active: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/25 dark:text-emerald-300',
    idle: 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-400 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300',
  },
  store: {
    aside: 'bg-[#f8faff] shadow-blue-950/5',
    brand: 'bg-[#2563eb] shadow-blue-900/30',
    active: 'bg-blue-100 text-blue-900 dark:bg-blue-500/25 dark:text-blue-300',
    idle: 'text-slate-500 hover:bg-blue-50 hover:text-blue-800 dark:text-slate-400 dark:hover:bg-blue-500/15 dark:hover:text-blue-300',
  },
  customers: {
    aside: 'bg-[#fcf8f9] shadow-rose-950/5',
    brand: 'bg-[#be185d] shadow-rose-950/30',
    active: 'bg-[#f3dfe6] text-[#681d3a] dark:bg-rose-500/25 dark:text-rose-300',
    idle: 'text-slate-500 hover:bg-[#f8edf1] hover:text-[#7a2746] dark:text-slate-400 dark:hover:bg-rose-500/15 dark:hover:text-rose-300',
  },
}

function Sidebar({ activePage, onSelectPage, isOpen, onToggle }) {
  const theme = themes[activePage] || themes.store

  return (
    <aside className={`fixed inset-y-4 left-4 z-40 flex flex-col overflow-hidden rounded-[10px] px-3 py-5 shadow-lg transition-[width] md:left-5 md:px-4 dark:bg-[#0f0f0f] dark:shadow-black/40 ${
      isOpen ? 'w-[76px] md:w-60' : 'w-16'
    } ${
      theme.aside
    }`}>
      <div className={`mb-8 flex items-center ${isOpen ? 'justify-center md:justify-start' : 'justify-center'} md:px-2`}>
        <button
          className={`grid size-8 shrink-0 place-items-center rounded-xl transition-colors ${theme.idle}`}
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isOpen}
        >
          <svg className="size-5" viewBox="0 0 640 640" fill="currentColor" aria-hidden="true">
            <path d="M96 160C96 142.3 110.3 128 128 128L512 128C529.7 128 544 142.3 544 160C544 177.7 529.7 192 512 192L128 192C110.3 192 96 177.7 96 160zM96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320zM544 480C544 497.7 529.7 512 512 512L128 512C110.3 512 96 497.7 96 480C96 462.3 110.3 448 128 448L512 448C529.7 448 544 462.3 544 480z" />
          </svg>
        </button>
        <span className={`ml-3 whitespace-nowrap text-lg font-bold text-slate-800 dark:text-slate-100 ${isOpen ? 'inline' : 'hidden'}`}>
          Practicas
        </span>
      </div>

      <nav className="space-y-3" aria-label="Navegación principal">
        {navigation.map((item) => {
          const isActive = activePage === item.id

          return (
            <button
              key={item.id}
              className={`flex items-center justify-center rounded-xl text-sm font-semibold transition-colors ${isOpen ? 'h-9 w-full gap-3 px-3 md:justify-start' : 'size-9'} ${isActive ? theme.active : theme.idle}`}
              type="button"
              onClick={() => onSelectPage(item.id)}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
            >
              <span className="size-5 shrink-0">{item.icon}</span>
              <span className={isOpen ? 'hidden md:inline' : 'hidden'}>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
