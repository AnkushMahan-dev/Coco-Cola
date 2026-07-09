# ZR_PROG_LINE_COUNTER — Source Code Line Counter

ECC-compatible ABAP report that counts the source-code lines of a main
program and all of its associated includes, and displays the result in a
fully featured ALV grid.

## Files

| File | Description |
|------|-------------|
| `ZR_PROG_LINE_COUNTER.abap` | Executable report (create as a local `$TMP` program via SE38/SE80). |

## Selection screen

- **Program Name / Object Name** — `SELECT-OPTIONS` (`SO_PROG`) with
  `NO INTERVALS`. Only **single values** and **multiple single values**
  are allowed. Interval (`BT`/`NB`) selections are rejected in
  `AT SELECTION-SCREEN`.

## Processing logic

1. Every object entered is read and treated as / resolved to its **main
   program**:
   - If the input is an **include** (`TRDIR-SUBC = 'I'`), its main
     program is resolved by `RESOLVE_MAIN_PROGRAMS`: it first calls
     `RS_GET_MAINPROGRAMS` and, if that function module is unavailable
     or returns nothing, falls back to the standard include-index table
     `D010INC` (`MASTER` / `INCLUDE`). An orphan include with no master
     is reported on its own.
   - A **fan-out guard** (`GC_MAX_MAINPROGRAMS`, default 50) caps how
     many main programs a single shared include is expanded into; the
     excess is logged rather than processed.
   - Otherwise the input is treated directly as the main program.
2. All includes of the main program are retrieved via
   `RS_GET_ALL_INCLUDES`.
3. The complete active source of the main program and of each include is
   read with `READ REPORT`, and its line count is taken with `lines( )`.
4. Rows are de-duplicated so the same object is not counted twice.

## Output (ALV grid — `CL_SALV_TABLE`)

| Main Program | Object Name | Object Type | Number of Lines |
|--------------|-------------|-------------|-----------------|
| Resolved main program | Program / include name | `PROG` / `INCLUDE` | Total source lines |

All standard ALV features are enabled (`set_all`): sorting, multiple
sorting, filtering, layout variants, Excel export, print, find/search,
column hide/show, resizing. A **subtotal per main program** and a **grand
total** of the line count are provided.

## ECC compatibility

- Targets SAP ECC 6.0 (NetWeaver 7.0x+). No S/4HANA-only syntax or
  classes are used.
- Uses standard, ECC-available components: `TRDIR`, `RS_GET_MAINPROGRAMS`,
  `RS_GET_ALL_INCLUDES`, `READ REPORT`, `CL_SALV_TABLE`.

## Error handling

- Program/object not found, no active source, or missing `S_DEVELOP`
  (ACTVT 03) authorization are handled gracefully: the object is skipped
  and logged. The log is written to the list after the ALV is closed.
