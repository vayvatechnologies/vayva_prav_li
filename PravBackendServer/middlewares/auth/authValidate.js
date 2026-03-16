// Validate login input
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  next(); // input is valid
};
const validateSaveUser = (req, res, next) => {
  const {
    id,
    firstname,
    lastname,
    initial,
    mobilenumber,
    email,
    password,
    status,
    isadmin,
    isSignup
  } = req.body;

  if (typeof isSignup !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isSignup must be true or false"
    });
  }

  // SIGNUP VALIDATION
  if (isSignup === true) {

    if (!firstname || typeof firstname !== "string") {
      return res.status(400).json({
        success: false,
        message: "Firstname is required"
      });
    }

    if (!mobilenumber || typeof mobilenumber !== "string") {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required"
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password is required"
      });
    }
  }

  // UPDATE VALIDATION
  if (isSignup === false) {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required for update"
      });
    }
  }

  // OPTIONAL FIELD VALIDATIONS
  if (email && typeof email !== "string") {
    return res.status(400).json({
      success: false,
      message: "Email must be a string"
    });
  }

  if (!status && status !== "") {
    return res.status(400).json({
      success: false,
      message: "Status must be required"
    });
  }

  if (isadmin && typeof isadmin !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isadmin must be boolean"
    });
  }

  next();
};

const validateCreateUser = (req, res, next) => {
  //console.log(req.body)
  const { 
      firstname,
      lastname,
      initial,
      mobilenumber,
      password,
      email,
      userplan,
      subscription_type,
      subscription_amount,
      payment_datetime,
      status
  } = req.body;
 
    if (!mobilenumber || typeof mobilenumber !== "string") {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required"
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password is required"
      });
    }
   
 

  next();
};

module.exports = { validateLogin ,validateSaveUser,validateCreateUser}; 
