-- ==========================================================
-- 1. Creación de la base de datos
-- ==========================================================
CREATE DATABASE IF NOT EXISTS tienda_inventario;
USE tienda_inventario;

-- ==========================================================
-- 2. Tabla de categorías (normalizada)
-- ==========================================================
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO categorias (nombre) VALUES
('Periférico'),
('Almacenamiento'),
('Audio'),
('Accesorio'),
('Papelería'),
('Componentes'),
('Redes'),
('Hogar'),
('Ropa'),
('Limpieza'),
('Oficina'),
('Sin categoría');

-- ==========================================================
-- 3. Tabla de productos (ya con categoria_id desde el inicio)
-- ==========================================================
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria_id INT DEFAULT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    descripcion TEXT,
    cantidad INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON DELETE SET NULL
);

-- ==========================================================
-- 4. Tabla de alertas de stock
-- ==========================================================
CREATE TABLE IF NOT EXISTS alertas_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT,
    mensaje VARCHAR(255),
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- ==========================================================
-- 5. Inserción de los 30 productos, ya con su categoria_id
--    (usamos subconsultas a categorias para no adivinar IDs a mano)
-- ==========================================================
INSERT INTO productos (nombre, categoria_id, precio, descripcion, cantidad) VALUES
('Teclado Mecánico RGB', (SELECT id FROM categorias WHERE nombre = 'Periférico'), 850.00, 'Teclado gamer con switches azules y retroiluminación', 12),
('Mouse Inalámbrico Ergonómico', (SELECT id FROM categorias WHERE nombre = 'Periférico'), 350.00, 'Mouse óptico recargable de 2.4GHz', 8), -- Alerta
('Cable USB-C 2 metros', (SELECT id FROM categorias WHERE nombre = 'Accesorio'), 85.00, 'Cable de carga rápida trenzado', 5), -- No alerta (<100)
('Memoria USB 32GB', (SELECT id FROM categorias WHERE nombre = 'Almacenamiento'), 95.00, 'Unidad flash USB 3.0 metálica', 15),
('Monitor 24 Pulgadas Full HD', (SELECT id FROM categorias WHERE nombre = 'Periférico'), 2400.00, 'Panel IPS 75Hz con bordes delgados', 10), -- Alerta
('Pluma de Pintura Gouache', (SELECT id FROM categorias WHERE nombre = 'Papelería'), 45.00, 'Marcador acrílico punta fina', 30),
('Libreta de Dibujo A4', (SELECT id FROM categorias WHERE nombre = 'Papelería'), 120.00, 'Cuaderno de papel grueso de 160g', 9), -- Alerta
('Audífonos Bluetooth Over-Ear', (SELECT id FROM categorias WHERE nombre = 'Audio'), 450.00, 'Cancelación de ruido pasiva y micrófono', 25),
('Adaptador HDMI a VGA', (SELECT id FROM categorias WHERE nombre = 'Accesorio'), 75.00, 'Convertidor de video compacto', 8),
('Tapete para Mouse XL', (SELECT id FROM categorias WHERE nombre = 'Accesorio'), 180.00, 'Mousepad antideslizante 80x30cm', 14),
('Disco Duro Externo 1TB', (SELECT id FROM categorias WHERE nombre = 'Almacenamiento'), 1100.00, 'Almacenamiento portátil USB 3.0', 7), -- Alerta
('Hub USB 4 Puertos', (SELECT id FROM categorias WHERE nombre = 'Accesorio'), 150.00, 'Multiplicador de puertos USB 2.0', 20),
('Limpiador de Pantallas Kit', (SELECT id FROM categorias WHERE nombre = 'Limpieza'), 60.00, 'Spray 100ml con paño de microfibra', 40),
('Soporte para Laptop Aluminio', (SELECT id FROM categorias WHERE nombre = 'Accesorio'), 280.00, 'Base elevadora ajustable y plegable', 11),
('Camiseta Negra Algodón', (SELECT id FROM categorias WHERE nombre = 'Ropa'), 199.00, 'Playera básica talla M', 6), -- Alerta
('Taza Cerámica 350ml', (SELECT id FROM categorias WHERE nombre = 'Hogar'), 80.00, 'Taza blanca apta para microondas', 12),
('Pasta Térmica para CPU', (SELECT id FROM categorias WHERE nombre = 'Componentes'), 130.00, 'Jeringa de 4g de alta conductividad', 15),
('Cable Red Ethernet Cat6 5m', (SELECT id FROM categorias WHERE nombre = 'Redes'), 90.00, 'Cable UTP para red gigabit', 50),
('Lámpara LED de Escritorio', (SELECT id FROM categorias WHERE nombre = 'Hogar'), 320.00, 'Lámpara táctil con 3 niveles de brillo', 8), -- Alerta
('Mochila para Laptop 15"', (SELECT id FROM categorias WHERE nombre = 'Accesorio'), 550.00, 'Mochila con compartimento acolchado', 18),
('Funda Impermeable Tablet', (SELECT id FROM categorias WHERE nombre = 'Accesorio'), 110.00, 'Protector contra agua y caídas', 22),
('Organizador de Cables Velcro', (SELECT id FROM categorias WHERE nombre = 'Accesorio'), 40.00, 'Tira de 5 metros recortable', 60),
('Protector de Pantalla Cristal', (SELECT id FROM categorias WHERE nombre = 'Accesorio'), 70.00, 'Mica de cristal templado 9H', 15),
('Micrófono USB Condensador', (SELECT id FROM categorias WHERE nombre = 'Audio'), 890.00, 'Micrófono para streaming con tripié', 5), -- Alerta
('Tarjeta MicroSD 128GB', (SELECT id FROM categorias WHERE nombre = 'Almacenamiento'), 260.00, 'Tarjeta de memoria Clase 10 U3', 30),
('Batería Portátil 10000mAh', (SELECT id FROM categorias WHERE nombre = 'Accesorio'), 390.00, 'Powerbank con doble salida USB', 10), -- Alerta
('Marcadores Permanentes (Pack 4)', (SELECT id FROM categorias WHERE nombre = 'Papelería'), 55.00, 'Colores surtidos secado rápido', 25),
('Cinta Adhesiva de Embalaje', (SELECT id FROM categorias WHERE nombre = 'Oficina'), 35.00, 'Rollo de cinta transparente 48mm', 80),
('Bocina Bluetooth Portátil', (SELECT id FROM categorias WHERE nombre = 'Audio'), 480.00, 'Resistente al agua IPX5', 4), -- Alerta
('Teclado Numérico USB', (SELECT id FROM categorias WHERE nombre = 'Periférico'), 140.00, 'Teclado externo para laptop', 16);

