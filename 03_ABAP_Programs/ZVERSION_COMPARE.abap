*&---------------------------------------------------------------------*
*& Report  ZVERSION_COMPARE
*&---------------------------------------------------------------------*
*& Purpose : Compare the active version of repository objects in the
*&           current (development) system against a remote production
*&           system that is reached through an RFC destination.
*&
*&           Input  : Range of object type and object name (no interval).
*&                    Object name is mandatory - the mandatory check is
*&                    raised in START-OF-SELECTION (not via OBLIGATORY).
*&           Source : Object list is read from table TADIR.
*&           Compare: The active (latest) version of every object is
*&                    identified by the last transport request (KORRNUM)
*&                    recorded by version management. Version management
*&                    stamps the SAME request number in both the source
*&                    and the target system when a change is delivered,
*&                    so the request number is a reliable cross-system
*&                    key (timestamps drift because the target records
*&                    the import time). The mismatch flag and the remarks
*&                    are therefore derived from the last request;
*&                    version number, date and author are shown for
*&                    transparency.
*&           Output : ALV grid with object type, object name, the dev /
*&                    production version details, a Mismatch column
*&                    ('YES' when the active versions differ, 'NO' when
*&                    they are identical) and a Remarks column that
*&                    explains the reason.
*&
*& Release : Classic ABAP, compatible with SAP ECC 6.x.
*&---------------------------------------------------------------------*
REPORT zversion_compare LINE-SIZE 255.

TABLES: tadir.

*&---------------------------------------------------------------------*
*& Types
*&---------------------------------------------------------------------*
TYPES: BEGIN OF ty_object,
         object   TYPE tadir-object,        " Object type
         obj_name TYPE tadir-obj_name,      " Object name
       END OF ty_object.

* Active-version key returned for a single object / system
TYPES: BEGIN OF ty_version,
         versno TYPE vrsd-versno,           " Latest version number
         korr   TYPE vrsd-korrnum,          " Last transport request
         date   TYPE vrsd-datum,            " Version date
         time   TYPE vrsd-zeit,             " Version time
         author TYPE vrsd-author,           " Last author
         found  TYPE abap_bool,             " Version info available
       END OF ty_version.

TYPES: BEGIN OF ty_output,
         object     TYPE tadir-object,      " Object type
         obj_name   TYPE tadir-obj_name,    " Object name
         dev_versno TYPE vrsd-versno,       " Dev  - version number
         dev_korr   TYPE vrsd-korrnum,      " Dev  - last request
         dev_date   TYPE vrsd-datum,        " Dev  - version date
         dev_author TYPE vrsd-author,       " Dev  - author
         prd_versno TYPE vrsd-versno,       " Prod - version number
         prd_korr   TYPE vrsd-korrnum,      " Prod - last request
         prd_date   TYPE vrsd-datum,        " Prod - version date
         prd_author TYPE vrsd-author,       " Prod - author
         mismatch   TYPE char3,             " 'YES' / 'NO'
         remarks    TYPE char60,            " Reason behind the flag
       END OF ty_output.

*&---------------------------------------------------------------------*
*& Global data
*&---------------------------------------------------------------------*
DATA: gt_object  TYPE STANDARD TABLE OF ty_object,
      gt_output  TYPE STANDARD TABLE OF ty_output,
      gt_fieldc  TYPE slis_t_fieldcat_alv,
      gs_layout  TYPE slis_layout_alv.

CONSTANTS: gc_yes TYPE char3 VALUE 'YES',
           gc_no  TYPE char3 VALUE 'NO'.

*&---------------------------------------------------------------------*
*& Selection screen
*&---------------------------------------------------------------------*
SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE text-001.
* Object type range - single values only (no interval / no high value)
SELECT-OPTIONS: s_object FOR tadir-object   NO INTERVALS.
* Object name range - single values only (no interval / no high value)
* Mandatory check is performed in START-OF-SELECTION (not OBLIGATORY).
SELECT-OPTIONS: s_objnam FOR tadir-obj_name NO INTERVALS.
SELECTION-SCREEN END OF BLOCK b1.

