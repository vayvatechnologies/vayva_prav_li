const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const { login ,signupOrUpdateUser,createUser} = require('../controllers/auth/authController');
const { validateLogin,validateSaveUser,validateCreateUser  } = require('../middlewares/auth/authValidate');

// Route: /api/v1/data/login
router.post('/login', validateLogin , login);
router.post('/saveUser', validateSaveUser , signupOrUpdateUser);
// router.post('/CreateUser', validateCreateUser , createUser);

router.post('/CreateUser', upload.single('paymentScreenshot'), validateCreateUser, createUser); 
 
// POST   /api/v1/auth/register
// POST   /api/v1/auth/login
// POST   /api/v1/auth/logout
// POST   /api/v1/auth/refresh-token
// POST   /api/v1/auth/forgot-password
// POST   /api/v1/auth/reset-password
// GET    /api/v1/auth/me
module.exports = router;
