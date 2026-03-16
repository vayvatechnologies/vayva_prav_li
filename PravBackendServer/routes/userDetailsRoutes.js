const express = require('express');
const router = express.Router();
const { getUserDetails,fetchUserSettingsController,saveUserSettingController,getAllUsersListController } = require('../controllers/users/userDetailsController');
const { validateUserDetailsReuests  } = require('../middlewares/users/userDetailsValidate');

// Route: /api/v1/data/login
router.post('/getUserDetails', validateUserDetailsReuests , getUserDetails);

router.post('/fetchUserSetting', validateUserDetailsReuests , fetchUserSettingsController);

router.post('/saveUserSetting', validateUserDetailsReuests , saveUserSettingController);

//admin
router.post('/getAllUsersList', validateUserDetailsReuests , getAllUsersListController);





const { getExpenseDetails,getCreateExpenseDetails ,saveExpenseSpend} = require('../controllers/users/Expense/expenseDetailsController');
const { validateExpenseDetailsReuests , getCreateExpenseValidateRequests,saveExpenseSpendValidateRequests } = require('../middlewares/users/Expense/expenseDetailsValidate');

// Route: /api/v1/data/login
router.post('/getExpenseDetails', validateExpenseDetailsReuests , getExpenseDetails);
router.post('/getCreateExpense', getCreateExpenseValidateRequests , getCreateExpenseDetails);
router.post('/saveExpenseSpend', saveExpenseSpendValidateRequests , saveExpenseSpend);

  

const { getExpenseCategoriesByCategoryandSubcategoryController,getExpenseCategories,getCategoryLists,getSubCategorybyCategory,readExpenseCategoriesbyId,saveExpenseCategories ,deleteExpenseCategoryController} = require('../controllers/users/Expense/expenseCategoryController');
const { getExpenseCategoriesByCategoryandSubcategoryValidation,validateExpenseCategoryRequests,getCreateExpenseCategoryValidateRequests,insertExpenseCategoryValidateRequests ,deleteExpenseCategoryValidation } = require('../middlewares/users/Expense/expenseCategoryValidate');

// Route: /api/v1/data/login
router.post('/getExpenseCategories', validateExpenseCategoryRequests , getExpenseCategories);
router.post('/getUserCategory', validateExpenseCategoryRequests , getCategoryLists);
router.post('/getUserSubCategory', validateExpenseCategoryRequests , getSubCategorybyCategory);
router.post('/readExpenseCategoriesbyId', getCreateExpenseCategoryValidateRequests , readExpenseCategoriesbyId);
router.post('/saveExpenseCategories', insertExpenseCategoryValidateRequests , saveExpenseCategories);
router.post('/deleteExpenseCategory', deleteExpenseCategoryValidation , deleteExpenseCategoryController);
 router.post('/getExpenseCategoriesByCategoryandSubcategory', getExpenseCategoriesByCategoryandSubcategoryValidation , getExpenseCategoriesByCategoryandSubcategoryController);
 








const { fetchDashboardDetails } = require('../controllers/users/Expense/dashboardController');
const { fetchDashboardRequestValidate} = require('../middlewares/users/Expense/dashboardValidate');

// Route: /api/v1/data/login
router.post('/fetchDashboardDetails', fetchDashboardDetails , fetchDashboardRequestValidate);


const {saveHealthDetailValidate,fetchHealthDetailbyDateRequestValidate,fetchHealthDetailRequestValidate ,deleteHealthDetailRequestValidate} = require('../middlewares/users/health/healthValidate');
const { saveHealthDetailController,fetchHealthDetailbyDateRequestController,fetchHealthDetailController,deleteHealthDetailController} = require('../controllers/users/health/healthController');

// Route: /api/v1/data/login
router.post('/saveHealthDetail', saveHealthDetailController , saveHealthDetailValidate);
router.post('/getUserHealthHistroy', fetchHealthDetailController , fetchHealthDetailRequestValidate);
router.post('/deleteHealthDetail',deleteHealthDetailController , deleteHealthDetailRequestValidate);
router.post('/fetchHealthDetailbyDate', fetchHealthDetailbyDateRequestController , fetchHealthDetailbyDateRequestValidate);






const {fetchCalenderEventsByDateValidate,saveCalendarEventValidate,deleteCalenderEventsByIDValidate} = require('../middlewares/users/calendar/calendarValidate');
const { fetchCalenderEventsByDateController,saveCalendarEventController,deleteCalendarEventController} = require('../controllers/users/calendar/calendarController');
router.post('/fetchEventsbyDates', fetchCalenderEventsByDateController , fetchCalenderEventsByDateValidate);
router.post('/saveEvent', saveCalendarEventController , fetchCalenderEventsByDateValidate);
router.post('/deleteEventsByID', deleteCalendarEventController , deleteCalenderEventsByIDValidate);


const { saveUserNotificationsValidate} = require('../middlewares/users/userinfo/userNotificationValidate');
const { saveUserNotificationsController} = require('../controllers/users/userinfo/userNotificationController');

router.post('/saveUserNotifications', saveUserNotificationsController , saveUserNotificationsValidate);



module.exports = router;