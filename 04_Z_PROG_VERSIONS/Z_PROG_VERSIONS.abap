*&---------------------------------------------------------------------*
*& Report Z_PROG_VERSIONS
*&---------------------------------------------------------------------*
*& Lists every stored version of one or more ABAP programs (report
*& source) with the transport request (TR), TR description, total count,
*& and a flag showing whether the last two versions are identical.
*&
*&  - Programs selected by a RANGE (SELECT-OPTIONS, resolved via TRDIR).
*&  - Version directory : table VRSD via FM SVRS_GET_VERSION_DIRECTORY_46.
*&  - Source per version : FM SVRS_GET_REPS_FROM_OBJECT (historic),
*&                         READ REPORT (active).
*&  - Object type 'REPS' = report/program source.
*&  - VRSD-KORRNUM   = transport request (TR); text from E07T-AS4TEXT.
*&  - Version 00000  = current ACTIVE version (no TR).
*&
*& "Last 2 versions" comparison:
*&  Compares the ACTIVE (current) source against the most recent HISTORIC
*&  version (highest version number). Result is shown on the ACTIVE row:
*&    MATCH  = current code identical to the last saved version
*&    DIFFER = current code changed since the last saved version
*&    N/A    = fewer than two versions available to compare
*&---------------------------------------------------------------------*
REPORT z_prog_versions.

TYPES: tt_src TYPE STANDARD TABLE OF abaptxt255 WITH DEFAULT KEY.

TYPES: BEGIN OF ty_out,
         progname TYPE syrepid,      " program name
         versno   TYPE vrsd-versno,  " version number
         vtype    TYPE char08,       " ACTIVE / HISTORIC
         korrnum  TYPE vrsd-korrnum, " transport request (TR)
         trtext   TYPE as4text,      " TR description
         author   TYPE vrsd-author,  " created by
         datum    TYPE vrsd-datum,   " date
         zeit     TYPE vrsd-zeit,    " time
         cmp      TYPE char08,       " last-2-versions result (on ACTIVE row)
       END OF ty_out.

TYPES: BEGIN OF ty_tr,
         trkorr TYPE e07t-trkorr,
       END OF ty_tr.

DATA: gt_vrsd     TYPE STANDARD TABLE OF vrsd,
      gt_vrsn     TYPE STANDARD TABLE OF vrsn,
      gs_vrsd     TYPE vrsd,
      gt_out      TYPE STANDARD TABLE OF ty_out,
      gs_out      TYPE ty_out,
      gt_prog     TYPE STANDARD TABLE OF syrepid,
      gt_tr       TYPE STANDARD TABLE OF ty_tr,
      gs_tr       TYPE ty_tr,
      gt_act      TYPE tt_src,
      gt_hist     TYPE tt_src,
      gv_obj      TYPE vrsd-objname,
      gv_act_ver  TYPE vrsd-versno,   " 00000 (active)
      gv_max_hist TYPE vrsd-versno,
      gv_has_act  TYPE abap_bool,
      gv_cmp      TYPE char08,
      gv_cnt      TYPE i.

DATA gv_prog TYPE syrepid.
SELECT-OPTIONS s_prog FOR gv_prog no INTERVALS.

START-OF-SELECTION.

* 1) Resolve the program range into a concrete list of programs.
  SELECT name FROM trdir
    INTO TABLE @gt_prog
    WHERE name IN @s_prog.

  IF gt_prog IS INITIAL.
    MESSAGE 'No programs found for the given selection' TYPE 'I'.
    RETURN.
  ENDIF.

* 2) For each program: read directory, compare last two, build rows.
  LOOP AT gt_prog INTO DATA(gv_name).
    gv_obj = gv_name.
    CLEAR: gt_vrsd, gt_vrsn, gv_max_hist, gv_has_act, gv_cmp.

    CALL FUNCTION 'SVRS_GET_VERSION_DIRECTORY_46'
      EXPORTING
        objname      = gv_obj
        objtype      = 'REPS'
      TABLES
        lversno_list = gt_vrsn
        version_list = gt_vrsd
      EXCEPTIONS
        OTHERS       = 1.

    IF sy-subrc <> 0.
      CONTINUE.
    ENDIF.

