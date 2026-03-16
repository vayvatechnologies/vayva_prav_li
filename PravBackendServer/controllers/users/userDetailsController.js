const { sendSuccess, sendError } = require('../../utils/responseHelper');
const db = require('../../utils/db');

const { checkUserAuthToken } = require('../general/generalController');

// Helper to validate auth token
const validateAuthToken = (sAuthToken, callback) => {
  const query = `
    SELECT user_id, auth_token_expires_at,timezone
    FROM prav_ai_users
    WHERE auth_token = $1
  `;
  db.query(query, [sAuthToken], (err, results) => {
    if (err) return callback(err);
    if (results.rows.length === 0) return callback(new Error("Invalid auth token"));

    const user = results.rows[0];
    // Check if the auth token has expired
    if (new Date(user.auth_token_expires_at) < new Date()) {
      return callback(new Error("User Auth token has expired"));
    }

    return callback(null, user);
  });
};

// Helper to get user details
const getUserDetailsFromDB = (userId, callback) => {
  const query = `
    SELECT user_id,first_name,last_name,CONCAT(first_name, ' ', last_name) AS full_name,  initial,username,email,phone_number,date_of_birth,profile_photo_url,gender,daily_water_goal_l,
    daily_steps_goal,daily_sleep_goal_hr,status,last_login_at,created_at,auth_token,theme_preference,datetimeformat,dateformat,userplan,isAdmin 
    FROM prav_ai_users 
    WHERE user_id = $1
  `;

  db.query(query, [userId], (err, results) => {
    if (err) return callback(err);
    if (results.rows.length === 0) return callback(new Error("User details not found"));

    return callback(null, results.rows[0]);
  });
};
// Fetch user settings from DB
const getUserSettingsFromDB = (user_id, callback) => {
   const query = `
   SELECT * FROM prav_ai_user_settings
    WHERE user_id = $1 
  `;

  db.query(query, [user_id], (err, results) => {
    if (err) return callback(err);
    if (results.rows.length === 0) return callback(new Error("User Related Settings not found"));

    return callback(null, results.rows[0]);
  });
};

