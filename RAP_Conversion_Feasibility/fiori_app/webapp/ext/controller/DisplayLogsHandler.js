/**
 * Standalone handler module for the "Display Logs" custom table action.
 *
 * WHY A SEPARATE MODULE (not the controller extension)?
 * -----------------------------------------------------
 * A Fiori Elements V4 manifest custom action `press: "<module>.<method>"`
 * loads <module> as a PLAIN module (module id + ".js"). If it points at the
 * controller extension (ListReportExt) FE tries to load "ListReportExt.js"
 * (without ".controller"), which does not exist -> "script load error", and
 * that rejection also breaks the controller extension initialisation (so the
 * per-mode column/filter logic silently stops working too).
 *
 * Keeping the action handler in its OWN plain module (DisplayLogsHandler.js)
 * resolves cleanly and leaves the controller extension untouched.
 *
 * WHAT IT DOES
 * ------------
 * Reads the selected row's TourId and shows that tour's BAL application log
 * (OData entity set SettlementLog, backed by /CCBJI/CL_FSV_STLMNT_LOG) in a
 * dialog - Type + Message Text, coloured by criticality. Mirrors the classic
 * report's document hotspot -> /DSD/ST_APPLOG_VIEW popup.
 */
sap.ui.define([
    "sap/m/Dialog", "sap/m/Button", "sap/m/Table", "sap/m/Column",
    "sap/m/ColumnListItem", "sap/m/Text", "sap/m/ObjectStatus", "sap/m/Label",
    "sap/m/MessageToast", "sap/ui/model/Filter", "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel", "sap/ui/core/library"
], function (Dialog, Button, Table, Column, ColumnListItem, Text, ObjectStatus,
             Label, MessageToast, Filter, FilterOperator, JSONModel, coreLib) {
    "use strict";

    var ValueState = coreLib.ValueState;
    var _oDialog, _oTable;

    function _toast(sMsg) {
        try { MessageToast.show(sMsg); } catch (e) { /* ignore */ }
    }

    /**
     * Resolve the first selected row context across FE versions: the extension
     * API's selected contexts, or whatever FE passed to the handler.
     */
    function _firstContext(oApi, aArgs) {
        try {
            if (oApi && oApi.getSelectedContexts) {
                var a = oApi.getSelectedContexts();
                if (a && a.length) { return a[0]; }
            }
        } catch (e) { /* ignore */ }
        for (var i = 0; i < aArgs.length; i++) {
            var x = aArgs[i];
            if (!x) { continue; }
            if (x.getObject && x.getPath) { return x; }              // a context
            if (x.getParameter) {                                    // an event
                var c = x.getParameter("contexts") || x.getParameter("selectedContexts");
                if (c && c.length) { return c[0]; }
            }
            if (x.length && x[0] && x[0].getObject) { return x[0]; } // array of contexts
        }
        return null;
    }

    function _ensureDialog() {
        if (_oDialog) { return; }
        _oTable = new Table({
            inset: false,
            growing: true,
            growingThreshold: 500,
            columns: [
                new Column({ width: "6rem", header: new Label({ text: "Type" }) }),
                new Column({ header: new Label({ text: "Message Text" }) })
            ]
        });
        _oTable.bindItems({
            path: "logModel>/",
            template: new ColumnListItem({
                cells: [
                    new ObjectStatus({
                        text: "{logModel>MessageType}",
                        state: {
                            path: "logModel>Criticality",
                            formatter: function (iCrit) {
                                switch (iCrit) {
                                    case 1: return ValueState.Error;
                                    case 2: return ValueState.Warning;
                                    case 3: return ValueState.Success;
                                    default: return ValueState.None;
                                }
                            }
                        }
                    }),
                    new Text({ text: "{logModel>MessageText}" })
                ]
            })
        });
        _oDialog = new Dialog({
            title: "Application Log",
            contentWidth: "44rem",
            contentHeight: "34rem",
            resizable: true,
            draggable: true,
            content: [_oTable],
            endButton: new Button({ text: "Close", press: function () { _oDialog.close(); } })
        });
    }

    function _load(oModel, sTour) {
        try {
            var oListBinding = oModel.bindList("/SettlementLog", null, null, [
                new Filter("TourId", FilterOperator.EQ, sTour)
            ], { $count: true });
            oListBinding.requestContexts(0, 2000).then(function (aContexts) {
                var aRows = aContexts.map(function (oCtx) { return oCtx.getObject(); });
                _oTable.setModel(new JSONModel(aRows), "logModel");
                _oDialog.setBusy(false);
                if (!aRows.length) {
                    _toast("No application log found for this tour.");
                }
            }).catch(function () {
                _oDialog.setBusy(false);
                _toast("Could not read the application log.");
            });
        } catch (e) {
            _oDialog.setBusy(false);
            _toast("Could not read the application log.");
        }
    }

    return {
        /**
         * Custom action handler. FE binds `this` to the page's ExtensionAPI and
         * passes the selection; we resolve the row, read its TourId and open the
         * log dialog.
         */
        onDisplayLogs: function () {
            var oCtx = _firstContext(this, arguments);
            if (!oCtx) {
                _toast("Select a row first.");
                return;
            }
            var sTour = "";
            try { sTour = oCtx.getProperty("TourId") || ""; } catch (e) { sTour = ""; }
            if (!sTour) {
                _toast("This row has no Tour ID, so it has no application log.");
                return;
            }
            var oModel = oCtx.getModel();
            if (!oModel || !oModel.bindList) {
                _toast("OData model not available.");
                return;
            }
            _ensureDialog();
            _oDialog.setTitle("Application Log - Tour " + sTour);
            _oDialog.setBusy(true);
            _oDialog.open();
            _load(oModel, sTour);
        }
    };
});
