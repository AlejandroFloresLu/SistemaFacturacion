const express    = require('express');
const router     = express.Router();
const rateLimit  = require('express-rate-limit');
const ctrl       = require('../controllers/authController');

// Máximo 10 intentos de login por IP cada 15 minutos
const loginLimiter = rateLimit({
    windowMs:         15 * 60 * 1000, // 15 minutos
    max:              10,
    standardHeaders:  true,
    legacyHeaders:    false,
    message: {
        ok:      false,
        message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.'
    },
});

router.post('/login', loginLimiter, ctrl.login);

module.exports = router;
