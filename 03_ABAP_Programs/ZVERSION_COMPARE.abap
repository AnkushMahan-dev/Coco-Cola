*&---------------------------------------------------------------------*
*& Report  ZVERSION_COMPARE
*&---------------------------------------------------------------------*
*& Purpose : Compare the version of objects between two systems (SOURCE
*&           vs TARGET) via two RFC destinations. For composite objects
*&           the sub-objects are expanded and compared individually:
*&             PROG -> its includes (table D010INC)
*&             FUGR -> its function modules (table TFDIR) + main pool
*&             CLAS -> class sections / pool ; INTF -> interface pool
*&
*&           Read : LOCAL system (destination NONE / blank) via direct
*&                  SELECT; REMOTE via the standard remote-enabled module
*&                  RFC_READ_TABLE (no custom FM in the target). Remote
*&                  read errors are reported in Remarks.
*&           Two methods with fallback:
*&             1. VRSD    - latest version directory entry (KORRNUM).
*&             2. REPOSRC - active source (last-changed date / author,
*&                          preserved across transport). For programs and
*&                          for the generated pool of FUGR (SAPL<area>),
*&                          CLAS (<class>...CP) and INTF (<intf>...IU).
*&           Log  : Every run is logged to table ZVERSION_CMP_LOG.
*&           Output: ALV (parent, kind, object, name, method, request /
*&                   date / author per system, Mismatch, Remarks).
*&
*& Note    : Sub-object expansion (includes / function modules) reads the
*&           structure from the LOCAL system, so run with the SOURCE as
*&           the local logon system (P_SRFC = NONE).
*&
*& Prereq  : Create table ZVERSION_CMP_LOG (see the .txt). The target RFC
*&           user needs RFC_READ_TABLE auth on VRSD and REPOSRC.
*&
*& Release : Classic ABAP, compatible with SAP ECC 6.x.
*&---------------------------------------------------------------------*
REPORT zversion_compare LINE-SIZE 255.

TABLES: tadir.

*&---------------------------------------------------------------------*
*& Types
*&---------------------------------------------------------------------*
TYPES: ty_vtype_tab TYPE STANDARD TABLE OF vrsd-objtype WITH DEFAULT KEY.
TYPES: ty_vrsd_tab  TYPE STANDARD TABLE OF vrsd          WITH DEFAULT KEY.
TYPES: ty_src_tab   TYPE STANDARD TABLE OF abaptxt255    WITH DEFAULT KEY.

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

TYPES: BEGIN OF ty_ver,
         req    TYPE vrsd-korrnum,
         date   TYPE sydatum,
         user   TYPE syuname,
         found  TYPE abap_bool,
         rc     TYPE sysubrc,
         rctext TYPE char80,
       END OF ty_ver.

TYPES: BEGIN OF ty_output,
         parent     TYPE tadir-obj_name,
         kind       TYPE char10,            " MAIN / INCLUDE / FUNCTION
         object     TYPE tadir-object,
         obj_name   TYPE tadir-obj_name,
         method     TYPE char10,
         dev_req    TYPE vrsd-korrnum,
         dev_date   TYPE sydatum,
         dev_user   TYPE syuname,
         prd_req    TYPE vrsd-korrnum,
         prd_date   TYPE sydatum,
         prd_user   TYPE syuname,
         mismatch   TYPE char15,           " Status (Match / TR Mismatch...)
         tr_mism    TYPE char3,            " 'YES' only when TR differs
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

  DATA: ls_object TYPE ty_object.

  LOOP AT gt_object INTO ls_object.
    PERFORM f_process_object USING ls_object.
  ENDLOOP.

  PERFORM f_build_log.

ENDFORM.                    "f_collect_versions

*&---------------------------------------------------------------------*
*&      Form  F_PROCESS_OBJECT
*&---------------------------------------------------------------------*
*  Builds the main row for an object and, for composite objects, the
*  sub-object rows (includes / function modules).
*----------------------------------------------------------------------*
FORM f_process_object USING ps_object TYPE ty_object.

  DATA: lt_v     TYPE ty_vtype_tab,
        lv_pool  TYPE programm,
        lv_vname TYPE tadir-obj_name,
        lv_rname TYPE tadir-obj_name,
        lv_repsok TYPE abap_bool.

  CASE ps_object-object.

    WHEN 'PROG' OR 'REPS'.
      REFRESH lt_v.
      APPEND 'REPS' TO lt_v.
      APPEND 'REPT' TO lt_v.
      PERFORM f_add_result USING ps_object-object ps_object-obj_name
                                 ps_object-obj_name 'MAIN'
                                 lt_v ps_object-obj_name ps_object-obj_name.
      PERFORM f_expand_prog USING ps_object-obj_name.

    WHEN 'FUGR'.
      PERFORM f_ns_build USING ps_object-obj_name 'SAPL' space CHANGING lv_pool.
      lv_vname = lv_pool.
      lv_rname = lv_pool.
      REFRESH lt_v.
      APPEND 'REPS' TO lt_v.
      PERFORM f_add_result USING 'FUGR' ps_object-obj_name
                                 ps_object-obj_name 'MAIN'
                                 lt_v lv_vname lv_rname.
      PERFORM f_expand_fugr USING ps_object-obj_name.

    WHEN 'CLAS'.
      PERFORM f_pool_name USING ps_object-obj_name 'CP' CHANGING lv_pool.
      lv_vname = ps_object-obj_name.
      lv_rname = lv_pool.
      REFRESH lt_v.
      APPEND 'CLSD' TO lt_v.
      APPEND 'CPUB' TO lt_v.
      APPEND 'CPRO' TO lt_v.
      APPEND 'CPRI' TO lt_v.
      APPEND 'CINC' TO lt_v.
      PERFORM f_add_result USING 'CLAS' ps_object-obj_name
                                 ps_object-obj_name 'MAIN'
                                 lt_v lv_vname lv_rname.
