sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {
		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		createApplicationModel: function () {
			const oGlobalModelData = {
				// Application Configuration 
				ApplicationConfigurations: {
					isApplicationDetailsLoaded: false,
					isUserDetailsLoaded: false,
				},
				maintenance:{
					isUnderMaintenance:false,
					maintenancemessage:"Almost ready for your next adventure!"
				}	
   
			};
			return oGlobalModelData;
		},
	};

});