# ZR_PROG_LINE_COUNTER — Source Code Line Counter

ECC-compatible ABAP report that counts the source-code lines of each
program / include entered on the selection screen and displays it, next
to its main program, in a fully featured ALV grid. Only the objects that
are actually entered appear in the output — includes of a main program
are **not** expanded.

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

For **each object entered** on the selection screen exactly one entry is
produced (the entered object is always what appears in *Object Name*):

1. The object's type is read from `TRDIR-SUBC` (`I` = include).
2. Its own source lines are counted with `READ REPORT` + `lines( )`.
3. **Main program input** (report, module pool, function-group main,
   ...): one row with *Main Program* = *Object Name* = the entered
   program, type `PROG`.
4. **Include input** (`SUBC = 'I'`): the main program(s) it belongs to
   are resolved from table `D010INC` (`SELECT master WHERE include = …`,
   no function module). One row per main program is produced with
   *Main Program* = that main program, *Object Name* = the entered
   include, type `INCLUDE`. An orphan include (no master) is shown with
   itself as the main program.
5. A **fan-out guard** (`GC_MAX_MAINPROGRAMS`, default 50) caps how many
   rows a single widely shared include can produce.
6. Rows are de-duplicated so the same combination is not listed twice.

Includes of a main program are deliberately **not** listed — only the
objects entered in the selection screen appear in the result.

## Output (ALV grid — `CL_SALV_TABLE`)

| Main Program | Object Name | Object Type | Number of Lines |
|--------------|-------------|-------------|-----------------|
| Entered program, or the include's main program | The entered object | `PROG` / `INCLUDE` | Source lines of the entered object |

All standard ALV features are enabled (`set_all`): sorting, multiple
sorting, filtering, layout variants, Excel export, print, find/search,
column hide/show, resizing. A **subtotal per main program** and a **grand
total** of the line count are provided.

## ECC compatibility

- Targets SAP ECC 6.0 (NetWeaver 7.0x+). No S/4HANA-only syntax or
  classes are used.
- Uses standard, ECC-available components only: tables `TRDIR` and
  `D010INC`, the `READ REPORT` statement, and `CL_SALV_TABLE`. The
  include → main-program relationship is read from a database table
  rather than a function module.

## Error handling

- Program/object not found, no active source, or missing `S_DEVELOP`
  (ACTVT 03) authorization are handled gracefully: the object is skipped
  and logged. The log is written to the list after the ALV is closed.
