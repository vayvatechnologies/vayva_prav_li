sap.ui.define([
	'./BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/ui/Device',
	'sap/ui/demo/toolpageapp/model/formatter',
	'sap/ui/core/BusyIndicator',
	'sap/m/MessageToast',
     "sap/ui/core/Fragment",
	 "sap/m/BusyDialog" ,
	 "sap/m/MessageBox" ,
     
 ], function (BaseController, JSONModel, Device, formatter, BusyIndicator, MessageToast,Fragment,BusyDialog,MessageBox) {
	"use strict";
	var oGlobalModel, oRouter
	return BaseController.extend("sap.ui.demo.toolpageapp.controller.Dashboard", {
		formatter: formatter,

		onInit: function () {
			this.getView().setModel(this.getOwnerComponent().getModel("oGlobalAIModel"), "oGlobalAIModel");
			oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oGlobalModel = this.getView().getModel("oGlobalAIModel");
			oRouter.getRoute("Dashboard").attachMatched(this.onObjectMatched, this);

			var ouserModel = new JSONModel({ toogleOverviewShow: true, overview: [{ "show": false }] ,
             
            });
			this.getView().setModel(ouserModel, "oUserDashboardModel");



		},
		onObjectMatched: function () {
			BusyIndicator.hide();
			this.fetchDashboardDetails();
			//this.getUserDashboardDetails();

			if (!oGlobalModel.getProperty("/ApplicationConfigurations/isUserDetailsLoaded") ||
				!oGlobalModel.getProperty("/ApplicationConfigurations/isApplicationDetailsLoaded")) {
				this.fnCkUserLoggedIn(oRouter,"home");
			}
		},
		 getUserAuthToken: function () {
            const oToken = localStorage.getItem("pravAPP_Authtoken_forService");

            // const oToken = sap.ui.getCore().getModel("oUserExpenseModel").getData().auth_token;
            if (!oToken) {
 				this.fnCkUserLoggedIn(oRouter,"home");
            }
            return oToken;
        },
		fetchDashboardDetails:function(){
			 var that = this;
            const oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, "dashboardDetailModel");
            const sAuthToken = that.getUserAuthToken();

            if (sAuthToken) {
                 BusyIndicator.show(0);

                const oPayload = {
                    sAuthToken: sAuthToken
                };

                $.ajax({
                    url: "/api/v1/userDetail/fetchDashboardDetails",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();
                        let oUserdetail = sap.ui.getCore().getModel("oUserDetailsModel").getData()
                        
                        // Load data into model
                        const dashboardDetailModel = new sap.ui.model.json.JSONModel(oResponse.data);
                        that.getView().setModel(dashboardDetailModel, "dashboardDetailModel");

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
		getUserDashboardDetails: function () {
			var that = this;
			const oAppModel = new sap.ui.model.json.JSONModel();
			oAppModel.loadData("model/service/userDashboard.json");
			oAppModel.attachRequestCompleted(function (oEvent) {

				that.setModel(oAppModel, "oUserDashboardDataModel");
				var msg = 'Dashboard Details loaded successfully!';
				MessageToast.show(msg);
			});
			// Define the error callback for loadData
			oAppModel.attachRequestFailed(function (_oEvent) {
				that.setModel(oAppModel, "oUserDashboardDataModel");
				setTimeout(function () {
					sap.m.MessageBox.error("Unable to load dashboard details.\n" +
						". Please check your network or Refresh.",
						{
							title: "Error Loading App!",
							styleClass: that.getOwnerComponent().getContentDensityClass(),
							actions: [sap.m.MessageBox.Action.CLOSE],
							onClose: function (oAction) {
								// Optional: handle when user clicks "Close"
								//location.reload();
							}
						}
					);
				}, 0); // 0ms timeout ensures it's called after UI rendering

			});

		},

		onToggleCarousel: function () {
			var oCarousel = this.getView().getModel("oUserDashboardModel").getProperty("/toogleOverviewShow")
			this.getView().getModel("oUserDashboardModel").setProperty("/toogleOverviewShow", !oCarousel)
		},
		onNavtoToDo : function(){
			this.fnCkUserLoggedIn(oRouter,"Todo")
		},
		onNavtoExpense : function(){
			this.fnCkUserLoggedIn(oRouter,"ExpenseTracker")
		},
		onNavtoCalender : function(){
			this.fnCkUserLoggedIn(oRouter,"Calendar")
		},
		onNavtoAddAppointment : function(){
			this.fnCkUserLoggedIn(oRouter,"Calendar")
		},
		onOpenHealthMonitor: function () {
			 var oView = this.getView();
            

            if (!this._oHealthDialog) {
                this._oHealthDialog = sap.ui.xmlfragment(
                    oView.getId(),
					"sap.ui.demo.toolpageapp.view.user.fragment.HealthMonitor",
                    this
                );
                oView.addDependent(this._oHealthDialog);
            }

            // Full screen on phone
            //this._oHealthDialog.setStretch(Device.system.phone);

            this._oHealthDialog.open();

			 
		},
        onAfterOpenHealthMonitor :function(){
            var oHealthDetail = this.getView().getModel("dashboardDetailModel").getProperty("/healthDetail")
            this.getView().byId("healthMonitor_waters").setValue(oHealthDetail.watercurrent)
            this.getView().byId("healthMonitor_steps").setValue(oHealthDetail.stepscurrent)
            this.getView().byId("healthMonitor_sleep").setValue(oHealthDetail.sleepcurrent)
        },
		// Destroy fragment after close
        onAfterCloseHealthMonitor: function () {
            if (this._oHealthDialog) {
                this._oHealthDialog.destroy();
                this._oHealthDialog = null;
            }
        },
        onCloseHealthMonitor: function () {
            if (this._oHealthDialog) {
                this._oHealthDialog.close();
            }
        },
        // ================= SAVE + VALIDATION =================
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
 
            var oPayload = {
                sAuthToken: sAuthToken,  
                date:new Date().toISOString().slice(0,10),
                water:iWater,
                steps: iSteps,
                sleep:iSleep
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
                        oController.onCloseHealthMonitor();
                        oController.fetchDashboardDetails();
                    } else {
                        oController.onCloseHealthMonitor();
                        oController.createMessageStrip(true, response.message || "Error occurred", "Error");

                    }
                },
                error: function (xhr) {
                    BusyIndicator.hide();

                    let oError = {};
                    try {
                        oError = JSON.parse(xhr.responseText);
                    } catch (err) { }

                    oController.onCloseHealthMonitor();
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

	 

	});
});