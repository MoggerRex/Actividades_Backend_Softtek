-- ============================================================
-- BASE DE DATOS: TIENDA_INVENTARIO
-- Inventario de productos + Registro de usuarios (con área/rol) y visitas a servicios
-- ============================================================


-- ============================================================
-- 0. CREACIÓN DE LA BASE DE DATOS
-- ============================================================
DROP DATABASE IF EXISTS tienda_inventario;
CREATE DATABASE tienda_inventario;
USE tienda_inventario;


-- ============================================================
-- PARTE 1: INVENTARIO DE PRODUCTOS
-- ============================================================

-- 1.1 Tabla de productos
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    descripcion TEXT,
    cantidad INT NOT NULL DEFAULT 0
);

-- 1.2 Tabla de alertas de stock (se llena sola vía trigger, ver 1.5)
CREATE TABLE alertas_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT,
    mensaje VARCHAR(255),
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- 1.3 Carga inicial de 30 productos
INSERT INTO productos (nombre, precio, descripcion, cantidad) VALUES
('Teclado Mecánico RGB', 850.00, 'Teclado gamer con switches azules y retroiluminación', 12),
('Mouse Inalámbrico Ergonómico', 350.00, 'Mouse óptico recargable de 2.4GHz', 8),
('Cable USB-C 2 metros', 85.00, 'Cable de carga rápida trenzado', 5),
('Memoria USB 32GB', 95.00, 'Unidad flash USB 3.0 metálica', 15),
('Monitor 24 Pulgadas Full HD', 2400.00, 'Panel IPS 75Hz con bordes delgados', 10),
('Pluma de Pintura Gouache', 45.00, 'Marcador acrílico punta fina', 30),
('Libreta de Dibujo A4', 120.00, 'Cuaderno de papel grueso de 160g', 9),
('Audífonos Bluetooth Over-Ear', 450.00, 'Cancelación de ruido pasiva y micrófono', 25),
('Adaptador HDMI a VGA', 75.00, 'Convertidor de video compacto', 8),
('Tapete para Mouse XL', 180.00, 'Mousepad antideslizante 80x30cm', 14),
('Disco Duro Externo 1TB', 1100.00, 'Almacenamiento portátil USB 3.0', 7),
('Hub USB 4 Puertos', 150.00, 'Multiplicador de puertos USB 2.0', 20),
('Limpiador de Pantallas Kit', 60.00, 'Spray 100ml con paño de microfibra', 40),
('Soporte para Laptop Aluminio', 280.00, 'Base elevadora ajustable y plegable', 11),
('Camiseta Negra Algodón', 199.00, 'Playera básica talla M', 6),
('Taza Cerámica 350ml', 80.00, 'Taza blanca apta para microondas', 12),
('Pasta Térmica para CPU', 130.00, 'Jeringa de 4g de alta conductividad', 15),
('Cable Red Ethernet Cat6 5m', 90.00, 'Cable UTP para red gigabit', 50),
('Lámpara LED de Escritorio', 320.00, 'Lámpara táctil con 3 niveles de brillo', 8),
('Mochila para Laptop 15"', 550.00, 'Mochila con compartimento acolchado', 18),
('Funda Impermeable Tablet', 110.00, 'Protector contra agua y caídas', 22),
('Organizador de Cables Velcro', 40.00, 'Tira de 5 metros recortable', 60),
('Protector de Pantalla Cristal', 70.00, 'Mica de cristal templado 9H', 15),
('Micrófono USB Condensador', 890.00, 'Micrófono para streaming con tripié', 5),
('Tarjeta MicroSD 128GB', 260.00, 'Tarjeta de memoria Clase 10 U3', 30),
('Batería Portátil 10000mAh', 390.00, 'Powerbank con doble salida USB', 10),
('Marcadores Permanentes (Pack 4)', 55.00, 'Colores surtidos secado rápido', 25),
('Cinta Adhesiva de Embalaje', 35.00, 'Rollo de cinta transparente 48mm', 80),
('Bocina Bluetooth Portátil', 480.00, 'Resistente al agua IPX5', 4),
('Teclado Numérico USB', 140.00, 'Teclado externo para laptop', 16);

