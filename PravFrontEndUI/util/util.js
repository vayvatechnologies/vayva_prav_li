sap.ui.define([], function () {
    "use strict";

    return {
        PLANS: {
            Basic: "Basic",
            Standard: "Standard",
            Premium: "Premium",
            Platinum: "Platinum"
        },

        FEATURE_ACCESS: {
            CHAT_APPLICATION: ["Premium", "Platinum"],
            // Expense Tracker
            EXPORT_EXCEL: ["Standard", "Premium", "Platinum"],
            // Expense Overview
            PIE_CHART : ["Basic", "Standard", "Premium", "Platinum"],
            LINE_CHART : ["Basic", "Standard", "Premium", "Platinum"],
            CREATE_VIEW: ["Basic", "Standard", "Premium", "Platinum"],
            EXPENSE_OVERVIEW_DRILLBACK:["Basic", "Standard", "Premium", "Platinum"],
            EXPENSE_OVERVIEW_GROUPBBY_CATEGORY:["Basic", "Standard", "Premium", "Platinum"],
            EXPENSE_OVERVIEW_GROUPBBY_SUBCATEGORY:[ "Standard", "Premium", "Platinum"],
            EXPENSE_OVERVIEW_GROUPBBY_PAYMENTMODE:["Standard", "Premium", "Platinum"],
            HEALTH_TRACKER_CHART:["Premium", "Platinum"],
            // TO DO Planner
            TODO_CALENDAR_VIEW:["Premium", "Platinum"],
            // Calendar
            CALENDAR_TABLE_VIEW:["Premium", "Platinum"],
        }
    };
});
