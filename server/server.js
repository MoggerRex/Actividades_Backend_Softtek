const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'tienda_inventario',
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a MySQL:', err);
    return;
  }
  console.log('Conexión exitosa a MySQL');
});

app.get('/api/productos', (req, res) => {
  const sql = 'SELECT * FROM productos ORDER BY id ASC';

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error consultando productos:', err);
      return res.status(500).json({ error: 'Error al consultar productos' });
    }
    res.json(result);
  });
});

app.get('/api/productos-alerta', (req, res) => {
  const sql = `
    SELECT id, nombre, precio, cantidad AS stock_actual,
           '¡ALERTA! Reabastecer producto (Precio >= $100 y Stock <= 10)' AS aviso
    FROM productos
    WHERE precio >= 100.00 AND cantidad <= 10
    ORDER BY id ASC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error consultando productos en alerta:', err);
      return res.status(500).json({ error: 'Error al consultar alertas' });
    }
    res.json(result);
  });
});

app.listen(3001, () => {
  console.log('Servidor corriendo en http://localhost:3001');
});
