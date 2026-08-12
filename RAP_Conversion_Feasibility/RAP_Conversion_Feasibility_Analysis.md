# RAP Conversion Feasibility — `/CCBJI/RDSDFSVG_STLMNT_DETAILS` (Settlement Details)

## Verdict

**YES — this ABAP report can be converted to a RAP application**, with the same
business requirement, the same output data, and the same validations preserved.

It converts as **RAP Pattern B (read-only custom entity + ABAP query
implementation class)** — *not* the simple "read straight from released CDS
views" Pattern A — because the report's rows are produced by ABAP runtime logic
(function modules, conversions, computed statuses) that CDS alone cannot express.

## What the program is

| Attribute | Finding |
|-----------|---------|
| Type | Executable `REPORT` with TOP / SEL / SUB includes |
| Purpose | Displays DSD route **Settlement Details** in **8 modes** (radio buttons): Tour, Visit, Sales/Replenishment, Payment, Check-out/in, Money diff, Quantity diff, FSR docs, Cash diff |
| Output | Read-only **SALV ALV** grids (`cl_salv_table`) |
| DB writes | **None** — 0 `INSERT/UPDATE/MODIFY` on DB, 0 `COMMIT WORK` → pure reporting |
| Logic | ~75 FORM routines, ~120 SELECTs over ~30 tables (VTTK, VBAK, LIKP, VBRK, BKPF, KNA1, BSEG + custom `/DSD/*`, `/CCEJ/*`) |
| Function modules | `RV_ORDER_FLOW_INFORMATION`, `SD_VBFA_READ_WITH_VBELV`, `FI_DOCUMENT_READ`, `/DSD/ST_APPLOG_VIEW`, `BAPI_CURRENCY_CONV_TO_EXTERNAL`, `ISU_DATE_TIME_CONVERT_TIMEZONE`, `HR_99S_INTERVAL_BETWEEN_DATES`, `DD_DOMVALUES_GET`, `F4IF_INT_TABLE_VALUE_REQUEST` |
| Interactivity | ALV hotspot / double-click drilldown → `CALL TRANSACTION` (VA03/VL03N/FB03…) via `SET PARAMETER ID` |

## Why it is convertible (business requirement / output / validation preserved)

Because the report **only reads and displays** data, there is no CRUD, no
locking, and no draft to reproduce. The existing ABAP that builds each row —
the SELECTs, the FM calls, the traffic-light computation, the Japan-timezone
conversion, the dummy-account check, the order-flow reconstruction, and every
validation (`f_validation`, `f_validate_data`) — is **reused unchanged inside a
RAP query provider class**. The framework changes the *delivery* (ALV → OData V4
→ Fiori Elements List Report); it does not change *what data comes out* or *which
checks run*. Same inputs → same rows → same validations.

## Why it is Pattern B, not Pattern A

Pattern A requires every column to come from released CDS views by
join/association/calculation. This report cannot: it calls BAPIs/FMs at runtime,
does currency and time-zone conversion, and derives computed status
(traffic-light) columns. That logic must *run* to produce a row → that is
Pattern B (custom entity `@ObjectModel.query.implementedBy: 'ABAP:ZCL_*_QRY'`
implementing `IF_RAP_QUERY_PROVIDER`), which lets the existing ABAP execute
inside the query class while RAP handles the OData/Fiori exposure.

## Target RAP stack (per mode)

1. **Custom entity** `ZI_STLMNT_<Mode>` — explicitly typed fields matching the
   current ALV field catalog (same fields, same labels).
2. **Query class** `ZCL_STLMNT_<Mode>_QRY` (`IF_RAP_QUERY_PROVIDER`) — hosts the
   reused SELECT + FM logic; honours filters/paging/sorting from `io_request`.
3. **Projection view** `ZC_STLMNT_<Mode>` + **metadata extension** (@UI.lineItem
   / @UI.selectionField mirroring the current selection screen).
4. **Service definition** `ZSD_*` → **service binding** `ZSB_*` (ODATA_V4_UI).

8 modes → 8 custom entities/services (or one parameterized service), replacing
the single radio-button-driven report.

## Items that change layer (not blockers)

| Classic ABAP | RAP / Fiori equivalent |
|--------------|------------------------|
| Radio-button mode switch + dynamic `MODIF ID` / `MODIFY SCREEN` show-hide | Separate service per mode (or filter), Fiori selection fields |
| ALV hotspot `CALL TRANSACTION` drilldown | Fiori intent-based navigation (IBN) / external navigation |
| SALV layout variants | Fiori Elements variant management (built-in) |
| F4 value help FMs | CDS value-help associations / `@Consumption.valueHelpDefinition` |

## Bottom line

**Can it be converted to RAP? Yes.** No change to business requirement, no
change to output data, and the same validations — achieved by wrapping the
existing read logic in a RAP **Pattern B** query implementation class and
exposing it as an OData V4 / Fiori Elements service. The only rework is the
presentation/navigation layer (ALV → Fiori), which is expected in any
ALV-to-Fiori modernization and does not alter the data or the rules.
