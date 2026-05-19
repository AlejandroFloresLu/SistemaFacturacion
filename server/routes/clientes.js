const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/clientesController');

router.get   ('/',         ctrl.getAll);
router.get   ('/buscar',   ctrl.buscarPorRuc);
router.post  ('/',         ctrl.create);
router.put   ('/:id',      ctrl.update);
router.delete('/:id',      ctrl.remove);

module.exports = router;
