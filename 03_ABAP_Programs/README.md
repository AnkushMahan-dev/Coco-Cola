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

## Prerequisite – create the remote-enabled helper module

The report fetches each program's active source through a small
**remote-enabled** function module, **`Z_VERCMP_GET_SOURCE`**
(see `Z_VERCMP_GET_SOURCE.abap`). Create it in SE37 as a *Remote-Enabled
Module* in **both** the local system and every remote target system (e.g.
`QJR`). Standard source readers such as `RPY_PROGRAM_READ` are **not**
remote-enabled, so they fail when called with `DESTINATION` (this was the cause
of the earlier empty / "does not exist" results). The helper wraps
`READ REPORT`, which works for namespaced programs (`/CCBJI/...`).

## How the comparison works

The active version is compared by its **actual source code** – the same signal
the standard *Compare Programs: Differences* tool uses.

> Why not the transport request? An earlier approach compared the last
> transport request (`KORRNUM`) from the version directory
> (`SVRS_GET_VERSION_DIRECTORY_46`). That directory returns the **numbered
> historical** versions, not the **active** version, and the active version
> frequently carries **no transport request** at all – producing a false
> "identical" verdict. Comparing the active source avoids this entirely.

1. The mandatory check for **Object Name** runs in `START-OF-SELECTION`.
2. Objects are read from **TADIR** (`PGMID = 'R3TR'`, not deleted).
3. For every object the active source + last-changed data is read from both
   systems by calling `Z_VERCMP_GET_SOURCE` with `DESTINATION p_srfc` /
   `DESTINATION p_trfc` (`NONE` = local logon system).
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

To extend coverage, add the read logic for the type inside the helper module
`Z_VERCMP_GET_SOURCE` and a matching `WHEN` branch in `F_READ_SOURCE`:

| Object type | Read logic to add in the helper |
|-------------|---------------------------------|
| Function module | read the function include source (`READ REPORT` of the FUNCTION-POOL include) |
| Class / methods | serialize the class source (`SEO_*` / class include reads) |
| DDIC objects (tables, data elements, …) | structural compare (definitions are not "source") |

## Notes

* The RFC destinations must be trusted / authorised connections (`SM59`).
* `Z_VERCMP_GET_SOURCE` must exist in the local system (so the call compiles)
  **and** in every remote target system (so it executes there). `NONE` runs it
  in the local logon system.