*     Method changes are covered by the class includes (CINC) above.
*     Per-method rows are not produced: methods are not reliably keyed
*     in version management and a target without a version database has
*     nothing to read for them.

    WHEN 'INTF'.
      PERFORM f_pool_name USING ps_object-obj_name 'IU' CHANGING lv_pool.
      lv_vname = ps_object-obj_name.
      lv_rname = lv_pool.
      REFRESH lt_v.
      APPEND 'INTD' TO lt_v.
      PERFORM f_add_result USING 'INTF' ps_object-obj_name
                                 ps_object-obj_name 'MAIN'
                                 lt_v lv_vname lv_rname.

    WHEN OTHERS.
      PERFORM f_map_components USING ps_object-object
                              CHANGING lt_v lv_repsok.
      PERFORM f_add_result USING ps_object-object ps_object-obj_name
                                 ps_object-obj_name 'MAIN'
                                 lt_v ps_object-obj_name space.

  ENDCASE.

ENDFORM.                    "f_process_object

*&---------------------------------------------------------------------*
*&      Form  F_EXPAND_PROG
*&---------------------------------------------------------------------*
*  One row per include used by the program (table D010INC, local read).
*----------------------------------------------------------------------*
FORM f_expand_prog USING p_prog TYPE tadir-obj_name.

  DATA: lt_inc    TYPE STANDARD TABLE OF d010inc-include,
        lv_inc    TYPE d010inc-include,
        lv_master TYPE d010inc-master,
        lt_v      TYPE ty_vtype_tab,
        lv_cust   TYPE abap_bool,
        lv_iname  TYPE tadir-obj_name.

  lv_master = p_prog.
  SELECT include FROM d010inc INTO TABLE lt_inc WHERE master = lv_master.
  SORT lt_inc.
  DELETE ADJACENT DUPLICATES FROM lt_inc.

  LOOP AT lt_inc INTO lv_inc.
    IF lv_inc = p_prog OR lv_inc IS INITIAL.
      CONTINUE.
    ENDIF.
*   Only custom includes - skip SAP system includes (%_*, <...>, CL_*...).
    PERFORM f_is_custom USING lv_inc CHANGING lv_cust.
    IF lv_cust = abap_false.
      CONTINUE.
    ENDIF.
    lv_iname = lv_inc.
    REFRESH lt_v.
    APPEND 'REPS' TO lt_v.
    PERFORM f_add_result USING 'INCL' lv_iname p_prog 'INCLUDE'
                               lt_v lv_iname lv_iname.
  ENDLOOP.

ENDFORM.                    "f_expand_prog

*&---------------------------------------------------------------------*
*&      Form  F_IS_CUSTOM
*&---------------------------------------------------------------------*
*  True for customer objects: name starts with Z, Y, or a namespace
*  prefix ('/...'). Everything else (SAP %_*, <...>, CL_*, DB_*, ...) is
*  treated as standard and skipped.
*----------------------------------------------------------------------*
FORM f_is_custom USING    p_name TYPE clike
                 CHANGING p_cust TYPE abap_bool.

  DATA lv_first TYPE c.

  CLEAR p_cust.
  IF strlen( p_name ) = 0.
    RETURN.
  ENDIF.
  lv_first = p_name(1).
  IF lv_first = 'Z' OR lv_first = 'Y' OR lv_first = '/'.
    p_cust = abap_true.
  ENDIF.

ENDFORM.                    "f_is_custom

