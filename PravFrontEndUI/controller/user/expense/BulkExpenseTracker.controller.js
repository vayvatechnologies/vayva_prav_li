
sap.ui.define([
    "sap/ui/demo/toolpageapp/controller/BaseController",
    "sap/ui/demo/toolpageapp/model/models",
    "sap/ui/demo/toolpageapp/util/util",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/ui/demo/toolpageapp/model/formatter",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/export/Spreadsheet",
    "sap/m/MessageBox"
], function (
    BaseController,
    models,
    util,
    JSONModel,
    Device,
    formatter,
    BusyIndicator,
    Fragment,
    MessageToast,
    Spreadsheet,
    MessageBox
) {
    "use strict";

    var oGlobalModel, oRouter;

    return BaseController.extend(
        "sap.ui.demo.toolpageapp.controller.user.expense.BulkExpenseTracker",
        {

            formatter: formatter,

            // ==========================================
            // 1. INITIALIZATION
            // ==========================================

            onInit: function () {

                this.getView().setModel(
                    this.getOwnerComponent().getModel("oGlobalAIModel"),
                    "oGlobalAIModel"
                );

                oRouter = sap.ui.core.UIComponent.getRouterFor(this);

                oGlobalModel = this.getView().getModel("oGlobalAIModel");

                this._rowCounter = 0;
                this._isSaving = false;
                this._requestCounter = 0;

                oRouter.getRoute("BulkExpenseTracker").attachMatched(
                    this.onObjectMatched,
                    this
                );

            },

            onObjectMatched: function () {

                BusyIndicator.hide();

                if (
                    !oGlobalModel.getProperty(
                        "/ApplicationConfigurations/isUserDetailsLoaded"
                    ) ||
                    !oGlobalModel.getProperty(
                        "/ApplicationConfigurations/isApplicationDetailsLoaded"
                    )
                ) {

                    this.fnCkUserLoggedIn(oRouter, "home");
                    return;

                }

                this.fnResetExpenseTracker();

            },

            // ==========================================
            // 2. AUTHENTICATION
            // ==========================================

            getUserAuthToken: function () {

                var sAuthToken = localStorage.getItem(
                    "pravAPP_Authtoken_forService"
                );

                if (!sAuthToken) {
                    this.fnCkUserLoggedIn(oRouter, "home");
                }

                return sAuthToken;

            },

            // ==========================================
            // 3. INITIALIZE MODEL
            // ==========================================

            fnResetExpenseTracker: function () {

                this._rowCounter = 0;
                this._isSaving = false;

                var oBulkModel = new JSONModel({

                    rows: [],

                    types: [],
                    category: [],
                    paymentModes: [],
                    paymentStatuses: [],
                    cycles: [],
                    moods: []

                });

                oBulkModel.setSizeLimit(1000);

                this.getView().setModel(
                    oBulkModel,
                    "bulkExpenseModel"
                );

                this.fnLoadBulkExpenseMasterData();

            },

            // ==========================================
            // 4. LOAD MASTER DATA
            // ==========================================

            fnLoadBulkExpenseMasterData: function () {

                var that = this;

                var sAuthToken = this.getUserAuthToken();

                if (!sAuthToken) {
                    return;
                }

                BusyIndicator.show(0);

                $.ajax({

                    url: "/api/v1/userDetail/getCreateExpense",

                    method: "POST",

                    contentType: "application/json",

                    data: JSON.stringify({

                        sAuthToken: sAuthToken,
                        expenseId: ""

                    }),

                    success: function (oResponse) {

                        BusyIndicator.hide();

                        var oData = oResponse?.data?.data || {};

                        var oModel = that.getView().getModel(
                            "bulkExpenseModel"
                        );

                        oModel.setProperty(
                            "/types",
                            oData.types || []
                        );

                        oModel.setProperty(
                            "/category",
                            oData.category || []
                        );

                        oModel.setProperty(
                            "/paymentModes",
                            oData.paymentModes || []
                        );

                        oModel.setProperty(
                            "/paymentStatuses",
                            oData.paymentStatuses || []
                        );

                        oModel.setProperty(
                            "/cycles",
                            oData.cycles || []
                        );

                        oModel.setProperty(
                            "/moods",
                            oData.moods || []
                        );

                        if (
                            !oData.category ||
                            !oData.category.length
                        ) {

                            MessageBox.information(
                                "There are no expense categories configured. Please configure categories first.",
                                {
                                    title: "Expense Category",
                                    actions: [
                                        "Create Expense Category",
                                        MessageBox.Action.CLOSE
                                    ],
                                    emphasizedAction: "Create Expense Category",
                                    onClose: function (sAction) {

                                        if (
                                            sAction === "Create Expense Category"
                                        ) {
                                            that._navigateToCreateCategory();
                                        }

                                    }
                                }
                            );

                            return;
                        }

                        // Automatically add first row

                        that.onAddRow();

                    },

                    error: function (xhr) {

                        BusyIndicator.hide();

                        var oError = {};

                        try {
                            oError = JSON.parse(xhr.responseText);
                        } catch (e) {}

                        MessageBox.error(
                            oError.message ||
                            "Unable to load expense master data."
                        );

                    }

                });

            },

            // ==========================================
            // 5. CREATE EMPTY ROW
            // ==========================================

            fnCreateEmptyRow: function () {

    this._rowCounter++;

    var oModel = this.getView().getModel("bulkExpenseModel");

    var aTypes = oModel.getProperty("/types") || [];
    var aStatuses = oModel.getProperty("/paymentStatuses") || [];

    var oExpenseType = aTypes.find(function (oItem) {
        return String(oItem.text).toLowerCase() === "expense" ||
               String(oItem.key).toLowerCase() === "expense";
    });

    var oPaidStatus = aStatuses.find(function (oItem) {
        return String(oItem.text).toLowerCase() === "paid" ||
               String(oItem.key).toLowerCase() === "paid";
    });

    return {

        rowNumber: this._rowCounter,

        transactiondatetime: new Date(),

        type: oExpenseType ? oExpenseType.key : "Expense",

        category: "",
        subcategory: "",

        description: "",

        payment_mode: "",
        amount: "",

        payment_status: oPaidStatus ? oPaidStatus.key : "Paid",

        merchant_name: "",
        with_whom: "",

        cycle: "",
        saving_impact: false,

        expense_mood: "",
        is_planned: false,

        notes: "",

        subcategories: [],

        showMore: false,

        _categoryRequestId: 0,
        _subcategoryRequestId: 0

    };

},

            // ==========================================
            // 6. ADD ROW
            // ==========================================

            onAddRow: function () {

                if (this._isSaving) {
                    return;
                }

                var oModel = this.getView().getModel(
                    "bulkExpenseModel"
                );

                var aRows = oModel.getProperty("/rows") || [];

                aRows.push(
                    this.fnCreateEmptyRow()
                );

                oModel.setProperty("/rows", aRows);

                MessageToast.show("New expense row added");

            },

            // ==========================================
            // 7. DELETE ROW
            // ==========================================

            onDeleteRow: function (oEvent) {

                if (this._isSaving) {
                    return;
                }

                var oContext = oEvent.getSource().getBindingContext(
                    "bulkExpenseModel"
                );

                if (!oContext) {
                    return;
                }

                var iIndex = parseInt(
                    oContext.getPath().split("/").pop(),
                    10
                );

                var oModel = this.getView().getModel(
                    "bulkExpenseModel"
                );

                var aRows = oModel.getProperty("/rows") || [];

                if (iIndex < 0 || iIndex >= aRows.length) {
                    return;
                }

                aRows.splice(iIndex, 1);

                oModel.setProperty("/rows", aRows);

                MessageToast.show("Expense row deleted");

            },

            // ==========================================
            // 8. TOGGLE MORE DETAILS
            // ==========================================

            onToggleMoreDetails: function (oEvent) {

                var oContext = oEvent.getSource().getBindingContext(
                    "bulkExpenseModel"
                );

                if (!oContext) {
                    return;
                }

                var sPath = oContext.getPath();

                var oModel = this.getView().getModel(
                    "bulkExpenseModel"
                );

                var bCurrent = oModel.getProperty(
                    sPath + "/showMore"
                );

                oModel.setProperty(
                    sPath + "/showMore",
                    !bCurrent
                );

            },

            // ==========================================
            // 9. CATEGORY CHANGE
            // ==========================================

            onBulkCategoryChange: function (oEvent) {

                var oContext = oEvent.getSource().getBindingContext(
                    "bulkExpenseModel"
                );

                if (!oContext) {
                    return;
                }

                var sPath = oContext.getPath();

                var oModel = this.getView().getModel(
                    "bulkExpenseModel"
                );

                var sCategory = oEvent.getSource().getSelectedKey();

                oModel.setProperty(
                    sPath + "/category",
                    sCategory
                );

                // Reset dependent fields

                oModel.setProperty(
                    sPath + "/subcategory",
                    ""
                );

                oModel.setProperty(
                    sPath + "/subcategories",
                    []
                );

                oModel.setProperty(
                    sPath + "/payment_mode",
                    ""
                );

                if (!sCategory) {
                    return;
                }

                var sAuthToken = this.getUserAuthToken();

                if (!sAuthToken) {
                    return;
                }

                var iRequestId = ++this._requestCounter;

                oModel.setProperty(
                    sPath + "/_categoryRequestId",
                    iRequestId
                );

                BusyIndicator.show(0);

                $.ajax({

                    url: "/api/v1/userDetail/getUserSubCategory",

                    method: "POST",

                    contentType: "application/json",

                    data: JSON.stringify({

                        sAuthToken: sAuthToken,
                        category: sCategory

                    }),

                    success: function (oResponse) {

                        BusyIndicator.hide();

                        if (
                            oModel.getProperty(
                                sPath + "/_categoryRequestId"
                            ) !== iRequestId
                        ) {
                            return;
                        }

                        if (
                            oModel.getProperty(
                                sPath + "/category"
                            ) !== sCategory
                        ) {
                            return;
                        }

                        var aSubcategories = [];

                        if (Array.isArray(oResponse)) {

                            aSubcategories = oResponse;

                        } else if (Array.isArray(oResponse.data)) {

                            aSubcategories = oResponse.data;

                        } else if (
                            Array.isArray(oResponse.subcategory)
                        ) {

                            aSubcategories = oResponse.subcategory;

                        } else if (
                            Array.isArray(oResponse.data?.data)
                        ) {

                            aSubcategories = oResponse.data.data;

                        }

                        oModel.setProperty(
                            sPath + "/subcategories",
                            aSubcategories
                        );

                        if (!aSubcategories.length) {

                            MessageToast.show(
                                "No subcategories found."
                            );

                        }

                    },

                    error: function (xhr) {

                        BusyIndicator.hide();

                        var oError = {};

                        try {
                            oError = JSON.parse(xhr.responseText);
                        } catch (e) {}

                        MessageToast.show(
                            oError.message ||
                            "Unable to load subcategories."
                        );

                    }

                });

            },

            // ==========================================
            // 10. SUBCATEGORY CHANGE
            // ==========================================

            onBulkSubCategoryChange: function (oEvent) {

                var oContext = oEvent.getSource().getBindingContext(
                    "bulkExpenseModel"
                );

                if (!oContext) {
                    return;
                }

                var sPath = oContext.getPath();

                var oModel = this.getView().getModel(
                    "bulkExpenseModel"
                );

                var sSubcategory = oEvent.getSource().getSelectedKey();

                oModel.setProperty(
                    sPath + "/subcategory",
                    sSubcategory
                );

                var oRow = oModel.getProperty(sPath);

                if (!oRow.category || !sSubcategory) {
                    return;
                }

                var sCategory = oRow.category;

                var sAuthToken = this.getUserAuthToken();

                if (!sAuthToken) {
                    return;
                }

                var iRequestId = ++this._requestCounter;

                oModel.setProperty(
                    sPath + "/_subcategoryRequestId",
                    iRequestId
                );

                BusyIndicator.show(0);

                $.ajax({

                    url: "/api/v1/userDetail/getExpenseCategoriesByCategoryandSubcategory",

                    method: "POST",

                    contentType: "application/json",

                    data: JSON.stringify({

                        sAuthToken: sAuthToken,
                        category: sCategory,
                        subCategory: sSubcategory

                    }),

                    success: function (oResponse) {

                        BusyIndicator.hide();

                        if (
                            oModel.getProperty(
                                sPath + "/_subcategoryRequestId"
                            ) !== iRequestId
                        ) {
                            return;
                        }

                        var oCurrentRow = oModel.getProperty(sPath);

                        if (
                            !oCurrentRow ||
                            oCurrentRow.category !== sCategory ||
                            oCurrentRow.subcategory !== sSubcategory
                        ) {
                            return;
                        }

                        var d = oResponse?.data?.[0] || {};

                        // Auto populate payment mode

                        oModel.setProperty(
                            sPath + "/payment_mode",
                            d.payment_mode || ""
                        );

                        var aMessages = [];

                        if (d.suggestions) {
                            aMessages.push(
                                "Suggestions: " + d.suggestions
                            );
                        }

                        if (d.notes) {
                            aMessages.push(
                                "Notes: " + d.notes
                            );
                        }

                        aMessages.push(
                            "Daily Limit: " + (d.dailylimit || 0)
                        );

                        aMessages.push(
                            "Week Limit: " + (d.weeklimit || 0)
                        );

                        aMessages.push(
                            "Month Limit: " + (d.monthlimit || 0)
                        );

                        MessageToast.show(
                            aMessages.join("\n"),
                            {
                                duration: 6000,
                                width: "25em"
                            }
                        );

                    },

                    error: function (xhr) {

                        BusyIndicator.hide();

                        var oError = {};

                        try {
                            oError = JSON.parse(xhr.responseText);
                        } catch (e) {}

                        MessageToast.show(
                            oError.message ||
                            "Unable to load expense details."
                        );

                    }

                });

            },

            // ==========================================
            // 11. VALIDATE ALL ROWS
            // ==========================================

            fnValidateBulkExpenses: function () {

                var oModel = this.getView().getModel(
                    "bulkExpenseModel"
                );

                var aRows = oModel.getProperty("/rows") || [];

                if (!aRows.length) {

                    MessageBox.error(
                        "Please add at least one expense."
                    );

                    return false;
                }

                var aErrors = [];

                aRows.forEach(function (oRow) {

                    var aMissing = [];

                    if (!oRow.transactiondatetime) {
                        aMissing.push("Date - Time");
                    }

                    if (!oRow.type) {
                        aMissing.push("Type");
                    }

                    if (!oRow.category) {
                        aMissing.push("Category");
                    }

                    if (!oRow.subcategory) {
                        aMissing.push("Sub Category");
                    }

                    if (
                        !oRow.description ||
                        !String(oRow.description).trim()
                    ) {
                        aMissing.push("Description");
                    }

                    if (!oRow.payment_mode) {
                        aMissing.push("Payment Mode");
                    }

                    if (
                        oRow.amount === "" ||
                        oRow.amount === null ||
                        !isFinite(Number(oRow.amount)) ||
                        Number(oRow.amount) <= 0
                    ) {
                        aMissing.push("Amount");
                    }

                    if (!oRow.payment_status) {
                        aMissing.push("Payment Status");
                    }

                    if (aMissing.length) {

                        aErrors.push(
                            "Row " + oRow.rowNumber +
                            ": " + aMissing.join(", ")
                        );

                    }

                });

                if (aErrors.length) {

                    MessageBox.error(
                        "Please correct the following fields:\n\n" +
                        aErrors.join("\n"),
                        {
                            title: "Expense Validation"
                        }
                    );

                    return false;
                }

                return true;

            },

            // ==========================================
            // 12. PREPARE EXPENSE PAYLOAD
            // ==========================================

            fnPrepareExpensePayload: function (oRow) {

                var oDate = oRow.transactiondatetime instanceof Date
                    ? oRow.transactiondatetime
                    : new Date(oRow.transactiondatetime);

                if (isNaN(oDate.getTime())) {

                    throw new Error(
                        "Invalid date in row " + oRow.rowNumber
                    );

                }

                return {

                    transactiondatetime: oDate.toISOString(),

                    type: oRow.type,

                    category: oRow.category,

                    subcategory: oRow.subcategory,

                    description: oRow.description,

                    payment_mode: oRow.payment_mode,

                    amount: Number(oRow.amount),

                    payment_status: oRow.payment_status,

                    merchant_name: oRow.merchant_name || "",

                    with_whom: oRow.with_whom || "",

                    cycle: oRow.cycle || "",

                    saving_impact: !!oRow.saving_impact,

                    expense_mood: oRow.expense_mood || "",

                    is_planned: !!oRow.is_planned,

                    notes: oRow.notes || ""

                };

            },

            // ==========================================
            // 13. SAVE BULK EXPENSES
            // ==========================================

onSaveBulkExpenses: function () {

    if (this._isSaving) {
        return;
    }

    // Validate all rows first
    if (!this.fnValidateBulkExpenses()) {
        return;
    }

    var oModel = this.getView().getModel(
        "bulkExpenseModel"
    );

    var aRows = oModel.getProperty("/rows") || [];

    var fTotalAmount = aRows.reduce(function (fTotal, oRow) {

        return fTotal + Number(oRow.amount || 0);

    }, 0);

    var sTotalAmount = fTotalAmount.toLocaleString(
        undefined,
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

    var sMessage =
        "Please confirm your bulk expense submission.\n\n" +
        "Total Expenses: " + aRows.length + "\n" +
        "Total Amount: " + sTotalAmount + "\n\n" +
        "Do you want to save all expenses?";

    MessageBox.confirm(sMessage, {

        title: "Confirm Bulk Expense Save",

        actions: [
            "Confirm & Save",
            MessageBox.Action.CANCEL
        ],

        emphasizedAction: "Confirm & Save",

        onClose: function (sAction) {

            if (sAction === "Confirm & Save") {

                this._saveBulkExpensesNow();

            }

        }.bind(this)

    });

},

            _saveBulkExpensesNow: function () {

                if (this._isSaving) {
                    return;
                }

                if (!this.fnValidateBulkExpenses()) {
                    return;
                }

                var sAuthToken = this.getUserAuthToken();

                if (!sAuthToken) {
                    return;
                }

                var oModel = this.getView().getModel(
                    "bulkExpenseModel"
                );

                var aRows = oModel.getProperty("/rows") || [];

                var aExpenses = [];

                try {

                    aRows.forEach(function (oRow) {

                        aExpenses.push(
                            this.fnPrepareExpensePayload(oRow)
                        );

                    }.bind(this));

                } catch (e) {

                    MessageBox.error(e.message);
                    return;

                }

                this._isSaving = true;

                BusyIndicator.show(0);

                var that = this;

                var iCurrentIndex = 0;

                var aSuccessfulRows = [];

                var aFailedRows = [];

                function saveNextExpense() {

                    if (iCurrentIndex >= aExpenses.length) {

                        BusyIndicator.hide();

                        that._isSaving = false;

                        that.fnShowBulkSaveResult(
                            aSuccessfulRows,
                            aFailedRows
                        );

                        return;
                    }

                    var oPayload = {

                        sAuthToken: sAuthToken,

                        expenseDetail: aExpenses[iCurrentIndex]

                    };

                    var iRowNumber = aRows[iCurrentIndex].rowNumber;

                    $.ajax({

                        url: "/api/v1/userDetail/saveExpenseSpend",

                        type: "POST",

                        contentType: "application/json",

                        data: JSON.stringify(oPayload),

                        success: function (oResponse) {

                            if (
                                oResponse &&
                                oResponse.status === "Success"
                            ) {

                                aSuccessfulRows.push(iRowNumber);

                            } else {

                                aFailedRows.push({

                                    rowNumber: iRowNumber,

                                    message: oResponse?.message ||
                                        "Save failed"

                                });

                            }

                            iCurrentIndex++;

                            saveNextExpense();

                        },

                        error: function (xhr) {

                            var oError = {};

                            try {
                                oError = JSON.parse(xhr.responseText);
                            } catch (e) {}

                            aFailedRows.push({

                                rowNumber: iRowNumber,

                                message: oError.message ||
                                    "Server error"

                            });

                            iCurrentIndex++;

                            saveNextExpense();

                        }

                    });

                }

                saveNextExpense();

            },

            // ==========================================
            // 14. SHOW SAVE RESULT
            // ==========================================

            fnShowBulkSaveResult: function (
                aSuccessfulRows,
                aFailedRows
            ) {

                var iSuccess = aSuccessfulRows.length;

                var iFailed = aFailedRows.length;

                if (iFailed === 0) {

                    MessageBox.success(

                        iSuccess +
                        " expense(s) saved successfully.",

                        {

                            title: "Bulk Expense Import",

                            onClose: function () {

                                this.fnResetExpenseTracker();

                                this.onNavBack();

                            }.bind(this)

                        }

                    );

                    return;
                }

                var sMessage =
                    "Successfully saved: " + iSuccess +
                    "\nFailed: " + iFailed;

                aFailedRows.forEach(function (oFailure) {

                    sMessage +=
                        "\nRow " + oFailure.rowNumber +
                        ": " + oFailure.message;

                });

                MessageBox.warning(

                    sMessage,

                    {

                        title: "Bulk Save Result",

                        actions: [MessageBox.Action.OK],

                        onClose: function () {

                            var oModel = this.getView().getModel(
                                "bulkExpenseModel"
                            );

                            var aCurrentRows =
                                oModel.getProperty("/rows") || [];

                            var aFailedRowNumbers =
                                aFailedRows.map(function (oFailure) {
                                    return oFailure.rowNumber;
                                });

                            var aRemainingRows =
                                aCurrentRows.filter(function (oRow) {

                                    return aFailedRowNumbers.indexOf(
                                        oRow.rowNumber
                                    ) !== -1;

                                });

                            oModel.setProperty(
                                "/rows",
                                aRemainingRows
                            );

                            MessageToast.show(
                                "Only failed rows remain. Correct and save again."
                            );

                        }.bind(this)

                    }

                );

            },

            // ==========================================
            // 15. CANCEL
            // ==========================================

            onCancelBulkExpense: function () {

                if (this._isSaving) {

                    MessageToast.show(
                        "Please wait until saving is completed."
                    );

                    return;
                }

                MessageBox.confirm(

                    "Are you sure you want to cancel? Unsaved expenses will be lost.",

                    {

                        title: "Cancel Bulk Expense",

                        actions: [
                            MessageBox.Action.OK,
                            MessageBox.Action.CANCEL
                        ],

                        emphasizedAction: MessageBox.Action.OK,

                        onClose: function (sAction) {

                            if (
                                sAction === MessageBox.Action.OK
                            ) {

                                this.onNavBack();

                            }

                        }.bind(this)

                    }

                );

            },

            // ==========================================
            // 16. BACK NAVIGATION
            // ==========================================

            onNavBack: function () {

                var oHistory =
                    sap.ui.core.routing.History.getInstance();

                var sPreviousHash =
                    oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {

                    window.history.go(-1);

                } else {

                    oRouter.navTo(
                        "ExpenseTracker",
                        {},
                        true
                    );

                }

            },

            // ==========================================
            // 17. CREATE CATEGORY NAVIGATION
            // ==========================================

            _navigateToCreateCategory: function () {

                this.fnCkUserLoggedIn(
                    oRouter,
                    "ExpenseCategory"
                );

            },

            // ==========================================
            // 18. CLEANUP
            // ==========================================

            onExit: function () {

    BusyIndicator.hide();

    if (this._oMoreDetailsDialog) {

        this._oMoreDetailsDialog.destroy();

        this._oMoreDetailsDialog = null;

    }

    if (oRouter) {

        oRouter.getRoute("BulkExpenseTracker")
            .detachMatched(
                this.onObjectMatched,
                this
            );

    }

},
            
onToggleMoreDetails: function (oEvent) {

    var oContext = oEvent.getSource().getBindingContext(
        "bulkExpenseModel"
    );

    if (!oContext) {
        return;
    }

    if (!this._oMoreDetailsDialog) {

        this._oMoreDetailsDialog = sap.ui.xmlfragment(
            this.getView().getId(),
            "sap.ui.demo.toolpageapp.view.user.fragment.BulkExpenseDetails",
            this
        );

        this.getView().addDependent(
            this._oMoreDetailsDialog
        );

    }

    // Bind the selected expense row
    this._oMoreDetailsDialog.setBindingContext(
        oContext,
        "bulkExpenseModel"
    );

    this._oMoreDetailsDialog.open();

},

onCloseMoreDetails: function () {

    if (this._oMoreDetailsDialog) {
        this._oMoreDetailsDialog.close();
    }

},



        }
    );

});
