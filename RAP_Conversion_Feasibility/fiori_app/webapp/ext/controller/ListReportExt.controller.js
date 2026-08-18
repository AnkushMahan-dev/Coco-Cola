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

    // The nine report modes (code + text) - the fixed values of domain
    // /CCBJI/FSV_MODE. Used to render ReportMode as a real dropdown on the
    // front end (a custom entity does not expose domain fixed values as a
    // dropdown automatically).
    var MODE_ORDER = [
        { key: "TOUR", text: "Tour Details" },
        { key: "VISI", text: "Visit Details" },
        { key: "SLRP", text: "Sales / Replenishment Info." },
        { key: "PAYT", text: "Payment Details" },
        { key: "CHCK", text: "Check Out / Check In" },
        { key: "MONY", text: "Money Differences" },
        { key: "QUAN", text: "Quantity Differences" },
        { key: "FSRD", text: "FSR Documents" },
        { key: "CASH", text: "Cash Difference" }
    ];

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

    // Table COLUMNS shown per mode (property keys = CDS element names).
    // Reproduces the classic f_set_columns* per-mode column layouts, so each
    // mode shows only its own columns instead of the superset. ReportMode is
    // always shown; everything not listed for the current mode is hidden.
    var MODE_COLUMNS = {
        "TOUR": ["ReportMode", "ProcessingStatus", "ShipmentNo", "Plant", "Route", "SettlementDate",
                 "Driver", "CoDriver", "CreatedOn", "CreatedTime", "CreatedBy",
                 "ChangedOn", "ChangedTime", "ChangedBy", "Scenario", "DriverSwap",
                 "VisitGroup", "IDocNo", "TourId"],
        "VISI": ["ReportMode", "ProcessingStatus", "ShipmentNo", "CreatedOn", "Plant", "Route",
                 "SettlementDate", "Driver", "StatusId", "VisitId", "Customer", "EquipOwner",
                 "AccountGroup", "BusinessType", "Vkorg", "DistChannel", "Division", "VisitReason",
                 "ChangedOn", "ChangedTime", "ChangedBy", "ManProc", "VisitLog", "TourId"],
        "SLRP": ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate", "StatusId",
                 "TourId", "VisitId", "ObjType", "DeliveryNo", "PoNumber"],
        "PAYT": ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate", "StatusId",
                 "TourId", "PaymentMethod", "CardNo", "Amount", "Currency"],
        "CHCK": ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate", "StatusId",
                 "TourId", "Material", "MaterialDesc"],
        "MONY": ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate", "StatusId",
                 "SldDocId", "Amount"],
        "QUAN": ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate", "StatusId",
                 "SldDocId", "Material", "MaterialDesc", "QuanDiff"],
        "FSRD": ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate", "StatusId",
                 "TourId", "Vkorg", "ReferenceDoc"],
        "CASH": ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate", "StatusId",
                 "CashType", "Amount", "Currency"]
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
                this._oTable = this._findTable();
                this._attach(oFilterBar);
                this._setupModeDropdown();
                this._applyModeVisibility();
                this._applyModeColumns();
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
         * Locate the single MDC Table of the List Report.
         * @returns {sap.ui.mdc.Table|null}
         */
        _findTable: function () {
            var oView = this.base.getView();
            if (!oView) {
                return null;
            }
            var aTables = oView.findAggregatedObjects(true, function (oCtrl) {
                return oCtrl.isA && oCtrl.isA("sap.ui.mdc.Table");
            });
            return (aTables && aTables.length) ? aTables[0] : null;
        },

        /**
         * Attach to every signal that can change the mode or rebuild the bar.
         * @param {sap.ui.mdc.FilterBar} oFilterBar the filter bar
         */
        _attach: function (oFilterBar) {
            var that = this;
            var fnApply = function () {
                that._applyModeVisibility();
                that._applyModeColumns();
            };

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
         * Locate the ReportMode MDC FilterField.
         * @returns {sap.ui.mdc.FilterField|null}
         */
        _getModeField: function () {
            var oFB = this._oFilterBar;
            if (!oFB || !oFB.getFilterItems) {
                return null;
            }
            var aItems = oFB.getFilterItems();
            for (var i = 0; i < aItems.length; i++) {
                var sPath = (aItems[i].getFieldPath && aItems[i].getFieldPath()) ||
                            (aItems[i].getPropertyKey && aItems[i].getPropertyKey()) || "";
                if (sPath === MODE_FIELD) {
                    return aItems[i];
                }
            }
            return null;
        },

        /**
         * Render ReportMode as a real dropdown (fixed value list), not an F4
         * value-help / condition dialog. A custom entity does not surface its
         * domain fixed values as a dropdown, so we attach an MDC ValueHelp with
         * a FixedList (the nine modes) to the field. Fully guarded - if the MDC
         * modules differ, the field is simply left as-is.
         */
        _setupModeDropdown: function () {
            var that = this;
            var oField = this._getModeField();
            if (!oField || oField.__modeDropdownDone) {
                return;
            }
            sap.ui.require([
                "sap/ui/mdc/ValueHelp",
                "sap/ui/mdc/valuehelp/Popover",
                "sap/ui/mdc/valuehelp/content/FixedList",
                "sap/ui/mdc/valuehelp/content/FixedListItem"
            ], function (ValueHelp, Popover, FixedList, FixedListItem) {
                try {
                    var fnItems = function () {
                        return MODE_ORDER.map(function (m) {
                            return new FixedListItem({ key: m.key, text: m.text });
                        });
                    };
                    var oVH = new ValueHelp({
                        typeahead: new Popover({
                            content: [ new FixedList({
                                useFirstMatch: true,
                                filterList: false,
                                caseSensitive: false,
                                items: fnItems()
                            }) ]
                        }),
                        dialog: new Popover({
                            content: [ new FixedList({ items: fnItems() }) ]
                        })
                    });
                    that.base.getView().addDependent(oVH);
                    if (oField.setValueHelp) {
                        oField.setValueHelp(oVH.getId());
                    }
                    if (oField.setOperators) {
                        oField.setOperators(["EQ"]);   // single-select dropdown, no ranges
                    }
                    if (oField.setDisplay) {
                        oField.setDisplay("Description");  // show the mode text
                    }
                    oField.__modeDropdownDone = true;
                } catch (e) {
                    // Leave the field as-is on any MDC API difference.
                }
            });
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
        },

        /**
         * Show only the table columns relevant to the current mode; hide the
         * rest - reproducing the classic per-mode column layout.
         *
         * NO BLANK HEADERS: the earlier blank "column name after Status" was
         * caused by hiding columns whose property key could NOT be resolved
         * (an empty key is never in the allowed list, so it was hidden and left
         * an empty header cell). The guard below SKIPS any column with no
         * resolvable key - such a column is always left visible with its label,
         * so a header can never render blank. Only columns whose key is known
         * are shown/hidden by mode. Users can further tune columns via the
         * table personalization (Settings) dialog.
         */
        _applyModeColumns: function () {
            var oTable = this._oTable;
            if (!oTable || !oTable.getColumns) {
                return;
            }
            var sMode = this._getCurrentMode();
            var aAllowed = MODE_COLUMNS[sMode];
            // Unknown / empty mode: show everything (never hide).
            if (!aAllowed || !aAllowed.length) {
                oTable.getColumns().forEach(function (oColumn) {
                    if (oColumn.getVisible && oColumn.setVisible && oColumn.getVisible() !== true) {
                        oColumn.setVisible(true);
                    }
                });
                return;
            }

            oTable.getColumns().forEach(function (oColumn) {
                var sKey = (oColumn.getPropertyKey && oColumn.getPropertyKey()) ||
                           (oColumn.getDataProperty && oColumn.getDataProperty()) || "";
                // SAFETY: never touch a column whose key we cannot resolve -
                // hiding it would leave a blank header. Leave it visible.
                if (!sKey) {
                    if (oColumn.getVisible && oColumn.setVisible && oColumn.getVisible() !== true) {
                        oColumn.setVisible(true);
                    }
                    return;
                }
                var bVisible = aAllowed.indexOf(sKey) !== -1;
                if (oColumn.getVisible && oColumn.setVisible && oColumn.getVisible() !== bVisible) {
                    oColumn.setVisible(bVisible);
                }
            });
        }
    });
});
