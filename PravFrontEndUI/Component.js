sap.ui.define([
	"sap/ui/core/UIComponent",
	"./model/models",
	"sap/ui/core/routing/History",
	"sap/ui/Device",
	"sap/ui/model/resource/ResourceModel"
], function (UIComponent, models, History, Device) {
	"use strict";

	return UIComponent.extend("sap.ui.demo.toolpageapp.Component", {
		metadata: {
			manifest: "json",
			interfaces: ["sap.ui.core.IAsyncContentCreation"]
		},

		init: function () {
			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);
			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// create the views based on the url/hash
 			const oRouter = this.getRouter();
     		oRouter.initialize();

			this.initializeApplication();


    $.ajaxSetup({
        complete: function (oXHR) {
            try {
                var response = JSON.parse(oXHR.responseText);

                if (response?.errorcode === "AUTH_EXPIRED") {
                    // optional: clear session / models
                    sap.m.MessageToast.show("Session expired. Please login again.");

                    oRouter.navTo("home", {}, true); // true = replace history
                }
            } catch (e) {
                // ignore non-JSON responses
            }
        }
    });

		},
		 
		getContentDensityClass: function () {
			if (!this._sContentDensityClass) {
				if (!Device.support.touch) {
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},
		initializeApplication: function () {
			var oUserDetailsModel = new sap.ui.model.json.JSONModel({
				userDetails: {
				initial: "Info"
				}
			}); 
			this.setModel(oUserDetailsModel, "oUserDetailsModel");

			const oGlobalModel = new sap.ui.model.json.JSONModel(models.createApplicationModel());
			this.setModel(oGlobalModel, "oGlobalAIModel");


			// PRAV AI Chatbox
			// Component.js init or in ExpenseOverview.controller.js onInit
var oPravAIUIModel = new sap.ui.model.json.JSONModel({
    isPremiumUser: true, // change true/false dynamically
    showNotProUserMessage: false
});

this.setModel(oPravAIUIModel, "userPravAIUIModel");
		},

	});
});