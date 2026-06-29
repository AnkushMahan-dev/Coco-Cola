# ZVERSION_COMPARE

ECC 6.x compatible ABAP report that compares the **active version** of
repository objects between two systems (a **source** and a **target**), each
reached through its own **RFC destination**.

## Selection screen

| Field | Type | Notes |
|-------|------|-------|
| Object Type (`S_OBJECT`) | Select-option, **no interval** | Single values only (no low/high range). Filters `TADIR-OBJECT`. |
| Object Name (`S_OBJNAM`) | Select-option, **no interval** | **Mandatory** – the mandatory check is raised in `START-OF-SELECTION` (not via `OBLIGATORY`). |
| Source RFC Destination (`P_SRFC`) | Parameter, obligatory, default `NONE` | RFC destination of the **source** system (e.g. development). `NONE` is the self-referencing destination = the local logon system. |
| Target RFC Destination (`P_TRFC`) | Parameter, obligatory | RFC destination of the **target** system (e.g. production). |

Both sides are read through an RFC destination, so any two systems can be
compared without hardcoding either one.

## How the comparison works

The active version is compared by its **actual source code** – the same signal
the standard *Compare Programs: Differences* tool uses.

> Why not the transport request? The earlier version of this report compared
> the last transport request (`KORRNUM`) from the version directory
> (`SVRS_GET_VERSION_DIRECTORY_46`). That directory returns the **numbered
> historical** versions, not the **active** version, and the active version
> frequently carries **no transport request** at all. The result was a false
> "identical" verdict with empty columns. Comparing the active source avoids
> this entirely.

1. The mandatory check for **Object Name** runs in `START-OF-SELECTION`.
2. Objects are read from **TADIR** (`PGMID = 'R3TR'`, not deleted).
3. For every object the active source is read from both systems via RFC
   (`RPY_PROGRAM_READ DESTINATION ...`), together with the last-changed
   date / user from `TRDIR` (via `RFC_READ_TABLE`).
4. The two sources are compared line by line:

   | Condition | Mismatch | Remarks |
   |-----------|----------|---------|
   | Object type not supported for source compare | *(blank)* | Object type not supported - source comparison covers programs (PROG) |
   | Source differs between source and target | `YES` | Active source differs (line counts shown when they differ) |
   | Source identical in both | `NO` | Active source identical in both systems |
   | Object exists in source only | `YES` | Object exists in Source only - missing in Target |
   | Object exists in target only | `YES` | Object exists in Target only - missing in Source |
   | Object missing in both | `NO` | Object does not exist in either system |

## Output

A standard ALV grid (`REUSE_ALV_GRID_DISPLAY`) with the columns:

* Object Type, Object Name
* Source Lines, Source Changed On, Source Changed By
* Target Lines, Target Changed On, Target Changed By
* Mismatch (`YES` / `NO`)
* Remarks (reason behind the flag)

The standard ALV toolbar provides filter, sort, download to spreadsheet /
local file, layout management and print.

## Object-type coverage

Source comparison is implemented for **program objects** (`PROG` – reports and
report includes), which is the dominant custom-code case and matches the
standard program-comparison tool. Other object types are listed in the output
with the remark *"Object type not supported"* rather than producing a
misleading verdict.

To extend coverage, add a reader for the type in form `F_READ_SOURCE`:

| Object type | Reader to add |
|-------------|---------------|
| Function module | `RPY_FUNCTIONMODULE_READ` (read the function source) |
| Class / methods | `SEO_*` reads or `RPY_CLASS_READ` |
| DDIC objects (tables, data elements, …) | structural compare (definitions are not "source") |

## Notes

* The RFC destinations must be trusted / authorised connections (`SM59`).
* `RPY_PROGRAM_READ` and `RFC_READ_TABLE` are both remote-enabled and are
  called with `DESTINATION` for each system (`NONE` runs locally).