-- 1.4 Vista: productos caros (>= $100) con stock crítico (<= 10)
CREATE VIEW vista_alertas_inventario AS
SELECT
    id,
    nombre,
    precio,
    cantidad AS stock_actual,
    '¡ALERTA! Reabastecer producto (Precio >= $100 y Stock <= 10)' AS aviso
FROM productos
WHERE precio >= 100.00 AND cantidad <= 10;

-- 1.5 Trigger: genera una alerta automática cuando el stock baja a 10 o menos
DELIMITER //
CREATE TRIGGER trigger_verificar_stock_bajo
AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
    IF NEW.precio >= 100.00 AND NEW.cantidad <= 10 THEN
        INSERT INTO alertas_stock (producto_id, mensaje)
        VALUES (
            NEW.id,
            CONCAT('AVISO: El producto "', NEW.nombre, '" (Precio: $', NEW.precio, ') tiene un stock crítico de ', NEW.cantidad, ' unidades.')
        );
    END IF;
END//
DELIMITER ;

-- 1.6 Procedimientos de productos
--     Coinciden EXACTAMENTE con los CALL que ya tiene tu server.js:
--     el orden de los parámetros es el mismo que mandas desde Node.

DELIMITER //

-- Usado en: app.post('/api/productos', ...)
--   db.query('CALL sp_insertar_producto(?, ?, ?, ?)', [nombre, precio, descripcion, cantidad], ...)
CREATE PROCEDURE sp_insertar_producto(
    IN p_nombre VARCHAR(100),
    IN p_precio DECIMAL(10, 2),
    IN p_descripcion TEXT,
    IN p_cantidad INT
)
BEGIN
    INSERT INTO productos (nombre, precio, descripcion, cantidad)
    VALUES (p_nombre, p_precio, p_descripcion, p_cantidad);
END //

-- Usado en: app.patch('/api/productos/:id/cantidad', ...)
--   db.query('CALL sp_actualizar_cantidad_producto(?, ?)', [id, cantidad], ...)
CREATE PROCEDURE sp_actualizar_cantidad_producto(
    IN p_id INT,
    IN p_nueva_cantidad INT
)
BEGIN
    UPDATE productos
    SET cantidad = p_nueva_cantidad
    WHERE id = p_id;
END //

-- Usado en: app.delete('/api/productos/:id', ...)
--   db.query('CALL sp_eliminar_producto(?)', [id], ...)
CREATE PROCEDURE sp_eliminar_producto(
    IN p_id INT
)
BEGIN
    DELETE FROM productos WHERE id = p_id;
END //

DELIMITER ;


-- ============================================================
-- PARTE 2: USUARIOS, SERVICIOS Y VISITAS
-- ============================================================

-- 2.1 Tabla de usuarios
--     Incluye area (departamento) y rol (puesto), que se
--     llenan en la Parte 3 después de cargar a los 200 usuarios.
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    correo VARCHAR(150),
    telefono VARCHAR(20),
    area VARCHAR(50),
    rol VARCHAR(100),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 Tabla de servicios (Masajes, Rehabilitación)
CREATE TABLE servicios (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE
);

-- 2.3 Tabla de visitas
--     anio y semana se guardan explícitamente en cada INSERT para
--     poder agrupar/filtrar reportes por semana sin recalcular nada.
--     El UNIQUE evita que un usuario registre el mismo servicio
--     dos veces en la misma semana.
CREATE TABLE visitas (
    id_visita INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_servicio INT NOT NULL,
    fecha_visita DATETIME DEFAULT CURRENT_TIMESTAMP,
    anio INT NOT NULL,
    semana INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio) ON DELETE CASCADE,
    UNIQUE (id_usuario, id_servicio, anio, semana)
);

-- 2.4 Carga de los 2 servicios
INSERT INTO servicios (nombre, descripcion) VALUES
('Masajes', 'Sesión de masajes terapéuticos'),
('Rehabilitación', 'Sesión de rehabilitación física');

