import './App.css'

const products = [
  { id: 1, name: 'Teclado Mecánico RGB', price: 850, stock: 12 },
  { id: 2, name: 'Mouse Inalámbrico Ergonómico', price: 350, stock: 8 },
  { id: 3, name: 'Cable USB-C 2 metros', price: 85, stock: 5 },
  { id: 4, name: 'Memoria USB 32GB', price: 95, stock: 15 },
  { id: 5, name: 'Monitor 24 Pulgadas Full HD', price: 2400, stock: 10 },
  { id: 6, name: 'Pluma de Pintura Gouache', price: 45, stock: 30 },
  { id: 7, name: 'Libreta de Dibujo A4', price: 120, stock: 9 },
  { id: 8, name: 'Audífonos Bluetooth Over-Ear', price: 450, stock: 25 },
  { id: 9, name: 'Adaptador HDMI a VGA', price: 75, stock: 8 },
  { id: 10, name: 'Tapete para Mouse XL', price: 180, stock: 14 },
  { id: 11, name: 'Disco Duro Externo 1TB', price: 1100, stock: 7 },
  { id: 12, name: 'Hub USB 4 Puertos', price: 150, stock: 20 },
  { id: 13, name: 'Limpiador de Pantallas Kit', price: 60, stock: 40 },
  { id: 14, name: 'Soporte para Laptop Aluminio', price: 280, stock: 11 },
  { id: 15, name: 'Camiseta Negra Algodón', price: 199, stock: 6 },
  { id: 16, name: 'Taza Cerámica 350ml', price: 80, stock: 12 },
  { id: 17, name: 'Pasta Térmica para CPU', price: 130, stock: 15 },
  { id: 18, name: 'Cable Red Ethernet Cat6 5m', price: 90, stock: 50 },
  { id: 19, name: 'Lámpara LED de Escritorio', price: 320, stock: 8 },
  { id: 20, name: 'Mochila para Laptop 15"', price: 550, stock: 18 },
  { id: 21, name: 'Funda Impermeable Tablet', price: 110, stock: 22 },
  { id: 22, name: 'Organizador de Cables Velcro', price: 40, stock: 60 },
  { id: 23, name: 'Protector de Pantalla Cristal', price: 70, stock: 15 },
  { id: 24, name: 'Micrófono USB Condensador', price: 890, stock: 5 },
  { id: 25, name: 'Tarjeta MicroSD 128GB', price: 260, stock: 30 },
  { id: 26, name: 'Batería Portátil 10000mAh', price: 390, stock: 10 },
  { id: 27, name: 'Marcadores Permanentes (Pack 4)', price: 55, stock: 25 },
  { id: 28, name: 'Cinta Adhesiva de Embalaje', price: 35, stock: 80 },
  { id: 29, name: 'Bocina Bluetooth Portátil', price: 480, stock: 4 },
  { id: 30, name: 'Teclado Numérico USB', price: 140, stock: 16 },
]

const alerts = products.filter((product) => product.price >= 100 && product.stock <= 10)

const formatPrice = (price) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(price)

function App() {
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
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>{product.stock}</td>
                </tr>
              ))}
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
              {alerts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td className="low-stock">{product.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default App
