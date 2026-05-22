/**
 * routes/metodosPago.js — Rutas de Métodos de Pago
 */
'use strict';

const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/metodosPagoController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/', ctrl.getAll);

module.exports = router;
