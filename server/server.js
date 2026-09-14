const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'tienda_inventario',
  port: Number(process.env.DB_PORT) || 3306,
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a MySQL:', err);
    process.exitCode = 1;
    return;
  }
  console.log('Conexión exitosa a MySQL');

  const port = Number(process.env.PORT) || 3001;
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
});

const isPositiveId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const isValidQuantity = (value) => Number.isInteger(Number(value)) && Number(value) >= 0;

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

app.post('/api/productos', (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  const descripcion = String(req.body.descripcion || '').trim();
  const precio = Number(req.body.precio);
  const cantidad = Number(req.body.cantidad);

  if (!nombre || !Number.isFinite(precio) || precio < 0 || !isValidQuantity(cantidad)) {
    return res.status(400).json({
      error: 'Nombre, precio y cantidad son obligatorios y deben tener valores válidos',
    });
  }

  db.query(
    'CALL sp_insertar_producto(?, ?, ?, ?)',
    [nombre, precio, descripcion, cantidad],
    (err) => {
      if (err) {
        console.error('Error insertando producto:', err);
        return res.status(500).json({ error: 'No se pudo agregar el producto' });
      }

      res.status(201).json({ message: 'Producto agregado correctamente' });
    },
  );
});

app.patch('/api/productos/:id/cantidad', (req, res) => {
  const { id } = req.params;
  const cantidad = Number(req.body.cantidad);

  if (!isPositiveId(id) || !isValidQuantity(cantidad)) {
    return res.status(400).json({ error: 'El ID y la cantidad deben ser valores válidos' });
  }

  db.query('CALL sp_actualizar_cantidad_producto(?, ?)', [Number(id), cantidad], (err) => {
    if (err) {
      console.error('Error actualizando cantidad:', err);
      return res.status(500).json({ error: 'No se pudo actualizar la cantidad' });
    }

    res.json({ message: 'Cantidad actualizada correctamente' });
  });
});

app.delete('/api/productos/:id', (req, res) => {
  const { id } = req.params;

  if (!isPositiveId(id)) {
    return res.status(400).json({ error: 'El ID del producto no es válido' });
  }

  db.query('CALL sp_eliminar_producto(?)', [Number(id)], (err) => {
    if (err) {
      console.error('Error eliminando producto:', err);
      return res.status(500).json({ error: 'No se pudo eliminar el producto' });
    }

    res.json({ message: 'Producto eliminado correctamente' });
  });
});
