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
  servicios: [],
}

const categoryMetadata = [
  { key: 'uno', label: 'Un servicio', color: '#8bc9a6' },
  { key: 'dos', label: 'Dos servicios', color: '#b7a6df' },
  { key: 'ninguno', label: 'Sin servicio', color: '#efc98f' },
]

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

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- El dashboard se sincroniza con el periodo seleccionado.
    loadServices()
  }, [loadServices])

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

  const donutBackground = useMemo(() => {
    if (!totalPeople) return '#dfeee4'

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
      await loadServices()
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
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700/70">Análisis de uso</p>
          <h1 className="text-3xl font-semibold tracking-tight text-emerald-950">Dashboard de servicios</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Consulta cuántas personas utilizaron uno, dos o ningún servicio durante la semana seleccionada.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm shadow-emerald-900/5">
          <label className="text-[11px] font-bold uppercase tracking-wide text-emerald-800/70">
            Año
            <input
              className="mt-1 block h-10 w-24 rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              type="number"
              min="2000"
              value={year}
              onChange={(event) => setYear(event.target.value)}
            />
          </label>
          <label className="text-[11px] font-bold uppercase tracking-wide text-emerald-800/70">
            Semana
            <input
              className="mt-1 block h-10 w-24 rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              type="number"
              min="1"
              max="53"
              value={week}
              onChange={(event) => setWeek(event.target.value)}
            />
          </label>
          <button
            className="h-10 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-60"
            type="button"
            onClick={loadServices}
            disabled={loading}
          >
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
          <button
            className="h-10 rounded-lg bg-[#397a5a] px-4 text-sm font-semibold text-white transition hover:bg-[#2f684b]"
            type="button"
            onClick={openModal}
          >
            Agregar registro
          </button>
        </div>
      </header>

      {error && !showModal && (
        <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {message && (
        <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      )}

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-emerald-100 bg-[#f9fdf9] p-5 shadow-sm shadow-emerald-900/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Personas registradas</p>
          <p className="mt-2 text-3xl font-bold text-emerald-950">{totalPeople}</p>
          <p className="mt-1 text-sm text-slate-500">En el periodo consultado</p>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-[#f9fdf9] p-5 shadow-sm shadow-emerald-900/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Con actividad</p>
          <p className="mt-2 text-3xl font-bold text-emerald-950">{activePeople}</p>
          <p className="mt-1 text-sm text-slate-500">Usaron al menos un servicio</p>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-[#f9fdf9] p-5 shadow-sm shadow-emerald-900/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Uso combinado</p>
          <p className="mt-2 text-3xl font-bold text-emerald-950">{categoryValues.dos}</p>
          <p className="mt-1 text-sm text-slate-500">Personas usaron ambos servicios</p>
        </article>
      </section>

      <section className="mb-6 grid items-stretch gap-6 lg:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
        <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-900/5 sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700/60">Distribución semanal</p>
            <h2 className="mt-1 text-lg font-semibold text-emerald-950">Servicios por persona</h2>
          </div>

          <div className="flex flex-col items-center gap-7 sm:flex-row sm:justify-center">
            <div
              className="relative grid size-48 shrink-0 place-items-center rounded-full"
              style={{ background: donutBackground }}
              role="img"
              aria-label={`Distribución: ${categoryValues.uno} con un servicio, ${categoryValues.dos} con dos servicios y ${categoryValues.ninguno} sin servicio`}
            >
              <div className="grid size-28 place-items-center rounded-full bg-white text-center shadow-inner">
                <div>
                  <strong className="block text-3xl text-emerald-950">{totalPeople}</strong>
                  <span className="text-xs font-medium text-slate-400">personas</span>
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
                      <span className="truncate text-sm text-slate-600">{category.label}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-950">{value} · {percentage}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-900/5 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700/60">Comparativa</p>
              <h2 className="mt-1 text-lg font-semibold text-emerald-950">Visitas por servicio</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Semana {week}
            </span>
          </div>

          <div className="space-y-6">
            {summary.servicios.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-400">No hay servicios registrados.</p>
            ) : summary.servicios.map((service, index) => {
              const visits = Number(service.visitas)
              const width = `${Math.max(4, (visits / maxVisits) * 100)}%`
              const barColor = index % 2 === 0 ? '#9acfb0' : '#c3b4e5'

              return (
                <div key={service.id_servicio}>
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{service.nombre}</p>
                      <p className="text-xs text-slate-400">{service.personas} personas</p>
                    </div>
                    <strong className="text-lg text-emerald-950">{visits} <span className="text-xs font-medium text-slate-400">visitas</span></strong>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-[#edf5ef]">
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width, backgroundColor: barColor }} />
                  </div>
                </div>
              )
            })}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm shadow-emerald-900/5">
        <div className="flex items-center justify-between gap-4 border-b border-emerald-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700/60">Registros de la semana</p>
            <h2 className="mt-1 text-lg font-semibold text-emerald-950">Personas y servicios</h2>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {summary.personas.length} personas
          </span>
        </div>

        <div className="max-h-[520px] overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#f5faf6]">
              <tr className="border-b border-emerald-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Persona</th>
                <th className="px-5 py-3">Correo</th>
                <th className="px-5 py-3">Teléfono</th>
                <th className="px-5 py-3">Servicios utilizados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {loading ? (
                <tr><td colSpan="4" className="px-5 py-12 text-center text-slate-400">Cargando registros…</td></tr>
              ) : summary.personas.length === 0 ? (
                <tr><td colSpan="4" className="px-5 py-12 text-center text-slate-400">No hay personas registradas.</td></tr>
              ) : summary.personas.map((person) => (
                <tr className="transition-colors hover:bg-emerald-50/50" key={person.id_usuario}>
                  <td className="px-5 py-3.5 font-medium text-slate-700">{person.persona}</td>
                  <td className="px-5 py-3.5 text-slate-500">{person.correo || '—'}</td>
                  <td className="px-5 py-3.5 text-slate-500">{person.telefono || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-[#edf7f0] px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {person.servicios}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={closeModal}>
          <div
            className="w-full max-w-lg rounded-2xl border border-emerald-100 bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="person-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700/60">Semana {week} · {year}</p>
                <h2 id="person-modal-title" className="mt-1 text-xl font-semibold text-emerald-950">Agregar registro de persona</h2>
              </div>
              <button className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-emerald-50 hover:text-emerald-700" type="button" onClick={closeModal} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </div>

            {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Nombre
                  <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" name="nombre" value={form.nombre} onChange={handleChange} maxLength="100" required />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Apellido
                  <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" name="apellido" value={form.apellido} onChange={handleChange} maxLength="100" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Correo
                  <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" name="correo" type="email" value={form.correo} onChange={handleChange} maxLength="150" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Teléfono
                  <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" name="telefono" value={form.telefono} onChange={handleChange} maxLength="20" />
                </label>
              </div>

              <fieldset className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                <legend className="px-1 text-sm font-semibold text-emerald-900">Servicios utilizados</legend>
                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                  {availableServices.map((service) => {
                    const serviceId = Number(service.id_servicio)
                    return (
                      <label className="flex items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-700" key={serviceId}>
                        <input className="size-4 accent-emerald-600" type="checkbox" checked={form.servicios.includes(serviceId)} onChange={() => toggleService(serviceId)} />
                        {service.nombre}
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <div className="flex justify-end gap-2 border-t border-emerald-100 pt-5">
                <button className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60" type="button" onClick={closeModal} disabled={saving}>Cancelar</button>
                <button className="h-10 rounded-lg bg-[#397a5a] px-4 text-sm font-semibold text-white hover:bg-[#2f684b] disabled:opacity-60" type="submit" disabled={saving}>
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
