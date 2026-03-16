sap.ui.define([
    'sap/ui/demo/toolpageapp/controller/BaseController',
    'sap/ui/model/json/JSONModel',
    'sap/ui/Device',
    'sap/ui/demo/toolpageapp/model/formatter',
    'sap/ui/core/BusyIndicator',
    'sap/ui/core/Fragment',
    'sap/m/MessageToast',
    'sap/m/MessageBox'
], function (
    BaseController,
    JSONModel,
    Device,
    formatter,
    BusyIndicator,
    Fragment,
    MessageToast, MessageBox
) {
    "use strict";

    var oGlobalModel, oRouter;

    return BaseController.extend("sap.ui.demo.toolpageapp.controller.user.productivity.Calendar", {
        formatter: formatter,

        /* =========================================================== */
        /* Lifecycle                                                   */
        /* =========================================================== */

        onInit: function () {
            this.getView().setModel(this.getOwnerComponent().getModel("oGlobalAIModel"), "oGlobalAIModel");
            oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oGlobalModel = this.getView().getModel("oGlobalAIModel");
            oRouter.getRoute("Calendar").attachMatched(this.onObjectMatched, this);
        },

        onObjectMatched: function () {
            BusyIndicator.hide();

            if (!oGlobalModel.getProperty("/ApplicationConfigurations/isUserDetailsLoaded") ||
                !oGlobalModel.getProperty("/ApplicationConfigurations/isApplicationDetailsLoaded")) {
                this.fnCkUserLoggedIn(oRouter, "home");
            }
            this.fetchTodoListByDate();
        },
        getUserAuthToken: function () {
            const oToken = localStorage.getItem("pravAPP_Authtoken_forService");

            // const oToken = sap.ui.getCore().getModel("oUserExpenseModel").getData().auth_token;
            if (!oToken) {
                this.fnCkUserLoggedIn(oRouter, "home")
            }
            return oToken;
        },

        onChangetoTableView: function (oEvent) {
             if (this.userSubcriptionValidation("CALENDAR_TABLE_VIEW")) {//oModel.getProperty("/isProUser")
 

            var oModel = this.getView().getModel("oCalenderModel");
            oModel.setProperty("/isTableView", !oModel.getProperty("/isTableView"));
            oModel.setProperty("/isCalenderView", !oModel.getProperty("/isCalenderView"));
                    return
                }
        },

        onToggleFullDayTime: function (oEvent) {
            var bPressed = oEvent.getSource().getPressed();
            var oModel = this.getView().getModel("oCalenderModel");
            if (bPressed) { // Full 24 hours 
                oModel.setProperty("/startHour", 0);
                oModel.setProperty("/endHour", 24);
            } else { // Working hours 
                oModel.setProperty("/startHour", 8);
                oModel.setProperty("/endHour", 22);
            }
            MessageToast.show(bPressed ? "Full Day View" : "Working Hours View");
        },

        /* =========================================================== */
        /* Data                                                        */
        /* =========================================================== */

        fetchTodoListByDate: function () {
            var oData = {
                isTableView: false,
                isCalenderView: true,
                start_date: new Date(),
                startHour: 7,
                endHour: 22,
                appointments: [
                    // {
                    //     id: crypto.randomUUID(),
                    //     title: "Daily Standup",
                    //     label: "Scrum",
                    //     description: "Daily team sync-up meeting",
                    //     appointmentType: "Meeting",
                    //     start_date: new Date(2026, 0, 9, 9, 0),
                    //     end_date: new Date(2026, 0, 9, 9, 30),
                    //     priority_type: "Type01",
                    //     fullDay: false
                    // },

                ]
            };
            this.getView().setModel(new JSONModel(oData), "oCalenderModel");
            this._filterTodosByDate();
        },



        _filterTodosByDate: function () {
            var oView = this.getView();
            var oModel = oView.getModel("oCalenderModel");

            // Get the reference date (today or from model)
            var oDate = oModel.getProperty("/start_date") ? new Date(oModel.getProperty("/start_date")) : new Date();

            // Clone the date so we don’t modify original
            var oCurrent = new Date(oDate);

            // Calculate week start (Sunday)
            var oWeekStart = new Date(oCurrent);
            oWeekStart.setDate(oCurrent.getDate() - oCurrent.getDay()); // getDay(): 0 = Sunday
            oWeekStart.setHours(0, 0, 0, 0);

            // Calculate week end (Saturday)
            var oWeekEnd = new Date(oWeekStart);
            oWeekEnd.setDate(oWeekStart.getDate() + 6); // Sunday + 6 = Saturday
            oWeekEnd.setHours(23, 59, 59, 999);

            // Now use these dates to fetch events
            this.fetchEventsbyDate(oWeekStart, oWeekEnd);
        },




        fetchEventsbyDate: function (startDateTime, endDateTime) {
            var that = this;

            // this.getView().getModel("oCalenderModel").setProperty("/todos",[])
            const sAuthToken = that.getUserAuthToken();

            if (sAuthToken) {
                BusyIndicator.show(0);

                const oPayload = {
                    sAuthToken: sAuthToken,
                    startDateTime: new Date(startDateTime).toISOString(),
                    endDateTime: new Date(endDateTime).toISOString(),
                    type: "todo"
                };

                $.ajax({
                    url: "/api/v1/userDetail/fetchEventsbyDates",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();

                        // Load data into model
                        var aTodos = oResponse.data;
                        aTodos = that._prepareCalendarDates(aTodos);

                        that.getView().getModel("oCalenderModel")
                            .setProperty("/appointments", aTodos);


                        MessageToast.show(true, oResponse.message, "Success");
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
        _prepareCalendarDates: function (aTodos) {
            if (!Array.isArray(aTodos)) {
                return aTodos
            }
            aTodos.forEach(function (oTodo) {
                oTodo.start_date = sap.ui.core.date.UI5Date
                    ? sap.ui.core.date.UI5Date.getInstance(new Date(oTodo.start_date))
                    : new Date(oTodo.start_date);

                oTodo.end_date = sap.ui.core.date.UI5Date
                    ? sap.ui.core.date.UI5Date.getInstance(new Date(oTodo.end_date))
                    : new Date(oTodo.end_date);
            });

            return aTodos;
        },

        /* =========================================================== */
        /* Dialog Handling                                             */
        /* =========================================================== */

        _openTodoDialog: function (oData) {
            if (!this._oTodoDialog) {
                this._oTodoDialog = Fragment.load({
                    name: "sap.ui.demo.toolpageapp.view.user.productivity.fragment.calenderAppoitment",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }

            Promise.resolve(this._oTodoDialog).then(function (oDialog) {
                this.getView().setModel(new JSONModel(oData), "oCalenderSaveModel");
                oDialog.open();
            }.bind(this));
        },

        onCreateAppoitment: function () {
            this._openTodoDialog({
                id: null,
                isEdit: false,
                title: "",
                label: "",
                description: "",
                notes: "",
                status: "New",
                priority_type: "Type01",
                start_date: new Date(),
                end_date: new Date(Date.now() + 3600000)
            });
        },

        onAppointmentCreate: function (oEvent) {
            this._openTodoDialog({
                id: null,
                isEdit: false,
                title: "",
                status: "New",
                priority_type: "Type02",
                start_date: oEvent.getParameter("startDate"),
                end_date: oEvent.getParameter("endDate")
            });
        },

        onAppointmentSelect: function (oEvent) {
            var oAppt = oEvent.getParameter("appointment");
            if (!oAppt) { return; }

            var oData = oAppt.getBindingContext("oCalenderModel").getObject();

            this._openTodoDialog(Object.assign({}, oData, {
                isEdit: true
            }));
        },

        onCancelTodo: function () {
            this._closeTodoDialog();
        },
        _closeTodoDialog: function () {
            this._contextPath = null;
            this._tempDates = null;
            if (this._oTodoDialog) {
                this._oTodoDialog.then(function (oDialog) {
                    oDialog.close();
                });
            }
        },

        onDeleteTodo: function () {
            var oDialogData = this.getView().getModel("oCalenderSaveModel").getData();
            var sDeleteId = oDialogData.id; // The ID to delete

            // 🔹 For now, just log it to console
            var payload = {
                id:  [oDialogData.id],
                type: "todo"
            };
            this.fnDeleteEvents(payload); 
        },


        /* =========================================================== */
        /* SAVE – SINGLE ENTRY POINT                                   */
        /* =========================================================== */

        saveCalendarAppointment: function (oData) {

            var payload = {
                id: oData.id || null,
                flagname: "todo",
                title: oData.title,
                description: oData.description,
                status: oData.status,
                notes: "",
                priority_type: oData.priority_type,
                priority_text: this._getPriorityText(oData.priority_type),
                start_date: oData.start_date,
                end_date: oData.end_date
            };

            this.fnSaveEvent(payload);
        },
        _getPriorityText: function (sType) {
            switch (sType) {
                case "Type01": return "Meeting";
                case "Type02": return "Focus Work";
                case "Type03": return "Call";
                case "Type04": return "Personal";
                case "Type05": return "Reminder";
                default: return "";
            }
        },
        fnSaveEvent: function (oPayload) {
            var that = this;
            const sAuthToken = that.getUserAuthToken();
            if (sAuthToken) {
                oPayload.sAuthToken = sAuthToken
                BusyIndicator.show(0);
                $.ajax({
                    url: "/api/v1/userDetail/saveEvent",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();
                        that.createMessageStrip(true, oResponse.message, "Success");
                        that._filterTodosByDate();
                        that._closeTodoDialog();
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


        _validateTodoData: function (oData) {
            var bValid = true;
            var aErrors = [];
            var aWarnings = [];

            // ERROR validations (block save)
            if (!oData.title || !oData.title.trim()) {
                aErrors.push("Title is required");
                bValid = false;
            }

            if (!oData.description || !oData.description.trim()) {
                aErrors.push("Description is required");
                bValid = false;
            }

            // if (!oData.start_date || !oData.end_date) {
            //     aErrors.push("Start and End date are required");
            //     bValid = false;
            // } else if (oData.end_date <= oData.start_date) {
            //     aErrors.push("End date must be after Start date");
            //     bValid = false;
            // }
            if (!oData.start_date || !oData.end_date) {
                aErrors.push("Start and End date are required");
                bValid = false;
            } else {
                // Ensure Date objects
                const start = oData.start_date instanceof Date ? oData.start_date : new Date(oData.start_date);
                const end = oData.end_date instanceof Date ? oData.end_date : new Date(oData.end_date);

                const startTime = start.getTime();
                const endTime = end.getTime();

                // Check end > start
                if (endTime <= startTime) {
                    aErrors.push("End date must be after Start date");
                    bValid = false;
                }

                // Check max 5 days (5 * 24 * 60 * 60 * 1000 ms)
                const maxDurationMs = 5 * 24 * 60 * 60 * 1000;
                const durationMs = endTime - startTime;

                if (durationMs > maxDurationMs) {
                    // Optional: If this is a "Preview" action, ask for confirmation
                    if (oData.isPreview) {
                        bValid = false;
                        MessageBox.confirm(
                            "The duration exceeds 5 days. Do you want to continue?",
                            {
                                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                                emphasizedAction: MessageBox.Action.NO,
                                onClose: function (oAction) {
                                    if (oAction === MessageBox.Action.YES) {
                                        that.onSaveTodo()
                                    }
                                }
                            }
                        );
                    } else {
                        // Normal save: prevent if >5 days
                        aErrors.push("Maximum allowed duration is 5 days");
                        bValid = false;
                    }
                }
            }



            // WARNING validations (allow save)
            if (!oData.label || !oData.label.trim()) {
                aWarnings.push("Label is recommended");
            }

            return {
                isValid: bValid,
                errors: aErrors,
                warnings: aWarnings
            };
        },

        onSaveTodo: function () {
            var oData = this.getView().getModel("oCalenderSaveModel").getData();
            oData.start_date = sap.ui.getCore().byId("idCalenderStartDate").getDateValue();
            oData.end_date = sap.ui.getCore().byId("idCalenderEndDate").getDateValue();


            var oValidation = this._validateTodoData(oData);

            // ❌ Block save on errors
            if (!oValidation.isValid) {
                MessageBox.error(oValidation.errors.join("\n"));
                return;
            }

            // ⚠️ Show warning but continue save
            if (oValidation.warnings.length) {
                MessageToast.show(oValidation.warnings.join("\n"));
            }

            // ✅ Save
            this.saveCalendarAppointment(oData);
        },

        /* =========================================================== */
        /* Calendar Interactions                                       */
        /* =========================================================== */

        onAppointmentResize: function (oEvent) {
            this._saveFromCalendarEvent(oEvent);
        },

        onAppointmentDrop: function (oEvent) {
            this._saveFromCalendarEvent(oEvent);
        },

        _saveFromCalendarEvent: function (oEvent) {
            var oAppt = oEvent.getParameter("appointment");
            var oCtx = oAppt.getBindingContext("oCalenderModel");
            var oData = Object.assign({}, oCtx.getObject());

            oData.start_date = oEvent.getParameter("startDate");
            oData.end_date = oEvent.getParameter("endDate");

            this.saveCalendarAppointment(oData);
        },



        //////////////////////////////// Below all table
        onLiveSearch: function (oEvent) {
            this._sSearch = oEvent.getParameter("newValue");
            this.onApplyFilter()
        },

        onApplyFilter: function () {
            var oTable = this.byId("todoTable");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            if (this._sSearch) {
                aFilters.push(
                    new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("title",
                                sap.ui.model.FilterOperator.Contains, this._sSearch),
                            new sap.ui.model.Filter("label",
                                sap.ui.model.FilterOperator.Contains, this._sSearch)
                        ],
                        and: false
                    })
                );
            }

            oBinding.filter(aFilters);
        }
,
onEditTodo: function(oEvent) {
    const oContext = oEvent.getSource().getBindingContext("oCalenderModel");
    if (!oContext) return;

    const oData = oContext.getObject();

    // Open your dialog for editing
    this._openTodoDialog(Object.assign({}, oData, { isEdit: true }));

    //console.log("Editing appointment ID:", oData.id);
}
,
onDeleteTodoRow: function(oEvent) {
    let that = this;
    const oContext = oEvent.getSource().getBindingContext("oCalenderModel");
    if (!oContext) return;

    const oData = oContext.getObject();
    const sDeleteId = oData.id; // Pass this ID 

    
            if (!sDeleteId) {
                sap.m.MessageToast.show("No record selected");
                return;
            }
            var payload = {
                id:  [sDeleteId],
                type: "todo"
            };

            sap.m.MessageBox.confirm("Are you sure you want to delete this?", {
                onClose: function (sAction) {
                    if (sAction === sap.m.MessageBox.Action.OK) {
                        that.fnDeleteEvents(payload);
                    }
                }.bind(this)
            });



        },


        fnDeleteEvents: function (oPayload) {
            var that = this;
            const sAuthToken = that.getUserAuthToken();
            if (sAuthToken) {
                oPayload.sAuthToken = sAuthToken
                BusyIndicator.show(0);
                $.ajax({
                    url: "/api/v1/userDetail/deleteEventsByID",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        BusyIndicator.hide();
                        that.createMessageStrip(true, oResponse.message, "Success");
                        that.fetchTodoListByDate();
                        that.onCancelTodo();
                           this._closeTodoDialog();
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


    });
});