*&---------------------------------------------------------------------*
*&      Form  F_NS_BUILD
*&---------------------------------------------------------------------*
*  Builds a function-group program / include name, inserting the prefix
*  AFTER the namespace. e.g. ('/CCBJI/PRICE','SAPL','') -> /CCBJI/SAPLPRICE
*  ('ZFG','SAPL','') -> SAPLZFG ; ('/CCBJI/PRICE','L','U01') -> /CCBJI/LPRICEU01
*----------------------------------------------------------------------*
FORM f_ns_build USING    p_name   TYPE clike
                         p_prefix TYPE clike
                         p_suffix TYPE clike
                CHANGING p_res    TYPE clike.

  DATA: lv_str   TYPE string,
        lv_pos   TYPE i,
        lv_nslen TYPE i,
        lv_ns    TYPE string,
        lv_base  TYPE string.

  lv_str = p_name.

  IF strlen( lv_str ) > 0 AND lv_str(1) = '/'.
    FIND FIRST OCCURRENCE OF '/' IN lv_str+1 MATCH OFFSET lv_pos.
    IF sy-subrc = 0.
      lv_nslen = lv_pos + 2.                 " include both slashes
      lv_ns    = lv_str(lv_nslen).
      lv_base  = lv_str+lv_nslen.
      CONCATENATE lv_ns p_prefix lv_base p_suffix INTO p_res.
      RETURN.
    ENDIF.
  ENDIF.

  CONCATENATE p_prefix lv_str p_suffix INTO p_res.

ENDFORM.                    "f_ns_build

*&---------------------------------------------------------------------*
*&      Form  F_EXPAND_FUGR
*&---------------------------------------------------------------------*
*  One row per function module of the group (table TFDIR, local read).
*----------------------------------------------------------------------*
FORM f_expand_fugr USING p_area TYPE tadir-obj_name.

  TYPES: BEGIN OF ty_fm,
           funcname TYPE tfdir-funcname,
           include  TYPE tfdir-include,
         END OF ty_fm.

  DATA: lv_pname  TYPE tfdir-pname,
        lt_fm     TYPE STANDARD TABLE OF ty_fm,
        ls_fm     TYPE ty_fm,
        lt_v      TYPE ty_vtype_tab,
        lv_fname  TYPE tadir-obj_name,
        lv_suffix TYPE string,
        lv_incl   TYPE programm,
        lv_iname  TYPE tadir-obj_name.

* Function-group main program (namespace-aware): SAPL<grp> / <ns>SAPL<base>
  PERFORM f_ns_build USING p_area 'SAPL' space CHANGING lv_pname.
  SELECT funcname include FROM tfdir INTO TABLE lt_fm WHERE pname = lv_pname.

  LOOP AT lt_fm INTO ls_fm.
    lv_fname = ls_fm-funcname.
*   Active source of the FM lives in include L<grp>U<nn> (for REPOSRC fallback)
    CONCATENATE 'U' ls_fm-include INTO lv_suffix.
    PERFORM f_ns_build USING p_area 'L' lv_suffix CHANGING lv_incl.
    lv_iname = lv_incl.
    REFRESH lt_v.
    APPEND 'FUNC' TO lt_v.
    PERFORM f_add_result USING 'FUNC' lv_fname p_area 'FUNCTION'
                               lt_v lv_fname lv_iname.
  ENDLOOP.

ENDFORM.                    "f_expand_fugr

*&---------------------------------------------------------------------*
*&      Form  F_EXPAND_CLAS
*&---------------------------------------------------------------------*
*  One row per class method. The method's source include is resolved with
*  CL_OO_CLASSNAME_SERVICE=>GET_METHOD_INCLUDE and compared like any other
*  source (REPS + REPOSRC active), so no METH naming assumptions are made.
*----------------------------------------------------------------------*
FORM f_expand_clas USING p_class TYPE tadir-obj_name.

  DATA: lt_m       TYPE STANDARD TABLE OF seocompo-cmpname,
        lv_m       TYPE seocompo-cmpname,
        lv_clsname TYPE seoclsname,
        ls_key     TYPE seocpdkey,
        lv_incl    TYPE programm,
        lt_v       TYPE ty_vtype_tab,
        lv_mname   TYPE tadir-obj_name,
        lv_iname   TYPE tadir-obj_name.

  lv_clsname = p_class.

* Methods of the class (SEOCOMPO-CMPTYPE = 1).
  SELECT cmpname FROM seocompo INTO TABLE lt_m
    WHERE clsname = lv_clsname
      AND cmptype = 1.

  LOOP AT lt_m INTO lv_m.

    CLEAR lv_incl.
    ls_key-clsname = lv_clsname.
    ls_key-cpdname = lv_m.
    TRY.
        lv_incl = cl_oo_classname_service=>get_method_include( mtdkey = ls_key ).
      CATCH cx_root.
        CLEAR lv_incl.
    ENDTRY.

    IF lv_incl IS INITIAL.
      CONTINUE.
    ENDIF.

    lv_mname = lv_m.
    lv_iname = lv_incl.
    REFRESH lt_v.
    APPEND 'METH' TO lt_v.            " methods are versioned under METH
    PERFORM f_add_result USING 'METH' lv_mname p_class 'METHOD'
                               lt_v lv_iname lv_iname.

  ENDLOOP.

ENDFORM.                    "f_expand_clas

