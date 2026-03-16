sap.ui.define([
    'sap/ui/demo/toolpageapp/controller/BaseController',
    'sap/ui/model/json/JSONModel'
], function (BaseController, JSONModel) {
    "use strict";

    var that;

    return {

        onInit: function (oViewController) {
            that = oViewController;

            const oModel = new JSONModel({
                currentMessage: "",
                uiBusy: false,
                isProUser: true,
                messages: [
                    {
                        sender: "Prav Ally",
                        text: "Welcome! Ask me anything about your expenses.",
                        time: this._getTime(),
                        loading: false,
                        animate: "aiIn"
                    }
                ],
                suggestions: [
                    { text: "Top 5 Expenses" },
                    { text: "Where I Spend More?" },
                    { text: "Reduce Travel" }
                ]
            });

            that.getView().setModel(oModel, "chatModel");
            var ouserModel = new JSONModel({ toogleOverviewShow: false });
            this.getView().setModel(ouserModel, "oExpeseTrackerModel");
        },
         onTogglePravAICarousel: function () {
            const oModel = this.getView().getModel("oExpeseTrackerModel");

            let current = oModel.getProperty("/toogleOverviewShow");
            oModel.setProperty("/toogleOverviewShow", !current);
        },
         
            

        onSendMessage: function () {
            const oModel = that.getView().getModel("chatModel");
            const sText = oModel.getProperty("/currentMessage");
            if (!sText) return;

            const aMessages = oModel.getProperty("/messages");
            const bPro = oModel.getProperty("/isProUser");

            oModel.setProperty("/uiBusy", true);

            // USER MESSAGE
            aMessages.push({
                sender: "You",
                text: sText,
                time: this._getTime(),
                loading: false,
                animate: "userIn"
            });

            // AI Typing Indicator
            aMessages.push({
                sender: "Prav Ally",
                text: "",
                time: "",
                loading: true,
                animate: "aiTyping"
            });

            oModel.setProperty("/currentMessage", "");
            oModel.refresh();
            this._scrollBottom();

            setTimeout(() => {
                // Remove loader
                aMessages.pop();

                if (bPro) {
                    aMessages.push({
                        sender: "Prav Ally",
                        text: "Here are your top 5 expenses. Upgrade to unlock insights.",
                        time: this._getTime(),
                        loading: false,
                        animate: "aiIn"
                    });

                    oModel.setProperty("/suggestions", [
                        { text: "Show Expenses" },
                        { text: "Add New Expense" }
                    ]);

                } else {
                    aMessages.push({
                        sender: "Prav Ally",
                        text: "You are not a Pro user. Please upgrade to access this feature.",
                        time: this._getTime(),
                        loading: false,
                        animate: "aiIn"
                    });

                    oModel.setProperty("/suggestions", []);
                }

                oModel.setProperty("/uiBusy", false);
                oModel.refresh();
                this._scrollBottom();

            }, 1500);
        },

        onQuickSend: function (oEvent) {
            const sText = oEvent.getSource().getText();
            that.getView().getModel("chatModel").setProperty("/currentMessage", sText);
            this.onSendMessage();
        },

        _getTime: function () {
            return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },

        _scrollBottom: function () {
            setTimeout(() => {
                sap.ui.getCore().byId("chatScroll").scrollTo(0, 99999);
            }, 100);
        }
    };
});
