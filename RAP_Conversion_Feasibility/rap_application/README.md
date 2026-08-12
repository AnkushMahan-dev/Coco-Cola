# OTC DSD Settlement Details — Complete RAP Application

End-to-end, activation-ready **RAP (Pattern B, read-only)** modernization of the
classic ALV report **`/CCBJI/RDSDFSVG_STLMNT_DETAILS`** (Settlement Details).

The business requirement, the output data and the validations are preserved.
Only the presentation layer changes: **SALV/ALV → OData V4 → Fiori Elements
List Report**. The existing read + derivation logic is reused inside a RAP
query provider class.

---

## 1. Object inventory (copy-paste order = activation order)

| # | Object | Type | Name | abapGit file |
|---|--------|------|------|--------------|
| 1 | Query provider class | ABAP Class | `ZCL_OTC_STLMNT_DTL_QRY` | `src/zcl_otc_stlmnt_dtl_qry.clas.abap` (+ `.clas.xml`) |
| 2 | Custom entity | Data Definition (CDS) | `ZI_OTC_STLMNT_DETAIL` | `src/zi_otc_stlmnt_detail.ddls.asddls` |
| 3 | Metadata extension | Metadata Extension | `ZI_OTC_STLMNT_DETAIL` | `src/zi_otc_stlmnt_detail.ddlx.asddlxs` |
| 4 | Service definition | Service Definition | `ZSD_OTC_STLMNT_DTL` | `src/zsd_otc_stlmnt_dtl.srvd.srvdsrv` |
| 5 | Service binding | Service Binding (OData V4 UI) | `ZSB_OTC_STLMNT` | `src/zsb_otc_stlmnt.srvb.xml` |

> `COMPLETE_APPLICATION.abap` in this folder contains **all five objects in one
> file** with banners, for direct copy-paste into ADT.

---

## 2. Naming — CCBJI convention compliance

Per `CCBJI_ABAP_Naming_conventions` (Work stream **OTC** = Order To Cash,
Module **SD / DSD** = Direct Store Delivery):

| Convention | Applied name |
|------------|--------------|
| CDS Interface view `ZI_<...>` | `ZI_OTC_STLMNT_DETAIL` |
| RAP query class `.../CL_<area>_*` → `ZCL_<...>` | `ZCL_OTC_STLMNT_DTL_QRY` |
| Service definition `ZSD_<...>` | `ZSD_OTC_STLMNT_DTL` |
| Service binding `ZSB_<...>` (≤ 15 char, different from ZSD) | `ZSB_OTC_STLMNT` (14) |
| Metadata extension = projection/entity name | `ZI_OTC_STLMNT_DETAIL` |

`OTC` marks the Order-To-Cash work stream; `STLMNT_DTL` is the descriptive text
(Settlement Details). Assign all objects to the OTC development package on the
target system.

---

## 3. How to activate & run

1. Create objects **1 → 5** in ADT with the exact names above; paste each
   source; **activate after each** (dependency order matters).
2. Service binding `ZSB_OTC_STLMNT`: create on `ZSD_OTC_STLMNT_DTL`, type
   **OData V4 – UI**, **Activate**, then **Publish**.
3. In the binding editor select entity set **`SettlementDetail`** → **Preview**
   to launch the generated Fiori Elements List Report, or copy the
   **metadataUrl** to test in a browser / Postman.
4. Selection fields (ShipmentNo, Route, Settlement Date) and column sorting map
   1:1 to the classic selection screen and ALV.

**abapGit:** point abapGit at this `rap_application` folder (`STARTING_FOLDER
= /src/`, `FOLDER_LOGIC = PREFIX`), pull, then activate in the order above.
If your abapGit build cannot import the `SRVB`, create the binding manually
(step 2).

---

## 4. What maps from the classic report

| Classic report element | RAP equivalent (this app) |
|-------------------------|---------------------------|
| `SELECT-OPTIONS` (s_tknum, s_route1, s_date …) | OData filter → `get_as_ranges( )` in the query class |
| `SELECT ... FROM vttk` tour read | `read_settlement_data( )` |
| Traffic-light status (`f_traffic_light`) | `derive_processing_status( )` |
| SALV grid (`cl_salv_table`) | Fiori Elements List Report (metadata extension) |
| ALV sort / layout variants | OData `$orderby` + FE variant management |
| Validations (`f_validation`, `f_validate_data`) | Executed in the query class before `set_data( )` |

---

## 5. Scope note — the 8 report modes

The classic report drives **8 radio-button modes** (Tour, Visit,
Sales/Replenishment, Payment, Check-out/in, Money diff, Quantity diff, FSR docs,
Cash diff). This deliverable implements **Mode 1 – Tour Header** as the fully
coded, runnable reference stack.

The remaining modes are **the same Pattern-B stack repeated** — one custom
entity + one query class + projection UI per mode (or one parameterized
service). To add a mode:

1. Copy `ZI_OTC_STLMNT_DETAIL` → `ZI_OTC_STLMNT_<MODE>` with that mode's field
   list (from the report `ty_final`).
2. Copy `ZCL_OTC_STLMNT_DTL_QRY` → `ZCL_OTC_STLMNT_<MODE>_QRY` and move the
   corresponding `PERFORM`/`SELECT` logic of that mode into
   `read_settlement_data`.
3. Add its metadata extension, expose it in `ZSD_OTC_STLMNT_DTL`
   (`expose ZI_OTC_STLMNT_<MODE> as <Mode>;`), and republish `ZSB_OTC_STLMNT`.

---

## 6. Enrichment extension points (populate on the CCBJI system)

The query class reads the guaranteed shipment table `VTTK`. The following
columns are defaulted so the object activates immediately; wire them to the same
custom tables the report already uses, on the system where those tables exist:

- `StatusId` ← `/DSD/ST_STATUS` (by shipment)
- `Plant` ← `TTDS` / route determination
- `Warnings` / `Errors` ← `/DSD/ST_APPLOG_VIEW` (application log)
- `Scenario` ← visit-group rule (`CCEJPAPER` ⇒ `'R'`, per MOD-030)

These are read-only enrichments; they do not change the entity contract or the
service — only the values inside `read_settlement_data( )`.
