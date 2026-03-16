sap.ui.define([
    'sap/ui/demo/toolpageapp/controller/BaseController',
    "sap/ui/demo/toolpageapp/model/models",
    'sap/ui/model/json/JSONModel',
    'sap/ui/Device',
    'sap/ui/demo/toolpageapp/model/formatter',
    'sap/ui/core/BusyIndicator',
    "sap/ui/core/Fragment",
    "sap/ui/demo/toolpageapp/controller/prav/pravAIChat"
], function (BaseController, models, JSONModel, Device, formatter, BusyIndicator, Fragment, pravAIChat) {
    "use strict";
    var oGlobalModel, oRouter
    return BaseController.extend("sap.ui.demo.toolpageapp.controller.user.expense.ExpenseOverviewChat", {
        formatter: formatter,

        onInit: function () {
            this._loadChatFragment();
 
        },
        _loadChatFragment: function () {
            var oView = this.getView();
            let that = this;
            Fragment.load({
                name: "sap.ui.demo.toolpageapp.view.pravAI.fragment.AIChatPanel",
                controller: pravAIChat
            }).then(function (oFragment) {
                oView.byId("AIChatContainer").addItem(oFragment);
                pravAIChat.onInit(that)
            }.bind(this));
        },
  
    });
});