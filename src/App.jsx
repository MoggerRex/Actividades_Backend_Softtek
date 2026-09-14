import { useEffect, useState } from 'react'
import './App.css'

const formatPrice = (price) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(price)

function App() {
  const [productos, setProductos] = useState([])
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [productosRes, alertasRes] = await Promise.all([
          fetch('http://localhost:3001/api/productos'),
          fetch('http://localhost:3001/api/productos-alerta'),
        ])

        const productosData = await productosRes.json()
        const alertasData = await alertasRes.json()

        setProductos(productosData)
        setAlertas(alertasData)
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  return (
    <main className="inventory">
      <section className="table-section products-section">
        <h2>Productos</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4">Cargando productos...</td>
                </tr>
              ) : (
                productos.map((producto) => (
                  <tr key={producto.id}>
                    <td>{producto.id}</td>
                    <td>{producto.nombre}</td>
                    <td>{formatPrice(Number(producto.precio))}</td>
                    <td>{producto.cantidad}</td>
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
                <tr>
                  <td colSpan="3">Sin alertas por el momento</td>
                </tr>
              ) : (
                alertas.map((producto) => (
                  <tr key={producto.id}>
                    <td>{producto.nombre}</td>
                    <td>{formatPrice(Number(producto.precio))}</td>
                    <td className="low-stock">{producto.stock_actual}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default App
