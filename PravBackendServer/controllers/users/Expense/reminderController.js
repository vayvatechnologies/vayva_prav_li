const { sendSuccess, sendError } = require('../../../utils/responseHelper');
const db = require('../../../utils/db');
  


const deleteReminderbyTypeAndParentId = async (userId, parentId) => {
  try {
    const query = `
      DELETE FROM prav_ai_users_upcoming_reminders
      WHERE user_id = $1
        AND reminder_type = 'ExpenseCategory'
        AND reminder_parent_id = $2
    `;
    const result = await db.query(query, [userId, parentId]);
  } catch (error) {
    console.error("Error deleting recurring reminders:", error);
  }
};



// Helper function to mark recurring dates as removed in one query
const deleteReminderbyIds = async (userId, recurringDeleteDates) => {
  if (!recurringDeleteDates || recurringDeleteDates.length === 0) return;

  // Build parameter placeholders like $1, $2, $3 ...
  const placeholders = recurringDeleteDates.map((_, index) => `$${index + 2}`).join(', ');

  const query = `
    DELETE FROM prav_ai_users_upcoming_reminders
    WHERE user_id = $1
      AND reminder_type = 'ExpenseCategory'
      AND reminder_id IN (${placeholders})
  `;
  await db.query(query, [userId, ...recurringDeleteDates]);
};



/**
 * Insert recurring reminders into prav_ai_users_upcoming_reminders
 * @param {string} userId - User ID
 * @param {Array} recurringDates - Array of ISO date strings
 * @param {string} title - Category or suggestion to show in reminder title
 * @param {string} description - Optional notes/suggestions
 */
async function insertReminder(userId, recurringDates = [], title = "", description = "", parentID) {
  if (!recurringDates || recurringDates.length === 0) return;

  const insertQuery = `
    INSERT INTO prav_ai_users_upcoming_reminders (
      user_id, title, description, datetime, unread, priority, author_picture, reminder_type, reminder_parent_id, author_name, created_at
    ) VALUES ($1, $2, $3, $4, true, 'High', 'sap-icon://expense-report', 'ExpenseCategory', $5, 'Self', NOW())
  `;

  for (const date of recurringDates) {
    const dateObj = new Date(date.date).toISOString();
    await db.query(insertQuery, [userId, title, description || "", dateObj, parentID]);
  }
}



async function getReminderByParentId(userId, parentID) { // move to new file
  try {
    const expenseQuery = `
SELECT   e.reminder_id, 
to_char( e.datetime AT TIME ZONE u.timezone,
        u.dateformat
    ) AS date   ,
e.status
FROM prav_ai_users_upcoming_reminders e
JOIN prav_ai_users u ON e.user_id = u.user_id
WHERE e.user_id= $1 and e.status != 'Removed'  and e.reminder_type='ExpenseCategory' and e.reminder_parent_id=$2
 
order by e.datetime desc
    `;

    const result = await db.query(expenseQuery, [userId, parentID]);

    if (result.rows.length === 0) {
      return {
        success: true,
        data: [],
        message: "No Details Found."
      };
    }

    return {
      success: true,
      data: result.rows,
      message: "Reminder fetched successfully"
    };

  } catch (error) {
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
}

async function fetchUpcomingReminders(userId, limit = 10, offset = 0) {
  try {
    const query = `
      SELECT 
        e.reminder_id,
        e.title,
        e.description,
        to_char(
          e.datetime AT TIME ZONE u.timezone,
          u.dateformat
        ) AS datetime,
        e.status,
        e.unread,
        e.priority,
        e.author_name ,
        e.author_picture ,
        e.reminder_type,
        e.reminder_parent_id
      FROM prav_ai_users_upcoming_reminders e
      JOIN prav_ai_users u 
        ON e.user_id = u.user_id
      WHERE 
        e.user_id = $1
        AND e.status != 'Removed'
        AND e.datetime >= NOW()
      ORDER BY e.datetime ASC
      LIMIT $2 OFFSET $3
    `;
     const result = await db.query(query, [userId, limit, offset]);

    if (result.rows.length === 0) {
      return {
        success: true,
        data: [],
        message: "No upcoming reminders found."
      };
    }

    return {
      success: true,
      data: result.rows,
      message: "Upcoming reminders fetched successfully."
    };

  } catch (error) {
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
}


module.exports = { insertReminder,getReminderByParentId,deleteReminderbyTypeAndParentId,deleteReminderbyIds,fetchUpcomingReminders};
