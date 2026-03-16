const { sendSuccess, sendError } = require('../../../utils/responseHelper');
const db = require('../../../utils/db');

const { checkUserAuthToken,fnGetExpenseType, fnGetCycleTypes, fnGetExpenseMood, fnGetPaymentStatus, fnGetPaymentMode } = require('../../general/generalController');
const { insertReminder,getReminderByParentId,deleteReminderbyTypeAndParentId,deleteReminderbyIds} = require('../../users/Expense/ReminderController');

// Helper Function
const toIntOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : Math.floor(n);
};

const toDecimalOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};
// Helper Functions End

const getExpenseCategoriesByCategoryandSubcategoryController = async (req, res, next) => {
  try {
    const { sAuthToken, category, subCategory } = req.body; 
    const authResult = await checkUserAuthToken(sAuthToken);
    // ⛔ Stop here if auth failed
    if (!authResult.success) {
      return sendError(
        res,
        authResult.message,
        authResult.type === "SERVER_ERROR" ? 500 : 401,
        authResult.type
      );
    }
    const user = authResult.user;
    // ✅ Continue business logic
      // 4. Fetch expenses based on user_id and optional date filter
    let expenseQuery = `
       SELECT   *
      FROM prav_ai_users_expense_categories 
       WHERE user_id = $1 and category=$2 and subcategory=$3 and  status!='Deleted'
      ORDER BY  created_at desc LIMIT 1
    `;

    const queryParams = [user.user_id,category, subCategory];
    const expenseResult = await db.query(expenseQuery, queryParams);

    if (expenseResult.rows.length === 0) {
      return sendSuccess(res, "No Expense Category Configured", {});
    }

    return sendSuccess(res, "Expense Category fetched successfully", expenseResult.rows);

 

  } catch (error) {
    console.error(error)
        return sendError(res, "Internal server error", 500, "SERVER_ERROR");

  }
}

