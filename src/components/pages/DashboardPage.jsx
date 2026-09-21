import { useCallback, useEffect, useMemo, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const emptySummary = {
  categorias: [],
  servicios: [],
  personas: [],
}

const emptyPerson = {
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  area: '',
  servicios: [],
}

const emptyRanking = {
  porPersona: [],
  porSemana: [],
  porArea: [],
}

const AREA_OPTIONS = ['RH', 'IT', 'Marketing', 'Ventas', 'Finanzas', 'Operaciones']

const groupByServicio = (rows) => {
  const grouped = new Map()
  rows.forEach((row) => {
    if (!grouped.has(row.servicio)) grouped.set(row.servicio, [])
    grouped.get(row.servicio).push(row)
  })
  return Array.from(grouped.entries())
}

const categoryMetadata = [
  { key: 'uno', label: 'Un servicio', color: '#22c55e' },
  { key: 'dos', label: 'Dos servicios', color: '#8b5cf6' },
  { key: 'ninguno', label: 'Sin servicio', color: '#f59e0b' },
]

function RankingLabel({ index, children }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-slate-600 dark:text-slate-300">
      {index === 0 ? (
        <svg className="size-4 shrink-0 text-amber-500" viewBox="0 0 640 640" fill="currentColor" aria-label="Primer lugar">
          <path d="M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z" />
        </svg>
      ) : (
        <span className="w-4 shrink-0 text-center text-xs font-bold text-slate-400">{index + 1}.</span>
      )}
      <span className="truncate">{children}</span>
    </span>
  )
}

async function request(url, options) {
  const response = await fetch(url, options)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo completar la operación')
  }

  return data
}

