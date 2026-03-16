const express = require('express');
const router = express.Router();
const { login } = require('../controllers/general/generalController');
const { validateLogin  } = require('../middlewares/general/generalValidate');

// Route: /api/v1/data/login
router.post('/login', validateLogin , login);
 
module.exports = router;
