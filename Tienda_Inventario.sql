-- ============================================================
-- BASE DE DATOS: TIENDA + REGISTRO DE VISITAS
-- ============================================================

-- 1. Creación de la base de datos limpia
DROP DATABASE IF EXISTS tienda_inventario;
CREATE DATABASE tienda_inventario;
USE tienda_inventario;

-- ============================================================
-- PARTE 1: INVENTARIO
-- ============================================================

CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    descripcion TEXT,
    cantidad INT NOT NULL DEFAULT 0
);

CREATE TABLE alertas_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT,
    mensaje VARCHAR(255),
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

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

CREATE VIEW vista_alertas_inventario AS
SELECT 
    id,
    nombre,
    precio,
    cantidad AS stock_actual,
    '¡ALERTA! Reabastecer producto (Precio >= $100 y Stock <= 10)' AS aviso
FROM productos
WHERE precio >= 100.00 AND cantidad <= 10;

DELIMITER //
CREATE TRIGGER trigger_verificar_stock_bajo
AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
    IF NEW.precio >= 100.00 AND NEW.cantidad <= 10 THEN
        INSERT INTO alertas_stock (producto_id, mensaje)
        VALUES (NEW.id, CONCAT('AVISO: El producto "', NEW.nombre, '" (Precio: $', NEW.precio, ') tiene un stock crítico de ', NEW.cantidad, ' unidades.'));
    END IF;
END//
DELIMITER ;

-- ============================================================
-- PARTE 2: REGISTRO DE USUARIOS Y VISITAS
-- ============================================================

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

CREATE TABLE servicios (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE visitas (
    id_visita INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_servicio INT NOT NULL,
    fecha_visita DATETIME DEFAULT CURRENT_TIMESTAMP,
    anio INT NOT NULL,
    semana INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio) ON DELETE CASCADE,
    
    -- CONDICIÓN: Evita que el mismo usuario registre el mismo servicio 2 veces en la misma semana
    UNIQUE (id_usuario, id_servicio, anio, semana)
);

INSERT INTO servicios (nombre, descripcion) VALUES
('Masajes', 'Sesión de masajes terapéuticos'),
('Rehabilitación', 'Sesión de rehabilitación física');

UPDATE servicios
SET nombre = CASE id_servicio
    WHEN 1 THEN 'Masajes'
    WHEN 2 THEN 'Rehabilitación'
END,
descripcion = CASE id_servicio
    WHEN 1 THEN 'Sesión de masajes terapéuticos'
    WHEN 2 THEN 'Sesión de rehabilitación física'
END
WHERE id_servicio IN (1, 2);

-- ============================================================
-- PARTE 3: DATOS DE PRUEBA (200 USUARIOS REALES Y ESTÁTICOS)
-- ============================================================

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

-- Generamos los siguientes 150 combinando los mismos nombres y apellidos base de los primeros 50 para completar los 200
INSERT INTO usuarios (nombre, apellido, correo, telefono)
SELECT 
    u1.nombre, 
    u2.apellido, 
    CONCAT(LOWER(u1.nombre), '.', LOWER(u2.apellido), u1.id_usuario, '@example.com'), 
    CONCAT('5551', LPAD(u1.id_usuario * u2.id_usuario, 5, '0'))
FROM usuarios u1
JOIN usuarios u2 ON u1.id_usuario != u2.id_usuario
LIMIT 150;

-- Asigna un área/rol de trabajo aleatoria a los 200 trabajadores
UPDATE usuarios
SET area = ELT(FLOOR(1 + RAND() * 6), 'RH', 'IT', 'Marketing', 'Ventas', 'Finanzas', 'Operaciones');

-- Asigna un puesto coherente con el área de cada trabajador
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

-- Registros de Visitas para la Semana 38, 2026 (Datos estáticos y directos)
INSERT INTO visitas (id_usuario, id_servicio, fecha_visita, anio, semana) VALUES
-- Usuarios que usaron AMBOS servicios
(1, 1, '2026-09-14 10:00:00', 2026, 38), (1, 2, '2026-09-15 11:00:00', 2026, 38),
(4, 1, '2026-09-16 10:00:00', 2026, 38), (4, 2, '2026-09-17 10:00:00', 2026, 38),
(10, 1, '2026-09-14 09:00:00', 2026, 38), (10, 2, '2026-09-18 14:00:00', 2026, 38),
(15, 1, '2026-09-15 12:00:00', 2026, 38), (15, 2, '2026-09-16 12:00:00', 2026, 38),
(25, 1, '2026-09-14 08:30:00', 2026, 38), (25, 2, '2026-09-18 16:30:00', 2026, 38),
(40, 1, '2026-09-15 11:15:00', 2026, 38), (40, 2, '2026-09-17 11:15:00', 2026, 38),
(55, 1, '2026-09-14 13:00:00', 2026, 38), (55, 2, '2026-09-15 15:00:00', 2026, 38),
(70, 1, '2026-09-16 09:45:00', 2026, 38), (70, 2, '2026-09-17 09:45:00', 2026, 38),
(85, 1, '2026-09-14 10:30:00', 2026, 38), (85, 2, '2026-09-16 10:30:00', 2026, 38),
(100, 1, '2026-09-15 14:20:00', 2026, 38), (100, 2, '2026-09-18 14:20:00', 2026, 38),

-- Usuarios que usaron SOLO Masajes (1)
(2, 1, '2026-09-15 09:00:00', 2026, 38),
(5, 1, '2026-09-14 11:00:00', 2026, 38),
(8, 1, '2026-09-16 14:00:00', 2026, 38),
(12, 1, '2026-09-17 10:30:00', 2026, 38),
(18, 1, '2026-09-18 15:00:00', 2026, 38),
(22, 1, '2026-09-14 08:00:00', 2026, 38),
(30, 1, '2026-09-15 12:45:00', 2026, 38),
(45, 1, '2026-09-16 09:15:00', 2026, 38),
(60, 1, '2026-09-17 16:20:00', 2026, 38),
(90, 1, '2026-09-18 11:10:00', 2026, 38),

-- Usuarios que usaron SOLO Rehabilitación (2)
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
-- PARTE 4: CONSULTAS (PRUEBA FINAL)
-- ============================================================

-- Comprobar si el trigger funciona restando piezas al ID 1
UPDATE productos SET cantidad = 8 WHERE id = 1;

-- Verificar productos
SELECT * FROM productos;