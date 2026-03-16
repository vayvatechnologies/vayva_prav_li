sap.ui.define([
	"sap/base/strings/formatMessage",
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/library"
], function (formatMessage, DateFormat,coreLibrary) {
	"use strict";
const {ValueState} = coreLibrary;
	return {
		formatMessage: formatMessage,
		fnCheckTwoParamConditionTrue: function (isUserDetailsLoaded, enableThemeChange) {
			return isUserDetailsLoaded === true && enableThemeChange === true;
		},
















		convertIntoDateTimePIckerformat: function (sDate) {
			if (!sDate) {
				return sDate;
			}
			return new Date(sDate)

		},
		convertDatetoUsertimeFormat: function (sDate) {
			if (!sDate) {
				return "";
			}

			var oDate = new Date(sDate);

			// Get user datetime format
			var oUserModel = sap.ui.getCore().getModel("oUserDetailsModel");
			var sUserFormat = oUserModel && oUserModel.getData().datetimeformat;

			// Default format if empty / undefined / null
			if (!sUserFormat) {
				sUserFormat = "dd-MM-yyyy hh:mm:ss a";
			}

			return sap.ui.core.format.DateFormat
				.getDateTimeInstance({
					pattern: sUserFormat
				})
				.format(oDate);
		},
		convertDatetoUsertimeOnlyFormat: function (sDate) {
			if (!sDate) {
				return "";
			}

			var oDate = new Date(sDate);

			// Get user datetime format
			var sUserFormat = "hh:mm a";
			 

			return sap.ui.core.format.DateFormat
				.getDateTimeInstance({
					pattern: sUserFormat
				})
				.format(oDate);
		},
		formatDateValue: function (sDate) {
			if (!sDate) {
				return null;
			}

			// Convert ISO string → Date
			var oDate = new Date(sDate);

			// Format to yyyy-MM-dd (required by DatePicker.value)
			var oFormatter = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "yyyy-MM-dd"
			});

			return oFormatter.format(oDate);
		},

		convertDatetoUserDateFormat: function (sDate) {
			if (!sDate) {
				return "";
			}

			var oDate = new Date(sDate);

			// Get user datetime format
			var oUserModel = sap.ui.getCore().getModel("oUserDetailsModel");
			var sUserFormat = oUserModel && oUserModel.getData().dateformat;

			// Default format if empty / undefined / null
			if (!sUserFormat) {
				sUserFormat = "mm dd, yyyy";
			}

			return sap.ui.core.format.DateFormat
				.getDateTimeInstance({
					pattern: sUserFormat
				})
				.format(oDate);
		},
		srcImageValue: function (bIsPhone, sImagePath) {
			if (bIsPhone) {
				sImagePath += "_small";
			}
			return sImagePath + ".jpg";
		},
		rowColorByType: function (type) {
			// States: None, Success, Warning, Error, Information
			if (!type) return "";
			switch (type) {
				case "expense":
					return "Error";
				case "Income":
					return "Success";
				case "income":
					return "Success";
				default:
					return "Warning";
			}
		},
		fnHomeShowAppLoading: function (isAppLoaded, isUnderMaintenance) {
			// visible only if BOTH are false
			return !isAppLoaded && !isUnderMaintenance;
		},
		fnHomeShowLanding: function (isAppLoaded, isUnderMaintenance) {
			// visible only if BOTH are false
			return isAppLoaded && !isUnderMaintenance;
		},

		dateToFixedString: function (date) {
			return new Date(date).toDateString()

		},
		getMinDate: function (date) {
			return new Date()
		},
		formatTotalExpense: function (totalExpense, totalIncome) {
			if (totalExpense == null || totalIncome == null) {
				return "Balance - 0.00";
			}

			var balance = parseFloat(totalIncome) - parseFloat(totalExpense);

			return "Balance - " + balance.toFixed(2);
		},
		getMicroChartColor: function (percentage) {
			if (percentage >= 80) {
				return "Good";      // green
			} else if (percentage >= 30) {
				return "Critical";  // orange/yellow
			} else {
				return "Error";     // red
			}
		},
		// Calender - Todo List - Priority Status 
		getPriorityObjectStatusColor: function (sStatus) {
				if (sStatus === "Done") {
					return ValueState.Success;
				} else if (sStatus === "In Progress") {
					return ValueState.Warning;
				} else if (sStatus === "Pending"){
					return ValueState.Error;
				} else {
					return ValueState.None;
				}
		},
		formatNotesTagsFromEndDateTime:function(notes, tags,startDate,endDate) {
    // Ensure values are not undefined
    notes = notes || "";
    tags = tags || "";
    
    // Combine with newline
    return notes + "\n" + tags;
},
formatUserCalenderPriorityState: function (sPriority) {
    switch (sPriority) {
        case "Type01":
            return "Success"; // High
        case "Type02":
            return "Warning"; // Medium
        case "Type03":
            return "Error";   // Critical
        default:
            return "None";
    }
},
formatUserCalenderPriorityText: function (sPriority) {
    switch (sPriority) {
        case "Type01":
            return "Meeting"; // High
        case "Type02":
            return "Travel"; // Medium
        case "Type03":
            return "Sleping";   // Critical
        default:
            return "Outing";
    }
},
convertStringDatetoDateFormat:function(oDate){
	//console.log("is caled"+oDate +",Ne wdate :"+new Date(oDate))
	return new Date(oDate)
},
 



	};
});