*&---------------------------------------------------------------------*
*&      Form  F_POOL_NAME
*&---------------------------------------------------------------------*
*  Builds the generated pool program name: object name padded to 30 with
*  '=' plus the 2-char suffix ('CP' class pool / 'IU' interface pool).
*----------------------------------------------------------------------*
FORM f_pool_name USING    p_name   TYPE tadir-obj_name
                          p_suffix TYPE c
                 CHANGING p_pool   TYPE programm.

  DATA: lv_len TYPE i,
        lv_cnt TYPE i,
        lv_p   TYPE string,
        lv_pad TYPE string.

  lv_p   = p_name.
  lv_len = strlen( p_name ).
  lv_cnt = 30 - lv_len.
  IF lv_cnt > 0.
    DO lv_cnt TIMES.
      CONCATENATE lv_pad '=' INTO lv_pad.
    ENDDO.
    CONCATENATE lv_p lv_pad INTO lv_p.
  ENDIF.
  CONCATENATE lv_p p_suffix INTO lv_p.
  p_pool = lv_p.

ENDFORM.                    "f_pool_name

*&---------------------------------------------------------------------*
*&      Form  F_ADD_RESULT
*&---------------------------------------------------------------------*
*  Compares one (sub-)object and appends an output row.
*----------------------------------------------------------------------*
FORM f_add_result USING p_objtype   TYPE tadir-object
                        p_objname   TYPE tadir-obj_name
                        p_parent    TYPE tadir-obj_name
                        p_kind      TYPE char10
                        pt_vtypes   TYPE ty_vtype_tab
                        p_vrsdname  TYPE tadir-obj_name
                        p_reposname TYPE tadir-obj_name.

  DATA: ls_out     TYPE ty_output,
        ls_dev     TYPE ty_ver,
        ls_prd     TYPE ty_ver,
        lv_method  TYPE char10,
        lv_srcstat TYPE char1.            " Y=differ N=same space=not compared

  ls_out-parent   = p_parent.
  ls_out-kind     = p_kind.
  ls_out-object   = p_objtype.
  ls_out-obj_name = p_objname.

  IF pt_vtypes IS INITIAL AND p_reposname IS INITIAL.
    ls_out-mismatch = space.
    ls_out-remarks  = 'Object type not supported'.
    APPEND ls_out TO gt_output.
    RETURN.
  ENDIF.

  PERFORM f_compare_core USING pt_vtypes p_vrsdname p_reposname
                         CHANGING ls_dev ls_prd lv_method lv_srcstat.

* Method column reflects how the verdict was made.
  IF lv_srcstat = 'Y' OR lv_srcstat = 'N'.
    ls_out-method = 'SOURCE'.
  ELSE.
    ls_out-method = lv_method.
  ENDIF.

  ls_out-dev_req  = ls_dev-req.
  ls_out-dev_date = ls_dev-date.
  ls_out-dev_user = ls_dev-user.
  ls_out-prd_req  = ls_prd-req.
  ls_out-prd_date = ls_prd-date.
  ls_out-prd_user = ls_prd-user.

  PERFORM f_evaluate USING ls_dev ls_prd lv_method lv_srcstat
                     CHANGING ls_out-mismatch ls_out-remarks.

* Dedicated TR-mismatch flag (filled only when the requests differ).
  IF ls_out-mismatch = 'TR Mismatch'.
    ls_out-tr_mism = 'YES'.
  ENDIF.

  APPEND ls_out TO gt_output.

ENDFORM.                    "f_add_result

*&---------------------------------------------------------------------*
*&      Form  F_COMPARE_CORE
*&---------------------------------------------------------------------*
*  VRSD first (when usable in both systems), REPOSRC active fallback.
*----------------------------------------------------------------------*
FORM f_compare_core USING    pt_vtypes   TYPE ty_vtype_tab
                             p_vrsdname  TYPE tadir-obj_name
                             p_reposname TYPE tadir-obj_name
                    CHANGING ps_dev      TYPE ty_ver
                             ps_prd      TYPE ty_ver
                             p_method    TYPE char10
                             p_srcstat   TYPE char1.

  CLEAR: ps_dev, ps_prd, p_method, p_srcstat.

* Metadata (request / date / author) of the active version per component
* via SVRS_GET_VERSION_DIRECTORY_46 (correct object type per component).
  p_method = gc_reposrc.
  PERFORM f_get_active_agg USING p_vrsdname pt_vtypes p_srfc CHANGING ps_dev.
  PERFORM f_get_active_agg USING p_vrsdname pt_vtypes p_trfc CHANGING ps_prd.

* Verdict by ACTUAL SOURCE when a report-source name is available
* (program / include / method-include / FM-include / pool). Same source
* counts as identical even if request / date / author differ.
  IF p_reposname IS NOT INITIAL.
    PERFORM f_compare_source USING p_reposname CHANGING p_srcstat.
  ENDIF.

ENDFORM.                    "f_compare_core

