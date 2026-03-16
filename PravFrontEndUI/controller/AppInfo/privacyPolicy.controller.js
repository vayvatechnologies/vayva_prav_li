sap.ui.define([
	'sap/ui/demo/toolpageapp/controller/BaseController',
	'sap/ui/demo/toolpageapp/model/formatter',
	'sap/ui/core/BusyIndicator'
], function (BaseController, formatter, BusyIndicator) {
	"use strict";
	var oGlobalModel, oRouter
	return BaseController.extend("sap.ui.demo.toolpageapp.controller.AppInfo.privacyPolicy", {
		formatter: formatter,
		onInit: function () {
			this.getView().setModel(this.getOwnerComponent().getModel("oGlobalAIModel"), "oGlobalAIModel");
			oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oGlobalModel = this.getView().getModel("oGlobalAIModel");
			oRouter.getRoute("privacyPolicy").attachMatched(this.onObjectMatched, this);
		},
		onObjectMatched: function () {
			BusyIndicator.hide(); 
		}
	});
});