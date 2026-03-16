const { sendSuccess, sendError } = require('../../../utils/responseHelper');
const db = require('../../../utils/db');
const { getCurrentDateTimeUserFormat,convertDateRangeToUTC,convertDateTimeToUTC,isoToPgTimestamp,isoToPgDateOnly,fnGetExpenseType, fnGetCycleTypes, fnGetExpenseMood, fnGetPaymentStatus, fnGetPaymentMode,checkUserAuthToken } = require('../../general/generalController');
const { getExpenseCategory, getCategoryLists, getSubCategoryLists, fetchCategoryList } = require('./expenseCategoryController');

function convertDateToDBDatetime(dateStr, type) {
  const [day, month, year] = dateStr.split('-').map(Number);
  let date = new Date(Date.UTC(year, month - 1, day));

  if (type === 'from') date.setUTCHours(0, 0, 0, 0);
  else date.setUTCHours(23, 59, 59, 999);

  return date; // return Date object, not string
}




const getExpenseSpendLists = async (user_id,oFromDate,oToDate) => {
  try {
    if (!user_id) {
      return [];
    }
      
    let sQuery = ` SELECT * FROM public.prav_ai_users_expense_spends
      WHERE user_id = $1 AND transactiondatetime >= $2
      AND transactiondatetime <= $3 ORDER BY transactiondatetime DESC`;
    
    const result = await db.query(sQuery, [user_id, oFromDate, oToDate]);

    if (result.rows.length === 0) {
      return [];
    }
     return   result.rows

  } catch (error) {
    console.error("Fetch Expense Spend Error:", error);
      return [];
  }
};
const getExpenseSpendSummary = async (user_id,oFromDate,oToDate) => {
  try {
    if (!user_id) {
      return [];
    }

   const expenseQuery = ` 
     WITH 
      totals AS (
          SELECT
              SUM(CASE WHEN LOWER(type) = 'income' THEN amount ELSE 0 END) AS total_income,
              SUM(CASE WHEN LOWER(type) = 'expense' THEN amount ELSE 0 END) AS total_expense
          FROM prav_ai_users_expense_spends
          WHERE user_id = $1
            AND transactiondatetime >= $2
            AND transactiondatetime <= $3
            AND status='Active'
      ),
      weekly_expense AS (
          SELECT 
              SUM(amount) AS weekly_expense
          FROM prav_ai_users_expense_spends
          WHERE LOWER(type) = 'expense'
            AND user_id = $1
            AND transactiondatetime >= $2
            AND transactiondatetime <= $3
            AND transactiondatetime >= date_trunc('week', CURRENT_DATE)
            AND transactiondatetime < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
            AND status='Active'
      ),
      top_category AS (
          SELECT category
          FROM prav_ai_users_expense_spends
          WHERE LOWER(type) = 'expense'
            AND user_id = $1
            AND transactiondatetime >= $2
            AND transactiondatetime <= $3
            AND status='Active'
          GROUP BY category
          ORDER BY SUM(amount) DESC
          LIMIT 1
      ),
      last_expense AS (
          SELECT category, subcategory
          FROM prav_ai_users_expense_spends
          WHERE LOWER(type) = 'expense'
            AND user_id = $1
            AND transactiondatetime >= $2
            AND transactiondatetime <= $3
            AND status='Active'
          ORDER BY transactiondatetime DESC
          LIMIT 1
      )
      SELECT 
          t.total_income,
          t.total_expense,
          w.weekly_expense,
          tc.category AS top_expense_category,
          le.category AS last_expense_category,
          le.subcategory AS last_expense_subcategory
      FROM totals t
      CROSS JOIN weekly_expense w
      CROSS JOIN top_category tc	
      CROSS JOIN last_expense le;
     
    `;
    //console.log(oFromDate +","+ oToDate)
    //const {fromUTC,toUTC} = convertDateRangeToUTC(oFromDate, oToDate)
   // console.log(fromUTC +","+ toUTC)
     const result = await db.query(expenseQuery, [user_id ,oFromDate,oToDate]);

    if (result.rows.length === 0) {
      return [];
    }

    return   result.rows[0]

  } catch (error) {
    console.error("Fetch Expense Spend Summary Error:", error);
      return [];
  }
};
  
