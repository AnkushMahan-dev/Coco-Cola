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
produced (the entered object is always what appears in *Object Name*).
The object kind is detected (`GET_OBJECT_KIND`) against the authoritative
dictionary for each type — `SEOCLASS` (class/interface), `TFDIR`
(function module), `STXFADM` (smartform), the `SAPL…` pool in `TRDIR`
(function group), then `TADIR` (enhancements) and `TRDIR`
(program/include) — then its source is resolved and its lines summed:

| Entered object | Object Type | Main Program column | Lines counted |
|----------------|-------------|---------------------|---------------|
| Report / module pool / subroutine pool | `PROG` | the program itself | its own source |
| Include | `INCLUDE` | main program(s) from `D010INC` (one row each) | the include's source |
| Global class | `CLAS` | class pool (`…====CP`) | class pool + all class includes |
| Global interface | `INTF` | interface pool | interface pool + all includes |
| Function module | `FUNC` | `SAPL…` main program | the FM's source include |
| Function group | `FUGR` | `SAPL…` main program | main program + all group includes |
| Smartform | `SSFO` | generated FM's program | generated function module source |
| Enhancement impl. | `ENHO` | the enhancement itself | source-code (hook) plug-in lines |
| Enh. spot / composite | `ENHS`/`ENHC` | — | recognised, no source to count |

- **Class / interface / function-group includes** are listed from
  `D010INC` and summed; the class pool name is obtained from
  `CL_OO_CLASSNAME_SERVICE=>GET_CLASSPOOL_NAME` (namespace-safe).
- **Function module / smartform** use `FUNCTION_INCLUDE_INFO` (and
  `SSF_FUNCTION_MODULE_NAME` for the smartform's generated FM).
- A **fan-out guard** (`GC_MAX_MAINPROGRAMS`, default 50) caps how many
  rows a single widely shared include can produce.
- Rows are de-duplicated so the same combination is not listed twice.

Only the objects entered in the selection screen appear in the result —
the includes/members that make up an object are summed into its single
row, not listed individually.

## Notes / limitations

- **Smartforms** have no editable ABAP source of their own; the report
  counts the **generated function module**, which only exists once the
  form has been generated in the system. Otherwise a message is logged.
- **Enhancement implementations (`ENHO`)** are counted for their
  **source-code (hook) plug-ins** via the enhancement framework API
  (`CL_ENH_FACTORY` → `CL_ENH_TOOL_HOOK_IMPL`). Non-source enhancement
  kinds (class/BAdI enhancements) yield "no readable source-code plug-in".
- **Enhancement spots (`ENHS`)** and **composite enhancements (`ENHC`)**
  are definitions with no source plug-in, so they are recognised but not
  counted.

## Output (ALV grid — `CL_SALV_TABLE`)

| Main Program | Object Name | Object Type | Number of Lines |
|--------------|-------------|-------------|-----------------|
| Program / pool of the entered object | The entered object | `PROG`/`INCLUDE`/`CLAS`/`INTF`/`FUNC`/`FUGR`/`SSFO`/`ENHO` | Total source lines of the entered object |

All standard ALV features are enabled (`set_all`): sorting, multiple
sorting, filtering, layout variants, Excel export, print, find/search,
column hide/show, resizing. A **subtotal per main program** and a **grand
total** of the line count are provided.

## ECC compatibility

- Targets SAP ECC 6.0 (NetWeaver 7.0x+). No S/4HANA-only syntax or
  classes are used.
- Uses standard, ECC-available components only: tables `TRDIR`, `TADIR`,
  `TFDIR`, `D010INC`; the `READ REPORT` statement; `CL_SALV_TABLE`;
  `CL_OO_CLASSNAME_SERVICE`; and the standard function modules
  `FUNCTION_INCLUDE_INFO` and `SSF_FUNCTION_MODULE_NAME` (all present in
  ECC 6.0). The include → main-program relationship is read from a
  database table.

## Error handling

- Program/object not found, no active source, or missing `S_DEVELOP`
  (ACTVT 03) authorization are handled gracefully: the object is skipped
  and logged. The log is written to the list after the ALV is closed.