function DashboardPage() {
  const [summary, setSummary] = useState(emptySummary)
  const [ranking, setRanking] = useState(emptyRanking)
  const [year, setYear] = useState('2026')
  const [week, setWeek] = useState('38')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyPerson)

  const loadServices = useCallback(async () => {
    setLoading(true)

    try {
      const data = await request(`${API_URL}/servicios-resumen?anio=${year}&semana=${week}`)
      setSummary(data)
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [week, year])

  const loadRanking = useCallback(async () => {
    try {
      const data = await request(`${API_URL}/servicios-ranking`)
      setRanking(data)
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- El dashboard se sincroniza con el periodo seleccionado.
    loadServices()
  }, [loadServices])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- El ranking se carga al abrir el dashboard.
    loadRanking()
  }, [loadRanking])

  const categoryValues = useMemo(() => {
    const values = { uno: 0, dos: 0, ninguno: 0 }
    summary.categorias.forEach((item) => {
      values[item.categoria] = Number(item.personas)
    })
    return values
  }, [summary.categorias])

  const totalPeople = Object.values(categoryValues).reduce((total, value) => total + value, 0)
  const activePeople = categoryValues.uno + categoryValues.dos
  const maxVisits = Math.max(1, ...summary.servicios.map((service) => Number(service.visitas)))

  const rankingPorPersona = useMemo(() => groupByServicio(ranking.porPersona), [ranking.porPersona])
  const rankingPorSemana = useMemo(() => groupByServicio(ranking.porSemana), [ranking.porSemana])
  const rankingPorArea = useMemo(() => groupByServicio(ranking.porArea), [ranking.porArea])

  const donutBackground = useMemo(() => {
    if (!totalPeople) return 'var(--empty-chart)'

    let accumulated = 0
    const segments = categoryMetadata.map((category) => {
      const start = accumulated
      accumulated += (categoryValues[category.key] / totalPeople) * 100
      return `${category.color} ${start}% ${accumulated}%`
    })

    return `conic-gradient(${segments.join(', ')})`
  }, [categoryValues, totalPeople])

  const availableServices = summary.servicios.length
    ? summary.servicios.filter((service) => Number(service.id_servicio) <= 2)
    : [
        { id_servicio: 1, nombre: 'Masajes' },
        { id_servicio: 2, nombre: 'Rehabilitación' },
      ]

  const openModal = () => {
    setForm(emptyPerson)
    setError('')
    setMessage('')
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return
    setShowModal(false)
    setError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const toggleService = (serviceId) => {
    setForm((currentForm) => ({
      ...currentForm,
      servicios: currentForm.servicios.includes(serviceId)
        ? currentForm.servicios.filter((id) => id !== serviceId)
        : [...currentForm.servicios, serviceId],
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await request(`${API_URL}/usuarios-servicios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          anio: Number(year),
          semana: Number(week),
        }),
      })
      setShowModal(false)
      setMessage('Persona registrada correctamente.')
      await Promise.all([loadServices(), loadRanking()])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto min-h-full max-w-[1450px] px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700/70 dark:text-emerald-300/70">Análisis de uso</p>
          <h1 className="text-3xl font-semibold tracking-tight text-emerald-950 dark:text-emerald-100">Dashboard de servicios</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Consulta cuántas personas utilizaron uno, dos o ningún servicio durante la semana seleccionada.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-[10px] bg-white/80 dark:bg-[#101010]/90 p-3 shadow-sm shadow-emerald-900/5 dark:shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
          <label className="text-[11px] font-bold uppercase tracking-wide text-emerald-800/70 dark:text-emerald-300/70">
            Año
            <input
              className="mt-1 block h-10 w-24 rounded-lg border border-emerald-100 dark:border-emerald-400/25 bg-emerald-50/40 dark:bg-emerald-500/15 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900"
              type="number"
              min="2000"
              value={year}
              onChange={(event) => setYear(event.target.value)}
            />
          </label>
          <label className="text-[11px] font-bold uppercase tracking-wide text-emerald-800/70 dark:text-emerald-300/70">
            Semana
            <input
              className="mt-1 block h-10 w-24 rounded-lg border border-emerald-100 dark:border-emerald-400/25 bg-emerald-50/40 dark:bg-emerald-500/15 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900"
              type="number"
              min="1"
              max="53"
              value={week}
              onChange={(event) => setWeek(event.target.value)}
            />
          </label>
          <button
            className="h-10 rounded-lg border border-emerald-200 dark:border-emerald-400/25 bg-white dark:bg-[#101010] px-4 text-sm font-semibold text-emerald-800 dark:text-emerald-300 transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10 disabled:opacity-60"
            type="button"
            onClick={loadServices}
            disabled={loading}
          >
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
          <button
            className="h-10 rounded-lg bg-[#16a05d] px-4 text-sm font-semibold text-white transition hover:bg-[#11824b]"
            type="button"
            onClick={openModal}
          >
            Agregar registro
          </button>
        </div>
      </header>

      {error && !showModal && (
        <p className="mb-5 rounded-xl border border-red-200 dark:border-red-400/25 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</p>
      )}
      {message && (
        <p className="mb-5 rounded-xl border border-emerald-200 dark:border-emerald-400/25 bg-emerald-50 dark:bg-emerald-500/15 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{message}</p>
      )}

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <article className="rounded-[10px] bg-[#f9fdf9] dark:bg-[#101010] p-5 shadow-sm shadow-emerald-900/5 dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Personas registradas</p>
          <p className="mt-2 text-3xl font-bold text-emerald-950 dark:text-emerald-100">{totalPeople}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">En el periodo consultado</p>
        </article>
        <article className="rounded-[10px] bg-[#f9fdf9] dark:bg-[#101010] p-5 shadow-sm shadow-emerald-900/5 dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Con actividad</p>
          <p className="mt-2 text-3xl font-bold text-emerald-950 dark:text-emerald-100">{activePeople}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Usaron al menos un servicio</p>
        </article>
        <article className="rounded-[10px] bg-[#f9fdf9] dark:bg-[#101010] p-5 shadow-sm shadow-emerald-900/5 dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Uso combinado</p>
          <p className="mt-2 text-3xl font-bold text-emerald-950 dark:text-emerald-100">{categoryValues.dos}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Personas usaron ambos servicios</p>
        </article>
      </section>

      <section className="mb-6 grid items-stretch gap-6 lg:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
        <article className="rounded-[10px] bg-white dark:bg-[#101010] p-5 shadow-sm shadow-emerald-900/5 dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)] sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700/60 dark:text-emerald-300/60">Distribución semanal</p>
            <h2 className="mt-1 text-lg font-semibold text-emerald-950 dark:text-emerald-100">Servicios por persona</h2>
          </div>

          <div className="flex flex-col items-center gap-7 sm:flex-row sm:justify-center">
            <div
              className="relative grid size-48 shrink-0 place-items-center rounded-full"
              style={{ background: donutBackground }}
              role="img"
              aria-label={`Distribución: ${categoryValues.uno} con un servicio, ${categoryValues.dos} con dos servicios y ${categoryValues.ninguno} sin servicio`}
            >
              <div className="grid size-28 place-items-center rounded-full bg-white dark:bg-[#101010] text-center shadow-inner">
                <div>
                  <strong className="block text-3xl text-emerald-950 dark:text-emerald-100">{totalPeople}</strong>
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">personas</span>
                </div>
              </div>
            </div>

            <div className="w-full space-y-3">
              {categoryMetadata.map((category) => {
                const value = categoryValues[category.key]
                const percentage = totalPeople ? Math.round((value / totalPeople) * 100) : 0
                return (
                  <div className="flex items-center justify-between gap-4" key={category.key}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="truncate text-sm text-slate-600 dark:text-slate-300">{category.label}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-950 dark:text-emerald-100">{value} · {percentage}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </article>

        <article className="rounded-[10px] bg-white dark:bg-[#101010] p-5 shadow-sm shadow-emerald-900/5 dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)] sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700/60 dark:text-emerald-300/60">Comparativa</p>
              <h2 className="mt-1 text-lg font-semibold text-emerald-950 dark:text-emerald-100">Visitas por servicio</h2>
            </div>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Semana {week}
            </span>
          </div>

          <div className="space-y-6">
            {summary.servicios.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-400 dark:text-slate-500">No hay servicios registrados.</p>
            ) : summary.servicios.map((service, index) => {
              const visits = Number(service.visitas)
              const width = `${Math.max(4, (visits / maxVisits) * 100)}%`
              const barColor = index % 2 === 0 ? '#22c55e' : '#8b5cf6'

              return (
                <div key={service.id_servicio}>
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{service.nombre}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{service.personas} personas</p>
                    </div>
                    <strong className="text-lg text-emerald-950 dark:text-emerald-100">{visits} <span className="text-xs font-medium text-slate-400 dark:text-slate-500">visitas</span></strong>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-[#edf5ef] dark:bg-white/10">
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width, backgroundColor: barColor }} />
                  </div>
                </div>
              )
            })}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-[10px] bg-white dark:bg-[#101010] shadow-sm shadow-emerald-900/5 dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-white/5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700/60 dark:text-emerald-300/60">Registros de la semana</p>
            <h2 className="mt-1 text-lg font-semibold text-emerald-950 dark:text-emerald-100">Personas y servicios</h2>
          </div>
          <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {summary.personas.length} personas
          </span>
        </div>

        <div className="max-h-[520px] overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#f5faf6] dark:bg-[#0b0b0b]">
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:border-white/5 dark:text-slate-500">
                <th className="px-5 py-3">Persona</th>
                <th className="px-5 py-3">Correo</th>
                <th className="px-5 py-3">Teléfono</th>
                <th className="px-5 py-3">Servicios utilizados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan="4" className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">Cargando registros…</td></tr>
              ) : summary.personas.length === 0 ? (
                <tr><td colSpan="4" className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">No hay personas registradas.</td></tr>
              ) : summary.personas.map((person) => (
                <tr className="transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10" key={person.id_usuario}>
                  <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200">{person.persona}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{person.correo || '—'}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{person.telefono || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-[#edf7f0] dark:bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {person.servicios}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-[10px] bg-white dark:bg-[#101010] shadow-sm shadow-emerald-900/5 dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700/60 dark:text-emerald-300/60">Rankings</p>
          <h2 className="mt-1 text-lg font-semibold text-emerald-950 dark:text-emerald-100">¿Quién y cuándo se usa más cada servicio?</h2>
        </div>

        <div className="p-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-[10px] bg-[#f9fdf9] dark:bg-[#0c0c0c] p-4 shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700/60 dark:text-emerald-300/60">Top visitantes</p>
              <h3 className="mt-1 mb-4 text-base font-semibold text-emerald-950 dark:text-emerald-100">Personas que más visitan</h3>
              {rankingPorPersona.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">Aún no hay visitas registradas.</p>
              ) : rankingPorPersona.map(([servicio, rows]) => (
                <div className="mb-4 last:mb-0" key={`persona-${servicio}`}>
                  <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">{servicio}</p>
                  <div className="space-y-1.5">
                    {rows.map((row, index) => (
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-[#101010] px-3 py-2 text-sm" key={`${servicio}-${row.id_usuario}`}>
                        <RankingLabel index={index}>{row.persona}{row.area ? ` (${row.area})` : ''}</RankingLabel>
                        <b className="shrink-0 text-emerald-950 dark:text-emerald-100">{row.visitas} visitas</b>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </article>
            <article className="rounded-[10px] bg-[#f9fdf9] dark:bg-[#0c0c0c] p-4 shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700/60 dark:text-emerald-300/60">Top semanas</p>
              <h3 className="mt-1 mb-4 text-base font-semibold text-emerald-950 dark:text-emerald-100">Semanas con más visitas</h3>
              {rankingPorSemana.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">Aún no hay visitas registradas.</p>
              ) : rankingPorSemana.map(([servicio, rows]) => (
                <div className="mb-4 last:mb-0" key={`semana-${servicio}`}>
                  <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">{servicio}</p>
                  <div className="space-y-1.5">
                    {rows.map((row, index) => (
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-[#101010] px-3 py-2 text-sm" key={`${servicio}-${row.anio}-${row.semana}`}>
                        <RankingLabel index={index}>Semana {row.semana}, {row.anio}</RankingLabel>
                        <b className="shrink-0 text-emerald-950 dark:text-emerald-100">{row.visitas} visitas</b>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </article>
            <article className="rounded-[10px] bg-[#f9fdf9] dark:bg-[#0c0c0c] p-4 shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700/60 dark:text-emerald-300/60">Top áreas</p>
              <h3 className="mt-1 mb-4 text-base font-semibold text-emerald-950 dark:text-emerald-100">Área que más visita cada servicio</h3>
              {rankingPorArea.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">Aún no hay áreas registradas.</p>
              ) : rankingPorArea.map(([servicio, rows]) => (
                <div className="mb-4 last:mb-0" key={`area-${servicio}`}>
                  <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">{servicio}</p>
                  <div className="space-y-1.5">
                    {rows.map((row, index) => (
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-[#101010] px-3 py-2 text-sm" key={`${servicio}-${row.area}`}>
                        <RankingLabel index={index}>{row.area}</RankingLabel>
                        <b className="shrink-0 text-emerald-950 dark:text-emerald-100">{row.visitas} visitas</b>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </article>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={closeModal}>
          <div
            className="w-full max-w-lg rounded-[10px] bg-white dark:bg-[#101010] p-6 shadow-2xl shadow-black/30"
            role="dialog"
            aria-modal="true"
            aria-labelledby="person-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700/60 dark:text-emerald-300/60">Semana {week} · {year}</p>
                <h2 id="person-modal-title" className="mt-1 text-xl font-semibold text-emerald-950 dark:text-emerald-100">Agregar registro de persona</h2>
              </div>
              <button className="grid size-8 place-items-center rounded-full text-slate-400 dark:text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300" type="button" onClick={closeModal} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </div>

            {error && <p className="mb-4 rounded-xl border border-red-200 dark:border-red-400/25 bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-300">{error}</p>}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nombre
                  <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-white/15 dark:bg-[#101010] dark:focus:ring-emerald-900" name="nombre" value={form.nombre} onChange={handleChange} maxLength="100" required />
                </label>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Apellido
                  <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-white/15 dark:bg-[#101010] dark:focus:ring-emerald-900" name="apellido" value={form.apellido} onChange={handleChange} maxLength="100" />
                </label>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Correo
                  <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-white/15 dark:bg-[#101010] dark:focus:ring-emerald-900" name="correo" type="email" value={form.correo} onChange={handleChange} maxLength="150" />
                </label>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Teléfono
                  <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-white/15 dark:bg-[#101010] dark:focus:ring-emerald-900" name="telefono" value={form.telefono} onChange={handleChange} maxLength="20" />
                </label>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
                  Área
                  <select className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#101010] px-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900" name="area" value={form.area} onChange={handleChange} required>
                    <option value="" disabled>Selecciona un área</option>
                    {AREA_OPTIONS.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset className="rounded-xl bg-emerald-50/40 p-4 shadow-inner dark:bg-emerald-500/15">
                <legend className="px-1 text-sm font-semibold text-emerald-900 dark:text-emerald-200">Servicios utilizados</legend>
                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                  {availableServices.map((service) => {
                    const serviceId = Number(service.id_servicio)
                    return (
                      <label className="flex items-center gap-2.5 rounded-lg bg-white dark:bg-[#101010] px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200" key={serviceId}>
                        <input className="size-4 accent-emerald-600" type="checkbox" checked={form.servicios.includes(serviceId)} onChange={() => toggleService(serviceId)} />
                        {service.nombre}
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-5 dark:border-white/5">
                <button className="h-10 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#101010] px-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-60" type="button" onClick={closeModal} disabled={saving}>Cancelar</button>
                <button className="h-10 rounded-lg bg-[#16a05d] px-4 text-sm font-semibold text-white hover:bg-[#11824b] disabled:opacity-60" type="submit" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default DashboardPage
