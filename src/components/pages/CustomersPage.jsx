import { useCallback, useEffect, useMemo, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const emptyData = {
  clientes: [],
  distribucion: [],
  mejorCliente: null,
  clienteEnRiesgo: null,
}

const categoryMeta = {
  'Cliente alto nivel': { shortLabel: 'Alto nivel', color: '#e11d62', badge: 'bg-[#f4e2e8] text-[#6f203e] dark:bg-rose-500/25 dark:text-rose-300' },
  'Cliente normal': { shortLabel: 'Normal', color: '#6366f1', badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' },
  'Cliente en riesgo': { shortLabel: 'En riesgo', color: '#f59e0b', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
}

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const formatDate = (value) => {
  if (!value) return 'Sin pedidos'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

async function request(url) {
  const response = await fetch(url)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'No se pudo completar la operación')
  return data
}

function UserIcon() {
  return (
    <svg viewBox="0 0 640 640" fill="currentColor" aria-hidden="true">
      <path d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z" />
    </svg>
  )
}

function RankCard({ eyebrow, client, risk = false }) {
  return (
    <article className={`rounded-[10px] bg-gradient-to-br from-white p-5 shadow-sm dark:from-[#101010] ${risk ? 'to-amber-50/70 dark:to-[#160e02]' : 'to-[#faeef2] dark:to-[#16060d]'}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${risk ? 'text-amber-700/70 dark:text-amber-300/70' : 'text-[#7a2746]/70 dark:text-rose-300/70'}`}>{eyebrow}</p>
        <span className={`grid size-9 place-items-center rounded-xl ${risk ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/25 dark:text-amber-300' : 'bg-[#f1dce3] text-[#7a2746] dark:bg-rose-500/25 dark:text-rose-300'}`}><span className="size-5"><UserIcon /></span></span>
      </div>
      {client ? (
        <>
          <p className="truncate text-xl font-semibold text-slate-800 dark:text-slate-100">{client.nombre}</p>
          <p className="mt-1 truncate text-sm text-slate-400 dark:text-slate-500">{client.correo || 'Sin correo registrado'}</p>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">{risk ? 'Último pedido' : 'Gasto acumulado'}</p>
              <p className="mt-1 font-bold text-slate-700 dark:text-slate-200">{risk ? formatDate(client.ultimo_pedido) : money.format(Number(client.total_gastado || 0))}</p>
            </div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{Number(client.total_pedidos || 0)} pedidos</span>
          </div>
        </>
      ) : (
        <div className="py-5"><p className="font-semibold text-slate-500 dark:text-slate-300">Sin clientes en esta categoría</p><p className="mt-1 text-sm text-slate-400">La vista se actualizará al cumplir las reglas del SQL.</p></div>
      )}
    </article>
  )
}

function CustomersPage() {
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('Todos')

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await request(`${API_URL}/clientes-resumen`)
      setData({ ...emptyData, ...result })
      setError('')
    } catch (requestError) {
      setData(emptyData)
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- La página carga las vistas de clientes al abrirse.
    loadCustomers()
  }, [loadCustomers])

  const distribution = useMemo(() => {
    const counts = Object.keys(categoryMeta).map((category) => {
      const supplied = data.distribucion.find((item) => item.categoria === category)
      return { category, count: Number(supplied?.total || 0) }
    })
    return { counts, total: counts.reduce((sum, item) => sum + item.count, 0) }
  }, [data.distribucion])

  const donutBackground = useMemo(() => {
    if (!distribution.total) return 'var(--empty-chart-wine)'
    let accumulated = 0
    const segments = distribution.counts.map((item) => {
      const start = accumulated
      accumulated += (item.count / distribution.total) * 100
      return `${categoryMeta[item.category].color} ${start}% ${accumulated}%`
    })
    return `conic-gradient(${segments.join(', ')})`
  }, [distribution])

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es')
    return data.clientes.filter((client) => {
      const matchesStatus = status === 'Todos' || client.estatus === status
      const haystack = `${client.nombre} ${client.correo || ''} ${client.telefono || ''}`.toLocaleLowerCase('es')
      return matchesStatus && (!query || haystack.includes(query))
    })
  }, [data.clientes, search, status])

  const totalRevenue = data.clientes.reduce((sum, client) => sum + Number(client.total_gastado || 0), 0)
  const totalOrders = data.clientes.reduce((sum, client) => sum + Number(client.total_pedidos || 0), 0)
  const recentOrders = data.clientes.reduce((sum, client) => sum + Number(client.pedidos_ultimos_90_dias || 0), 0)

  return (
    <main className="mx-auto min-h-full max-w-[1450px] px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#7a2746]/65 dark:text-rose-300/70">Relación comercial</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#4f182e] dark:text-rose-100">Clientes</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Información calculada por las vistas metricas_de_clientes y estatus_clientes.</p>
        </div>
        <button className="h-10 rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-[#7a2746] transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-400/20 dark:bg-[#101010] dark:text-rose-200" type="button" onClick={loadCustomers} disabled={loading}>{loading ? 'Actualizando…' : 'Actualizar datos'}</button>
      </header>

      {error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">{error}</p>}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Clientes registrados', distribution.total, 'Incluidos en las vistas'],
          ['Pedidos acumulados', totalOrders, 'Compras registradas'],
          ['Pedidos últimos 90 días', recentOrders, 'Actividad reciente'],
          ['Ingresos de clientes', money.format(totalRevenue), 'Gasto total acumulado'],
        ].map(([label, value, helper]) => (
          <article className="rounded-[10px] bg-white/85 p-5 shadow-sm shadow-rose-950/5 dark:bg-[#101010] dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)]" key={label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-[#4f182e] dark:text-rose-100">{value}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
          </article>
        ))}
      </section>

      <section className="mb-6 grid gap-6 lg:grid-cols-[minmax(330px,0.8fr)_minmax(0,1.2fr)]">
        <article className="rounded-[10px] bg-white p-5 shadow-sm shadow-rose-950/5 dark:bg-[#101010] dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)] sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a2746]/60 dark:text-rose-300/60">Distribución</p>
          <h2 className="mt-1 text-lg font-semibold text-[#4f182e] dark:text-rose-100">Estatus de clientes</h2>
          <div className="mt-7 flex flex-col items-center gap-7 sm:flex-row sm:justify-center">
            <div className="grid size-44 shrink-0 place-items-center rounded-full" style={{ background: donutBackground }} role="img" aria-label="Distribución por estatus de cliente">
              <div className="grid size-28 place-items-center rounded-full bg-white text-center shadow-inner dark:bg-[#101010]"><div><strong className="block text-3xl text-[#4f182e] dark:text-rose-100">{distribution.total}</strong><span className="text-xs text-slate-400">clientes</span></div></div>
            </div>
            <div className="w-full space-y-3">
              {distribution.counts.map((item) => {
                const meta = categoryMeta[item.category]
                const percentage = distribution.total ? Math.round((item.count / distribution.total) * 100) : 0
                return (
                  <div className="flex items-center justify-between gap-3" key={item.category}>
                    <div className="flex items-center gap-2.5"><span className="size-3 rounded-full" style={{ backgroundColor: meta.color }} /><span className="text-sm text-slate-600 dark:text-slate-300">{meta.shortLabel}</span></div>
                    <span className="text-sm font-bold text-[#4f182e] dark:text-rose-100">{item.count} · {percentage}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </article>
        <div className="grid gap-4 sm:grid-cols-2">
          <RankCard eyebrow="Mejor cliente de alto nivel" client={data.mejorCliente} />
          <RankCard eyebrow="Cliente con mayor riesgo" client={data.clienteEnRiesgo} risk />
        </div>
      </section>

      <section className="overflow-hidden rounded-[10px] bg-white shadow-sm shadow-rose-950/5 dark:bg-[#101010] dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-white/5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a2746]/60 dark:text-rose-300/60">Vistas SQL</p><h2 className="mt-1 text-lg font-semibold text-[#4f182e] dark:text-rose-100">Métricas de clientes</h2></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative"><span className="sr-only">Buscar cliente</span><svg className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg><input className="h-10 w-full rounded-xl border border-rose-100 bg-[#fcf8f9] pl-9 pr-3 text-sm outline-none focus:border-[#b75c7e] focus:ring-2 focus:ring-rose-100 dark:border-rose-400/25 dark:bg-white/5 sm:w-72" type="search" placeholder="Nombre, correo o teléfono" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <select className="h-10 rounded-xl border border-rose-100 bg-[#fcf8f9] px-3 text-sm text-slate-600 outline-none dark:border-rose-400/25 dark:bg-[#101010] dark:text-slate-300" value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option>{Object.keys(categoryMeta).map((category) => <option key={category}>{category}</option>)}</select>
          </div>
        </div>

        <div className="max-h-[620px] overflow-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#fbf5f7] dark:bg-[#0b0b0b]">
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:border-white/5 dark:text-slate-500">
                <th className="px-5 py-3">Cliente</th><th className="px-5 py-3">Estatus</th><th className="px-5 py-3 text-right">Gasto total</th><th className="px-5 py-3 text-center">Compras</th><th className="px-5 py-3">Último pedido</th><th className="px-5 py-3 text-center">Últimos 90 días</th><th className="px-5 py-3 text-center">Mes actual</th><th className="px-5 py-3 text-center">Mes anterior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan="8" className="px-5 py-14 text-center text-slate-400">Cargando las vistas de clientes…</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="8" className="px-5 py-14 text-center text-slate-400">No hay clientes que coincidan con los filtros.</td></tr>
              ) : filteredCustomers.map((client) => {
                const meta = categoryMeta[client.estatus] || categoryMeta['Cliente normal']
                return (
                  <tr className="transition hover:bg-rose-50/40 dark:hover:bg-rose-500/5" key={client.id_usuario}>
                    <td className="px-5 py-3.5"><p className="font-semibold text-slate-700 dark:text-slate-200">{client.nombre}</p><p className="text-xs text-slate-400">{client.correo || 'Sin correo'} · {client.telefono || 'Sin teléfono'}</p></td>
                    <td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>{meta.shortLabel}</span></td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200">{money.format(Number(client.total_gastado || 0))}</td>
                    <td className="px-5 py-3.5 text-center text-slate-500 dark:text-slate-400">{Number(client.total_pedidos || 0)}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{formatDate(client.ultimo_pedido)}</td>
                    <td className="px-5 py-3.5 text-center font-semibold text-[#7a2746] dark:text-rose-300">{Number(client.pedidos_ultimos_90_dias || 0)}</td>
                    <td className="px-5 py-3.5 text-center text-slate-500 dark:text-slate-400">{Number(client.pedidos_mes_actual || 0)}</td>
                    <td className="px-5 py-3.5 text-center text-slate-500 dark:text-slate-400">{Number(client.pedidos_mes_anterior || 0)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400 dark:border-white/5">Mostrando {filteredCustomers.length} de {data.clientes.length} clientes</div>
      </section>
    </main>
  )
}

export default CustomersPage
