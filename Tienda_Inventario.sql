-- 1. Creación de la base de datos
CREATE DATABASE IF NOT EXISTS tienda_inventario;
USE tienda_inventario;

-- 2. Creación de la tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    descripcion TEXT,
    cantidad INT NOT NULL DEFAULT 0
);

-- 3. Tabla para registrar los avisos/alertas de stock bajo
CREATE TABLE IF NOT EXISTS alertas_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT,
    mensaje VARCHAR(255),
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- 4. Inserción de 30 productos diferentes
INSERT INTO productos (nombre, precio, descripcion, cantidad) VALUES
('Teclado Mecánico RGB', 850.00, 'Teclado gamer con switches azules y retroiluminación', 12),
('Mouse Inalámbrico Ergonómico', 350.00, 'Mouse óptico recargable de 2.4GHz', 8), -- Alerta (>=100 y <=10)
('Cable USB-C 2 metros', 85.00, 'Cable de carga rápida trenzado', 5), -- No alerta (<100)
('Memoria USB 32GB', 95.00, 'Unidad flash USB 3.0 metálica', 15),
('Monitor 24 Pulgadas Full HD', 2400.00, 'Panel IPS 75Hz con bordes delgados', 10), -- Alerta (>=100 y <=10)
('Pluma de Pintura Gouache', 45.00, 'Marcador acrílico punta fina', 30),
('Libreta de Dibujo A4', 120.00, 'Cuaderno de papel grueso de 160g', 9), -- Alerta (>=100 y <=10)
('Audífonos Bluetooth Over-Ear', 450.00, 'Cancelación de ruido pasiva y micrófono', 25),
('Adaptador HDMI a VGA', 75.00, 'Convertidor de video compacto', 8),
('Tapete para Mouse XL', 180.00, 'Mousepad antideslizante 80x30cm', 14),
('Disco Duro Externo 1TB', 1100.00, 'Almacenamiento portátil USB 3.0', 7), -- Alerta (>=100 y <=10)
('Hub USB 4 Puertos', 150.00, 'Multiplicador de puertos USB 2.0', 20),
('Limpiador de Pantallas Kit', 60.00, 'Spray 100ml con paño de microfibra', 40),
('Soporte para Laptop Aluminio', 280.00, 'Base elevadora ajustable y plegable', 11),
('Camiseta Negra Algodón', 199.00, 'Playera básica talla M', 6), -- Alerta (>=100 y <=10)
('Taza Cerámica 350ml', 80.00, 'Taza blanca apta para microondas', 12),
('Pasta Térmica para CPU', 130.00, 'Jeringa de 4g de alta conductividad', 15),
('Cable Red Ethernet Cat6 5m', 90.00, 'Cable UTP para red gigabit', 50),
('Lámpara LED de Escritorio', 320.00, 'Lámpara táctil con 3 niveles de brillo', 8), -- Alerta (>=100 y <=10)
('Mochila para Laptop 15"', 550.00, 'Mochila con compartimento acolchado', 18),
('Funda Impermeable Tablet', 110.00, 'Protector contra agua y caídas', 22),
('Organizador de Cables Velcro', 40.00, 'Tira de 5 metros recortable', 60),
('Protector de Pantalla Cristal', 70.00, 'Mica de cristal templado 9H', 15),
('Micrófono USB Condensador', 890.00, 'Micrófono para streaming con tripié', 5), -- Alerta (>=100 y <=10)
('Tarjeta MicroSD 128GB', 260.00, 'Tarjeta de memoria Clase 10 U3', 30),
('Batería Portátil 10000mAh', 390.00, 'Powerbank con doble salida USB', 10), -- Alerta (>=100 y <=10)
('Marcadores Permanentes (Pack 4)', 55.00, 'Colores surtidos secado rápido', 25),
('Cinta Adhesiva de Embalaje', 35.00, 'Rollo de cinta transparente 48mm', 80),
('Bocina Bluetooth Portátil', 480.00, 'Resistente al agua IPX5', 4), -- Alerta (>=100 y <=10)
('Teclado Numérico USB', 140.00, 'Teclado externo para laptop', 16);

-- 5. VISTA: Muestra los productos de 100 pesos o más cerca de agotarse (<= 10)
CREATE VIEW vista_alertas_inventario AS
SELECT 
    id, 
    nombre, 
    precio, 
    cantidad AS stock_actual,
    '¡ALERTA! Reabastecer producto (Precio >= $100 y Stock <= 10)' AS aviso
FROM productos
WHERE precio >= 100.00 AND cantidad <= 10;

-- 6. TRIGGER: Genera un aviso automático en la tabla 'alertas_stock' si al actualizar el stock cae a 10 o menos
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

-- Ver mi inventario
SELECT * FROM vista_alertas_inventario;

-- Establecemos la cantidad a n piezas
UPDATE productos SET cantidad = 8 WHERE id = 1;

-- Revisamos el registro de alertas
SELECT * FROM alertas_stock;

-- Revisamos todos los productos
SELECT * FROM productos;

-- 1. Insertar un producto nuevo (ID se asigna solo) nombre, precio, descripccion, cantidad
CALL sp_insertar_producto('Silla Gamer Ergonómica', 3200.00, 'Silla reclinable con soporte lumbar', 15);

-- 2. Actualizar la cantidad del producto con ID 1 a 5 piezas
-- (Al ser precio >= $100 y cantidad <= 10, activará automáticamente el Trigger de alertas)
CALL sp_actualizar_cantidad_producto(31, 5);

-- 3. Eliminar el producto con ID n
CALL sp_eliminar_producto(31);

-- Verificamos los cambios
SELECT * FROM productos;
SELECT * FROM alertas_stock;
