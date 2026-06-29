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
4. The number of version entries returned per system is used as the comparable
   version figure. When the two figures differ the **Mismatch** column is set
   to `YES`, otherwise `NO`.

## Output

A standard ALV grid (`REUSE_ALV_GRID_DISPLAY`) with the columns:

* Object Type
* Object Name
* Dev Version
* Production Version
* Mismatch (`YES` / `NO`)

The standard ALV toolbar provides filter, sort, download to spreadsheet /
local file, layout management and print.

## Assumptions / notes

* The "version" figure compared between the systems is the count of entries in
  the version directory. For object types that are versioned at LIMU level a
  type mapping can be added in form `F_GET_VERSION_COUNT`.
* The RFC destination must be a trusted/authorised connection to the production
  system (transaction `SM59`).
