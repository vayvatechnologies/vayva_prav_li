// saveUserNotificationsValidate.js

const saveUserNotificationsValidate = (req, res, next) => {
  const { sAuthToken } = req.body;

  if (!sAuthToken || typeof sAuthToken !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'User auth expired. Please login again'
    });
  }

  next(); // input is valid
};
module.exports = {saveUserNotificationsValidate};
