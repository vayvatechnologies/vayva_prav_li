// saveUserNotificationsController.js
const { sendSuccess, sendError } = require('../../../utils/responseHelper');
const { checkUserAuthToken } = require('../../general/generalController');
const db = require('../../../utils/db');
const saveUserNotificationsController = async (req, res, next) => {
  try {
    const {
      sAuthToken,
      notification_id,
      title,
      sub_title,
      description,
      icon,
      priority,
      notification_date,
      notification_expiry_at,
      unread // can be passed from frontend, optional
    } = req.body;

    // 1️⃣ Auth check
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

    // 2️⃣ UPSERT (create or update)
    const saveQuery = `
      INSERT INTO public.prav_ai_users_notifications (
        notification_id,
        user_id,
        title,
        sub_title,
        description,
        icon,
        priority,
        notification_date,
        notification_expiry_at,
        unread
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (notification_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        sub_title = EXCLUDED.sub_title,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        priority = EXCLUDED.priority,
        notification_date = EXCLUDED.notification_date,
        notification_expiry_at = EXCLUDED.notification_expiry_at,
        unread = EXCLUDED.unread,
        updated_at = NOW()
      RETURNING *;
    `;

    const queryParams = [
      notification_id || null,
      user.user_id,
      title,
      sub_title || null,
      description || null,
      icon || null,
      priority || null,
      notification_date || new Date(),
      notification_expiry_at || new Date(Date.now() + 24 * 60 * 60 * 1000),
      unread !== undefined ? unread : true // default true for new notification
    ];

    const result = await db.query(saveQuery, queryParams);

    return sendSuccess(
      res,
      "Notification saved successfully",
      result.rows[0]
    );

  } catch (error) {
    console.error("Error saving notification:", error);
    return sendError(res, "Internal server error - "+error.message, 500, "SERVER_ERROR");
  }
};


module.exports = { saveUserNotificationsController };
