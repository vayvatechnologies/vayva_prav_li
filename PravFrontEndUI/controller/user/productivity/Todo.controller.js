sap.ui.define([
    'sap/ui/demo/toolpageapp/controller/BaseController',
    "sap/ui/demo/toolpageapp/model/models",
    'sap/ui/model/json/JSONModel',
    'sap/ui/Device',
    'sap/ui/demo/toolpageapp/model/formatter',
    'sap/ui/core/BusyIndicator',
    "sap/m/Button",
    "sap/ui/core/dnd/DragDropInfo",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Label",
    "sap/ui/core/Fragment",
    "sap/ui/core/date/UI5Date",
    "sap/m/MessageToast"
], function (BaseController, models, JSONModel, Device, formatter, BusyIndicator, Button, DragDropInfo, VBox, HBox, Label, Fragment, UI5Date, MessageToast) {
    "use strict";
    var oGlobalModel, oRouter
    return BaseController.extend("sap.ui.demo.toolpageapp.controller.user.productivity.Todo", {
        formatter: formatter,

        onInit: function () {
            this.getView().setModel(this.getOwnerComponent().getModel("oGlobalAIModel"), "oGlobalAIModel");
            oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oGlobalModel = this.getView().getModel("oGlobalAIModel");
            oRouter.getRoute("Todo").attachMatched(this.onObjectMatched, this);

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
                this.fnCkUserLoggedIn(oRouter, "home");
            }
            return oToken;
        },

        onViewToggle: function (oEvent) {
            var oModel = this.getView().getModel("oTodoCalenderModel");
           var oSelKey =  this.getView().byId("idTodoSwitch").getSelectedKey();
           if(oSelKey==="LIST"){
                    oModel.setProperty("/isListView", true);
                    oModel.setProperty("/isCalenderView", false);
                    oModel.setProperty("/view/mode", "LIST");
                    return
           }
            if(oSelKey==="CAL"){
                if (this.userSubcriptionValidation("HEALTH_TRACKER_CHART")) {
                    oModel.setProperty("/isListView", false);
                    oModel.setProperty("/isCalenderView", true);
                    oModel.setProperty("/view/mode", "CAL");
                }
                else{
                    this.getView().byId("idTodoSwitch").setSelectedKey("LIST")
                }

           }
           return
            var oModel = this.getView().getModel("oTodoCalenderModel");
            if (oModel.getProperty("/isCalenderView")) {
                if (this.userSubcriptionValidation("HEALTH_TRACKER_CHART")) {//oModel.getProperty("/isProUser")

                    oModel.setProperty("/isListView", true);
                    oModel.setProperty("/isCalenderView", false);
                    oModel.setProperty("/view/mode", "CALENDAR");

                    return
                }else{
                    oModel.setProperty("/isListView", false);
                    oModel.setProperty("/isCalenderView", true);
                    oModel.setProperty("/view/mode", "LIST");
                    return
                }
            }

            oModel.setProperty("/isListView", !oModel.getProperty("/isListView"));
            oModel.setProperty("/isCalenderView", !oModel.getProperty("/isCalenderView"));
        },
        fetchTodoListByDate: function () {
            // Global single model
            var oTodoCalenderModel = new JSONModel({
                start_date: new Date(),
                isListView: true,
                isCalenderView: false,
                view: { mode: "LIST" },
                todos: [
                    {
                        title: "Buy groceries",
                        description: "Milk, Eggs, Bread",
                        status: "Pending",
                        priority_type: "Type08",
                        notes: "note  Type08",
                        priority_text: "High",
                        start_date: new Date(2026, 0, 5),
                        end_date: new Date(2026, 0, 5)
                    },
                    {
                        title: "Finish UI5 task",
                        description: "Calendar To-Do App",
                        status: "In Progress",
                        priority_type: "Type01",
                        priority_text: "Medium",
                        start_date: new Date(2026, 0, 6),
                        end_date: new Date(2026, 0, 6)
                    }
                ]
            });

            this.getView().setModel(oTodoCalenderModel, "oTodoCalenderModel");
            this._filterTodosByDate();
        },

        _filterTodosByDate: function () {
            var oView = this.getView();
            var oList = oView.byId("todoList");
            var oBinding = oList.getBinding("items");
            var oModel = oView.getModel("oTodoCalenderModel");
            var oDate = oModel.getProperty("/start_date");
            if (!oDate) return;

            var oStart = new Date(oDate);
            oStart.setHours(0, 0, 0, 0);
            var oEnd = new Date(oDate);
            oEnd.setHours(23, 59, 59, 999);

            var aFilters = [
                new sap.ui.model.Filter("start_date", sap.ui.model.FilterOperator.BT, oStart, oEnd)
            ];

            oBinding.filter(aFilters);
            this.fetchEventsbyDate(oStart, oEnd)
        },
        fetchEventsbyDate: function (startDateTime, endDateTime) {
            var that = this;

            // this.getView().getModel("oTodoCalenderModel").setProperty("/todos",[])
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

                        that.getView().getModel("oTodoCalenderModel")
                            .setProperty("/todos", aTodos);

                        // that.getView().getModel("oTodoCalenderModel").setProperty("/todos",oResponse.data)

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

        onDateLabelPress: function (oEvent) {
            var oView = this.getView();
            var oModel = oView.getModel("oTodoCalenderModel");

            if (!this._oDatePopover) {
                var oCalendar = new sap.ui.unified.Calendar({
                    select: function (oCalEvent) {
                        var aSelectedDates = oCalEvent.getSource().getSelectedDates();
                        if (aSelectedDates.length > 0) {
                            var oSelectedDate = aSelectedDates[0].getStartDate();
                            oModel.setProperty("/start_date", oSelectedDate);
                            this._filterTodosByDate();
                            this._oDatePopover.close();
                        }
                    }.bind(this)
                });

                this._oDatePopover = new sap.m.Popover({
                    placement: "Bottom",
                    showHeader: false,
                    content: [oCalendar]
                });

                oView.addDependent(this._oDatePopover);
            }

            this._oDatePopover.openBy(oEvent.getSource());
        },

        onPrevDay: function () {
            var oModel = this.getView().getModel("oTodoCalenderModel");
            var d = new Date(oModel.getProperty("/start_date"));
            d.setDate(d.getDate() - 1);
            oModel.setProperty("/start_date", d);
            this._filterTodosByDate();
        },

        onNextDay: function () {
            var oModel = this.getView().getModel("oTodoCalenderModel");
            var d = new Date(oModel.getProperty("/start_date"));
            d.setDate(d.getDate() + 1);
            oModel.setProperty("/start_date", d);
            this._filterTodosByDate();
        },

        onTodayPress: function () {
            this.getView().getModel("oTodoCalenderModel").setProperty("/start_date", new Date());
            this._filterTodosByDate();
        },
        onCalendarDateChange: function (oEvent) {
            this._filterTodosByDate()
        },

        _openDialog: function () {
            var oView = this.getView();

            if (!this._pDialog) {
                this._pDialog = Fragment.load({
                    id: oView.getId(),
                    name: "sap.ui.demo.toolpageapp.view.user.productivity.fragment.EditTodoDetails",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pDialog.then(function (oDialog) {
                this._setDialogData(oDialog);
                oDialog.open();
            }.bind(this));
        },

        _setDialogData: function (oDialog) {
            var oModel = this.getView().getModel("oTodoCalenderModel"),
                oData;

            if (this._contextPath) {
                oData = oModel.getProperty(this._contextPath);
            } else {
                const startDate = new Date();
                const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
                oData = {
                    title: "",
                    description: "",
                    label: "",
                    notes: "",
                    status: "Pending",
                    priority_type: "Type01",
                    priority_text: "Medium",
                    start_date: this._tempDates?.start || startDate,
                    end_date: this._tempDates?.end || endDate
                };
            }

            oDialog.setModel(new JSONModel(oData), "dialog");
        },

        onCancelTodo: function () {
            this._resetDialog();
        },

        _resetDialog: function () {
            this._contextPath = null;
            this._tempDates = null;
            this.byId("todoDialog").close();
        },

        onCreateTodo: function () {
            this._openDialog();
        },

        onAppointmentCreate: function (oEvent) {

            this._tempDates = {
                start: oEvent.getParameter("start_date"),
                end: oEvent.getParameter("end_date")
            };

            this._openDialog(); // no contextPath → new


        },

        onAppointmentSelect: function (oEvent) {
            this._contextPath = oEvent.getParameter("appointment").getBindingContext("oTodoCalenderModel").getPath();
            this._openDialog();
        },

        onListItemPress: function (oEvent) {
            this._contextPath = oEvent.getSource().getSelectedContextPaths()[0];
            this._openDialog();
            this.byId("todoList").removeSelections(true);
        },

        onAppointmentDrop: function (oEvent) {
            var oAppt = oEvent.getParameter("appointment");
            var oData = oAppt.getBindingContext("oTodoCalenderModel").getObject();

            // Update dates
            oData.start_date = oEvent.getParameter("startDate");
            oData.end_date = oEvent.getParameter("endDate");

            // Save using helper
            var sContextPath = oAppt.getBindingContext("oTodoCalenderModel").getPath();
            this.saveCalendarTodo(oData, sContextPath, "Moved");

        },

        onAppointmentResize: function (oEvent) {
            var oAppt = oEvent.getParameter("appointment");
            var oData = oAppt.getBindingContext("oTodoCalenderModel").getObject();


            oData.start_date = oEvent.getParameter("startDate");
            oData.end_date = oEvent.getParameter("endDate");

            var sContextPath = oAppt.getBindingContext("oTodoCalenderModel").getPath();
            this.saveCalendarTodo(oData, sContextPath, "Resized");

        },

        onSaveTodo: function () {
            var oDialogModel = this.byId("todoDialog").getModel("dialog");
            var oData = oDialogModel.getData();

            var sContextPath = this._contextPath; // null if new
            oData.start_date = this.getView().byId("idTodoStartDate").getDateValue();
            oData.end_date = this.getView().byId("idTodoEndDate").getDateValue();

            this.saveCalendarTodo(oData, sContextPath, "Saved");

        },

        onEditPress: function (oEvent) {
            var oItem = oEvent.getSource().getParent().getParent();
            this._contextPath = oItem.getBindingContext("oTodoCalenderModel").getPath();
            this._openDialog();
            this.byId("todoList").removeSelections(true);
        },

        onDeletePress: function (oEvent) {
            var that = this;
            var oItem = oEvent.getSource().getParent().getParent();
            var sContextPath = oItem.getBindingContext("oTodoCalenderModel").getPath();
            var oModel = this.getView().getModel("oTodoCalenderModel");
            var aData = oModel.getProperty("/todos");

            var iIndex = parseInt(sContextPath.split("/").pop());
            if (!aData[iIndex].id) {
                sap.m.MessageToast.show("No record selected");
                return;
            }
            var payload = {
                id: [aData[iIndex].id],
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
                        that.byId("todoList").removeSelections(true);
                        that.createMessageStrip(true, oResponse.message, "Success");
                        that._filterTodosByDate();
                        that._resetDialog();
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

        /**
 * Validate a todo object before saving
 * @param {Object} oData - todo data
 * @returns {boolean} true if valid, false if errors
 */
        _validateTodo: function (oData) {
            var aErrors = [];
            var aWarnings = [];

            // Required fields
            if (!oData.title || oData.title.trim() === "") aErrors.push("Title");
            if (!oData.description || oData.description.trim() === "") aErrors.push("Description");
            if (!oData.status || oData.status.trim() === "") aErrors.push("Status");
            if (!oData.priority_type || oData.priority_type.trim() === "") aErrors.push("Priority");
            if (!oData.start_date) aErrors.push("Start Date");
            if (!oData.end_date) aErrors.push("End Date");

            // Optional fields warnings
            if (!oData.label || oData.label.trim() === "") aWarnings.push("Tags/Label");
            if (!oData.notes || oData.notes.trim() === "") aWarnings.push("Notes");

            // Show warnings first (non-blocking)
            if (aWarnings.length > 0) {
                sap.m.MessageToast.show("Optional fields missing: " + aWarnings.join(", "), { duration: 4000 });
            }

            // Show errors (blocking)
            if (aErrors.length > 0) {
                sap.m.MessageBox.error(
                    "Please fill the required fields:\n" + aErrors.join("\n"),
                    {
                        title: "Validation Error"
                    }
                );
                return false; // prevent save
            }

            return true;
        },
        saveCalendarTodo: function (oData, sContextPath, SaveFrom) {
            // Validate first
            if (!this._validateTodo(oData)) {
                return; // stop saving if errors
            }

            var payload = {
                id: oData.id || null,
                flagname: "todo",
                title: oData.title,
                description: oData.description,
                status: oData.status,
                priority_type: oData.priority_type,
                priority_text: this._getPriorityText(oData.priority_type),
                label: oData.label,
                notes: oData.notes,
                start_date: oData.start_date,
                end_date: oData.end_date
            };

            this.fnSaveEvent(payload, SaveFrom);
        },
        _getPriorityText: function (sType) {
            switch (sType) {
                case "Type08": return "High";
                case "Type01": return "Medium";
                case "Type05": return "Low";
                default: return "";
            }
        },

        fnSaveEvent: function (oPayload, SaveFrom) {
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
                        that.createMessageStrip(true, SaveFrom + " " + oResponse.message, "Success");
                        that._filterTodosByDate();
                        that._resetDialog();
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