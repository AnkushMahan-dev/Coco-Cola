# ZVERSION_COMPARE

ECC 6.x compatible ABAP report that compares the active version of repository
objects in the current (development) system against a remote **production**
system reached through an **RFC destination**.

## Selection screen

| Field | Type | Notes |
|-------|------|-------|
| Object Type (`S_OBJECT`) | Select-option, **no interval** | Single values only (no low/high range). Filters `TADIR-OBJECT`. |
| Object Name (`S_OBJNAM`) | Select-option, **no interval** | **Mandatory** – the mandatory check is raised in `START-OF-SELECTION` (not via `OBLIGATORY`), as requested. |
| RFC Destination (`P_RFC`) | Parameter, obligatory | Points to the production system used for the remote version lookup. |

## Processing

1. The mandatory check for **Object Name** is performed in `START-OF-SELECTION`.
   If empty, an error message returns the user to the selection screen.
2. Objects are read from **TADIR** (`PGMID = 'R3TR'`, not deleted) for the
   given object type / object name selection.
3. For every object the version directory is read with function module
   `SVRS_GET_VERSION_DIRECTORY_46`:
   * locally for the **development** version, and
   * via the RFC destination (`DESTINATION p_rfc`) for the **production** version.

   The active (latest) version of each object is identified by the **last
   transport request (`KORRNUM`)** stamped by version management.
4. The **Mismatch** column is derived from the last transport request, the
   reliable cross-system key:
   * request differs between the two systems &rarr; `YES`
   * request identical in both systems &rarr; `NO`
   * version info present in only one system &rarr; `YES`
   * no version info in either system &rarr; `NO`

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

The standard ALV toolbar provides filter, sort, download to spreadsheet /
local file, layout management and print.

## Assumptions / notes

* The active version is identified by the last transport request (`KORRNUM`)
  recorded in the version directory. For object types that are versioned at
  LIMU level a type mapping can be added in form `F_GET_ACTIVE_VERSION`.
* The RFC destination must be a trusted/authorised connection to the production
  system (transaction `SM59`).
