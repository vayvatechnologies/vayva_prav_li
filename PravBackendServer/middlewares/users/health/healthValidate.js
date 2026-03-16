// Validate login input
const saveHealthDetailValidate = (req, res, next) => {
  const { sAuthToken,date,water,sleep,steps } = req.body;
  if (!sAuthToken || typeof sAuthToken !== 'string') {
    return res.status(400).json({ success: false, message: 'User auth expired. Please login again' });
  } 
  next(); // input is valid
};
const fetchHealthDetailRequestValidate = (req, res, next) => {
  const { sAuthToken } = req.body;
  if (!sAuthToken || typeof sAuthToken !== 'string') {
    return res.status(400).json({ success: false, message: 'User auth expired. Please login again' });
  } 
  next(); // input is valid
};
const fetchHealthDetailbyDateRequestValidate = (req, res, next) => {
  const { sAuthToken,date } = req.body;
  if (!sAuthToken || typeof sAuthToken !== 'string') {
    return res.status(400).json({ success: false, message: 'User auth expired. Please login again' });
  } 
  if (!date || date===null) {
    return res.status(400).json({ success: false, message: 'Date Value Missing.' });
  } 
  next(); // input is valid
};
const deleteHealthDetailRequestValidate = (req, res, next) => {
  const { sAuthToken,id } = req.body;
  if (!sAuthToken || typeof sAuthToken !== 'string') {
    return res.status(400).json({ success: false, message: 'User auth expired. Please login again' });
  } 
  if (!id || id===null) {
    return res.status(400).json({ success: false, message: 'Delete ID Value Missing.' });
  } 
  next(); // input is valid
};
//  saveHealthDetailValidate,fetchHealthDetailRequestValidate,
module.exports = { saveHealthDetailValidate,fetchHealthDetailbyDateRequestValidate,fetchHealthDetailRequestValidate,deleteHealthDetailRequestValidate};
