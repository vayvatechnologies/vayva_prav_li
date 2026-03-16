sap.ui.define([
    'sap/ui/demo/toolpageapp/controller/BaseController',
    "sap/ui/demo/toolpageapp/model/models",
    "sap/ui/demo/toolpageapp/util/util", 
    'sap/ui/model/json/JSONModel',
    'sap/ui/Device',
    'sap/ui/demo/toolpageapp/model/formatter',
    'sap/ui/core/BusyIndicator',
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/export/Spreadsheet"

], function (BaseController, models,util, JSONModel, Device, formatter, BusyIndicator, Fragment, MessageToast,Spreadsheet) {
    "use strict";
    var oGlobalModel, oRouter
    return BaseController.extend("sap.ui.demo.toolpageapp.controller.user.expense.ExpenseTracker", {
        formatter: formatter,

        onInit: function () {
            this.getView().setModel(this.getOwnerComponent().getModel("oGlobalAIModel"), "oGlobalAIModel");
            oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oGlobalModel = this.getView().getModel("oGlobalAIModel");
            oRouter.getRoute("ExpenseTracker").attachMatched(this.onObjectMatched, this);
        },
        onObjectMatched: function () {
            BusyIndicator.hide();
            if (!oGlobalModel.getProperty("/ApplicationConfigurations/isUserDetailsLoaded") ||
                !oGlobalModel.getProperty("/ApplicationConfigurations/isApplicationDetailsLoaded")) {
                this.fnCkUserLoggedIn(oRouter, "home")
                return;
            }
            this.fnResetExpenseTracker();

        },
        getUserAuthToken: function () {
            const oToken = localStorage.getItem("pravAPP_Authtoken_forService");

            // const oToken = sap.ui.getCore().getModel("oUserExpenseModel").getData().auth_token;
            if (!oToken) {
                this.fnCkUserLoggedIn(oRouter, "home")
            }
            return oToken;
        },
        fnGetUserExpenseDetails: function () {
            var that = this;
            const oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, "oExpenseModel");
            const sAuthToken = that.getUserAuthToken();

            if (sAuthToken) {
                BusyIndicator.show(0);

                var oDateRange = this.getView().byId("dateRange");
                function getYesterday(date) {
                    if (!date) return null;

                    const newDate = new Date(date); // clone to avoid mutating original
                    newDate.setDate(newDate.getDate() - 1);
                    return newDate;
                }

                function formatDate(date) {
                    if (!date) return null;
                    const dd = String(date.getDate()).padStart(2, '0');
                    const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
                    const yyyy = date.getFullYear();
                    return `${yyyy}-${mm}-${dd}`;
                }
                

                const oPayload = {
                    sAuthToken: sAuthToken,
                    oFromDate: formatDate(getYesterday(oDateRange.getDateValue()))+" 18:30:00",
                    oToDate: formatDate(oDateRange.getSecondDateValue())+" 18:29:59"
                };

                $.ajax({
                    url: "/api/v1/userDetail/getExpenseDetails",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();

                        // Load data into model
                        const oUserExpensesModel = new sap.ui.model.json.JSONModel(oResponse.data);
                        that.getView().setModel(oUserExpensesModel, "oExpenseModel");

                        that.createMessageStrip(true, oResponse.message, "Success");
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
        fnResetExpenseTracker: function () {
            var ouserModel = new JSONModel({ toogleOverviewShow: false });
            this.getView().setModel(ouserModel, "oExpeseTrackerModel");

            var oDateRange = this.getView().byId("dateRange");
            var oToday = new Date();
            var oFirstDay = new Date(oToday.getFullYear(), oToday.getMonth(), 1);

            // Set date range value
            oDateRange.setDateValue(oFirstDay);
            oDateRange.setSecondDateValue(oToday);


            this.fnGetUserExpenseDetails();
        },
        onTogglePravAICarousel: function () {
            const oModel = this.getView().getModel("oExpeseTrackerModel");

            let current = oModel.getProperty("/toogleOverviewShow");
            oModel.setProperty("/toogleOverviewShow", !current);
        },
        onAddExpense: function () {

            this.fnGetExpenseDetails("Create", "");

        },
        onEditPress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("oExpenseModel");
            const oData = oContext.getObject();
            const id = oData.id;
            this.fnGetExpenseDetails("edit", id);
        },

        onOpenDialog: function () {

            var oView = this.getView();

            if (!this.oCreateEditExpenseDialog) {
                this.oCreateEditExpenseDialog = Fragment.load({
                    id: oView.getId(),
                    name: "sap.ui.demo.toolpageapp.view.user.fragment.CreateExpense",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            

            this.oCreateEditExpenseDialog.then(function (oDialog) {
                oDialog.open();
                this._wizard = this.byId("DummyWizard");
            }.bind(this));

        },
        fnGetSubCategoryDetails: function (oEvent) {
            var that = this;
            const oSubCat = this.getView().getModel("oCreateEditExpenseDetailsModel").getProperty("/expenseDetails/subcategory")

            this.getView().getModel("oCreateEditExpenseDetailsModel").setProperty("/expenseDetails/subcategory", "")

            const oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, "subcategoryModel");
            const sAuthToken = that.getUserAuthToken();
            const category = this.getView().getModel("oCreateEditExpenseDetailsModel").getProperty("/expenseDetails/category")
            if (sAuthToken && category) {
                BusyIndicator.show(0);
                // Convert to ISO string 
                const oPayload = {
                    sAuthToken: sAuthToken,
                    category: category
                };

                $.ajax({
                    url: "/api/v1/userDetail/getUserSubCategory",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();

                        // Load data into model
                        const oSubCatModel = new sap.ui.model.json.JSONModel(oResponse);
                        that.getView().setModel(oSubCatModel, "subcategoryModel");


                        that.getView().getModel("oCreateEditExpenseDetailsModel").setProperty("/expenseDetails/subcategory", oSubCat)



                        // that.createMessageStrip(true, oResponse.message, "Success");
                    },
                    error: function (xhr) {
                        BusyIndicator.hide();

                        let oError = {};
                        try {
                            oError = JSON.parse(xhr.responseText);
                        } catch (err) { }

                        MessageToast.show(true, oError.message || "Error occurred", "Error");
                    }
                });
            }
        },
        onChangeSubCategory: function () {
            var that = this;
            const sAuthToken = that.getUserAuthToken();
            var oModel = this.getView().getModel("oCreateEditExpenseDetailsModel");
            var oData = oModel.getProperty("/expenseDetails");


            if (sAuthToken) {
                BusyIndicator.show(0);
                const oPayload = {
                    sAuthToken: sAuthToken,
                    category: oData.category,
                    subCategory: oData.subcategory
                };

                $.ajax({
                    url: "/api/v1/userDetail/getExpenseCategoriesByCategoryandSubcategory",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();
                        const paymentMode = oResponse?.data?.[0]?.payment_mode || "";

                        oModel.setProperty("/expenseDetails/payment_mode", paymentMode);
                        const d = oResponse?.data?.[0] || {};

                        let lines = [];
                        if (d.suggestions) {
                            lines.push(`Suggestions : ${d.suggestions}`);
                        }

                        if (d.notes) {
                            lines.push(`Notes       : ${d.notes}`);
                        }

                        lines.push(""); // empty line
                        lines.push(`Daily Limit : ${d.dailylimit || 0}`);

                        lines.push(`Week Limit  : ${d.weeklimit || 0}`);
                         
                        lines.push(`Month Limit : ${d.monthlimit || 0}`);

                        sap.m.MessageToast.show(lines.join("\n"), {
                            duration: 5000,
                            width: "25em"
                        });


                        // Load data into model
                        //that.getView().getModel("oCreateEditExpenseDetailsModel").setProperty("/expenseDetails",oResponse.data.data);


                    },
                    error: function (xhr) {
                        BusyIndicator.hide();
                        let oError = {};
                        try {
                            oError = JSON.parse(xhr.responseText);
                        } catch (err) { }
                    }
                });
            }
        },
        fnGetExpenseDetails: function (isFragmentMode, oSelId) {
            var that = this;
            const sAuthToken = that.getUserAuthToken();

            if (sAuthToken) {
                BusyIndicator.show(0);
                const oPayload = {
                    sAuthToken: sAuthToken,
                    expenseId: oSelId
                };

                $.ajax({
                    url: "/api/v1/userDetail/getCreateExpense",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();
                        var aCategories = oResponse?.data?.data?.category;

                        if (!aCategories || aCategories.length === 0) {
                            that.fnShowNoCategoryMessage();
                            return;
                        }

                        oResponse.data.fragMode = isFragmentMode;
                        // Load data into model
                        var oCreateExpenseModel = new sap.ui.model.json.JSONModel({
                            fragMode: isFragmentMode,
                            ...oResponse.data.data
                        });
                        // const oUserExpensesModel = new sap.ui.model.json.JSONModel(oResponse.data);
                        that.getView().setModel(oCreateExpenseModel, "oCreateEditExpenseDetailsModel");

                        that.fnGetSubCategoryDetails()
                        that.onOpenDialog();
                        MessageToast.show(oResponse.message)

                    },
                    error: function (xhr) {
                        BusyIndicator.hide();
                        const oUserExpensesModel = new sap.ui.model.json.JSONModel();
                        that.getView().setModel(oUserExpensesModel, "oCreateEditExpenseDetailsModel");

                        let oError = {};
                        try {
                            oError = JSON.parse(xhr.responseText);
                        } catch (err) { }

                        that.createMessageStrip(true, oError.message || "Error occurred", "Error");
                    }
                });
            }

            // var oModel = new sap.ui.model.json.JSONModel({
            //     fragMode: isFragmentMode,
            //     expenseDetails: {
            //         datetime: null,
            //         expense_type: "",
            //         category: "",
            //         sub_category: "",
            //         description: "",
            //         payment_mode: "",
            //         amount: 0,
            //         payment_status: "",
            //         is_planned: false,
            //         merchant_name: "",
            //         with_whom: "",
            //         cycle: "",
            //         saving_impact: false,
            //         expense_mood: "",
            //         notes: ""
            //     },
            //     types: [{key:"cash",text:"Cash"},{key:"card",text:"Card"}],
            //     category: [{key:"cash",text:"Cash"},{key:"card",text:"Card"}],
            //     paymentModes: [{key:"upi",text:"UPI"},{key:"card",text:"Card"}],
            //     paymentStatuses: [{key:"paid",text:"Paid"},{key:"pending",text:"Pending"}],
            //     cycles: [{key:"monthly",text:"Monthly"},{key:"weekly",text:"Weekly"}],
            //     moods: [{key:"happy",text:"Happy"},{key:"sad",text:"Sad"}]
            // });
            // this.getView().setModel(oModel, "createEditExpenseDetailsModel");
        },
        fnShowNoCategoryMessage: function () {
    sap.m.MessageBox.information(
        "There are no expense categories configured. Please configure first and create expense spend.",
        {
            title: "Information",
            actions: ["Create Expense Category", sap.m.MessageBox.Action.CLOSE],
            emphasizedAction: "Create Expense Category",
            onClose: function (sAction) {
                if (sAction === "Create Expense Category") {
                    // Navigate or open dialog
                    this._navigateToCreateCategory();
                }
            }.bind(this)
        }
    );
},
_navigateToCreateCategory: function () {
    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
     this.fnCkUserLoggedIn(oRouter,"ExpenseCategory")
},


        // Next button press
        onNextStep: function () {
            // Switch to second tab
            var oTabBar = this.getView().byId("myTwoTabs");
            oTabBar.setSelectedKey("tab2");
        },

        // Save expense
        isExpenseValid: function () {
            var oModel = this.getView().getModel("oCreateEditExpenseDetailsModel");
            var oData = oModel.getProperty("/expenseDetails");
            var aMissingFields = [];

            // 1. DateTime validation
            if (!oData.transactiondatetime) {
                aMissingFields.push("Date - Time");
            }
            let isCategorySubategoryMissedinList = false;
            // 2. Category & Subcategory
            if (!oData.category) {
                aMissingFields.push("Category");
                isCategorySubategoryMissedinList = true;
            }
            if (!oData.subcategory) {
                aMissingFields.push("Sub Category");
                isCategorySubategoryMissedinList = true;
            }

            // 3. Payment Mode & Payment Status
            if (!oData.payment_mode) {
                aMissingFields.push("Payment Mode");
            }
            if (!oData.payment_status) {
                aMissingFields.push("Payment Status");
            }

            // 4. Amount > 0
            if (!oData.amount || parseFloat(oData.amount) <= 0) {
                aMissingFields.push("Amount (should be > 0)");
            }

            // 5. Optional: Description, Merchant, etc. (give warnings if empty)
            if (!oData.description) {
                aMissingFields.push("Description");
            }
            if(isCategorySubategoryMissedinList){
                var sMessage = "Please fill in the following fields:\n- " + aMissingFields.join("\n- ");
                sMessage +="\n\nIf no categories exist, click the button below to create.";
                sap.m.MessageBox.error(sMessage,  {
                    title: "Validation Error",
                    actions: ["Create Expense Category", sap.m.MessageBox.Action.CLOSE],
                    emphasizedAction: "Create Expense Category",
                    onClose: function (sAction) {
                            if (sAction === "Create Expense Category") {
                                // Navigate or open dialog
                                this._navigateToCreateCategory();
                            }
                        }.bind(this)
                    }
                );
                return false
            }
            // If there are missing fields, show MessageBox and return false
            if (aMissingFields.length > 0) {
                var sMessage = "Please fill in the following fields:\n- " + aMissingFields.join("\n- ");
                sap.m.MessageBox.error(sMessage, {
                    title: "Validation Error"
                });
                return false;
            }

            // All validations passed
            return true;
        }
        ,
        onSaveExpense: function () {
            if (!this.isExpenseValid()) {
                return; // stop saving if validation fails
            }

            var oData = this.getView().getModel("oCreateEditExpenseDetailsModel").getProperty("/expenseDetails");
            oData.transactiondatetime = (this.getView().byId("DateTime").getDateValue()).toISOString()
            const sAuthToken = this.getUserAuthToken();

            // Prepare the payload for the backend
            var oPayload = {
                sAuthToken: sAuthToken, // Assuming the auth token is saved in a model
                expenseDetail: oData
            };

            // Call your backend service
            var oController = this;
            BusyIndicator.show();
            $.ajax({
                url: "/api/v1/userDetail/saveExpenseSpend",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(oPayload), // Convert the payload to JSON string
                success: function (response) {
                    BusyIndicator.hide();
                    // Handle the response if the save is successful
                    if (response.status === 'Success') {
                        oController.fnResetExpenseTracker();
                        oController.createMessageStrip(true, response.message, "Success");
                        // Close the dialog after saving
                        oController.onCreateExpenseDialogClose();
                    } else {
                        oController.onCreateExpenseDialogClose();
                        // Handle error (if any)  
                        oController.createMessageStrip(true, response.message || "Error occurred", "Error");

                    }
                },
                error: function (xhr) {
                    BusyIndicator.hide();

                    let oError = {};
                    try {
                        oError = JSON.parse(xhr.responseText);
                    } catch (err) { }

                    oController.createMessageStrip(true, oError.message || "Error occurred", "Error");
                }
            });
        },


        onCreateExpenseDialogClose: function () {
            var oView = this.getView();
            var oDialog = oView.byId("expenseDialog");

            if (oDialog) {
                oDialog.close();
                oDialog.destroy();   // <-- DESTROY here
            }

            this.oCreateEditExpenseDialog = null;  // reset promise holder
        },


        onExportExcel: function () {
            
            if(this.userSubcriptionValidation("EXPORT_EXCEL")){
           
    var oModel = this.getView().getModel("oExpenseModel");
    var aData = oModel.getProperty("/expenses") || [];

    // 👉 Calculate total amount
    var fTotalAmount = aData.reduce(function (sum, item) {
        return sum + parseFloat(item.amount || 0);
    }, 0);

    // 👉 Clone data to avoid modifying model
    var aExportData = aData.map(function (item) {
        return Object.assign({}, item);
    });

    // 👉 Add TOTAL row
    aExportData.push({
        transactiondatetime: "",
        category: "",
        subcategory: "",
        description: "TOTAL",
        amount: fTotalAmount.toFixed(2),
        payment_mode: "",
        payment_status: "",
        notes: ""
    });

    var aColumns = [
        { label: "Expense Datetime", property: "transactiondatetime", type: sap.ui.export.EdmType.DateTime },
        { label: "Category", property: "category" },
        { label: "Sub Category", property: "subcategory" },
        { label: "Description", property: "description" },
        { label: "Amount", property: "amount", type: sap.ui.export.EdmType.Number, scale: 2 },
        { label: "Payment Mode", property: "payment_mode" },
        { label: "Payment Status", property: "payment_status" },
        { label: "Notes", property: "notes" }
    ];

    var oSettings = {
        workbook: {
            columns: aColumns
        },
        dataSource: aExportData,
        fileName: "Expense_Report.xlsx"
    };

    var oSpreadsheet = new sap.ui.export.Spreadsheet(oSettings);
    oSpreadsheet.build().finally(function () {
        oSpreadsheet.destroy();
    });
}
},
onUpgradePress:function(){

 this.navtoUpgradePlans();
}







    });
});