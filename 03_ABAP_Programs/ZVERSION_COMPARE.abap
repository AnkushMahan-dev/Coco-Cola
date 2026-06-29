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
*&                    is the cross-system key.
*&
*&                    An object can be made up of several version-managed
*&                    components. For a program these are the source code
*&                    (VRSD type REPS) and the text elements / text pool
*&                    (VRSD type REPT). Every component is compared and
*&                    the object is flagged as mismatched if ANY of them
*&                    differs; the Remarks state which component differs.
*&           Output : ALV grid with object type, object name, the latest
*&                    version / request / date / author per system (the
*&                    most recent component shown as headline), a
*&                    Mismatch column ('YES' / 'NO') and a Remarks column
*&                    naming the differing component(s).
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

* A version-managed component of an object (e.g. source / text elements)
TYPES: BEGIN OF ty_comp,
         vtype TYPE vrsd-objtype,           " VRSD object type
         label TYPE char20,                 " 'Source' / 'Text elements'
       END OF ty_comp.

* One parsed VRSD row (as returned by RFC_READ_TABLE)
TYPES: BEGIN OF ty_vrsd_row,
         versno TYPE vrsd-versno,
         korr   TYPE vrsd-korrnum,
         author TYPE vrsd-author,
         datum  TYPE vrsd-datum,
         zeit   TYPE vrsd-zeit,
       END OF ty_vrsd_row.

* Latest-version key returned for a single component / system
TYPES: BEGIN OF ty_version,
         versno TYPE vrsd-versno,
         korr   TYPE vrsd-korrnum,
         author TYPE vrsd-author,
         datum  TYPE vrsd-datum,
         zeit   TYPE vrsd-zeit,
         found  TYPE abap_bool,
       END OF ty_version.

TYPES: BEGIN OF ty_output,
         object     TYPE tadir-object,
         obj_name   TYPE tadir-obj_name,
         dev_korr   TYPE vrsd-korrnum,       " Source - latest request
         dev_versno TYPE vrsd-versno,        " Source - latest version no
         dev_date   TYPE vrsd-datum,         " Source - latest date
         dev_author TYPE vrsd-author,        " Source - latest author
         prd_korr   TYPE vrsd-korrnum,       " Target - latest request
         prd_versno TYPE vrsd-versno,        " Target - latest version no
         prd_date   TYPE vrsd-datum,         " Target - latest date
         prd_author TYPE vrsd-author,        " Target - latest author
         mismatch   TYPE char3,              " 'YES' / 'NO'
         remarks    TYPE char100,            " Reason behind the flag
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
        ls_output TYPE ty_output.

  LOOP AT gt_object INTO ls_object.
    CLEAR ls_output.
    PERFORM f_compare_object USING ls_object CHANGING ls_output.
    APPEND ls_output TO gt_output.
  ENDLOOP.

ENDFORM.                    "f_collect_versions

*&---------------------------------------------------------------------*
*&      Form  F_COMPARE_OBJECT
*&---------------------------------------------------------------------*
*  Compares every version-managed component of one object between the
*  source and target systems and builds one output row. Mismatch is YES
*  if ANY component differs; Remarks name the differing component(s).
*----------------------------------------------------------------------*
FORM f_compare_object USING    ps_object TYPE ty_object
                      CHANGING ps_output TYPE ty_output.

  DATA: lt_comp   TYPE STANDARD TABLE OF ty_comp,
        ls_comp   TYPE ty_comp,
        ls_dev    TYPE ty_version,
        ls_prd    TYPE ty_version,
        ls_devhd  TYPE ty_version,          " headline (latest) - source
        ls_prdhd  TYPE ty_version,          " headline (latest) - target
        lv_cdiff  TYPE abap_bool,
        lv_anyhit TYPE abap_bool,           " any component found anywhere
        lv_devany TYPE abap_bool,           " any component found in source
        lv_prdany TYPE abap_bool,           " any component found in target
        lv_labels TYPE string.

  ps_output-object   = ps_object-object.
  ps_output-obj_name = ps_object-obj_name.

