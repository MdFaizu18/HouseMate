const express = require('express');
const router = express.Router();

const {
  createExpense,
  getExpenses,
  getMonthlySummary,
  settleExpense,
  deleteExpense,
} = require('../controllers/expenseController');

const { protect, requireHouse } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.use(protect, requireHouse);

router.get('/summary', getMonthlySummary);

router.route('/')
  .get(getExpenses)
  .post(validate(schemas.createExpense), createExpense);

router.post('/:id/settle', settleExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
