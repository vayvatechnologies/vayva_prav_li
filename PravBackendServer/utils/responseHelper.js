const sendSuccess = (res, message, data = {}, status = 200) => {
  return res.status(status).json({
    status: "Success",
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

const sendError = (res, message, status = 400, errorcode = "BAD_REQUEST") => {
  return res.status(status).json({
    status: "Error",
    message,
    errorcode,
    timestamp: new Date().toISOString()
  });
};

module.exports = { sendSuccess, sendError };

 