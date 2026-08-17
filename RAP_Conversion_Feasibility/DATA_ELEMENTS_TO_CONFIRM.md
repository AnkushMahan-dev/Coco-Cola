# Data elements to confirm — /CCBJI/I_FSV_STLMNT_DTL

For each custom-namespace data element below, please fill in (from **SE11 →
Data Element → Data Type** tab, and its Domain):

- **Type** = CHAR / NUMC / DEC / CURR / QUAN / DATS / TIMS / RAW / INT …
- **Len** = length (and decimals for numeric, e.g. 15,3)
- **Conv** = conversion exit? (e.g. ALPHA) — Yes/No

I currently use the "Safe type now" column so the service always compiles.
Once you give the real values I will switch each field to match exactly.

> Standard SAP data elements (tknum, werks_d, route, erdat, kunnr, vkorg,
> waers, matnr, maktx, belnr_d, bschl, vbeln_vl, bstkd, xblnr, bktxt, vtweg,
> spart, ktokd, katr4, tplst, edi_docnum) are already correct — not listed.

| # | Column (app) | Original data element | Safe type now | Type? | Len? | Conv? |
|---|--------------|-----------------------|---------------|-------|------|-------|
| 1  | Tour ID              | `/dsd/hh_tour_id`     | char(20) |  |  |  |
| 2  | Visit ID             | `/dsd/hh_visit_id`    | char(20) |  |  |  |
| 3  | (Visit List key)     | `/dsd/vc_vlid`        | (internal) |  |  |  |
| 4  | Status               | `/dsd/st_status_id`   | (kept) |  |  |  |
| 5  | Driver               | `/dsd/rp_driver1`     | (kept) |  |  |  |
| 6  | Co-Driver            | `/dsd/rp_driver1`     | (kept) |  |  |  |
| 7  | Driver (visit)       | `/dsd/hh_farnr`       | via /dsd/rp_driver1 |  |  |  |
| 8  | Vehicle              | `/dsd/rp_truck`       | (kept) |  |  |  |
| 9  | Visit Group          | `/dsd/vc_authority`   | (kept) |  |  |  |
| 10 | Visit Reason         | `/dsd/hh_viscod`      | (kept) |  |  |  |
| 11 | Object Type          | `/dsd/hh_del_doctyp`  | (kept) |  |  |  |
| 12 | Unit (UoM)           | `/dsd/hh_uom`         | (kept) |  |  |  |
| 13 | Payment Method       | `/dsd/hh_paymt`       | (kept) |  |  |  |
| 14 | Card Number          | `/dsd/hh_cardnr`      | (kept) |  |  |  |
| 15 | Cash Type            | `/dsd/hh_csh_typ`     | (kept) |  |  |  |
| 16 | Settlement Doc.      | `/dsd/sl_sld_id`      | (kept) |  |  |  |
| 17 | Equipment Owner      | `/scl/mdmd_equp_own`  | char(10) |  |  |  |
| 18 | Processing Indicator | `/dsd/de_man_proc`    | char(1) |  |  |  |
| 19 | Visit Log Status     | `/ccej/sls_vlog_status` | char(1) |  |  |  |
| 20 | Processing Status    | `/dsd/hh_recstat`     | char(1) |  |  |  |
| 21 | Created On           | `/dsd/hh_credate`     | dats |  |  |  |
| 22 | Created Time         | `/dsd/hh_cretime`     | tims |  |  |  |
| 23 | Changed On           | `/dsd/hh_cngdate`     | dats |  |  |  |
| 24 | Changed At           | `/dsd/hh_cngtime`     | tims |  |  |  |
| 25 | Changed By           | `/dsd/hh_changer`     | char(12) |  |  |  |
| 26 | Money difference amt | `/dsd/sl_sld_mbal-amount_diff` | dec(15,2) |  |  |  |
| 27 | Quantity difference  | `/dsd/sl_sld_qbal-quan_final_diff` | dec(15,3) |  |  |  |
| 28 | Quantity             | (check/qty tables)    | dec(15,3) |  |  |  |
| 29 | Amount               | (payment/money)       | dec(15,2) |  |  |  |

## Notes
- Items 4-16 are currently typed with their **original** data element and
  already work (they map fine to OData). Confirm only if you see a wrong value.
- Items 1-2, 17-19 were **already switched to safe char** because their
  original data elements broke OData V4 metadata (Edm.Guid / compile error).
- Numeric fields (26-29): if the original is CURR/QUAN it needs a reference
  currency/unit field to be exact; today I use plain DEC (value is correct,
  just no linked currency/unit key). Tell me the reference field if you want
  the currency/unit link.
