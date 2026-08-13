/**
 * List Report controller extension for /CCBJI/ OTC DSD Settlement Details.
 *
 * PURPOSE (Option C)
 * ------------------
 * The classic ABAP report /CCBJI/RDSDFSVG_STLMNT_DETAILS drove its
 * selection-screen blocks from the chosen radio button (report mode).
 * A Fiori Elements V4 List Report renders ONE static filter bar, so this
 * extension reproduces the old behaviour on the front end: every filter is
 * declared once in the CDS metadata extension, and this controller shows
 * only the filters that belong to the currently selected Report Mode,
 * hiding the rest.
 *
 * HOW IT WORKS
 * ------------
 *  - onInit locates the MDC FilterBar of the List Report.
 *  - It reacts to two signals: the ReportMode filter value changing, and the
 *    filter bar re-rendering (personalization / navigation restore).
 *  - _applyModeVisibility reads the current ReportMode and calls setVisible()
 *    on each MDC FilterField whose fieldPath is not allowed for that mode.
 *
 * EXTENDING
 * ---------
 * To add a new per-mode filter: (1) add the element + @UI.selectionField in
 * the CDS metadata extension /CCBJI/I_FSV_STLMNT_DTL, then (2) add its field
 * path to the relevant rows of MODE_FILTERS below. No other change is needed.
 *
 * NOTE ON FRAGILITY
 * -----------------
 * MDC FilterBar field visibility is a UI-only concern and is not a first-class
 * FE V4 API. setVisible() on the FilterField works for interactive mode
 * switching; the field re-applies its allowed state on every rerender via the
 * events wired below. It does not change what the OData query returns - the
 * backend query class already ignores filters that are irrelevant to a mode
 * and never dumps (TRY/CATCH cx_root), so a stale hidden filter is harmless.
 */
sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension"
], function (ControllerExtension) {
    "use strict";

    // Field path of the driving dropdown.
    var MODE_FIELD = "ReportMode";

    // Filters that are ALWAYS visible regardless of mode. These mirror the
    // mandatory header block of the original selection screen.
    var ALWAYS = [MODE_FIELD, "Plant", "Route", "SettlementDate"];

    /**
     * Mode -> additional filter field paths that are relevant for that mode.
     * The union with ALWAYS is what stays visible; everything else is hidden.
     *
     * Only field paths that actually exist as @UI.selectionField in the CDS
     * metadata extension have any effect - unknown paths are ignored safely.
     * Codes are the fixed values of domain /CCBJI/FSV_MODE.
     */
    var MODE_FILTERS = {
        "TOUR": ["ShipmentNo", "StatusId", "Driver", "Vehicle", "TourId"],        // Tour details
        "VISI": ["ShipmentNo", "StatusId", "Customer", "VisitId", "VisitReason"], // Visit details
        "SLRP": ["ShipmentNo", "StatusId", "Customer", "Material", "Vkorg"],      // Sales / Replenishment
        "PAYT": ["ShipmentNo", "Customer", "PaymentMethod", "Currency", "SldDocId"], // Payment
        "CHCK": ["ShipmentNo", "StatusId", "Driver", "Vehicle", "TourId"],        // Check-out / Check-in
        "MONY": ["ShipmentNo", "Customer", "Currency", "PaymentMethod"],          // Money difference
        "QUAN": ["ShipmentNo", "Customer", "Material", "DeliveryNo"],             // Quantity difference
        "FSRD": ["ShipmentNo", "StatusId", "Customer", "SldDocId", "ObjType"],    // FSR documents
        "CASH": ["ShipmentNo", "CashType", "Currency", "Driver"]                  // Cash
    };

    return ControllerExtension.extend("ccbji.otc.stlmnt.ext.controller.ListReportExt", {

        override: {
            /**
             * Wire up the filter bar once the List Report controller is ready.
             */
            onInit: function () {
                this._oFilterBar = null;
                // Defer: the MDC FilterBar is built asynchronously, so retry
                // on a short poll until it exists, then apply once.
                this._whenFilterBarReady(0);
            }
        },

        /**
         * Poll for the MDC FilterBar (max ~5s), then attach handlers.
         * @param {int} iAttempt current attempt counter
         */
        _whenFilterBarReady: function (iAttempt) {
            var oFilterBar = this._findFilterBar();
            if (oFilterBar) {
                this._oFilterBar = oFilterBar;
                this._attach(oFilterBar);
                this._applyModeVisibility();
                return;
            }
            if (iAttempt < 50) {
                setTimeout(this._whenFilterBarReady.bind(this, iAttempt + 1), 100);
            }
        },

        /**
         * Locate the single MDC FilterBar owned by this List Report view.
         * @returns {sap.ui.mdc.FilterBar|null}
         */
        _findFilterBar: function () {
            var oView = this.base.getView();
            if (!oView) {
                return null;
            }
            var aBars = oView.findAggregatedObjects(true, function (oCtrl) {
                return oCtrl.isA && oCtrl.isA("sap.ui.mdc.FilterBar");
            });
            return (aBars && aBars.length) ? aBars[0] : null;
        },

        /**
         * Attach to every signal that can change the mode or rebuild the bar.
         * @param {sap.ui.mdc.FilterBar} oFilterBar the filter bar
         */
        _attach: function (oFilterBar) {
            var fnApply = this._applyModeVisibility.bind(this);

            // Value of any filter (including ReportMode) changed.
            if (oFilterBar.attachFiltersChanged) {
                oFilterBar.attachFiltersChanged(fnApply);
            }
            // Search / Go pressed.
            if (oFilterBar.attachSearch) {
                oFilterBar.attachSearch(fnApply);
            }
            // Conditions model changed (covers programmatic + restore).
            var oCondModel = oFilterBar.getModel && oFilterBar.getModel("$filters");
            if (oCondModel && oCondModel.attachPropertyChange) {
                oCondModel.attachPropertyChange(fnApply);
            }
        },

        /**
         * Read the currently selected ReportMode from the filter bar.
         * @returns {string} the 4-char mode code, or "" if none
         */
        _getCurrentMode: function () {
            var oFilterBar = this._oFilterBar;
            if (!oFilterBar || !oFilterBar.getConditions) {
                return "";
            }
            var oConditions = oFilterBar.getConditions() || {};
            var aMode = oConditions[MODE_FIELD];
            if (aMode && aMode.length && aMode[0].values && aMode[0].values.length) {
                return String(aMode[0].values[0]).toUpperCase();
            }
            return "";
        },

        /**
         * Show the filters relevant to the current mode; hide the rest.
         */
        _applyModeVisibility: function () {
            var oFilterBar = this._oFilterBar;
            if (!oFilterBar || !oFilterBar.getFilterItems) {
                return;
            }
            var sMode = this._getCurrentMode();
            var aAllowed = ALWAYS.concat(MODE_FILTERS[sMode] || []);

            oFilterBar.getFilterItems().forEach(function (oField) {
                var sPath = (oField.getFieldPath && oField.getFieldPath()) ||
                            (oField.getPropertyKey && oField.getPropertyKey()) || "";
                var bVisible = aAllowed.indexOf(sPath) !== -1;
                if (oField.getVisible && oField.getVisible() !== bVisible) {
                    oField.setVisible(bVisible);
                }
            });
        }
    });
});