SELECTION-SCREEN BEGIN OF BLOCK b2 WITH FRAME TITLE text-002.
* RFC destination pointing to the production system
PARAMETERS: p_rfc TYPE rfcdest OBLIGATORY.
SELECTION-SCREEN END OF BLOCK b2.

*&---------------------------------------------------------------------*
*& Start of selection
*&---------------------------------------------------------------------*
START-OF-SELECTION.

* --- Mandatory check for object name (handled here as requested) ------
  IF s_objnam[] IS INITIAL.
    MESSAGE 'Object name is mandatory' TYPE 'E'.
*   Processing stops and the user is returned to the selection screen.
  ENDIF.

  PERFORM f_read_tadir.

  IF gt_object IS INITIAL.
    MESSAGE 'No objects found in TADIR for the given selection' TYPE 'S'
            DISPLAY LIKE 'W'.
    RETURN.
  ENDIF.

  PERFORM f_collect_versions.

END-OF-SELECTION.

  PERFORM f_display_alv.

*&---------------------------------------------------------------------*
*&      Form  F_READ_TADIR
*&---------------------------------------------------------------------*
*  Read the object directory (TADIR) for the requested object types and
*  object names. Only original, non-deleted R3TR objects are considered.
*----------------------------------------------------------------------*
FORM f_read_tadir.

  SELECT object obj_name
    FROM tadir
    INTO TABLE gt_object
    WHERE pgmid    = 'R3TR'
      AND object   IN s_object
      AND obj_name IN s_objnam
      AND delflag  = space.

  SORT gt_object BY object obj_name.

ENDFORM.                    "f_read_tadir

*&---------------------------------------------------------------------*
*&      Form  F_COLLECT_VERSIONS
*&---------------------------------------------------------------------*
*  For every object read the active-version key (last transport request,
*  version number, date, author) both locally (development) and in the
*  remote production system (via RFC), then evaluate the mismatch flag
*  and the remarks.
*----------------------------------------------------------------------*
FORM f_collect_versions.

  DATA: ls_object TYPE ty_object,
        ls_output TYPE ty_output,
        ls_dev    TYPE ty_version,
        ls_prd    TYPE ty_version.

  LOOP AT gt_object INTO ls_object.

    CLEAR: ls_output, ls_dev, ls_prd.

*   Active version in the local (development) system
    PERFORM f_get_active_version
            USING    ls_object-object
                     ls_object-obj_name
                     space                 " no destination = local
            CHANGING ls_dev.

*   Active version in the remote (production) system
    PERFORM f_get_active_version
            USING    ls_object-object
                     ls_object-obj_name
                     p_rfc                 " RFC destination
            CHANGING ls_prd.

    ls_output-object     = ls_object-object.
    ls_output-obj_name   = ls_object-obj_name.

    ls_output-dev_versno = ls_dev-versno.
    ls_output-dev_korr   = ls_dev-korr.
    ls_output-dev_date   = ls_dev-date.
    ls_output-dev_author = ls_dev-author.

    ls_output-prd_versno = ls_prd-versno.
    ls_output-prd_korr   = ls_prd-korr.
    ls_output-prd_date   = ls_prd-date.
    ls_output-prd_author = ls_prd-author.

    PERFORM f_evaluate_mismatch USING    ls_dev
                                         ls_prd
                                CHANGING ls_output-mismatch
                                         ls_output-remarks.

    APPEND ls_output TO gt_output.

  ENDLOOP.

ENDFORM.                    "f_collect_versions

