sap.ui.define([
    'sap/ui/demo/toolpageapp/controller/BaseController',
    "sap/ui/demo/toolpageapp/model/models",
    'sap/ui/model/json/JSONModel',
    'sap/ui/Device',
    'sap/ui/demo/toolpageapp/model/formatter',
    'sap/ui/core/BusyIndicator',
    'sap/m/MessageToast'
], function (BaseController, models, JSONModel, Device, formatter, BusyIndicator,MessageToast) {
    "use strict";
    var oGlobalModel, oRouter
    return BaseController.extend("sap.ui.demo.toolpageapp.controller.user.health.HealthMonitor", {
        formatter: formatter,

        onInit: function () {
            this.getView().setModel(this.getOwnerComponent().getModel("oGlobalAIModel"), "oGlobalAIModel");
            oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oGlobalModel = this.getView().getModel("oGlobalAIModel");
            oRouter.getRoute("HealthMonitor").attachMatched(this.onObjectMatched, this);

var oVizFrame = this.getView().byId("healthVizFrame");
    var oPopOver = this.getView().byId("healthPopover");
    oPopOver.connect(oVizFrame.getVizUid());
     this._updateChart("water");

        },
     
        onObjectMatched: function () {
            BusyIndicator.hide();
            if (!oGlobalModel.getProperty("/ApplicationConfigurations/isUserDetailsLoaded") ||
                !oGlobalModel.getProperty("/ApplicationConfigurations/isApplicationDetailsLoaded")) {
                this.fnCkUserLoggedIn(oRouter, "home")
                return;
            }
            var oModel = new sap.ui.model.json.JSONModel({
                showTable: true,
                showChart: false,
                showNotProUserMessage: false,
                isProUser: false   // 🔐 change to true for Pro users
            });
            this.getView().setModel(oModel);

            this.fnResetHealthMonitorTable();

            this.getView().byId("healthMonitorDate").setDateValue(new Date());
            this.fnResetHealthMonitorInput();
        },

        getUserAuthToken: function () {
            const oToken = localStorage.getItem("pravAPP_Authtoken_forService");

            // const oToken = sap.ui.getCore().getModel("oUserExpenseModel").getData().auth_token;
            if (!oToken) {
                this.fnCkUserLoggedIn(oRouter, "home")
            }
            return oToken;
        },
        fnResetHealthMonitorTable: function () {
            var that = this;
            //Reset Health table  
            var oModel = this.getView().getModel();
            oModel.setProperty("/showNotProUserMessage", false);
            oModel.setProperty("/showTable", true); 
            oModel.setProperty("/showChart", false); 

            const oResetModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oResetModel, "oHealthMonitorModel");
            const sAuthToken = that.getUserAuthToken();

            if (sAuthToken) {
                BusyIndicator.show(0);

                const oPayload = {
                    sAuthToken: sAuthToken
                };

                $.ajax({
                    url: "/api/v1/userDetail/getUserHealthHistroy",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();

                        // Load data into model
                        const oUserExpensesModel = new sap.ui.model.json.JSONModel(oResponse);
                        that.getView().setModel(oUserExpensesModel, "oHealthMonitorModel");

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
        fnResetHealthMonitorInput: function () {
            let date = this.getView().byId("healthMonitorDate").getDateValue();
            let that = this;
            date = sap.ui.core.format.DateFormat
  .getDateInstance({ pattern: "yyyy-MM-dd" })
  .format(date);
            const sAuthToken = that.getUserAuthToken();

            if (sAuthToken) {
                BusyIndicator.show(0);

                const oPayload = {
                    sAuthToken: sAuthToken,
                    date: date//new Date(date).toISOString().slice(0, 10)
                };

                $.ajax({
                    url: "/api/v1/userDetail/fetchHealthDetailbyDate",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();
                        const oHealthDetail = oResponse?.data?.[0] || {};

                        that.getView().byId("healthMonitor_waters")?.setValue(oHealthDetail.watercurrent || 0);
                        that.getView().byId("healthMonitor_steps")?.setValue(oHealthDetail.stepscurrent || 0);
                        that.getView().byId("healthMonitor_sleep")?.setValue(oHealthDetail.sleepcurrent || 0);

                        // Load data into model
                        const oUserExpensesModel = new sap.ui.model.json.JSONModel(oResponse);
                        that.getView().setModel(oUserExpensesModel, "oHealthDetailModel");

                        MessageToast.show(oResponse.message);
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
        onSaveHealthData: function () {
            var bError = false;

            var iWater = this.getView().byId("healthMonitor_waters").getValue();
            var iSleep = this.getView().byId("healthMonitor_sleep").getValue();
            var iSteps = this.getView().byId("healthMonitor_steps").getValue();

            // Reset value states
            this._setValueState("healthMonitor_waters", "None");
            this._setValueState("healthMonitor_sleep", "None");
            this._setValueState("healthMonitor_steps", "None");

            if (!iWater || iWater <= 0) {
                this._setValueState("healthMonitor_waters", "Error");
                bError = true;
            }
            if (!iSleep || iSleep <= 0) {
                this._setValueState("healthMonitor_sleep", "Error");
                bError = true;
            }
            if (!iSteps || iSteps <= 0) {
                this._setValueState("healthMonitor_steps", "Error");
                bError = true;
            }

            var oController = this;
            const sAuthToken = oController.getUserAuthToken();
            if (sAuthToken) {
                BusyIndicator.show(0);
                let date = this.getView().byId("healthMonitorDate").getDateValue();
 date = sap.ui.core.format.DateFormat
  .getDateInstance({ pattern: "yyyy-MM-dd" })
  .format(date);
                var oPayload = {
                    sAuthToken: sAuthToken,
                    date: date,//new Date(date).toISOString().slice(0, 10),
                    water: iWater,
                    steps: iSteps,
                    sleep: iSleep
                };

                // Call your backend service
                $.ajax({
                    url: "/api/v1/userDetail/saveHealthDetail",
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (response) {
                        BusyIndicator.hide();
                        if (response.status === 'Success') {
                            oController.createMessageStrip(true, response.message, "Success");
                            oController.onObjectMatched(); // your existing load function


                        } else {
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
            }
        },
          _setValueState: function (sId, sState) {
            var oControl = this.getView().byId(sId);
            if (oControl && oControl.setValueState) {
                oControl.setValueState(sState);
            }
        },
        onEdit: function (oEvent) {
    const oButton = oEvent.getSource();
    const oContext = oButton.getBindingContext("oHealthMonitorModel");

    if (!oContext) {
        return;
    }

    const oRowData = oContext.getObject();
    const sDate = new Date(oRowData.date); // assuming backend date format

    // Set date in DatePicker
    const oDatePicker = this.getView().byId("healthMonitorDate");
    if (oDatePicker && sDate) {
        oDatePicker.setDateValue(new Date(sDate));
    }

    // Load data for selected date
    this.fnResetHealthMonitorInput();
     const oSlider = this.getView().byId("healthMonitor_waters");
    // Focus the slider
      setTimeout(function () {
        oSlider.focus();
    }, 0);

},
onDelete: function (oEvent) {
    const oButton = oEvent.getSource();
    const oContext = oButton.getBindingContext("oHealthMonitorModel");

    if (!oContext) {
        return;
    }

    const oRowData = oContext.getObject();
    const sId = oRowData.id; // make sure your model has `id`

    const sAuthToken = this.getUserAuthToken();
    const that = this;

    if (!sAuthToken || !sId) {
        return;
    }

    BusyIndicator.show(0);

    const oPayload = {
        sAuthToken: sAuthToken,
        id: sId
    };

    $.ajax({
        url: "/api/v1/userDetail/deleteHealthDetail",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(oPayload),
        success: function (oResponse) {
            BusyIndicator.hide();

            that.createMessageStrip(true, oResponse.message, "Success");

            // Refresh table model
            that.onObjectMatched(); // your existing load function
        },
        error: function (xhr) {
            BusyIndicator.hide();

            let oError = {};
            try {
                oError = JSON.parse(xhr.responseText);
            } catch (e) {}

            that.createMessageStrip(true, oError.message || "Delete failed", "Error");
        }
    });
},
        onToggleChart: function (oEvent) {
            var oModel = this.getView().getModel();
            var bEnabled = oEvent.getParameter("state");


            if (bEnabled) {
                if (this.userSubcriptionValidation("HEALTH_TRACKER_CHART")) {//oModel.getProperty("/isProUser")
                    oModel.setProperty("/showTable", false);
                    oModel.setProperty("/showChart", true);
                oModel.setProperty("/showNotProUserMessage", false);
                 oEvent.getSource().setState(true);
                    return
                } 
                else{
                     oEvent.getSource().setState(false);
                }
            } else {
                oModel.setProperty("/showNotProUserMessage", false);
                oModel.setProperty("/showChart", false);
                 oEvent.getSource().setState(false);
                oModel.setProperty("/showTable", true);
            }
        },




        onMetricChange: function (oEvent) {
    var sKey = oEvent.getSource().getSelectedKey();
    this._updateChart(sKey);
},
_updateChart: function (sMetric) {

    var oVizFrame = this.byId("healthVizFrame");
    var oDataset = oVizFrame.getDataset();

    var mConfig = {
        water: {
            label: "Water %",
            path: "water_percentage",
            color: "#2ECC71"
        },
        sleep: {
            label: "Sleep %",
            path: "sleep_percentage",
            color: "#3498DB"
        },
        steps: {
            label: "Steps %",
            path: "steps_percentage",
            color: "#F39C12"
        }
    };

    var oMetric = mConfig[sMetric];

    // Replace measure dynamically
    oDataset.removeAllMeasures();
    oDataset.addMeasure(
        new sap.viz.ui5.data.MeasureDefinition({
            name: oMetric.label,
            value: "{oHealthMonitorModel>" + oMetric.path + "}"
        })
    );

    // Update feeds
    oVizFrame.removeAllFeeds();
    oVizFrame.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
        uid: "valueAxis",
        type: "Measure",
        values: [oMetric.label]
    }));
    oVizFrame.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
        uid: "categoryAxis",
        type: "Dimension",
        values: ["Date"]
    }));

    // Chart properties
    oVizFrame.setVizProperties({
        title: {
            text: oMetric.label + " Trend"
        },
        valueAxis: {
            minValue: 0,
            maxValue: 100
        },
        plotArea: {
            colorPalette: [oMetric.color]
        }
    });
}


    });
});