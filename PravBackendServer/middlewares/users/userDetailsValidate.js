// Validate login input
const validateUserDetailsReuests = (req, res, next) => {
  const { sAuthToken } = req.body;

  if (!sAuthToken || typeof sAuthToken !== 'string') {
    return res.status(400).json({ success: false, message: 'User Auth not found, please try again' });
  } 

  next(); // input is valid
};

module.exports = { validateUserDetailsReuests };
