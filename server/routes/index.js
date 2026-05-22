/**
 * routes/index.js — Registro central de todas las rutas de la API
 *
 * Importar aquí y montar en server.js con:
 *   app.use('/api', require('./server/routes'));
 */
'use strict';

const router = require('express').Router();

router.use('/auth',         require('./auth'));
router.use('/clientes',     require('./clientes'));
router.use('/productos',    require('./productos'));
router.use('/facturas',     require('./facturas'));
router.use('/carga',        require('./cargaMasiva'));
router.use('/metodos-pago', require('./metodosPago'));

module.exports = router;
