const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/productosController');
const verifyToken  = require('../middleware/verifyToken');

// Todas las rutas de productos requieren autenticación
router.use(verifyToken);

router.get   ('/',         ctrl.getAll);
router.get   ('/buscar',   ctrl.buscar);
router.post  ('/',         ctrl.create);
router.put   ('/:id',      ctrl.update);
router.delete('/:id',      ctrl.remove);

module.exports = router;
