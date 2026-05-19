/**
 * authController.js — Lógica de autenticación
 * Valida usuario/contraseña contra la tabla `usuarios` en PostgreSQL.
 */
const pool    = require('../config/db');
const bcrypt  = require('bcryptjs');

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Responde con { ok, user } o error 401.
 */
async function login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ ok: false, message: 'Usuario y contraseña requeridos.' });
    }

    try {
        const result = await pool.query(
            `SELECT u.id_usuario, u.username, u.password_hash, u.estado, r.nombre_rol
             FROM usuarios u
             JOIN roles r ON u.id_rol = r.id_rol
             WHERE u.username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ ok: false, message: 'Usuario o contraseña incorrectos.' });
        }

        const user = result.rows[0];

        if (!user.estado) {
            return res.status(403).json({ ok: false, message: 'Cuenta deshabilitada.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ ok: false, message: 'Usuario o contraseña incorrectos.' });
        }

        // Respuesta exitosa (sin JWT por ahora, compatible con sessionStorage)
        return res.json({
            ok: true,
            user: {
                id:       user.id_usuario,
                username: user.username,
                rol:      user.nombre_rol,
            }
        });
    } catch (err) {
        console.error('[authController.login]', err);
        return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
    }
}

module.exports = { login };
