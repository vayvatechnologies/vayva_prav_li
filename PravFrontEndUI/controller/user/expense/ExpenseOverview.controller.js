sap.ui.define([
    'sap/ui/demo/toolpageapp/controller/BaseController',
    "sap/ui/demo/toolpageapp/model/models",
    'sap/ui/model/json/JSONModel',
    'sap/ui/Device',
    'sap/ui/demo/toolpageapp/model/formatter',
    'sap/ui/core/BusyIndicator'
], function (BaseController, models, JSONModel, Device, formatter, BusyIndicator) {
    "use strict";
    var oGlobalModel, oRouter
    return BaseController.extend("sap.ui.demo.toolpageapp.controller.user.expense.ExpenseOverview", {
        formatter: formatter,

        onInit: function () {
            
            const oViewModel = new JSONModel({
    chartType: "stacked_column",
    groupBy: "category",
    totalAmount: "0.00",
    drillLevel: "category",
    enableDrill: false   // NEW
});

            this.getView().setModel(oViewModel, "viewModel");

            this.getView().setModel(this.getOwnerComponent().getModel("oGlobalAIModel"), "oGlobalAIModel");
            oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oGlobalModel = this.getView().getModel("oGlobalAIModel");
            oRouter.getRoute("ExpenseOverview").attachMatched(this.onObjectMatched, this);
        },
        onObjectMatched: function () {
            //console.log("Trigger here")
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


        onTogglePravAICarousel: function () {
            const oModel = this.getView().getModel("oExpeseTrackerModel");

            let current = oModel.getProperty("/toogleOverviewShow");
            oModel.setProperty("/toogleOverviewShow", !current);
        },
        fnResetExpenseTracker: function () {

            var ouserModel = new JSONModel({ toogleOverviewShow: false });
            this.getView().setModel(ouserModel, "oExpeseTrackerModel");

            var oDateRange = this.getView().byId("dateRange");
            var oToday = new Date();
            // Set date range value
            oDateRange.setDateValue(new Date(oToday.getFullYear(), oToday.getMonth(), 1));
            oDateRange.setSecondDateValue(oToday);


            this.fnGetUserExpenseDetails();
        },

        fnGetUserExpenseDetails: function () {
            var that = this;
            const sAuthToken = this.getUserAuthToken();

            if (!sAuthToken) {
                return;
            }

            BusyIndicator.show(0);

            var oDateRange = this.byId("dateRange");

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

                    const oModel = new sap.ui.model.json.JSONModel(oResponse.data);
                    that.getView().setModel(oModel, "oExpenseModel");
that._buildChart();

                    that.createMessageStrip(true, oResponse.message, "Success");
                },

                error: function () {
                    BusyIndicator.hide();
                    that.createMessageStrip(true, "Failed to load expense data", "Error");
                }
            });
        },
onChartTypeChange: function () {
    this._buildChart();
},

onGroupByChange: function () {
    this._buildChart();
},
  /* ================= CHART BUILDER ================= */

        _buildChart: function () {
            const oExpenseModel = this.getView().getModel("oExpenseModel");
            if (!oExpenseModel) return;

            let aExpenses = oExpenseModel.getProperty("/expenses") || [];

            let oVM = this.getView().getModel("viewModel");
            let sChartType = oVM.getProperty("/chartType");
            
            
            if(sChartType==="pie"){
                if(!this.userSubcriptionValidation("PIE_CHART")){
                    oVM.setProperty("/chartType","") 
                    sChartType = "stacked_column";
                    //return;
                }
            }
            if(sChartType==="line"){
                if(!this.userSubcriptionValidation("LINE_CHART")){
                    oVM.setProperty("/chartType","");
                    sChartType = "stacked_column";
                   // return;
                }
            }
            let sGroupBy = oVM.getProperty("/groupBy");

              
            if(sGroupBy==="category"){
                if(!this.userSubcriptionValidation("EXPENSE_OVERVIEW_GROUPBBY_CATEGORY")){
                    oVM.setProperty("/groupBy","") 
                    sGroupBy = "category";
                    //return;
                }
            }
            if(sGroupBy==="subcategory"){
                if(!this.userSubcriptionValidation("EXPENSE_OVERVIEW_GROUPBBY_SUBCATEGORY")){
                    oVM.setProperty("/groupBy","");
                    sGroupBy = "category";
                   // return;
                }
            }
            if(sGroupBy==="payment_mode"){
                if(!this.userSubcriptionValidation("EXPENSE_OVERVIEW_GROUPBBY_PAYMENTMODE")){
                    oVM.setProperty("/groupBy","");
                    sGroupBy = "category";
                   // return;
                }
            }


            let aData = [];
            let fTotal = 0;

          if (sChartType === "stacked_column" || sChartType === "stacked_bar") {
    aData = this._getStackedData(aExpenses, sGroupBy);
} else {
    // pie, donut, treemap, line → simple data
    aData = this._getSimpleData(aExpenses, sGroupBy);
}



            aData.forEach(d => fTotal += d.amount);
            oVM.setProperty("/totalAmount", fTotal.toFixed(2));

            this.getView().setModel(
                new JSONModel({ data: aData }),
                "chartModel"
            );

            this._rebuildVizFrame(sChartType);
        },

        /* ================= DATA PREP ================= */

        _getSimpleData: function (aExpenses, sGroupBy) {
            const oMap = {};

            aExpenses.forEach(e => {
                const key = e[sGroupBy] || "Unknown";
                const amt = parseFloat(e.amount);
                oMap[key] = (oMap[key] || 0) + amt;
            });

            return Object.keys(oMap).map(k => ({
                group: k,
                amount: oMap[k]
            }));
        },

        _getStackedData: function (aExpenses, sGroupBy) {
            const oMap = {};

            aExpenses.forEach(e => {
                const g = e[sGroupBy] || "Unknown";
                const p = e.payment_mode || "Other";
                const amt = parseFloat(e.amount);

                oMap[g] = oMap[g] || {};
                oMap[g][p] = (oMap[g][p] || 0) + amt;
            });

            const aData = [];
            Object.keys(oMap).forEach(g => {
                Object.keys(oMap[g]).forEach(p => {
                    aData.push({
                        group: g,
                        payment_mode: p,
                        amount: oMap[g][p]
                    });
                });
            });

            return aData;
        },

        /* ================= VIZFRAME REBUILD ================= */

        _rebuildVizFrame: function (sChartType) {
    const oContainer = this.byId("chartBox");
    oContainer.removeAllItems();

    let oViz;
    

    // ================= PIE / DONUT =================
    if (sChartType === "pie" || sChartType === "donut") {

        oViz = new sap.viz.ui5.controls.VizFrame({
            width: "100%",
            height: "450px",
            vizType: sChartType,
            uiConfig: { applicationSet: "fiori" }
        });

        const oDataset = new sap.viz.ui5.data.FlattenedDataset({
            data: { path: "chartModel>/data" },
            dimensions: [
                new sap.viz.ui5.data.DimensionDefinition({
                    name: "Group",
                    value: "{chartModel>group}"
                })
            ],
            measures: [
                new sap.viz.ui5.data.MeasureDefinition({
                    name: "Amount",
                    value: "{chartModel>amount}"
                })
            ]
        });

        oViz.setDataset(oDataset);

        oViz.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
            uid: "size",
            type: "Measure",
            values: ["Amount"]
        }));

        oViz.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
            uid: "color",
            type: "Dimension",
            values: ["Group"]
        }));
    }

    // ================= TREEMAP =================
    else if (sChartType === "treemap") {

        oViz = new sap.viz.ui5.controls.VizFrame({
            width: "100%",
            height: "450px",
            vizType: "treemap",
            uiConfig: { applicationSet: "fiori" }
        });

        const oDataset = new sap.viz.ui5.data.FlattenedDataset({
            data: { path: "chartModel>/data" },
            dimensions: [
                new sap.viz.ui5.data.DimensionDefinition({
                    name: "Group",
                    value: "{chartModel>group}"
                })
            ],
            measures: [
                new sap.viz.ui5.data.MeasureDefinition({
                    name: "Amount",
                    value: "{chartModel>amount}"
                })
            ]
        });

        oViz.setDataset(oDataset);

        oViz.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
            uid: "weight",
            type: "Measure",
            values: ["Amount"]
        }));

        oViz.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
            uid: "color",
            type: "Dimension",
            values: ["Group"]
        }));
    }

    // ================= COLUMN / BAR / LINE =================
    else {

        oViz = new sap.viz.ui5.controls.VizFrame({
            width: "100%",
            height: "450px",
            vizType: sChartType,
            uiConfig: { applicationSet: "fiori" }
        });

        const isStacked =
            sChartType === "stacked_column" ||
            sChartType === "stacked_bar";

        const oDataset = new sap.viz.ui5.data.FlattenedDataset({
            data: { path: "chartModel>/data" },
            dimensions: isStacked ? [
                new sap.viz.ui5.data.DimensionDefinition({
                    name: "Group",
                    value: "{chartModel>group}"
                }),
                new sap.viz.ui5.data.DimensionDefinition({
                    name: "Payment Mode",
                    value: "{chartModel>payment_mode}"
                })
            ] : [
                new sap.viz.ui5.data.DimensionDefinition({
                    name: "Group",
                    value: "{chartModel>group}"
                })
            ],
            measures: [
                new sap.viz.ui5.data.MeasureDefinition({
                    name: "Amount",
                    value: "{chartModel>amount}"
                })
            ]
        });

        oViz.setDataset(oDataset);

        oViz.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
            uid: "valueAxis",
            type: "Measure",
            values: ["Amount"]
        }));

        oViz.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
            uid: "categoryAxis",
            type: "Dimension",
            values: ["Group"]
        }));

        if (isStacked) {
            oViz.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
                uid: "color",
                type: "Dimension",
                values: ["Payment Mode"]
            }));
        }
    }
