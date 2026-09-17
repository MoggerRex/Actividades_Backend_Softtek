import { useCallback, useEffect, useMemo, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const emptyProduct = {
  nombre: '',
  precio: '',
  descripcion: '',
  cantidad: '',
}

const formatPrice = (price) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(price)

async function request(url, options) {
  const response = await fetch(url, options)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo completar la operación')
  }

  return data
}

function StorePage() {
  const [productos, setProductos] = useState([])
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ field: null, direction: 'asc' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [modal, setModal] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productToDelete, setProductToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState(emptyProduct)

  const cargarDatos = useCallback(async () => {
    try {
      const [productosData, alertasData] = await Promise.all([
        request(`${API_URL}/productos`),
        request(`${API_URL}/productos-alerta`),
      ])

      setProductos(productosData)
      setAlertas(alertasData)
      setError('')
    } catch (requestError) {
      setError(`${requestError.message}. Verifica que el servidor esté activo en el puerto 3001.`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- La vista se sincroniza con la API al montarse.
    cargarDatos()
  }, [cargarDatos])

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es-MX')
    const matchingProducts = term
      ? productos.filter((product) =>
          `${product.nombre} ${product.descripcion || ''}`
            .toLocaleLowerCase('es-MX')
            .includes(term),
        )
      : productos

    if (!sort.field) return matchingProducts

    const direction = sort.direction === 'asc' ? 1 : -1
    return [...matchingProducts].sort(
      (firstProduct, secondProduct) =>
        (Number(firstProduct[sort.field]) - Number(secondProduct[sort.field])) * direction,
    )
  }, [productos, search, sort])

  const toggleSort = (field) => {
    setSort((currentSort) => ({
      field,
      direction:
        currentSort.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const openAddModal = () => {
    setForm(emptyProduct)
    setSelectedProduct(null)
    setModal('add')
    setError('')
    setMessage('')
  }

  const openEditModal = (product) => {
    setForm({ ...emptyProduct, cantidad: String(product.cantidad) })
    setSelectedProduct(product)
    setModal('edit')
    setError('')
    setMessage('')
  }

  const closeModal = () => {
    if (saving) return
    setModal(null)
    setSelectedProduct(null)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (modal === 'add') {
        await request(`${API_URL}/productos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            precio: Number(form.precio),
            descripcion: form.descripcion.trim(),
            cantidad: Number(form.cantidad),
          }),
        })
        setMessage('Producto agregado correctamente.')
      } else {
        await request(`${API_URL}/productos/${selectedProduct.id}/cantidad`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cantidad: Number(form.cantidad) }),
        })
        setMessage('Cantidad actualizada correctamente.')
      }

      setModal(null)
      setSelectedProduct(null)
      await cargarDatos()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const openDeleteModal = (product) => {
    setProductToDelete(product)
    setError('')
    setMessage('')
  }

  const closeDeleteModal = () => {
    if (deleting) return
    setProductToDelete(null)
    setError('')
  }

  const deleteProduct = async () => {
    if (!productToDelete) return

    setDeleting(true)
    setError('')
    setMessage('')

    try {
      await request(`${API_URL}/productos/${productToDelete.id}`, { method: 'DELETE' })
      setProductToDelete(null)
      setMessage('Producto eliminado correctamente.')
      await cargarDatos()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-full">
      <main className="mx-auto max-w-[1450px] px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6 rounded-2xl border border-blue-100 bg-white/80 p-3 shadow-sm shadow-blue-900/5">
          <label className="relative mx-auto block w-full max-w-2xl">
            <span className="sr-only">Buscar producto</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 fill-slate-400" aria-hidden="true">
              <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z" />
            </svg>
            <input
              className="h-11 w-full rounded-xl border border-blue-100 bg-blue-50/40 py-2 pl-11 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              type="search"
              placeholder="Buscar productos"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Productos</h1>
              <button
                className="inline-flex h-10 items-center gap-2 self-start rounded-[10px] bg-[#315f9f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#284f86] focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={openAddModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="size-4 fill-current" aria-hidden="true">
                  <path d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z" />
                </svg>
                Agregar producto
              </button>
            </div>

            {error && !modal && !productToDelete && (
              <p className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}
            {message && (
              <p className="mb-4 rounded-[10px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
            <section className="min-w-0 overflow-hidden rounded-[10px] border border-slate-200 bg-white">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm font-semibold text-slate-800">Lista de productos</h2>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{filteredProducts.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`h-8 rounded-[10px] border px-3 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                      sort.field === 'precio'
                        ? 'border-[#315f9f] bg-[#315f9f] text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                    }`}
                    type="button"
                    onClick={() => toggleSort('precio')}
                    aria-pressed={sort.field === 'precio'}
                  >
                    Precio{sort.field === 'precio' ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                  <button
                    className={`h-8 rounded-[10px] border px-3 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                      sort.field === 'cantidad'
                        ? 'border-[#315f9f] bg-[#315f9f] text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                    }`}
                    type="button"
                    onClick={() => toggleSort('cantidad')}
                    aria-pressed={sort.field === 'cantidad'}
                  >
                    Cantidad{sort.field === 'cantidad' ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </div>
              </div>

              <div className="max-h-[560px] overflow-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                    <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="w-20 px-5 py-3">ID</th>
                      <th className="px-5 py-3">Producto</th>
                      <th className="px-5 py-3 text-right">Precio</th>
                      <th className="px-5 py-3 text-center">Cantidad</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan="5" className="px-5 py-12 text-center text-sm text-slate-400">Cargando productos...</td></tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr><td colSpan="5" className="px-5 py-12 text-center text-sm text-slate-400">No se encontraron productos.</td></tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="transition-colors hover:bg-blue-50/50">
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-400">#{product.id}</td>
                          <td className="px-5 py-3.5">
                            <p className="truncate font-medium text-slate-800">{product.nombre}</p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-right font-medium text-slate-700">{formatPrice(Number(product.precio))}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex min-w-10 justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{product.cantidad}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-1">
                              <button
                                className="rounded-[10px] px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                type="button"
                                onClick={() => openEditModal(product)}
                              >
                                Editar
                              </button>
                              <button
                                className="rounded-[10px] px-2.5 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-100"
                                type="button"
                                onClick={() => openDeleteModal(product)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="min-w-0 overflow-hidden rounded-[10px] border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm font-semibold text-slate-800">Alertas</h2>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{alertas.length}</span>
                </div>
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50/95">
                    <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3">Producto</th>
                      <th className="px-5 py-3 text-right">Precio</th>
                      <th className="px-5 py-3 text-center">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alertas.length === 0 ? (
                      <tr><td colSpan="3" className="px-5 py-10 text-center text-sm text-slate-400">Sin alertas por el momento.</td></tr>
                    ) : (
                      alertas.map((product) => (
                        <tr key={product.id} className="transition-colors hover:bg-amber-50/30">
                          <td className="px-5 py-3.5 font-medium text-slate-700">{product.nombre}</td>
                          <td className="px-5 py-3.5 text-right text-slate-600">{formatPrice(Number(product.precio))}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex min-w-10 justify-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">{product.stock_actual}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            </div>
      </main>

      {productToDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={closeDeleteModal}>
          <div
            className="w-full max-w-sm rounded-[10px] border border-slate-200 bg-white p-6 shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="delete-modal-title" className="text-lg font-semibold text-slate-900">Eliminar producto</h2>
            <p id="delete-modal-description" className="mt-2 text-sm leading-6 text-slate-500">
              ¿Deseas eliminar <span className="font-semibold text-slate-700">{productToDelete.nombre}</span>?
            </p>

            {error && <p className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
              <button
                className="h-10 rounded-[10px] border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="h-10 rounded-[10px] bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={deleteProduct}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={closeModal}>
          <div
            className="w-full max-w-md rounded-[10px] border border-slate-200 bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="modal-title" className="text-lg font-semibold text-slate-900">{modal === 'add' ? 'Agregar producto' : 'Editar cantidad'}</h2>
                {modal === 'edit' && <p className="mt-1 text-sm text-slate-500">{selectedProduct.nombre}</p>}
              </div>
              <button className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600" type="button" onClick={closeModal} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </div>

            {error && <p className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {modal === 'add' && (
                <>
                  <label className="block text-sm font-medium text-slate-700">
                    Nombre
                    <input className="mt-1.5 h-10 w-full rounded-[10px] border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" name="nombre" value={form.nombre} onChange={handleChange} maxLength="100" required />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Precio
                    <input className="mt-1.5 h-10 w-full rounded-[10px] border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" name="precio" type="number" min="0" step="0.01" value={form.precio} onChange={handleChange} required />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Descripción
                    <textarea className="mt-1.5 w-full resize-y rounded-[10px] border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" name="descripcion" value={form.descripcion} onChange={handleChange} rows="3" />
                  </label>
                </>
              )}

              <label className="block text-sm font-medium text-slate-700">
                Cantidad
                <input className="mt-1.5 h-10 w-full rounded-[10px] border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" name="cantidad" type="number" min="0" step="1" value={form.cantidad} onChange={handleChange} required />
              </label>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
                <button className="h-10 rounded-[10px] border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={closeModal} disabled={saving}>Cancelar</button>
                <button className="h-10 rounded-[10px] bg-[#315f9f] px-4 text-sm font-semibold text-white transition hover:bg-[#284f86] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StorePage
