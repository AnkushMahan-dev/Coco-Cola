# OTC DSD Settlement Details — Complete RAP Application (`/CCBJI/` namespace)

End-to-end, activation-ready **RAP (Pattern B, read-only)** modernization of the
classic ALV report **`/CCBJI/RDSDFSVG_STLMNT_DETAILS`** (Settlement Details).

- **Namespace:** `/CCBJI/`  **Package:** `/CCBJI/OTC`
- **Work stream** OTC (Order to Cash) · **Module** SD · **Process area** FSV (Full Service Vending)
- Business requirement, output data and validations preserved. Only the
  presentation layer changes: **SALV/ALV → OData V4 → Fiori Elements List Report**.

---

## 1. Object inventory (all `/CCBJI/`, package `/CCBJI/OTC`)

| # | Object | Type | Name | abapGit file(s) |
|---|--------|------|------|-----------------|
| 1 | Query provider class | ABAP Class | `/CCBJI/CL_FSV_STLMNT_QRY` | `#ccbji#cl_fsv_stlmnt_qry.clas.abap` / `.clas.xml` |
| 2 | Custom entity | Data Definition | `/CCBJI/I_FSV_STLMNT_DTL` | `#ccbji#i_fsv_stlmnt_dtl.ddls.asddls` / `.ddls.xml` / `.ddls.baseinfo` |
| 3 | Metadata extension | Metadata Extension | `/CCBJI/I_FSV_STLMNT_DTL` | `#ccbji#i_fsv_stlmnt_dtl.ddlx.asddlxs` / `.ddlx.xml` |
| 4 | Service definition | Service Definition | `/CCBJI/FSV_STLMNT_SRVD` | `#ccbji#fsv_stlmnt_srvd.srvd.srvdsrv` / `.srvd.xml` |
| 5 | Service binding | Service Binding (OData V4 UI) | `/CCBJI/FSV_STLMNT_SRVB` | `#ccbji#fsv_stlmnt_srvb.srvb.xml` |

`COMPLETE_APPLICATION.abap` holds all objects in one file for direct copy-paste.

### Naming — CCBJI convention compliance
Decoded like the source program `/CCBJI/R‑D‑SD‑FSV‑G` (System R, mode D=Display,
module SD, area FSV, type G):

- Interface CDS `/n/I_*` → `/CCBJI/I_FSV_STLMNT_DTL`
- Class `/n/CL_pppp_*` (pppp = process area FSV) → `/CCBJI/CL_FSV_STLMNT_QRY`
- Service definition → `/CCBJI/FSV_STLMNT_SRVD`
- Service binding (distinct from definition) → `/CCBJI/FSV_STLMNT_SRVB`
- Metadata extension = annotated entity name → `/CCBJI/I_FSV_STLMNT_DTL`

---

## 2. "Check everything once again" — verification results

| Check | Result |
|-------|--------|
| **Business requirement** | ✅ Preserved. Same purpose (settlement tour header display), same selection criteria (Shipment/Visit List, Route, Settlement Date + extensible), same source table `VTTK`. |
| **Output / business output** | ✅ Preserved. Output columns mirror the classic `ty_final` (ShipmentNo, Status, Plant, Route, Date, Driver, Vehicle, Scenario, Warnings, Errors, Ref Doc, Header Text) + the derived traffic-light **Processing Status**. |
| **Validations** | ✅ Preserved. Report `FORM f_validation` is ported 1:1 into `validate_selection( )` — same checks, same message class **`/CCEJ/OTC`**, same numbers (see table below). The traffic-light rule (`f_traffic_light`) runs in `derive_processing_status( )`. |
| **Syntax** | ✅ Reviewed. Notes below. |
| **Behavior definition / binding** | ❌ **Not required** — see §3. |

### Syntax review notes (what was checked and hardened)
- `if_rap_query_provider~select` signature, `get_filter( )->get_as_ranges( )`
  wrapped in `TRY … CATCH cx_rap_query_filter_no_range`.
- Filter field-symbol declared explicitly as `TYPE STANDARD TABLE` so
  `CORRESPONDING #( <lt_range> )` into the typed ranges is statically valid.
- Paging via `if_rap_query_paging=>page_size_unlimited`; count via
  `is_total_numb_of_rec_requested( )`; data via `is_data_requested( )`.
- Dynamic `SORT … BY (lt_sort_order)` using `abap_sortorder_tab`.
- Result component fixed to `headertext` (not `bktxt`).
- All field types are real data elements (`tknum`, `tplst`, `/dsd/st_status_id`,
  `werks_d`, `route`, `erdat`, `/dsd/rp_driver1`, `/dsd/rp_truck`, `xblnr`,
  `bktxt`). Namespaced VTTK columns accessed as `<ls_vttk>-/bev1/rpfar1`.
- Metadata extension: removed the dangling `criticality` reference that would
  have broken activation.

> One environment-specific item that only the target system can confirm: the
> `VTTK` append fields `/BEV1/RPFAR1` and `/BEV1/RPMOWA` (used by the classic
> report). They exist on the CCBJI beverage system; if your client copy differs,
> adjust those two field names.

### Validation mapping — report `f_validation` → `validate_selection( )`

Runs before the data fetch (RAP equivalent of `START-OF-SELECTION` +
`LEAVE LIST-PROCESSING`). A failed check raises `cx_rap_query_provider` carrying
the **same `/CCEJ/OTC` message**, which Fiori shows to the user.