-- 2.5 Procedimientos de usuarios y visitas
--     Estos son NUEVOS: hoy tu server.js hace el INSERT directo en la
--     ruta POST /api/usuarios-servicios. Aquí tienes el equivalente en
--     procedure; más abajo (comentario) te explico cómo cambiar el
--     server.js para usarlos en vez del INSERT directo.

DELIMITER //

CREATE PROCEDURE sp_agregar_usuario(
    IN p_nombre VARCHAR(100),
    IN p_apellido VARCHAR(100),
    IN p_correo VARCHAR(150),
    IN p_telefono VARCHAR(20),
    IN p_area VARCHAR(50),
    IN p_rol VARCHAR(100)
)
BEGIN
	INSERT INTO usuarios (nombre, apellido, correo, telefono, area, rol)
    VALUES (p_nombre, p_apellido, p_correo, p_telefono, p_area, p_rol);
    -- El id insertado se recupera después con SELECT LAST_INSERT_ID();
    -- (ver ejemplo de uso en el server.js más abajo)
END //

CREATE PROCEDURE sp_registrar_visita(
    IN p_id_usuario INT,
    IN p_id_servicio INT,
    IN p_fecha_visita DATETIME,
    IN p_anio INT,
    IN p_semana INT
)
BEGIN
    INSERT INTO visitas (id_usuario, id_servicio, fecha_visita, anio, semana)
    VALUES (p_id_usuario, p_id_servicio, p_fecha_visita, p_anio, p_semana);
END //

DELIMITER ;


-- ============================================================
-- PARTE 3: DATOS DE PRUEBA (200 usuarios + visitas de ejemplo)
-- ============================================================

-- 3.1 Primeros 50 usuarios (base)
INSERT INTO usuarios (nombre, apellido, correo, telefono) VALUES
('Luis', 'Hernández', 'luis.h@example.com', '5550000001'),
('Ana', 'García', 'ana.g@example.com', '5550000002'),
('Carlos', 'Martínez', 'carlos.m@example.com', '5550000003'),
('María', 'López', 'maria.l@example.com', '5550000004'),
('Pedro', 'Ramírez', 'pedro.r@example.com', '5550000005'),
('Sofía', 'Torres', 'sofia.t@example.com', '5550000006'),
('Jorge', 'Flores', 'jorge.f@example.com', '5550000007'),
('Lucía', 'Gómez', 'lucia.g@example.com', '5550000008'),
('Miguel', 'Díaz', 'miguel.d@example.com', '5550000009'),
('Elena', 'Cruz', 'elena.c@example.com', '5550000010'),
('Raúl', 'Reyes', 'raul.r@example.com', '5550000011'),
('Carmen', 'Morales', 'carmen.m@example.com', '5550000012'),
('Roberto', 'Ortiz', 'roberto.o@example.com', '5550000013'),
('Laura', 'Gutiérrez', 'laura.g@example.com', '5550000014'),
('Fernando', 'Chávez', 'fernando.c@example.com', '5550000015'),
('Daniela', 'Ruiz', 'daniela.r@example.com', '5550000016'),
('Alejandro', 'Álvarez', 'alejandro.a@example.com', '5550000017'),
('Valeria', 'Mendoza', 'valeria.m@example.com', '5550000018'),
('Diego', 'Castillo', 'diego.c@example.com', '5550000019'),
('Gabriela', 'Aguilar', 'gabriela.a@example.com', '5550000020'),
('Héctor', 'Romero', 'hector.r@example.com', '5550000021'),
('Teresa', 'Herrera', 'teresa.h@example.com', '5550000022'),
('Julio', 'Medina', 'julio.m@example.com', '5550000023'),
('Patricia', 'Vargas', 'patricia.v@example.com', '5550000024'),
('Arturo', 'Castro', 'arturo.c@example.com', '5550000025'),
('Rosa', 'Guzmán', 'rosa.g@example.com', '5550000026'),
('Ricardo', 'Fernández', 'ricardo.f@example.com', '5550000027'),
('Verónica', 'Juárez', 'veronica.j@example.com', '5550000028'),
('Andrés', 'Muñoz', 'andres.m@example.com', '5550000029'),
('Natalia', 'Salazar', 'natalia.s@example.com', '5550000030'),
('Oscar', 'Rojas', 'oscar.r@example.com', '5550000031'),
('Gloria', 'Pérez', 'gloria.p@example.com', '5550000032'),
('Mario', 'Soto', 'mario.s@example.com', '5550000033'),
('Mónica', 'Contreras', 'monica.c@example.com', '5550000034'),
('Javier', 'Silva', 'javier.s@example.com', '5550000035'),
('Adriana', 'Cervantes', 'adriana.c@example.com', '5550000036'),
('Hugo', 'Domínguez', 'hugo.d@example.com', '5550000037'),
('Claudia', 'Gallo', 'claudia.g@example.com', '5550000038'),
('Edgar', 'Velázquez', 'edgar.v@example.com', '5550000039'),
('Leticia', 'Navarro', 'leticia.n@example.com', '5550000040'),
('Martín', 'Escobar', 'martin.e@example.com', '5550000041'),
('Beatriz', 'Pineda', 'beatriz.p@example.com', '5550000042'),
('Víctor', 'Ramos', 'victor.r@example.com', '5550000043'),
('Margarita', 'Mejía', 'margarita.m@example.com', '5550000044'),
('Guillermo', 'Luna', 'guillermo.l@example.com', '5550000045'),
('Silvia', 'Campos', 'silvia.c@example.com', '5550000046'),
('Enrique', 'Pacheco', 'enrique.p@example.com', '5550000047'),
('Josefina', 'Vega', 'josefina.v@example.com', '5550000048'),
('Ramón', 'Valdez', 'ramon.v@example.com', '5550000049'),
('Isabel', 'Cabrera', 'isabel.c@example.com', '5550000050');

