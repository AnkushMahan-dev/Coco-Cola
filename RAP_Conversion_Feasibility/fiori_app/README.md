# OTC DSD Settlement Details — Fiori Elements V4 App (Option C)

Front-end for the RAP service `/CCBJI/FSV_STLMNT_SRVB`. It is a standard
Fiori Elements V4 **List Report**, plus a **controller extension** that
reproduces the classic report's behaviour: *show all filters, then hide the
ones that don't belong to the selected Report Mode.*

```
fiori_app/
└── webapp/
    ├── Component.js                     # sap.fe.core.AppComponent subclass
    ├── manifest.json                    # FE V4 List Report + extension registration
    ├── index.html                       # standalone launcher (dev/test)
    ├── i18n/i18n.properties
    └── ext/controller/
        └── ListReportExt.controller.js  # the Option C show/hide logic
```

## How the per-mode filtering works

1. Every filter is declared **once** as `@UI.selectionField` in the CDS
   metadata extension `/CCBJI/I_FSV_STLMNT_DTL` (`.ddlx.asddlxs`). So the
   filter bar *can* render all of them.
2. On load and whenever the **Report Mode** dropdown changes,
   `ListReportExt.controller.js` reads the selected mode and calls
   `setVisible()` on each MDC `FilterField`, keeping only the fields relevant
   to that mode (plus the always-visible header block: Report Mode, Plant,
   Route, Settlement Date).

### Mode → visible filters matrix (edit in the controller)

| Mode | Code | Extra filters shown (beyond the always-visible header) |
|------|------|--------------------------------------------------------|
| Tour details          | `TOUR` | Shipment, Status, Driver, Vehicle, Tour ID |
| Visit details         | `VISI` | Shipment, Status, Customer, Visit ID, Visit Reason |
| Sales / Replenishment | `SLRP` | Shipment, Status, Customer, Material, Sales Org |
| Payment               | `PAYT` | Shipment, Customer, Payment Method, Currency, Settlement Doc |
| Check-out / Check-in  | `CHCK` | Shipment, Status, Driver, Vehicle, Tour ID |
| Money difference      | `MONY` | Shipment, Customer, Currency, Payment Method |
| Quantity difference   | `QUAN` | Shipment, Customer, Material, Delivery No. |
| FSR documents         | `FSRD` | Shipment, Status, Customer, Settlement Doc, Object Type |
| Cash                  | `CASH` | Shipment, Cash Type, Currency, Driver |

Always visible: **Report Mode, Plant, Route, Settlement Date** (`ALWAYS`
array in the controller). To change any row, edit `MODE_FILTERS` in
`ext/controller/ListReportExt.controller.js` — the field paths are the CDS
element names. To add a brand-new filter, first add it as
`@UI.selectionField` in the metadata extension, then list its path here.

## Deploy options

**A. "Create a SAP Fiori App..." from the ADT service binding** — no BAS needed
- In the ADT Service Binding editor for `/CCBJI/FSV_STLMNT_SRVB_V4`, click
  **Create a SAP Fiori App...**. This launches the SAP Fiori tools
  Application Generator (needs **VS Code + the free "SAP Fiori tools -
  Extension Pack"** installed locally; it does NOT run purely inside Eclipse).
- Template **List Report Object Page** → main entity **`SettlementDetail`**.
  The generator writes a correct, deployable app pre-wired to the service.
- Then add just two things to the generated app (do NOT overwrite the whole
  manifest): copy `ext/controller/ListReportExt.controller.js` into
  `webapp/ext/controller/`, and merge the `sap.ui5.extends` block (see
  manifest.json here) using the generated app's own `sap.app.id`. Update the
  first line of the controller's `.extend("...")` to that same id.
- `npm start` to test, then `npm run deploy` to the ABAP repository as a BSP
  app under package `/CCBJI/OTC`.

  Service URL for reference (binding `/CCBJI/FSV_STLMNT_SRVB_V4`):
  `/sap/opu/odata4/ccbji/fsv_stlmnt_srvb_v4/srvd/ccbji/fsv_stlmnt_srvd/0001/`

**A2. Same generator, from BAS or VS Code directly** (if you prefer)
- Create a new *List Report* project pointing at the service above (entity
  `SettlementDetail`), then add the controller + `extends` block as in A.

**B. Adapt the auto-generated app from the service** (Fiori Elements preview)
- If you launched the app straight from the service binding preview, the app
  is auto-generated and has no extension. Use the *Adaptation Project* /
  *Guided Development → "Extend a controller"* flow to add
  `ListReportExt.controller.js` with the `sap.ui.controllerExtensions` entry
  shown in `manifest.json`.

**C. Local smoke test**
- Serve `webapp/` with any static server behind a proxy that forwards
  `/sap/opu/odata4/...` to your ABAP system, then open `index.html`.

## Backend object that changed for Option C

Only **one** backend object changed to expose the extra filters — re-import
just this one when you update via abapGit:

- `/CCBJI/I_FSV_STLMNT_DTL` **metadata extension** (`.ddlx.asddlxs`) —
  added `@UI.selectionField` for Shipment, Status, Customer, Material,
  Currency, Payment Method, Settlement Doc, Delivery No., Driver, Vehicle,
  Visit ID, Tour ID, Sales Org, Cash Type, Visit Reason, Object Type.

The entity, query class, service definition and binding are unchanged — those
fields were already columns of the custom entity.

## Honest limitations

- **Front-end only.** Hiding a filter does not change what the OData query
  returns. The backend query class already ignores filters irrelevant to a
  mode and never dumps (`TRY … CATCH cx_root`), so a stale hidden filter is
  harmless — but it is not a security/authorization control.
- **MDC FilterBar visibility is not a first-class FE V4 API.** `setVisible()`
  on a `FilterField` is re-applied by the controller on every relevant event,
  which is robust in practice for interactive mode switching; a future SAPUI5
  version could change the internal control tree. If SAP later ships a
  supported per-mode filter API, prefer it.
- **Mandatory filters stay visible.** Plant, Route and Settlement Date are
  mandatory in the CDS, so they are always in the `ALWAYS` set — never hide a
  mandatory filter or the Go/Search action is blocked.
