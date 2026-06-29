*&---------------------------------------------------------------------*
*& Report  ZVERSION_COMPARE
*&---------------------------------------------------------------------*
*& Purpose : Compare the version of objects between two systems, a
*&           SOURCE system (e.g. development) and a TARGET system (e.g.
*&           production), each reached through its own RFC destination.
*&
*&           Input  : Range of object type and object name (no interval),
*&                    plus the source and target RFC destinations.
*&                    Object name is mandatory - checked in
*&                    START-OF-SELECTION (not via OBLIGATORY).
*&           Source : Object list is read from table TADIR (R3TR + LIMU).
*&           Read   : LOCAL system (destination NONE / blank) is read with
*&                    a direct SELECT; a REMOTE system with the standard
*&                    remote-enabled module RFC_READ_TABLE. Remote read
*&                    errors (authorisation, field, ...) are reported in
*&                    Remarks instead of being mistaken for "missing".
*&           Compare: Each object type maps to a LIST of version
*&                    components (VRSD object types). All are queried and
*&                    the latest is aggregated. Two methods with fallback:
*&                      1. VRSD    - latest version (KORRNUM), used when
*&                                   BOTH systems have version rows.
*&                      2. REPOSRC - active source (last-changed date /
*&                                   author, preserved across transport),
*&                                   fallback for program-source objects
*&                                   when VRSD is not available in both.
*&           Log    : Every run is logged to table ZVERSION_CMP_LOG.
*&           Output : ALV grid (object type, name, method, request / date
*&                    / author per system, Mismatch, Remarks).
*&
*& Coverage: PROG, REPS, DYNP, VIED/VIEW, CLAS, FUGR, INTF, DOMA, DTEL,
*&           ENQU, SHLP, TABL, TTYP, ENHO, ENHS, TRAN, MSAG.
*&           Only program source (PROG/REPS) has the REPOSRC active
*&           fallback; other types rely on the version directory VRSD
*&           being present in both systems.
*&
*& Prereq  : - Create transparent table ZVERSION_CMP_LOG (see the .txt).
*&           - The target RFC user needs RFC_READ_TABLE read auth on
*&             VRSD and REPOSRC.
*&
*& Release : Classic ABAP, compatible with SAP ECC 6.x.
*&---------------------------------------------------------------------*
REPORT zversion_compare LINE-SIZE 255.

TABLES: tadir.

*&---------------------------------------------------------------------*
*& Types
*&---------------------------------------------------------------------*
TYPES: ty_vtype_tab TYPE STANDARD TABLE OF vrsd-objtype WITH DEFAULT KEY.

TYPES: BEGIN OF ty_object,
         pgmid    TYPE tadir-pgmid,
         object   TYPE tadir-object,
         obj_name TYPE tadir-obj_name,
       END OF ty_object.

TYPES: BEGIN OF ty_vrsd_row,
         versno TYPE vrsd-versno,
         korr   TYPE vrsd-korrnum,
         author TYPE vrsd-author,
         datum  TYPE vrsd-datum,
         zeit   TYPE vrsd-zeit,
       END OF ty_vrsd_row.

* Normalised version key for one object / system
TYPES: BEGIN OF ty_ver,
         req    TYPE vrsd-korrnum,
         date   TYPE sydatum,
         user   TYPE syuname,
         found  TYPE abap_bool,
         rc     TYPE sysubrc,
         rctext TYPE char40,
       END OF ty_ver.

TYPES: BEGIN OF ty_output,
         object     TYPE tadir-object,
         obj_name   TYPE tadir-obj_name,
         method     TYPE char10,
         dev_req    TYPE vrsd-korrnum,
         dev_date   TYPE sydatum,
         dev_user   TYPE syuname,
         prd_req    TYPE vrsd-korrnum,
         prd_date   TYPE sydatum,
         prd_user   TYPE syuname,
         mismatch   TYPE char3,
         remarks    TYPE char100,
       END OF ty_output.

