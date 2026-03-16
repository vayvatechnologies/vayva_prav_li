const { sendSuccess, sendError } = require('../../../utils/responseHelper');
const { checkUserAuthToken } = require('../../general/generalController');

const db = require('../../../utils/db');
  


const fetchCalenderEventsByDateController = async (req, res, next) => {
  try {
    const { sAuthToken, startDateTime,endDateTime,type } = req.body;

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
    let fetchCalenderQuery = ` SELECT * FROM public.prav_ai_users_CalenderEvents
      where user_id=$1 and START_DATE >= $2
    AND END_DATE   <= $3 and flagname=$4
    AND IS_ACTIVE = 'Y' `;
    const queryParams = [user.user_id,startDateTime,endDateTime,type];
    const expenseResult = await db.query(fetchCalenderQuery, queryParams);

    if (expenseResult.rows.length === 0) {
      return sendSuccess(res, "No Detail Found...", {});
    }

    return sendSuccess(res, "Detail Fetched Successfully", expenseResult.rows);

  } catch (error) {
    console.error("Error:", error);
    return sendError(res, "Internal server error : "+error.message, 500, "SERVER_ERROR");
  }
};
 

const saveCalendarEventController = async (req, res) => {
  try {
    const {
      sAuthToken, id, flagname, title, description, status,
      priority_type, priority_text, label, notes, start_date, end_date
    } = req.body;

    const authResult = await checkUserAuthToken(sAuthToken);
    if (!authResult.success)
      return sendError(
        res,
        authResult.message,
        authResult.type === "SERVER_ERROR" ? 500 : 401,
        authResult.type
      );

    const { user_id } = authResult.user;

    // INSERT
    if (!id) {
      const query = `
        INSERT INTO public.prav_ai_users_calenderevents
        (user_id, flagname, title, description, status, priority_text,
         priority_type, label, notes, start_date, end_date,
         is_active, created_by, created_on)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Y',$12,NOW())
        RETURNING *
      `;

      const params = [
        user_id, flagname, title, description, status,
        priority_text, priority_type, label, notes,
        start_date, end_date, user_id
      ];

      const { rows } = await db.query(query, params);
      return sendSuccess(res, "Calendar event created successfully", rows[0]);
    }

    // UPDATE
    const query = `
      UPDATE public.prav_ai_users_calenderevents
      SET title=$1, description=$2, status=$3,
          priority_text=$4, priority_type=$5, label=$6,
          notes=$7, start_date=$8, end_date=$9,
            updated_on=NOW(),
          version_no = version_no + 1
      WHERE id=$11 AND user_id=$12 AND is_active='Y'
      RETURNING *
    `;

    const params = [
      title, description, status, priority_text, priority_type,
      label, notes, start_date, end_date,
       id, user_id
    ];

    const { rows } = await db.query(query, params);
    if (!rows.length)
      return sendError(res, "No record found to update", 404, "NOT_FOUND");

    return sendSuccess(res, "Event Updated Successfully", rows[0]);

  } catch (error) {
    console.error("Save Calendar Error:", error);
    return sendError(
      res,
      "Internal server error : " + error.message,
      500,
      "SERVER_ERROR"
    );
  }
};
const deleteCalendarEventController = async (req, res) => {
  try {
    const { sAuthToken, id, type } = req.body;

    // 1. Auth
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

    // 2. Delete query (HARD DELETE)
    const deleteQuery = `
      DELETE FROM public.prav_ai_users_calenderevents
      WHERE user_id = $1
        AND flagname = $2
        AND id = ANY($3::int[])
      RETURNING id
    `;
 
    const params = [
      user.user_id,
      type,
      id
    ];

    const result = await db.query(deleteQuery, params);

    if (result.rows.length === 0) {
      return sendError(
        res,
        "No records found to delete",
        404,
        "NOT_FOUND"
      );
    }

    return sendSuccess(res, "Events deleted successfully", {
      deletedCount: result.rowCount,
      deletedIds: result.rows.map(r => r.id)
    });

  } catch (error) {
    console.error("Delete Events Error:", error);
    return sendError(
      res,
      "Internal server error : " + error.message,
      500,
      "SERVER_ERROR"
    );
  }
};





module.exports = {fetchCalenderEventsByDateController,saveCalendarEventController,deleteCalendarEventController};
