const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/facturasController');

router.get('/ultimo-codigo', ctrl.ultimoCodigo);
router.get('/',              ctrl.getAll);
router.get('/:id',           ctrl.getById);
router.post('/',             ctrl.create);
router.put('/:id/anular',    ctrl.anular);

module.exports = router;