*&---------------------------------------------------------------------*
*& Global data
*&---------------------------------------------------------------------*
DATA: gt_object TYPE STANDARD TABLE OF ty_object,
      gt_output TYPE STANDARD TABLE OF ty_output,
      gt_log    TYPE STANDARD TABLE OF zversion_cmp_log,
      gt_fieldc TYPE slis_t_fieldcat_alv,
      gs_layout TYPE slis_layout_alv.

CONSTANTS: gc_yes     TYPE char3   VALUE 'YES',
           gc_no      TYPE char3   VALUE 'NO',
           gc_vrsd    TYPE char10  VALUE 'VRSD',
           gc_reposrc TYPE char10  VALUE 'REPOSRC',
           gc_none    TYPE rfcdest VALUE 'NONE'.

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
  PERFORM f_save_log.

END-OF-SELECTION.

  PERFORM f_display_alv.

*&---------------------------------------------------------------------*
*&      Form  F_READ_TADIR
*&---------------------------------------------------------------------*
FORM f_read_tadir.

  SELECT pgmid object obj_name
    FROM tadir
    INTO TABLE gt_object
    WHERE pgmid    IN ('R3TR','LIMU')
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
        ls_log    TYPE zversion_cmp_log.

  LOOP AT gt_object INTO ls_object.

    CLEAR ls_output.
    PERFORM f_compare_object USING ls_object CHANGING ls_output.
    APPEND ls_output TO gt_output.

    CLEAR ls_log.
    CALL FUNCTION 'GUID_CREATE'
      IMPORTING
        ev_guid_32 = ls_log-logid.
    ls_log-run_date = sy-datum.
    ls_log-run_time = sy-uzeit.
    ls_log-run_user = sy-uname.
    ls_log-src_dest = p_srfc.
    ls_log-tgt_dest = p_trfc.
    ls_log-object   = ls_output-object.
    ls_log-obj_name = ls_output-obj_name.
    ls_log-method   = ls_output-method.
    ls_log-src_req  = ls_output-dev_req.
    ls_log-src_date = ls_output-dev_date.
    ls_log-src_user = ls_output-dev_user.
    ls_log-tgt_req  = ls_output-prd_req.
    ls_log-tgt_date = ls_output-prd_date.
    ls_log-tgt_user = ls_output-prd_user.
    ls_log-mismatch = ls_output-mismatch.
    ls_log-remarks  = ls_output-remarks.
    APPEND ls_log TO gt_log.

  ENDLOOP.

ENDFORM.                    "f_collect_versions

*&---------------------------------------------------------------------*
*&      Form  F_COMPARE_OBJECT
*&---------------------------------------------------------------------*
FORM f_compare_object USING    ps_object TYPE ty_object
                      CHANGING ps_output TYPE ty_output.

  DATA: lt_vtypes    TYPE ty_vtype_tab,
        lv_reposr_ok TYPE abap_bool,
        ls_dev       TYPE ty_ver,
        ls_prd       TYPE ty_ver,
        lv_method    TYPE char10.

  ps_output-object   = ps_object-object.
  ps_output-obj_name = ps_object-obj_name.

  PERFORM f_map_components USING ps_object-object
                           CHANGING lt_vtypes lv_reposr_ok.

  IF lt_vtypes IS INITIAL AND lv_reposr_ok = abap_false.
    ps_output-mismatch = space.
    ps_output-remarks  = 'Object type not supported - extend F_MAP_COMPONENTS'.
    RETURN.
  ENDIF.

  CLEAR lv_method.

* --- Method 1: VRSD (only when usable in BOTH systems) ----------------
  IF lt_vtypes IS NOT INITIAL.
    PERFORM f_get_vrsd_agg USING ps_object-obj_name lt_vtypes p_srfc CHANGING ls_dev.
    PERFORM f_get_vrsd_agg USING ps_object-obj_name lt_vtypes p_trfc CHANGING ls_prd.
    IF ls_dev-found = abap_true AND ls_prd-found = abap_true.
      lv_method = gc_vrsd.
    ENDIF.
  ENDIF.

