/**
 * authController.js — Lógica de autenticación
 * Valida usuario/contraseña contra la tabla `usuarios` en PostgreSQL.
 * Firma y devuelve un JWT en el login exitoso.
 */
const pool    = require('../config/db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Responde con { ok, token, user } o error 401/403.
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

        // Firmar JWT con datos mínimos del usuario (expira en 8 horas)
        const payload = {
            id:       user.id_usuario,
            username: user.username,
            rol:      user.nombre_rol,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        return res.json({
            ok: true,
            token,
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
