# ZVERSION_COMPARE

ECC 6.x compatible ABAP report that compares the active version of repository
objects in the current (development) system against a remote **production**
system reached through an **RFC destination**.

## Selection screen

| Field | Type | Notes |
|-------|------|-------|
| Object Type (`S_OBJECT`) | Select-option, **no interval** | Single values only (no low/high range). Filters `TADIR-OBJECT`. |
| Object Name (`S_OBJNAM`) | Select-option, **no interval** | **Mandatory** – the mandatory check is raised in `START-OF-SELECTION` (not via `OBLIGATORY`), as requested. |
| Source RFC Destination (`P_SRFC`) | Parameter, obligatory | RFC destination of the **source** system (e.g. development). |
| Target RFC Destination (`P_TRFC`) | Parameter, obligatory | RFC destination of the **target** system (e.g. production). |

Both sides are read through an RFC destination, so any two systems can be
compared without hardcoding either one.

## Processing

1. The mandatory check for **Object Name** is performed in `START-OF-SELECTION`.
   If empty, an error message returns the user to the selection screen.
2. Objects are read from **TADIR** (`PGMID = 'R3TR'`, not deleted) for the
   given object type / object name selection.
3. For every object the version directory is read with function module
   `SVRS_GET_VERSION_DIRECTORY_46` via `DESTINATION`:
   * through the source RFC destination (`P_SRFC`) for the **dev** version, and
   * through the target RFC destination (`P_TRFC`) for the **production** version.

   Version management is keyed at **LIMU level**, so the TADIR (R3TR) object
   type is first mapped to its version-management object type(s) in form
   `F_MAP_VERSION_TYPES` (e.g. `PROG` &rarr; `REPS`/`REPT`, `TABL` &rarr;
   `TABD`/`TABT`, `CLAS` &rarr; `CLSD`/`CPUB`/`CPRO`/`CPRI`/`CINC`/`METH`).
   All mapped types are queried and the most recent entry across them is taken
   as the **active version**, identified by its last transport request
   (`KORRNUM`).
4. The **Mismatch** and **Remarks** columns are derived from the last transport
   request, the reliable cross-system key:

   | Condition | Mismatch | Remarks |
   |-----------|----------|---------|
   | Request differs between dev and prod | `YES` | Last transport request differs between Dev and Prod |
   | Request identical in both | `NO` | Last transport request identical in both systems |
   | Version info in dev only | `YES` | Version exists in Dev only - missing in Production |
   | Version info in prod only | `YES` | Version exists in Production only - missing in Dev |
   | No version info in either | `NO` | No version information in either system |

   Timestamps are **not** used for the decision because the production system
   records the *import* time rather than the original save time, which would
   produce false mismatches. The version number, date and author are still
   shown for transparency.

## Output

A standard ALV grid (`REUSE_ALV_GRID_DISPLAY`) with the columns:

* Object Type
* Object Name
* Dev Version, Dev Last Request, Dev Date, Dev Author
* Prod Version, Prod Last Request, Prod Date, Prod Author
* Mismatch (`YES` / `NO`)
* Remarks (reason behind the flag)

The standard ALV toolbar provides filter, sort, download to spreadsheet /
local file, layout management and print.

## Object-type coverage

`F_MAP_VERSION_TYPES` maps the common R3TR object types (programs, function
groups, classes, interfaces and the dictionary objects) to their version
object types. The R3TR type itself is always added as a fallback candidate, so
any type already accepted by the function module keeps working and unmapped
types degrade gracefully to a direct lookup (returning "no version
information" rather than failing). Add further `WHEN` branches to the `CASE`
for custom object types.
* The RFC destination must be a trusted/authorised connection to the production
  system (transaction `SM59`).
