sap.ui.define([
	'sap/ui/demo/toolpageapp/controller/BaseController',
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
	return BaseController.extend("sap.ui.demo.toolpageapp.controller.admin.Dashboard", {
		formatter: formatter,

		onInit: function () {
			this.getView().setModel(this.getOwnerComponent().getModel("oGlobalAIModel"), "oGlobalAIModel");
			oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oGlobalModel = this.getView().getModel("oGlobalAIModel");
			oRouter.getRoute("AdminDashboard").attachMatched(this.onObjectMatched, this);

			var ouserModel = new JSONModel({ toogleOverviewShow: true, overview: [{ "show": false }] ,
             
            });
			this.getView().setModel(ouserModel, "oUserDashboardModel");



		},
		onObjectMatched: function () {
			BusyIndicator.hide();
			this.fetchDashboardDetails(); 

			if (!oGlobalModel.getProperty("/ApplicationConfigurations/isUserDetailsLoaded") ||
				!oGlobalModel.getProperty("/ApplicationConfigurations/isApplicationDetailsLoaded")) {
				this.fnCkUserLoggedIn(oRouter,"home");
			}
           const isAdmin = sap.ui.getCore()?.getModel("oUserDetailsModel")?.getData()?.isadmin;

            if (!isAdmin) {
                this.fnCkUserLoggedIn?.(oRouter, "home");
            }
           this.onLoadUserDetails()
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
           
            const sAuthToken = that.getUserAuthToken();

            if (sAuthToken) {
                 BusyIndicator.show(0);

                const oPayload = {
                    sAuthToken: sAuthToken
                };

                $.ajax({
                    url: "/api/v1/userDetail/getAllUsersList",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();
                        
                        that.getView().getModel().setProperty("/users",oResponse.data)
                        that.CalcTotalUsers(oResponse.data)
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
      CalcTotalUsers: function (totalData) {

    let summary = {
        totalUsers: totalData.length,
        basic: 0,
        standard: 0,
        premium: 0,
        platinum: 0
    };

    totalData.forEach(function(user){
        switch ((user.userplan || "").toLowerCase()) {
            case "basic":
                summary.basic++;
                break;
            case "standard":
                summary.standard++;
                break;
            case "premium":
                summary.premium++;
                break;
            case "platinum":
                summary.platinum++;
                break;
        }
    });

    let oData = {
        summary: summary,
        users: totalData
    };

    this.getView().setModel(new sap.ui.model.json.JSONModel(oData));
},
        
		 onLoadUserDetails:function(){
            

            var oData = {
                summary: {
                    totalUsers: 0,
                    basic: 0,
                    standard: 0,
                    premium: 0,
                    platinum: 0
                },
                users: [
                    
                ]
            };

            this.getView().setModel(new JSONModel(oData));

            var oDialogModel = new JSONModel({
                dialogData: {},
                availableRoles: [],
                assignedRoles: [],
                deleteRoleAssignedIds: []
            });

            this.getView().setModel(oDialogModel, "dialogModel");
        },

        /* ================= ROLE MASTER ================= */

        _getAllRoles: function () {
            return [
                { id: "UR2", roleName: "Administrator" },
                { id: "UR_2", roleName: "Manager" },
                { id: "UR4", roleName: "Employee" },
                { id: "R004", roleName: "Viewer" }
            ];
        },

        /* ================= TABLE ================= */

        onUserSelect: function (oEvent) {
            this.byId("editBtn").setEnabled(oEvent.getParameter("selected"));
        },

        /* ================= CREATE ================= */

        onCreateUser: async function () {

            await this._openDialog();

            var oDialogModel = this.getView().getModel("dialogModel");

            oDialogModel.setData({
                dialogData: {
                    id: null,
                    first_name: "",
                    last_name: "",
                    initial: "",
                    mobilenumber: "",
                    email: "",
                    status: "1",
                    isadmin:false,
                    userplan:"Basic"
                },
                availableRoles: this._getAllRoles(),
                assignedRoles: [],
                deleteRoleAssignedIds: []
            });
        },

        /* ================= EDIT ================= */

        onEditUser: async function () {

            var oTable = this.byId("userTable");
            var oItem = oTable.getSelectedItem();

            if (!oItem) {
                MessageToast.show("Select user");
                return;
            }

            await this._openDialog();

            var oUser = oItem.getBindingContext().getObject();
            var aAllRoles = this._getAllRoles();

            var aAssigned = [];
            var aAvailable = [];

            

            this.getView().getModel("dialogModel").setData({
                dialogData: Object.assign({}, oUser),
                availableRoles: aAvailable,
                assignedRoles: aAssigned,
                deleteRoleAssignedIds: []
            });
        },

        /* ================= LOAD FRAGMENT ================= */

        _openDialog: async function () {

            if (!this._oDialog) {
                this._oDialog = await Fragment.load({
                    name: "sap.ui.demo.toolpageapp.view.admin.fragment.UserDetail",
                    controller: this
                });
                this.getView().addDependent(this._oDialog);
            }

            this._oDialog.open();
        },

        /* ================= AUTO INITIAL ================= */

        onNameChange: function () {

            var oModel = this.getView().getModel("dialogModel");
            
 var f = sap.ui.getCore().byId("idAdminFname").getValue().trim() ;
    var l = sap.ui.getCore().byId("idAdminLname").getValue().trim();

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

            oModel.setProperty("/dialogData/initial", initials);
    oModel.refresh()
        },

        /* ================= ASSIGN ROLE ================= */

        onDialogAssignRole: function () {

            var oModel = this.getView().getModel("dialogModel");
            var aAvailable = oModel.getProperty("/availableRoles");
            var aAssigned = oModel.getProperty("/assignedRoles");

            var aSelected = sap.ui.getCore().byId("dialogAvailableRoles").getSelectedItems();

            aSelected.forEach(function (oItem) {
                var oRole = oItem.getBindingContext("dialogModel").getObject();

                if (!aAssigned.some(r => r.id === oRole.id)) {
                    aAssigned.push(oRole);
                    aAvailable = aAvailable.filter(r => r.id !== oRole.id);
                }
            });

            oModel.setProperty("/availableRoles", aAvailable);
            oModel.setProperty("/assignedRoles", aAssigned);

            sap.ui.getCore().byId("dialogAvailableRoles").removeSelections(true);
        },

        /* ================= REMOVE ROLE ================= */

        onDialogRemoveRole: function () {

            var oModel = this.getView().getModel("dialogModel");
            var aAssigned = oModel.getProperty("/assignedRoles");
            var aAvailable = oModel.getProperty("/availableRoles");
            var aDeleteIds = oModel.getProperty("/deleteRoleAssignedIds");

            var aSelected = sap.ui.getCore().byId("dialogAssignedRoles").getSelectedItems();

            aSelected.forEach(function (oItem) {

                var oRole = oItem.getBindingContext("dialogModel").getObject();

                if (!aDeleteIds.includes(oRole.id)) {
                    aDeleteIds.push(oRole.id);
                }

                aAssigned = aAssigned.filter(r => r.id !== oRole.id);
                aAvailable.push(oRole);

            });

            oModel.setProperty("/assignedRoles", aAssigned);
            oModel.setProperty("/availableRoles", aAvailable);
            oModel.setProperty("/deleteRoleAssignedIds", aDeleteIds);

            sap.ui.getCore().byId("dialogAssignedRoles").removeSelections(true);
        },

        /* ================= SAVE ================= */

        onDialogSave: function () {

            var oModel = this.getView().getModel("dialogModel");
            var oUserDetails =oModel.getProperty("/dialogData");
            var oPayload = {
                firstname: oUserDetails.first_name,
        lastname: oUserDetails.last_name,
        initial: oUserDetails.initial,
        email: oUserDetails.email,
        mobilenumber: oUserDetails.mobilenumber,
        isSignup: oUserDetails.user_id!=="" ? true : false,
        id:oUserDetails.user_id || null,
        userplan : oUserDetails.userplan,
        isPasswordChange:true,
        password : oUserDetails.password,
         isadmin:oUserDetails.isadmin,
         status :oUserDetails.status
            };
             var oController = this;
    BusyIndicator.show();

    $.ajax({
        url: "/api/v1/auth/saveUser",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(oPayload),

        success: function (response) {
            BusyIndicator.hide();
            oController.createMessageStrip(true,"User Saved successfully", "Success");
            oController.onObjectMatched()
            oController._oDialog.close();
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

        onDialogCancel: function () {
            this._oDialog.close();
        },
   onPaymentImagePress: function (oEvent) {
    var oSource = oEvent.getSource();       // The clicked image
    var sSrc = oSource.getSrc();            // Base64 image URL

    // Create Dialog if it doesn't exist
    if (!this._paymentDialog) {
        this._paymentDialog = new sap.m.Dialog({
            title: "Payment Proof",
            contentWidth: "auto",
            contentHeight: "auto",
            resizable: true,
            draggable: true,
            stretchOnPhone: true,
            beginButton: new sap.m.Button({
                text: "Close",
                press: function () {
                    this._paymentDialog.close();
                }.bind(this)
            }),
            endButton: null, // optional if you want only one button
            afterClose: function () {
                // Optional cleanup if needed
            }
        });

        // Add image to dialog
        this._paymentDialog.addContent(
            new sap.m.Image({
                src: sSrc,
                width: "400px",
                height: "400px",
                fit: "Contain"
            })
        );

        this.getView().addDependent(this._paymentDialog);
    } else {
        // Update image source if dialog already exists
        this._paymentDialog.getContent()[0].setSrc(sSrc);
    }

    this._paymentDialog.open();
}
	 

	});
});