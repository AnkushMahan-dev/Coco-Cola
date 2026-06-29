*&---------------------------------------------------------------------*
*& Report  ZVERSION_COMPARE
*&---------------------------------------------------------------------*
*& Purpose : Compare the version of repository objects between two
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
*&           Compare: The version directory table VRSD is read DIRECTLY
*&                    from each system with the standard, remote-enabled
*&                    module RFC_READ_TABLE (no custom function module
*&                    needs to be created in the target system). The
*&                    latest version entry's transport request (KORRNUM)
*&                    is the cross-system key: version management stamps
*&                    the same request number in both the source and the
*&                    target system when a change is delivered.
*&
*&                    Reading VRSD directly avoids the blank "active
*&                    version" entry that SVRS_GET_VERSION_DIRECTORY_46
*&                    returns, which previously caused a false match.
*&           Output : ALV grid with object type, object name, the latest
*&                    version / request / date / author per system, a
*&                    Mismatch column ('YES' when the latest requests
*&                    differ, 'NO' when they are identical) and a Remarks
*&                    column that explains the reason.
*&
*& Prereq  : The target RFC destination's user needs read authorisation
*&           for RFC_READ_TABLE on table VRSD. Version logging on import
*&           must be active in both systems (standard for QA/PRD).
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

* One parsed VRSD row (as returned by RFC_READ_TABLE)
TYPES: BEGIN OF ty_vrsd_row,
         versno TYPE vrsd-versno,           " version number
         korr   TYPE vrsd-korrnum,          " transport request
         author TYPE vrsd-author,           " author
         datum  TYPE vrsd-datum,            " date
         zeit   TYPE vrsd-zeit,             " time
       END OF ty_vrsd_row.

* Latest-version key returned for a single object / system
TYPES: BEGIN OF ty_version,
         versno    TYPE vrsd-versno,        " latest version number
         korr      TYPE vrsd-korrnum,       " latest transport request
         author    TYPE vrsd-author,        " author of latest version
         datum     TYPE vrsd-datum,         " date of latest version
         found     TYPE abap_bool,          " version history available
         supported TYPE abap_bool,          " type mapped for compare
       END OF ty_version.

TYPES: BEGIN OF ty_output,
         object     TYPE tadir-object,      " Object type
         obj_name   TYPE tadir-obj_name,    " Object name
         dev_korr   TYPE vrsd-korrnum,      " Source - latest request
         dev_versno TYPE vrsd-versno,       " Source - latest version no
         dev_date   TYPE vrsd-datum,        " Source - latest date
         dev_author TYPE vrsd-author,       " Source - latest author
         prd_korr   TYPE vrsd-korrnum,      " Target - latest request
         prd_versno TYPE vrsd-versno,       " Target - latest version no
         prd_date   TYPE vrsd-datum,        " Target - latest date
         prd_author TYPE vrsd-author,       " Target - latest author
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
*  For every object read the latest version key from the source and the
*  target systems via RFC, then evaluate the mismatch flag and remarks.
*----------------------------------------------------------------------*
FORM f_collect_versions.

  DATA: ls_object TYPE ty_object,
        ls_output TYPE ty_output,
        ls_dev    TYPE ty_version,
        ls_prd    TYPE ty_version.

  LOOP AT gt_object INTO ls_object.

    CLEAR: ls_output, ls_dev, ls_prd.

*   Latest version in the SOURCE system (e.g. development)
    PERFORM f_get_version
            USING    ls_object-object
                     ls_object-obj_name
                     p_srfc                " source RFC destination
            CHANGING ls_dev.

