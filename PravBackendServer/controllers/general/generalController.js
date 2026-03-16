const { sendSuccess, sendError } = require('../../utils/responseHelper');
const db = require('../../utils/db');

const { DateTime } = require('luxon');

const moment = require("moment-timezone");
function getCurrentDateTimeUserFormat({
  format = "DD/MM/YYYY HH:mm:ss",
  timeZone = "UTC"
} = {}) {

  const date = new Date();

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: format.includes("hh")
  }).formatToParts(date);

  const map = {};
  parts.forEach(p => map[p.type] = p.value);

  const hour24 = map.hour;
  const hour12 = String(((hour24 % 12) || 12)).padStart(2, "0");
  const ampm = hour24 >= 12 ? "PM" : "AM";

  return format
    .replace("DD", map.day)
    .replace("MM", map.month)
    .replace("YYYY", map.year)
    .replace("HH", hour24)
    .replace("hh", hour12)
    .replace("mm", map.minute)
    .replace("ss", map.second)
    .replace("A", ampm);
}


function convertDateRangeToUTC(fromDate, toDate) {
  const fromUTC = DateTime
    .fromFormat(fromDate, 'dd-MM-yyyy', { zone: 'Asia/Kolkata' })
    .startOf('day')
    .toUTC()
    .toFormat('yyyy-MM-dd HH:mm:ss');  // ✅ correct format

  const toUTC = DateTime
    .fromFormat(toDate, 'dd-MM-yyyy', { zone: 'Asia/Kolkata' })
    .endOf('day')
    .toUTC()
    .toFormat('yyyy-MM-dd HH:mm:ss');  // ✅ correct format

  return { fromUTC, toUTC };
}

function convertDateTimeToUTC(dateStr) {
  // Split the input date string into parts
  const [day, month, yearAndTime] = dateStr.split('/');
  const [year, time] = yearAndTime.split(' ');

  // Create a Date object in local time
  const localDate = new Date(`${year}-${month}-${day}T${time}`);

  // Convert to UTC string
  const utcDate = localDate.toISOString(); // Returns ISO string in UTC
  return utcDate;
}



function isoToPgTimestamp(isoString) {
  return isoString
    .replace('T', ' ')
    .replace('Z', '')
    .split('.')[0];
}
function isoToPgDateOnly(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const checkUserAuthToken = async (sAuthToken) => {
  try {
    if (!sAuthToken) {
      return {
        success: false,
        message: "Auth token is required",
        type: "AUTH_TOKEN_MISSING"
      };
    }

    const query = `
      SELECT *
      FROM prav_ai_users
      WHERE auth_token = $1
    `;

    const result = await db.query(query, [sAuthToken]);

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "User auth expired. Please login again",
        type: "AUTH_EXPIRED"
      };
    }

    return {
      success: true,
      user: result.rows[0]
    };

  } catch (error) {
    console.error("Auth check error:", error);
    return {
      success: false,
      message: "Internal server error",
      type: "SERVER_ERROR"
    };
  }
};

const login = async (req, res, next) => {

};




// ------------------------------
// HELPER FUNCTIONS
// ------------------------------

async function fnGetExpenseType(username) {
  const types = [
    { "key": "expense", "text": "Expense" },
    { "key": "income", "text": "Income" },
    { "key": "transfer", "text": "Transfer" },
    { "key": "loan", "text": "Loan" }
  ];
  return types;
}
async function fnGetPaymentStatus(username) {
  const paymentStatus = [
    { "key": "Paid", "text": "Paid" },
    { "key": "Partially Paid", "text": "Partially Paid" },
    { "key": "Failed", "text": "Failed" },
    { "key": "Cancelled", "text": "Cancelled" },
    { "key": "Refunded", "text": "Refunded" },
  ];

  return paymentStatus;
}
async function fnGetCycleTypes(username) {
  const paymentStatus = [
    { "key": "onetime", "text": "One Time" },
    { "key": "daily", "text": "Daily" },
    { "key": "weekly", "text": "Weekly" },
    { "key": "monthly", "text": "Monthly" },
    { "key": "quarterly", "text": "Quarterly" },
    { "key": "yearly", "text": "Yearly" }
  ];

  return paymentStatus;
}
// async function fnGetExpenseMood(username) {
//   const paymentStatus = [
//     { "key": "Happy", "text": "Happy" },
//     { "key": "Neutral", "text": "Neutral" },
//     { "key": "Sad", "text": "Sad" },
//     { "key": "Stressed", "text": "Stressed" },
//     { "key": "Excited", "text": "Excited" },
//     { "key": "Needed", "text": "Needed" }
//   ];

//   return paymentStatus;
// }


async function fnGetPaymentMode2(username) {
  const paymentMode = [{ key: "Credit Card", text: "Credit Card" },
  { key: "Debit Card", text: "Debit Card" },
  { key: "UPI", text: "UPI" },
  { key: "Cash", text: "Cash" },
  { key: "Wallet", text: "Wallet" },
  { key: "Bank Transfer", text: "Bank Transfer" }
  ];

  return paymentMode;
}

async function fnGetPaymentMode(username) { // move to new file
  const paymentMode = [
    { key: "Credit / Debit Card", text: "Credit / Debit Card" },
    { key: "UPI / Wallet / Bank Transfer", text: "UPI / Wallet / Bank Transfer" },
    { key: "Cash", text: "Cash" }
  ];

  try {
    const expenseQuery = `
SELECT name as text, key FROM prav_ai_user_expense_config
where expense_setting_type='PaymentMode' and user_id=$1
    `;

    const result = await db.query(expenseQuery, [username]);
     
    if (result.rows.length > 0) {
      const finallist = [...paymentMode, ...result.rows]
      return finallist;
    }

    return paymentMode;


  } catch (error) {
    console.error(error)
    return paymentMode;
  }
}





async function fnGetExpenseMood(username) { // move to new file
  const paymentMode = [
    { key: "Normal", text: "Normal" },
    { key: "Emergency", text: "Emergency" }
  ];

  try {
    const expenseQuery = `
SELECT name as text, key FROM prav_ai_user_expense_config
where expense_setting_type='ExpenseMood' and user_id=$1
    `;

    const result = await db.query(expenseQuery, [username]);
    //console.log(result.rows)
    //console.log(username)
    if (result.rows.length > 0) {
      const finallist = [...paymentMode, ...result.rows]
      return finallist;
    }

    return paymentMode;


  } catch (error) {
    console.error(error)
    return paymentMode;
  }
}





async function updateUserAuth(userId, token) {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24 hour expiry

  const query = `
    UPDATE prav_ai_users
    SET auth_token = $1,
        auth_token_expires_at = $2
    WHERE user_id = $3
  `;

  await db.query(query, [token, expiry, userId]);
}



module.exports = { getCurrentDateTimeUserFormat, convertDateRangeToUTC, convertDateTimeToUTC, isoToPgTimestamp, isoToPgDateOnly, checkUserAuthToken, login, fnGetExpenseType, fnGetCycleTypes, fnGetExpenseMood, fnGetPaymentStatus, fnGetPaymentMode };
