import navigation from './navigation.jsx'

const MoonIcon = () => (
  <svg viewBox="0 0 640 640" fill="currentColor" aria-hidden="true">
    <path d="M320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576C388.8 576 451.3 548.8 497.3 504.6C504.6 497.6 506.7 486.7 502.6 477.5C498.5 468.3 488.9 462.6 478.8 463.4C473.9 463.8 469 464 464 464C362.4 464 280 381.6 280 280C280 207.9 321.5 145.4 382.1 115.2C391.2 110.7 396.4 100.9 395.2 90.8C394 80.7 386.6 72.5 376.7 70.3C358.4 66.2 339.4 64 320 64z" />
  </svg>
)

const SunIcon = () => (
  <svg viewBox="0 0 640 640" fill="currentColor" aria-hidden="true">
    <path d="M320 32C328.4 32 336.3 36.4 340.6 43.7L396.1 136.3L500.9 110C509.1 108 517.8 110.4 523.7 116.3C529.6 122.2 532 131 530 139.1L503.7 243.8L596.4 299.3C603.6 303.6 608.1 311.5 608.1 319.9C608.1 328.3 603.7 336.2 596.4 340.5L503.7 396.1L530 500.8C532 509 529.6 517.7 523.7 523.6C517.8 529.5 509 532 500.9 530L396.2 503.7L340.7 596.4C336.4 603.6 328.5 608.1 320.1 608.1C311.7 608.1 303.8 603.7 299.5 596.4L243.9 503.7L139.2 530C131 532 122.4 529.6 116.4 523.7C110.4 517.8 108 509 110 500.8L136.2 396.1L43.6 340.6C36.4 336.2 32 328.4 32 320C32 311.6 36.4 303.7 43.7 299.4L136.3 243.9L110 139.1C108 130.9 110.3 122.3 116.3 116.3C122.3 110.3 131 108 139.2 110L243.9 136.2L299.4 43.6L301.2 41C305.7 35.3 312.6 31.9 320 31.9zM320 176C240.5 176 176 240.5 176 320C176 399.5 240.5 464 320 464C399.5 464 464 399.5 464 320C464 240.5 399.5 176 320 176zM320 416C267 416 224 373 224 320C224 267 267 224 320 224C373 224 416 267 416 320C416 373 373 416 320 416z" />
  </svg>
)

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

function Sidebar({ activePage, onSelectPage, isOpen, onToggle, isDarkMode, onToggleTheme }) {
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

      <div className="mt-auto border-t border-slate-200/80 pt-4 dark:border-white/10">
        <button
          className={`flex items-center rounded-xl text-sm font-semibold transition-colors ${theme.idle} ${
            isOpen ? 'h-11 w-full justify-center gap-3 px-2 md:justify-between md:px-3' : 'size-9 justify-center'
          }`}
          type="button"
          onClick={onToggleTheme}
          role="switch"
          aria-checked={isDarkMode}
          aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          <span className="size-5 shrink-0">
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </span>

          <span className={isOpen ? 'hidden flex-1 text-left md:inline' : 'hidden'}>
            {isDarkMode ? 'Modo claro' : 'Modo oscuro'}
          </span>

          <span className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${
            isOpen ? 'hidden md:block' : 'hidden'
          } ${
            isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
          }`} aria-hidden="true">
            <span className={`block size-5 rounded-full bg-white shadow-sm transition-transform ${
              isDarkMode ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