* Which version-managed components make up this object type?
  PERFORM f_map_vrsd_types USING ps_object-object CHANGING lt_comp.
  IF lt_comp IS INITIAL.
    ps_output-mismatch = space.
    ps_output-remarks  = 'Object type not mapped for version compare - extend F_MAP_VRSD_TYPES'.
    RETURN.
  ENDIF.

  LOOP AT lt_comp INTO ls_comp.

    PERFORM f_get_version USING ls_comp-vtype ps_object-obj_name p_srfc
                          CHANGING ls_dev.
    PERFORM f_get_version USING ls_comp-vtype ps_object-obj_name p_trfc
                          CHANGING ls_prd.

    IF ls_dev-found = abap_true.
      lv_devany = abap_true. lv_anyhit = abap_true.
      PERFORM f_keep_latest USING ls_dev CHANGING ls_devhd.
    ENDIF.
    IF ls_prd-found = abap_true.
      lv_prdany = abap_true. lv_anyhit = abap_true.
      PERFORM f_keep_latest USING ls_prd CHANGING ls_prdhd.
    ENDIF.

*   Component-level difference?
    CLEAR lv_cdiff.
    IF ls_dev-found <> ls_prd-found.
      lv_cdiff = abap_true.                 " present in one system only
    ELSEIF ls_dev-found = abap_true AND ls_dev-korr <> ls_prd-korr.
      lv_cdiff = abap_true.                 " latest request differs
    ENDIF.

    IF lv_cdiff = abap_true.
      IF lv_labels IS INITIAL.
        lv_labels = ls_comp-label.
      ELSE.
        CONCATENATE lv_labels ls_comp-label INTO lv_labels SEPARATED BY ', '.
      ENDIF.
    ENDIF.

  ENDLOOP.

* Headline columns = most recent component in each system
  ps_output-dev_korr   = ls_devhd-korr.
  ps_output-dev_versno = ls_devhd-versno.
  ps_output-dev_date   = ls_devhd-datum.
  ps_output-dev_author = ls_devhd-author.
  ps_output-prd_korr   = ls_prdhd-korr.
  ps_output-prd_versno = ls_prdhd-versno.
  ps_output-prd_date   = ls_prdhd-datum.
  ps_output-prd_author = ls_prdhd-author.

* Verdict
  IF lv_anyhit = abap_false.
    ps_output-mismatch = gc_no.
    ps_output-remarks  = 'No version history in either system'.

  ELSEIF lv_devany = abap_false.
    ps_output-mismatch = gc_yes.
    ps_output-remarks  = 'No version history in Source - present in Target'.

  ELSEIF lv_prdany = abap_false.
    ps_output-mismatch = gc_yes.
    ps_output-remarks  = 'No version history in Target - present in Source'.

  ELSEIF lv_labels IS NOT INITIAL.
    ps_output-mismatch = gc_yes.
    CONCATENATE 'Difference in:' lv_labels INTO ps_output-remarks
                SEPARATED BY space.

  ELSE.
    ps_output-mismatch = gc_no.
    ps_output-remarks  = 'Identical in both systems'.
  ENDIF.

ENDFORM.                    "f_compare_object

*&---------------------------------------------------------------------*
*&      Form  F_KEEP_LATEST
*&---------------------------------------------------------------------*
*  Keeps the more recent of the current headline and a new component
*  version (by date / time / version number).
*----------------------------------------------------------------------*
FORM f_keep_latest USING    ps_new  TYPE ty_version
                   CHANGING ps_head TYPE ty_version.

  IF ps_head-found = abap_false
     OR ps_new-datum > ps_head-datum
     OR ( ps_new-datum = ps_head-datum AND ps_new-zeit > ps_head-zeit ).
    ps_head = ps_new.
  ENDIF.

ENDFORM.                    "f_keep_latest

