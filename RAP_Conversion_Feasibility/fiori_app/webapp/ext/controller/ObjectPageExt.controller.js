/**
 * Object Page controller extension for /CCBJI/ OTC DSD Settlement Details.
 *
 * PURPOSE
 * -------
 * The single Settlement Detail entity carries the columns of ALL nine report
 * modes. On the Object Page (detail view) that would show a long form with many
 * empty fields (Amount Check-Out, Summary Status, Promotion Amount ... on a
 * Payment row). This extension hides the form fields that are not relevant to
 * the ReportMode of the displayed row, mirroring the per-mode column layout of
 * the List Report table.
 *
 * ROBUSTNESS
 * ----------
 * The FE V4 object-page form renders asynchronously, so a single pass on
 * onPageReady can run before the fields exist. We therefore re-apply on a few
 * deferred passes. Field -> property resolution tries several strategies
 * (mdc.Field binding, value/text binding info, FormElement label). Everything
 * runs inside try/catch and only ever HIDES fields whose property is known and
 * not relevant to the current mode; anything unresolved is left visible.
 */
sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension"
], function (ControllerExtension) {
    "use strict";

    // Fields ALWAYS shown regardless of mode (key / header block).
    var ALWAYS = ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate",
                  "StatusId", "TourId", "ProcessingStatus", "ExceptionText"];

    // Mode -> fields relevant on the object page. Mirrors the List Report's
    // per-mode column layout (MODE_COLUMNS). Codes are the fixed values of
    // /CCBJI/FSV_MODE.
    var MODE_FIELDS = {
        "TOUR": ["Driver", "CoDriver", "CreatedOn", "CreatedTime", "CreatedBy",
                 "ChangedOn", "ChangedTime", "ChangedBy", "Scenario", "DriverSwap",
                 "VisitGroup", "IDocNo"],
        "VISI": ["CreatedOn", "Driver", "VisitId", "Customer", "EquipOwner",
                 "AccountGroup", "BusinessType", "Vkorg", "DistChannel", "Division",
                 "VisitReason", "ChangedOn", "ChangedTime", "ChangedBy", "ManProc", "VisitLog"],
        "SLRP": ["VisitId", "ObjType", "DeliveryNo", "DeliveryItem", "PoNumber", "PoDate",
                 "Customer", "Material", "MaterialDesc", "Quantity", "Uom", "TaCode",
                 "Reason", "Batch", "CondType", "Amount", "PackageGroup", "MoneyType",
                 "SetId", "SalesAmt", "Attr3", "BusinessType", "EquipOwner", "Scenario"],
        "PAYT": ["VisitId", "Customer", "PaymentMethod", "PaymentDescr", "CashId", "CashType",
                 "CardNo", "CheckNo", "Amount", "Currency", "AccountingDoc", "CompCode",
                 "FiscYear", "DocType", "PostingDate", "PostingItem", "PostingKey",
                 "PostingAmount", "PostingCurrency", "ReversalDoc"],
        "CHCK": ["CheckId", "ItemNo", "Material", "MaterialDesc", "QuanPlan", "QuanCount",
                 "QuanDiff", "Uom", "Reason", "Batch", "Amount", "Currency", "PaymentMethod"],
        "MONY": ["SldDocId", "PaymentMethod", "AmountCo", "AmountExpenses", "AmountEarnings",
                 "AmountCi", "Amount", "AmountPlan", "Reason", "Currency"],
        "QUAN": ["SldDocId", "Material", "MaterialDesc", "QuanPlan", "QuanCheckout", "QuanDiff",
                 "QuanDelivered", "QuanReturn", "QuanCheckin", "QuanFinalDiff", "Uom",
                 "ValueFinDiff", "Currency", "Batch"],
        "FSRD": ["Driver", "SalesDoc", "SalesDocType", "OrderDate", "DeliveryNo",
                 "DeliveryType", "DeliveryDate", "MaterialDoc", "BillingType", "InvoiceNo",
                 "InvoiceDate", "DocType", "AccountingDoc", "PostingDate", "CompCode",
                 "FiscYear", "Vkorg", "ReferenceDoc"],
        "CASH": ["SummaryStatus", "VisitId", "Customer", "BusinessType", "EquipOwner",
                 "TradingDiv", "VisitType", "CashType", "Quantity", "Uom", "AggSampleQty",
                 "SalesAmt", "PromoAmt", "AggFreeAmt", "FreeVendAmt", "SampleAmount", "NetAmt",
                 "CashCollected", "Recharge", "Refund", "Receipt", "UncollectCash", "BankedAmt",
                 "TheorCash", "TotCash", "EMoney", "Prepaid", "EmpId", "TotPayment", "DiffAmt",
                 "DriverCredit", "DriverDebit", "DriverReceive", "DriverGive", "Driver"]
    };

    return ControllerExtension.extend("ccbji.otc.stlmnt.ext.controller.ObjectPageExt", {

        override: {
            /**
             * FE V4 calls this once the object page data is ready. The form
             * fields can still be rendering, so we apply now and on a few short
             * deferred passes.
             */
            onPageReady: function () {
                this._applyModeFieldsRetry(0);
            }
        },

        /**
         * Apply mode-field visibility, retrying on a short poll while the form
         * finishes rendering.
         * @param {int} iAttempt attempt counter
         */
        _applyModeFieldsRetry: function (iAttempt) {
            var bDone = false;
            try {
                bDone = this._applyModeFields();
            } catch (e) {
                bDone = false;
            }
            // Keep re-applying for a short while: the form elements arrive
            // asynchronously, and the user can also navigate between rows.
            if (iAttempt < 8) {
                setTimeout(this._applyModeFieldsRetry.bind(this, iAttempt + 1),
                           iAttempt < 4 ? 250 : 700);
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
                    // Fall back to the RowKey (mode is its first segment).
                    var sKey = oCtx.getProperty("RowKey");
                    if (sKey) {
                        return String(sKey).split("~")[0].toUpperCase();
                    }
                }
            } catch (e) { /* ignore */ }
            return "";
        },

        /**
         * Resolve the property name bound to a form element's field, trying
         * several FE V4 strategies.
         * @param {sap.ui.core.Control} oFE the FormElement
         * @returns {string} the property name, or ""
         */
        _fieldPath: function (oFE) {
            try {
                var aFields = (oFE.getFields && oFE.getFields()) || [];
                for (var i = 0; i < aFields.length; i++) {
                    var oField = aFields[i];
                    // 1) mdc field data-property path.
                    if (oField.getFieldPath && oField.getFieldPath()) {
                        return this._lastSeg(oField.getFieldPath());
                    }
                    // 2) live binding on the value/text property.
                    var aProps = ["value", "text"];
                    for (var p = 0; p < aProps.length; p++) {
                        if (oField.getBinding) {
                            var oBnd = oField.getBinding(aProps[p]);
                            if (oBnd && oBnd.getPath) {
                                return this._lastSeg(oBnd.getPath());
                            }
                        }
                    }
                    // 3) binding info (before the binding is instantiated).
                    for (var q = 0; q < aProps.length; q++) {
                        var oBI = oField.getBindingInfo && oField.getBindingInfo(aProps[q]);
                        if (oBI && oBI.parts && oBI.parts.length && oBI.parts[0].path) {
                            return this._lastSeg(oBI.parts[0].path);
                        }
                    }
                }
            } catch (e) { /* ignore */ }
            return "";
        },

        /**
         * Keep only the last segment of a binding path (strip any prefix / '/').
         * @param {string} sPath a possibly qualified path
         * @returns {string} the trailing property name
         */
        _lastSeg: function (sPath) {
            var s = String(sPath || "");
            var iSlash = s.lastIndexOf("/");
            return iSlash >= 0 ? s.substring(iSlash + 1) : s;
        },

        /**
         * Hide form elements whose property is not relevant to the row's mode.
         * @returns {boolean} true if fields were found and processed
         */
        _applyModeFields: function () {
            var oView = this.base.getView();
            if (!oView) {
                return false;
            }
            var sMode = this._getRowMode();
            var aAllowed = MODE_FIELDS[sMode];
            // Unknown mode: leave everything visible.
            if (!aAllowed) {
                return false;
            }
            var oWhite = {};
            ALWAYS.concat(aAllowed).forEach(function (s) { oWhite[s] = true; });

            var aFE = oView.findAggregatedObjects(true, function (oCtrl) {
                return oCtrl.isA && oCtrl.isA("sap.ui.layout.form.FormElement");
            });
            if (!aFE.length) {
                return false;
            }

            var that = this;
            aFE.forEach(function (oFE) {
                var sPath = that._fieldPath(oFE);
                // SAFETY: unknown path -> leave visible (never hide blindly).
                if (!sPath) {
                    return;
                }
                var bVisible = !!oWhite[sPath];
                if (oFE.getVisible && oFE.setVisible && oFE.getVisible() !== bVisible) {
                    oFE.setVisible(bVisible);
                }
            });
            return true;
        }
    });
});
