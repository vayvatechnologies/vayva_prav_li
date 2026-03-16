sap.ui.define([
	'sap/ui/demo/toolpageapp/controller/BaseController',
	'sap/ui/demo/toolpageapp/model/formatter',
	'sap/ui/core/BusyIndicator',
	 "sap/m/MessageBox",
], function (BaseController, formatter, BusyIndicator,MessageBox) {
	"use strict";
	var oGlobalModel, oRouter
	return BaseController.extend("sap.ui.demo.toolpageapp.controller.AppInfo.termsandConditions", {
		formatter: formatter,
		onInit: function () {
			this.getView().setModel(this.getOwnerComponent().getModel("oGlobalAIModel"), "oGlobalAIModel");
			oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oGlobalModel = this.getView().getModel("oGlobalAIModel");
			oRouter.getRoute("privacyPolicy").attachMatched(this.onObjectMatched, this);
		},
		onObjectMatched: function () {
			BusyIndicator.hide();
			 
		},
		onSubmitFeedback: function () {
            var oName = this.byId("inputName");
            var oEmail = this.byId("inputEmail");
            var oMessage = this.byId("inputMessage");

            // Validate required field
            if (!oMessage.getValue()) {
                MessageBox.error("Please enter a message before submitting.");
                return;
            }

            // Dummy success logic
            MessageBox.success("Thank you! Your feedback has been submitted.");

            // Clear inputs
            oName.setValue("");
            oEmail.setValue("");
            oMessage.setValue("");
        },
		 onGoToWebsite: function () {
            var sUrl = this.getView().getModel("oApplicationConfigModel").getProperty("/companyDetails/website");
            window.open(sUrl, "_blank");
        },

        onSendEmail: function () {
            var sEmail = this.getView().getModel("oApplicationConfigModel").getProperty("/companyDetails/companyName");
            window.location.href = "mailto:" + sEmail;
        }
	});
});