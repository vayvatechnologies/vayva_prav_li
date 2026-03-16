sap.ui.define([
	'./BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/ui/Device',
	'sap/ui/demo/toolpageapp/model/formatter',
	'sap/ui/core/BusyIndicator'
], function (BaseController, JSONModel, Device, formatter, BusyIndicator) {
	"use strict";
	let oRouter, oGlobalModel;

	return BaseController.extend("sap.ui.demo.toolpageapp.controller.Home", {
		formatter: formatter,

		onInit: function () {

			oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.getView().setModel(this.getOwnerComponent().getModel("oGlobalAIModel"), "oGlobalAIModel");
			oGlobalModel = this.getView().getModel("oGlobalAIModel")

			const oRoute = oRouter.getRoute("home");
			if (oRoute) {
				oRoute.attachMatched(this.onObjectMatched, this);
			}
		}, 
		onObjectMatched: function () {
			BusyIndicator.hide();
			if (!oGlobalModel.getProperty("/ApplicationConfigurations/isUserDetailsLoaded") ||
				!oGlobalModel.getProperty("/ApplicationConfigurations/isApplicationDetailsLoaded")) {
				this.fnCkUserLoggedIn(oRouter,"home")
                return;
			}
			if (oGlobalModel.getProperty("/ApplicationConfigurations/isUserDetailsLoaded") ||
				oGlobalModel.getProperty("/ApplicationConfigurations/isApplicationDetailsLoaded")) {
				this.fnCkUserLoggedIn(oRouter,"Dashboard")
                return;
			}
			this.fnResetInputs()
		}, 
		fnResetInputs:function(){	
			var oView = this.getView();
			oView.byId("idInputUserID").setValue("");
			oView.byId("idInputPwd").setValue("");
			oView.byId("idInputRememberme").setSelected(false);
		},
		

		onLoginPress: function () {
			// this.testLogin2();
			var oView = this.getView();
			var that = this;
			var bRememberMe = false;
			var payload = {};
			var sAuthToken = localStorage.getItem("pravAPP_UserAuthtoken")

			// Get inputs
			if (!sAuthToken || sAuthToken === "") {
				var sUsername = oView.byId("idInputUserID").getValue();
				var sPassword = oView.byId("idInputPwd").getValue();
				bRememberMe = oView.byId("idInputRememberme").getSelected();
				if (!sUsername || !sPassword) {
					that.createMessageStrip(true, "Please enter both username and password!", "Error")
					return;
				}
				if (!bRememberMe) {
					localStorage.removeItem("pravAPP_UserAuthtoken");
				}
				payload = {
					username: sUsername,
					password: sPassword
				};
			}
			else {
				bRememberMe = true;
				payload = {
					authtoken: sAuthToken
				};
			}

			this.fnCheckAuth(payload);
		 
		},
		fnCheckAuth:function(oPayload){
			var that = this;
			const oLoginModel = new sap.ui.model.json.JSONModel();
  			oLoginModel.loadData(
					"/api/v1/auth/login",  // URL
					JSON.stringify(oPayload),                     // Payload
					true,                                                 // async
					"POST",                                               // <<<<<< METHOD
					false,                                                // cache
					false,                                                // withCredentials
					{
						"Content-Type": "application/json"
					}
				);
			oLoginModel.attachRequestCompleted(function (oEvent) { 
				that.fnSuccessHandler(that,oLoginModel.getData())
			});
			// Define the error callback for loadData
			oLoginModel.attachRequestFailed(function (event) {
				var xhr = event.mParameters;
				var text = xhr && xhr.responseText ? xhr.responseText : "{}";
				var oError = {};
				try { oError = JSON.parse(text); } catch (e) {}
				that.createMessageStrip(true, oError.message || "Login failed", "Error");
				that.fnResetInputs()
				that.getModel("oGlobalAIModel").setProperty("/ApplicationConfigurations/isUserDetailsLoaded", false);
				that.fnCkUserLoggedIn(oRouter,"home")
			});
		},
		fnSuccessHandler:function(that,oData){
			
			// If auth expired, show message and redirect
			if (oData.status === "Error") {
				that.createMessageStrip(true, oData.message, oData.status);
				that.fnResetInputs()
				return; // Stop further processing
			}

			
			if (oData.status && oData.status === "Success") {
				let bRememberMe = this.getView().byId("idInputRememberme").getSelected();
				localStorage.setItem("pravAPP_Authtoken_forService",  oData.data.auth_token); 
				if (bRememberMe) {
					// Store the token in localStorage if "Remember Me" is selected
					localStorage.setItem("pravAPP_UserAuthtoken",  oData.data.auth_token); //send auth
				}
				that.getModel("oGlobalAIModel").setProperty("/ApplicationConfigurations/isUserDetailsLoaded", true);
				that.fnCkUserLoggedIn(oRouter,"Dashboard")
				that.createMessageStrip(true, oData.message, oData.status);
				var oAppController = that.getOwnerComponent().appController;
				if (oAppController) {
					oAppController.fnGetLoggedInUserDetails(oData.data.auth_token); //send auth
				}				
				that.fnResetInputs()				
				return;
			}
			
			that.createMessageStrip(true, oData.message, oData.status)

		},
		onSignUpPress: function () {
			window.location.href = "/";
		}
	});
});