*&---------------------------------------------------------------------*
*&      Form  F_EVALUATE_MISMATCH
*&---------------------------------------------------------------------*
*  Derive the mismatch flag and the remarks from the active-version key.
*  The last transport request (KORRNUM) is the reliable cross-system
*  identifier:
*    Condition                                  Mismatch  Remarks
*    Request differs between dev and prod       YES       reason text
*    Request identical in both                  NO        reason text
*    Version info in only one system            YES       reason text
*    No version info in either                  NO        reason text
*----------------------------------------------------------------------*
FORM f_evaluate_mismatch USING    ps_dev  TYPE ty_version
                                  ps_prd  TYPE ty_version
                         CHANGING pv_flag TYPE char3
                                  pv_rem  TYPE char60.

  IF ps_dev-found = abap_false AND ps_prd-found = abap_false.
    pv_flag = gc_no.
    pv_rem  = 'No version information in either system'.

  ELSEIF ps_dev-found = abap_true AND ps_prd-found = abap_false.
    pv_flag = gc_yes.
    pv_rem  = 'Version exists in Dev only - missing in Production'.

  ELSEIF ps_dev-found = abap_false AND ps_prd-found = abap_true.
    pv_flag = gc_yes.
    pv_rem  = 'Version exists in Production only - missing in Dev'.

  ELSEIF ps_dev-korr = ps_prd-korr.
    pv_flag = gc_no.
    pv_rem  = 'Last transport request identical in both systems'.

  ELSE.
    pv_flag = gc_yes.
    pv_rem  = 'Last transport request differs between Dev and Prod'.

  ENDIF.

ENDFORM.                    "f_evaluate_mismatch

*&---------------------------------------------------------------------*
*&      Form  F_GET_ACTIVE_VERSION
*&---------------------------------------------------------------------*
*  Reads the version directory of a single object and returns the key of
*  the active (latest) version. When P_DEST is initial the lookup runs
*  in the local system, otherwise it is executed in the target system
*  through the RFC destination.
*
*  Version management is keyed at LIMU level, so the TADIR (R3TR) object
*  type is mapped to its version-management object type(s) first (see
*  F_MAP_VERSION_TYPES). All mapped types are queried and the most recent
*  entry across them is treated as the active version of the object.
*----------------------------------------------------------------------*
FORM f_get_active_version USING    p_objtype TYPE tadir-object
                                   p_objname TYPE tadir-obj_name
                                   p_dest    TYPE rfcdest
                          CHANGING ps_ver    TYPE ty_version.

  DATA: lt_types TYPE STANDARD TABLE OF vrsd-objtype,
        lv_type  TYPE vrsd-objtype,
        lt_vrsd  TYPE STANDARD TABLE OF vrsd,
        lt_all   TYPE STANDARD TABLE OF vrsd,
        ls_vrsd  TYPE vrsd,
        lv_subrc TYPE sy-subrc.

  CLEAR ps_ver.

* Map the R3TR object type to its version-management object type(s).
  PERFORM f_map_version_types USING p_objtype CHANGING lt_types.

  LOOP AT lt_types INTO lv_type.

    CLEAR: lt_vrsd, lv_subrc.

    IF p_dest IS INITIAL.

*     --- Local (development) system ----------------------------------
      CALL FUNCTION 'SVRS_GET_VERSION_DIRECTORY_46'
        EXPORTING
          objname      = p_objname
          objtype      = lv_type
        TABLES
          lversno_list = lt_vrsd
        EXCEPTIONS
          no_entry     = 1
          OTHERS       = 2.
      lv_subrc = sy-subrc.

    ELSE.

*     --- Remote (production) system via RFC destination --------------
      CALL FUNCTION 'SVRS_GET_VERSION_DIRECTORY_46'
        DESTINATION p_dest
        EXPORTING
          objname               = p_objname
          objtype               = lv_type
        TABLES
          lversno_list          = lt_vrsd
        EXCEPTIONS
          no_entry              = 1
          communication_failure = 3
          system_failure        = 4
          OTHERS                = 2.
      lv_subrc = sy-subrc.

    ENDIF.

    IF lv_subrc = 0 AND lt_vrsd IS NOT INITIAL.
      APPEND LINES OF lt_vrsd TO lt_all.
    ENDIF.

  ENDLOOP.

  IF lt_all IS INITIAL.
    RETURN.
  ENDIF.

