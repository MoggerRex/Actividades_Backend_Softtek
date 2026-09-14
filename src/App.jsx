import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

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

function App() {
  const [productos, setProductos] = useState([])
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [modal, setModal] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
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
    if (!term) return productos

    return productos.filter((product) =>
      `${product.nombre} ${product.descripcion || ''}`
        .toLocaleLowerCase('es-MX')
        .includes(term),
    )
  }, [productos, search])

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

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(`¿Eliminar el producto "${product.nombre}"?`)
    if (!confirmed) return

    setError('')
    setMessage('')

    try {
      await request(`${API_URL}/productos/${product.id}`, { method: 'DELETE' })
      setMessage('Producto eliminado correctamente.')
      await cargarDatos()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="inventory">
      <section className="table-section products-section">
        <div className="section-heading">
          <h2>Productos</h2>
          <div className="table-actions">
            <input
              type="search"
              placeholder="Buscar producto..."
              aria-label="Buscar producto"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button className="primary-button" type="button" onClick={openAddModal}>
              Agregar producto
            </button>
          </div>
        </div>

        {error && <p className="feedback error-message">{error}</p>}
        {message && <p className="feedback success-message">{message}</p>}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="empty-row">Cargando productos...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="5" className="empty-row">No se encontraron productos.</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.nombre}</td>
                    <td>{formatPrice(Number(product.precio))}</td>
                    <td>{product.cantidad}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" onClick={() => openEditModal(product)}>Editar</button>
                        <button className="delete-button" type="button" onClick={() => deleteProduct(product)}>
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

      <section className="table-section alerts-section">
        <h2>Alertas</h2>
        <p>Precio de $100 o más y cantidad de 10 o menos.</p>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {alertas.length === 0 ? (
                <tr><td colSpan="3" className="empty-row">Sin alertas por el momento.</td></tr>
              ) : (
                alertas.map((product) => (
                  <tr key={product.id}>
                    <td>{product.nombre}</td>
                    <td>{formatPrice(Number(product.precio))}</td>
                    <td className="low-stock">{product.stock_actual}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <h2 id="modal-title">{modal === 'add' ? 'Agregar producto' : 'Editar cantidad'}</h2>
            {modal === 'edit' && <p className="modal-description">{selectedProduct.nombre}</p>}
            {error && <p className="feedback error-message">{error}</p>}

            <form onSubmit={handleSubmit}>
              {modal === 'add' && (
                <>
                  <label>
                    Nombre
                    <input name="nombre" value={form.nombre} onChange={handleChange} maxLength="100" required />
                  </label>
                  <label>
                    Precio
                    <input name="precio" type="number" min="0" step="0.01" value={form.precio} onChange={handleChange} required />
                  </label>
                  <label>
                    Descripción
                    <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows="3" />
                  </label>
                </>
              )}

              <label>
                Cantidad
                <input name="cantidad" type="number" min="0" step="1" value={form.cantidad} onChange={handleChange} required />
              </label>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} disabled={saving}>Cancelar</button>
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