*&---------------------------------------------------------------------*
*&      Form  F_COMPARE_SOURCE
*&---------------------------------------------------------------------*
*  Compares the active source of a report-source object between the two
*  systems. 'N' = identical, 'Y' = differ, space = could not compare
*  (source unavailable on one side -> caller falls back to metadata).
*----------------------------------------------------------------------*
FORM f_compare_source USING    p_name    TYPE tadir-obj_name
                      CHANGING p_srcstat TYPE char1.

  DATA: lt_dev  TYPE ty_src_tab,
        lt_prd  TYPE ty_src_tab,
        lv_fdev TYPE abap_bool,
        lv_fprd TYPE abap_bool.

  CLEAR p_srcstat.

  PERFORM f_get_source USING p_name p_srfc CHANGING lt_dev lv_fdev.
  PERFORM f_get_source USING p_name p_trfc CHANGING lt_prd lv_fprd.

  IF lv_fdev = abap_false OR lv_fprd = abap_false.
    RETURN.                            " incomplete -> metadata fallback
  ENDIF.

* Drop trailing blank lines so padding does not cause a false difference.
  PERFORM f_trim_source CHANGING lt_dev.
  PERFORM f_trim_source CHANGING lt_prd.

  IF lt_dev = lt_prd.
    p_srcstat = 'N'.
  ELSE.
    p_srcstat = 'Y'.
  ENDIF.

ENDFORM.                    "f_compare_source

*&---------------------------------------------------------------------*
*&      Form  F_GET_SOURCE
*&---------------------------------------------------------------------*
*  Active source of a report-source object. Local = READ REPORT; remote
*  = SVRS_GET_VERSION_REPS_40 DESTINATION (versno 0 = active). No custom
*  function module is needed in the target.
*----------------------------------------------------------------------*
FORM f_get_source USING    p_name  TYPE tadir-obj_name
                           p_dest  TYPE rfcdest
                  CHANGING ct_src  TYPE ty_src_tab
                           cv_found TYPE abap_bool.

  DATA: lv_prog TYPE programm,
        lv_msg  TYPE char200.

  CLEAR: ct_src, cv_found.
  lv_prog = p_name.

  IF p_dest IS INITIAL OR p_dest = gc_none.
    READ REPORT lv_prog INTO ct_src.
    IF sy-subrc = 0.
      cv_found = abap_true.
    ENDIF.
    RETURN.
  ENDIF.

  CALL FUNCTION 'SVRS_GET_VERSION_REPS_40'
    DESTINATION p_dest
    EXPORTING
      object_name           = lv_prog
      versno                = '00000'
    TABLES
      repos_tab             = ct_src
    EXCEPTIONS
      no_version            = 1
      system_failure        = 2 MESSAGE lv_msg
      communication_failure = 3 MESSAGE lv_msg
      OTHERS                = 4.

  IF sy-subrc = 0 AND ct_src IS NOT INITIAL.
    cv_found = abap_true.
  ENDIF.

ENDFORM.                    "f_get_source

*&---------------------------------------------------------------------*
*&      Form  F_TRIM_SOURCE
*&---------------------------------------------------------------------*
*  Removes trailing blank lines from a source table.
*----------------------------------------------------------------------*
FORM f_trim_source CHANGING ct_src TYPE ty_src_tab.

  DATA: lv_idx  TYPE i,
        ls_line TYPE abaptxt255.

  lv_idx = lines( ct_src ).
  WHILE lv_idx > 0.
    READ TABLE ct_src INTO ls_line INDEX lv_idx.
    IF ls_line IS INITIAL.
      DELETE ct_src INDEX lv_idx.
      lv_idx = lv_idx - 1.
    ELSE.
      EXIT.
    ENDIF.
  ENDWHILE.

ENDFORM.                    "f_trim_source

*&---------------------------------------------------------------------*
*&      Form  F_GET_ACTIVE_AGG
*&---------------------------------------------------------------------*
*  Active version across all components of an object (latest by date).
*----------------------------------------------------------------------*
FORM f_get_active_agg USING    p_objname TYPE tadir-obj_name
                               pt_vtypes TYPE ty_vtype_tab
                               p_dest    TYPE rfcdest
                      CHANGING ps_agg    TYPE ty_ver.

  DATA: lv_vtype TYPE vrsd-objtype,
        ls_one   TYPE ty_ver.

  CLEAR ps_agg.

  LOOP AT pt_vtypes INTO lv_vtype.
    PERFORM f_get_active_one USING lv_vtype p_objname p_dest CHANGING ls_one.

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

ENDFORM.                    "f_get_active_agg

*&---------------------------------------------------------------------*
*&      Form  F_GET_ACTIVE_ONE
*&---------------------------------------------------------------------*
*  Active version of one component (object type + name) via the FM. The
*  active entry is versno 0; else the most recent entry is taken.
*----------------------------------------------------------------------*
FORM f_get_active_one USING    p_objtype TYPE clike
                               p_objname TYPE clike
                               p_dest    TYPE rfcdest
                      CHANGING ps_ver    TYPE ty_ver.

  DATA: lt_svrs TYPE ty_vrsd_tab,
        ls_vrsd TYPE vrsd,
        lv_rc   TYPE sysubrc,
        lv_msg  TYPE char80.

  CLEAR ps_ver.

  PERFORM f_svrs_dir USING p_objtype p_objname p_dest
                     CHANGING lt_svrs lv_rc lv_msg.

  IF lv_rc <> 0.
    ps_ver-rc = lv_rc.
    IF lv_msg IS NOT INITIAL.
      CONCATENATE 'SVRS:' lv_msg INTO ps_ver-rctext SEPARATED BY space.
    ELSE.
      ps_ver-rctext = 'SVRS read error'.
    ENDIF.
    RETURN.
  ENDIF.

  IF lt_svrs IS INITIAL.
    RETURN.
  ENDIF.

  DATA lv_active TYPE vrsd-versno.

