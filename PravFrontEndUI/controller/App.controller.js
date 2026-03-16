sap.ui.define([
	'./BaseController',
	'sap/ui/demo/toolpageapp/model/formatter',
	'sap/m/ResponsivePopover',
	'sap/m/MessagePopover',
	'sap/m/ActionSheet',
	'sap/m/Button',
	'sap/m/Link',
	'sap/m/NotificationListItem',
	'sap/m/MessageItem',
	'sap/ui/core/CustomData',
	'sap/m/MessageToast',
	'sap/ui/Device',
	'sap/ui/core/syncStyleClass',
	'sap/m/library',
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	'sap/ui/core/BusyIndicator'
], function (
	BaseController, formatter,
	ResponsivePopover,
	MessagePopover,
	ActionSheet,
	Button,
	Link,
	NotificationListItem,
	MessageItem,
	CustomData,
	MessageToast,
	Device,
	syncStyleClass,
	mobileLibrary,
	Fragment,
	MessageBox,BusyIndicator
) {
	"use strict";

	// shortcut for sap.m.PlacementType
	var PlacementType = mobileLibrary.PlacementType;

	// shortcut for sap.m.VerticalPlacementType
	var VerticalPlacementType = mobileLibrary.VerticalPlacementType;

	// shortcut for sap.m.ButtonType
	var ButtonType = mobileLibrary.ButtonType;
	var oRouter;

	return BaseController.extend("sap.ui.demo.toolpageapp.controller.App", {

		_bExpanded: true,
		formatter: formatter,

		onInit: function () {
			// Save reference of AppController in Component
			this.getOwnerComponent().appController = this;
			this.fnResetAllModelData();

			oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.getView().setModel(this.getOwnerComponent().getModel("oGlobalAIModel"), "oGlobalAIModel");

			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			// if the app starts on desktop devices with small or medium screen size, collaps the side navigation
			if (Device.resize.width <= 1024) {
				this.onSideNavButtonPress();
			}

			Device.media.attachHandler(this._handleWindowResize, this);
			this.getRouter().attachRouteMatched(this.onRouteChange.bind(this));

			// Create MessageStrip model
			this.createMessageStrip(false, "", "Error")
			

			this.fnCheckApplicationDetail();

			this.getView().byId("idAdminButton").setVisible(false)

		},
		
		 getUserAuthToken: function () {
            const oToken = localStorage.getItem("pravAPP_Authtoken_forService");

            // const oToken = sap.ui.getCore().getModel("oUserExpenseModel").getData().auth_token;
            if (!oToken) {
 				this.fnCkUserLoggedIn(oRouter,"home");
            }
            return oToken;
        },
		fnResetAllModelData:function(){
			const oResetDataModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oResetDataModel, "oGlobalNotifModel");
			this.getView().setModel(oResetDataModel, "oSideMenu");
			this.getView().setModel(oResetDataModel, "oUserDetailsModel");
			sap.ui.getCore().setModel(oResetDataModel, "oUserDetailsModel");
		},
		fnCheckApplicationDetail: function () {
			var that = this;
			const oAppModel = new sap.ui.model.json.JSONModel();
			const oPayload={}
 			oAppModel.loadData(
					"/api/v1/applicationSettings/getApplicationDetails",  // URL
					JSON.stringify(oPayload),                     // Payload
					true,                                                 // async
					"POST",                                               // <<<<<< METHOD
					false,                                                // cache
					false,                                                // withCredentials
					{
						"Content-Type": "application/json"
					}
				);
			oAppModel.attachRequestCompleted(function (oEvent) { 
				if(oAppModel.getData().data){
					if(oAppModel.getData().data[0].maintenance.isMaintenanceMode){
						that.getModel("oGlobalAIModel").setProperty("/maintenance/isUnderMaintenance", true);
						that.getModel("oGlobalAIModel").setProperty("/maintenance/maintenancemessage", oAppModel.getData().data[0].maintenance.maintenanceMessage);
						return;
					}
					that.getModel("oGlobalAIModel").setProperty("/maintenance/isUnderMaintenance", false);

					var oData = new sap.ui.model.json.JSONModel(oAppModel.getData().data[0]);
					that.setModel(oData, "oApplicationConfigModel");
					that.getModel("oGlobalAIModel").setProperty("/ApplicationConfigurations/isApplicationDetailsLoaded", true);
					var sAuthToken = localStorage.getItem("pravAPP_UserAuthtoken");
					if (sAuthToken) {

						that.fnGetLoggedInUserDetails(sAuthToken); //Fetcch Login User Detils if already login
					}
				}			
			});
			// Define the error callback for loadData
			oAppModel.attachRequestFailed(function (_oEvent) {
				that.getModel("oGlobalAIModel").setProperty("/ApplicationConfigurations/isApplicationDetailsLoaded", false);
				that.setModel(oAppModel, "oApplicationConfigModel");
				that.getModel("oGlobalAIModel").setProperty("/maintenance/isUnderMaintenance", true);

				setTimeout(function () {
					sap.m.MessageBox.error(
						"Unable to load application details.\n" +
						"The app configuration could not be fetched. Please check your network or Refresh.",
						{
							title: "Error Loading App!",
							styleClass: that.getOwnerComponent().getContentDensityClass(),
							actions: ["Refresh"],
							onClose: function (oAction) {
								// Optional: handle when user clicks "Close"
								//location.reload();
							}
						}
					);
				}, 0); // 0ms timeout ensures it's called after UI rendering

			});

		},
		


		onExit: function () {
			Device.media.detachHandler(this._handleWindowResize, this);
		},
		 



		onRouteChange: function (oEvent) {
			//this.getModel('side').setProperty('/selectedKey', oEvent.getParameter('name'));
			if (Device.system.phone) {
				//this.onSideNavButtonPress();
			}
		},




		onSideNavButtonPress: function () {
			var oToolPage = this.byId("app");
			var bSideExpanded = oToolPage.getSideExpanded();
			this._setToggleButtonTooltip(bSideExpanded);
			oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
		},

		_setToggleButtonTooltip: function (bSideExpanded) {
			var oToggleButton = this.byId('sideNavigationToggleButton');
			this.getBundleText(bSideExpanded ? "expandMenuButtonText" : "collpaseMenuButtonText").then(function (sTooltipText) {
				oToggleButton.setTooltip(sTooltipText);
			});
		},


		onSideMenuSelect: function (oEvent) {
			if (Device.system.phone) {
				this.onSideNavButtonPress();
			}
			const oSelectedItem = oEvent.getParameter("item");
			const sKey = oSelectedItem.getKey(); 
 			this.fnCkUserLoggedIn(oRouter,sKey)
		},

		/**
		 * Event handler for the notification button
		 * @param {sap.ui.base.Event} oEvent the button press event
		 * @public
		 */
		onNotificationPress: function (oEvent) {
			var oView = this.getView();
			const oUserDetails = sap.ui.getCore().getModel("oUserNotifModel").getData();
			 // Check if there is data
    if (!oUserDetails || oUserDetails.length === 0) {
        sap.m.MessageToast.show("You have no new notifications at the moment.");
		
				this.createMessageStrip(true, "No notifications found", "Information");
        return; // exit the function
    }
			const oNotifDataModel = new sap.ui.model.json.JSONModel({ notifications: oUserDetails });
			this.getView().setModel(oNotifDataModel, "oGlobalNotifModel");

			var oSource = oEvent.getSource();
			if (!this._oNotifPopover) {
				this._oNotifPopover = Fragment.load({
					id: oView.getId(),
					name: "sap.ui.demo.toolpageapp.view.AppInfo.UserNotificationPopover",
					controller: this
				}).then(function (oPopover) {
					oView.addDependent(oPopover);
					return oPopover;
				});
			}

			this._oNotifPopover.then(function (oPopover) {
				oPopover.openBy(oEvent.getSource());
			});

		},
		onCloseNotificationPopover: function (oEvent) {
			let oDialog = oEvent.getSource();
			while (oDialog && !oDialog.close) {
				oDialog = oDialog.getParent();
			}
			oDialog?.close();
		},
		onItemClose: async function (oEvent) {
    try {
        // 1️⃣ Get the item and its context
        var oItem = oEvent.getSource();
        var oContext = oItem.getBindingContext("oGlobalNotifModel");
        var sNotificationId = oContext.getProperty("notification_id");
        var bUnread = oContext.getProperty("unread");

        var oModel = this.getView().getModel("oGlobalNotifModel");
        var aNotifications = oModel.getProperty("/notifications");

        var sPath = oContext.getPath(); // e.g., "/notifications/2"
        var iIndex = parseInt(sPath.split("/").pop(), 10);
const sAuthToken = this.getUserAuthToken();

let oNotifData = oModel.getProperty(sPath)
oNotifData.unread = false;
oNotifData.sAuthToken = sAuthToken;


            if (!sAuthToken) {
				 sap.m.MessageToast.show("Failed to update notification User session expired.");
			}
        // 2️⃣ Call backend API to update notification
        const response = await fetch("/api/v1/userDetail/saveUserNotifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({...oNotifData
            })
        });

        if (!response.ok) {
            throw new Error("Failed to update notification on server");
        }

        // 3️⃣ Remove the item from the model after successful update
        aNotifications.splice(iIndex, 1);
        oModel.setProperty("/notifications", aNotifications);
        oModel.refresh(true);

        // 4️⃣ Show success message
        sap.m.MessageToast.show("Notification updated");

    } catch (err) {
        console.error(err);
        sap.m.MessageToast.show("Failed to update notification");
    }
},

	onItemClosebk: function (oEvent) {
    var oItem = oEvent.getSource();
    var oContext = oItem.getBindingContext("oGlobalNotifModel");

    var bUnread = oContext.getProperty("unread");
    var sNotificationId = oContext.getProperty("notification_id");

    var oModel = this.getView().getModel("oGlobalNotifModel");
    var aNotifications = oModel.getProperty("/notifications");

    var sPath = oContext.getPath(); // "/notifications/2"
    var iIndex = parseInt(sPath.split("/").pop(), 10);

    var that = this;

    // 🔹 Call backend API
    jQuery.ajax({
        url: "/updateNotification",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            notification_id: sNotificationId,
            unread: bUnread
        }),
        success: function () {
            // 🔹 remove item only after success
            aNotifications.splice(iIndex, 1);
            oModel.setProperty("/notifications", aNotifications);
            oModel.refresh(true);

            MessageToast.show("Notification updated");
        },
        error: function () {
            MessageToast.show("Failed to update notification");
        }
    });
},
	 




		getBundleText: function (sI18nKey, aPlaceholderValues) {
			return this.getBundleTextByModel(sI18nKey, this.getOwnerComponent().getModel("i18n"), aPlaceholderValues);
		},

		_handleWindowResize: function (oDevice) {
			if ((oDevice.name === "Tablet" && this._bExpanded) || oDevice.name === "Desktop") {
				this.onSideNavButtonPress();
				this._bExpanded = (oDevice.name === "Desktop");
			}
		},

		// ****************************** UserDetails  Start ******************************

		onUserNamePress: function (oEvent) {
			var oView = this.getView();

			// Formatter function must exist in the controller
			if (!this.convertDatetoUsertimeFormat) {
				this.convertDatetoUsertimeFormat = function (sDateTime) {
					return formatter.convertDatetoUsertimeFormat(sDateTime);
				};
			}

			// Load fragment lazily
			if (!this._oUserPopover) {
				sap.ui.core.Fragment.load({
					id: oView.getId(), // ensures unique IDs for fragment controls
					name: "sap.ui.demo.toolpageapp.view.AppInfo.UserInfoPopover",
					controller: this // pass controller for formatter access
				}).then(function (oPopover) {
					this._oUserPopover = oPopover;
					oView.addDependent(this._oUserPopover);
					this._oUserPopover.openBy(oEvent.getSource());
				}.bind(this));
			} else {
				this._oUserPopover.openBy(oEvent.getSource());
			}
		},


		onThemeChange: function (oEvent) {
			var oComboBox = oEvent.getSource();
			var sSelectedKey = oComboBox.getSelectedKey();
			sap.ui.getCore().applyTheme(sSelectedKey);
			this.getView().getModel("oUserDetailsPopoverModel").setProperty("/theme_preference", sSelectedKey);
			// Update global model
			sap.ui.getCore().getModel("oGlobalAIModel").setProperty("/theme_preference", sSelectedKey);
		},

		onSettingsPress: function () {
			this.fnCkUserLoggedIn(oRouter,"settings")
		},
		onContactSupport: function () {
			this.fnCkUserLoggedIn(oRouter,"contact")
		},

		onAboutPress: function () {
			if (!this._aboutDialog) {
				this._aboutDialog = sap.ui.xmlfragment("sap.ui.demo.toolpageapp.view.AppInfo.AboutDialog", this);
				this.getView().addDependent(this._aboutDialog);
			}
			this._aboutDialog.open();
		},

		onCloseAbout: function () {
			this._aboutDialog.close();
		},

		onSignOut: function () {
			// Clear localStorage to remove the auth token
			localStorage.removeItem("pravAPP_UserAuthtoken");
 
			// Reset the application configurations flag
			this.getModel("oGlobalAIModel").setProperty("/ApplicationConfigurations/isUserDetailsLoaded", false);
			this.fnInitilizeMenuandUserDetails(null)
			const oSideDataModel = new sap.ui.model.json.JSONModel({ navigation: [] });
			this.getView().setModel(oSideDataModel, "oSideMenu");
			// Optionally, show a message indicating the user has signed out
			this.createMessageStrip(true, "You have been signed out successfully.", "Success");

			// Navigate to the home page or login page
 			this.fnCkUserLoggedIn(oRouter,"home")
		},
		// ****************************** UserDetails  End ******************************
