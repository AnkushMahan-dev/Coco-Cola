# ZVERSION_COMPARE

ECC 6.x compatible ABAP report that compares the version of repository objects
between two systems (a **source** and a **target**), each reached through its
own **RFC destination** – using only the standard remote-enabled module
`RFC_READ_TABLE` (no custom function module needs to be created in the target
system).

## Selection screen

| Field | Type | Notes |
|-------|------|-------|
| Object Type (`S_OBJECT`) | Select-option, **no interval** | Single values only (no low/high range). Filters `TADIR-OBJECT`. |
| Object Name (`S_OBJNAM`) | Select-option, **no interval** | **Mandatory** – the mandatory check is raised in `START-OF-SELECTION` (not via `OBLIGATORY`). |
| Source RFC Destination (`P_SRFC`) | Parameter, obligatory, default `NONE` | RFC destination of the **source** system. `NONE` = the local logon system. |
| Target RFC Destination (`P_TRFC`) | Parameter, obligatory | RFC destination of the **target** system. |

## How the comparison works

1. The mandatory check for **Object Name** runs in `START-OF-SELECTION`.
2. Objects are read from **TADIR** (`PGMID = 'R3TR'`, not deleted).
3. The TADIR (R3TR) object type is mapped to its version-management object type
   in `F_MAP_VRSD_TYPE` (e.g. `PROG` &rarr; `REPS`, `TABL` &rarr; `TABD`).
4. An object can be made of several version-managed **components**. For a
   program these are the **source code** (VRSD type `REPS`) and the
   **text elements / text pool** (VRSD type `REPT`).
5. For each component and each system the version directory table **`VRSD`** is
   read directly with **`RFC_READ_TABLE`** (`DESTINATION p_srfc` /
   `DESTINATION p_trfc`), and the **latest** entry (by date / time / version
   number) is taken. The **latest transport request (`KORRNUM`)** is the
   cross-system key.
6. The object is flagged **mismatched if ANY component differs**, and the
   Remarks name which component(s) differ:

   | Condition | Mismatch | Remarks |
   |-----------|----------|---------|
   | Object type not mapped for compare | *(blank)* | Object type not mapped for version compare |
   | A component's latest request differs | `YES` | Difference in: Source / Text elements / Source, Text elements |
   | All components identical | `NO` | Identical in both systems |
   | Object present in target, none in source | `YES` | No version history in Source - present in Target |
   | Object present in source, none in target | `YES` | No version history in Target - present in Source |
   | No version history in either | `NO` | No version history in either system |

   So a program whose **text elements** changed (but not its source) is now
   reported as `Mismatch = YES` with `Remarks = Difference in: Text elements`.

> **Why `VRSD` directly?** An earlier attempt used
> `SVRS_GET_VERSION_DIRECTORY_46`, which prepends a blank "active version" entry
> – making both systems look blank/equal (false match). Reading `VRSD` directly
> returns only the real numbered version entries. Version management stamps the
> **same transport request number in both systems on import**, so the latest
> `KORRNUM` is a reliable cross-system key. (An earlier source-comparison
> attempt used `RPY_PROGRAM_READ`, which is **not** remote-enabled and failed
> over RFC; `RFC_READ_TABLE` is remote-enabled and ships with every system.)

## Output

A standard ALV grid (`REUSE_ALV_GRID_DISPLAY`) with the columns:

* Object Type, Object Name
* Source Request, Source Version, Source Date, Source Author
* Target Request, Target Version, Target Date, Target Author
* Mismatch (`YES` / `NO`)
* Remarks (reason behind the flag)

The standard ALV toolbar provides filter, sort, download to spreadsheet /
local file, layout management and print.

## Prerequisites & notes

* The **target** RFC destination's user needs read authorisation for
  `RFC_READ_TABLE` on table `VRSD` (`S_RFC` + `S_TABU_DIS`/`S_TABU_NAM`).
* **Version logging on import** must be active in both systems (standard for
  QA / production) so that imported changes create `VRSD` entries carrying the
  original transport request.
* Object-type coverage is driven by `F_MAP_VRSD_TYPE`. Mapped today: `PROG`,
  `TABL`, `VIEW`, `DTEL`, `DOMA`, `SHLP`, `TTYP`, `ENQU`, `MSAG`. Composite
  objects (function groups, classes) version their parts under structured names
  and need dedicated handling – add them to the `CASE` when required.
