const { sendSuccess, sendError } = require('../../../utils/responseHelper');
const db = require('../../../utils/db');
const { checkUserAuthToken } = require('../../general/generalController');
const { fetchUpcomingReminders} = require('../../users/Expense/ReminderController');
const { fetchUserExpenseSpendsChartDataByFilter,fetchUserDashboardUserSpends} = require('../../users/Expense/expenseDetailsController');
const { fetchHealthDetailByDate} = require('../../users/health/healthController');

 
const fetchDashboardDetails = async (req, res, next) => {
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
    // ✅ Continue business logic

    const upComingReminder = await fetchUpcomingReminders(user.user_id, 10, 0);
   const now = new Date();

const lastThreeMonthWeeklyChart =
  await fetchUserExpenseSpendsChartDataByFilter(
    user.user_id,
    new Date(now.getFullYear(), now.getMonth() - 2, 2).toISOString().slice(0,10),
    new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0,10)
  );

const expenseDashboardDetails =
  await fetchUserDashboardUserSpends(
    user.user_id,
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10),
    new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0,10)
  );
const userHealthDetail =
  await fetchHealthDetailByDate(
    user.user_id,
    new Date().toISOString().slice(0,10)
  );
    //const monthlyExpenseChartData = await fetchUserExpenseSpendsByFilter(user.user_id,'Monthly');
      
    const oUserDashboardDetail = {
      upcomingReminder:upComingReminder.data,
      userSpends: expenseDashboardDetails.data[0],
      monthlyExpenseChartData: lastThreeMonthWeeklyChart.data,
      healthDetail : userHealthDetail.data
    };

    return sendSuccess(  res, "Dashboard Details Fetched Successfully...", oUserDashboardDetail  );

  } catch (error) {
    console.error("Error:", error);
    return sendError(res, "Internal server error", 500, "SERVER_ERROR");
  }
};

 

module.exports = { fetchDashboardDetails};