// Helper to get user notifications
const getUserNotifications = (userId, callback) => {
  const query = `
    SELECT *
    FROM prav_ai_users_notifications
    WHERE user_id = $1 AND notification_date <= CURRENT_TIMESTAMP
  AND notification_expiry_at >= CURRENT_TIMESTAMP and unread=true
    ORDER BY notification_date DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) return callback(err);
    return callback(null, results.rows || []);
  });
};

// Helper to get user roles
// const getUserRoles = (userId, callback) => {
//   const query = `
//     SELECT ur.role_id, r.role_name
//     FROM prav_ai_userroles ur
//     JOIN prav_ai_roles r ON ur.role_id = r.role_id
//     WHERE ur.user_id = $1
//   `;

//   db.query(query, [userId], (err, results) => {
//     if (err) return callback(err);
//     return callback(null, results.rows || []);
//   });
// };

// Helper to get role tiles
// const getRoleTiles = (userId, callback) => {
//   const queryw = `
//     SELECT mt.tile_id,mt.parent_tile_id,mt.sort_order,mt.title_i18n_Key,mt.icon,mt.expanded,mt.route as key
//     FROM prav_ai_role_tiles_assignment rta
//     JOIN prav_ai_menutiles mt ON rta.tile_id = mt.tile_id
//     WHERE rta.role_id IN (SELECT user_role_id FROM prav_ai_userroles WHERE user_id = $1)
//   `;
//   const query = `SELECT DISTINCT
//        mt.tile_id,
//        mt.parent_tile_id,
//        mt.sort_order,
//        mt.title_i18n_key,
//        mt.icon,
//        mt.expanded,
//        mt.route AS key
// FROM prav_ai_menutiles mt
// LEFT JOIN prav_ai_role_tiles_assignment rta
//        ON rta.tile_id = mt.tile_id
// LEFT JOIN prav_ai_userroles ur
//        ON ur.user_role_id = rta.role_id
//        AND ur.user_id = $1
// WHERE
//     mt.visible = TRUE
//     AND (
//         mt.user_login_required = FALSE
//         OR (
//             mt.user_login_required = TRUE
//             AND ur.user_id IS NOT NULL
//         )
//     )
// ORDER BY mt.sort_order;
// `;
//   db.query(query, [userId], (err, results) => {
//     if (err) return callback(err);
//     return callback(null, results.rows || []);
//   });
// };

// Convert DB flat menu tiles into hierarchical UI menu structure
// For now we removed if need resue this -- not using function
const fnCreateMenutileStructure = (roleTiles = []) => {
 var  tiles =  Array.isArray(roleTiles?.tiles)
        ? roleTiles[0].tiles
        : roleTiles;
      tiles=  tiles[0].tiles
  
   if (!tiles || tiles.length === 0) return [];

  // FIX: Treat null, undefined, "" as parent
  const parents = tiles.filter(t =>
    t.parent_tile_id === null ||
    t.parent_tile_id === undefined ||
    t.parent_tile_id === "" ||
    t.parent_tile_id === 0
  );

  const parentList = parents.length > 0 ? parents : tiles;

  const menu = parentList
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(parent => {
      const children = tiles
        .filter(t => t.parent_tile_id == parent.tile_id) // use == for safety
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map(child => ({
          titleI18nKey: child.title_i18n_key,
          key: child.key
        }));

      return {
        titleI18nKey: parent.title_i18n_key,
        icon: parent.icon,
        expanded: parent.expanded,
        key: parent.key,
        items: children
      };
    });

  return menu;
};





// Main function
const getUserDetails = async (req, res, next) => {
  try {
    const { sAuthToken } = req.body;

    // 1. Validate the auth token
    if (!sAuthToken) {
      return sendError(res, "Auth token is required", 400, "MISSING_AUTH_TOKEN");
    }

    // Validate token and get user details
    validateAuthToken(sAuthToken, (err, user) => {
      if (err) return sendError(res, err.message, 401, "INVALID_AUTH_TOKEN");

      // 2. Get user details
      getUserDetailsFromDB(user.user_id, (err, userDetails) => {
        if (err) return sendError(res, err.message, 404, "USER_NOT_FOUND");
          
        // 2.a Get user settings
  getUserSettingsFromDB(user.user_id, (err, userSettings) => {
    if (err) return sendError(res, err.message, 404, "USER_SETTINGS_NOT_FOUND");

        // 3. Get user roles
        // getUserRoles(user.user_id, (err, roles) => {
        //   if (err) return sendError(res, "Error fetching roles", 500, "ROLES_FETCH_ERROR");

        //   if (roles.length === 0) {
        //     return sendError(res, "No roles assigned. Please check with the admin.", 403, "NO_ROLES_ASSIGNED");
        //   }

          // 4. Get tiles assigned to roles
          // getRoleTiles(user.user_id, (err, roleTiles) => {
          //   if (err) return sendError(res, "Error fetching role tiles", 500, "TILES_FETCH_ERROR");

          //   // Organize tiles by role
          //   const tilesByRole = roles.map(role => {
          //     return { 
          //       tiles: roleTiles
          //     };
          //   });

            // 5. Get notifications
            getUserNotifications(user.user_id, (err, notifications) => {
              if (err) return sendError(res, "Error fetching notifications", 500, "NOTIFICATIONS_FETCH_ERROR");

              // Prepare final merged data
              const mergedUserData = {
                userdetails: userDetails,  // basic user details
                 usersettings: userSettings,
                notifications: notifications,  // user notifications
                selectedKey: "Dashboard",  // hardcoded
                // menutiles: fnCreateMenutileStructure(tilesByRole),    // role tiles associated with each role
              };

              return sendSuccess(res, "Welcome back! Your dashboard is ready.", mergedUserData);
            });
          // });
        // });
      });
    });
    });

  } catch (error) {
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};

const getUserSettingsFromDB2 = (user_id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM prav_ai_user_settings
      WHERE user_id = $1
    `;

    db.query(query, [user_id], (err, results) => {
      if (err) return reject(err);
      if (results.rows.length === 0)
        return reject(new Error("User Related Settings not found"));

      resolve(results.rows[0]);
    });
  });
};
const fetchUserSettingsController = async (req, res, next) => {
  try {
    const { sAuthToken } = req.body;

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

    // 1️⃣ Get main user settings
    const baseUserSettings = await getUserSettingsFromDB2(user.user_id);

    // 2️⃣ Get ExpenseMood + PaymentMode
    const expenseQuery = `
      SELECT * ,true AS showdelete
      FROM prav_ai_user_expense_config
      WHERE user_id = $1 
      AND expense_setting_type = ANY($2)
    `;

    const expenseResult = await db.query(expenseQuery, [
      user.user_id,
      ["ExpenseMood", "PaymentMode"]
    ]);

    // 3️⃣ Add new properties inside userSettings
    baseUserSettings.ExpenseMood = [
         { name: "Normal", showdelete: false }
    ];
    baseUserSettings.PaymentMode = [ 
          { name:"Credit / Debit Card",showdelete: false},
          { name:"UPI / Wallet / Bank Transfer",showdelete: false},
          { name:"Cash",showdelete: false},];

    expenseResult.rows.forEach(row => {
      if (row.expense_setting_type === "ExpenseMood") {
        baseUserSettings.ExpenseMood.push(row);
      } else if (row.expense_setting_type === "PaymentMode") {
        baseUserSettings.PaymentMode.push(row);
      }
    });

    return sendSuccess(res, "User Settings Successfully", 
      baseUserSettings
    );

  } catch (error) {
    console.error("Error:", error);
    return sendError(res, error.message || "Internal server error", 500, "SERVER_ERROR");
  }
};
const saveUserSettingController = async (req, res) => {
  const client = await db.connect();

  try {
    const {
      sAuthToken,
      ExpenseMood = [],
      PaymentMode = [],
      ...settings
    } = req.body;

    /* 1️⃣ AUTH CHECK */
    const authQuery = `
      SELECT user_id
      FROM prav_ai_users
      WHERE auth_token = $1
    `;
    const authResult = await client.query(authQuery, [sAuthToken]);

    if (authResult.rows.length === 0) {
      return sendError(res, "User auth expired. Please login again", 401, "AUTH_EXPIRED");
    }

    const userId = authResult.rows[0].user_id;

    await client.query("BEGIN");

   /* =====================================================
   2️⃣ CREATE SETTINGS ROW IF NOT EXISTS
===================================================== */

const checkSettings = await client.query(
  `SELECT 1 FROM prav_ai_user_settings WHERE user_id = $1`,
  [userId]
);

if (checkSettings.rowCount === 0) {
  await client.query(
    `INSERT INTO prav_ai_user_settings (user_id, created_at, created_by)
     VALUES ($1, NOW(), $1)`,
    [userId]
  );
}

    /* =====================================================
       3️⃣ UPDATE USER SETTINGS
    ===================================================== */

    await client.query(`
      UPDATE prav_ai_user_settings SET
        date_format = $1,
        datetime_format = $2,
        theme_preference = $3,
        user_language = $4,
        user_notification_daily_summary = $5,
        user_notification_high_exp_alert = $6,
        user_notification_monthly_report = $7,
        user_notification_payment_reminder = $8,
        user_notification_auto_backup = $9,
        user_notification_offline_mode = $10,
        user_expense_monthly_budget = $11,
        user_expense_budget_warning_pct = $12,
        user_expense_default = $13,
        user_expense_enable_budget_alert = $14,
        user_expense_recurring = $15,
        user_expense_default_category = $16,
        user_health_water_min = $17,
        user_health_water_max = $18,
        user_health_water_reminder_frequency = $19,
        user_health_water_low_intake_notification = $20,
        user_health_sleep_min = $21,
        user_health_sleep_max = $22,
        user_health_sleep_time = $23,
        user_health_wake_up_time = $24,
        user_health_low_sleep_alert = $25,
        user_health_sleep_alert_time = $26,
        user_health_steps_goal = $27,
        user_health_steps_check_interval = $28,
        updated_at = NOW(),
        updated_by = $29
      WHERE user_id = $30
    `, [
      settings.date_format,
      settings.datetime_format,
      settings.theme_preference,
      settings.user_language,
      settings.user_notification_daily_summary,
      settings.user_notification_high_exp_alert,
      settings.user_notification_monthly_report,
      settings.user_notification_payment_reminder,
      settings.user_notification_auto_backup,
      settings.user_notification_offline_mode,
      settings.user_expense_monthly_budget,
      settings.user_expense_budget_warning_pct,
      settings.user_expense_default,
      settings.user_expense_enable_budget_alert,
      settings.user_expense_recurring,
      settings.user_expense_default_category,
      settings.user_health_water_min,
      settings.user_health_water_max,
      settings.user_health_water_reminder_frequency,
      settings.user_health_water_low_intake_notification,
      settings.user_health_sleep_min,
      settings.user_health_sleep_max,
      settings.user_health_sleep_time,
      settings.user_health_wake_up_time,
      settings.user_health_low_sleep_alert,
      settings.user_health_sleep_alert_time,
      settings.user_health_steps_goal,
      settings.user_health_steps_check_interval,
      userId,
      userId
    ]);

    /* =====================================================
       4️⃣ SYNC FUNCTION (UPSERT + AUTO CLEANUP)
    ===================================================== */

    const syncConfig = async (dataArray, type) => {

      // Filter only active rows
      const validRows = dataArray.filter(x => x.name && x.name.trim() !== "");

      if (validRows.length > 0) {

        // 🔥 BULK UPSERT
        const values = [];
        const placeholders = validRows.map((item, index) => {
          const base = index * 4;
          values.push(userId, type, item.name.trim(), item.name.trim());
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
        }).join(",");

       await client.query(`
  INSERT INTO prav_ai_user_expense_config
    (user_id, expense_setting_type, name, key)
  SELECT * FROM (VALUES ${placeholders}) 
    AS v(user_id, expense_setting_type, name, key)
  WHERE NOT EXISTS (
    SELECT 1 FROM prav_ai_user_expense_config t
    WHERE t.user_id = v.user_id
      AND t.expense_setting_type = v.expense_setting_type
      AND t.name = v.name
  )
`, values);
      }

      // 🔥 AUTO CLEANUP (DELETE missing rows)
      const names = validRows.map(r => r.name.trim());

      if (names.length > 0) {
        await client.query(`
          DELETE FROM prav_ai_user_expense_config
          WHERE user_id = $1
          AND expense_setting_type = $2
          AND name NOT IN (${names.map((_, i) => `$${i + 3}`).join(",")})
        `, [userId, type, ...names]);
      } else {
        // If empty array → delete all of that type
        await client.query(`
          DELETE FROM prav_ai_user_expense_config
          WHERE user_id = $1
          AND expense_setting_type = $2
        `, [userId, type]);
      }
    };

    /* =====================================================
       5️⃣ RUN SYNC FOR BOTH TYPES
    ===================================================== */

    await syncConfig(ExpenseMood, "ExpenseMood");
    await syncConfig(PaymentMode, "PaymentMode");

    await client.query("COMMIT");

    return sendSuccess(res, "User settings Saved Successfully 🚀");

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving user settings:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  } finally {
    client.release();
  }
};



const getAllUsersListController = async (req, res) => {
  try {
    /* =====================================================
       1️⃣ GET ALL USERS WITH SUBSCRIPTION DETAILS
    ===================================================== */
    const usersResult = await db.query(`
      SELECT 
        u.id,
        u.user_id,
        u.initial,
        u.phone_number AS mobilenumber,
        u.first_name,
        u.last_name,
        u.username,
        u.userplan,
        u.email,
        u.status,
        u.password_hash AS password,
        u.isadmin,
        s.subscription_amount,
        s.userplan AS subscription_plan,
        s.payment_screenshot,
        s.payment_screenshot_type
      FROM prav_ai_users u
      LEFT JOIN prav_ai_user_subscriptions s
        ON u.user_id = s.user_id
      ORDER BY u.id DESC
    `);

    let users = usersResult.rows;

    if (users.length === 0) {
      return sendError(res, "No Users List loaded", 500);
    }

    // Convert payment_screenshot to Base64 for frontend display
    users = users.map(user => {
      if (user.payment_screenshot) {
        const mimeType = user.payment_screenshot_type || 'image/png'; // default to png
        const base64Image = user.payment_screenshot.toString('base64');
        user.payment_screenshot = `data:${mimeType};base64,${base64Image}`;
      } else {
        user.payment_screenshot = null;
      }
      return user;
    });

    return sendSuccess(
      res,
      "Users List loaded Successfully",
      users
    );

  } catch (error) {
    console.error("Get users error:", error);
    return sendError(res, "Internal server error", 500);
  }
};
const getAllUsersListController_BK = async (req, res) => {
  try {
    /* =====================================================
       1️⃣ GET ALL USERS
    ===================================================== */
    const usersResult = await db.query(`
      SELECT id, user_id,initial,phone_number as mobilenumber ,first_name, last_name, username ,userplan,email, status,password_hash as password
      ,isadmin FROM prav_ai_users
      ORDER BY id DESC
    `);

    const users = usersResult.rows;

    if (users.length === 0) {
      return sendError(res,"No Users List loaded", 500);
    }
 
     return sendSuccess(res, "Users List loaded Successfully", 
      users
    );

  } catch (error) {
    console.error("Get users error:", error);
    return sendError(res, "Internal server error", 500);
  }
};

 

module.exports = { getUserDetails ,fetchUserSettingsController,saveUserSettingController,getAllUsersListController};