const getExpenseDetails = async (req, res, next) => {
  try {
    const { sAuthToken, oFromDate, oToDate } = req.body; 
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
    
    const oGetExpenseSpends = await getExpenseSpendLists(user.user_id, oFromDate, oToDate);
    const oGetExpenseSpendsSummary = await getExpenseSpendSummary(user.user_id, oFromDate, oToDate);
    
      
    // Final Response Object
    const response = {
      summary:oGetExpenseSpendsSummary,
      expenses:oGetExpenseSpends
    };

    return sendSuccess(res, "Expense details fetched successfully", response);
 

  } catch (error) {
    console.error(error)
        return sendError(res, "Internal server error", 500, "SERVER_ERROR");

  }
}
 
 


async function fetchExpenseDetailByID(userId,selId) {
  try {
    //to_char((e.transactiontime AT TIME ZONE 'UTC' AT TIME ZONE u.timezone), u.datetimeformat) AS transactiondatetime,
     
    const expenseQuery = `
    SELECT 
      LOWER(type) AS type,e.* 
FROM prav_ai_users_expense_spends e
JOIN prav_ai_users u ON e.user_id = u.user_id
      WHERE e.user_id = $1 and e.id=$2;
    `;

    const result = await db.query(expenseQuery, [userId,selId]);

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
      message: "Expense detail fetched successfully"
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

const getCreateExpenseDetails = async (req, res, next) => {

  try {
    const { sAuthToken, expenseId } = req.body;
    // 2. Check if auth exists in users table
    const authQuery = `
      SELECT user_id, auth_token_expires_at ,timezone,datetimeformat
      FROM prav_ai_users 
      WHERE auth_token = $1
    `;

    const authResult = await db.query(authQuery, [sAuthToken]);

    if (authResult.rows.length === 0) {
      return sendError(res, "User auth expired. Please login again", 401, "AUTH_EXPIRED");
    }

    const user = authResult.rows[0];
     const expenseTypes = await fnGetExpenseType(sAuthToken); // replace with actual username if needed
    const paymentStatus = await fnGetPaymentStatus(sAuthToken); // replace with actual username if needed
    const cycleTypes = await fnGetCycleTypes(sAuthToken); // replace with actual username if needed
    const expenseMoodTypes = await fnGetExpenseMood(sAuthToken); // replace with actual username if needed
    const categoryList = await fetchCategoryList(user.user_id); // replace with actual username if needed
    const PaymentMode = await fnGetPaymentMode(user.user_id); // replace with actual username if needed
    let expenseDetails = await fnGetCreateExpenseDetails(user.datetimeformat,user.timezone); // replace with actual username if needed
    if (expenseId && expenseId!=="") {
       expenseDetails = await fetchExpenseDetailByID(user.user_id,expenseId); // replace with actual username if needed
      expenseDetails = expenseDetails.data
    }
    else{           
      expenseDetails =   fnGetCreateExpenseDetails(user.datetimeformat,user.timezone);
    }

    var oData = {
      expenseDetails: expenseDetails[0],
      types: expenseTypes,
      category: categoryList.data,
      //  [{key:"cash",text:"Cash"},{key:"card",text:"Card"}],
      paymentModes: PaymentMode,
      paymentStatuses: paymentStatus,
      cycles: cycleTypes,
      moods: expenseMoodTypes
    };
    return sendSuccess(res, "Expense Details fetched successfully", { data: oData });

  } catch (error) {
    console.error("Error:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};
 function fnGetCreateExpenseDetails(datetimeformat,timezone) {
    // below need to replace
            const defaultPaymentMode = "UPI";//payment mode
      const fnGetCreateExpenseDetails = [{
        // transactiondatetime : getCurrentDateTimeUserFormat("DD/MM/YYYY HH:mm:ss",timezone),
    transactiondatetime: new Date().toISOString(),
    type: "expense",
    category: "",
    subcategory: "",
    description: "",
    payment_mode: defaultPaymentMode,
    amount: "",
    payment_status: "Paid",
    is_planned: false,
    merchant_name: "",
    with_whom: "",
    cycle: "onetime",
    saving_impact: false,
    expense_mood: "Neutral",
    notes: ""
  }]


  return fnGetCreateExpenseDetails;
}


const saveExpenseSpend = async (req, res, next) => {
  try {
    const { sAuthToken, expenseDetail } = req.body;

    // Step 1: Validate user authorization
    const authResult = await checkUserAuthToken(sAuthToken);

    if (!authResult.success) {
      return sendError(
        res,
        authResult.message,
        authResult.type === "SERVER_ERROR" ? 500 : 401,
        authResult.type
      );
    }

    const user = authResult.user;

    // Step 2: Check if the expense ID exists
    if (expenseDetail.id) {
      // If ID exists, update the existing record
      const result = await updateExpense(user.user_id, expenseDetail);
      if (!result.success) {
        return sendError(res, result.message, 500, "SERVER_ERROR");
      }

      return sendSuccess(res, "Expense updated successfully", result.data);
    } else {
      // If no ID, insert a new expense record
      const result = await insertExpense(user.user_id, expenseDetail);
      if (!result.success) {
        return sendError(res, result.message, 500, "SERVER_ERROR");
      }

      return sendSuccess(res, "Expense added successfully", result.data);
    }
  } catch (error) {
    console.error("Error:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};

// Function to insert a new expense
async function insertExpense(userId, expenseDetail) {
  try {
    const insertQuery = `
      INSERT INTO prav_ai_users_expense_spends (
        user_id, transactiondatetime, type, category, subcategory, description, 
        payment_mode, amount, payment_status, is_planned, merchant_name, 
        with_whom, cycle, saving_impact, expense_mood, notes,status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, 
        $7, $8, $9, $10, $11, 
        $12, $13, $14, $15, $16,'Active'
      ) RETURNING *;
    `;
   
    const values = [
      userId, expenseDetail.transactiondatetime, expenseDetail.type, expenseDetail.category, 
      expenseDetail.subcategory, expenseDetail.description, expenseDetail.payment_mode, 
      expenseDetail.amount, expenseDetail.payment_status, expenseDetail.is_planned, 
      expenseDetail.merchant_name, expenseDetail.with_whom, expenseDetail.cycle, 
      expenseDetail.saving_impact, expenseDetail.expense_mood, expenseDetail.notes
    ];

    const result = await db.query(insertQuery, values);

    return {
      success: true,
      data: result.rows[0],
      message: "Expense added successfully"
    };

  } catch (error) {
    console.error(error)
    return {
      success: false,
      message: error.message
    };
  }
}

// Function to update an existing expense
async function updateExpense(userId, expenseDetail) {
  try {
    const updateQuery = `
      UPDATE prav_ai_users_expense_spends 
      SET 
        transactiondatetime = $1, type = $2, category = $3, subcategory = $4, 
        description = $5, payment_mode = $6, amount = $7, payment_status = $8, 
        is_planned = $9, merchant_name = $10, with_whom = $11, cycle = $12, 
        saving_impact = $13, expense_mood = $14, notes = $15,   
        modified_on = NOW(), modified_by = $16,status='Active'
      WHERE id = $17 AND user_id = $16
      RETURNING *;
    `;

     const values = [
      expenseDetail.transactiondatetime, expenseDetail.type, expenseDetail.category, 
      expenseDetail.subcategory, expenseDetail.description, expenseDetail.payment_mode, 
      expenseDetail.amount, expenseDetail.payment_status, expenseDetail.is_planned, 
      expenseDetail.merchant_name, expenseDetail.with_whom, expenseDetail.cycle, 
      expenseDetail.saving_impact, expenseDetail.expense_mood, expenseDetail.notes, 
        userId, expenseDetail.id
    ];

    const result = await db.query(updateQuery, values);

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Expense not found to update"
      };
    }

    return {
      success: true,
      data: result.rows[0],
      message: "Expense updated successfully"
    };

  } catch (error) {
    console.error(error)
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Build expense query using rolling ranges
 * @param {number|string} userId
 * @param {'monthly'|'weekly'|'custom'} fetchType
 * @param {Array} inputArray
 * @returns {{ text: string, values: Array }}
 */
function buildUserSpendsQueryHelper(userId, fetchType, inputArray) {
  let startDate;
  let endDate = new Date(); // now

  switch (fetchType) {
    case 'monthly': {
      // inputArray: [numberOfMonths] → e.g. [3], [4], [5]
      const [months] = inputArray;
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      break;
    }

    case 'weekly': {
      // inputArray: [numberOfWeeks] → e.g. [3], [4], [5]
      const [weeks] = inputArray;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - weeks * 7);
      break;
    }

    case 'custom': {
      // inputArray: ['YYYY-MM-DD', 'YYYY-MM-DD']
      const [from, to] = inputArray;
      startDate = new Date(from);
      endDate = new Date(to);
      break;
    }

    default:
      throw new Error('Invalid fetchType');
  }

  return {
    query: `
      SELECT *
      FROM public.prav_ai_users_expense_spends
      WHERE user_id = $1
        AND transactiondatetime >= $2
        AND transactiondatetime <  $3
      ORDER BY transactiondatetime DESC
    `,
    values: [userId, startDate, endDate],
  };
}


// Dashboard weekly data
// buildExpenseQuery(101, 'monthly', [3]);
// buildExpenseQuery(101, 'weekly', [5]);
// buildExpenseQuery(101, 'custom', ['2025-10-01', '2026-01-01']);

async function fetchUserExpenseSpendsChartDataByFilter(userId, fromDate, toDate) { // Fetchtype - Montly, weekly,yearly, quarterly
  try {
    const oUserSpendQuery =  getWeekOfMonthChartQuery(userId, fromDate, toDate);
      const result = await db.query(oUserSpendQuery.query, oUserSpendQuery.values);

    if (result.rows.length === 0) {
      return {
        success: true,
        data: [],
        message: "No user Spend Found."
      };
    }

    return {
      success: true,
      data: result.rows,
      message: "User Spends fetched successfully."
    };

  } catch (error) {
    console.error(error)
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
}

 
/**
 * Get week-wise expense totals for a given month
 * Weeks are Monday–Sunday, last week may be partial
 *
 * @param {number|string} userId
 * @param {string} monthStartDate - 'YYYY-MM-01'
 * @returns {{ query: string, values: Array }}
 */
function getWeekOfMonthChartQuery(userId, fromDate, toDate) {
   return {
    query: `
      WITH months AS (
  SELECT generate_series(
    date_trunc('month', $2::date),
    date_trunc('month', $3::date),
    interval '1 month'
  )::date AS month_start
),
month_weeks AS (
  SELECT
    m.month_start,
    generate_series(
      m.month_start,
      LEAST(
        m.month_start + interval '1 month - 1 day',
        $3::date
      ),
      interval '1 week'
    )::date AS week_start
  FROM months m
),
week_ranges AS (
  SELECT
    month_start,
    week_start,
    LEAST(
      week_start + interval '6 day',
      month_start + interval '1 month - 1 day',
      $3::date
    )::date AS week_end,
    ROW_NUMBER() OVER (PARTITION BY month_start ORDER BY week_start) AS week_no
  FROM month_weeks
)
SELECT
  'W' || w.week_no || ', ' || to_char(w.month_start, 'Mon-YYYY') AS period,
  COALESCE(SUM(CASE WHEN e.type ILIKE 'income'  THEN e.amount END), 0) AS income,
  COALESCE(SUM(CASE WHEN e.type ILIKE 'expense' THEN e.amount END), 0) AS expense
FROM week_ranges w
LEFT JOIN public.prav_ai_users_expense_spends e
  ON e.user_id = $1
 AND e.transactiondatetime::date BETWEEN w.week_start AND w.week_end
GROUP BY
  w.month_start,
  w.week_no
ORDER BY
  w.month_start,
  w.week_no;

    `,
    values: [ userId, fromDate, toDate],
  };
}

 

// User dashboard details

async function fetchUserDashboardUserSpends(userId, fromDate, toDate) { // Fetchtype - Montly, weekly,yearly, quarterly
  try {
    const oUserSpendQuery =  getFetchUserDashboardDetailQueryHelper(userId, fromDate, toDate);
      const result = await db.query(oUserSpendQuery.query, oUserSpendQuery.values);

    if (result.rows.length === 0) {
      return {
        success: true,
        data: [],
        message: "No user Spend Found."
      };
    }

    return {
      success: true,
      data: result.rows,
      message: "User Spends fetched successfully."
    };

  } catch (error) {
    console.error(error)
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
}

function getFetchUserDashboardDetailQueryHelper(userId, fromDate, toDate) {
   return {
    query: `
      WITH filtered AS (
    SELECT * FROM public.prav_ai_users_expense_spends
where   transactiondatetime >= $2::date
        AND transactiondatetime <  $3::date and user_id=$1
),
totals AS (	
    SELECT
        COALESCE(SUM(CASE WHEN type = 'Income' or type='income'  THEN amount END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' or type = 'Expense'   THEN amount END), 0) AS expense,
        MAX(transactiondatetime) AS last_entry_date
    FROM filtered
),
top_expense_category AS (
    SELECT category
    FROM filtered
    WHERE type='expense' or type='Expense'
    GROUP BY category
    ORDER BY SUM(amount) DESC
    LIMIT 1
)
SELECT
    income,
    expense,
    (income - expense) AS balance,
    last_entry_date,
    category AS top_expense_category
FROM totals
LEFT JOIN top_expense_category ON TRUE;

    `,
    values: [ userId, fromDate, toDate],
  };
}


module.exports = { fetchUserExpenseSpendsChartDataByFilter,fetchUserDashboardUserSpends,getExpenseDetails, getCreateExpenseDetails ,saveExpenseSpend};
