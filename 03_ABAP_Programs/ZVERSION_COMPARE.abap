*&---------------------------------------------------------------------*
*& Report  ZVERSION_COMPARE
*&---------------------------------------------------------------------*
*& Purpose : Compare the ACTIVE version of programs between two systems,
*&           a SOURCE system (e.g. development) and a TARGET system (e.g.
*&           production), each reached through its own RFC destination -
*&           so any two systems can be compared without hardcoding either
*&           side.
*&
*&           Input  : Range of object type and object name (no interval),
*&                    plus the source and target RFC destinations.
*&                    Object name is mandatory - the mandatory check is
*&                    raised in START-OF-SELECTION (not via OBLIGATORY).
*&           Source : Object list is read from table TADIR.
*&           Compare: The ACTIVE version of an object is NOT held in the
*&                    version directory (VRSD): VRSD only holds numbered
*&                    historical snapshots, and a target system may have
*&                    none of them even though the active object exists.
*&                    Therefore the active version is identified from the
*&                    source table REPOSRC (R3STATE = 'A'), whose last-
*&                    changed date / author are PRESERVED across transport
*&                    (the target shows the original developer + date, not
*&                    the import time). Both systems are read with the
*&                    standard remote-enabled module RFC_READ_TABLE (no
*&                    custom function module is needed in the target).
*&           Output : ALV grid with object type, object name, the active
*&                    source last-changed date / author per system, a
*&                    Mismatch column ('YES' when the active versions
*&                    differ, 'NO' when identical) and a Remarks column.
*&
*& Scope   : Implemented for programs (PROG - reports / includes). Other
*&           object types are listed with a remark.
*&
*& Prereq  : The target RFC destination's user needs read authorisation
*&           for RFC_READ_TABLE on table REPOSRC.
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

* Active-version key for a single object / system
TYPES: BEGIN OF ty_active,
         chg_date  TYPE sydatum,            " active source last changed on
         chg_user  TYPE syuname,            " active source last changed by
         found     TYPE abap_bool,          " active object exists
         supported TYPE abap_bool,          " object type supported
       END OF ty_active.

TYPES: BEGIN OF ty_output,
         object     TYPE tadir-object,      " Object type
         obj_name   TYPE tadir-obj_name,    " Object name
         dev_date   TYPE sydatum,           " Source - active changed on
         dev_user   TYPE syuname,           " Source - active changed by
         prd_date   TYPE sydatum,           " Target - active changed on
         prd_user   TYPE syuname,           " Target - active changed by
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
SELECT-OPTIONS: s_object FOR tadir-object   NO INTERVALS.
SELECT-OPTIONS: s_objnam FOR tadir-obj_name NO INTERVALS.
SELECTION-SCREEN END OF BLOCK b1.

SELECTION-SCREEN BEGIN OF BLOCK b2 WITH FRAME TITLE text-002.
* 'NONE' is the self-referencing destination = the local logon system.
PARAMETERS: p_srfc TYPE rfcdest OBLIGATORY DEFAULT 'NONE'.
PARAMETERS: p_trfc TYPE rfcdest OBLIGATORY.
SELECTION-SCREEN END OF BLOCK b2.

*&---------------------------------------------------------------------*
*& Start of selection
*&---------------------------------------------------------------------*
START-OF-SELECTION.

  IF s_objnam[] IS INITIAL.
    MESSAGE 'Object name is mandatory' TYPE 'E'.
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
FORM f_collect_versions.

  DATA: ls_object TYPE ty_object,
        ls_output TYPE ty_output,
        ls_dev    TYPE ty_active,
        ls_prd    TYPE ty_active.

  LOOP AT gt_object INTO ls_object.

    CLEAR: ls_output, ls_dev, ls_prd.

*   Active version in the SOURCE system
    PERFORM f_get_active USING ls_object-object ls_object-obj_name p_srfc
                         CHANGING ls_dev.
*   Active version in the TARGET system
    PERFORM f_get_active USING ls_object-object ls_object-obj_name p_trfc
                         CHANGING ls_prd.

    ls_output-object   = ls_object-object.
    ls_output-obj_name = ls_object-obj_name.
    ls_output-dev_date = ls_dev-chg_date.
    ls_output-dev_user = ls_dev-chg_user.
    ls_output-prd_date = ls_prd-chg_date.
    ls_output-prd_user = ls_prd-chg_user.

    PERFORM f_evaluate_mismatch USING ls_dev ls_prd
                                CHANGING ls_output-mismatch ls_output-remarks.

    APPEND ls_output TO gt_output.

  ENDLOOP.

ENDFORM.                    "f_collect_versions

