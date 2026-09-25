const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// CONEXIÓN GENERAL A MYSQL
// ============================================================
// Este objeto es la conexión que comparten todos los endpoints del servidor.
// Lee las variables DB_* cuando existen y, para desarrollo local, usa los
// mismos valores definidos por el proyecto: localhost:3306/tienda_inventario.
// El puerto 3001 se usa después para la API de Express; no es el puerto de MySQL.
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'tienda_inventario',
  port: Number(process.env.DB_PORT) || 3306,
});

// Primero se comprueba que MySQL esté disponible. La API comienza a escuchar
// peticiones únicamente después de que esta conexión se complete correctamente.
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

// ============================================================
// PRODUCTOS - Consultas (SELECT directo y uso de VISTA)
// ============================================================

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
  // Aprovecha la vista creada en el script de SQL
  const sql = 'SELECT * FROM vista_alertas_inventario ORDER BY id ASC';

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error consultando productos en alerta:', err);
      return res.status(500).json({ error: 'Error al consultar alertas' });
    }
    res.json(result);
  });
});

app.get('/api/alertas-stock', (req, res) => {
  const sql = `
    SELECT
      a.id,
      a.producto_id,
      p.nombre AS producto,
      a.mensaje,
      a.fecha_alerta
    FROM alertas_stock a
    LEFT JOIN productos p ON p.id = a.producto_id
    ORDER BY a.fecha_alerta DESC, a.id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error consultando el historial de alertas:', err);
      return res.status(500).json({ error: 'Error al consultar el historial de alertas' });
    }

    res.json(result);
  });
});

// ============================================================
// PRODUCTOS - Insertar, actualizar cantidad y eliminar
// Usa sp_insertar_producto, sp_actualizar_cantidad_producto y sp_eliminar_producto
// ============================================================

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

// ============================================================
// SERVICIOS - Reportes y estadísticas
// ============================================================

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
      id_usuario,
      TRIM(CONCAT(nombre, ' ', COALESCE(apellido, ''))) AS persona,
      correo,
      telefono,
      COALESCE(lista_servicios, 'Ningún servicio') AS servicios
    FROM personas_servicios
    ORDER BY id_usuario
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

      db.query(personasSql, (peopleError, peopleRows) => {
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

// ============================================================
// CLIENTES - Métricas y clasificación comercial
// Las tres clasificaciones se leen desde las nuevas vistas del SQL:
// cliente_alto_nivel, cliente_normal y cliente_riesgo.
// ============================================================

app.get('/api/clientes-resumen', (req, res) => {
  // PASO 1: UNION ALL reúne las tres vistas sin volver a escribir en Node las
  // reglas de clasificación. Cada vista ya contiene únicamente los clientes
  // que le corresponden según las reglas declaradas en Tienda_Inventario.sql.
  //
  // PASO 2: metricas_de_clientes complementa las columnas mensuales que las
  // tres vistas de clasificación no exponen.
  //
  // PASO 3: usuarios aporta correo y teléfono. Este JOIN es solo informativo;
  // no modifica el estatus ni las métricas calculadas por las vistas.
  const clientesSql = `
    SELECT
      c.id_usuario,
      TRIM(CONCAT(c.nombre, ' ', COALESCE(c.apellido, ''))) AS nombre,
      u.correo,
      u.telefono,
      c.total_gasto AS total_gastado,
      c.total_compras AS total_pedidos,
      c.ultima_fecha_pedido AS ultimo_pedido,
      m.pedidos_ultimos_90_dias,
      m.pedidos_mes_actual,
      m.pedidos_mes_anterior,
      c.tipo_cliente AS estatus
    FROM (
      SELECT * FROM cliente_alto_nivel
      UNION ALL
      SELECT * FROM cliente_normal
      UNION ALL
      SELECT * FROM cliente_riesgo
    ) AS c
    INNER JOIN metricas_de_clientes m ON m.id_usuario = c.id_usuario
    LEFT JOIN usuarios u ON u.id_usuario = c.id_usuario
    ORDER BY c.id_usuario ASC
  `;

  // db.query envía el SELECT a MySQL mediante la conexión creada al inicio.
  // "clientes" contiene el resultado final que consumirá CustomersPage.jsx.
  db.query(clientesSql, (clientsError, clientes) => {
    if (clientsError) {
      console.error('Error consultando clientes:', clientsError);
      return res.status(500).json({ error: 'No se pudieron consultar las vistas de clientes' });
    }

    // La gráfica solo necesita contar cuántas filas devolvió cada estatus.
    // La clasificación en sí ya llegó resuelta desde las tres vistas SQL.
    const distribucion = Object.entries(
      clientes.reduce((totals, cliente) => {
        totals[cliente.estatus] = (totals[cliente.estatus] || 0) + 1;
        return totals;
      }, {}),
    ).map(([categoria, total]) => ({ categoria, total }));

    // Las dos tarjetas destacadas se eligen de las filas ya clasificadas.
    // No se cambia el tipo de cliente: únicamente se ordena cada categoría.
    const mejorCliente = clientes
      .filter((cliente) => cliente.estatus === 'Cliente alto nivel')
      .sort((a, b) => Number(b.total_gastado) - Number(a.total_gastado)
        || Number(b.total_pedidos) - Number(a.total_pedidos))[0] || null;

    const clienteEnRiesgo = clientes
      .filter((cliente) => cliente.estatus === 'Cliente en riesgo')
      .sort((a, b) => Number(a.total_gastado) - Number(b.total_gastado)
        || Number(a.total_pedidos) - Number(b.total_pedidos))[0] || null;

    // Esta es la estructura JSON recibida por GET /api/clientes-resumen en el
    // front: tabla completa, datos de la gráfica y dos tarjetas destacadas.
    res.json({ clientes, distribucion, mejorCliente, clienteEnRiesgo });
  });
});

// ============================================================
// SERVICIOS - Registrar persona + sus visitas
// Usa sp_agregar_usuario (6 parámetros) y sp_registrar_visita
// ============================================================

app.post('/api/usuarios-servicios', (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  const apellido = String(req.body.apellido || '').trim();
  const correo = String(req.body.correo || '').trim();
  const telefono = String(req.body.telefono || '').trim();
  const area = String(req.body.area || '').trim();
  const rol = String(req.body.rol || '').trim();
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
    area.length > 50 ||
    rol.length > 100 ||
    !Number.isInteger(anio) ||
    anio < 2000 ||
    !Number.isInteger(semana) ||
    semana < 1 ||
    semana > 53 ||
    servicios.some((id) => !Number.isInteger(id) || id < 1 || id > 2)
  ) {
    return res.status(400).json({ error: 'Los datos de la persona, área, rol, año, semana o servicios no son válidos' });
  }

  db.beginTransaction((transactionError) => {
    if (transactionError) {
      console.error('Error iniciando registro de usuario:', transactionError);
      return res.status(500).json({ error: 'No se pudo iniciar el registro' });
    }

    // Llamada corregida a sp_agregar_usuario con los 6 parámetros definidos en SQL
    db.query(
      'CALL sp_agregar_usuario(?, ?, ?, ?, ?, ?)',
      [
        nombre,
        apellido || null,
        correo || null,
        telefono || null,
        area || null,
        rol || null,
      ],
      (userError) => {
        if (userError) {
          return db.rollback(() => {
            console.error('Error insertando usuario:', userError);
            res.status(500).json({ error: 'No se pudo agregar la persona' });
          });
        }

        db.query('SELECT LAST_INSERT_ID() AS id_usuario', (idError, idResult) => {
          if (idError) {
            return db.rollback(() => {
              console.error('Error obteniendo id de usuario:', idError);
              res.status(500).json({ error: 'No se pudo agregar la persona' });
            });
          }

          const idUsuario = idResult[0].id_usuario;

          if (servicios.length === 0) {
            return db.commit((commitError) => {
              if (commitError) {
                return db.rollback(() => res.status(500).json({ error: 'No se pudo guardar la persona' }));
              }
              res.status(201).json({ message: 'Persona agregada correctamente', id_usuario: idUsuario });
            });
          }

          let pendientes = servicios.length;
          let huboError = false;

          servicios.forEach((idServicio) => {
            db.query(
              'CALL sp_registrar_visita(?, ?, NOW(), ?, ?)',
              [idUsuario, idServicio, anio, semana],
              (visitError) => {
                if (huboError) return;

                if (visitError) {
                  huboError = true;
                  return db.rollback(() => {
                    console.error('Error insertando servicios de la persona:', visitError);
                    res.status(500).json({ error: 'No se pudieron guardar los servicios de la persona' });
                  });
                }

                pendientes -= 1;
                if (pendientes === 0) {
                  db.commit((commitError) => {
                    if (commitError) {
                      return db.rollback(() => res.status(500).json({ error: 'No se pudo guardar la persona' }));
                    }
                    res.status(201).json({
                      message: 'Persona y servicios agregados correctamente',
                      id_usuario: idUsuario,
                    });
                  });
                }
              },
            );
          });
        });
      },
    );
  });
});