*   Identify the active entry (00000) and the highest historic version.
    LOOP AT gt_vrsd INTO gs_vrsd.
      IF gs_vrsd-versno IS INITIAL.
        gv_has_act = abap_true.
      ELSEIF gs_vrsd-versno > gv_max_hist.
        gv_max_hist = gs_vrsd-versno.
      ENDIF.
    ENDLOOP.

*   Compare current (active) source vs latest historic source.
    IF gv_has_act = abap_true AND gv_max_hist IS NOT INITIAL.
      PERFORM get_source USING gv_name gv_act_ver  CHANGING gt_act.
      PERFORM get_source USING gv_name gv_max_hist CHANGING gt_hist.

      IF gt_act IS NOT INITIAL AND gt_hist IS NOT INITIAL.
        IF gt_act = gt_hist.
          gv_cmp = 'MATCH'.
        ELSE.
          gv_cmp = 'DIFFER'.
        ENDIF.
      ELSE.
        gv_cmp = 'N/A'.
      ENDIF.
    ELSE.
      gv_cmp = 'N/A'.
    ENDIF.

*   Build the output rows for this program.
    LOOP AT gt_vrsd INTO gs_vrsd.
      CLEAR gs_out.
      gs_out-progname = gv_name.
      gs_out-versno   = gs_vrsd-versno.
      gs_out-korrnum  = gs_vrsd-korrnum.
      gs_out-author   = gs_vrsd-author.
      gs_out-datum    = gs_vrsd-datum.
      gs_out-zeit     = gs_vrsd-zeit.
      IF gs_vrsd-versno IS INITIAL.
        gs_out-vtype = 'ACTIVE'.
        gs_out-cmp   = gv_cmp.        " result shown on the active row
      ELSE.
        gs_out-vtype = 'HISTORIC'.
      ENDIF.
      APPEND gs_out TO gt_out.
    ENDLOOP.
  ENDLOOP.

  IF gt_out IS INITIAL.
    MESSAGE 'No version information found for the selection' TYPE 'I'.
    RETURN.
  ENDIF.

* 3) Read TR descriptions in bulk and fill them in.
  LOOP AT gt_out INTO gs_out WHERE korrnum IS NOT INITIAL.
    gs_tr-trkorr = gs_out-korrnum.
    APPEND gs_tr TO gt_tr.
  ENDLOOP.
  SORT gt_tr BY trkorr.
  DELETE ADJACENT DUPLICATES FROM gt_tr COMPARING trkorr.

  IF gt_tr IS NOT INITIAL.
    SELECT trkorr, as4text FROM e07t
      INTO TABLE @DATA(lt_txt)
      FOR ALL ENTRIES IN @gt_tr
      WHERE trkorr = @gt_tr-trkorr
        AND langu  = @sy-langu.
    SORT lt_txt BY trkorr.

    LOOP AT gt_out ASSIGNING FIELD-SYMBOL(<fs_out>) WHERE korrnum IS NOT INITIAL.
      READ TABLE lt_txt INTO DATA(ls_txt)
        WITH KEY trkorr = <fs_out>-korrnum BINARY SEARCH.
      IF sy-subrc = 0.
        <fs_out>-trtext = ls_txt-as4text.
      ENDIF.
    ENDLOOP.
  ENDIF.

* 4) Sort and count.
  SORT gt_out BY progname ASCENDING versno DESCENDING.
  gv_cnt = lines( gt_out ).

* 5) ALV output.
  TRY.
      cl_salv_table=>factory(
        IMPORTING r_salv_table = DATA(lo_alv)
        CHANGING  t_table      = gt_out ).

      lo_alv->get_columns( )->set_optimize( abap_true ).