let oTitleExpenseAmount  =  this.getView().getModel("viewModel").getProperty("/totalAmount")
    oViz.setVizProperties({
        title: {
    visible: true,
    text: "Overall Expense Spends - " + oTitleExpenseAmount
},
    plotArea: {
        dataLabel: { visible: true ,showTotal: true},
        animation: {
            dataLoading: true,
            dataUpdating: true
        }
    },
    legend: { visible: true },
    interaction: {
        selectability: {
            mode: "single"
        }
    }
});
this._oVizFrame = oViz;
 oViz.attachSelectData(this._onChartSelect.bind(this));



     oContainer.addItem(oViz);
}
,
_createVizPopover: function () {
    if (this._oVizPopover) {
        return;
    }

    this._oVizPopover = new sap.viz.ui5.controls.VizPopover({
        formatString: [["Amount", "₹#,##0.00"]]
    });

    this._oVizPopover.connect(this._oVizFrame.getVizUid());
}, 
   _onChartSelectBK: function (oEvent) {
  const oVM = this.getView().getModel("viewModel");

// Drill only if enabled
if (oVM.getProperty("/enableDrill") &&
    oVM.getProperty("/drillLevel") === "category") {

    oVM.setProperty("/drillLevel", "subcategory");
    oVM.setProperty("/groupBy", "subcategory");

    this._buildChart();
    return;
}



   const aData = oEvent.getParameter("data");
    if (!aData || !aData.length) return;

    const aSelectedGroups = aData.map(d => d.data.Group);

    const aExpenses =
        this.getView().getModel("oExpenseModel").getProperty("/expenses") || [];

    const aFiltered = aExpenses.filter(e =>
        aSelectedGroups.includes(e.category) ||
        aSelectedGroups.includes(e.subcategory) ||
        aSelectedGroups.includes(e.payment_mode)
    );

    this._createExpenseDialog();

    const oDialogModel = new sap.ui.model.json.JSONModel({ items: aFiltered });
    this._oExpenseDialog.setModel(oDialogModel, "dialogModel");

    this._oExpenseDialog.open();
 
return
    
}

