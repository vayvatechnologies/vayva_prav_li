const { sendSuccess, sendError } = require('../../utils/responseHelper');
const db = require('../../utils/db');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendError(res, "Username and password are required", 400, "MISSING_FIELDS");
    }

    // Fetch user by username/email/phone
    const query = `
      SELECT user_id, auth_token, status
      FROM prav_ai_users 
      WHERE (username = $1 OR email = $1 OR phone_number = $1) 
        AND password_hash = $2
    `;

    const result = await db.query(query, [username, password]);

    if (result.rows.length === 0) {
      return sendError(res, "Invalid username or password", 401, "INVALID_CREDENTIALS");
    }

    const user = result.rows[0];

    // Handle user status checks
    switch (user.status) {

      case 0: // Inactive
        return sendError(res, "User is inactive", 403, "USER_INACTIVE");

      case 1: // Active
        try {
          // Reset past auth
          await fnResetUserAuth(username);

          // Generate new auth token
          const newToken = generateToken();

          await updateUserAuth(user.user_id, newToken);

          return sendSuccess(res, "Login successful", {
            auth_token: newToken
          });

        } catch (err) {
          console.error("Auth reset / update failed:", err);
          return sendError(res, "Failed to generate auth token", 500, "AUTH_GENERATION_FAILED");
        }

      case 2: // Blocked
        return sendError(res, "User is blocked", 403, "USER_BLOCKED");

      case 3: // Restricted
        return sendError(res, "User is restricted from logging in", 403, "USER_RESTRICTED");

      default:
        return sendError(res, "Unknown user status", 500, "UNKNOWN_STATUS");
    }

  } catch (error) {
    console.error("Login error:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};



// ------------------------------
// HELPER FUNCTIONS
// ------------------------------

async function fnResetUserAuth(username) {
  const query = `
    UPDATE prav_ai_users
    SET auth_token = NULL,
        auth_token_expires_at = NULL
    WHERE username = $1
  `;
  const result = await db.query(query, [username]);
  return result.rowCount > 0;
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
 
// ------------------------------
// TOKEN GENERATOR
// ------------------------------

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const signupOrUpdateUser = async (req, res) => {
  try {
    const {
      id,
      firstname,
      lastname,
      initial,
      mobilenumber,
      password,
      email,userplan,isPasswordChange,isadmin,status
    } = req.body;
    if (!firstname || !mobilenumber) {
      return sendError(res, "Firstname and mobile number required", 400, "MISSING_FIELDS");
    }

    let userId;
    let authToken;

    // -------------------------
    // UPDATE USER
    // -------------------------
    if (id) {
let updateQuery = `
  UPDATE prav_ai_users
  SET first_name = $1,
      last_name = $2,
      initial = $3,
      phone_number = $4,
      email = $5,
      userplan = $6,isadmin=$7,status =$8
`;

const queryParams = [firstname, lastname, initial, mobilenumber, email || null, userplan,isadmin,status];

// Conditionally add password
if (isPasswordChange) {
  updateQuery += `, password_hash = $9`;
  queryParams.push(password);
}

// Add WHERE clause
updateQuery += ` WHERE user_id = $${queryParams.length + 1} RETURNING user_id`;
queryParams.push(id);

// Execute the query
const result = await db.query(updateQuery, queryParams);

      if (result.rows.length === 0) {
        return sendError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      userId = result.rows[0].user_id;

      return sendSuccess(res, "User updated successfully", { user_id: userId });
    }

    // -------------------------
    // SIGNUP / CREATE USER
    // -------------------------

    authToken = generateToken();

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    const insertQuery = `
      INSERT INTO prav_ai_users
      (first_name, last_name, initial, phone_number, password_hash, email, auth_token, auth_token_expires_at, status,isadmin,username)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,$9,$4)
      RETURNING user_id
    `;

    const insertResult = await db.query(insertQuery, [
      firstname,
      lastname,
      initial,
      mobilenumber,
      password,
      email || null,
      authToken,
      expiry,isadmin
    ]);

    userId = insertResult.rows[0].user_id;

    // -------------------------
    // INSERT USER SETTINGS
    // -------------------------

    const settingQuery = `
      INSERT INTO prav_ai_user_settings (user_id)
      VALUES ($1)
    `;

    await db.query(settingQuery, [userId]);

    return sendSuccess(res, "User created successfully", {
      user_id: userId,
      auth_token: authToken
    });

  } catch (error) {
    console.error("Signup/Create/Update Error:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};
const createUser = async (req, res) => {
  const client = await db.connect();

  try {
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

    // Get file buffer
    const screenshotBuffer = req.file ? req.file.buffer : null;
    const screenshotType = req.file ? req.file.mimetype : null;

    await client.query("BEGIN");

    const authToken = generateToken();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    const userQuery = `
      INSERT INTO prav_ai_users
      (first_name,last_name,initial,phone_number,password_hash,email,auth_token,auth_token_expires_at,status,username,userplan)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$4,$10)
      RETURNING user_id
    `;

    const userResult = await client.query(userQuery, [
      firstname,
      lastname,
      initial,
      mobilenumber,
      password,
      email,
      authToken,
      expiry,
      status,
      userplan
    ]);

    const userId = userResult.rows[0].user_id;

    await client.query(
      `INSERT INTO prav_ai_user_settings (user_id) VALUES ($1)`,
      [userId]
    );

    let nextPayment = null;

    if (subscription_type === "monthly") {
      nextPayment = new Date();
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }

    if (subscription_type === "yearly") {
      nextPayment = new Date();
      nextPayment.setFullYear(nextPayment.getFullYear() + 1);
    }

    const subQuery = `
      INSERT INTO prav_ai_user_subscriptions
      (user_id,userplan,subscription_type,subscription_amount,payment_datetime,next_payment_date,status,payment_screenshot,payment_screenshot_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `;

    await client.query(subQuery, [
      userId,
      userplan,
      subscription_type,
      subscription_amount,
      payment_datetime,
      nextPayment,
      status,
      screenshotBuffer,
      screenshotType
    ]);

    await client.query("COMMIT");

    res.json({ success: true, user_id: userId });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
const createUserBK = async (req, res) => {
//console.log(req.body)
  const client = await db.connect();

  try {

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

    const screenshotPath = req.file
      ? req.file.path
      : null;

    await client.query("BEGIN");

    const authToken = generateToken();

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    const userQuery = `
      INSERT INTO prav_ai_users
      (first_name,last_name,initial,phone_number,password_hash,email,auth_token,auth_token_expires_at,status,username,userplan)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$4,$10)
      RETURNING user_id
    `;

    const userResult = await client.query(userQuery, [
      firstname,
      lastname,
      initial,
      mobilenumber,
      password,
      email,
      authToken,
      expiry,
      status,
      userplan
    ]);

    const userId = userResult.rows[0].user_id;

    await client.query(
      `INSERT INTO prav_ai_user_settings (user_id) VALUES ($1)`,
      [userId]
    );

    let nextPayment = null;

    if (subscription_type === "monthly") {
      nextPayment = new Date();
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }

    if (subscription_type === "yearly") {
      nextPayment = new Date();
      nextPayment.setFullYear(nextPayment.getFullYear() + 1);
    }

    const subQuery = `
      INSERT INTO prav_ai_user_subscriptions
      (user_id,userplan,subscription_type,subscription_amount,payment_datetime,next_payment_date,status,payment_screenshot)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `;

    await client.query(subQuery, [
      userId,
      userplan,
      subscription_type,
      subscription_amount,
      payment_datetime,
      nextPayment,
      status,
      screenshotPath
    ]);

    await client.query("COMMIT");

    res.json({
      success: true,
      user_id: userId
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  } finally {
    client.release();
  }
};

module.exports = { login,signupOrUpdateUser,createUser };