-- ==========================================================
-- 6. VISTAS (ahora muestran también el nombre de la categoría)
-- ==========================================================

-- Productos caros (>= $100) con stock crítico (<= 10)
CREATE VIEW vista_alertas_inventario AS
SELECT
    p.id,
    p.nombre,
    c.nombre AS categoria,
    p.precio,
    p.cantidad AS stock_actual,
    '¡ALERTA! Reabastecer producto (Precio >= $100 y Stock <= 10)' AS aviso
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.precio >= 100.00 AND p.cantidad <= 10;

-- Productos caros (>= $100) con stock saludable (>= 11)
CREATE VIEW vista_cantidades_inventario AS
SELECT
    p.id,
    p.nombre,
    c.nombre AS categoria,
    p.precio,
    p.cantidad AS stock_actual,
    'Stock saludable (Precio >= $100 y Stock >= 11)' AS aviso
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.precio >= 100.00 AND p.cantidad >= 11;

-- Vista extra: todo el inventario agrupado por categoría
CREATE VIEW vista_productos_por_categoria AS
SELECT
    c.nombre AS categoria,
    p.id,
    p.nombre,
    p.precio,
    p.cantidad
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
ORDER BY c.nombre, p.nombre;

-- ==========================================================
-- 7. TRIGGER: aviso automático de stock bajo
-- ==========================================================
DELIMITER //
CREATE TRIGGER trigger_verificar_stock_bajo
AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
    IF NEW.precio >= 100.00 AND NEW.cantidad <= 10 THEN
        INSERT INTO alertas_stock (producto_id, mensaje)
        VALUES (
            NEW.id,
            CONCAT('AVISO: El producto "', NEW.nombre, '" (Price: $', NEW.precio, ') tiene un stock crítico de ', NEW.cantidad, ' unidades.')
        );
    END IF;