* Date / author from the active entry (versno 0); else the newest entry.
  CLEAR ls_vrsd.
  LOOP AT lt_svrs INTO ls_vrsd WHERE versno IS INITIAL.
    EXIT.
  ENDLOOP.
  IF sy-subrc <> 0.
    SORT lt_svrs BY datum DESCENDING zeit DESCENDING versno DESCENDING.
    READ TABLE lt_svrs INTO ls_vrsd INDEX 1.
  ENDIF.

  ps_ver-found = abap_true.
  ps_ver-date  = ls_vrsd-datum.
  ps_ver-user  = ls_vrsd-author.
  ps_ver-req   = ls_vrsd-korrnum.

* The active entry often carries no request - take the request from the
* most recent version entry that actually has one.
  IF ps_ver-req IS INITIAL.
    SORT lt_svrs BY datum DESCENDING zeit DESCENDING versno DESCENDING.
    LOOP AT lt_svrs INTO ls_vrsd WHERE korrnum IS NOT INITIAL.
      ps_ver-req = ls_vrsd-korrnum.
      EXIT.
    ENDLOOP.
  ENDIF.

ENDFORM.                    "f_get_active_one

*&---------------------------------------------------------------------*
*&      Form  F_EVALUATE
*&---------------------------------------------------------------------*
FORM f_evaluate USING    ps_dev    TYPE ty_ver
                         ps_prd    TYPE ty_ver
                         p_method  TYPE char10
                         p_srcstat TYPE char1
                CHANGING pv_flag   TYPE char15
                         pv_rem    TYPE char100.

  CLEAR: pv_flag, pv_rem.

* Preferred verdict: actual source comparison (when available).
  IF p_srcstat = 'N'.
    pv_flag = 'Match'.
    pv_rem  = 'Active source identical in both systems'.
    RETURN.
  ELSEIF p_srcstat = 'Y'.
    pv_flag = 'Source Mismatch'.
    pv_rem  = 'Active source differs between Source and Target'.
    RETURN.
  ENDIF.

* Read errors.
  IF ps_prd-rc <> 0.
    pv_flag = 'Read Error'.
    CONCATENATE 'Target read error:' ps_prd-rctext INTO pv_rem SEPARATED BY space.
    RETURN.
  ELSEIF ps_dev-rc <> 0.
    pv_flag = 'Read Error'.
    CONCATENATE 'Source read error:' ps_dev-rctext INTO pv_rem SEPARATED BY space.
    RETURN.
  ENDIF.

* Existence.
  IF ps_dev-found = abap_false AND ps_prd-found = abap_false.
    pv_flag = 'Not Found'.
    pv_rem  = 'Object does not exist in either system'.
    RETURN.
  ELSEIF ps_dev-found = abap_true AND ps_prd-found = abap_false.
    pv_flag = 'Missing Target'.
    pv_rem  = 'Object exists in Source only - missing in Target'.
    RETURN.
  ELSEIF ps_dev-found = abap_false AND ps_prd-found = abap_true.
    pv_flag = 'Missing Source'.
    pv_rem  = 'Object exists in Target only - missing in Source'.
    RETURN.
  ENDIF.

* Both present - compare the transport request.
  IF ps_dev-req = ps_prd-req.
    pv_flag = 'Match'.
    pv_rem  = 'Transport request identical in both systems'.
  ELSE.
    pv_flag = 'TR Mismatch'.
    CONCATENATE 'TR differs - Source:' ps_dev-req 'Target:' ps_prd-req
                INTO pv_rem SEPARATED BY space.
  ENDIF.

ENDFORM.                    "f_evaluate

*&---------------------------------------------------------------------*
*&      Form  F_GET_VRSD_AGG
*&---------------------------------------------------------------------*
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
    IF lv_msg IS NOT INITIAL.
      CONCATENATE 'VRSD:' lv_msg INTO ps_ver-rctext SEPARATED BY space.
    ELSE.
      PERFORM f_rc_text USING sy-subrc 'VRSD' CHANGING ps_ver-rctext.
    ENDIF.
