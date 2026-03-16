sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	'sap/ui/demo/toolpageapp/util/util',
], function (Controller, UIComponent,Util) {
	"use strict";

	return Controller.extend("sap.ui.demo.toolpageapp.controller.BaseController", {
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		
		getBundleTextByModel: function (sI18nKey, oResourceModel, aPlaceholderValues) {
			return oResourceModel.getResourceBundle().then(function (oBundle) {
				return oBundle.getText(sI18nKey, aPlaceholderValues);
			});
		},

		createMessageStrip: function (showMessageStrip, text, type) {
			// Check if the model already exists
			var oMessageModel = this.getView().getModel("messageStripModel");

			if (!oMessageModel) {
				// If model doesn't exist, create it
				oMessageModel = new sap.ui.model.json.JSONModel({
					showMessageStrip: showMessageStrip,
					text: text,
					type: type, // Can be "Error", "Success", "Warning", "Information"
					showIcon: true,
					showCloseButton: true
				});
				this.getView().setModel(oMessageModel, "messageStripModel");
			} else {
				// If model exists, just update its properties
				oMessageModel.setProperty("/showMessageStrip", showMessageStrip);
				oMessageModel.setProperty("/text", text);
				oMessageModel.setProperty("/type", type);
			}
			if (oMessageModel.getProperty("/showMessageStrip")) {
				// Auto-hide after 3 seconds
				setTimeout(function () {
					oMessageModel.setProperty("/showMessageStrip", false);
				}, 6000);
			}
		},
		fnCkUserLoggedIn:function(oRouter,Key){
			
			
			const oRoutingConfig = this.getOwnerComponent().getManifestEntry("sap.ui5").routing;
			const aRoutes = oRoutingConfig.routes;

			const oCurrentRoute = aRoutes.find(r => r.name === Key);
			if(!oCurrentRoute.loginRequired){
				oRouter.navTo(Key);
                return;
			}

			let oGlobalModel = this.getView().getModel("oGlobalAIModel");
			if (oCurrentRoute.loginRequired && oGlobalModel.getProperty("/ApplicationConfigurations/isUserDetailsLoaded") &&
                oGlobalModel.getProperty("/ApplicationConfigurations/isApplicationDetailsLoaded")) {
                oRouter.navTo(Key);
                return;
            }
			else{				
				this.createMessageStrip(true, "Login required. You have been redirected to the login page.", "Error");
				oRouter.navTo("home");
			}
		},
		userSubcriptionValidation:function(expectedPlan,bShowMessage = true){
			let oUserData = sap.ui.getCore().getModel("oUserDetailsModel").getData();			 
            const sUserPlan = oUserData.userplan;

           const aAllowedPlans = Util.FEATURE_ACCESS[expectedPlan];

            if (!aAllowedPlans) {
                return false; // feature not defined
            }

            if (aAllowedPlans.includes(sUserPlan)) {
				bShowMessage = false;
                return true; // allowed
            }

            if (bShowMessage) {
				this.createMessageStrip(true,  "This feature is available only with the " + aAllowedPlans.join(", ") + " subscription plan."
					, "Error");
				   this._openSubscriptionDialog(aAllowedPlans,sUserPlan);
				   return false
				sap.m.MessageBox.warning(
					"This feature is available only with the " + aAllowedPlans.join(", ") + " subscription plan.",
					{
						title: "Required Plan: " 
					}
				);
				
			
			}
            return false; // access blocked
        },
		 
_navigateToPlans: function () {
    this._oSubscriptionDialog.close();
    this.navtoUpgradePlans()
},
navtoUpgradePlans :function(){
window.location.href = "/plans.html";
},

		_openSubscriptionDialog: function (aAllowedPlans, sUserPlan) {

    if (this._oSubscriptionDialog) {
        this._oSubscriptionDialog.destroy();
    }

    this._oSubscriptionDialog = new sap.m.Dialog({
        title: "Upgrade Required",
        type: "Message",
        contentWidth: "480px",
        content: [

            new sap.m.VBox({
                alignItems: "Center",
                items: [

                    new sap.m.IllustratedMessage({
                        illustrationType:"sapIllus-UnableToLoad",
                        title: "Upgrade Your Plan",
                        description: "Unlock this feature by upgrading your subscription."
                    }).addStyleClass("sapUiTinyMarginBottom"),

                    new sap.m.VBox({
                        width: "100%",
                        items: [

                            new sap.m.Label({
                                text: "Your Current Plan"
                            }).addStyleClass("sapUiTinyMarginTop"),

                            new sap.m.ObjectStatus({
                                text: sUserPlan,
                                state: "Error"
                            }).addStyleClass("planBadge"),

                            new sap.m.Label({
                                text: "Required Plan(s)"
                            }).addStyleClass("sapUiTinyMarginTop"),

                            new sap.m.ObjectStatus({
                                text: aAllowedPlans.join(", "),
                                state: "Success"
                            }).addStyleClass("planBadge")
                        ]
                    }).addStyleClass("sapUiSmallMarginTop")

                ]
            }).addStyleClass("upgradeDialogContent")

        ],
        beginButton: new sap.m.Button({
            text: "Upgrade Now",
            type: "Emphasized",
            icon: "sap-icon://arrow-top",
            press: function () {
                this._navigateToPlans();
                this._oSubscriptionDialog.close();
            }.bind(this)
        }),
        endButton: new sap.m.Button({
            text: "Maybe Later",
            press: function () {
                this._oSubscriptionDialog.close();
            }.bind(this)
        }),
        afterClose: function () {
            this._oSubscriptionDialog.destroy();
            this._oSubscriptionDialog = null;
        }.bind(this)
    });

    this._oSubscriptionDialog.open();
}
,
		 






	});

});