sap.ui.define([
	'sap/ui/demo/toolpageapp/controller/BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/ui/Device',
	'sap/ui/demo/toolpageapp/model/formatter',
	'sap/ui/core/BusyIndicator',
	'sap/m/MessageToast'
], function (BaseController, JSONModel, Device, formatter, BusyIndicator, MessageToast) {
	"use strict";
	var oGlobalModel, oRouter
	return BaseController.extend("sap.ui.demo.toolpageapp.controller.settings", {
		formatter: formatter,

		onInit: function () {
			this.getView().setModel(this.getOwnerComponent().getModel("oGlobalAIModel"), "oGlobalAIModel");
			oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oGlobalModel = this.getView().getModel("oGlobalAIModel");
			oRouter.getRoute("settings").attachMatched(this.onObjectMatched, this);

			var ouserModel = new JSONModel({ toogleOverviewShow: true, overview: [{ "show": false }] });
			this.getView().setModel(ouserModel, "oUserDashboardModel");



		},
		onObjectMatched: function () {
			BusyIndicator.hide(); 

			if (!oGlobalModel.getProperty("/ApplicationConfigurations/isUserDetailsLoaded") ||
				!oGlobalModel.getProperty("/ApplicationConfigurations/isApplicationDetailsLoaded")) {
				this.fnCkUserLoggedIn(oRouter,"home")
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
	});
});