*   Latest version in the TARGET system (e.g. production)
    PERFORM f_get_version
            USING    ls_object-object
                     ls_object-obj_name
                     p_trfc                " target RFC destination
            CHANGING ls_prd.

    ls_output-object     = ls_object-object.
    ls_output-obj_name   = ls_object-obj_name.

    ls_output-dev_korr   = ls_dev-korr.
    ls_output-dev_versno = ls_dev-versno.
    ls_output-dev_date   = ls_dev-datum.
    ls_output-dev_author = ls_dev-author.

    ls_output-prd_korr   = ls_prd-korr.
    ls_output-prd_versno = ls_prd-versno.
    ls_output-prd_date   = ls_prd-datum.
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
*  Derive the mismatch flag and remarks from the latest version key:
*    Condition                                  Mismatch  Remarks
*    Object type not mapped for compare         (blank)   reason text
*    Latest request differs                     YES       reason text
*    Latest request identical                   NO        reason text
*    Version history in only one system         YES       reason text
*    No version history in either system        NO        reason text
*----------------------------------------------------------------------*
FORM f_evaluate_mismatch USING    ps_dev  TYPE ty_version
                                  ps_prd  TYPE ty_version
                         CHANGING pv_flag TYPE char3
                                  pv_rem  TYPE char100.

  CLEAR: pv_flag, pv_rem.

* Object type not mapped to a version-management type
  IF ps_dev-supported = abap_false.
    pv_flag = space.
    pv_rem  = 'Object type not mapped for version compare - extend F_MAP_VRSD_TYPE'.
    RETURN.
  ENDIF.

  IF ps_dev-found = abap_false AND ps_prd-found = abap_false.
    pv_flag = gc_no.
    pv_rem  = 'No version history in either system'.

  ELSEIF ps_dev-found = abap_true AND ps_prd-found = abap_false.
    pv_flag = gc_yes.
    pv_rem  = 'Version history in Source only - missing in Target'.

  ELSEIF ps_dev-found = abap_false AND ps_prd-found = abap_true.
    pv_flag = gc_yes.
    pv_rem  = 'Version history in Target only - missing in Source'.

  ELSEIF ps_dev-korr = ps_prd-korr.
    pv_flag = gc_no.
    pv_rem  = 'Latest transport request identical in both systems'.

  ELSE.
    pv_flag = gc_yes.
    pv_rem  = 'Latest transport request differs between Source and Target'.

  ENDIF.

ENDFORM.                    "f_evaluate_mismatch

*&---------------------------------------------------------------------*
*&      Form  F_GET_VERSION
*&---------------------------------------------------------------------*
*  Reads the version directory (VRSD) of a single object from the system
*  addressed by P_DEST ('NONE' = local logon system) using the standard
*  remote-enabled module RFC_READ_TABLE, and returns the latest version
*  entry (by date / time / version number).
*----------------------------------------------------------------------*
FORM f_get_version USING    p_objtype TYPE tadir-object
                            p_objname TYPE tadir-obj_name
                            p_dest    TYPE rfcdest
                   CHANGING ps_ver    TYPE ty_version.

  DATA: lv_vtype   TYPE vrsd-objtype,
        lv_name    TYPE vrsd-objname,
        lt_options TYPE STANDARD TABLE OF rfc_db_opt,
        lt_fields  TYPE STANDARD TABLE OF rfc_db_fld,
        lt_data    TYPE STANDARD TABLE OF tab512,
        ls_options TYPE rfc_db_opt,
        ls_fields  TYPE rfc_db_fld,
        ls_data    TYPE tab512,
        lt_rows    TYPE STANDARD TABLE OF ty_vrsd_row,
        ls_row     TYPE ty_vrsd_row,
        lv_msg     TYPE char200.

  CLEAR ps_ver.

* Map the R3TR object type to its version-management (VRSD) object type.
  PERFORM f_map_vrsd_type USING p_objtype CHANGING lv_vtype.
  IF lv_vtype IS INITIAL.
    ps_ver-supported = abap_false.
    RETURN.
  ENDIF.
  ps_ver-supported = abap_true.
  lv_name          = p_objname.

* WHERE OBJTYPE = '<vtype>' AND OBJNAME = '<name>'
  CONCATENATE `OBJTYPE = '` lv_vtype `'` INTO ls_options-text.
  APPEND ls_options TO lt_options.
  CLEAR ls_options.
  CONCATENATE `AND OBJNAME = '` lv_name `'` INTO ls_options-text.
  APPEND ls_options TO lt_options.

