import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const emptyProduct = {
  nombre: '',
  precio: '',
  descripcion: '',
  cantidad: '',
}

const emptyServiceSummary = {
  categorias: [],
  servicios: [],
  personas: [],
}

const emptyServicePerson = {
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  servicios: [],
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
  const [section, setSection] = useState('inventario')
  const [menuOpen, setMenuOpen] = useState(false)
  const [productos, setProductos] = useState([])
  const [alertas, setAlertas] = useState([])
  const [serviceSummary, setServiceSummary] = useState(emptyServiceSummary)
  const [serviceYear, setServiceYear] = useState('2026')
  const [serviceWeek, setServiceWeek] = useState('38')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [modal, setModal] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [form, setForm] = useState(emptyProduct)
  const [serviceForm, setServiceForm] = useState(emptyServicePerson)

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

  const cargarServicios = useCallback(async () => {
    try {
      const data = await request(`${API_URL}/servicios-resumen?anio=${serviceYear}&semana=${serviceWeek}`)
      setServiceSummary(data)
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [serviceWeek, serviceYear])

  const openAddPersonModal = () => {
    setServiceForm(emptyServicePerson)
    setModal('add-person')
    setError('')
    setMessage('')
  }

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- La vista se sincroniza con la API al montarse.
    cargarDatos()
  }, [cargarDatos])

  useEffect(() => {
    cargarServicios()
  }, [cargarServicios])

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

  const handleServiceChange = (event) => {
    const { name, value } = event.target
    setServiceForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const toggleService = (serviceId) => {
    setServiceForm((currentForm) => ({
      ...currentForm,
      servicios: currentForm.servicios.includes(serviceId)
        ? currentForm.servicios.filter((id) => id !== serviceId)
        : [...currentForm.servicios, serviceId],
    }))
  }

  const handlePersonSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await request(`${API_URL}/usuarios-servicios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...serviceForm,
          anio: Number(serviceYear),
          semana: Number(serviceWeek),
        }),
      })
      setModal(null)
      setMessage('Persona registrada correctamente.')
      await cargarServicios()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
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

  const selectSection = (nextSection) => {
    setSection(nextSection)
    setMenuOpen(false)
    setError('')
  }

  const categoryValues = { uno: 0, dos: 0, ninguno: 0 }
  serviceSummary.categorias.forEach((item) => {
    categoryValues[item.categoria] = Number(item.personas)
  })
  const totalPeople = Object.values(categoryValues).reduce((total, value) => total + value, 0)
  const serviceCards = serviceSummary.servicios.map((service, index) => ({
    key: `servicio-${service.id_servicio}`,
    label: service.nombre,
    people: Number(service.personas),
    color: index % 2 === 0 ? 'gold' : 'teal',
  }))
  serviceCards.push({
    key: 'ninguno',
    label: 'Ningún servicio',
    people: categoryValues.ninguno,
    color: 'coral',
  })

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">T</span>
          <div>
            <p className="eyebrow">Panel de operación</p>
            <h1>Tienda Norte</h1>
          </div>
        </div>
        <button
          className="menu-toggle"
          type="button"
          aria-label="Abrir menú de navegación"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Navegación principal">
          <button className={section === 'inventario' ? 'nav-item active' : 'nav-item'} type="button" onClick={() => selectSection('inventario')}>
            <span className="nav-icon">▦</span> Inventario
          </button>
          <button className={section === 'servicios' ? 'nav-item active' : 'nav-item'} type="button" onClick={() => selectSection('servicios')}>
            <span className="nav-icon">◌</span> Servicios
          </button>
        </nav>
      </header>

      {section === 'inventario' ? (
        <div className="inventory">
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
        </div>
      ) : (
        <section className="services-page">
          <div className="page-intro">
            <div>
              <p className="eyebrow">Análisis de uso</p>
              <h2>Servicios</h2>
              <p>Consulta cuántas personas utilizaron uno, dos o ningún servicio durante una semana.</p>
            </div>
            <div className="period-filter">
              <label>Año<input type="number" min="2000" value={serviceYear} onChange={(event) => setServiceYear(event.target.value)} /></label>
              <label>Semana<input type="number" min="1" max="53" value={serviceWeek} onChange={(event) => setServiceWeek(event.target.value)} /></label>
              <button className="primary-button" type="button" onClick={cargarServicios}>Actualizar</button>
              <button className="primary-button" type="button" onClick={openAddPersonModal}>Agregar registro</button>
            </div>
          </div>

          {error && <p className="feedback error-message">{error}</p>}
          {message && <p className="feedback success-message">{message}</p>}
          <div className="service-summary-grid">
            {serviceCards.map((category) => {
              const people = category.people
              const percentage = totalPeople ? Math.round((people / totalPeople) * 100) : 0
              return (
                <article className={`service-card ${category.color}`} key={category.key}>
                  <div className="service-card-top"><span>{category.label}</span><strong>{percentage}%</strong></div>
                  <div className="progress-track"><span style={{ width: `${percentage}%` }} /></div>
                  <p><b>{people}</b> {people === 1 ? 'persona' : 'personas'}</p>
                </article>
              )
            })}
          </div>

          <div className="services-detail-grid">
            <section className="detail-panel">
              <div className="panel-heading"><div><p className="eyebrow">Desglose semanal</p><h3>Visitas por servicio</h3></div><span className="total-badge">{totalPeople} personas</span></div>
              <div className="service-list">
                {serviceSummary.servicios.length === 0 ? <p className="empty-service">No hay servicios registrados.</p> : serviceSummary.servicios.map((service) => (
                  <div className="service-row" key={service.id_servicio}><span>{service.nombre}</span><b>{service.visitas} visitas</b></div>
                ))}
              </div>
            </section>
            <aside className="insight-panel"><span className="insight-icon">✦</span><p className="eyebrow">Lectura rápida</p><h3>{categoryValues.dos} {categoryValues.dos === 1 ? 'persona usa' : 'personas usan'} ambos servicios</h3><p>Los porcentajes se calculan sobre todas las personas registradas, incluyendo quienes no tuvieron visitas en la semana seleccionada.</p></aside>
          </div>

          <section className="table-section people-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Registros de la semana</p>
                <h3>Personas y servicios</h3>
              </div>
              <span className="total-badge">{serviceSummary.personas.length} personas</span>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Servicios utilizados</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceSummary.personas.length === 0 ? (
                    <tr><td colSpan="4" className="empty-row">No hay personas registradas.</td></tr>
                  ) : serviceSummary.personas.map((person) => (
                    <tr key={person.id_usuario}>
                      <td>{person.persona}</td>
                      <td>{person.correo || '—'}</td>
                      <td>{person.telefono || '—'}</td>
                      <td>{person.servicios}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      )}

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <h2 id="modal-title">
              {modal === 'add' ? 'Agregar producto' : modal === 'add-person' ? 'Agregar registro de persona' : 'Editar cantidad'}
            </h2>
            {modal === 'edit' && <p className="modal-description">{selectedProduct.nombre}</p>}
            {error && <p className="feedback error-message">{error}</p>}

            {modal === 'add-person' ? (
              <form onSubmit={handlePersonSubmit}>
                <label>Nombre<input name="nombre" value={serviceForm.nombre} onChange={handleServiceChange} maxLength="100" required /></label>
                <label>Apellido<input name="apellido" value={serviceForm.apellido} onChange={handleServiceChange} maxLength="100" /></label>
                <label>Correo<input name="correo" type="email" value={serviceForm.correo} onChange={handleServiceChange} maxLength="150" /></label>
                <label>Teléfono<input name="telefono" value={serviceForm.telefono} onChange={handleServiceChange} maxLength="20" /></label>
                <fieldset className="service-checkboxes">
                  <legend>Servicios utilizados</legend>
                  <label><input type="checkbox" checked={serviceForm.servicios.includes(1)} onChange={() => toggleService(1)} /> Masajes</label>
                  <label><input type="checkbox" checked={serviceForm.servicios.includes(2)} onChange={() => toggleService(2)} /> Rehabilitación</label>
                </fieldset>
                <div className="modal-actions">
                  <button type="button" onClick={closeModal} disabled={saving}>Cancelar</button>
                  <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar registro'}</button>
                </div>
              </form>
            ) : (
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
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default App