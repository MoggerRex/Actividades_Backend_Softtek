const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
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
const AREA_OPTIONS = ['RH', 'IT', 'Marketing', 'Ventas', 'Finanzas', 'Operaciones'];

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

app.get('/api/servicios-resumen', (req, res) => {
  const anio = Number(req.query.anio);
  const semana = Number(req.query.semana);

  if (!Number.isInteger(anio) || anio < 2000 || !Number.isInteger(semana) || semana < 1 || semana > 53) {
    return res.status(400).json({ error: 'El año y la semana deben tener valores válidos' });
  }

  const resumenSql = `
    SELECT
      CASE
        WHEN servicios_utilizados >= 2 THEN 'dos'
        WHEN servicios_utilizados = 1 THEN 'uno'
        ELSE 'ninguno'
      END AS categoria,
      COUNT(*) AS personas
    FROM (
      SELECT u.id_usuario, COUNT(DISTINCT v.id_servicio) AS servicios_utilizados
      FROM usuarios u
      LEFT JOIN visitas v
        ON u.id_usuario = v.id_usuario
        AND v.anio = ?
        AND v.semana = ?
      GROUP BY u.id_usuario
    ) AS usuarios_resumen
    GROUP BY categoria
  `;

  const serviciosSql = `
    SELECT
      s.id_servicio,
      CASE s.id_servicio
        WHEN 1 THEN 'Masajes'
        WHEN 2 THEN 'Rehabilitación'
        ELSE s.nombre
      END AS nombre,
      COUNT(v.id_visita) AS visitas,
      COUNT(DISTINCT v.id_usuario) AS personas
    FROM servicios s
    LEFT JOIN visitas v
      ON s.id_servicio = v.id_servicio
      AND v.anio = ?
      AND v.semana = ?
    WHERE s.activo = TRUE
    GROUP BY s.id_servicio, s.nombre
    ORDER BY s.id_servicio
  `;

  const personasSql = `
    SELECT
      u.id_usuario,
      TRIM(CONCAT(u.nombre, ' ', COALESCE(u.apellido, ''))) AS persona,
      u.correo,
      u.telefono,
      COALESCE(
        GROUP_CONCAT(
          DISTINCT CASE s.id_servicio
            WHEN 1 THEN 'Masajes'
            WHEN 2 THEN 'Rehabilitación'
            ELSE s.nombre
          END
          ORDER BY s.id_servicio SEPARATOR ', '
        ),
        'Ningún servicio'
      ) AS servicios,
      COUNT(DISTINCT v.id_servicio) AS servicios_utilizados
    FROM usuarios u
    LEFT JOIN visitas v
      ON u.id_usuario = v.id_usuario
      AND v.anio = ?
      AND v.semana = ?
    LEFT JOIN servicios s
      ON s.id_servicio = v.id_servicio
    GROUP BY u.id_usuario, u.nombre, u.apellido, u.correo, u.telefono
    ORDER BY u.id_usuario
  `;

  db.query(resumenSql, [anio, semana], (summaryError, summaryRows) => {
    if (summaryError) {
      console.error('Error consultando resumen de servicios:', summaryError);
      return res.status(500).json({ error: 'No se pudo consultar el resumen de servicios' });
    }

    db.query(serviciosSql, [anio, semana], (servicesError, serviceRows) => {
      if (servicesError) {
        console.error('Error consultando visitas por servicio:', servicesError);
        return res.status(500).json({ error: 'No se pudo consultar las visitas por servicio' });
      }

      db.query(personasSql, [anio, semana], (peopleError, peopleRows) => {
        if (peopleError) {
          console.error('Error consultando personas y servicios:', peopleError);
          return res.status(500).json({ error: 'No se pudieron consultar las personas y sus servicios' });
        }

        res.json({
          anio,
          semana,
          categorias: summaryRows,
          servicios: serviceRows,
          personas: peopleRows,
        });
      });
    });
  });
});

