const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

const marker = '-- DASHBOARD: REGISTRO DE USUARIOS Y VISITAS';
const schemaPath = path.resolve(__dirname, '..', 'Tienda_Inventario.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
const markerIndex = schema.indexOf(marker);

if (markerIndex === -1) {
  throw new Error('No se encontró la sección SQL del Dashboard');
}

const sectionStart = schema.lastIndexOf('-- ============================================================', markerIndex);
const dashboardMigration = schema.slice(sectionStart);

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'tienda_inventario',
  port: Number(process.env.DB_PORT) || 3306,
  multipleStatements: true,
});

connection.query(dashboardMigration, (error) => {
  if (error) {
    console.error('No se pudo aplicar la migración del Dashboard:', error.message);
    process.exitCode = 1;
  } else {
    console.log('Migración del Dashboard aplicada correctamente.');
  }

  connection.end();
});