*   Fallback: RFC_READ_TABLE blocked -> try the remote-enabled FM.
    PERFORM f_get_vrsd_svrs USING p_vtype p_objname p_dest CHANGING ps_ver.
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
*  Active version of a report source (REPS) via the remote-enabled FM
*  SVRS_GET_VERSION_DIRECTORY_46 - works locally and via DESTINATION, so
*  it is not affected by RFC_READ_TABLE table-authorisation / UCON blocks.
*  Returns the ACTIVE entry (versno 0): its request / date / author.
FORM f_get_reposrc USING    p_objname TYPE tadir-obj_name
                            p_dest    TYPE rfcdest
                   CHANGING ps_ver    TYPE ty_ver.

  DATA: lt_svrs TYPE ty_vrsd_tab,
        ls_vrsd TYPE vrsd,
        lv_rc   TYPE sysubrc,
        lv_msg  TYPE char80.

  CLEAR ps_ver.

  PERFORM f_svrs_dir USING 'REPS' p_objname p_dest
                     CHANGING lt_svrs lv_rc lv_msg.

  IF lv_rc <> 0.
    ps_ver-rc = lv_rc.
    IF lv_msg IS NOT INITIAL.
      CONCATENATE 'SVRS:' lv_msg INTO ps_ver-rctext SEPARATED BY space.
    ELSE.
      ps_ver-rctext = 'SVRS read error'.
    ENDIF.
    RETURN.
  ENDIF.

  IF lt_svrs IS INITIAL.
    RETURN.                          " object not versioned -> not found
  ENDIF.

* Prefer the active entry (versno 0); else the most recent one.
  CLEAR ls_vrsd.
  LOOP AT lt_svrs INTO ls_vrsd WHERE versno IS INITIAL.
    EXIT.
  ENDLOOP.
  IF sy-subrc <> 0.
    SORT lt_svrs BY datum DESCENDING zeit DESCENDING versno DESCENDING.
    READ TABLE lt_svrs INTO ls_vrsd INDEX 1.
  ENDIF.

  ps_ver-found = abap_true.
  ps_ver-req   = ls_vrsd-korrnum.
  ps_ver-date  = ls_vrsd-datum.
  ps_ver-user  = ls_vrsd-author.

ENDFORM.                    "f_get_reposrc

*&---------------------------------------------------------------------*
*&      Form  F_SVRS_DIR
*&---------------------------------------------------------------------*
*  Reads the version directory of an object with the remote-enabled FM
*  SVRS_GET_VERSION_DIRECTORY_46 (works locally and via DESTINATION).
*  Used as a fallback when RFC_READ_TABLE is blocked in the target.
*  NO_ENTRY is reported as success-empty (p_rc = 0).
*----------------------------------------------------------------------*
FORM f_svrs_dir USING    p_objtype TYPE clike
                         p_objname TYPE clike
                         p_dest    TYPE rfcdest
                CHANGING pt_vrsd   TYPE ty_vrsd_tab
                         p_rc      TYPE sysubrc
                         p_msg     TYPE char80.

  DATA: lt_vrsn    TYPE STANDARD TABLE OF vrsn,
        lv_objname TYPE vrsd-objname,
        lv_objtype TYPE vrsd-objtype,
        lv_msg     TYPE char200.

  REFRESH pt_vrsd.
  CLEAR: p_rc, p_msg.
  lv_objname = p_objname.
  lv_objtype = p_objtype.

  IF p_dest IS INITIAL OR p_dest = gc_none.
    CALL FUNCTION 'SVRS_GET_VERSION_DIRECTORY_46'
      EXPORTING
        objname      = lv_objname
        objtype      = lv_objtype
      TABLES
        lversno_list = lt_vrsn
        version_list = pt_vrsd
      EXCEPTIONS
        no_entry     = 1
        OTHERS       = 2.
    p_rc = sy-subrc.
  ELSE.
    CALL FUNCTION 'SVRS_GET_VERSION_DIRECTORY_46'
      DESTINATION p_dest
      EXPORTING
        objname               = lv_objname
        objtype               = lv_objtype
      TABLES
        lversno_list          = lt_vrsn
        version_list          = pt_vrsd
      EXCEPTIONS
        no_entry              = 1
        communication_failure = 3 MESSAGE lv_msg
        system_failure        = 4 MESSAGE lv_msg
        OTHERS                = 2.
    p_rc  = sy-subrc.
    p_msg = lv_msg.
  ENDIF.

  IF p_rc = 1.                       " no versions = legitimate empty
    p_rc = 0.
  ENDIF.

ENDFORM.                    "f_svrs_dir

*&---------------------------------------------------------------------*
*&      Form  F_GET_VRSD_SVRS
*&---------------------------------------------------------------------*
*  VRSD fallback: latest HISTORIC version (versno <> 0) via the FM.
*----------------------------------------------------------------------*
FORM f_get_vrsd_svrs USING    p_vtype   TYPE vrsd-objtype
                              p_objname TYPE clike
                              p_dest    TYPE rfcdest
                     CHANGING ps_ver    TYPE ty_ver.

  DATA: lt_svrs TYPE ty_vrsd_tab,
        ls_vrsd TYPE vrsd,
        lv_rc   TYPE sysubrc,
        lv_msg  TYPE char80.

  PERFORM f_svrs_dir USING p_vtype p_objname p_dest
                     CHANGING lt_svrs lv_rc lv_msg.

  IF lv_rc <> 0.
    RETURN.                          " keep the RFC error already set
  ENDIF.

  CLEAR: ps_ver-rc, ps_ver-rctext.   " FM worked -> not an error any more
  DELETE lt_svrs WHERE versno IS INITIAL.   " skip the active (no request)
  IF lt_svrs IS INITIAL.
    RETURN.                          " no historic versions -> not found
  ENDIF.

  SORT lt_svrs BY datum DESCENDING zeit DESCENDING versno DESCENDING.
  READ TABLE lt_svrs INTO ls_vrsd INDEX 1.
  ps_ver-found = abap_true.
  ps_ver-req   = ls_vrsd-korrnum.
  ps_ver-date  = ls_vrsd-datum.
  ps_ver-user  = ls_vrsd-author.