*&---------------------------------------------------------------------*
*&      Form  F_EVALUATE_MISMATCH
*&---------------------------------------------------------------------*
*  Compares the active version (last-changed date + author) of the two
*  systems:
*    Condition                                  Mismatch  Remarks
*    Object type not supported                  (blank)   reason text
*    Active source differs                      YES       reason text
*    Active source identical                    NO        reason text
*    Object exists in only one system           YES       reason text
*    Object missing in both systems             NO        reason text
*----------------------------------------------------------------------*
FORM f_evaluate_mismatch USING    ps_dev  TYPE ty_active
                                  ps_prd  TYPE ty_active
                         CHANGING pv_flag TYPE char3
                                  pv_rem  TYPE char100.

  CLEAR: pv_flag, pv_rem.

  IF ps_dev-supported = abap_false.
    pv_flag = space.
    pv_rem  = 'Object type not supported - active compare covers programs (PROG)'.
    RETURN.
  ENDIF.

  IF ps_dev-found = abap_false AND ps_prd-found = abap_false.
    pv_flag = gc_no.
    pv_rem  = 'Program does not exist in either system'.

  ELSEIF ps_dev-found = abap_true AND ps_prd-found = abap_false.
    pv_flag = gc_yes.
    pv_rem  = 'Program exists in Source only - missing in Target'.

  ELSEIF ps_dev-found = abap_false AND ps_prd-found = abap_true.
    pv_flag = gc_yes.
    pv_rem  = 'Program exists in Target only - missing in Source'.

  ELSEIF ps_dev-chg_date = ps_prd-chg_date AND ps_dev-chg_user = ps_prd-chg_user.
    pv_flag = gc_no.
    pv_rem  = 'Active version identical (same last change in both systems)'.

  ELSE.
    pv_flag = gc_yes.
    pv_rem  = 'Active version differs (different last change)'.

  ENDIF.

ENDFORM.                    "f_evaluate_mismatch

*&---------------------------------------------------------------------*
*&      Form  F_GET_ACTIVE
*&---------------------------------------------------------------------*
*  Reads the active source last-changed date / author of an object from
*  the system addressed by P_DEST ('NONE' = local) using the standard
*  remote-enabled module RFC_READ_TABLE on REPOSRC (R3STATE = 'A').
*
*  Implemented for programs (PROG). For other object types SUPPORTED is
*  returned as false so the row carries an explanatory remark.
*----------------------------------------------------------------------*
FORM f_get_active USING    p_objtype TYPE tadir-object
                           p_objname TYPE tadir-obj_name
                           p_dest    TYPE rfcdest
                  CHANGING ps_act    TYPE ty_active.

  DATA: lv_name    TYPE reposrc-progname,
        lt_options TYPE STANDARD TABLE OF rfc_db_opt,
        lt_fields  TYPE STANDARD TABLE OF rfc_db_fld,
        lt_data    TYPE STANDARD TABLE OF tab512,
        ls_options TYPE rfc_db_opt,
        ls_fields  TYPE rfc_db_fld,
        ls_data    TYPE tab512,
        lv_msg     TYPE char200.

  CLEAR ps_act.

  IF p_objtype <> 'PROG'.
    ps_act-supported = abap_false.
    RETURN.
  ENDIF.
  ps_act-supported = abap_true.
  lv_name          = p_objname.

* WHERE PROGNAME = '<name>' AND R3STATE = 'A'
  CONCATENATE `PROGNAME = '` lv_name `'` INTO ls_options-text.
  APPEND ls_options TO lt_options.
  CLEAR ls_options.
  ls_options-text = `AND R3STATE = 'A'`.
  APPEND ls_options TO lt_options.

  ls_fields-fieldname = 'UNAM'. APPEND ls_fields TO lt_fields.
  ls_fields-fieldname = 'UDAT'. APPEND ls_fields TO lt_fields.

  CALL FUNCTION 'RFC_READ_TABLE'
    DESTINATION p_dest
    EXPORTING
      query_table           = 'REPOSRC'
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

  READ TABLE lt_data INTO ls_data INDEX 1.
  IF sy-subrc = 0.
    ps_act-found = abap_true.
    SPLIT ls_data-wa AT '|' INTO ps_act-chg_user ps_act-chg_date.
  ENDIF.

ENDFORM.                    "f_get_active

*&---------------------------------------------------------------------*
*&      Form  F_DISPLAY_ALV
*&---------------------------------------------------------------------*
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
FORM f_build_fieldcat.

  CLEAR gt_fieldc.

  PERFORM f_add_field USING 'OBJECT'   'Object Type'        10.
  PERFORM f_add_field USING 'OBJ_NAME' 'Object Name'        40.
  PERFORM f_add_field USING 'DEV_DATE' 'Source Changed On'  14.
  PERFORM f_add_field USING 'DEV_USER' 'Source Changed By'  14.
  PERFORM f_add_field USING 'PRD_DATE' 'Target Changed On'  14.
  PERFORM f_add_field USING 'PRD_USER' 'Target Changed By'  14.
  PERFORM f_add_field USING 'MISMATCH' 'Mismatch'            8.
  PERFORM f_add_field USING 'REMARKS'  'Remarks'            70.

ENDFORM.                    "f_build_fieldcat

*&---------------------------------------------------------------------*
*&      Form  F_ADD_FIELD
*&---------------------------------------------------------------------*
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
