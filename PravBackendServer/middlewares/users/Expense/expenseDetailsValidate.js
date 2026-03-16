// Validate login input
const validateExpenseDetailsReuests = (req, res, next) => {
    const { sAuthToken, oFromDate, oToDate } = req.body;


  if (!sAuthToken || typeof sAuthToken !== 'string') {
    return res.status(400).json({ success: false, message: 'User auth expired. Please login again' });
  } 

  next(); // input is valid
};

// Validate login input
const getCreateExpenseValidateRequests = (req, res, next) => {
    const { sAuthToken, expenseId } = req.body;


  if (!sAuthToken || typeof sAuthToken !== 'string') {
    return res.status(400).json({ success: false, message: 'User auth expired. Please login again' });
  } 

  next(); // input is valid
};
const saveExpenseSpendValidateRequests = (req, res, next) => {
    const { sAuthToken, expenseDetail } = req.body;


  if (!sAuthToken || typeof sAuthToken !== 'string') {
    return res.status(400).json({ success: false, message: 'User auth expired. Please login again' });
  } 

  next(); // input is valid
};
module.exports = { validateExpenseDetailsReuests ,getCreateExpenseValidateRequests,saveExpenseSpendValidateRequests};