-- 3.2 Siguientes 150 usuarios, generados combinando nombres/apellidos
--     de los 50 base, hasta completar los 200
INSERT INTO usuarios (nombre, apellido, correo, telefono)
SELECT
    u1.nombre,
    u2.apellido,
    CONCAT(LOWER(u1.nombre), '.', LOWER(u2.apellido), u1.id_usuario, '@example.com'),
    CONCAT('5551', LPAD(u1.id_usuario * u2.id_usuario, 5, '0'))
FROM usuarios u1
JOIN usuarios u2 ON u1.id_usuario != u2.id_usuario
LIMIT 150;

-- 3.3 Asignar área y rol a los 200 usuarios (aleatorio pero coherente:
--     el rol siempre corresponde al área que le tocó a cada quien)
SET SQL_SAFE_UPDATES = 0;

-- Área aleatoria por usuario
UPDATE usuarios
SET area = ELT(FLOOR(1 + RAND() * 6), 'RH', 'IT', 'Marketing', 'Ventas', 'Finanzas', 'Operaciones');

-- Rol aleatorio, pero dentro de las opciones válidas para su área
UPDATE usuarios
SET rol = CASE area
    WHEN 'RH' THEN ELT(FLOOR(1 + RAND() * 4),
        'Reclutador', 'Generalista de RH', 'Coordinador de Nómina', 'Especialista en Capacitación')
    WHEN 'IT' THEN ELT(FLOOR(1 + RAND() * 4),
        'Desarrollador', 'Soporte Técnico', 'Administrador de Redes', 'Analista de Sistemas')
    WHEN 'Marketing' THEN ELT(FLOOR(1 + RAND() * 4),
        'Community Manager', 'Diseñador Gráfico', 'Analista de Marketing', 'Ejecutivo de Marca')
    WHEN 'Ventas' THEN ELT(FLOOR(1 + RAND() * 4),
        'Ejecutivo de Ventas', 'Representante Comercial', 'Coordinador de Cuentas', 'Gerente de Ventas')
    WHEN 'Finanzas' THEN ELT(FLOOR(1 + RAND() * 4),
        'Contador', 'Analista Financiero', 'Auxiliar Contable', 'Tesorero')
    WHEN 'Operaciones' THEN ELT(FLOOR(1 + RAND() * 4),
        'Supervisor de Operaciones', 'Analista de Procesos', 'Coordinador Logístico', 'Jefe de Planta')