*     Toolbar: enable the full standard toolbar, then hide Print + Export.
      DATA(lo_func) = lo_alv->get_functions( ).
      lo_func->set_all( abap_true ).             " all standard buttons on
      lo_func->set_print( abap_false ).          " hide Print
      lo_func->set_print_preview( abap_false ).  " hide Print preview
      lo_func->set_group_export( abap_false ).   " hide Export menu (spreadsheet/file/word/mail/HTML/XML)

      DATA(lo_cols) = lo_alv->get_columns( ).
      lo_cols->get_column( 'PROGNAME' )->set_long_text( 'Program' ).
      lo_cols->get_column( 'VERSNO'   )->set_long_text( 'Version' ).
      lo_cols->get_column( 'VTYPE'    )->set_long_text( 'Type' ).
      lo_cols->get_column( 'KORRNUM'  )->set_long_text( 'Request no.' ).
      lo_cols->get_column( 'TRTEXT'   )->set_long_text( 'TR Description' ).
      lo_cols->get_column( 'AUTHOR'   )->set_long_text( 'Author' ).
      lo_cols->get_column( 'DATUM'    )->set_long_text( 'Date' ).
      lo_cols->get_column( 'ZEIT'     )->set_long_text( 'Time' ).
      lo_cols->get_column( 'CMP'      )->set_long_text( 'Last 2 Versions' ).

      lo_alv->get_display_settings( )->set_list_header(
        |Program versions: { gv_cnt } row(s)| ).

      lo_alv->display( ).

    CATCH cx_salv_msg INTO DATA(lx_msg).
      MESSAGE lx_msg->get_text( ) TYPE 'E'.
  ENDTRY.

*&---------------------------------------------------------------------*
*& Form GET_SOURCE
*&  Returns the source of a program version.
*&  versno initial / 00000 -> active (current) source via READ REPORT.
*&  otherwise              -> historic source via SVRS_GET_REPS_FROM_OBJECT.
*&  Trailing blank lines are removed so padding does not cause a false
*&  DIFFER result.
*&---------------------------------------------------------------------*
FORM get_source USING    iv_prog   TYPE syrepid
                         iv_versno TYPE vrsd-versno
                CHANGING ct_src    TYPE tt_src.

* Call the classic FM only with locally declared, exactly-typed objects
* (matching the FM interface: ABAPTXT255 / TRDIR / VRSD-* / SVRS_BOOL).
* Passing the subroutine's typed table parameter or untyped literals
* straight into the classic TABLES interface is what triggered
* CALL_FUNCTION_CONFLICT_TYPE.
  DATA: lt_src   TYPE STANDARD TABLE OF abaptxt255,
        lt_trd   TYPE STANDARD TABLE OF trdir,
        lv_objn  TYPE vrsd-objname,
        lv_otype TYPE vrsd-objtype,
        lv_norel TYPE svrs_bool,
        lv_idx   TYPE i.

  CLEAR ct_src.

  lv_objn  = iv_prog.
  lv_otype = 'REPS'.
  lv_norel = 'X'.

  IF iv_versno IS INITIAL.
*   Active (current) version = current source.
    READ REPORT iv_prog INTO lt_src.
    IF sy-subrc <> 0.
      RETURN.
    ENDIF.
  ELSE.
*   Historic version source.
    CALL FUNCTION 'SVRS_GET_REPS_FROM_OBJECT'
      EXPORTING
        object_name                  = lv_objn
        object_type                  = lv_otype
        versno                       = iv_versno
        iv_no_release_transformation = lv_norel
      TABLES
        repos_tab                    = lt_src
        trdir_tab                    = lt_trd
      EXCEPTIONS
        no_version                   = 1
        OTHERS                       = 2.
    IF sy-subrc <> 0.
      RETURN.
    ENDIF.
  ENDIF.

* Remove trailing blank lines so padding cannot cause a false DIFFER.
  lv_idx = lines( lt_src ).
  WHILE lv_idx > 0.
    READ TABLE lt_src INTO DATA(ls_line) INDEX lv_idx.
    IF ls_line IS INITIAL.
      DELETE lt_src INDEX lv_idx.
      lv_idx = lv_idx - 1.
    ELSE.
      EXIT.
    ENDIF.
  ENDWHILE.

  ct_src = lt_src.

ENDFORM.