ENDFORM.                    "f_get_vrsd_svrs

*&---------------------------------------------------------------------*
*&      Form  F_RC_TEXT
*&---------------------------------------------------------------------*
FORM f_rc_text USING    p_rc    TYPE sysubrc
                        p_table TYPE c
               CHANGING p_text  TYPE char80.

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
*  VRSD components for non-composite object types (composite types are
*  handled directly in F_PROCESS_OBJECT).
*----------------------------------------------------------------------*
FORM f_map_components USING    p_objtype  TYPE tadir-object
                      CHANGING pt_vtypes  TYPE ty_vtype_tab
                               p_reposrok TYPE abap_bool.

  DATA lv_v TYPE vrsd-objtype.

  REFRESH pt_vtypes.
  CLEAR p_reposrok.

  CASE p_objtype.
    WHEN 'DYNP'.  lv_v = 'DYNP'. APPEND lv_v TO pt_vtypes.
    WHEN 'TABL'.  lv_v = 'TABD'. APPEND lv_v TO pt_vtypes.
                  lv_v = 'TABT'. APPEND lv_v TO pt_vtypes.
    WHEN 'VIEW' OR 'VIED'. lv_v = 'VIED'. APPEND lv_v TO pt_vtypes.
    WHEN 'DTEL'.  lv_v = 'DTED'. APPEND lv_v TO pt_vtypes.
    WHEN 'DOMA'.  lv_v = 'DOMD'. APPEND lv_v TO pt_vtypes.
    WHEN 'SHLP'.  lv_v = 'SHLD'. APPEND lv_v TO pt_vtypes.
    WHEN 'TTYP'.  lv_v = 'TTYD'. APPEND lv_v TO pt_vtypes.
    WHEN 'ENQU'.  lv_v = 'ENQD'. APPEND lv_v TO pt_vtypes.
    WHEN 'MSAG'.  lv_v = 'MSAD'. APPEND lv_v TO pt_vtypes.
                  lv_v = 'MESS'. APPEND lv_v TO pt_vtypes.
    WHEN 'ENHO'.  lv_v = 'ENHO'. APPEND lv_v TO pt_vtypes.
    WHEN 'ENHS'.  lv_v = 'ENHS'. APPEND lv_v TO pt_vtypes.
    WHEN 'TRAN'.  lv_v = 'TRAN'. APPEND lv_v TO pt_vtypes.
    WHEN OTHERS.  CLEAR pt_vtypes.
  ENDCASE.

ENDFORM.                    "f_map_components

*&---------------------------------------------------------------------*
*&      Form  F_BUILD_LOG
*&---------------------------------------------------------------------*
FORM f_build_log.

  DATA: ls_output TYPE ty_output,
        ls_log    TYPE zversion_cmp_log.

  LOOP AT gt_output INTO ls_output.
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
*   Log MISMATCH is YES/NO (CHAR3); the full status is kept in REMARKS.
    IF ls_output-mismatch = 'Match' OR ls_output-mismatch = 'Not Found'
       OR ls_output-mismatch IS INITIAL.
      ls_log-mismatch = 'NO'.
    ELSE.
      ls_log-mismatch = 'YES'.
    ENDIF.
    ls_log-remarks  = ls_output-remarks.
    APPEND ls_log TO gt_log.
  ENDLOOP.

ENDFORM.                    "f_build_log

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

  PERFORM f_add_field USING 'PARENT'   'Parent Object'    30.
  PERFORM f_add_field USING 'KIND'     'Kind'             10.
  PERFORM f_add_field USING 'OBJECT'   'Object Type'      10.
  PERFORM f_add_field USING 'OBJ_NAME' 'Object Name'      40.
  PERFORM f_add_field USING 'METHOD'   'Method'           10.
  PERFORM f_add_field USING 'DEV_REQ'  'Source Request'   20.
  PERFORM f_add_field USING 'DEV_DATE' 'Source Date'      14.
  PERFORM f_add_field USING 'DEV_USER' 'Source By'        14.
  PERFORM f_add_field USING 'PRD_REQ'  'Target Request'   20.
  PERFORM f_add_field USING 'PRD_DATE' 'Target Date'      14.
  PERFORM f_add_field USING 'PRD_USER' 'Target By'        14.
  PERFORM f_add_field USING 'MISMATCH' 'Status'           15.
  PERFORM f_add_field USING 'TR_MISM'  'TR Mismatch'      12.
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