,
_createExpenseDialog: function () {
    if (this._oExpenseDialog) return;

    // Container for expenses grouped by payment mode
    const oVBox = new sap.m.VBox({
        width: "100%",
        class:"sapUiSmallMargin",
        renderType: "Bare",
        items: []
    });

    this._oExpenseDialog = new sap.m.Dialog({
        title: "Expense Details",
         stretch: sap.ui.Device.system.phone, // full screen on mobile
        contentWidth: "45%",
        contentHeight: "400px",
        draggable: true,
        resizable: true,
        content: [oVBox],

        // HEADER RIGHT CLOSE ICON
        showHeader: true,
        customHeader: new sap.m.Bar({
            contentMiddle: [new sap.m.Title({ text: "Expense Details" })],
            contentRight: [
                new sap.m.Button({
                    icon: "sap-icon://decline",
                    press: () => this._oExpenseDialog.close()
                })
            ]
        }),

        // FOOTER BUTTONS
        endButton: new sap.m.Button({
            text: "Close",
            type: "Reject", // red styling
            press: () => this._oExpenseDialog.close()
        })
    });

    this.getView().addDependent(this._oExpenseDialog);

    this._oExpenseDialog._oVBoxContainer = oVBox; // save reference
}
,_showExpenseDialogWithData: function(aExpenses) {
    this._createExpenseDialog();

    const oVBox = this._oExpenseDialog._oVBoxContainer;
    oVBox.destroyItems(); // clear old content
      oVBox.setJustifyContent("Start");
    oVBox.setRenderType("Bare");

    // Group by payment mode
    const oGrouped = aExpenses.reduce((acc, cur) => {
        const pm = cur.payment_mode || "Other";
        acc[pm] = acc[pm] || [];
        acc[pm].push(cur);
        return acc;
    }, {});

    Object.keys(oGrouped).forEach(pm => {
        const aItems = oGrouped[pm];

        // Calculate total per payment mode
        const fTotal = aItems.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        // Payment mode heading with total
        oVBox.addItem(new sap.m.Title({
            text: `${pm}: ₹ ${fTotal.toFixed(2)}`,
            design: "Bold",
            wrapping: false
        })).addStyleClass("expensePaymentMode");

        // Add each expense as HBox (description left, amount right)
        aItems.forEach(e => {
            oVBox.addItem(new sap.m.HBox({
                justifyContent: "SpaceBetween",
                items: [
                    new sap.m.Label({ text: e.description || e.category ,wrapping:true}).addStyleClass("sapUiTinyMarginBegin expenseDescText"),
                    
                    new sap.m.Label({ text: "₹ " + parseFloat(e.amount).toFixed(2) }).addStyleClass("sapUiTinyMarginEnd expenseAmountText")
                ]
            })).addStyleClass("sapUiLargeMarginEnd expenseItemHBox ");
        });

        // Small separator for spacing
        oVBox.addItem(new sap.m.Text({ text: " " }));
    });

    this._oExpenseDialog.open();
}

,_onChartSelect: function(oEvent) {
     const oVM = this.getView().getModel("viewModel");

// Drill only if enabled
if (oVM.getProperty("/enableDrill") &&
    oVM.getProperty("/drillLevel") === "category") {

    oVM.setProperty("/drillLevel", "subcategory");
    oVM.setProperty("/groupBy", "subcategory");

    this._buildChart();
    return;
}


    const aData = oEvent.getParameter("data");
    if (!aData || !aData.length) return;

    const aSelectedGroups = aData.map(d => d.data.Group);

    const aExpenses = this.getView().getModel("oExpenseModel").getProperty("/expenses") || [];
    const aFiltered = aExpenses.filter(e =>
        aSelectedGroups.includes(e.category) ||
        aSelectedGroups.includes(e.subcategory) ||
        aSelectedGroups.includes(e.payment_mode)
    );

    this._showExpenseDialogWithData(aFiltered);
}



,
onDrillBack: function () {
     if(!this.userSubcriptionValidation("EXPENSE_OVERVIEW_DRILLBACK")){
        return;
    }
    const oVM = this.getView().getModel("viewModel");
    oVM.setProperty("/drillLevel", "category");
    oVM.setProperty("/groupBy", "category");
    this._buildChart();
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