app.get('/api/servicios-ranking', (req, res) => {
  const porPersonaSql = `
    SELECT servicio, id_usuario, persona, area, visitas
    FROM (
      SELECT
        CASE s.id_servicio
          WHEN 1 THEN 'Masajes'
          WHEN 2 THEN 'Rehabilitación'
          ELSE s.nombre
        END AS servicio,
        u.id_usuario,
        TRIM(CONCAT(u.nombre, ' ', COALESCE(u.apellido, ''))) AS persona,
        COALESCE(u.area, 'Sin área') AS area,
        COUNT(*) AS visitas,
        ROW_NUMBER() OVER (
          PARTITION BY v.id_servicio
          ORDER BY COUNT(*) DESC, u.id_usuario ASC
        ) AS posicion
      FROM visitas v
      INNER JOIN usuarios u ON u.id_usuario = v.id_usuario
      INNER JOIN servicios s ON s.id_servicio = v.id_servicio
      WHERE s.activo = TRUE
      GROUP BY v.id_servicio, s.nombre, u.id_usuario, u.nombre, u.apellido, u.area
    ) AS ranking_personas
    WHERE posicion <= 5
    ORDER BY servicio, posicion
  `;

  const porSemanaSql = `
    SELECT servicio, anio, semana, visitas
    FROM (
      SELECT
        CASE s.id_servicio
          WHEN 1 THEN 'Masajes'
          WHEN 2 THEN 'Rehabilitación'
          ELSE s.nombre
        END AS servicio,
        v.id_servicio,
        v.anio,
        v.semana,
        COUNT(*) AS visitas,
        ROW_NUMBER() OVER (
          PARTITION BY v.id_servicio
          ORDER BY COUNT(*) DESC, v.anio DESC, v.semana DESC
        ) AS posicion
      FROM visitas v
      INNER JOIN servicios s ON s.id_servicio = v.id_servicio
      WHERE s.activo = TRUE
      GROUP BY v.id_servicio, s.nombre, v.anio, v.semana
    ) AS ranking_semanas
    WHERE posicion <= 5
    ORDER BY servicio, posicion
  `;

  const porAreaSql = `
    SELECT servicio, area, visitas
    FROM (
      SELECT
        CASE s.id_servicio
          WHEN 1 THEN 'Masajes'
          WHEN 2 THEN 'Rehabilitación'
          ELSE s.nombre
        END AS servicio,
        v.id_servicio,
        COALESCE(u.area, 'Sin área') AS area,
        COUNT(*) AS visitas,
        ROW_NUMBER() OVER (
          PARTITION BY v.id_servicio
          ORDER BY COUNT(*) DESC, COALESCE(u.area, 'Sin área') ASC
        ) AS posicion
      FROM visitas v
      INNER JOIN usuarios u ON u.id_usuario = v.id_usuario
      INNER JOIN servicios s ON s.id_servicio = v.id_servicio
      WHERE s.activo = TRUE
      GROUP BY v.id_servicio, s.nombre, u.area
    ) AS ranking_areas
    WHERE posicion <= 5
    ORDER BY servicio, posicion
  `;

  db.query(porPersonaSql, (peopleError, porPersona) => {
    if (peopleError) {
      console.error('Error consultando top de visitantes:', peopleError);
      return res.status(500).json({ error: 'No se pudo consultar el top de visitantes' });
    }

    db.query(porSemanaSql, (weekError, porSemana) => {
      if (weekError) {
        console.error('Error consultando top de semanas:', weekError);
        return res.status(500).json({ error: 'No se pudo consultar el top de semanas' });
      }

      db.query(porAreaSql, (areaError, porArea) => {
        if (areaError) {
          console.error('Error consultando top de áreas:', areaError);
          return res.status(500).json({ error: 'No se pudo consultar el top de áreas' });
        }

        res.json({ porPersona, porSemana, porArea });
      });
    });
  });
});

app.post('/api/usuarios-servicios', (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  const apellido = String(req.body.apellido || '').trim();
  const correo = String(req.body.correo || '').trim();
  const telefono = String(req.body.telefono || '').trim();
  const anio = Number(req.body.anio);
  const semana = Number(req.body.semana);
  const servicios = Array.isArray(req.body.servicios)
    ? [...new Set(req.body.servicios.map(Number))]
    : [];

  if (
    !nombre ||
    nombre.length > 100 ||
    apellido.length > 100 ||
    correo.length > 150 ||
    telefono.length > 20 ||
    !Number.isInteger(anio) ||
    anio < 2000 ||
    !Number.isInteger(semana) ||
    semana < 1 ||
    semana > 53 ||
    servicios.some((id) => !Number.isInteger(id) || id < 1 || id > 2)
  ) {
    return res.status(400).json({ error: 'Los datos de la persona, año, semana y servicios no son válidos' });
  }

  db.beginTransaction((transactionError) => {
    if (transactionError) {
      console.error('Error iniciando registro de usuario:', transactionError);
      return res.status(500).json({ error: 'No se pudo iniciar el registro' });
    }

    db.query(
      'INSERT INTO usuarios (nombre, apellido, correo, telefono) VALUES (?, ?, ?, ?)',
      [nombre, apellido || null, correo || null, telefono || null],
      (userError, userResult) => {
        if (userError) {
          return db.rollback(() => {
            console.error('Error insertando usuario:', userError);
            res.status(500).json({ error: 'No se pudo agregar la persona' });
          });
        }

        if (servicios.length === 0) {
          return db.commit((commitError) => {
            if (commitError) {
              return db.rollback(() => res.status(500).json({ error: 'No se pudo guardar la persona' }));
            }
            res.status(201).json({ message: 'Persona agregada correctamente', id_usuario: userResult.insertId });
          });
        }

        const visitas = servicios.map((idServicio) => [
          userResult.insertId,
          idServicio,
          `${anio}-01-01 00:00:00`,
          anio,
          semana,
        ]);

        db.query(
          'INSERT INTO visitas (id_usuario, id_servicio, fecha_visita, anio, semana) VALUES ?',
          [visitas],
          (visitError) => {
            if (visitError) {
              return db.rollback(() => {
                console.error('Error insertando servicios de la persona:', visitError);
                res.status(500).json({ error: 'No se pudieron guardar los servicios de la persona' });
              });
            }

            db.commit((commitError) => {
              if (commitError) {
                return db.rollback(() => res.status(500).json({ error: 'No se pudo guardar la persona' }));
              }
              res.status(201).json({ message: 'Persona y servicios agregados correctamente', id_usuario: userResult.insertId });
            });
          },
        );
      },
    );
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