* Newest version first (highest version number / most recent stamp).
  SORT lt_all BY versno DESCENDING datum DESCENDING zeit DESCENDING.

  READ TABLE lt_all INTO ls_vrsd INDEX 1.
  IF sy-subrc = 0.
    ps_ver-versno = ls_vrsd-versno.
    ps_ver-korr   = ls_vrsd-korrnum.
    ps_ver-date   = ls_vrsd-datum.
    ps_ver-time   = ls_vrsd-zeit.
    ps_ver-author = ls_vrsd-author.
    ps_ver-found  = abap_true.
  ENDIF.

ENDFORM.                    "f_get_active_version

*&---------------------------------------------------------------------*
*&      Form  F_MAP_VERSION_TYPES
*&---------------------------------------------------------------------*
*  Maps a TADIR (R3TR) object type to the version-management object
*  type(s) under which its versions are stored (table VRSD). The object
*  name is used unchanged for these types. The R3TR type itself is also
*  added as a candidate so that any object type already accepted by the
*  function module keeps working. Unmapped types therefore degrade
*  gracefully to a direct lookup.
*
*  Extend the CASE statement for additional / custom object types.
*----------------------------------------------------------------------*
FORM f_map_version_types USING    p_objtype TYPE tadir-object
                         CHANGING pt_types  TYPE STANDARD TABLE.

  DATA: lv_type TYPE vrsd-objtype.

  REFRESH pt_types.

  CASE p_objtype.

*   --- Programs / includes -----------------------------------------
    WHEN 'PROG' OR 'REPS'.            " Report source / include
      lv_type = 'REPS'. APPEND lv_type TO pt_types.
      lv_type = 'REPT'. APPEND lv_type TO pt_types.   " text elements
    WHEN 'FUGR' OR 'FUNC'.            " Function group / module
      lv_type = 'FUNC'. APPEND lv_type TO pt_types.
      lv_type = 'REPS'. APPEND lv_type TO pt_types.

*   --- Classes / interfaces ----------------------------------------
    WHEN 'CLAS'.                      " Class
      lv_type = 'CLSD'. APPEND lv_type TO pt_types.   " definition
      lv_type = 'CPUB'. APPEND lv_type TO pt_types.   " public section
      lv_type = 'CPRO'. APPEND lv_type TO pt_types.   " protected section
      lv_type = 'CPRI'. APPEND lv_type TO pt_types.   " private section
      lv_type = 'CINC'. APPEND lv_type TO pt_types.   " class includes
      lv_type = 'METH'. APPEND lv_type TO pt_types.   " methods
    WHEN 'INTF'.                      " Interface
      lv_type = 'INTD'. APPEND lv_type TO pt_types.

*   --- Dictionary objects ------------------------------------------
    WHEN 'TABL'.                      " Table / structure
      lv_type = 'TABD'. APPEND lv_type TO pt_types.   " definition
      lv_type = 'TABT'. APPEND lv_type TO pt_types.   " technical settings
    WHEN 'VIEW'.                      " View
      lv_type = 'VIED'. APPEND lv_type TO pt_types.
    WHEN 'DTEL'.                      " Data element
      lv_type = 'DTED'. APPEND lv_type TO pt_types.
    WHEN 'DOMA'.                      " Domain
      lv_type = 'DOMD'. APPEND lv_type TO pt_types.
    WHEN 'SHLP'.                      " Search help
      lv_type = 'SHLD'. APPEND lv_type TO pt_types.
    WHEN 'TTYP'.                      " Table type
      lv_type = 'TTYD'. APPEND lv_type TO pt_types.
    WHEN 'ENQU'.                      " Lock object
      lv_type = 'ENQD'. APPEND lv_type TO pt_types.
    WHEN 'TYPE'.                      " Type group / pool
      lv_type = 'TYPD'. APPEND lv_type TO pt_types.
    WHEN 'MSAG'.                      " Message class
      lv_type = 'MSAD'. APPEND lv_type TO pt_types.   " definition
      lv_type = 'MESS'. APPEND lv_type TO pt_types.   " single messages

