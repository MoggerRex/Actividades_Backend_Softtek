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
  {
    id: 'customers',
    label: 'Clientes',
    icon: (
      <svg viewBox="0 0 640 640" fill="currentColor" aria-hidden="true">
        <path d="M431.1 80C451.8 80 471.2 90 483.2 106.8L532.1 175.3C539.8 186.1 544 199.2 544 212.5L544 480C544 515.3 515.3 544 480 544L160 544L153.5 543.7C121.2 540.4 96 513.1 96 480L96 212.5C96 200.8 99.2 189.4 105.2 179.5L107.9 175.3L156.8 106.8C167.3 92.1 183.5 82.6 201.2 80.5L208.9 80L431 80zM344 192L465.3 192L431 144L343.9 144L343.9 192zM174.7 192L296 192L296 144L208.9 144L174.6 192z" />
      </svg>
    ),
  },
]

export default navigation
