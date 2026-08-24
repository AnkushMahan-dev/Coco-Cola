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
        { key: "CASH", text: "Route Summary" }   // classic rb_cash label = "Route summary"
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
        "CHCK": ["ShipmentNo", "StatusId", "Driver", "TourId"],                   // Check-out / Check-in
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
        // 'FsrStatus' is dropped here: it carries the same StatusId value, so
        // showing both is redundant (user: "keep FSR Status or Status").
        "TOUR": ["ReportMode", "ExceptionText", "ChangedBy", "Scenario", "DriverSwap",
                 "ProcessingStatus", "VisitGroup", "IDocNo", "TourId", "CheckIn", "CheckOut",
                 "OrigEDate", "LogStatus", "ManRel", "Errors", "Warnings", "Origin", "Planned",
                 "PresalesStatus", "TourStatus", "StatusId", "ShipmentNo", "Plant", "Route",
                 "SettlementDate", "Driver", "CoDriver", "CreatedOn", "CreatedTime", "CreatedBy"],
        "VISI": ["ReportMode", "ExceptionText", "ShipmentNo", "CreatedOn", "Plant", "Route",
                 "SettlementDate", "Driver", "StatusId", "ProcessingStatus", "VisitId", "Customer",
                 "EquipOwner", "AccountGroup", "BusinessType", "Vkorg", "DistChannel", "Division",
                 "VisitReason", "ChangedOn", "ChangedTime", "ChangedBy", "ManProc", "VisitLog",
                 "TourId"],
        // Sales / Replenishment - full classic f_set_columns1 visible set.
        // (Most of these were already populated by the backend but hidden by
        // the previous short list, so they showed blank/absent; PackageGroup,
        // MoneyType, SetId and SalesAmt are the newly added classic columns.)
        "SLRP": ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate", "StatusId",
                 "VisitId", "ObjType", "DeliveryNo", "DeliveryItem", "PoNumber", "PoDate",
                 "Customer", "Material", "MaterialDesc", "Quantity", "Uom", "TaCode",
                 "Reason", "Batch", "CondType", "Amount", "PackageGroup", "MoneyType",
                 "SetId", "MoneyCode", "SalesAmt", "PromoAmt", "FreeVendAmt", "Attr3",
                 "BusinessType", "EquipOwner", "Scenario"],
        // Payment - one row per accounting-document line item (classic BSEG),
        // so the FI posting detail is shown alongside the payment header.
        "PAYT": ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate", "StatusId",
                 "VisitId", "Customer", "Recipient", "BusinessType", "EquipOwner",
                 "PaymentMethod", "PaymentDescr", "CashId", "CashType", "CardNo", "CheckNo",
                 "Amount", "Currency", "RcptExp", "DummyFlag", "Plog", "AccountingDoc", "CompCode",
                 "FiscYear", "DocType", "DocumentDate", "PostingDate", "PostingItem", "PostingKey",
                 "PostingAmount", "PostingCurrency", "ReversalDoc"],
        // Check-Out / Check-In (classic check structure): includes the Reason
        // code and the planned/counted/difference quantities.
        "CHCK": ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate", "StatusId",
                 "TourId", "CheckId", "ItemNo", "Material", "MaterialDesc", "QuanPlan",
                 "QuanCount", "QuanDiff", "Uom", "ReasonCode", "Batch", "Amount", "Currency"],
        // Money difference (classic ty_final4). No quantity columns exist in
        // this mode - Planned/Original Quantity belong to Quantity difference,
        // not here. 'Amount' carries the classic Difference Amount; Reason and
        // Mon. Diff. In/Out (AmountDiffEval) complete the classic layout.
        "MONY": ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate", "StatusId",
                 "TourId", "SldDocId", "PaymentMethod", "AmountCo", "AmountExpenses",
                 "AmountEarnings", "AmountCi", "AmountDiff", "ReasonCode", "Currency",
                 "AmountPlan", "AmountDiffEval"],
        // Quantity difference (classic ty_final5): Target/Check-Out/Delivered/
        // Returned/Check-In quantities and the final difference + its value.
        "QUAN": ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate", "StatusId",
                 "SldDocId", "Material", "MaterialDesc", "QuanPlan", "QuanCheckout", "QuanDiff",
                 "QuanDelivered", "QuanReturn", "QuanCheckin", "QuanFinalDiff", "ValueFinDiff",
                 "Uom", "Currency", "Batch"],
        // FSR Documents - full classic f_set_columns / f_get_shipment_data
        // chain: sales order -> delivery -> invoice -> accounting / material doc.
        "FSRD": ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate", "StatusId",
                 "Driver", "VisitId", "Customer", "BusinessType", "Attr3", "EquipOwner",
                 "PoNumber", "SalesDocType", "SalesDoc", "OrderDate", "DeliveryType",
                 "DeliveryNo", "DeliveryDate", "MaterialDoc", "BillingType", "InvoiceNo",
                 "InvoiceDate", "RefKey", "DocType", "AccountingDoc",
                 "ComInvType", "ComInv", "ComInvDate", "ComFiType", "ComFiDoc", "ComFiDate",
                 "PaymentMethod", "CardNo", "HeaderText", "Tpp", "Vkorg", "ReferenceDoc", "TourId"],
        // Route Summary - full classic f_set_columns4 aggregated cash figures.
        "CASH": ["ReportMode", "ShipmentNo", "Plant", "Route", "SettlementDate", "SummaryStatus",
                 "VisitId", "Customer", "BizTypeExt", "EquipOwner", "TradingDiv", "VisitType",
                 "Quantity", "Uom", "AggSampleQty", "SalesAmt", "PromoAmt", "AggFreeAmt",
                 "FreeVendAmt", "SampleAmount", "NetAmt", "CashCollected", "Recharge", "Refund",
                 "Receipt", "UncollectCash", "BankedAmt", "TheorCash", "TotCash", "EMoney",
                 "Prepaid", "EmpId", "TotPayment", "DiffAmt", "PaymentDiffStatus",
                 "DriverCredit", "DriverDebit", "DriverReceive", "DriverGive", "Driver"]
    };

    // Union of EVERY column referenced by any mode. CRITICAL for the column
    // hiding to actually work: sap.ui.mdc.Table#getColumns() returns only the
    // columns currently IN the table state (i.e. the visible ones), so building
    // the p13n state from getColumns() can never ADD a hidden mode column - that
    // is why the table only ever showed the few header columns ("half a page").
    // Driving StateUtil from this full key list lets applyExternalState both
    // ADD/SHOW the current mode's columns and hide the rest.
    // Columns that carry a default @UI.lineItem annotation but belong to NO
    // mode's layout. They must be listed here so the per-mode apply can HIDE
    // them (a column absent from ALL_COLUMNS is never touched and therefore
    // stays visible in every mode - that is how 'Original Quantity' leaked).
    var EXTRA_HIDDEN = ["OrigQty", "FsrStatus"];

    var ALL_COLUMNS = (function () {
        var seen = {}, all = [];
        Object.keys(MODE_COLUMNS).forEach(function (sMode) {
            MODE_COLUMNS[sMode].forEach(function (sKey) {
                if (!seen[sKey]) { seen[sKey] = true; all.push(sKey); }
            });
        });
        EXTRA_HIDDEN.forEach(function (sKey) {
            if (!seen[sKey]) { seen[sKey] = true; all.push(sKey); }
        });
        return all;
    })();

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
                this._setupDisplayLogs();
                this._applyModeVisibility();
                // Initial apply, plus one deferred forced re-assert once the
                // table and any saved variant have settled.
                this._applyModeColumns(true);
                var that = this;
                setTimeout(function () { that._applyModeColumns(true); }, 1500);
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
                // Apply columns only when the mode changed (guarded inside), then
                // ONE deferred forced re-assert to beat a late variant apply.
                // Deliberately NOT re-applied on every data load - that thrashed
                // the MDC columns and produced rows with blank cells.
                that._applyModeColumns();
                setTimeout(function () { that._applyModeColumns(true); }, 1200);
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
         * MUST use the MDC p13n STATE ENGINE, not Column.setVisible(): on an
         * sap.ui.mdc.Table, setVisible(false) only suppresses the header label
         * of the OUTER MDC column - the INNER sap.m.Column keeps rendering the
         * data cell, so the column is not actually removed. That produced the
         * "value under a blank header" artifact (e.g. StatusId 804090 in Tour
         * mode) and meant the mode filtering never really took effect.
         *
         * StateUtil.applyExternalState removes the inner column properly, keeps
         * the personalization dialog in sync, and persists into the variant.
         * A setVisible fallback is kept only for runtimes without StateUtil.
         */
        _applyModeColumns: function (bForce) {
            var oTable = this._oTable;
            if (!oTable || !oTable.getColumns) {
                return;
            }
            var sMode = this._getCurrentMode();
            // GUARD: only touch the columns when the mode actually changed since
            // the last apply. Re-running StateUtil on every data load / paging /
            // scroll (which do NOT change the mode) thrashes the MDC column
            // personalization and can corrupt the cell bindings - that is what
            // showed rows with blank cells. `bForce` allows one deliberate
            // re-assert after a mode change (to beat a late variant apply).
            if (!bForce && this._sAppliedColMode === sMode) {
                return;
            }
            this._sAppliedColMode = sMode;

            var aAllowed = MODE_COLUMNS[sMode];
            // Unknown / not-yet-selected mode: show everything (never hide down
            // to a few header columns - the "half a page" symptom).
            if (!aAllowed || !aAllowed.length) {
                aAllowed = ALL_COLUMNS;
            }
            var oAllowedSet = {};
            aAllowed.forEach(function (sKey) { oAllowedSet[sKey] = true; });

            // Desired state from the FULL key union (so hidden mode columns can
            // be ADDED). The mode's own columns come FIRST, in mode order, so
            // the relevant columns (Customer, Attrib. 4, Sales Doc ...) are up
            // front and visible instead of scrolled off behind the shared
            // header columns. Everything else is appended hidden. This DOES
            // reorder, but it now runs ONLY on a real mode change (see the guard
            // above) - not on every data load - so it no longer thrashes the
            // table into blank cells.
            var aItems = [];
            aAllowed.forEach(function (sKey) {
                aItems.push({ key: sKey, visible: true });
            });
            ALL_COLUMNS.forEach(function (sKey) {
                if (!oAllowedSet[sKey]) {
                    aItems.push({ key: sKey, visible: false });
                }
            });

            sap.ui.require(
                ["sap/ui/mdc/p13n/StateUtil"],
                function (StateUtil) {
                    try {
                        var oApply = StateUtil.applyExternalState(oTable, { items: aItems });
                        if (oApply && oApply.catch) {
                            oApply.catch(function () { /* ignore */ });
                        }
                    } catch (e) { /* ignore */ }
                },
                function () {
                    // Runtime without StateUtil: best-effort setVisible on the
                    // columns that do exist.
                    oTable.getColumns().forEach(function (oColumn) {
                        var sKey = (oColumn.getPropertyKey && oColumn.getPropertyKey()) ||
                                   (oColumn.getDataProperty && oColumn.getDataProperty()) || "";
                        if (!sKey) { return; }
                        var bVisible = !!oAllowedSet[sKey];
                        if (oColumn.getVisible && oColumn.setVisible && oColumn.getVisible() !== bVisible) {
                            oColumn.setVisible(bVisible);
                        }
                    });
                }
            );
            // Give short-code columns a minimum width so their value does not
            // wrap onto two lines (e.g. Plant "JWMR" -> "JWM/R").
            var that = this;
            setTimeout(function () { that._fixColumnWidths(); }, 400);
        },

        /**
         * Set a comfortable minimum width on a few short-code columns so their
         * values stay on one line. Guarded - any MDC API difference is ignored.
         */
        _fixColumnWidths: function () {
            var oTable = this._oTable;
            if (!oTable || !oTable.getColumns) {
                return;
            }
            var oWidth = { "Plant": "6rem", "Route": "6rem", "StatusId": "7rem" };
            try {
                oTable.getColumns().forEach(function (oColumn) {
                    var sKey = (oColumn.getPropertyKey && oColumn.getPropertyKey()) ||
                               (oColumn.getDataProperty && oColumn.getDataProperty()) || "";
                    if (oWidth[sKey] && oColumn.setWidth && oColumn.getWidth &&
                        oColumn.getWidth() !== oWidth[sKey]) {
                        oColumn.setWidth(oWidth[sKey]);
                    }
                });
            } catch (e) { /* ignore */ }
        },

        /* =================================================================
         * "Display Logs" (classic report document hotspot -> application log)
         * -----------------------------------------------------------------
         * IMPORTANT: this is wired up entirely in JS (button added to the MDC
         * table toolbar here), NOT via a manifest custom action. A manifest
         * action "press" is a MODULE PATH that FE loads as a plain module
         * (".js"); pointing it at anything under ext/controller made FE try to
         * load "...ListReportExt.js" (a controller is ".controller.js"), which
         * 404'd with "script load error" and ALSO aborted this controller
         * extension (so the per-mode column hiding stopped, leaving blank
         * headers). Doing it here - the press handler is a JS function, never a
         * module path - makes that failure impossible.
         * ================================================================= */

        /**
         * Enable row selection and add a "Display Logs" button to the table
         * toolbar. Fully guarded: any MDC API difference just skips the button,
         * never breaks the controller.
         */
        _setupDisplayLogs: function () {
            var that = this;
            var oTable = this._oTable;
            if (!oTable || oTable.__logBtnDone) {
                return;
            }
            // Need row selection so the user can pick a row for its log.
            try {
                if (oTable.getSelectionMode && oTable.setSelectionMode &&
                    oTable.getSelectionMode() === "None") {
                    oTable.setSelectionMode("Multi");
                }
            } catch (e) { /* ignore */ }

            sap.ui.require([
                "sap/m/Button", "sap/ui/mdc/actiontoolbar/ActionToolbarAction"
            ], function (Button, ActionToolbarAction) {
                try {
                    var oBtn = new Button({
                        text: "Display Logs",
                        press: function () { that._onDisplayLogs(); }
                    });
                    var bAdded = false;
                    if (ActionToolbarAction && oTable.addAction) {
                        try {
                            oTable.addAction(new ActionToolbarAction({ action: oBtn }));
                            bAdded = true;
                        } catch (e1) { bAdded = false; }
                    }
                    if (!bAdded && oTable.addAction) {
                        try { oTable.addAction(oBtn); bAdded = true; } catch (e2) { bAdded = false; }
                    }
                    if (bAdded) {
                        oTable.__logBtnDone = true;
                    }
                } catch (e) { /* leave table as-is */ }
            });
        },

        /**
         * Open the application log of the selected row's tour.
         */
        _onDisplayLogs: function () {
            var aSel = [];
            try {
                aSel = (this._oTable && this._oTable.getSelectedContexts &&
                        this._oTable.getSelectedContexts()) || [];
            } catch (e) { aSel = []; }
            if (!aSel.length) {
                this._toast("Select a row first (tick the checkbox), then press Display Logs.");
                return;
            }
            // The application log is per document/tour. If several rows are
            // ticked, ask for exactly one instead of silently showing only the
            // first row's log.
            if (aSel.length > 1) {
                this._toast("Please select only ONE row to display its application log.");
                return;
            }
            var oCtx = aSel[0];
            // Read the tour id. The TourId column is often hidden per mode, and
            // FE only $selects VISIBLE columns, so getProperty("TourId") can be
            // empty. The RowKey is the entity KEY (always fetched) and encodes
            // the tour: "{mode}~{tour}~{visit}~{sld}~{material}~{delivery}~{ship}".
            var sTour = "";
            try { sTour = oCtx.getProperty("TourId") || ""; } catch (e2) { sTour = ""; }
            var sShip = "";
            try { sShip = oCtx.getProperty("ShipmentNo") || ""; } catch (e3) { sShip = ""; }
            if (!sTour || !sShip) {
                var sKey = "";
                try { sKey = oCtx.getProperty("RowKey") || ""; } catch (e4) { sKey = ""; }
                var aParts = sKey.split("~");
                if (!sTour && aParts.length >= 2) { sTour = aParts[1] || ""; }
                if (!sShip && aParts.length >= 7) { sShip = aParts[6] || ""; }
            }
            if (!sTour) {
                this._toast("This row has no Tour ID, so it has no application log.");
                return;
            }
            this._openLogDialog(sTour, oCtx.getModel(), sShip);
        },

        /**
         * Build (once) and open the log dialog, then load the data.
         * @param {string} sTour tour id
         * @param {sap.ui.model.odata.v4.ODataModel} oModel the OData model
         */
        _openLogDialog: function (sTour, oModel, sShip) {
            var that = this;
            if (!oModel || !oModel.bindList) {
                this._toast("OData model not available.");
                return;
            }
            sap.ui.require([
                "sap/m/Dialog", "sap/m/Button", "sap/m/Table", "sap/m/Column",
                "sap/m/ColumnListItem", "sap/m/Text", "sap/m/ObjectStatus", "sap/m/Label",
                "sap/ui/model/Filter", "sap/ui/model/FilterOperator",
                "sap/ui/model/json/JSONModel", "sap/ui/core/library"
            ], function (Dialog, Button, Table, Column, ColumnListItem, Text,
                         ObjectStatus, Label, Filter, FilterOperator, JSONModel, coreLib) {
                try {
                    var ValueState = coreLib.ValueState;
                    if (!that._oLogDialog) {
                        var oLogTable = new Table({
                            inset: false,
                            growing: true,
                            growingThreshold: 500,
                            columns: [
                                new Column({ width: "6rem", header: new Label({ text: "Type" }) }),
                                new Column({ header: new Label({ text: "Message Text" }) })
                            ]
                        });
                        oLogTable.bindItems({
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
                        that._oLogTable = oLogTable;
                        that._oLogDialog = new Dialog({
                            title: "Application Log",
                            contentWidth: "44rem",
                            contentHeight: "34rem",
                            resizable: true,
                            draggable: true,
                            content: [oLogTable],
                            endButton: new Button({
                                text: "Close",
                                press: function () { that._oLogDialog.close(); }
                            })
                        });
                        that.base.getView().addDependent(that._oLogDialog);
                    }
                    that._oLogDialog.setTitle("Application Log - Visit List " + (sShip || sTour));
                    that._oLogDialog.setBusy(true);
                    that._oLogDialog.open();

                    var oLB = oModel.bindList("/SettlementLog", null, null, [
                        new Filter("TourId", FilterOperator.EQ, sTour)
                    ], { $count: true });
                    oLB.requestContexts(0, 2000).then(function (aContexts) {
                        var aRows = aContexts.map(function (c) { return c.getObject(); });
                        that._oLogTable.setModel(new JSONModel(aRows), "logModel");
                        that._oLogDialog.setBusy(false);
                        if (!aRows.length) {
                            that._toast("No application log found for this tour.");
                        }
                    }).catch(function () {
                        that._oLogDialog.setBusy(false);
                        that._toast("Could not read the application log.");
                    });
                } catch (e) {
                    that._toast("Could not open the log dialog.");
                }
            });
        },

        /**
         * Small non-blocking message.
         * @param {string} sMsg text
         */
        _toast: function (sMsg) {
            sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
                try { MessageToast.show(sMsg); } catch (e) { /* ignore */ }
            });
        }
    });
});