* --- Method 2: REPOSRC fallback (active source) -----------------------
  IF lv_method IS INITIAL AND lv_reposr_ok = abap_true.
    PERFORM f_get_reposrc USING ps_object-obj_name p_srfc CHANGING ls_dev.
    PERFORM f_get_reposrc USING ps_object-obj_name p_trfc CHANGING ls_prd.
    lv_method = gc_reposrc.
  ENDIF.

  IF lv_method IS INITIAL.
    lv_method = gc_vrsd.
  ENDIF.

  ps_output-method   = lv_method.
  ps_output-dev_req  = ls_dev-req.
  ps_output-dev_date = ls_dev-date.
  ps_output-dev_user = ls_dev-user.
  ps_output-prd_req  = ls_prd-req.
  ps_output-prd_date = ls_prd-date.
  ps_output-prd_user = ls_prd-user.

  PERFORM f_evaluate USING ls_dev ls_prd lv_method
                     CHANGING ps_output-mismatch ps_output-remarks.

ENDFORM.                    "f_compare_object

*&---------------------------------------------------------------------*
*&      Form  F_EVALUATE
*&---------------------------------------------------------------------*
FORM f_evaluate USING    ps_dev   TYPE ty_ver
                         ps_prd   TYPE ty_ver
                         p_method TYPE char10
                CHANGING pv_flag  TYPE char3
                         pv_rem   TYPE char100.

  DATA: lv_same TYPE abap_bool.

  CLEAR: pv_flag, pv_rem.

  IF ps_dev-rc <> 0 OR ps_prd-rc <> 0.
    pv_flag = space.
    CONCATENATE 'Read error - Source:' ps_dev-rctext
                'Target:' ps_prd-rctext
                INTO pv_rem SEPARATED BY space.
    RETURN.
  ENDIF.

  IF ps_dev-found = abap_false AND ps_prd-found = abap_false.
    pv_flag = gc_no.
    pv_rem  = 'Object does not exist in either system'.
    RETURN.
  ELSEIF ps_dev-found = abap_true AND ps_prd-found = abap_false.
    pv_flag = gc_yes.
    pv_rem  = 'Object exists in Source only - missing in Target'.
    RETURN.
  ELSEIF ps_dev-found = abap_false AND ps_prd-found = abap_true.
    pv_flag = gc_yes.
    pv_rem  = 'Object exists in Target only - missing in Source'.
    RETURN.
  ENDIF.

  IF p_method = gc_vrsd.
    IF ps_dev-req = ps_prd-req.
      lv_same = abap_true.
    ENDIF.
  ELSE.
    IF ps_dev-date = ps_prd-date AND ps_dev-user = ps_prd-user.
      lv_same = abap_true.
    ENDIF.
  ENDIF.

  IF lv_same = abap_true.
    pv_flag = gc_no.
    IF p_method = gc_vrsd.
      pv_rem = 'Latest transport request identical in both systems'.
    ELSE.
      pv_rem = 'Active version identical in both systems'.
    ENDIF.
  ELSE.
    pv_flag = gc_yes.
    IF p_method = gc_vrsd.
      pv_rem = 'Latest transport request differs between Source and Target'.
    ELSE.
      pv_rem = 'Active version differs between Source and Target'.
    ENDIF.
  ENDIF.

ENDFORM.                    "f_evaluate