END;

SET SQL_SAFE_UPDATES = 1;

-- 3.4 Visitas de ejemplo para la Semana 38, 2026

-- Usuarios que usaron AMBOS servicios
INSERT INTO visitas (id_usuario, id_servicio, fecha_visita, anio, semana) VALUES
(1, 1, '2026-09-14 10:00:00', 2026, 38), (1, 2, '2026-09-15 11:00:00', 2026, 38),
(4, 1, '2026-09-16 10:00:00', 2026, 38), (4, 2, '2026-09-17 10:00:00', 2026, 38),
(10, 1, '2026-09-14 09:00:00', 2026, 38), (10, 2, '2026-09-18 14:00:00', 2026, 38),
(15, 1, '2026-09-15 12:00:00', 2026, 38), (15, 2, '2026-09-16 12:00:00', 2026, 38),
(25, 1, '2026-09-14 08:30:00', 2026, 38), (25, 2, '2026-09-18 16:30:00', 2026, 38),
(40, 1, '2026-09-15 11:15:00', 2026, 38), (40, 2, '2026-09-17 11:15:00', 2026, 38),
(55, 1, '2026-09-14 13:00:00', 2026, 38), (55, 2, '2026-09-15 15:00:00', 2026, 38),
(70, 1, '2026-09-16 09:45:00', 2026, 38), (70, 2, '2026-09-17 09:45:00', 2026, 38),
(85, 1, '2026-09-14 10:30:00', 2026, 38), (85, 2, '2026-09-16 10:30:00', 2026, 38),
(100, 1, '2026-09-15 14:20:00', 2026, 38), (100, 2, '2026-09-18 14:20:00', 2026, 38);

-- Usuarios que usaron SOLO Masajes (servicio 1)
INSERT INTO visitas (id_usuario, id_servicio, fecha_visita, anio, semana) VALUES
(2, 1, '2026-09-15 09:00:00', 2026, 38),
(5, 1, '2026-09-14 11:00:00', 2026, 38),
(8, 1, '2026-09-16 14:00:00', 2026, 38),
(12, 1, '2026-09-17 10:30:00', 2026, 38),
(18, 1, '2026-09-18 15:00:00', 2026, 38),
(22, 1, '2026-09-14 08:00:00', 2026, 38),
(30, 1, '2026-09-15 12:45:00', 2026, 38),
(45, 1, '2026-09-16 09:15:00', 2026, 38),
(60, 1, '2026-09-17 16:20:00', 2026, 38),
(90, 1, '2026-09-18 11:10:00', 2026, 38);

-- Usuarios que usaron SOLO Rehabilitación (servicio 2)
INSERT INTO visitas (id_usuario, id_servicio, fecha_visita, anio, semana) VALUES
(3, 2, '2026-09-16 13:00:00', 2026, 38),
(6, 2, '2026-09-14 15:30:00', 2026, 38),
(9, 2, '2026-09-15 08:45:00', 2026, 38),
(14, 2, '2026-09-17 12:00:00', 2026, 38),
(20, 2, '2026-09-18 09:30:00', 2026, 38),
(28, 2, '2026-09-14 14:15:00', 2026, 38),
(35, 2, '2026-09-15 10:50:00', 2026, 38),
(50, 2, '2026-09-16 15:40:00', 2026, 38),
(75, 2, '2026-09-17 13:25:00', 2026, 38),
(120, 2, '2026-09-18 08:15:00', 2026, 38);

-- ============================================================
-- PARTE 4: SECCION DE CLIENTES
-- ============================================================
-- Tabla de pedidos --

