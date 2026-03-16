const { sendSuccess, sendError } = require('../../../utils/responseHelper');
const { checkUserAuthToken } = require('../../general/generalController');

const db = require('../../../utils/db');
  


const fetchHealthDetailbyDateRequestController = async (req, res, next) => {
  try {
    const { sAuthToken, date } = req.body;

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

     
    // 4. Fetch expenses based on user_id and optional date filter
    let healthDetailQuery = ` SELECT * FROM public.prav_ai_user_health_status
      where user_id=$1 and date=$2 limit 1 `;

    const queryParams = [user.user_id, date];
    const expenseResult = await db.query(healthDetailQuery, queryParams);

    if (expenseResult.rows.length === 0) {
      return sendSuccess(res, "No Health Detail Found for this date...", {});
    }

    return sendSuccess(res, "Health Detail Fetched Successfully", expenseResult.rows);

  } catch (error) {
    console.error("Error:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};

async function fetchHealthDetailByDate(userId, date) {
  try {
     // 4. Fetch expenses based on user_id and optional date filter
    let healthDetailQuery = `SELECT
    watercurrent,
    watergoal,
    ROUND(LEAST(watercurrent * 100.0 / NULLIF(watergoal, 0), 100))::INT AS water_percentage,
    stepscurrent,
    stepsgoal,
    ROUND(LEAST(stepscurrent * 100.0 / NULLIF(stepsgoal, 0), 100))::INT AS steps_percentage,
    sleepcurrent,
    sleepgoal,
    ROUND(LEAST(sleepcurrent * 100.0 / NULLIF(sleepgoal, 0), 100))::INT AS sleep_percentage
FROM public.prav_ai_user_health_status
WHERE user_id = $1 AND date = $2

UNION ALL

SELECT
    0, 0, 0,
    0, 0, 0,
    0, 0, 0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.prav_ai_user_health_status
    WHERE user_id = $1 AND date = $2
)
LIMIT 1;

 `;

    const queryParams = [userId, date];
    const result = await db.query(healthDetailQuery, queryParams);

    if (result.rows.length === 0) {
      return {
        success: true,
        data: null,
        message: "No Details Found."
      };
    }

    return {
      success: true,
      data: result.rows[0],
      message: "Health Detail fetched successfully"
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
const saveHealthDetailController = async (req, res, next) => {
  try {
    const { sAuthToken, date, water, steps, sleep } = req.body;

    // 1. Auth check
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
 

// 1. Fetch user settings
const settingsQuery = `
  SELECT 
    user_health_water_max,
    user_health_sleep_max,
    user_health_steps_goal
  FROM public.prav_ai_user_settings
  WHERE user_id = $1
  LIMIT 1;
`;

const settingsResult = await db.query(settingsQuery, [user.user_id]);
const settings = settingsResult.rows[0] || {};
//console.log(settings)
//console.log(settings.user_health_water_max)
// 2. Prepare values
const waterVal = Math.round(Number(water) || 0);
const stepsVal = Math.round(Number(steps) || 0);
const sleepVal = Math.round(Number(sleep) || 0);

const waterGoal = Math.round(Number(settings.user_health_water_max) || 0);
const sleepGoal = Math.round(Number(settings.user_health_sleep_max) || 0);
const stepsGoal = Math.round(Number(settings.user_health_steps_goal) || 0);

// 3. UPSERT query
const saveQuery = `
  INSERT INTO public.prav_ai_user_health_status (
    user_id, date,
    watercurrent, stepscurrent, sleepcurrent,
    watergoal, sleepgoal, stepsgoal
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    watercurrent = EXCLUDED.watercurrent,
    stepscurrent = EXCLUDED.stepscurrent,
    sleepcurrent = EXCLUDED.sleepcurrent,
    watergoal = EXCLUDED.watergoal,
    sleepgoal = EXCLUDED.sleepgoal,
    stepsgoal = EXCLUDED.stepsgoal
  RETURNING *;
`;

const queryParams = [
  user.user_id,
  date,
  waterVal,
  stepsVal,
  sleepVal,
  waterGoal,
  sleepGoal,
  stepsGoal
];


    const result = await db.query(saveQuery, queryParams);

    return sendSuccess(
      res,
      "Health detail Saved successfully",
      result.rows[0]
    );

  } catch (error) {
    console.error("Error:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};



const fetchHealthDetailController = async (req, res, next) => {
  try {
    const { sAuthToken } = req.body;

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

    // 4. Fetch expenses based on user_id and optional date filter
    let healthDetailQuery = ` SELECT id, date,watercurrent,
    watergoal,
    ROUND(LEAST(watercurrent * 100.0 / NULLIF(watergoal, 0), 100))::INT AS water_percentage,
    stepscurrent,
    stepsgoal,
    ROUND(LEAST(stepscurrent * 100.0 / NULLIF(stepsgoal, 0), 100))::INT AS steps_percentage,
    sleepcurrent,
    sleepgoal,
    ROUND(LEAST(sleepcurrent * 100.0 / NULLIF(sleepgoal, 0), 100))::INT AS sleep_percentage
     FROM public.prav_ai_user_health_status
      where user_id=$1 order by date desc limit 500 `;

    const queryParams = [user.user_id];
    const expenseResult = await db.query(healthDetailQuery, queryParams);

    if (expenseResult.rows.length === 0) {
      return sendSuccess(res, "No Health Record Found ...", {});
    }

    return sendSuccess(res, "Health Records Fetched Successfully", expenseResult.rows);

  } catch (error) {
    console.error("Error:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};

const deleteHealthDetailController = async (req, res, next) => {
  try {
    const { sAuthToken, id } = req.body;

    // 1. Validate input
    if (!sAuthToken || !id) {
      return sendError(res, "Auth token and id are required", 400, "VALIDATION_ERROR");
    }

    // 2. Check auth token
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

    // 3. Delete record (user safety check included)
    const deleteQuery = `
      DELETE FROM public.prav_ai_user_health_status
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const deleteResult = await db.query(deleteQuery, [id, user.user_id]);

    // 4. If nothing deleted
    if (deleteResult.rowCount === 0) {
      return sendError(
        res,
        "Health record not found or unauthorized",
        404,
        "NOT_FOUND"
      );
    }

    // 5. Success
    return sendSuccess(res, "Health record deleted successfully", {
      id: deleteResult.rows[0].id
    });

  } catch (error) {
    console.error("Delete Health Detail Error:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};

// saveHealthDetailController,fetchHealthDetailController,
module.exports = { saveHealthDetailController,fetchHealthDetailbyDateRequestController,fetchHealthDetailByDate ,fetchHealthDetailController,deleteHealthDetailController};
