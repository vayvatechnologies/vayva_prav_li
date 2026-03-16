sap.ui.define([
    'sap/ui/demo/toolpageapp/controller/BaseController',
    "sap/ui/demo/toolpageapp/model/models",
    'sap/ui/model/json/JSONModel',
    'sap/ui/Device',
    'sap/ui/demo/toolpageapp/model/formatter',
    'sap/ui/core/BusyIndicator',
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
], function (BaseController, models, JSONModel, Device, formatter, BusyIndicator, Fragment, MessageToast, MessageBox) {
    "use strict";
    var oGlobalModel, oRouter
    return BaseController.extend("sap.ui.demo.toolpageapp.controller.user.expense.ExpenseCategory", {
        formatter: formatter,

        onInit: function () {
            this.getView().setModel(this.getOwnerComponent().getModel("oGlobalAIModel"), "oGlobalAIModel");
            oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oGlobalModel = this.getView().getModel("oGlobalAIModel");
            oRouter.getRoute("ExpenseCategory").attachMatched(this.onObjectMatched, this);
        },
        onObjectMatched: function () {
            BusyIndicator.hide();
            if (!oGlobalModel.getProperty("/ApplicationConfigurations/isUserDetailsLoaded") ||
                !oGlobalModel.getProperty("/ApplicationConfigurations/isApplicationDetailsLoaded")) {
                this.fnCkUserLoggedIn(oRouter,"home")
                return;
            }

            this.fnResetExpenseCategory();
         },

        getUserAuthToken: function () {
            const oToken = localStorage.getItem("pravAPP_Authtoken_forService");

            // const oToken = sap.ui.getCore().getModel("oUserExpenseModel").getData().auth_token;
            if (!oToken) {
                this.fnCkUserLoggedIn(oRouter,"home")
            }
            return oToken;
        },
        fnResetExpenseCategory: function () {
            
        this.onResetFilter()
        this.fnGetFilterCategory()

            var that = this;
            const oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, "oUserExpeseCategoryModel");
            const sAuthToken = that.getUserAuthToken();

            if (sAuthToken) {
                BusyIndicator.show(0);

                const oPayload = {
                    sAuthToken: sAuthToken
                };

                $.ajax({
                    url: "/api/v1/userDetail/getExpenseCategories",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();

                        // Load data into model
                        const oUserExpensesModel = new sap.ui.model.json.JSONModel(oResponse.data);
                        that.getView().setModel(oUserExpensesModel, "oUserExpeseCategoryModel");

                        //that.createMessageStrip(true, oResponse.message, "Success");
                        MessageToast.show(oResponse.message)
                    },
                    error: function (xhr) {
                        BusyIndicator.hide();

                        let oError = {};
                        try {
                            oError = JSON.parse(xhr.responseText);
                        } catch (err) { }

                        that.createMessageStrip(true, oError.message || "Error occurred", "Error");
                    }
                });
            }
        },
        onApplyFilter: function () {
            // Get references to the ComboBoxes
            var oCategoryComboBox = this.byId("filterCategory");
            var oSubCategoryComboBox = this.byId("filterSubCategory");

            // Get selected keys
            var sCategory = oCategoryComboBox.getSelectedKey();
            var sSubCategory = oSubCategoryComboBox.getSelectedKey();

            // Get the table
            var oTable = this.byId("idUserExpenseCategories");

            // Create an array to hold the filters
            var aFilters = [];

            // Add category filter if selected
            if (sCategory) {
                aFilters.push(new sap.ui.model.Filter("category", sap.ui.model.FilterOperator.EQ, sCategory));
            }

            // Add subcategory filter if selected
            if (sSubCategory) {
                aFilters.push(new sap.ui.model.Filter("subcategory", sap.ui.model.FilterOperator.EQ, sSubCategory));
            }

            // Get the binding of the table items
            var oBinding = oTable.getBinding("items");

            // Apply the filters
            oBinding.filter(aFilters);
        },
        onResetFilter: function () {
            // Get references to the ComboBoxes
            var oCategoryComboBox = this.byId("filterCategory");
            var oSubCategoryComboBox = this.byId("filterSubCategory");

            // Clear selected keys
            oCategoryComboBox.setSelectedKey("");
            oSubCategoryComboBox.setSelectedKey("");

            // Get the table
            var oTable = this.byId("idUserExpenseCategories");

            // Get the binding of the table items
            var oBinding = oTable.getBinding("items");

            // Remove all filters
            if(oBinding){
                oBinding.filter([]);
            }
        },
        fnGetFilterCategory: function () {
            var that = this;
            const oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, "categoryModel");
            const sAuthToken = that.getUserAuthToken();

            if (sAuthToken) {
                BusyIndicator.show(0);

                const oPayload = {
                    sAuthToken: sAuthToken
                };

                $.ajax({
                    url: "/api/v1/userDetail/getUserCategory",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();

                        // Load data into model
                        const categoryModel = new sap.ui.model.json.JSONModel(oResponse.data);
                        that.getView().setModel(categoryModel, "categoryModel");

                        // that.createMessageStrip(true, oResponse.message, "Success");
                    },
                    error: function (xhr) {
                        BusyIndicator.hide();

                        let oError = {};
                        try {
                            oError = JSON.parse(xhr.responseText);
                        } catch (err) { }

                        //  that.createMessageStrip(true, oError.message || "Error occurred", "Error");
                    }
                });
            }
        },
        onCategoryChange: function () {
            var filterCategory = this.getView().byId("filterCategory").getSelectedKey()
            this.fnLoadSubcategory(filterCategory)
        },
        onCategoryInputChange: function () {
            const data = this.getView().getModel("oGetExpenseCategoryModel").getData();
            const c = data.expenseCategory;

            // ---------------------------------------
            // 1. HARD VALIDATIONS (stop immediately)
            // ---------------------------------------
            var sCategory = (c.category && c.category.trim())
                ? c.category.trim()
                : (c.categoryInput && c.categoryInput.trim())
                    ? c.categoryInput.trim()
                    : "";

            this.fnLoadSubcategory(sCategory)
        },
        fnLoadSubcategory: function (filterCategory) {
            var that = this;
            const oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, "subcategoryModel");
            const sAuthToken = that.getUserAuthToken();

            if (sAuthToken) {
                // BusyIndicator.show(0);

                const oPayload = {
                    sAuthToken: sAuthToken,
                    category: filterCategory
                };

                $.ajax({
                    url: "/api/v1/userDetail/getUserSubCategory",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();

                        // Load data into model
                        const categoryModel = new sap.ui.model.json.JSONModel(oResponse.data);
                        that.getView().setModel(categoryModel, "subcategoryModel");

                        // that.createMessageStrip(true, oResponse.message, "Success");
                    },
                    error: function (xhr) {
                        BusyIndicator.hide();

                        let oError = {};
                        try {
                            oError = JSON.parse(xhr.responseText);
                        } catch (err) { }

                        //  that.createMessageStrip(true, oError.message || "Error occurred", "Error");
                    }
                });
            }
        },
        fnGetExpenseCategorybyID: function (isFragmentMode, oSelId) {
            var that = this;
            const oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, "oGetExpenseCategoryModel");
            const sAuthToken = that.getUserAuthToken();

            if (sAuthToken) {
                BusyIndicator.show(0);

                const oPayload = {
                    sAuthToken: sAuthToken,
                    categoryID: oSelId
                };

                $.ajax({
                    url: "/api/v1/userDetail/readExpenseCategoriesbyId",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();

                        // Load data into model
                        const categoryModel = new sap.ui.model.json.JSONModel(oResponse.data);
                        var oExpenseCategory = oResponse.data.expenseCategory;
                        oExpenseCategory.status = oExpenseCategory.status==='Active'
                        //oExpenseCategory.recurring = oExpenseCategory.status==='Active'
                        oExpenseCategory.categoryInput = oExpenseCategory.category
                        oExpenseCategory.subcategoryInput = oExpenseCategory.subcategory
                        var oRecurringDays = oExpenseCategory.recurring_days_of_week
                        var oRecurranceDays = {
                            days: {
                                sun: false,
                                mon: false,
                                tue: false,
                                wed: false,
                                thu: false,
                                fri: false,
                                sat: false
                            }
                        };
                        if (oExpenseCategory.recurringtype === "Weekly") {
                            if (Array.isArray(oRecurringDays)) {
                                oRecurringDays.forEach(day => {
                                    if (oRecurranceDays.days[day] !== undefined) {
                                        oRecurranceDays.days[day] = true;
                                    }
                                });
                            }
                        }



                        var oRecurrance = {

                            // Weekly
                            days: oRecurranceDays.days,
                            // End settings
                            endByEnabled: oExpenseCategory.end_date_range === "EndBy",
                            endAfterEnabled: oExpenseCategory.end_date_range === "EndAfter",

                            // Preview list
                            preview: oResponse.data.recurringDates,
                            deletedRecurringDates: []
                        };

                        var ocategoryModel = new sap.ui.model.json.JSONModel({
                            fragMode: isFragmentMode,
                            paymentModes: oResponse.data.UserPaymentModes,
                            expenseCategory: oExpenseCategory, //Tab 1
                            recurrence: oRecurrance //Tab2
                        });


                        that.getView().setModel(ocategoryModel, "oGetExpenseCategoryModel");

                        that.onOpenDialog();
                        that.onSpendLimitChange()
                        MessageToast.show(oResponse.message)
                    },
                    error: function (xhr) {
                        BusyIndicator.hide();

                        let oError = {};
                        try {
                            oError = JSON.parse(xhr.responseText);
                        } catch (err) { }

                        that.createMessageStrip(true, oError.message || "Unable to Fetch Details.Error occurred", "Error");
                    }
                });
            }
        },

        //Open Dialog
        onAddExpenseCategory: function () {
            this.fnGetExpenseCategorybyID("Create", "");
        },
        onEditPress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("oUserExpeseCategoryModel");
            const oData = oContext.getObject();
            const id = oData.id;
            this.fnGetExpenseCategorybyID("Edit", id);
        },
        onDeletePress: function (oEvent) {
    var that = this;

    sap.m.MessageBox.confirm(
        "Are you sure you want to delete the selected expense category?",
        {
            title: "Confirm Deletion",
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            emphasizedAction: sap.m.MessageBox.Action.YES,
            onClose: function (oAction) {
                if (oAction === sap.m.MessageBox.Action.YES) {
                    that.fnDeleteExpenseCategories(oEvent); // call your delete function
                }
            }
        }
    );
},
        fnDeleteExpenseCategories: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("oUserExpeseCategoryModel");
            const oData = oContext.getObject();
            const id = oData.id;
             var that = this;
          
            const sAuthToken = that.getUserAuthToken();

            if (sAuthToken) {
                // BusyIndicator.show(0);

                const oPayload = {
                    sAuthToken: sAuthToken,
                    expenseCategoryId:oData.id
                };

                $.ajax({
                    url: "/api/v1/userDetail/deleteExpenseCategory",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();

                        MessageBox.success(oResponse.message);

                        that.createMessageStrip(true, oResponse.message, "Success");
                        that.fnResetExpenseCategory()
                    },
                    error: function (xhr) {
                        BusyIndicator.hide();

                        let oError = {};
                        try {
                            oError = JSON.parse(xhr.responseText);
                        } catch (err) { }

                        MessageBox.error(oError.message);
                        that.createMessageStrip(true, oError.message || "Error occurred", "Error");
                    }
                });
            }
        },
        onDeletePreview: function (oEvent) {
            const oButton = oEvent.getSource();

            // Walk up to CustomListItem
            const oItem = oButton.getParent().getParent(); // HBox → CustomListItem

            if (!oItem) {
                MessageBox.error("Unable to identify list item.");
                return;
            }

            const oCtx = oItem.getBindingContext("oGetExpenseCategoryModel");

            if (!oCtx) {
                MessageBox.error("Binding context not found.");
                return;
            }

            const oRowData = oCtx.getObject();

            if (!oRowData || !oRowData.reminder_id) {
                MessageBox.error("Invalid row data.");
                return;
            }

            const oModel = this.getView().getModel("oGetExpenseCategoryModel");

            // Push deleted ID
            let aDeleted = oModel.getProperty("/recurrence/deletedRecurringDates") || [];
            if (!aDeleted.includes(oRowData.reminder_id)) {
                aDeleted.push(oRowData.reminder_id);
            }
            oModel.setProperty("/recurrence/deletedRecurringDates", aDeleted);

            // Remove from preview
            const sPath = oCtx.getPath(); // /recurrence/preview/2
            const iIndex = parseInt(sPath.split("/").pop(), 10);

            let aPreview = oModel.getProperty("/recurrence/preview");
            aPreview.splice(iIndex, 1);
            oModel.setProperty("/recurrence/preview", aPreview);
        }
        ,
        onSpendLimitChange: function (oEvent) {

            const oModel = this.getView().getModel("oGetExpenseCategoryModel");
            let month = oModel.getProperty("/expenseCategory/spend_limit_month");

            // Convert to number safely
            month = Number(month);

            if (isNaN(month)) return; // ignore invalid input

            const week = month / 4.33; // average weeks in a month
            const quarter = month * 3;
            const year = month * 12;

            // Use toFixed after conversion
            oModel.setProperty("/expenseCategory/weeklimit", week.toFixed(2));
            oModel.setProperty("/expenseCategory/monthlimit", month.toFixed(2));
            oModel.setProperty("/expenseCategory/quarterlimit", quarter.toFixed(2));
            oModel.setProperty("/expenseCategory/yearlimit", year.toFixed(2));
        }, 
        fnGetTodayDate:function(){
            // Get today's date as a string without time
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
const dd = String(today.getDate()).padStart(2, '0');

return `${yyyy}-${mm}-${dd}`;
        },
        onChangeRecurring: function(oEvent) {
    const oModel = this.getView().getModel("oGetExpenseCategoryModel");
    const bRecurring = oEvent.getParameter("state"); // true if switch is ON

    const today = this.fnGetTodayDate()

    // Update expenseCategory fields
   // oModel.setProperty("/expenseCategory/recurring", bRecurring);

    if (bRecurring) {        
        oModel.setProperty("/expenseCategory/recurringtype", "Daily");
        oModel.setProperty("/expenseCategory/recurring_startdate", today); // Start Date = today
        oModel.setProperty("/expenseCategory/recurringinterval", 1);       // Daily interval = 1
        oModel.setProperty("/recurrence/endAfterEnabled", true);           // Enable End After
        oModel.setProperty("/expenseCategory/end_interval", 5);            // End after 5 occurrences
    } else {
        // Optional: reset fields if recurring is turned off
        oModel.setProperty("/expenseCategory/recurringtype", "Daily");
        oModel.setProperty("/expenseCategory/recurring_startdate", null);
        oModel.setProperty("/expenseCategory/recurringinterval", null);
        oModel.setProperty("/recurrence/endAfterEnabled", false);
        oModel.setProperty("/expenseCategory/end_interval", null);
    }
    this.onPreviewRecurrence()
},

         onPreviewRecurrence: function () {
            const oModel = this.getView().getModel("oGetExpenseCategoryModel");
            const r = oModel.getProperty("/recurrence");
            const c = oModel.getProperty("/expenseCategory");
            // Move all items to deleteRecurring

            const aPreview = oModel.getProperty("/recurrence/preview") || [];

            if (aPreview.length > 0) {
                let aDeleted = oModel.getProperty("/recurrence/deletedRecurringDates") || [];

                aPreview.forEach(item => {
                    if (item.reminder_id && !aDeleted.includes(item.reminder_id)) {
                        aDeleted.push(item.reminder_id);
                    }
                });

                oModel.setProperty("/recurrence/deletedRecurringDates", aDeleted);

                // Optional: clear preview list
                oModel.setProperty("/recurrence/preview", []);
            }

            // Clear if recurring is OFF
            if (!c.recurring) {
                oModel.setProperty("/recurrence/preview", []);
                return;
            }

            if (!c.recurring_startdate) {
                oModel.setProperty("/recurrence/preview", []);
                return;
            }
            let oStartDate = this.getView().byId("ExpenseCategoriesStratDate").getValue()

            const startDate = new Date(oStartDate);
            let endDate = null;
            let maxOccurrences = null;
            let oEnddate = this.getView().byId("oExpenseCategoryEndDate").getValue()

            // ---------------------- END SETTINGS ----------------------
            if (r.noEnd) {
                endDate = new Date(startDate);
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else if (r.endByEnabled && oEnddate) {
                endDate = new Date(oEnddate);
            } else if (r.endAfterEnabled && c.end_interval > 0) {
                maxOccurrences = parseInt(c.end_interval);
            } else {
                oModel.setProperty("/recurrence/preview", []);
                return;
            }

            const interval = parseInt(c.recurringinterval) || 1;
            const preview = [];
            let count = 0;
            let current = new Date(startDate);
            // ==========================================================
            // DAILY
            // ==========================================================
            if (c.recurringtype === "Daily") {

                while (true) {
                    if (maxOccurrences && count >= maxOccurrences) break;
                    if (endDate && current > endDate) break;

                    preview.push({ date: current.toDateString() });

                    current = new Date(current);
                    current.setDate(current.getDate() + interval);
                    count++;
                }
            }

            // ==========================================================
            // WEEKLY
            // ==========================================================
            if (c.recurringtype === "Weekly") {

                const selectedDays = Object.keys(r.days).filter(day => r.days[day]);

                if (selectedDays.length === 0) {
                    oModel.setProperty("/recurrence/preview", []);
                    return;
                }

                const dayToIndex = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

                while (true) {
                    if (maxOccurrences && count >= maxOccurrences) break;
                    if (endDate && current > endDate) break;

                    for (let d of selectedDays) {
                        let temp = new Date(current);
                        let targetDay = dayToIndex[d];

                        temp.setDate(temp.getDate() + (targetDay - temp.getDay() + 7) % 7);

                        // FIX: check before adding
                        if (endDate && temp > endDate) continue;
                        if (temp < startDate) continue;
                        if (maxOccurrences && count >= maxOccurrences) break;

                        preview.push({ date: temp.toDateString() });
                        count++;

                        if (maxOccurrences && count >= maxOccurrences) break;
                    }

                    current.setDate(current.getDate() + interval * 7);
                }
            }
            // ==========================================================
            // MONTHLY (supports multiple days) - FIXED LOGIC
            // ==========================================================
            if (c.recurringtype === "Monthly") {

                let days = String(c.recurring_day_of_month || "")
                    .split(",")
                    .map(s => parseInt(s.trim()))
                    .filter(n => n >= 1 && n <= 31);

                if (days.length === 0) {
                    oModel.setProperty("/recurrence/preview", []);
                    return;
                }

                // Month cursor ALWAYS starts from startDate month
                let monthCursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

                while (true) {
                    if (endDate && monthCursor > endDate) break;
                    if (maxOccurrences && count >= maxOccurrences) break;

                    for (let d of days) {
                        let temp = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), d);

                        // must be >= startDate
                        if (temp < startDate) continue;

                        // must be <= endDate
                        if (endDate && temp > endDate) continue;

                        preview.push({ date: temp.toDateString() });
                        count++;

                        if (maxOccurrences && count >= maxOccurrences) break;
                    }

                    monthCursor.setMonth(monthCursor.getMonth() + interval);
                }
            }


            oModel.setProperty("/recurrence/preview", preview);
        }
        ,


        onOpenDialog: function () {

            var oView = this.getView();

            if (!this.oCreateEditExpenseCategoryDialog) {
                this.oCreateEditExpenseCategoryDialog = Fragment.load({
                    id: oView.getId(),
                    name: "sap.ui.demo.toolpageapp.view.user.fragment.CreateExpenseCategory",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            

            this.oCreateEditExpenseCategoryDialog.then(function (oDialog) {
                oDialog.open();
                this._wizard = this.byId("DummyWizard");
            }.bind(this));

        },
        onCreateExpenseDialogClose: function () {
            let that = this
            if (this.oCreateEditExpenseCategoryDialog) {
                this.oCreateEditExpenseCategoryDialog.then(function (oDialog) {
                    oDialog.close();
                    oDialog.destroy();
                    that.oCreateEditExpenseCategoryDialog = null;  // important
                });
            }
            // this.oCreateEditExpenseCategoryDialog = null
        },

        // Next button press
        onNextStep: function () {
            // Switch to second tab
            var oTabBar = this.getView().byId("myTwoTabs");
            oTabBar.setSelectedKey("tab2");
        },
        onSaveExpense: function () {
            const oModel = this.getView().getModel("oGetExpenseCategoryModel");
            const data = oModel.getData();

            const c = data.expenseCategory;
            const r = data.recurrence;

            // ---------------------------------------
            // 1. HARD VALIDATIONS (stop immediately)
            // ---------------------------------------
            var sCategory = (c.category && c.category.trim())
                ? c.category.trim()
                : (c.categoryInput && c.categoryInput.trim())
                    ? c.categoryInput.trim()
                    : "";
            var sSubCategory = (c.subcategory && c.subcategory.trim())
                ? c.subcategory.trim()
                : (c.subcategoryInput && c.subcategoryInput.trim())
                    ? c.subcategoryInput.trim()
                    : "";
            if (!sCategory) {
                return MessageBox.error("Category is mandatory");
            }

            if (!sSubCategory) {
                return MessageBox.error("Sub Category is mandatory");
            }

            if (!c.payment_mode) {
                return MessageBox.error("Payment Mode is mandatory");
            }

            // ---------------------------------------
            // 2. Build SOFT WARNINGS (combined)
            // ---------------------------------------
            let warnings = [];

            // RECURRING VALIDATION
            if (c.recurring) {
                if (!r.endByEnabled && !r.endAfterEnabled) {
                    warnings.push("Please choose 'End By' date or 'End After' occurrences.");
                }

                const previewCount = r.preview ? r.preview.length : 0;
                if (previewCount === 0) {
                    warnings.push("Recurring is enabled but no recurring dates were generated.");
                }
            }

            // SPEND LIMIT WARNING
            if (!c.spend_limit_month) {
                warnings.push("Spend Limit is empty.");
            }

            // -------------------------------------------------------------------
            // 3. If warnings exist → show ONE combined MessageBox
            // -------------------------------------------------------------------
            if (warnings.length > 0) {

                const message = warnings.join("\n\n");

                MessageBox.confirm(
                    message,
                    {
                        actions: ["Continue", "Cancel"],
                        emphasizedAction: "Continue",
                        onClose: (action) => {
                            if (action === "Continue") {
                                this._proceedSaving(data);
                            }
                        }
                    }
                );

                return; // stop until user responds
            }

            // ---------------------------------------
            // 4. NO WARNINGS → save directly
            // ---------------------------------------
            this._proceedSaving(data);
        },

        _proceedSaving: function (data) {
            BusyIndicator.show(1)
            const c = data.expenseCategory;
            const r = data.recurrence;
            
            // Days JSON
            let recurringDays = null;
            if (r.days) {
                recurringDays = {
                    sun: r.days.sun || false,
                    mon: r.days.mon || false,
                    tue: r.days.tue || false,
                    wed: r.days.wed || false,
                    thu: r.days.thu || false,
                    fri: r.days.fri || false,
                    sat: r.days.sat || false
                };
            }

            // End Range Logic
            let endDateRange = "None";
            let endDateBy = null;
            let endInterval = null;

            if (r.endByEnabled) {
                endDateRange = "EndBy";
                endDateBy =   this.getView().byId("oExpenseCategoryEndDate").getValue()|| null
// c.enddate_by || null;
            } else if (r.endAfterEnabled) {
                endDateRange = "EndAfter";
                endInterval = c.end_interval || null;
            }

            var oUserName = this.getView().getModel("oUserDetailsModel").getProperty("/user_id");
            // FINAL PAYLOAD
            var sCategory = (c.category && c.category.trim())
                ? c.category.trim()
                : (c.categoryInput && c.categoryInput.trim())
                    ? c.categoryInput.trim()
                    : "";
            var sSubCategory = (c.subcategory && c.subcategory.trim())
                ? c.subcategory.trim()
                : (c.subcategoryInput && c.subcategoryInput.trim())
                    ? c.subcategoryInput.trim()
                    : "";
            let recurringDaysArray = [];

            if (c.recurring && c.recurringtype === "Weekly" && recurringDays) {
                recurringDaysArray = Object.keys(recurringDays).filter(day => recurringDays[day]);
            }

            // recurringDaysArray will be like: ['tue', 'wed']
            // if no day is true, it will be []
            if (recurringDaysArray.length === 0) {
                recurringDaysArray = null; // optional, if you want null when nothing is selected
            }
            let oStartDate = this.getView().byId("ExpenseCategoriesStratDate").getValue()
            const expenseCategories = {
                user_id: oUserName,
                id: c.id,

                category: sCategory,
                subcategory: sSubCategory,
                suggestions: c.suggestions || "",
                notes: c.notes || "",
                spend_limit_month: c.spend_limit_month || null,
                yearlimit: c.yearlimit || null,
                monthlimit: c.monthlimit || null,
                weeklimit: c.weeklimit || null,
                quarterlimit: c.quarterlimit || null,
                dailylimit: c.spend_limit_month || null,
                payment_mode: c.payment_mode,
                is_planned: c.is_planned || false,
                status: c.status ? "Active" : "Inactive"  ,

                recurring: c.recurring || false,
                recurring_start_date: oStartDate|| null,
                recurringtype: c.recurring ? c.recurringtype : "None",
                recurringinterval: c.recurring ? c.recurringinterval : null,
                recurring_days_of_week: c.recurring && c.recurringtype === "Weekly" ? Object.keys(recurringDays).filter(d => recurringDays[d]) || null : null,
                recurring_day_of_month: c.recurring && c.recurringtype === "Monthly" ? c.recurring_day_of_month : null,

                end_date_range: c.recurring ? endDateRange : "None",
                end_date_by: endDateBy,
                end_interval: endInterval,

                is_deleted: false
            };

            const oModel = this.getView().getModel("oGetExpenseCategoryModel");
            const preview = oModel.getProperty("/recurrence/preview");
            const recurringDeleteDates = oModel.getProperty("/recurrence/deletedRecurringDates");


            const sAuthToken = this.getUserAuthToken();

            const oPayload = {
                sAuthToken: sAuthToken,
                expenseCategories: expenseCategories,
                recurringDates: preview,
                recurringDeleteDates: recurringDeleteDates
            };



            // AJAX POST Call
            // -------------------------
            const that = this;
            $.ajax({
                url: "/api/v1/userDetail/saveExpenseCategories",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(oPayload),
                success: function (oResponse) {
                    BusyIndicator.hide();

                    if (oResponse && oResponse.data) {
                        // Reload data into model

                        that.onCreateExpenseDialogClose();
                        that.createMessageStrip(true, oResponse.message, "Success");
                        that.fnResetExpenseCategory()
                        that.createMessageStrip(true, oResponse.message || "Saved successfully", "Success");
                    }
                },
                error: function (xhr) {
                    BusyIndicator.hide();
                    let oError = {};
                    try {
                        oError = JSON.parse(xhr.responseText);
                    } catch (err) { }

                    that.onCreateExpenseDialogClose();
                    MessageBox.error(oError.message || "Unable to save expense category. Error occurred")
                    that.createMessageStrip(true, oError.message || "Unable to save expense category. Error occurred", "Error");
                }
            });
        }
    });
});