* Requested fields - the data rows are delimited in this same order.
  ls_fields-fieldname = 'VERSNO'.  APPEND ls_fields TO lt_fields.
  ls_fields-fieldname = 'KORRNUM'. APPEND ls_fields TO lt_fields.
  ls_fields-fieldname = 'AUTHOR'.  APPEND ls_fields TO lt_fields.
  ls_fields-fieldname = 'DATUM'.   APPEND ls_fields TO lt_fields.
  ls_fields-fieldname = 'ZEIT'.    APPEND ls_fields TO lt_fields.

  CALL FUNCTION 'RFC_READ_TABLE'
    DESTINATION p_dest
    EXPORTING
      query_table           = 'VRSD'
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
      communication_failure = 6 MESSAGE lv_msg
      system_failure        = 7 MESSAGE lv_msg
      OTHERS                = 8.

  IF sy-subrc <> 0.
    RETURN.
  ENDIF.

* Parse the delimited rows into a typed table.
  LOOP AT lt_data INTO ls_data.
    CLEAR ls_row.
    SPLIT ls_data-wa AT '|'
          INTO ls_row-versno ls_row-korr ls_row-author
               ls_row-datum  ls_row-zeit.
    APPEND ls_row TO lt_rows.
  ENDLOOP.

  IF lt_rows IS INITIAL.
    RETURN.
  ENDIF.

* Latest entry first (most recent date / time / version number).
  SORT lt_rows BY datum DESCENDING zeit DESCENDING versno DESCENDING.

  READ TABLE lt_rows INTO ls_row INDEX 1.
  IF sy-subrc = 0.
    ps_ver-found  = abap_true.
    ps_ver-versno = ls_row-versno.
    ps_ver-korr   = ls_row-korr.
    ps_ver-author = ls_row-author.
    ps_ver-datum  = ls_row-datum.
  ENDIF.

ENDFORM.                    "f_get_version

*&---------------------------------------------------------------------*
*&      Form  F_MAP_VRSD_TYPE
*&---------------------------------------------------------------------*
*  Maps a TADIR (R3TR) object type to the version-management (VRSD)
*  object type under which the object's source / definition versions are
*  stored, using the object name unchanged. Returns space when the type
*  is not mapped (the row is then flagged "not mapped" in the output).
*
*  Extend the CASE for further object types. Composite objects (function
*  groups, classes) version their parts under structured names and need
*  dedicated handling - add them here when required.
*----------------------------------------------------------------------*
FORM f_map_vrsd_type USING    p_objtype TYPE tadir-object
                     CHANGING p_vtype   TYPE vrsd-objtype.

  CLEAR p_vtype.

  CASE p_objtype.
    WHEN 'PROG'.  p_vtype = 'REPS'.   " report / include source
    WHEN 'TABL'.  p_vtype = 'TABD'.   " table / structure definition
    WHEN 'VIEW'.  p_vtype = 'VIED'.   " view
    WHEN 'DTEL'.  p_vtype = 'DTED'.   " data element
    WHEN 'DOMA'.  p_vtype = 'DOMD'.   " domain
    WHEN 'SHLP'.  p_vtype = 'SHLD'.   " search help
    WHEN 'TTYP'.  p_vtype = 'TTYD'.   " table type
    WHEN 'ENQU'.  p_vtype = 'ENQD'.   " lock object
    WHEN 'MSAG'.  p_vtype = 'MSAD'.   " message class
    WHEN OTHERS.  CLEAR p_vtype.      " not mapped
  ENDCASE.

ENDFORM.                    "f_map_vrsd_type

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
  PERFORM f_add_field USING 'DEV_KORR'   'Source Request'     20.
  PERFORM f_add_field USING 'DEV_VERSNO' 'Source Version'     12.
  PERFORM f_add_field USING 'DEV_DATE'   'Source Date'        10.
  PERFORM f_add_field USING 'DEV_AUTHOR' 'Source Author'      12.
  PERFORM f_add_field USING 'PRD_KORR'   'Target Request'     20.
  PERFORM f_add_field USING 'PRD_VERSNO' 'Target Version'     12.
  PERFORM f_add_field USING 'PRD_DATE'   'Target Date'        10.
  PERFORM f_add_field USING 'PRD_AUTHOR' 'Target Author'      12.
  PERFORM f_add_field USING 'MISMATCH'   'Mismatch'            8.
  PERFORM f_add_field USING 'REMARKS'    'Remarks'            70.

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
