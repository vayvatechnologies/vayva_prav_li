const fetchCalenderEventsByDateValidate = (req, res, next) => {
  const { sAuthToken , startDateTime,endDateTime} = req.body;
  if (!sAuthToken || typeof sAuthToken !== 'string') {
    return res.status(400).json({ success: false, message: 'User auth expired. Please login again' });
  } 
  next(); // input is valid
};

const saveCalendarEventValidate = (req, res, next) => {
  const {  sAuthToken, id, flagname, title, description, status,
      priority_type, priority_text, label, notes, start_date, end_date} = req.body;
  if (!sAuthToken || typeof sAuthToken !== 'string') {
    return res.status(400).json({ success: false, message: 'User auth expired. Please login again' });
  } 
  next(); // input is
  //  valid
};
const deleteCalenderEventsByIDValidate = (req, res, next) => {
  const { sAuthToken, ids, type } = req.body;

  if (!sAuthToken) {
    return sendError(res, "Auth token is required", 400, "VALIDATION_ERROR");
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return sendError(res, "ids must be a non-empty array", 400, "VALIDATION_ERROR");
  }

  if (!type) {
    return sendError(res, "Type (flagname) is required", 400, "VALIDATION_ERROR");
  }

  // Ensure all ids are numbers
  const invalidId = ids.find(id => isNaN(id));
  if (invalidId) {
    return sendError(res, "Invalid id in ids array", 400, "VALIDATION_ERROR");
  }

  next();
};


module.exports = { fetchCalenderEventsByDateValidate,saveCalendarEventValidate,deleteCalenderEventsByIDValidate};