fnGetLoggedInUserDetails:function(sAuthToken){
			var that = this;
			
			this.getView().byId("idAdminButton").setVisible(false)
			if (sAuthToken) {
			BusyIndicator.show(0)
			const oUserDetailsModel = new sap.ui.model.json.JSONModel();
  			oUserDetailsModel.loadData(
					"/api/v1/userDetail/getUserDetails",  // URL
					JSON.stringify({sAuthToken}),                     // Payload
					true,                                                 // async
					"POST",                                               // <<<<<< METHOD
					false,                                                // cache
					false,                                                // withCredentials
					{
						"Content-Type": "application/json"
					}
				);
			oUserDetailsModel.attachRequestCompleted(function (oEvent) { 
					const oData = oUserDetailsModel.getData(); 
					
					if (oData.status && oData.status === "Success") {
						that.fnInitilizeMenuandUserDetails(oData)
						// Store the token in localStorage if "Remember Me" is selected
						that.getModel("oGlobalAIModel").setProperty("/ApplicationConfigurations/isUserDetailsLoaded", true);
 						that.fnCkUserLoggedIn(oRouter,"Dashboard")
					} else {
						that.getModel("oGlobalAIModel").setProperty("/ApplicationConfigurations/isUserDetailsLoaded", false);
						that.fnCkUserLoggedIn(oRouter,"home")
					}
			});
			// Define the error callback for loadData
			oUserDetailsModel.attachRequestFailed(function (event) {
				BusyIndicator.hide()
				var xhr = event.mParameters;
				var text = xhr && xhr.responseText ? xhr.responseText : "{}";
				var oError = {};
				try { oError = JSON.parse(text); } catch (e) {}
				that.createMessageStrip(true, oError.message, "Error");
				localStorage.removeItem("pravAPP_UserAuthtoken")
				that.getModel("oGlobalAIModel").setProperty("/ApplicationConfigurations/isUserDetailsLoaded", false);
 				that.fnCkUserLoggedIn(oRouter,"home")
			});
		}
		},
		 
		fnInitilizeMenuandUserDetails: function (userDtl) {
						BusyIndicator.hide()

    // --- Helper to safely reset model ---
    const resetModel = (name, initialValue = {}) => {
        const model = new sap.ui.model.json.JSONModel(initialValue);
        sap.ui.getCore().setModel(model, name);
        this.getView().setModel(model, name);
    };

    // --- Validate userDtl ---
    if (
        !userDtl ||
        typeof userDtl !== "object" ||
        !userDtl.data ||
        Object.keys(userDtl.data).length === 0
    ) {
        // RESET EVERYTHING
        resetModel("oUserDetailsModel", {});
        resetModel("oUserNotifModel", []);
        resetModel("oSideMenu", { navigation: [] });
        return;
    }

			const oUserDetailsModel = new sap.ui.model.json.JSONModel(userDtl.data.userdetails);
			sap.ui.getCore().setModel(oUserDetailsModel, "oUserDetailsModel");
			this.getView().setModel(oUserDetailsModel, "oUserDetailsModel");
			this.getView().getModel( "oUserDetailsModel").refresh
			
			const oUserNotifModel = new sap.ui.model.json.JSONModel(userDtl.data.notifications);
			sap.ui.getCore().setModel(oUserNotifModel, "oUserNotifModel");
			const oNotifDataModel = new sap.ui.model.json.JSONModel({ notifications: userDtl.data.notifications });
			this.getView().setModel(oNotifDataModel, "oGlobalNotifModel");

			this.getView().byId("idAdminButton").setVisible(userDtl.data.userdetails.isadmin===true)

			const oSideMenuData = [
    {
        "titleI18nKey": "Dashboard",
        "icon": "sap-icon://home",
        "expanded": true,
        "key": "Dashboard",
        "items": []
    },
    {
        "titleI18nKey": "Expense",
        "icon": "sap-icon://settings",
        "expanded": true,
        "key": "ExpenseTracker",
        "items": [
            {
                "titleI18nKey": "expenseTracker",
                "key": "ExpenseTracker"
            },
            {
                "titleI18nKey": "expenseOverview",
                "key": "ExpenseOverview"
            },
            {
                "titleI18nKey": "ExpenseCategory",
                "key": "ExpenseCategory"
            }
        ]
    },
    {
        "titleI18nKey": "Health",
        "icon": "sap-icon://heart",
        "expanded": true,
        "key": "HealthMonitor",
        "items": [
            {
                "titleI18nKey": "HealthTracker",
                "key": "HealthMonitor"
            }
        ]
    },
    {
        "titleI18nKey": "Productivity",
        "icon": "sap-icon://calendar",
        "expanded": true,
        "key": "Todo",
        "items": [
            {
                "titleI18nKey": "ToDo",
                "key": "Todo"
            },
            {
                "titleI18nKey": "Calendars",
                "key": "Calendar"
            }
        ]
    }
];
			const oSideDataModel = new sap.ui.model.json.JSONModel({ navigation: oSideMenuData });
			this.getView().setModel(oSideDataModel, "oSideMenu");
			this.getView().getModel( "oSideMenu").refresh

		},

		onNavAdminDashboard : function(){
			this.fnCkUserLoggedIn(oRouter,"AdminDashboard")
		},


	});
});