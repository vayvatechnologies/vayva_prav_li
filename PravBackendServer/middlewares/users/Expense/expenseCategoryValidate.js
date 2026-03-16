// Validate login input
const { sendSuccess, sendError } = require('../../../utils/responseHelper');
const db = require('../../../utils/db');

const getExpenseCategoriesByCategoryandSubcategoryValidation = (req, res, next) => {
    const { sAuthToken, category,subCategory } = req.body;


  if (!sAuthToken || typeof sAuthToken !== 'string') {
    return sendError(res, "Auth token is required", 400, "AUTH_REQUIRED");
  } 
  if (!category || category.trim() === "") {
    return sendError(res, "Category is mandatory", 400, "VALIDATION_ERROR");
  }

  if (!subCategory || subCategory.trim() === "") {
    return sendError(res, "Sub Category is mandatory", 400, "VALIDATION_ERROR");
  }

  next(); // input is valid
};


const validateExpenseCategoryRequests = async (req, res, next) => {
    const { sAuthToken, oFromDate, oToDate } = req.body;


  if (!sAuthToken || typeof sAuthToken !== 'string') {
    return res.status(400).json({ success: false, message: 'User auth expired. Please login again' });
  } 
 // 2. Check if auth exists in users table
    const authQuery = `
      SELECT user_id, auth_token_expires_at 
      FROM prav_ai_users 
      WHERE auth_token = $1
    `;

    const authResult = await db.query(authQuery, [sAuthToken]);
    const user = authResult.rows[0];
 // 3. Check auth expiry
    const now = new Date();
    if (new Date(user.auth_token_expires_at) < now || authResult.rows.length === 0) {
      return sendError(res, "User auth expired. Please login again", 401, "AUTH_EXPIRED");
    } 


   

  next(); // input is valid
};

// Validate login input
const getCreateExpenseCategoryValidateRequests = (req, res, next) => {
    const { sAuthToken, categoryID } = req.body;


  if (!sAuthToken || typeof sAuthToken !== 'string') {
    return res.status(400).json({ success: false, message: 'User auth expired. Please login again' });
  } 

  next(); // input is valid
};

// Validate login input
const insertExpenseCategoryValidateRequests = (req, res, next) => {
   
            

  const { sAuthToken,expenseCategories, recurringDates,recurringDeleteDates} = req.body;
 
  if (!expenseCategories) {
    return sendError(res, "Expense categories data is missing", 400, "INVALID_REQUEST");
  }

  const c = expenseCategories;
  const warnings = [];

  // HARD VALIDATIONS
  if (!c.category || c.category.trim() === "") {
    return sendError(res, "Category is mandatory", 400, "VALIDATION_ERROR");
  }

  if (!c.subcategory || c.subcategory.trim() === "") {
    return sendError(res, "Sub Category is mandatory", 400, "VALIDATION_ERROR");
  }

  if (!c.payment_mode) {
    return sendError(res, "Payment Mode is mandatory", 400, "VALIDATION_ERROR");
  }

  // WARNING VALIDATIONS (not stopping, just logging)
  if (!c.spend_limit_month) {
    warnings.push("Spend Limit is empty.");
  }

  // Attach warnings to request for further use
  req.warnings = warnings;

  next();
};

// validations/expenseCategory.validation.js
const deleteExpenseCategoryValidation = (req, res, next) => {
  const { sAuthToken, expenseCategoryId } = req.body;

  if (!sAuthToken) {
    return sendError(res, "Auth token is required", 400, "AUTH_REQUIRED");
  }

  if (!expenseCategoryId) {
    return sendError(res, "Expense Category ID is required", 400, "CATEGORY_ID_REQUIRED");
  }

  next();
};

module.exports = { getExpenseCategoriesByCategoryandSubcategoryValidation,validateExpenseCategoryRequests ,getCreateExpenseCategoryValidateRequests,insertExpenseCategoryValidateRequests,deleteExpenseCategoryValidation};