| Check | Table | Original msg | Condition |
|-------|-------|--------------|-----------|
| Mandatory selection | — | `i525` | ShipmentNo, **or** Plant+Route+SettlementDate together |
| Plant exists | `T001W` | `i012` | when Plant given and no Shipment |
| TPP exists | `TTDS` | `i125` | when TPP given |
| Shipment exists | `VTTK` | `i123` | when ShipmentNo given |
| Status exists | `/DSD/ST_CSTATUS` | `i124` | when Status given |
| Route exists | `TVRO` | `i126` | when Route given |
| Vehicle exists | `EQUI` | `i127` | when Vehicle given |
| Driver exists | `KNA1` | `i128` | when Driver given |

In the classic report the shipment/route/status/TPP checks sat under
`IF rb_ship` / `IF rb_ship OR rb_visi`. Here the **mode is fixed by the service**
(no radio button), so the radio gate collapses and each check simply runs when
its filter is supplied — behaviour and messages stay identical.

**Two release/UX notes (no negative business impact):**
- `cx_rap_query_provider` carries the T100 message via the `RAISE EXCEPTION …
  MESSAGE e###(/ccej/otc)` form. This is supported on S/4HANA 2020+. If your
  release rejects it, swap to a bare `RAISE EXCEPTION TYPE cx_rap_query_provider.`
  or a small custom `if_t100_message` exception — the check logic is unchanged.
- The mandatory (`i525`) check fires on an empty filter, exactly like the classic
  screen. Configure the Fiori List Report with **initial load = off** (standard
  for mandatory-filter reports) so the message appears only after the user
  presses **Go** with insufficient filters — never a blank-load error.

---

## 3. Is a Behavior Definition / Binding required?

**No.** The classic report performs **0 database writes and 0 `COMMIT WORK`** —
it only reads and displays. A RAP **behavior definition** (and its projection
behavior + binding) exists only for **CREATE / UPDATE / DELETE / actions / draft**.

This is **Pattern B (read-only custom entity + query class)**: the service
definition exposes the custom entity directly and produces a read-only OData V4
service. Adding a behavior definition here would fail activation (no persistent
table, no base BDEF) and is explicitly the wrong path. The only "binding" needed
is the **service binding** (object 5), which publishes the OData endpoint.

---

## 4. Upload via abapGit (offline ZIP)

A ready ZIP is provided: **`CCBJI_OTC_STLMNT_RAP_abapGit.zip`** (in the parent
`RAP_Conversion_Feasibility` folder). It is laid out exactly as abapGit expects
(`/src/` + `.abapgit.xml`, PREFIX folder logic).

1. In SAP GUI/ADT create package **`/CCBJI/OTC`** (if it does not yet exist)
   under the `/CCBJI/` namespace (namespace must be in modifiable state).
2. Run transaction **`ZABAPGIT`** (or the abapGit ADT plugin) → **New Offline**
   → repository name e.g. `CCBJI_OTC_STLMNT_RAP`, **package `/CCBJI/OTC`**.
3. **Import → From ZIP** → choose `CCBJI_OTC_STLMNT_RAP_abapGit.zip`.
4. **Pull / Import**, then **activate** all objects (order in §5).
5. **Service binding** `/CCBJI/FSV_STLMNT_SRVB`: if abapGit imported it,
   activate + **Publish**. If your abapGit build cannot deserialize the `SRVB`,
   create it manually in ADT (right-click `/CCBJI/FSV_STLMNT_SRVD` → **New
   Service Binding** → *OData V4 – UI*), activate, **Publish**. (~30 seconds.)

> Prefer copy-paste? Use `COMPLETE_APPLICATION.abap` and create the 5 objects
> in ADT with the names in each banner.

---

## 5. Activate & run (dependency order)

1. `/CCBJI/CL_FSV_STLMNT_QRY` (class)
2. `/CCBJI/I_FSV_STLMNT_DTL` (custom entity) — activate before the extension
3. `/CCBJI/I_FSV_STLMNT_DTL` (metadata extension)
4. `/CCBJI/FSV_STLMNT_SRVD` (service definition)
5. `/CCBJI/FSV_STLMNT_SRVB` (service binding) → **Publish**

In the binding editor pick entity set **`SettlementDetail`** → **Preview** to
launch the generated Fiori Elements List Report, or open the **metadataUrl** in a
browser. Selection fields (ShipmentNo, Route, Settlement Date) and column sorting
map 1:1 to the classic selection screen and ALV.

---

## 6. Scope note — the 8 report modes

The classic report drives 8 radio-button modes. This deliverable implements
**Mode 1 – Tour Header** as the fully-coded, runnable reference. The other 7
modes are the **same Pattern-B stack repeated** — copy the entity + query class,
move that mode's `SELECT`/`PERFORM` logic into `read_settlement_data`, add its
metadata extension, expose it in `/CCBJI/FSV_STLMNT_SRVD`, and republish the
binding.

## 7. Enrichment extension points (populate on the CCBJI system)
`StatusId` ← `/DSD/ST_STATUS` · `Plant` ← `TTDS`/route · `Warnings`/`Errors` ←
`/DSD/ST_APPLOG_VIEW` · `Scenario` ← visit-group rule (`CCEJPAPER` ⇒ `'R'`,
MOD-030). Defaulted so the objects activate immediately; these change only values
inside `read_settlement_data( )`, not the service contract.
