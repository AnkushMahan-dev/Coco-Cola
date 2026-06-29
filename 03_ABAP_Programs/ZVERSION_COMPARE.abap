*&---------------------------------------------------------------------*
*& Report  ZVERSION_COMPARE
*&---------------------------------------------------------------------*
*& Purpose : Compare the ACTIVE version of repository objects between two
*&           systems, a SOURCE system (e.g. development) and a TARGET
*&           system (e.g. production), each reached through its own RFC
*&           destination - so any two systems can be compared without
*&           hardcoding either side.
*&
*&           Input  : Range of object type and object name (no interval),
*&                    plus the source and target RFC destinations.
*&                    Object name is mandatory - the mandatory check is
*&                    raised in START-OF-SELECTION (not via OBLIGATORY).
*&           Source : Object list is read from table TADIR.
*&           Compare: The ACTIVE version is compared by its actual source
*&                    code (the same signal the standard "Compare
*&                    Programs: Differences" tool uses). The previous
*&                    request-number approach was unreliable, because the
*&                    active version often carries no transport request,
*&                    so the source is read from both systems via RFC and
*&                    compared line by line.
*&           Output : ALV grid with object type, object name, the source
*&                    line counts per system, last-changed information, a
*&                    Mismatch column ('YES' when the active sources
*&                    differ, 'NO' when they are identical) and a Remarks
*&                    column that explains the reason.
*&
*&           Scope  : Source comparison is implemented for source-based
*&                    program objects (PROG / report includes). Other
*&                    object types are listed with a remark; add their
*&                    readers in F_READ_SOURCE to extend coverage.
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

* Active-version source + metadata for a single object / system
TYPES: BEGIN OF ty_source,
         source    TYPE rswsourcet,         " active source lines
         lines     TYPE i,                  " number of source lines
         chg_date  TYPE trdir-udat,         " last changed on
         chg_user  TYPE trdir-unam,         " last changed by
         found     TYPE abap_bool,          " object exists in system
         supported TYPE abap_bool,          " type supported for compare
       END OF ty_source.

TYPES: BEGIN OF ty_output,
         object     TYPE tadir-object,      " Object type
         obj_name   TYPE tadir-obj_name,    " Object name
         dev_lines  TYPE i,                 " Dev  - source line count
         dev_date   TYPE trdir-udat,        " Dev  - last changed on
         dev_user   TYPE trdir-unam,        " Dev  - last changed by
         prd_lines  TYPE i,                 " Prod - source line count
         prd_date   TYPE trdir-udat,        " Prod - last changed on
         prd_user   TYPE trdir-unam,        " Prod - last changed by
         mismatch   TYPE char3,             " 'YES' / 'NO'
         remarks    TYPE char100,           " Reason behind the flag
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
* RFC destination of the SOURCE system (e.g. development).
* 'NONE' is the self-referencing destination = the local logon system.
PARAMETERS: p_srfc TYPE rfcdest OBLIGATORY DEFAULT 'NONE'.
* RFC destination of the TARGET system (e.g. production)
PARAMETERS: p_trfc TYPE rfcdest OBLIGATORY.
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
*  For every object read the active source (and last-changed data) from
*  the source and target systems via RFC, then evaluate the mismatch
*  flag and the remarks by comparing the two sources.
*----------------------------------------------------------------------*
FORM f_collect_versions.

  DATA: ls_object TYPE ty_object,
        ls_output TYPE ty_output,
        ls_dev    TYPE ty_source,
        ls_prd    TYPE ty_source.

  LOOP AT gt_object INTO ls_object.

    CLEAR: ls_output, ls_dev, ls_prd.

*   Active source in the SOURCE system (e.g. development)
    PERFORM f_read_source
            USING    ls_object-object
                     ls_object-obj_name
                     p_srfc                " source RFC destination
            CHANGING ls_dev.

*   Active source in the TARGET system (e.g. production)
    PERFORM f_read_source
            USING    ls_object-object
                     ls_object-obj_name
                     p_trfc                " target RFC destination
            CHANGING ls_prd.

    ls_output-object    = ls_object-object.
    ls_output-obj_name  = ls_object-obj_name.

    ls_output-dev_lines = ls_dev-lines.
    ls_output-dev_date  = ls_dev-chg_date.
    ls_output-dev_user  = ls_dev-chg_user.

    ls_output-prd_lines = ls_prd-lines.
    ls_output-prd_date  = ls_prd-chg_date.
    ls_output-prd_user  = ls_prd-chg_user.

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
*  Derive the mismatch flag and remarks by comparing the active source
*  of the two systems:
*    Condition                                  Mismatch  Remarks
*    Object type not supported for compare      (blank)   reason text
*    Source differs between dev and prod        YES       reason text
*    Source identical in both                   NO        reason text
*    Object exists in only one system           YES       reason text
*    Object missing in both systems             NO        reason text
*----------------------------------------------------------------------*
FORM f_evaluate_mismatch USING    ps_dev  TYPE ty_source
                                  ps_prd  TYPE ty_source
                         CHANGING pv_flag TYPE char3
                                  pv_rem  TYPE char100.

  CLEAR: pv_flag, pv_rem.

* Object type not handled by the source reader
  IF ps_dev-supported = abap_false.
    pv_flag = space.
    pv_rem  = 'Object type not supported - source comparison covers programs (PROG)'.
    RETURN.
  ENDIF.

  IF ps_dev-found = abap_false AND ps_prd-found = abap_false.
    pv_flag = gc_no.
    pv_rem  = 'Object does not exist in either system'.

  ELSEIF ps_dev-found = abap_true AND ps_prd-found = abap_false.
    pv_flag = gc_yes.
    pv_rem  = 'Object exists in Source only - missing in Target'.

  ELSEIF ps_dev-found = abap_false AND ps_prd-found = abap_true.
    pv_flag = gc_yes.
    pv_rem  = 'Object exists in Target only - missing in Source'.

  ELSEIF ps_dev-source = ps_prd-source.
    pv_flag = gc_no.
    pv_rem  = 'Active source identical in both systems'.

  ELSE.
    pv_flag = gc_yes.
    IF ps_dev-lines <> ps_prd-lines.
      CONCATENATE 'Active source differs (lines'
                  ps_dev-lines 'vs' ps_prd-lines ')'
                  INTO pv_rem SEPARATED BY space.
    ELSE.
      pv_rem = 'Active source differs (same line count, different content)'.
    ENDIF.

  ENDIF.

ENDFORM.                    "f_evaluate_mismatch

*&---------------------------------------------------------------------*
*&      Form  F_READ_SOURCE
*&---------------------------------------------------------------------*
*  Reads the active source and last-changed data of a single object in
*  the system addressed by P_DEST ('NONE' = local logon system).
*
*  Source comparison is implemented for program objects (report source).
*  For other object types SUPPORTED is returned as false so the row is
*  reported with an explanatory remark. Add further readers (function
*  modules, classes, ...) in the CASE statement to widen coverage.
*----------------------------------------------------------------------*
FORM f_read_source USING    p_objtype TYPE tadir-object
                            p_objname TYPE tadir-obj_name
                            p_dest    TYPE rfcdest
                   CHANGING ps_src    TYPE ty_source.

  DATA: lv_prog TYPE programm,
        lv_subc TYPE trdir-subc.

  CLEAR ps_src.

  CASE p_objtype.

    WHEN 'PROG'.                       " Report / include source
      ps_src-supported = abap_true.
      lv_prog          = p_objname.

      CALL FUNCTION 'RPY_PROGRAM_READ'
        DESTINATION p_dest
        EXPORTING
          program_name           = lv_prog
          with_includelist       = space
          only_source            = 'X'
        IMPORTING
          program_subc           = lv_subc
        TABLES
          source_extended        = ps_src-source
        EXCEPTIONS
          cancelled              = 1
          not_found              = 2
          permission_error       = 3
          communication_failure  = 4
          system_failure         = 5
          OTHERS                 = 6.

      IF sy-subrc = 0.
        ps_src-found = abap_true.
        ps_src-lines = lines( ps_src-source ).
*       Last-changed data from the program directory (TRDIR).
        PERFORM f_read_trdir USING    lv_prog
                                      p_dest
                             CHANGING ps_src-chg_date
                                      ps_src-chg_user.
      ENDIF.

    WHEN OTHERS.
*     Object type not yet supported by the source reader.
      ps_src-supported = abap_false.

  ENDCASE.

ENDFORM.                    "f_read_source

*&---------------------------------------------------------------------*
*&      Form  F_READ_TRDIR
*&---------------------------------------------------------------------*
*  Reads the last-changed date / user of a program from TRDIR in the
*  system addressed by P_DEST, using the remote-enabled RFC_READ_TABLE.
*  Purely informational - failures are ignored.
*----------------------------------------------------------------------*
FORM f_read_trdir USING    p_prog TYPE programm
                           p_dest TYPE rfcdest
                  CHANGING p_date TYPE trdir-udat
                           p_user TYPE trdir-unam.

  DATA: lt_options TYPE STANDARD TABLE OF rfc_db_opt,
        lt_fields  TYPE STANDARD TABLE OF rfc_db_fld,
        lt_data    TYPE STANDARD TABLE OF tab512,
        ls_options TYPE rfc_db_opt,
        ls_fields  TYPE rfc_db_fld,
        ls_data    TYPE tab512.

  CLEAR: p_date, p_user.

  CONCATENATE 'NAME = ''' p_prog '''' INTO ls_options-text.
  APPEND ls_options TO lt_options.

  ls_fields-fieldname = 'UDAT'. APPEND ls_fields TO lt_fields.
  ls_fields-fieldname = 'UNAM'. APPEND ls_fields TO lt_fields.

  CALL FUNCTION 'RFC_READ_TABLE'
    DESTINATION p_dest
    EXPORTING
      query_table           = 'TRDIR'
      delimiter             = '|'
    TABLES
      options               = lt_options
      fields                = lt_fields
      data                  = lt_data
    EXCEPTIONS
      table_not_available   = 1
      option_not_valid      = 2
      field_not_valid       = 3
      not_authorized        = 4
      data_buffer_exceeded  = 5
      communication_failure = 6
      system_failure        = 7
      OTHERS                = 8.

  IF sy-subrc = 0.
    READ TABLE lt_data INTO ls_data INDEX 1.
    IF sy-subrc = 0.
      SPLIT ls_data-wa AT '|' INTO p_date p_user.
    ENDIF.
  ENDIF.

ENDFORM.                    "f_read_trdir

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

  PERFORM f_add_field USING 'OBJECT'    'Object Type'        10.
  PERFORM f_add_field USING 'OBJ_NAME'  'Object Name'        40.
  PERFORM f_add_field USING 'DEV_LINES' 'Source Lines'       12.
  PERFORM f_add_field USING 'DEV_DATE'  'Source Changed On'  12.
  PERFORM f_add_field USING 'DEV_USER'  'Source Changed By'  12.
  PERFORM f_add_field USING 'PRD_LINES' 'Target Lines'       12.
  PERFORM f_add_field USING 'PRD_DATE'  'Target Changed On'  12.
  PERFORM f_add_field USING 'PRD_USER'  'Target Changed By'  12.
  PERFORM f_add_field USING 'MISMATCH'  'Mismatch'            8.
  PERFORM f_add_field USING 'REMARKS'   'Remarks'            70.

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