END//
DELIMITER ;

-- ==========================================================
-- 8. PROCEDIMIENTOS ALMACENADOS
-- ==========================================================

-- 8.1. Insertar un nuevo producto (ahora recibe categoria_id)
DELIMITER //
CREATE PROCEDURE sp_insertar_producto(
    IN p_nombre VARCHAR(100),
    IN p_categoria_id INT,
    IN p_precio DECIMAL(10, 2),
    IN p_descripcion TEXT,
    IN p_cantidad INT
)
BEGIN
    INSERT INTO productos (nombre, categoria_id, precio, descripcion, cantidad)
    VALUES (p_nombre, p_categoria_id, p_precio, p_descripcion, p_cantidad);
END //
DELIMITER ;

-- 8.2. Eliminar un producto por su ID (sin cambios)
DELIMITER //
CREATE PROCEDURE sp_eliminar_producto(
    IN p_id INT
)
BEGIN
    DELETE FROM productos
    WHERE id = p_id;
END //
DELIMITER ;

-- 8.3. Actualizar el stock/cantidad de un producto por su ID (sin cambios)
DELIMITER //
CREATE PROCEDURE sp_actualizar_cantidad_producto(
    IN p_id INT,
    IN p_nueva_cantidad INT
)
BEGIN
    UPDATE productos
    SET cantidad = p_nueva_cantidad
    WHERE id = p_id;
END //
DELIMITER ;

-- 8.4. Agregar una categoría nueva, sin duplicar si ya existe
DELIMITER //
CREATE PROCEDURE sp_agregar_categoria(
    IN p_nombre VARCHAR(50)
)
BEGIN
    INSERT INTO categorias (nombre)
    SELECT p_nombre
    WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = p_nombre);
END //
DELIMITER ;

-- ==========================================================
-- 9. Pruebas / uso del sistema
-- ==========================================================

-- Ver categorías disponibles
SELECT * FROM categorias;

-- Ver inventario completo con categoría
SELECT * FROM vista_productos_por_categoria;

-- Ver alertas y stock saludable
SELECT * FROM vista_alertas_inventario;
SELECT * FROM vista_cantidades_inventario;

-- Establecemos la cantidad a 1 pieza (dispara el trigger de alerta)
UPDATE productos SET cantidad = 1 WHERE id = 1;

-- Revisamos el registro de alertas
SELECT * FROM alertas_stock;

-- Revisamos todos los productos
SELECT * FROM productos;

-- 1. Insertar un producto nuevo con categoría (ej. 'Periférico')
CALL sp_insertar_producto(
    'Silla Gamer Ergonómica',
    (SELECT id FROM categorias WHERE nombre = 'Hogar'),
    3200.00,
    'Silla reclinable con soporte lumbar',
    15
);

-- 2. Actualizar la cantidad del producto con ID 31 a 5 piezas
-- (Al ser precio >= $100 y cantidad <= 10, activará automáticamente el Trigger de alertas)
CALL sp_actualizar_cantidad_producto(31, 5);

-- 3. Eliminar el producto con ID 31
CALL sp_eliminar_producto(31);

-- 4. Agregar una categoría nueva
CALL sp_agregar_categoria('Laptops');

-- Verificamos los cambios finales
SELECT * FROM productos;
SELECT * FROM alertas_stock;
SELECT * FROM categorias;