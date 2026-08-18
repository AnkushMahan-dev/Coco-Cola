/**
 * Object Page controller extension for /CCBJI/ OTC DSD Settlement Details.
 *
 * PURPOSE
 * -------
 * The single Settlement Detail entity carries the columns of ALL nine report
 * modes. On the Object Page (detail view) that would show a long form with many
 * empty fields. This extension hides the form fields that are not relevant to
 * the ReportMode of the displayed row, mirroring the per-mode column layout of
 * the List Report table.
 *
 * SAFETY
 * ------
 * Everything runs inside try/catch and only ever HIDES fields whose binding
 * path is known and not relevant to the current mode. If anything cannot be
 * resolved (mode unknown, field path missing) it leaves fields visible, so the
 * worst case is the current behaviour (all fields shown) - never a broken page.
 */
sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension"
], function (ControllerExtension) {
    "use strict";

    // Fields ALWAYS shown on the object page regardless of mode (key/header).
    var ALWAYS = ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate",
                  "StatusId", "TourId", "ProcessingStatus"];

    // Mode -> fields relevant on the object page. Mirrors the List Report's
    // per-mode column layout. Codes are the fixed values of /CCBJI/FSV_MODE.
    var MODE_FIELDS = {
        "TOUR": ["Driver", "CoDriver", "CreatedOn", "CreatedTime", "CreatedBy",
                 "ChangedOn", "ChangedTime", "ChangedBy", "Scenario", "DriverSwap",
                 "VisitGroup", "IDocNo"],
        "VISI": ["CreatedOn", "Driver", "VisitId", "Customer", "EquipOwner",
                 "AccountGroup", "BusinessType", "Vkorg", "DistChannel", "Division",
                 "VisitReason", "ChangedOn", "ChangedTime", "ChangedBy", "ManProc", "VisitLog"],
        "SLRP": ["VisitId", "ObjType", "DeliveryNo", "DeliveryItem", "PoNumber", "PoDate",
                 "Material", "MaterialDesc", "Quantity", "Uom", "TaCode", "Reason", "Batch",
                 "CondType", "OrigQty", "Amount", "Customer", "BusinessType", "EquipOwner", "Scenario"],
        "PAYT": ["PaymentMethod", "PaymentDescr", "CardNo", "CheckNo", "Amount", "Currency",
                 "CashId", "CashType", "AccountingDoc", "FiscYear", "CompCode", "Customer",
                 "PostingItem", "PostingKey", "PostingAmount", "PostingCurrency", "PostingDate",
                 "DocType", "ReversalDoc"],
        "CHCK": ["CheckId", "ItemNo", "Material", "MaterialDesc", "QuanPlan", "QuanCount",
                 "QuanDiff", "Uom", "Reason", "Batch", "Amount", "Currency", "PaymentMethod"],
        "MONY": ["SldDocId", "PaymentMethod", "AmountCo", "AmountExpenses", "AmountEarnings",
                 "AmountCi", "Amount", "AmountPlan", "Reason", "Currency"],
        "QUAN": ["SldDocId", "Material", "MaterialDesc", "QuanPlan", "QuanCheckout", "QuanDiff",
                 "QuanDelivered", "QuanReturn", "QuanCheckin", "QuanFinalDiff", "Uom",
                 "ValueFinDiff", "Currency", "Batch"],
        "FSRD": ["Vkorg", "ReferenceDoc", "Customer"],
        "CASH": ["CashType", "Amount", "Currency", "Customer", "BusinessType", "EquipOwner",
                 "Quantity", "Uom", "AmountCo", "AmountCi", "AmountPlan", "Driver"]
    };

    return ControllerExtension.extend("ccbji.otc.stlmnt.ext.controller.ObjectPageExt", {

        override: {
            /**
             * FE V4 calls this once the object page data is ready. Best place to
             * read the row's ReportMode and adjust field visibility.
             */
            onPageReady: function () {
                try {
                    this._applyModeFields();
                } catch (e) {
                    // Never let the page break - leave all fields visible.
                }
            }
        },

        /**
         * Read the displayed row's ReportMode.
         * @returns {string} mode code (upper-case) or ""
         */
        _getRowMode: function () {
            try {
                var oCtx = this.base.getView().getBindingContext();
                if (oCtx) {
                    var v = oCtx.getProperty("ReportMode");
                    if (v) {
                        return String(v).toUpperCase();
                    }
                }
            } catch (e) { /* ignore */ }
            return "";
        },

        /**
         * Resolve the property path bound to a form element's field.
         * @param {sap.ui.core.Control} oFE the FormElement
         * @returns {string} the property name, or ""
         */
        _fieldPath: function (oFE) {
            try {
                var aFields = (oFE.getFields && oFE.getFields()) || [];
                for (var i = 0; i < aFields.length; i++) {
                    var oField = aFields[i];
                    // mdc.Field exposes the path via getFieldPath in FE V4.
                    if (oField.getFieldPath && oField.getFieldPath()) {
                        return oField.getFieldPath();
                    }
                    // Fallback: inspect the value binding info.
                    var oBI = oField.getBindingInfo && (oField.getBindingInfo("value") ||
                                                        oField.getBindingInfo("text"));
                    if (oBI && oBI.parts && oBI.parts.length && oBI.parts[0].path) {
                        return oBI.parts[0].path;
                    }
                }
            } catch (e) { /* ignore */ }
            return "";
        },

        /**
         * Hide form elements whose field is not relevant to the row's mode.
         */
        _applyModeFields: function () {
            var oView = this.base.getView();
            if (!oView) {
                return;
            }
            var sMode = this._getRowMode();
            var aAllowed = MODE_FIELDS[sMode];
            // Unknown mode: leave everything visible.
            if (!aAllowed) {
                return;
            }
            var aWhitelist = ALWAYS.concat(aAllowed);

            var aFE = oView.findAggregatedObjects(true, function (oCtrl) {
                return oCtrl.isA && oCtrl.isA("sap.ui.layout.form.FormElement");
            });

            var that = this;
            aFE.forEach(function (oFE) {
                var sPath = that._fieldPath(oFE);
                // SAFETY: unknown path -> leave visible (never hide blindly).
                if (!sPath) {
                    if (oFE.getVisible && oFE.setVisible && oFE.getVisible() !== true) {
                        oFE.setVisible(true);
                    }
                    return;
                }
                var bVisible = aWhitelist.indexOf(sPath) !== -1;
                if (oFE.getVisible && oFE.setVisible && oFE.getVisible() !== bVisible) {
                    oFE.setVisible(bVisible);
                }
            });
        }
    });
});