*&---------------------------------------------------------------------*
*&      Form  F_GET_VRSD_AGG
*&---------------------------------------------------------------------*
*  Reads every version component (VRSD object type) and keeps the latest
*  entry across them. A read error on any component is propagated.
*----------------------------------------------------------------------*
FORM f_get_vrsd_agg USING    p_objname TYPE tadir-obj_name
                             pt_vtypes TYPE ty_vtype_tab
                             p_dest    TYPE rfcdest
                    CHANGING ps_agg    TYPE ty_ver.

  DATA: lv_vtype TYPE vrsd-objtype,
        ls_one   TYPE ty_ver.

  CLEAR ps_agg.

  LOOP AT pt_vtypes INTO lv_vtype.

    PERFORM f_get_vrsd USING lv_vtype p_objname p_dest CHANGING ls_one.

    IF ls_one-rc <> 0 AND ps_agg-rc = 0.
      ps_agg-rc     = ls_one-rc.
      ps_agg-rctext = ls_one-rctext.
    ENDIF.

    IF ls_one-found = abap_true.
      IF ps_agg-found = abap_false OR ls_one-date > ps_agg-date.
        ps_agg-found = abap_true.
        ps_agg-req   = ls_one-req.
        ps_agg-date  = ls_one-date.
        ps_agg-user  = ls_one-user.
      ENDIF.
    ENDIF.

  ENDLOOP.

ENDFORM.                    "f_get_vrsd_agg

*&---------------------------------------------------------------------*
*&      Form  F_GET_VRSD
*&---------------------------------------------------------------------*
*  Latest VRSD entry of one version type. Local = direct SELECT;
*  remote = RFC_READ_TABLE.
*----------------------------------------------------------------------*
FORM f_get_vrsd USING    p_vtype   TYPE vrsd-objtype
                         p_objname TYPE tadir-obj_name
                         p_dest    TYPE rfcdest
                CHANGING ps_ver    TYPE ty_ver.

  DATA: lv_name    TYPE vrsd-objname,
        lt_vrsd    TYPE STANDARD TABLE OF vrsd,
        ls_vrsd    TYPE vrsd,
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

  IF p_dest IS INITIAL OR p_dest = gc_none.

*   --- Local: direct SELECT ----------------------------------------
    SELECT * FROM vrsd INTO TABLE lt_vrsd
      WHERE objtype = p_vtype
        AND objname = lv_name.
    IF lt_vrsd IS INITIAL.
      RETURN.
    ENDIF.
    SORT lt_vrsd BY datum DESCENDING zeit DESCENDING versno DESCENDING.
    READ TABLE lt_vrsd INTO ls_vrsd INDEX 1.
    ps_ver-found = abap_true.
    ps_ver-req   = ls_vrsd-korrnum.
    ps_ver-date  = ls_vrsd-datum.
    ps_ver-user  = ls_vrsd-author.
    RETURN.

  ENDIF.

* --- Remote: RFC_READ_TABLE -----------------------------------------
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

  ps_ver-rc = sy-subrc.
  IF sy-subrc <> 0.
    PERFORM f_rc_text USING sy-subrc 'VRSD' CHANGING ps_ver-rctext.
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
    ps_ver-found = abap_true.
    ps_ver-req   = ls_row-korr.
    ps_ver-date  = ls_row-datum.
    ps_ver-user  = ls_row-author.
  ENDIF.

ENDFORM.                    "f_get_vrsd

*&---------------------------------------------------------------------*
*&      Form  F_GET_REPOSRC
*&---------------------------------------------------------------------*
*  Active source last-changed date / author. Local = direct SELECT;
*  remote = RFC_READ_TABLE.
*----------------------------------------------------------------------*
FORM f_get_reposrc USING    p_objname TYPE tadir-obj_name
                            p_dest    TYPE rfcdest
                   CHANGING ps_ver    TYPE ty_ver.

  DATA: lv_name    TYPE reposrc-progname,
        lt_options TYPE STANDARD TABLE OF rfc_db_opt,
        lt_fields  TYPE STANDARD TABLE OF rfc_db_fld,
        lt_data    TYPE STANDARD TABLE OF tab512,
        ls_options TYPE rfc_db_opt,
        ls_fields  TYPE rfc_db_fld,
        ls_data    TYPE tab512,
        lv_msg     TYPE char200.

  CLEAR ps_ver.
  lv_name = p_objname.

  IF p_dest IS INITIAL OR p_dest = gc_none.

