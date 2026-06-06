const express = require('express');
const router = express.Router();

const {
  createItem,
  getInventory,
  updateItem,
  requestRefill,
  deleteItem,
  getAlerts,
} = require('../controllers/inventoryController');

const { protect, requireHouse } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.use(protect, requireHouse);

router.get('/alerts', getAlerts);

router.route('/')
  .get(getInventory)
  .post(validate(schemas.createInventory), createItem);

router.route('/:id')
  .put(updateItem)
  .delete(deleteItem);

router.post('/:id/refill', requestRefill);

module.exports = router;