const getExpenseCategories = async (req, res, next) => {
  try {
    const { sAuthToken } = req.body;

    // 2. Check if auth exists in users table
    const authQuery = `
      SELECT user_id, auth_token_expires_at 
      FROM prav_ai_users 
      WHERE auth_token = $1
    `;

    const authResult = await db.query(authQuery, [sAuthToken]);

    if (authResult.rows.length === 0) {
      return sendError(res, "User auth expired. Please login again", 401, "AUTH_EXPIRED");
    }

    const user = authResult.rows[0];


    // 4. Fetch expenses based on user_id and optional date filter
    let expenseQuery = `
       SELECT  
   uec.*
      FROM prav_ai_users_expense_categories uec
       WHERE uec.user_id = $1 and uec.status!='Deleted'
      ORDER BY uec.created_at desc
    `;

    const queryParams = [user.user_id];
    const expenseResult = await db.query(expenseQuery, queryParams);

    if (expenseResult.rows.length === 0) {
      return sendSuccess(res, "No Expense Category Configured", {});
    }

    return sendSuccess(res, "Expense Category fetched successfully", { expense: expenseResult.rows });

  } catch (error) {
    console.error("Error:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};
const getExpenseCategoriesByCategoryAndSubcategory = async (req, res, next) => {
  try {
    const { sAuthToken, category, subcategory } = req.body;

    // 2. Check if auth exists in users table
    const authQuery = `
      SELECT user_id, auth_token_expires_at 
      FROM prav_ai_users 
      WHERE auth_token = $1
    `;

    const authResult = await db.query(authQuery, [sAuthToken]);

    if (authResult.rows.length === 0) {
      return sendError(res, "User auth expired. Please login again", 401, "AUTH_EXPIRED");
    }

    const user = authResult.rows[0];


    // 4. Fetch expenses based on user_id and optional date filter
    let expenseQuery = `
  SELECT *
  FROM prav_ai_users_expense_categories
  WHERE user_id = $1
`;

    const queryParams = [user.user_id];
    let paramIndex = 2;

    // if category is available
    if (category) {
      expenseQuery += ` AND category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    // if subcategory is available
    if (subcategory) {
      expenseQuery += ` AND subcategory = $${paramIndex}`;
      queryParams.push(subcategory);
    }
    const expenseResult = await db.query(expenseQuery, queryParams);

    if (expenseResult.rows.length === 0) {
      return sendSuccess(res, "No Expense Category Configured", {});
    }

    return sendSuccess(res, "Expense Category fetched successfully", { expense: expenseResult.rows });

  } catch (error) {
    console.error("Error:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};


const getCategoryLists = async (req, res, next) => {
  try {
    const { sAuthToken } = req.body;

    // 2. Check if auth exists in users table
    const authQuery = `
      SELECT user_id, auth_token_expires_at 
      FROM prav_ai_users 
      WHERE auth_token = $1
    `;

    const authResult = await db.query(authQuery, [sAuthToken]);

    if (authResult.rows.length === 0) {
      return sendError(res, "User auth expired. Please login again", 401, "AUTH_EXPIRED");
    }

    const user = authResult.rows[0];

    // 2. Call the helper function
    const categoryResult = await fetchCategoryList(user.user_id);

    if (!categoryResult.success) {
      return sendError(res, "Failed to fetch category", 500, "DB_ERROR");
    }

    // 3. If no categories found
    if (!categoryResult.data) {
      return sendSuccess(res, categoryResult.message, {});
    }

    // 4. Success - return categories
    return sendSuccess(res, categoryResult.message, {
      expense: categoryResult.data
    });
  } catch (error) {
    console.error("Error:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};

async function fetchCategoryList(userId) {
  try {
    const expenseQuery = `
      SELECT DISTINCT category as key, category as text
      FROM prav_ai_users_expense_categories
      WHERE user_id = $1 ;
    `;

    const result = await db.query(expenseQuery, [userId]);

    if (result.rows.length === 0) {
      return {
        success: true,
        data: null,
        message: "No Category Configured"
      };
    }

    return {
      success: true,
      data: result.rows,
      message: "Expense Category fetched successfully"
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}


const getSubCategorybyCategory = async (req, res, next) => {
  try {
    const { sAuthToken, category } = req.body;

    // 2. Check if auth exists in users table
    const authQuery = `
      SELECT user_id, auth_token_expires_at 
      FROM prav_ai_users 
      WHERE auth_token = $1
    `;

    const authResult = await db.query(authQuery, [sAuthToken]);

    if (authResult.rows.length === 0) {
      return sendError(res, "User auth expired. Please login again", 401, "AUTH_EXPIRED");
    }

    const user = authResult.rows[0];


    // 4. Fetch expenses based on user_id and optional date filter
    let expenseQuery = `
      SELECT subcategory
      FROM prav_ai_users_expense_categories
      WHERE user_id = $1 and category =$2
    `;

    const queryParams = [user.user_id, category];
    const expenseResult = await db.query(expenseQuery, queryParams);

    if (expenseResult.rows.length === 0) {
      return sendSuccess(res, "No Sub-Category Configured", {});
    }

    return sendSuccess(res, "Expense Category fetched successfully", expenseResult.rows);

  } catch (error) {
    console.error("Error:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};


const readExpenseCategoriesbyId = async (req, res, next) => {

  try {
    const { sAuthToken, categoryID } = req.body;
    // 2. Check if auth exists in users table
    const authQuery = `
      SELECT user_id, auth_token_expires_at 
      FROM prav_ai_users 
      WHERE auth_token = $1
    `;

    const authResult = await db.query(authQuery, [sAuthToken]);

    if (authResult.rows.length === 0) {
      return sendError(res, "User auth expired. Please login again", 401, "AUTH_EXPIRED");
    }

    const user = authResult.rows[0];


    let expenseDetails = fnGetExcpenseCategoriesModelData(); // replace with actual username if needed
    if (categoryID && categoryID !== "") {
      expenseDetails = await fetchExpenseDetailByID(user.user_id, categoryID); // replace with actual username if needed
      expenseDetails = expenseDetails.data
    }
    else {
      expenseDetails = fnGetExcpenseCategoriesModelData();
    }
    const PaymentMode = await fnGetPaymentMode(sAuthToken); // replace with actual username if needed
    const oReminders = await getReminderByParentId(user.user_id, categoryID)
    // expenseDetails[0].
    // var oData = ;
    return sendSuccess(res, "Expense Details fetched successfully", {
      expenseCategory: expenseDetails[0],
      UserPaymentModes: PaymentMode,
      recurringDates: oReminders.data
    });

  } catch (error) {
    console.error("Error:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};

async function fetchExpenseDetailByID(userId, selId) {
  try {
    //      to_char((recurring_start_date AT TIME ZONE 'UTC' AT TIME ZONE u.timezone), u.dateformat) AS recurring_startdate,
    // to_char((end_date_by AT TIME ZONE 'UTC' AT TIME ZONE u.timezone), u.dateformat) AS enddate_by,

    const expenseQuery = `
      SELECT recurring_start_date as recurring_startdate,end_date_by as enddate_by,
    e.* 
FROM prav_ai_users_expense_categories e
JOIN prav_ai_users u ON e.user_id = u.user_id
WHERE e.user_id= $1 and e.id=$2;
    `;

    const result = await db.query(expenseQuery, [userId, selId]);

    if (result.rows.length === 0) {
      return {
        success: true,
        data: null,
        message: "No Details Found."
      };
    }

    return {
      success: true,
      data: result.rows,
      message: "Expense Category fetched successfully"
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}


function fnGetExcpenseCategoriesModelData() {
  // below need to replace
  const today2 = new Date().toISOString();//.split("T")[0];

  const fnGetCreateExpenseDetails = [{
    category: "",
    subcategory: "",
    suggestions: "",
    spend_limit_month: "",
    weeklimit: "0",
    monthlimit: "0",
    quarterlimit: "0",
    yearlimit: "0",

    payment_mode: "",
    is_planned: false,
    status: true,
    recurring: false,
    recurring_start_date: today2,
    recurringtype: "Daily",
    recurringinterval: 1,
    // Monthly 
    recurring_day_of_month: "",

    // End settings
    end_interval: "5",
    end_date_range: "EndAfter",

  }];


  return fnGetCreateExpenseDetails;
}
const saveExpenseCategories = async (req, res, next) => {
  try {
    const { sAuthToken, expenseCategories, recurringDates, recurringDeleteDates } = req.body;

    // 1️⃣ Validate user auth
    const authQuery = `
      SELECT user_id, auth_token_expires_at 
      FROM prav_ai_users 
      WHERE auth_token = $1
    `;
    const authResult = await db.query(authQuery, [sAuthToken]);
    if (authResult.rows.length === 0) {
      return sendError(res, "User auth expired. Please login again", 401, "AUTH_EXPIRED");
    }
    const user = authResult.rows[0];
    const c = expenseCategories;

    // 2️⃣ Remove recurring dates if any
    if (recurringDeleteDates && recurringDeleteDates.length > 0) {
      await deleteReminderbyIds(user.user_id, recurringDeleteDates);
    }

    let insertedOrUpdatedCategory;

    // 3️⃣ Upsert expense category
    if (c.id) {
      // Update existing
      const updateQuery = `
        UPDATE prav_ai_users_expense_categories SET
          category = $1, subcategory = $2, suggestions = $3, notes = $4, spend_limit_month = $5,
          yearlimit = $6, monthlimit = $7, weeklimit = $8, quarterlimit = $9, dailylimit = $10,
          payment_mode = $11, is_planned = $12, recurring = $13, recurring_start_date = $14, recurringtype = $15,
          recurringinterval = $16, recurring_days_of_week = $17, recurring_day_of_month = $18, recurring_month_of_year = $19,
          end_date_range = $20, end_date_by = $21, end_interval = $22, status = $23, is_deleted = $24, updated_at = NOW()
        WHERE id = $25 AND user_id = $26
        RETURNING *
      `;
       
      
      const params = [
        c.category, c.subcategory, c.suggestions || "", c.notes || "", toDecimalOrNull(c.spend_limit_month),
        toIntOrNull(c.yearlimit), toIntOrNull(c.monthlimit), toIntOrNull(c.weeklimit), toIntOrNull(c.quarterlimit),
        toIntOrNull(c.dailylimit), c.payment_mode, c.is_planned || false, c.recurring || false,
        c.recurring_start_date || null, c.recurringtype || "None", toIntOrNull(c.recurringinterval),
        JSON.stringify(c.recurring_days_of_week) || null, toIntOrNull(c.recurring_day_of_month),
        toIntOrNull(c.recurring_month_of_year), c.end_date_range || "None", c.end_date_by || null,
        toIntOrNull(c.end_interval), c.status, false, c.id, user.user_id
      ];

      const result = await db.query(updateQuery, params);
      insertedOrUpdatedCategory = result.rows[0];

      // ✅ Remove old recurring reminders to prevent duplicates
      await deleteReminderbyTypeAndParentId(user.user_id, insertedOrUpdatedCategory.id);

    } else {
      // Insert new
      const insertQuery = `
        INSERT INTO prav_ai_users_expense_categories (
          user_id, category, subcategory, suggestions, notes, spend_limit_month,
          yearlimit, monthlimit, weeklimit, quarterlimit, dailylimit,
          payment_mode, is_planned, recurring, recurring_start_date, recurringtype,
          recurringinterval, recurring_days_of_week, recurring_day_of_month, recurring_month_of_year,
          end_date_range, end_date_by, end_interval, status, is_deleted, created_at, created_by
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,NOW(),'System'
        )
        RETURNING *
      `;
      const queryParams = [
        user.user_id, c.category, c.subcategory, c.suggestions || "", c.notes || "", toDecimalOrNull(c.spend_limit_month),
        toIntOrNull(c.yearlimit), toIntOrNull(c.monthlimit), toIntOrNull(c.weeklimit), toIntOrNull(c.quarterlimit),
        toIntOrNull(c.dailylimit), c.payment_mode, c.is_planned || false, c.recurring || false,
        c.recurring_start_date || null, c.recurringtype || "None", toIntOrNull(c.recurringinterval),
        JSON.stringify(c.recurring_days_of_week) || null, toIntOrNull(c.recurring_day_of_month),
        toIntOrNull(c.recurring_month_of_year), c.end_date_range || "None", c.end_date_by || null,
        toIntOrNull(c.end_interval), 'Active', false
      ];

      const result = await db.query(insertQuery, queryParams);
      insertedOrUpdatedCategory = result.rows[0];
    }

    // 4️⃣ Insert recurring reminders if available
    if (c.status != 'Inactive' && recurringDates && recurringDates.length > 0 && insertedOrUpdatedCategory.recurring) {
      await insertReminder(
        user.user_id,
        recurringDates,
        c.category + " - " + c.subcategory,
        c.suggestions,
        insertedOrUpdatedCategory.id
      );
    }

    // 5️⃣ Return success
    return sendSuccess(res, "Expense Category saved successfully", {
      expense: insertedOrUpdatedCategory,
      warnings: req.warnings || [],
    });

  } catch (error) {
    console.error("Error saving expense category:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};

// controllers/expenseCategory.controller.js
const deleteExpenseCategoryController = async (req, res) => {
  try {
    const { sAuthToken, expenseCategoryId } = req.body;

    /* 1️⃣ AUTH CHECK */
    const authQuery = ` SELECT user_id
      FROM prav_ai_users
      WHERE auth_token = $1
    `;
    const authResult = await db.query(authQuery, [sAuthToken]);

    if (authResult.rows.length === 0) {
      return sendError(res, "User auth expired. Please login again", 401, "AUTH_EXPIRED");
    }

    const userId = authResult.rows[0].user_id;

    /* 2️⃣ CHECK IF CATEGORY EXISTS & BELONGS TO USER */
    const categoryQuery = `
      SELECT id, category, subcategory
      FROM prav_ai_users_expense_categories
      WHERE id = $1 AND user_id = $2 AND is_deleted = false
    `;
    const categoryResult = await db.query(categoryQuery, [expenseCategoryId, userId]);

    if (categoryResult.rows.length === 0) {
      return sendError(res, "Expense category not found", 404, "CATEGORY_NOT_FOUND");
    }

    /* 3️⃣ CHECK IF ANY EXPENSES CONFIGURED */
    /* 3️⃣ CHECK IF ANY EXPENSES CONFIGURED */
    const expenseCheckQuery = `
  SELECT 1
  FROM prav_ai_users_expense_spends
  WHERE user_id = $1 AND category = $2 AND subcategory = $3
  LIMIT 1
`;
    const expenseCheck = await db.query(expenseCheckQuery, [
      userId,
      categoryResult.rows[0].category,
      categoryResult.rows[0].subcategory
    ]);

    /* 3️⃣A IF EXPENSE EXISTS → MARK CATEGORY INACTIVE */
    if (expenseCheck.rows.length > 0) {
      const inactiveQuery = `
    UPDATE prav_ai_users_expense_categories
    SET
      status = 'Inactive',
      updated_at = NOW()
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;

      const inactiveResult = await db.query(inactiveQuery, [
        expenseCategoryId,
        userId
      ]);
      /* 4️⃣ REMOVE RECURRING REMINDERS */
      await deleteReminderbyTypeAndParentId(userId, expenseCategoryId);

      return sendSuccess(res, "Expense Category updated successfully!\nThis category contains existing Expenses Spend. Please delete the related spend records and try again.", {
        expenseCategory: inactiveResult.rows[0]
      });
    }

    /* 4️⃣ REMOVE RECURRING REMINDERS */
    await deleteReminderbyTypeAndParentId(userId, expenseCategoryId);

   /* 5️⃣ HARD DELETE CATEGORY */
  const deleteQuery = `
    DELETE FROM prav_ai_users_expense_categories
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;

  const deleteResult = await db.query(deleteQuery, [expenseCategoryId, userId]);
  if (deleteResult.rowCount === 0) {
    return sendError(res, "Expense category not found or already deleted");
  }

  return sendSuccess(res, "Expense category deleted successfully", {
    expenseCategory: deleteResult.rows[0]
  });


  } catch (error) {
    console.error("Error deleting expense category:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};


 
module.exports = { getExpenseCategoriesByCategoryandSubcategoryController,getExpenseCategories, getExpenseCategoriesByCategoryAndSubcategory, getCategoryLists, getSubCategorybyCategory, fetchCategoryList, readExpenseCategoriesbyId, saveExpenseCategories, deleteExpenseCategoryController };
