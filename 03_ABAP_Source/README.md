# ABAP Source

## `/CCEJ/RUSDSLSR_SO_MAINT` — Sales Order Maintenance Report

Report program that displays Sales Order header and item data in an ALV, with
actions to display/change the sales order, display customer, display material,
and mass-update sales orders (transaction `VA03`; RICEF `OTC-3051-R-01`).

The program is stored as the main report plus its three includes, using
abapGit-style file names:

| File | Object |
|------|--------|
| `zso_maint_pe.prog.abap` | Main report `zso_maint_pe` (INITIALIZATION / AT SELECTION-SCREEN / START/END-OF-SELECTION driver) |
| `zso_maint_top_pe.prog.abap` | `INCLUDE ZSO_MAINT_TOP_PE` — TYPES, constants, global data declarations |
| `zso_maint_sel_pe.prog.abap` | `INCLUDE ZSO_MAINT_SEL_PE` — selection screen |
| `zso_maint_sub_pe.prog.abap` | `INCLUDE ZSO_MAINT_SUB_PE` — subroutines and the `lcl_user_command` ALV event class |

The source carries its full modification log (MOD-001 … MOD-024) in the header
comments of each part. Later MOD entries include S/4HANA remediation notes —
notably MOD-023, which replaces direct `MAKT` / `LIPS` / `VBRP` reads with the
standard CDS interface views `I_ProductDescription`, `I_DeliveryDocumentItem`
and `I_BillingDocumentItem`. As those comments state, the CDS view and field
names are based on the standard SAP Virtual Data Model and should be verified in
SE11/ADT against the target system before transport.