*   --- Local: direct SELECT ----------------------------------------
    SELECT SINGLE unam udat FROM reposrc
      INTO (ps_ver-user, ps_ver-date)
      WHERE progname = lv_name
        AND r3state  = 'A'.
    IF sy-subrc = 0.
      ps_ver-found = abap_true.
    ENDIF.
    RETURN.

  ENDIF.

* --- Remote: RFC_READ_TABLE -----------------------------------------
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

  ps_ver-rc = sy-subrc.
  IF sy-subrc <> 0.
    PERFORM f_rc_text USING sy-subrc 'REPOSRC' CHANGING ps_ver-rctext.
    RETURN.
  ENDIF.

  READ TABLE lt_data INTO ls_data INDEX 1.
  IF sy-subrc = 0.
    ps_ver-found = abap_true.
    SPLIT ls_data-wa AT '|' INTO ps_ver-user ps_ver-date.
  ENDIF.

ENDFORM.                    "f_get_reposrc

*&---------------------------------------------------------------------*
*&      Form  F_RC_TEXT
*&---------------------------------------------------------------------*
FORM f_rc_text USING    p_rc    TYPE sysubrc
                        p_table TYPE c
               CHANGING p_text  TYPE char40.

  DATA lv_reason TYPE char30.

  CASE p_rc.
    WHEN 1. lv_reason = 'table_not_available'.
    WHEN 2. lv_reason = 'option_not_valid'.
    WHEN 3. lv_reason = 'field_not_valid'.
    WHEN 4. lv_reason = 'not_authorized'.
    WHEN 5. lv_reason = 'data_buffer_exceeded'.
    WHEN 6. lv_reason = 'communication_failure'.
    WHEN 7. lv_reason = 'system_failure'.
    WHEN OTHERS. lv_reason = 'other'.
  ENDCASE.

  CONCATENATE p_table lv_reason INTO p_text SEPARATED BY space.

ENDFORM.                    "f_rc_text

*&---------------------------------------------------------------------*
*&      Form  F_MAP_COMPONENTS
*&---------------------------------------------------------------------*
*  Returns the VRSD version component(s) of an object type and whether
*  the REPOSRC active-source fallback applies (program-source objects).
*  Composite objects (CLAS, FUGR) map to several components.
*----------------------------------------------------------------------*
FORM f_map_components USING    p_objtype  TYPE tadir-object
                      CHANGING pt_vtypes  TYPE ty_vtype_tab
                               p_reposrok TYPE abap_bool.

  DATA lv_v TYPE vrsd-objtype.

  REFRESH pt_vtypes.
  CLEAR p_reposrok.

  CASE p_objtype.

*   --- programs / report source ------------------------------------
    WHEN 'PROG'.
      lv_v = 'REPS'. APPEND lv_v TO pt_vtypes.
      lv_v = 'REPT'. APPEND lv_v TO pt_vtypes.   " text elements
      p_reposrok = abap_true.
    WHEN 'REPS'.
      lv_v = 'REPS'. APPEND lv_v TO pt_vtypes.
      p_reposrok = abap_true.

*   --- screens -----------------------------------------------------
    WHEN 'DYNP'.
      lv_v = 'DYNP'. APPEND lv_v TO pt_vtypes.

*   --- classes (composite) -----------------------------------------
    WHEN 'CLAS'.
      lv_v = 'CLSD'. APPEND lv_v TO pt_vtypes.   " definition
      lv_v = 'CPUB'. APPEND lv_v TO pt_vtypes.   " public section
      lv_v = 'CPRO'. APPEND lv_v TO pt_vtypes.   " protected section
      lv_v = 'CPRI'. APPEND lv_v TO pt_vtypes.   " private section
      lv_v = 'CINC'. APPEND lv_v TO pt_vtypes.   " class includes
      lv_v = 'METH'. APPEND lv_v TO pt_vtypes.   " methods

