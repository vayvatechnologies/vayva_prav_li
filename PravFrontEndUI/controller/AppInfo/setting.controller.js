sap.ui.define([
	'sap/ui/demo/toolpageapp/controller/BaseController',
	'sap/ui/demo/toolpageapp/model/formatter',
	'sap/ui/core/BusyIndicator',
	"sap/ui/Device",
	"sap/base/Log" ,  
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/VBox"
], function (BaseController,formatter, BusyIndicator,Device,Log,JSONModel, MessageToast, Dialog, Button, Input, VBox) {
	

	"use strict";
	var oGlobalModel, oRouter
	return BaseController.extend("sap.ui.demo.toolpageapp.controller.AppInfo.setting", {
		formatter: formatter,
		onInit: function () {
			this.getView().setModel(this.getOwnerComponent().getModel("oGlobalAIModel"), "oGlobalAIModel");
			oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oGlobalModel = this.getView().getModel("oGlobalAIModel");
			oRouter.getRoute("settings").attachMatched(this.onObjectMatched, this);
		
			
        },
		onObjectMatched: function () {
			BusyIndicator.hide();
           

			if (!oGlobalModel.getProperty("/ApplicationConfigurations/isUserDetailsLoaded") ||
                !oGlobalModel.getProperty("/ApplicationConfigurations/isApplicationDetailsLoaded")) {
                this.fnCkUserLoggedIn(oRouter,"home")
                return;
            }
            this.getView().byId("verifyOTPButton").setEnabled(true);
            this.getView().byId("verfiyOtptext").setVisible(false);
            this.getView().byId("idVerifyOTPInput").setVisible(false);
			this.onIni2t()
		},
		  
 

	 

		onListItemPress: function (oEvent) {
			var sToPageId = oEvent.getParameter("listItem").getCustomData()[0].getValue();

			this.getSplitAppObj().toDetail(this.createId(sToPageId));
		},

	 

		getSplitAppObj: function () {
			var result = this.getView().byId("SplitAppDemo");
			if (!result) {
				Log.info("SplitApp object can't be found");
			}
			return result;
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
            const sAuthToken = that.getUserAuthToken();

            if (sAuthToken) {
                BusyIndicator.show(0);

                const oPayload = {
                    sAuthToken: sAuthToken
                };

                $.ajax({
                    url: "/api/v1/userDetail/fetchUserSetting",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();
                        let oData = oResponse?.data;
                        oData.deletePaymentMode=[]
                        oData.deleteExpenseMood=[]
                        var oSettingsModel = new JSONModel(oResponse?.data);
                        that.getView().setModel(oSettingsModel, "userSettings");
 

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
		 onIni2t: function () {
            this.fnResetHealthMonitorTable()
            let oUserData = sap.ui.getCore().getModel("oUserDetailsModel").getData()
 /* ================= SETTINGS MODEL ================= */
            var oSettingsModel = new JSONModel({
                user: {
                    firstName: oUserData.first_name,
                    lastName: oUserData.last_name,
                    initials: oUserData.initial,
                    email: oUserData.email|| "@gmail.com",
                    mobile: oUserData.phone_number,
                    otpGenerated: "",
                    otpInput: ""
                }
            });

            /* ================= EXPENSE MODEL ================= */
            const paymentMode = [
               { text:"Credit / Debit Card",showdelete: false},
               { text:"UPI / Wallet / Bank Transfer",showdelete: false},
               { text:"Cash",showdelete: false},
            ];

            var oExpenseModel = new JSONModel({
                paymentModes: paymentMode,
                moods: [
                    { text: "Normal", showdelete: false }
                ],
                monthlyBudget: 10000,
                warningPercent: "75"
            });

            /* ================= HEALTH MODEL ================= */
            var oHealthModel = new JSONModel({
                water: { min:"2", max: oUserData.daily_water_goal_l },
                sleep: { min: "5", max: oUserData.daily_sleep_goal_hr },
                steps: { goal: oUserData.daily_steps_goal }
            });

            this.getView().setModel(oSettingsModel, "settings");
            this.getView().setModel(oExpenseModel, "expense");
            this.getView().setModel(oHealthModel, "health");
            return
         

        },

        // ===================== INITIAL AUTO GENERATE =====================
        onNameChange: function (oEvent) {

    var oModel = this.getView().getModel("settings");

    var f = this.getView().byId("firstName").getValue().trim();
    var l = this.getView().byId("lastName").getValue().trim();

    var initials = "";

    if (f && l) {
        initials = f.charAt(0) + l.charAt(0);
    } else if (f) {
        initials = f.substring(0, 2);
    } else if (l) {
        initials = l.substring(0, 2);
    } else {
        initials = "GS";
    }

    initials = initials.padEnd(2, "X").substring(0, 2).toUpperCase();

    oModel.setProperty("/user/initials", initials);
    oModel.refresh()
},

        // ===================== PASSWORD DIALOG =====================
        onOpenPasswordDialog: function () {
            let that =this
            var oDialog = new Dialog({
                title: "Change Password",
                content: new VBox({
                    items: [
                        new Input({ placeholder: "New Password", type: "Password", id: "newPass" }),
                        new Input({ placeholder: "Confirm Password", type: "Password", id: "confirmPass" })
                    ]
                }),
                beginButton: new Button({
                    text: "Save",
                    press: function () {
                        var p1 = sap.ui.getCore().byId("newPass").getValue();
                        var p2 = sap.ui.getCore().byId("confirmPass").getValue();

                        if (p1 !== p2) {
                            MessageToast.show("Passwords do not match");
                        } else {
                            that.saveUserDetail(true,p2)
                            //MessageToast.show("Password changed successfully");
                            oDialog.close();
                        }
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        oDialog.close();
                    }
                })
            });

            oDialog.open();
        },

        // ===================== PAYMENT MODE =====================
       onAddPaymentMode: function () {
    var oModel = this.getView().getModel("userSettings");
    var aModes = oModel.getProperty("/PaymentMode");

    var oInput = new sap.m.Input({ placeholder: "Enter new payment mode" });

    var oDialog = new sap.m.Dialog({
        title: "Add Payment Mode",
        content: [oInput],
        beginButton: new sap.m.Button({
            text: "Add",
            press: function () {
                var sValue = oInput.getValue().trim();
                if (!sValue) {
                    sap.m.MessageToast.show("Cannot be empty!");
                    return;
                }
                if (aModes.some(item => item.name.toLowerCase() === sValue.toLowerCase())) {
                    sap.m.MessageToast.show("Duplicate entry!");
                    return;
                }
                aModes.push({ name: sValue,showdelete:true });
                oModel.refresh();
                oDialog.close();
            }
        }),
        endButton: new sap.m.Button({
            text: "Cancel",
            press: function () { oDialog.close(); }
        }),
        afterClose: function () { oDialog.destroy(); }
    });

    oDialog.open();
},
onDeletePaymentMode: function (oEvent) {
    var oModel = this.getView().getModel("userSettings");
    var sPath = oEvent.getSource().getBindingContext("userSettings").getPath(); // e.g., /PaymentMode/3
    var iIndex = parseInt(sPath.split("/")[2]); // get index in array
    var aModes = oModel.getProperty("/PaymentMode"); // array of payment modes
    var oDeletedRow = aModes[iIndex]; // <-- this is the actual row object

    sap.m.MessageBox.confirm("Are you sure you want to delete this payment mode?", {
        title: "Delete Payment Mode",
        onClose: function (oAction) {
            if (oAction === sap.m.MessageBox.Action.OK) {
                // Optional: track deleted row IDs if needed
                var aDeletedPaymentIDs = oModel.getProperty("/deletePaymentMode") || [];
                if (oDeletedRow.id) {
                    aDeletedPaymentIDs.push(oDeletedRow.id);
                    oModel.setProperty("/deletePaymentMode", aDeletedPaymentIDs);
                }

                // Remove from array
                aModes.splice(iIndex, 1);
                oModel.refresh();
                
                //console.log("Deleted row data:", oDeletedRow); // <-- this gives you the full deleted object
            }
        }
    });
},
onDeletePaymentMode2: function (oEvent) {
    var oModel = this.getView().getModel("userSettings");
    let deletedPaymentID =oModel.getProperty("/deletePaymentMode")
    var sPath = oEvent.getSource().getBindingContext("userSettings").getPath();
    var iIndex = parseInt(sPath.split("/")[2]);
    var aModes = oModel.getProperty("/paymentMode");

    sap.m.MessageBox.confirm("Are you sure you want to delete this payment mode?", {
        title: "Delete Payment Mode",
        onClose: function (oAction) {
            if (oAction === sap.m.MessageBox.Action.OK) {
                deletedPaymentID.push(iIndex)
                aModes.splice(iIndex, 1);
                oModel.refresh();
            }
        }
    });
},
onAddMood: function () {
    var oModel = this.getView().getModel("userSettings");
    var aMoods = oModel.getProperty("/ExpenseMood");

    var oInput = new sap.m.Input({ placeholder: "Enter new mood" });

    var oDialog = new sap.m.Dialog({
        title: "Add Expense Mood",
        content: [oInput],
        beginButton: new sap.m.Button({
            text: "Add",
            press: function () {
                var sValue = oInput.getValue().trim();
                if (!sValue) {
                    sap.m.MessageToast.show("Cannot be empty!");
                    return;
                }
                if (aMoods.some(item => item.name.toLowerCase() === sValue.toLowerCase())) {
                    sap.m.MessageToast.show("Duplicate entry!");
                    return;
                }
                aMoods.push({ name: sValue,showdelete:true });
                oModel.refresh();
                oDialog.close();
            }
        }),
        endButton: new sap.m.Button({
            text: "Cancel",
            press: function () { oDialog.close(); }
        }),
        afterClose: function () { oDialog.destroy(); }
    });

    oDialog.open();
},
onDeleteMood: function (oEvent) {
    var oModel = this.getView().getModel("userSettings");

    var sPath = oEvent.getSource()
        .getBindingContext("userSettings")
        .getPath(); // e.g. /ExpenseMood/1

    var iIndex = parseInt(sPath.split("/")[2]); 
    var aMoods = oModel.getProperty("/ExpenseMood");

    // ✅ Get full row object
    var oDeletedRow = aMoods[iIndex];

    sap.m.MessageBox.confirm("Are you sure you want to delete this mood?", {
        title: "Delete Mood",
        onClose: function (oAction) {
            if (oAction === sap.m.MessageBox.Action.OK) {

                // Get existing deleted list or initialize
                var aDeletedMoodIDs = oModel.getProperty("/deleteExpenseMood") || [];

                // Push ID only if exists (avoid pushing default rows without ID)
                if (oDeletedRow.id) {
                    aDeletedMoodIDs.push(oDeletedRow.id);
                    oModel.setProperty("/deleteExpenseMood", aDeletedMoodIDs);
                }

                // Remove from array
                aMoods.splice(iIndex, 1);

                oModel.refresh();

                //console.log("Deleted Mood Row:", oDeletedRow);
            }
        }
    });
},
onAfterRendering: function () {
    var oScrollPayment = this.byId("scrollPaymentModes");
    var oScrollMoods = this.byId("scrollMoods");

    function adjustScrollHeight() {
        var sHeight = "200px"; // Default desktop/laptop

        if (sap.ui.Device.system.phone) {
            sHeight = (window.innerHeight * 0.5) + "px"; // 50% for mobile
        } else if (sap.ui.Device.system.tablet) {
            sHeight = (window.innerHeight * 0.4) + "px"; // 40% for tablet
        }

        oScrollPayment.setHeight(sHeight);
        oScrollMoods.setHeight(sHeight);
    }

    // Initial adjustment
    adjustScrollHeight();

    // Adjust on window resize
    window.addEventListener("resize", adjustScrollHeight);
},
onSendOTP: function () {
    
            this.getView().byId("verfiyOtptext").setText("Verify OTP (Enter 2500 in OTP Feild)");
            this.getView().byId("verifyOTPButton").setEnabled(false);
            this.getView().byId("verfiyOtptext").setVisible(true);
            this.getView().byId("idVerifyOTPInput").setVisible(true);

    var oMobile = this.getView().byId("mobileInput").getValue();

    if (!oMobile || oMobile.length !== 10) {
        sap.m.MessageToast.show("Enter valid 10-digit mobile number");
        return;
    }

    // Simulate OTP generation
    this._generatedOTP = "123456"; // Normally from backend

    sap.m.MessageToast.show("OTP Sent Successfully!");

    // Show OTP input + verify button
    this.getView().byId("otpInput").setVisible(true);
    this.getView().byId("verifyBtn").setVisible(true);
},

onVerifyOTP: function () {
    var sEnteredOTP = this.getView().byId("idVerifyOTPInput").getValue();

    if (sEnteredOTP === "2500") {
        this.getView().byId("verfiyOtptext").setText("OTP Verified");
        sap.m.MessageToast.show("OTP Verified Successfully!");
    } else {
        sap.m.MessageToast.show("Invalid OTP. Try Again.");
    }
},
onSaveAllUserSettings: function () {

    var oUserModifiedData = this.getView()
        .getModel("userSettings")
        .getData();
    const sAuthToken = this.getUserAuthToken();
    this.saveUserDetailIfChanged()

// 🔥 Filter arrays before sending
    if (Array.isArray(oUserModifiedData.PaymentMode)) {
        oUserModifiedData.PaymentMode = oUserModifiedData.PaymentMode.filter(function(item) {
            return item.showdelete === true; // Keep only items where showdelete is true
        });
    }

    if (Array.isArray(oUserModifiedData.ExpenseMood)) {
        oUserModifiedData.ExpenseMood = oUserModifiedData.ExpenseMood.filter(function(item) {
            return item.showdelete === true;
        });
    }
    // 🔥 Merge auth token + model data
    var oPayload = {
        sAuthToken: sAuthToken,
        ...oUserModifiedData   // IMPORTANT
    };

    var oController = this;
    BusyIndicator.show();

    $.ajax({
        url: "/api/v1/userDetail/saveUserSetting",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(oPayload),

        success: function (response) {
            BusyIndicator.hide();

            if (response.status === 'Success') {
                oController.createMessageStrip(true, response.message, "Success");
                oController.fnCkUserLoggedIn(oRouter,"Dashboard")
            } else {
                oController.createMessageStrip(true, response.message || "Error occurred", "Error");
            }
        },

        error: function (xhr) {
            BusyIndicator.hide();

            let oError = {};
            try {
                oError = JSON.parse(xhr.responseText);
            } catch (err) {}

            oController.createMessageStrip(true, oError.message || "Error occurred", "Error");
        }
    });
}, 
saveUserDetailIfChanged: function () {
    var oSettingsData = this.getView().getModel("settings").getData().user;
    var oUserDetails = sap.ui.getCore().getModel("oUserDetailsModel").getData();


    if (
        oSettingsData.firstName !== oUserDetails.first_name ||
        oSettingsData.lastName !== oUserDetails.last_name ||
        oSettingsData.initials !== oUserDetails.initial ||
        oSettingsData.email !== oUserDetails.email ||
        oSettingsData.mobile !== oUserDetails.phone_number
    ) {
        this.saveUserDetail(false)
    }

},
saveUserDetail: function(isPasswordChange, passKey) {
    var oSettingsData = this.getView().getModel("settings").getData().user;
 var oUserDetails = sap.ui.getCore().getModel("oUserDetailsModel").getData();
    var oPayload = {
        firstname: oSettingsData.firstName,
        lastname: oSettingsData.lastName,
        initial: oSettingsData.initials,
        email: oSettingsData.email,
        mobilenumber: oSettingsData.mobile,
        isSignup:false,
        id:oUserDetails.user_id,
        userplan : oUserDetails.userplan,
        isPasswordChange:isPasswordChange,
        isadmin:oUserDetails.isadmin,
        status:oUserDetails.status
    };

    // Conditionally add password
    if (isPasswordChange) {
        oPayload.password = passKey;
    }

    var oController = this;
    BusyIndicator.show();

    $.ajax({
        url: "/api/v1/auth/saveUser",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(oPayload),

        success: function (response) {
            BusyIndicator.hide();
            if(isPasswordChange){
                oController.createMessageStrip(true,"Password changed successfully", "Success");
            }
        },

        error: function (xhr) {
            BusyIndicator.hide();

            let oError = {};
            try {
                oError = JSON.parse(xhr.responseText);
            } catch (err) {}

            oController.createMessageStrip(true, oError.message || "Error occurred", "Error");
        }
    });
}


	});
});