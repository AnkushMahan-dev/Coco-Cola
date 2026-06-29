# ZVERSION_COMPARE

ECC 6.x compatible ABAP report that compares the **active version** of programs
between two systems (a **source** and a **target**), each reached through its
own **RFC destination** – using only the standard remote-enabled module
`RFC_READ_TABLE` (no custom function module in the target system).

## Selection screen

| Field | Type | Notes |
|-------|------|-------|
| Object Type (`S_OBJECT`) | Select-option, **no interval** | Single values only. Filters `TADIR-OBJECT`. |
| Object Name (`S_OBJNAM`) | Select-option, **no interval** | **Mandatory** – checked in `START-OF-SELECTION` (not `OBLIGATORY`). |
| Source RFC Destination (`P_SRFC`) | Parameter, obligatory, default `NONE` | `NONE` = local logon system. |
| Target RFC Destination (`P_TRFC`) | Parameter, obligatory | The remote system. |

## How the comparison works

> **Why not the version directory (`VRSD`)?** The active version is **not** held
> in `VRSD` – that table only holds numbered *historical* snapshots. A target
> system can have **none** of them while the active object exists (confirmed in
> the field: the target showed *"There are no versions in the version
> database"* even though the active code was present). Reading `VRSD` therefore
> reported "missing in Target" incorrectly.

The active version is identified from the source table **`REPOSRC`**
(`R3STATE = 'A'`). Its **last-changed date + author are preserved across
transport** – the target shows the original developer and date, not the import
time – so they are a reliable cross-system key for "is the same version active".

1. Mandatory **Object Name** check in `START-OF-SELECTION`.
2. Objects read from **TADIR** (`PGMID = 'R3TR'`, not deleted).
3. For each system the active source last-changed date / author is read from
   `REPOSRC` with `RFC_READ_TABLE` (`DESTINATION p_srfc` / `DESTINATION p_trfc`).
4. The verdict:

   | Condition | Mismatch | Remarks |
   |-----------|----------|---------|
   | Object type not supported | *(blank)* | active compare covers programs (PROG) |
   | Active last-change differs | `YES` | Active version differs (different last change) |
   | Active last-change identical | `NO` | Active version identical (same last change in both systems) |
   | Program exists in source only | `YES` | Program exists in Source only - missing in Target |
   | Program exists in target only | `YES` | Program exists in Target only - missing in Source |
   | Program missing in both | `NO` | Program does not exist in either system |

## Output

A standard ALV grid (`REUSE_ALV_GRID_DISPLAY`) with the columns:

* Object Type, Object Name
* Source Changed On, Source Changed By
* Target Changed On, Target Changed By
* Mismatch (`YES` / `NO`)
* Remarks

The standard ALV toolbar provides filter, sort, download to spreadsheet /
local file, layout management and print.

## Scope & notes

* Implemented for **programs (`PROG`)** – reports / includes – via `REPOSRC`.
  Other object types are listed with a "not supported" remark (their active
  definitions live in different DDIC tables).
* The **target** RFC destination's user needs read authorisation for
  `RFC_READ_TABLE` on table `REPOSRC` (`S_RFC` + table-read auth).
* The comparison key is the active source last-changed **date + author**. This
  matches what the standard *Versions / Compare Programs* tool shows for the
  active version. A pure line-by-line source diff would additionally require
  reading the source itself, which over RFC needs either a custom remote-enabled
  module (not allowed in the target) or the version-management remote APIs.