CREATE TABLE pedidos (
    id_pedidos INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    monto_total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE VIEW metricas_de_clientes AS
SELECT 
    u.id_usuario,
    u.nombre,
    u.apellido,
    COUNT(p.id_pedidos) AS total_compras,
    COALESCE(SUM(p.monto_total), 0) AS total_gasto,
    MAX(p.fecha_pedido) AS ultima_fecha_pedido,
    COUNT(CASE
		WHEN p.fecha_pedido >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
		THEN 1
    END) AS pedidos_ultimos_90_dias,
    
    COUNT(CASE
		WHEN p.fecha_pedido >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
		THEN 1
    END) AS pedidos_mes_actual,
    
    COUNT(CASE
		WHEN p.fecha_pedido >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
		AND p.fecha_pedido < DATE_FORMAT(CURDATE(), '%Y-%m-01')
		THEN 1
    END) AS pedidos_mes_anterior
FROM usuarios u
LEFT JOIN pedidos p ON u.id_usuario = p.id_usuario
GROUP BY u.id_usuario, u.nombre, u.apellido;

CREATE VIEW estatus_clientes AS
SELECT
id_usuario,
nombre,
apellido,
total_gasto,
total_compras,
ultima_fecha_pedido,
CASE         
	-- Regla 1: Cliente En Riesgo
	WHEN pedidos_ultimos_90_dias = 0 
		and total_gasto <= 5000
		THEN 'Cliente en riesgo'

	WHEN pedidos_ultimos_90_dias >= 10 
		and total_gasto >= 15000 
		and pedidos_mes_actual >= 4 
		and pedidos_mes_anterior >= 4
		THEN 'Cliente alto nivel'

	ELSE 'Cliente normal'
END AS tipo_cliente
FROM metricas_de_clientes;


-- ============================================================
-- PARTE 5: PRUEBA DEL TRIGGER
-- ============================================================

-- Baja el stock del producto 1 a 8 piezas.
-- Como su precio es >= $100, dispara el trigger y crea un registro
-- en alertas_stock automáticamente.
UPDATE productos SET cantidad = 8 WHERE id = 1;



-- ============================================================
-- PARTE 6: EJEMPLOS DE CÓMO SE MANDAN A LLAMAR LOS PROCEDURES
-- ============================================================

-- Productos (ya los usa tu server.js tal cual)
-- CALL sp_insertar_producto('Silla Gamer', 3200.00, 'Silla reclinable', 15);
-- CALL sp_actualizar_cantidad_producto(1, 20);
-- CALL sp_eliminar_producto(31);

-- Usuarios y visitas (nuevos, ver nota debajo sobre el server.js)
-- CALL sp_agregar_usuario('Pepe', 'Pérez', 'pepe@correo.com', '8110000000');
-- SELECT LAST_INSERT_ID() AS id_usuario;  -- Recupera el id recién creado
-- CALL sp_registrar_visita(1, 1, '2026-09-20 10:00:00', 2026, 38);


-- ============================================================
-- PARTE 7: CONSULTAS (todo lo que puedes ir a ver, junto aquí)
-- ============================================================

-- ============================================================
-- 1. USUARIO 1: CLIENTE DE ALTO NIVEL (id_usuario = 1)
-- Cumple:
-- - 10 pedidos en los últimos 90 días (agosto y septiembre 2026)
-- - Total gastado: $18,000 (>= $15,000)
-- - 5 pedidos en agosto y 5 en septiembre (mínimo 4 por mes)
-- ============================================================
INSERT INTO pedidos (id_usuario, fecha_pedido, monto_total) VALUES
(5, '2026-08-02 10:00:00', 1800.00),
(5, '2026-08-08 14:30:00', 1800.00),
(5, '2026-08-15 11:15:00', 1800.00),
(5, '2026-08-20 16:45:00', 1800.00),
(5, '2026-08-28 09:20:00', 1800.00),
(5, '2026-09-02 12:00:00', 1800.00),
(5, '2026-09-06 15:10:00', 1800.00),
(5, '2026-09-10 10:05:00', 1800.00),
(5, '2026-09-14 17:30:00', 1800.00),
(5, '2026-09-18 13:40:00', 1800.00),
(5, '2026-09-18 15:40:00', 1800.00);


-- ============================================================
-- 2. USUARIO 2: CLIENTE NORMAL (id_usuario = 2)
-- Cumple:
-- - Tiene actividad en los últimos 90 días (no es En Riesgo)
-- - Total gastado: $8,000 (no alcanza el mínimo de $15,000 de Alto Nivel)
-- ============================================================
INSERT INTO pedidos (id_usuario, fecha_pedido, monto_total) VALUES
(2, '2026-08-05 09:00:00', 800.00),
(2, '2026-08-12 11:30:00', 800.00),
(2, '2026-08-19 14:15:00', 800.00),
(2, '2026-08-25 16:00:00', 800.00),
(2, '2026-09-01 10:20:00', 800.00),
(2, '2026-09-05 12:45:00', 800.00),
(2, '2026-09-09 15:10:00', 800.00),
(2, '2026-09-12 11:00:00', 800.00),
(2, '2026-09-16 13:30:00', 800.00),
(2, '2026-09-20 17:00:00', 800.00);

-- ============================================================
-- 3. USUARIO 3: CLIENTE EN RIESGO (id_usuario = 3)
-- Cumple:
-- - Sin pedidos en los últimos 90 días (su último pedido fue en mayo 2026)
-- - Total gastado: $3,500 (< $5,000)
-- ============================================================
INSERT INTO pedidos (id_usuario, fecha_pedido, monto_total) VALUES
(3, '2026-01-15 10:00:00', 350.00),
(3, '2026-02-03 12:30:00', 350.00),
(3, '2026-02-20 15:00:00', 350.00),
(3, '2026-03-08 11:15:00', 350.00),
(3, '2026-03-22 14:40:00', 350.00),
(3, '2026-04-05 09:50:00', 350.00),
(3, '2026-04-18 16:20:00', 350.00),
(3, '2026-05-02 10:10:00', 350.00),
(3, '2026-05-12 13:00:00', 350.00),
(3, '2026-05-20 17:15:00', 350.00);

-- ---------- Inventario ----------
SELECT * FROM productos;                  -- Todos los productos
SELECT * FROM alertas_stock;              -- Alertas generadas por el trigger
SELECT * FROM vista_alertas_inventario;   -- Vista: productos caros con stock crítico

-- ---------- Usuarios y servicios ----------
SELECT * FROM usuarios;                          -- Los 200 usuarios (con área y rol)
SELECT COUNT(*) AS total_usuarios FROM usuarios;  -- Verificar que sí sean 200
SELECT area, COUNT(*) AS total FROM usuarios GROUP BY area;  -- Cuántos usuarios por área
SELECT * FROM servicios;                          -- Los servicios disponibles (Masajes, Rehabilitación)
SELECT * FROM visitas;                            -- Todas las visitas registradas
SELECT * FROM pedidos;

SELECT * FROM metricas_de_clientes;

SELECT * FROM estatus_clientes;

SELECT * FROM estatus_clientes WHERE tipo_cliente = 'Cliente alto nivel' ORDER BY total_gasto DESC, total_compras DESC;
SELECT * FROM estatus_clientes WHERE tipo_cliente = 'Cliente en riesgo'ORDER BY total_gasto ASC, total_compras ASC;
SELECT * FROM estatus_clientes WHERE tipo_cliente = 'Cliente normal';

SELECT tipo_cliente Tipo, 
COUNT(*) AS cantidad_tipo_cliente,
(COUNT(*) * 100.00) / (SELECT COUNT(*) FROM estatus_clientes) AS porcentaje_tipo_cliente
FROM estatus_clientes
GROUP BY  tipo_cliente;

select * from pedidos;


USE tienda_inventario;

-- ============================================================
-- INSERT DE PEDIDOS PARA 200 USUARIOS
-- ============================================================
-- Usuarios 1-75:   Clientes de alto nivel
-- Usuarios 76-165: Clientes normales
-- Usuarios 166-200: Clientes en riesgo
--
-- Las fechas se calculan respecto al día en que ejecutes
-- este script.
-- ============================================================

INSERT INTO pedidos (
    id_usuario,
    fecha_pedido,
    monto_total
)

SELECT

    u.id_usuario,

    -- ========================================================
    -- FECHA DEL PEDIDO
    -- ========================================================

    TIMESTAMP(

        CASE

            -- CLIENTES EN RIESGO
            -- Pedidos realizados hace más de 90 días.

            WHEN u.id_usuario BETWEEN 166 AND 200 THEN

                DATE_SUB(
                    CURDATE(),
                    INTERVAL (
                        110 + MOD(
                            u.id_usuario * 11 + n.num * 19,
                            160
                        )
                    ) DAY
                )


            -- CLIENTES DE ALTO NIVEL Y NORMALES
            -- Se distribuyen entre el mes actual
            -- y el mes anterior.

            WHEN MOD(n.num, 2) = 0 THEN

                -- Mes anterior

                DATE_SUB(
                    DATE_FORMAT(CURDATE(), '%Y-%m-01'),
                    INTERVAL (
                        1 + MOD(
                            u.id_usuario * 7 + n.num * 3,
                            26
                        )
                    ) DAY
                )

            ELSE

                -- Mes actual

                DATE_SUB(
                    CURDATE(),
                    INTERVAL MOD(
                        u.id_usuario * 7 + n.num * 3,
                        DAY(CURDATE())
                    ) DAY
                )

        END,

        -- Hora variable para cada pedido.

        MAKETIME(
            9 + MOD(u.id_usuario + n.num, 10),
            MOD(u.id_usuario * 7 + n.num * 13, 60),
            0
        )

    ) AS fecha_pedido,


    -- ========================================================
    -- MONTO TOTAL DEL PEDIDO
    -- ========================================================

    CASE

        -- CLIENTES DE ALTO NIVEL
        -- Pedidos entre $1,750 y $3,249.

        WHEN u.id_usuario BETWEEN 1 AND 75 THEN

            1750 + MOD(
                u.id_usuario * 137 + n.num * 293,
                1500
            )


        -- CLIENTES NORMALES
        -- Pedidos entre $250 y $1,699.

        WHEN u.id_usuario BETWEEN 76 AND 165 THEN

            250 + MOD(
                u.id_usuario * 173 + n.num * 251,
                1450
            )


        -- CLIENTES EN RIESGO
        -- Pedidos entre $100 y $899.

        ELSE

            100 + MOD(
                u.id_usuario * 47 + n.num * 89,
                800
            )

    END AS monto_total


-- ============================================================
-- OBTENER LOS 200 USUARIOS EXISTENTES
-- ============================================================

FROM usuarios u


-- ============================================================
-- GENERADOR DE NÚMEROS DEL 1 AL 14
-- Cada número representa un pedido distinto.
-- ============================================================

CROSS JOIN (

    SELECT 1 AS num
    UNION ALL SELECT 2
    UNION ALL SELECT 3
    UNION ALL SELECT 4
    UNION ALL SELECT 5
    UNION ALL SELECT 6
    UNION ALL SELECT 7
    UNION ALL SELECT 8
    UNION ALL SELECT 9
    UNION ALL SELECT 10
    UNION ALL SELECT 11
    UNION ALL SELECT 12
    UNION ALL SELECT 13
    UNION ALL SELECT 14

) AS n


-- ============================================================
-- CANTIDAD DE PEDIDOS POR USUARIO
-- ============================================================

WHERE

    (
        -- CLIENTES DE ALTO NIVEL
        -- Cada usuario tendrá entre 10 y 14 pedidos.

        u.id_usuario BETWEEN 1 AND 75

        AND n.num <= (
            10 + MOD(u.id_usuario * 3, 5)
        )
    )

    OR

    (
        -- CLIENTES NORMALES
        -- Cada usuario tendrá entre 2 y 8 pedidos.

        u.id_usuario BETWEEN 76 AND 165

        AND n.num <= (
            2 + MOD(u.id_usuario * 3, 7)
        )
    )

    OR

    (
        -- CLIENTES EN RIESGO
        -- Cada usuario tendrá entre 1 y 3 pedidos.

        u.id_usuario BETWEEN 166 AND 200

        AND n.num <= (
            1 + MOD(u.id_usuario * 5, 3)
        )
    );