*   --- function groups (composite) ---------------------------------
    WHEN 'FUGR'.
      lv_v = 'FUNC'. APPEND lv_v TO pt_vtypes.   " function modules
      lv_v = 'REPS'. APPEND lv_v TO pt_vtypes.   " group includes

*   --- interface ---------------------------------------------------
    WHEN 'INTF'.
      lv_v = 'INTD'. APPEND lv_v TO pt_vtypes.

*   --- dictionary --------------------------------------------------
    WHEN 'TABL'.
      lv_v = 'TABD'. APPEND lv_v TO pt_vtypes.   " definition
      lv_v = 'TABT'. APPEND lv_v TO pt_vtypes.   " technical settings
    WHEN 'VIEW' OR 'VIED'.
      lv_v = 'VIED'. APPEND lv_v TO pt_vtypes.
    WHEN 'DTEL'.
      lv_v = 'DTED'. APPEND lv_v TO pt_vtypes.
    WHEN 'DOMA'.
      lv_v = 'DOMD'. APPEND lv_v TO pt_vtypes.
    WHEN 'SHLP'.
      lv_v = 'SHLD'. APPEND lv_v TO pt_vtypes.
    WHEN 'TTYP'.
      lv_v = 'TTYD'. APPEND lv_v TO pt_vtypes.
    WHEN 'ENQU'.
      lv_v = 'ENQD'. APPEND lv_v TO pt_vtypes.
    WHEN 'MSAG'.
      lv_v = 'MSAD'. APPEND lv_v TO pt_vtypes.   " message class
      lv_v = 'MESS'. APPEND lv_v TO pt_vtypes.   " single messages

*   --- enhancements ------------------------------------------------
    WHEN 'ENHO'.
      lv_v = 'ENHO'. APPEND lv_v TO pt_vtypes.
    WHEN 'ENHS'.
      lv_v = 'ENHS'. APPEND lv_v TO pt_vtypes.

*   --- transaction -------------------------------------------------
    WHEN 'TRAN'.
      lv_v = 'TRAN'. APPEND lv_v TO pt_vtypes.

    WHEN OTHERS.
*     Not mapped.
  ENDCASE.

ENDFORM.                    "f_map_components

*&---------------------------------------------------------------------*
*&      Form  F_SAVE_LOG
*&---------------------------------------------------------------------*
FORM f_save_log.

  IF gt_log IS INITIAL.
    RETURN.
  ENDIF.

  INSERT zversion_cmp_log FROM TABLE gt_log ACCEPTING DUPLICATE KEYS.
  IF sy-subrc = 0.
    COMMIT WORK.
  ELSE.
    ROLLBACK WORK.
  ENDIF.

ENDFORM.                    "f_save_log

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

  PERFORM f_add_field USING 'OBJECT'   'Object Type'      10.
  PERFORM f_add_field USING 'OBJ_NAME' 'Object Name'      40.
  PERFORM f_add_field USING 'METHOD'   'Method'           10.
  PERFORM f_add_field USING 'DEV_REQ'  'Source Request'   20.
  PERFORM f_add_field USING 'DEV_DATE' 'Source Date'      14.
  PERFORM f_add_field USING 'DEV_USER' 'Source By'        14.
  PERFORM f_add_field USING 'PRD_REQ'  'Target Request'   20.
  PERFORM f_add_field USING 'PRD_DATE' 'Target Date'      14.
  PERFORM f_add_field USING 'PRD_USER' 'Target By'        14.
  PERFORM f_add_field USING 'MISMATCH' 'Mismatch'          8.
  PERFORM f_add_field USING 'REMARKS'  'Remarks'          70.

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
