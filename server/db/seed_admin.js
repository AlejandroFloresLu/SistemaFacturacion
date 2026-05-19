const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function seedAdmin() {
    try {
        console.log('Iniciando creación de usuario admin...');
        
        // 1. Verificar si el admin ya existe
        const checkResult = await pool.query("SELECT * FROM usuarios WHERE username = 'admin'");
        if (checkResult.rows.length > 0) {
            console.log('El usuario admin ya existe en la base de datos.');
            process.exit(0);
        }

        // 2. Encriptar contraseña '1234'
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('1234', salt);

        // 3. Buscar el id_rol para "Administrador" (asumimos que ya se insertó con el schema.sql)
        const roleResult = await pool.query("SELECT id_rol FROM roles WHERE nombre_rol = 'Administrador'");
        if (roleResult.rows.length === 0) {
            throw new Error("El rol 'Administrador' no se encontró. Ejecuta schema.sql primero.");
        }
        const idRol = roleResult.rows[0].id_rol;

        // 4. Insertar en la tabla usuarios
        const insertQuery = `
            INSERT INTO usuarios (username, password_hash, id_rol, estado) 
            VALUES ($1, $2, $3, true) RETURNING id_usuario
        `;
        const result = await pool.query(insertQuery, ['admin', hash, idRol]);

        console.log(`✅ Usuario 'admin' creado exitosamente con id: ${result.rows[0].id_usuario}`);
    } catch (error) {
        console.error('Error al crear usuario admin:', error.message);
    } finally {
        pool.end();
    }
}

seedAdmin();