*&---------------------------------------------------------------------*
*&      Form  F_GET_VERSION
*&---------------------------------------------------------------------*
*  Reads VRSD for one version-management object type (P_VTYPE) of an
*  object from the system addressed by P_DEST ('NONE' = local) using the
*  standard remote-enabled module RFC_READ_TABLE, returning the latest
*  version entry.
*----------------------------------------------------------------------*
FORM f_get_version USING    p_vtype   TYPE vrsd-objtype
                            p_objname TYPE tadir-obj_name
                            p_dest    TYPE rfcdest
                   CHANGING ps_ver    TYPE ty_version.

  DATA: lv_name    TYPE vrsd-objname,
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
  lv_name = p_objname.

  CONCATENATE `OBJTYPE = '` p_vtype `'` INTO ls_options-text.
  APPEND ls_options TO lt_options.
  CLEAR ls_options.
  CONCATENATE `AND OBJNAME = '` lv_name `'` INTO ls_options-text.
  APPEND ls_options TO lt_options.

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

  SORT lt_rows BY datum DESCENDING zeit DESCENDING versno DESCENDING.

  READ TABLE lt_rows INTO ls_row INDEX 1.
  IF sy-subrc = 0.
    ps_ver-found  = abap_true.
    ps_ver-versno = ls_row-versno.
    ps_ver-korr   = ls_row-korr.
    ps_ver-author = ls_row-author.
    ps_ver-datum  = ls_row-datum.
    ps_ver-zeit   = ls_row-zeit.
  ENDIF.

ENDFORM.                    "f_get_version

*&---------------------------------------------------------------------*
*&      Form  F_MAP_VRSD_TYPES
*&---------------------------------------------------------------------*
*  Returns the version-managed component(s) of a TADIR (R3TR) object type
*  and a readable label per component. A program is compared on both its
*  source code (REPS) and its text elements / text pool (REPT). Returns
*  an empty list when the type is not mapped.
*
*  Extend the CASE for further object types.
*----------------------------------------------------------------------*
FORM f_map_vrsd_types USING    p_objtype TYPE tadir-object
                      CHANGING pt_comp   TYPE STANDARD TABLE.

  DATA: ls_comp TYPE ty_comp.

  REFRESH pt_comp.

  CASE p_objtype.
    WHEN 'PROG'.
      ls_comp-vtype = 'REPS'. ls_comp-label = 'Source'.        APPEND ls_comp TO pt_comp.
      ls_comp-vtype = 'REPT'. ls_comp-label = 'Text elements'. APPEND ls_comp TO pt_comp.
    WHEN 'TABL'.
      ls_comp-vtype = 'TABD'. ls_comp-label = 'Definition'.    APPEND ls_comp TO pt_comp.
    WHEN 'VIEW'.
      ls_comp-vtype = 'VIED'. ls_comp-label = 'Definition'.    APPEND ls_comp TO pt_comp.
    WHEN 'DTEL'.
      ls_comp-vtype = 'DTED'. ls_comp-label = 'Definition'.    APPEND ls_comp TO pt_comp.
    WHEN 'DOMA'.
      ls_comp-vtype = 'DOMD'. ls_comp-label = 'Definition'.    APPEND ls_comp TO pt_comp.
    WHEN 'SHLP'.
      ls_comp-vtype = 'SHLD'. ls_comp-label = 'Definition'.    APPEND ls_comp TO pt_comp.
    WHEN 'TTYP'.
      ls_comp-vtype = 'TTYD'. ls_comp-label = 'Definition'.    APPEND ls_comp TO pt_comp.
    WHEN 'ENQU'.
      ls_comp-vtype = 'ENQD'. ls_comp-label = 'Definition'.    APPEND ls_comp TO pt_comp.
    WHEN 'MSAG'.
      ls_comp-vtype = 'MSAD'. ls_comp-label = 'Definition'.    APPEND ls_comp TO pt_comp.
      ls_comp-vtype = 'MESS'. ls_comp-label = 'Messages'.      APPEND ls_comp TO pt_comp.
    WHEN OTHERS.
*     Not mapped.
  ENDCASE.

ENDFORM.                    "f_map_vrsd_types

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
