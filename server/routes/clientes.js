const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/clientesController');
const verifyToken  = require('../middleware/verifyToken');

// Todas las rutas de clientes requieren autenticación
router.use(verifyToken);

router.get   ('/',         ctrl.getAll);
router.get   ('/buscar',   ctrl.buscarPorRuc);
router.post  ('/',         ctrl.create);
router.put   ('/:id',      ctrl.update);
router.delete('/:id',      ctrl.remove);

module.exports = router;