*   --- Other / unmapped --------------------------------------------
    WHEN OTHERS.
*     No specific mapping: rely on the direct lookup below.
  ENDCASE.

* Always try the R3TR type itself as well (deduplicated).
  lv_type = p_objtype.
  READ TABLE pt_types WITH KEY table_line = lv_type TRANSPORTING NO FIELDS.
  IF sy-subrc <> 0.
    APPEND lv_type TO pt_types.
  ENDIF.

ENDFORM.                    "f_map_version_types

*&---------------------------------------------------------------------*
*&      Form  F_DISPLAY_ALV
*&---------------------------------------------------------------------*
*  Builds the field catalogue and shows the result in a standard ALV
*  grid. The standard ALV toolbar provides filter, sort, download to
*  spreadsheet / local file, layout management and print.
*----------------------------------------------------------------------*
FORM f_display_alv.

  PERFORM f_build_fieldcat.

  gs_layout-zebra             = 'X'.
  gs_layout-colwidth_optimize = 'X'.

  CALL FUNCTION 'REUSE_ALV_GRID_DISPLAY'
    EXPORTING
      i_callback_program = sy-repid
      is_layout          = gs_layout
      it_fieldcat        = gt_fieldc
      i_save             = 'A'
    TABLES
      t_outtab           = gt_output
    EXCEPTIONS
      program_error      = 1
      OTHERS             = 2.

  IF sy-subrc <> 0.
    MESSAGE 'Error while displaying the ALV grid' TYPE 'E'.
  ENDIF.

ENDFORM.                    "f_display_alv

*&---------------------------------------------------------------------*
*&      Form  F_BUILD_FIELDCAT
*&---------------------------------------------------------------------*
*  Assembles the ALV field catalogue for the output table.
*----------------------------------------------------------------------*
FORM f_build_fieldcat.

  CLEAR gt_fieldc.

  PERFORM f_add_field USING 'OBJECT'     'Object Type'        10.
  PERFORM f_add_field USING 'OBJ_NAME'   'Object Name'        40.
  PERFORM f_add_field USING 'DEV_VERSNO' 'Dev Version'        10.
  PERFORM f_add_field USING 'DEV_KORR'   'Dev Last Request'   20.
  PERFORM f_add_field USING 'DEV_DATE'   'Dev Date'           10.
  PERFORM f_add_field USING 'DEV_AUTHOR' 'Dev Author'         12.
  PERFORM f_add_field USING 'PRD_VERSNO' 'Prod Version'       10.
  PERFORM f_add_field USING 'PRD_KORR'   'Prod Last Request'  20.
  PERFORM f_add_field USING 'PRD_DATE'   'Prod Date'          10.
  PERFORM f_add_field USING 'PRD_AUTHOR' 'Prod Author'        12.
  PERFORM f_add_field USING 'MISMATCH'   'Mismatch'            8.
  PERFORM f_add_field USING 'REMARKS'    'Remarks'            60.

ENDFORM.                    "f_build_fieldcat

*&---------------------------------------------------------------------*
*&      Form  F_ADD_FIELD
*&---------------------------------------------------------------------*
*  Helper to append a single column definition to the field catalogue.
*----------------------------------------------------------------------*
FORM f_add_field USING p_field  TYPE c
                       p_text   TYPE c
                       p_length TYPE i.

  DATA: ls_fieldc TYPE slis_fieldcat_alv.

  ls_fieldc-fieldname    = p_field.
  ls_fieldc-seltext_l    = p_text.
  ls_fieldc-seltext_m    = p_text.
  ls_fieldc-seltext_s    = p_text.
  ls_fieldc-reptext_ddic = p_text.
  ls_fieldc-outputlen    = p_length.

  APPEND ls_fieldc TO gt_fieldc.

ENDFORM.                    "f_add_field
