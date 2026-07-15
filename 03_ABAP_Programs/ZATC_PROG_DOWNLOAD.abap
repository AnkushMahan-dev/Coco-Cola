*&---------------------------------------------------------------------*
*& Report  ZATC_PROG_DOWNLOAD
*&---------------------------------------------------------------------*
*& Program Title : Download the exact ATC-flagged sub-objects as text
*&                 files + a manifest.
*&
*& Description   : Companion downloader for ZATC_RESULT_CORRECTION.
*&
*&   TWO RUN MODES (controlled by the P_BG checkbox):
*&
*&   1) Frontend mode  (P_BG = ' ')  - the original behaviour.
*&      Each sub-object is written as a .txt file to the chosen
*&      frontend folder (GUI_DOWNLOAD) and an Excel manifest is
*&      created with SAP_CONVERT_TO_XLS_FORMAT. Must run in SAP GUI.
*&
*&   2) Background / server mode (P_BG = 'X').
*&      The program needs NO frontend. It resolves the application
*&      server directory DIR_TEMP (the same path shown in AL11 / the
*&      "SAP Directories" view), packs every sub-object source plus a
*&      manifest (CSV) into a single ZIP using CL_ABAP_ZIP, and writes
*&      that ZIP to DIR_TEMP with OPEN DATASET ... IN BINARY MODE.
*&      Because it uses no GUI calls, it can be scheduled as a
*&      background job (SM36 / F9). The resulting *.zip is then
*&      visible in AL11 under DIR_TEMP.
*&
*&   GET PREVIOUS VERSION (P_PREV checkbox):
*&      When ticked, the PREVIOUS active version held in SAP Version
*&      Management (VRSD) is downloaded for every sub-object instead of
*&      the current active version. Resolved via FORM get_previous_version
*&      (INDEX 2 of the real version list). PROG/FUGR/FUGS/SFPF/SSFO are
*&      read with SVRS_GET_VERSION_REPS_40; CLAS methods via METH
*&      (SVRS_GET_VERSION_METH_40), sections via generic SVRS_GET_VERSION.
*&      The SEO_*_GET_SOURCE APIs are NOT used in this mode because they
*&      always return the current active source. Works in both frontend
*&      and background ZIP modes. The manifest / log carry a Version
*&      Number column (0 / blank in current-version mode), and previous-
*&      version output files are prefixed ZATC_DOWNLOAD_PREV_*.
*&
*&   SMART FORMS (SSFO):
*&      A Smart Form has no REPS source. On activation it is compiled
*&      into a generated function module, so for SSFO findings the
*&      program resolves that FM (SSF_FUNCTION_MODULE_NAME), locates the
*&      include that carries its code (FUNCTION_INCLUDE_INFO) and reads
*&      the generated source via READ REPORT. Handled in FORM
*&      read_smartform_source and used by both the frontend and the
*&      background ZIP mode. The generated FM is not version-managed, so
*&      previous-version mode also downloads the current generated code.
*&---------------------------------------------------------------------*
REPORT zatc_prog_download.

TABLES: tadir, trnspace.

*----------------------------------------------------------------------*
* Types
*----------------------------------------------------------------------*
TYPES: BEGIN OF ty_obj,
         objtype  TYPE char4,        " PROG / CLAS / FUGR / SSFO ...
         objname  TYPE char40,       " main object (program / class / fgr)
         sobjname TYPE versobjnam,   " exact include / method / function include
         versno   TYPE vrsd-versno,  " previous version number (P_PREV mode)
       END OF ty_obj.

TYPES: BEGIN OF ty_manifest,
         objtype  TYPE char4,
         objname  TYPE char40,
         sobjname TYPE char40,
         filename TYPE string,
         versno   TYPE vrsd-versno,
       END OF ty_manifest.

TYPES: BEGIN OF ty_log,
         objtype  TYPE char4,
         objname  TYPE char40,
         sobjname TYPE char40,
         versno   TYPE vrsd-versno,
         filename TYPE string,
         status   TYPE char10,           " Success / Skipped / Error
         message  TYPE char100,
       END OF ty_log.

" Version-management object types tried when resolving a previous version.
TYPES tt_objtype TYPE STANDARD TABLE OF vrsd-objtype WITH DEFAULT KEY.

*----------------------------------------------------------------------*
* Global data
*----------------------------------------------------------------------*
DATA: gt_obj      TYPE STANDARD TABLE OF ty_obj,
      gt_manifest TYPE STANDARD TABLE OF ty_manifest,
      gt_log      TYPE STANDARD TABLE OF ty_log,
      gv_sep      TYPE c LENGTH 1,
      go_zip      TYPE REF TO cl_abap_zip.   " server-mode archive

" Source read work areas (same kinds the correction program uses)
DATA: repos_tab          TYPE STANDARD TABLE OF abaptxt255,
      wa_blank           TYPE abaptxt255,
      object_name        TYPE vrsd-objname,
      l_seoclskey        TYPE seoclskey,
      it_includes        TYPE seop_methods_w_include,
      ls_mtdkey          TYPE seocpdkey,
      lt_source          TYPE seop_source,
      ex_source_code_tab TYPE seop_source_string,
      lt_source_seo      TYPE seo_section_source,
      l_program_sec      TYPE program,
      l_clkey            TYPE seoclskey.

*----------------------------------------------------------------------*
* Selection screen
*----------------------------------------------------------------------*
" Mode selection (mutually exclusive).
"   RB_ATC : Download ATC Data   - read the ATC result and download/zip it
"   RB_GET : Download Server File - fetch an existing app-server file to PC
SELECTION-SCREEN BEGIN OF BLOCK b0 WITH FRAME TITLE text-002.
  PARAMETERS     rb_atc RADIOBUTTON GROUP md USER-COMMAND mode DEFAULT 'X'.
  PARAMETERS     rb_get RADIOBUTTON GROUP md.
SELECTION-SCREEN END OF BLOCK b0.

SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE text-001.
  " --- ATC Data download fields (MODIF ID ATC) ---------------------
  PARAMETERS     p_id  TYPE satc_d_ac_title MODIF ID atc.       " ATC result name
  SELECT-OPTIONS s_obj FOR tadir-obj_name      MODIF ID atc.    " object filter
  SELECT-OPTIONS s_nsp FOR trnspace-namespace  MODIF ID atc.    " namespace filter

  " --- Server file download field (MODIF ID GET) -------------------
  " Fetch an already-created server file (e.g. the ZIP the background
  " job wrote into DIR_TEMP) down to the frontend in binary, without
  " needing CG3Y / logical file configuration. Only visible in GET mode.
  PARAMETERS     p_src TYPE string LOWER CASE MODIF ID get
                       DEFAULT '/tmp/<filename>.zip'.            " server file to fetch

  " --- Shared: download / target folder on the frontend ------------
  " Used by both modes (ATC frontend download target, and GET local
  " target). Mandatory rules are enforced at START-OF-SELECTION.
  PARAMETERS     p_dir TYPE string DEFAULT 'C:\Temp'.           " download / target folder

  " --- Get previous version ----------------------------------------
  " When ticked, the PREVIOUS active version held in SAP Version
  " Management (VRSD) is downloaded for every sub-object instead of the
  " current active version. Applies to ATC Data mode (frontend and
  " background ZIP alike).
  PARAMETERS     p_prev AS CHECKBOX MODIF ID atc.               " get previous version

  " --- Execute in background (kept as the LAST parameter) ----------
  " When ticked the program runs without a frontend and writes the
  " result as a ZIP into DIR_TEMP (AL11), scheduled as a background job.
  PARAMETERS     p_bg  AS CHECKBOX MODIF ID atc.                " execute in background
SELECTION-SCREEN END OF BLOCK b1.

*----------------------------------------------------------------------*
* F4 help: ATC result (run series) name
*----------------------------------------------------------------------*
AT SELECTION-SCREEN ON VALUE-REQUEST FOR p_id.
  SELECT DISTINCT run_series_name INTO TABLE @DATA(it_run_series_name)
    FROM satc_ac_resulth.
  IF sy-subrc = 0.
    CALL FUNCTION 'F4IF_INT_TABLE_VALUE_REQUEST'
      EXPORTING
        retfield        = 'RUN_SERIES_NAME'
        dynpprog        = sy-cprog
        dynpnr          = sy-dynnr
        dynprofield     = 'P_ID'
        value_org       = 'S'
      TABLES
        value_tab       = it_run_series_name
      EXCEPTIONS
        parameter_error = 1
        no_values_found = 2
        OTHERS          = 3.
  ENDIF.

*----------------------------------------------------------------------*
* F4 help: target folder (frontend mode only)
*----------------------------------------------------------------------*
AT SELECTION-SCREEN ON VALUE-REQUEST FOR p_dir.
  PERFORM f4_folder CHANGING p_dir.

*----------------------------------------------------------------------*
* Dynamic visibility: show only the fields of the chosen mode.
* NOTE: no mandatory validation here. Validation runs at
* START-OF-SELECTION so that toggling the radio button never forces the
* user to fill fields belonging to the other mode.
*----------------------------------------------------------------------*
AT SELECTION-SCREEN OUTPUT.
  LOOP AT SCREEN.
    IF screen-group1 = 'ATC'.          " ATC-data fields
      IF rb_atc = abap_true.
        screen-active = 1.
      ELSE.
        screen-active = 0.
      ENDIF.
      MODIFY SCREEN.
    ELSEIF screen-group1 = 'GET'.       " server-file field
      IF rb_get = abap_true.
        screen-active = 1.
      ELSE.
        screen-active = 0.
      ENDIF.
      MODIFY SCREEN.
    ENDIF.
  ENDLOOP.

*----------------------------------------------------------------------*
INITIALIZATION.
  cl_gui_frontend_services=>get_file_separator(
    CHANGING  file_separator = gv_sep
    EXCEPTIONS OTHERS = 1 ).
  IF gv_sep IS INITIAL.
    gv_sep = '\'.
  ENDIF.

*----------------------------------------------------------------------*
START-OF-SELECTION.

  " Validate mandatory fields here (not on the selection screen) so the
  " user can switch radio buttons freely without being forced to fill
  " the other mode's fields.
  PERFORM validate_selection.

  IF rb_get = abap_true.
    " ===== Mode 2: Download Server File ==============================
    " Fetch an existing app-server file to the frontend (binary).
    PERFORM run_in_gui.
    PERFORM normalize_folder CHANGING p_dir.
    PERFORM fetch_server_to_frontend.
  ELSE.
    " ===== Mode 1: Download ATC Data =================================
    IF p_bg = abap_true.
      IF sy-batch = abap_true.
        " --- Inside the background job: do the real work. -----------
        " collect_findings + source reading + ZIP creation run here,
        " i.e. data fetching happens in the background work process.
        PERFORM run_server_mode.
      ELSE.
        " --- Started from SAP GUI with the checkbox ticked: do NOT --
        " fetch anything in this dialog process. Schedule the report -
        " as a background job so the whole run executes in a BTC WP. -
        PERFORM submit_background_job.
      ENDIF.
    ELSE.
      " --- Original frontend per-file download mode. ---------------
      PERFORM run_gui_mode.
    ENDIF.
  ENDIF.

*&---------------------------------------------------------------------*
*& Form validate_selection
*&  All mandatory-field checks, raised at START-OF-SELECTION so radio
*&  switching never triggers premature errors.
*&---------------------------------------------------------------------*
FORM validate_selection.

  IF rb_get = abap_true.
    " Mode 2 - Download Server File.
    IF p_src IS INITIAL.
      MESSAGE 'Enter the server file to download (Server File)' TYPE 'E'.
    ENDIF.
    IF p_dir IS INITIAL.
      MESSAGE 'Enter the local target folder (Download Path)' TYPE 'E'.
    ENDIF.
  ELSE.
    " Mode 1 - Download ATC Data.
    IF p_id IS INITIAL.
      MESSAGE 'Enter the ATC Result Name' TYPE 'E'.
    ENDIF.
    " Download path is mandatory only when NOT running in background.
    IF p_bg = abap_false AND p_dir IS INITIAL.
      MESSAGE 'Download Path is mandatory when "Execute in Background" is not selected' TYPE 'E'.
    ENDIF.
  ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form submit_background_job
*&  Schedules THIS report as a background job (JOB_OPEN / SUBMIT VIA JOB
*&  / JOB_CLOSE) so collect_findings and the source reading run in a
*&  background work process - not in the current dialog process.
*&---------------------------------------------------------------------*
FORM submit_background_job.

  DATA: lv_jobname  TYPE tbtcjob-jobname VALUE 'ZATC_PROG_DOWNLOAD',
        lv_jobcount TYPE tbtcjob-jobcount.

  CALL FUNCTION 'JOB_OPEN'
    EXPORTING
      jobname          = lv_jobname
    IMPORTING
      jobcount         = lv_jobcount
    EXCEPTIONS
      cant_create_job  = 1
      invalid_job_data = 2
      jobname_missing  = 3
      OTHERS           = 4.
  IF sy-subrc <> 0.
    MESSAGE 'Could not create background job' TYPE 'E'.
  ENDIF.

  " Re-run this report in the job. P_BG stays 'X' so the job branch
  " (sy-batch = 'X') performs RUN_SERVER_MODE and writes the ZIP to
  " DIR_TEMP. The selection-screen filters are handed over unchanged.
  SUBMIT zatc_prog_download
    WITH rb_atc = abap_true                 " stay in ATC Data mode
    WITH rb_get = abap_false
    WITH p_id   = p_id
    WITH s_obj IN s_obj
    WITH s_nsp IN s_nsp
    WITH p_dir  = p_dir
    WITH p_prev = p_prev                    " honour current/previous choice
    WITH p_bg   = abap_true
    VIA JOB lv_jobname NUMBER lv_jobcount
    AND RETURN.
  IF sy-subrc <> 0.
    MESSAGE 'Could not submit report to background job' TYPE 'E'.
  ENDIF.

  CALL FUNCTION 'JOB_CLOSE'
    EXPORTING
      jobcount             = lv_jobcount
      jobname              = lv_jobname
      strtimmed            = abap_true     " start as soon as a BTC WP is free
    EXCEPTIONS
      cant_start_immediate = 1
      invalid_startdate    = 2
      jobname_missing      = 3
      job_close_failed     = 4
      job_nosteps          = 5
      job_notex            = 6
      lock_failed          = 7
      OTHERS               = 8.
  IF sy-subrc = 0.
    MESSAGE |Background job { lv_jobname } ({ lv_jobcount }) scheduled. | &&
            |The ZIP will appear in DIR_TEMP (AL11) once it finishes.| TYPE 'S'.
  ELSE.
    MESSAGE 'Could not schedule background job' TYPE 'E'.
  ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form fetch_server_to_frontend
*&  Reads a file from the application server (OPEN DATASET ... BINARY)
*&  and streams it down to the frontend with GUI_DOWNLOAD (BIN). Avoids
*&  CG3Y and logical-file-path configuration. Must run in SAP GUI.
*&---------------------------------------------------------------------*
FORM fetch_server_to_frontend.

  DATA: lv_xstr   TYPE xstring,
        lv_chunk  TYPE xstring,
        lv_len    TYPE i,
        lv_total  TYPE i,
        lt_bin    TYPE solix_tab,
        lv_name   TYPE string,
        lv_full   TYPE string,
        lt_parts  TYPE STANDARD TABLE OF string.

  " 1) Read the server file fully into an xstring.
  OPEN DATASET p_src FOR INPUT IN BINARY MODE.
  IF sy-subrc <> 0.
    MESSAGE |Cannot open server file { p_src }| TYPE 'E'.
  ENDIF.

  DO.
    CLEAR lv_chunk.
    READ DATASET p_src INTO lv_chunk MAXIMUM LENGTH 8192 ACTUAL LENGTH lv_len.
    IF lv_len > 0.
      CONCATENATE lv_xstr lv_chunk(lv_len) INTO lv_xstr IN BYTE MODE.
    ENDIF.
    IF sy-subrc <> 0.            " end of file
      EXIT.
    ENDIF.
  ENDDO.
  CLOSE DATASET p_src.

  IF lv_xstr IS INITIAL.
    MESSAGE |Server file { p_src } is empty or unreadable| TYPE 'E'.
  ENDIF.

  " 2) Convert the xstring to a binary (SOLIX) table for GUI_DOWNLOAD.
  CALL FUNCTION 'SCMS_XSTRING_TO_BINARY'
    EXPORTING
      buffer        = lv_xstr
    IMPORTING
      output_length = lv_total
    TABLES
      binary_tab    = lt_bin.

  " 3) Derive the bare file name from the server path (split on / and \).
  SPLIT p_src AT '/' INTO TABLE lt_parts.
  READ TABLE lt_parts INTO lv_name INDEX lines( lt_parts ).
  IF lv_name CA '\'.
    CLEAR lt_parts.
    SPLIT lv_name AT '\' INTO TABLE lt_parts.
    READ TABLE lt_parts INTO lv_name INDEX lines( lt_parts ).
  ENDIF.
  IF lv_name IS INITIAL.
    lv_name = 'server_download.bin'.
  ENDIF.

  CONCATENATE p_dir lv_name INTO lv_full.    " p_dir already has trailing sep

  " 4) Stream down to the frontend in binary mode.
  cl_gui_frontend_services=>gui_download(
    EXPORTING
      filename     = lv_full
      filetype     = 'BIN'
      bin_filesize = lv_total
    CHANGING
      data_tab     = lt_bin
    EXCEPTIONS
      OTHERS       = 1 ).

  IF sy-subrc = 0.
    MESSAGE |Downloaded { lv_name } to { p_dir }| TYPE 'S'.
  ELSE.
    MESSAGE |GUI_DOWNLOAD failed for { lv_full }| TYPE 'E'.
  ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form run_gui_mode  - original frontend behaviour
*&---------------------------------------------------------------------*
FORM run_gui_mode.

  PERFORM run_in_gui.
  PERFORM normalize_folder CHANGING p_dir.
  PERFORM collect_findings.

  IF gt_obj IS INITIAL.
    MESSAGE 'No matching ATC findings / sub-objects found' TYPE 'E'.
  ENDIF.

  DATA lv_total TYPE i.
  DATA lv_done  TYPE i.
  lv_total = lines( gt_obj ).

  LOOP AT gt_obj INTO DATA(gs_obj).
    lv_done = lv_done + 1.
    PERFORM progress USING lv_done lv_total gs_obj-sobjname.
    PERFORM download_subobject USING gs_obj.
  ENDLOOP.

  IF gt_manifest IS NOT INITIAL.
    PERFORM write_manifest.
  ENDIF.

  PERFORM show_log.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form run_server_mode
*&  Background-safe: resolves DIR_TEMP, builds a ZIP of all sub-object
*&  sources plus a CSV manifest, and writes it to DIR_TEMP (AL11).
*&  Uses NO frontend / GUI services.
*&---------------------------------------------------------------------*
FORM run_server_mode.

  DATA: lv_dir_temp TYPE string,
        lv_zip_path  TYPE string,
        lv_zip_x     TYPE xstring,
        lv_stamp     TYPE char14,
        lv_zipname   TYPE string.

  " 1) Resolve the DIR_TEMP profile parameter (same path shown in AL11).
  PERFORM resolve_dir_temp CHANGING lv_dir_temp.
  IF lv_dir_temp IS INITIAL.
    MESSAGE 'Could not resolve DIR_TEMP on the application server' TYPE 'E'.
  ENDIF.

  " 2) Collect the sub-objects to download (no GUI needed).
  PERFORM collect_findings.
  IF gt_obj IS INITIAL.
    MESSAGE 'No matching ATC findings / sub-objects found' TYPE 'E'.
  ENDIF.

  " 3) Pack every sub-object source into the archive.
  CREATE OBJECT go_zip.

  DATA lv_total TYPE i.
  DATA lv_done  TYPE i.
  lv_total = lines( gt_obj ).

  LOOP AT gt_obj INTO DATA(gs_obj).
    lv_done = lv_done + 1.
    PERFORM progress USING lv_done lv_total gs_obj-sobjname.
    PERFORM zip_subobject USING gs_obj.
  ENDLOOP.

  " 4) Add the manifest (CSV) to the archive.
  PERFORM add_manifest_to_zip.

  " 5) Save the archive and write it to DIR_TEMP via OPEN DATASET.
  lv_zip_x = go_zip->save( ).

  CONCATENATE sy-datum sy-uzeit INTO lv_stamp.
  IF p_prev = abap_true.
    CONCATENATE 'ZATC_DOWNLOAD_PREV_' lv_stamp '.zip' INTO lv_zipname.
  ELSE.
    CONCATENATE 'ZATC_DOWNLOAD_' lv_stamp '.zip' INTO lv_zipname.
  ENDIF.

  " DIR_TEMP is a unix path on the app server -> use '/' as separator.
  IF lv_dir_temp CA '\'.
    CONCATENATE lv_dir_temp '\' lv_zipname INTO lv_zip_path.
  ELSE.
    CONCATENATE lv_dir_temp '/' lv_zipname INTO lv_zip_path.
  ENDIF.

  OPEN DATASET lv_zip_path FOR OUTPUT IN BINARY MODE.
  IF sy-subrc <> 0.
    MESSAGE |Cannot open { lv_zip_path } for output| TYPE 'E'.
  ENDIF.
  TRANSFER lv_zip_x TO lv_zip_path.
  CLOSE DATASET lv_zip_path.

  " 6) Report result (spool list when run in a background job).
  MESSAGE |ZIP written to { lv_zip_path }| TYPE 'S'.
  PERFORM write_log_list USING lv_zip_path.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form resolve_dir_temp
*&  Reads the DIR_TEMP profile parameter via the released FM
*&  SXPG_PROFILE_PARAMETER_GET.
*&---------------------------------------------------------------------*
FORM resolve_dir_temp CHANGING pv_dir TYPE string.

  DATA lv_value TYPE pfevalue.

  CLEAR pv_dir.

  CALL FUNCTION 'SXPG_PROFILE_PARAMETER_GET'
    EXPORTING
      parameter_name  = 'DIR_TEMP'
    IMPORTING
      parameter_value = lv_value
    EXCEPTIONS
      error           = 1
      OTHERS          = 2.

  IF sy-subrc = 0 AND lv_value IS NOT INITIAL.
    pv_dir = lv_value.
  ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form zip_subobject
*&  Reads one sub-object source and adds it as a .txt entry to the zip.
*&---------------------------------------------------------------------*
FORM zip_subobject USING ps_obj TYPE ty_obj.

  DATA: ls_log      TYPE ty_log,
        ls_manifest TYPE ty_manifest,
        lv_file     TYPE string,
        lv_text     TYPE string,
        lv_xstr     TYPE xstring,
        lv_versno   TYPE vrsd-versno,
        lv_found    TYPE abap_bool,
        lv_vinfo    TYPE string.

  ls_log-objtype  = ps_obj-objtype.
  ls_log-objname  = ps_obj-objname.
  ls_log-sobjname = ps_obj-sobjname.

  CLEAR: lv_versno, lv_found, lv_vinfo.
  REFRESH repos_tab.
  PERFORM get_subobject_source USING ps_obj
                               CHANGING lv_versno lv_vinfo lv_found.

  IF lv_found = abap_false.
    ls_log-status  = 'Skipped'.
    CONCATENATE 'No source could be read for this sub-object' lv_vinfo
      INTO ls_log-message SEPARATED BY space.
    APPEND ls_log TO gt_log.
    RETURN.
  ENDIF.

  ps_obj-versno = lv_versno.
  ls_log-versno = lv_versno.

  IF repos_tab IS INITIAL.
    ls_log-status  = 'Skipped'.
    CONCATENATE 'Source unreadable' lv_vinfo
      INTO ls_log-message SEPARATED BY space.
    APPEND ls_log TO gt_log.
    RETURN.
  ENDIF.

  " File name from the sub-object (namespace '/' -> '#').
  lv_file = ps_obj-sobjname.
  REPLACE ALL OCCURRENCES OF '/' IN lv_file WITH '#'.
  CONCATENATE lv_file '.txt' INTO lv_file.

  " Build the file content (text -> xstring, UTF-8).
  CLEAR lv_text.
  LOOP AT repos_tab INTO DATA(ls_line).
    CONCATENATE lv_text ls_line-line cl_abap_char_utilities=>cr_lf
      INTO lv_text.
  ENDLOOP.

  TRY.
      lv_xstr = cl_abap_codepage=>convert_to( source = lv_text ).
    CATCH cx_root.
      ls_log-status  = 'Error'.
      ls_log-message = 'Could not encode source to xstring'.
      APPEND ls_log TO gt_log.
      RETURN.
  ENDTRY.

  go_zip->add( name = lv_file content = lv_xstr ).

  ls_log-filename = lv_file.
  ls_log-status   = 'Success'.
  CONCATENATE 'Added to ZIP' lv_vinfo INTO ls_log-message SEPARATED BY space.
  APPEND ls_log TO gt_log.

  ls_manifest-objtype  = ps_obj-objtype.
  ls_manifest-objname  = ps_obj-objname.
  ls_manifest-sobjname = ps_obj-sobjname.
  ls_manifest-filename = lv_file.
  ls_manifest-versno   = ps_obj-versno.
  APPEND ls_manifest TO gt_manifest.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form add_manifest_to_zip  - CSV manifest (background-safe)
*&  Columns: Object Type;Object Name;Sub Object;File Name;Version Number
*&---------------------------------------------------------------------*
FORM add_manifest_to_zip.

  DATA: lv_csv  TYPE string,
        lv_xstr TYPE xstring,
        lv_row  TYPE string,
        lv_name TYPE string.

  CHECK gt_manifest IS NOT INITIAL.

  CONCATENATE 'Object Type' 'Object Name' 'Sub Object' 'File Name' 'Version Number'
    INTO lv_csv SEPARATED BY ';'.
  CONCATENATE lv_csv cl_abap_char_utilities=>cr_lf INTO lv_csv.

  LOOP AT gt_manifest INTO DATA(ls_man).
    CONCATENATE ls_man-objtype ls_man-objname ls_man-sobjname
                ls_man-filename ls_man-versno
      INTO lv_row SEPARATED BY ';'.
    CONCATENATE lv_csv lv_row cl_abap_char_utilities=>cr_lf INTO lv_csv.
  ENDLOOP.

  TRY.
      lv_xstr = cl_abap_codepage=>convert_to( source = lv_csv ).
    CATCH cx_root.
      RETURN.
  ENDTRY.

  IF p_prev = abap_true.
    lv_name = 'ZATC_DOWNLOAD_PREV_MANIFEST.csv'.
  ELSE.
    lv_name = 'ZATC_DOWNLOAD_MANIFEST.csv'.
  ENDIF.

  go_zip->add( name = lv_name content = lv_xstr ).

ENDFORM.

*&---------------------------------------------------------------------*
*& Form write_log_list  - simple spool list for background jobs
*&---------------------------------------------------------------------*
FORM write_log_list USING pv_zip TYPE string.

  WRITE: / 'ATC sub-object download - ZIP written to:', pv_zip.
  SKIP.
  WRITE: / 'Type', 'Object', 'Sub Object', 'Version', 'File', 'Status', 'Message'.
  ULINE.
  LOOP AT gt_log INTO DATA(ls_log).
    WRITE: / ls_log-objtype, ls_log-objname, ls_log-sobjname,
             ls_log-versno, ls_log-filename, ls_log-status, ls_log-message.
  ENDLOOP.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form collect_findings
*&  Reads the ATC result and builds the unique list of sub-objects to
*&  download (object type / object name / sub-object name).
*&---------------------------------------------------------------------*
FORM collect_findings.

  DATA: i_result_id          TYPE satc_d_ac_display_id,
        e_findings_extension TYPE satc_ci_findings_extension,
        e_ext_field_list     TYPE satc_ci_finding_ext_field_list.

  " Resolve the latest display id for the given run series name.
  SELECT * INTO TABLE @DATA(it_resulth)
    FROM satc_ac_resulth
    WHERE run_series_name = @p_id.
  IF sy-subrc <> 0.
    MESSAGE 'Wrong ATC variant / result name selected' TYPE 'E'.
  ENDIF.

  SORT it_resulth BY update_on DESCENDING.
  READ TABLE it_resulth INTO DATA(wa_resulth) INDEX 1.
  IF sy-subrc = 0.
    i_result_id = wa_resulth-display_id.
  ENDIF.

  TRY.
      DATA(result_access) = NEW cl_satc_api_factory( )->create_result_access( i_result_id ).
      result_access->get_findings(
        IMPORTING
          e_findings           = DATA(findings)
          e_findings_extension = e_findings_extension
          e_ext_field_list     = e_ext_field_list ).
    CATCH cx_satc_failure INTO DATA(lx_satc).
      MESSAGE lx_satc->get_text( ) TYPE 'E'.
  ENDTRY.

  " Check titles / message texts (same source the correction program uses)
  SELECT * INTO TABLE @DATA(it_chmmt) FROM satc_ac_chm_msgt_ddlv.
  SELECT * INTO TABLE @DATA(it_cmmmt) FROM satc_ac_cmm_msgt_ddlv.

  DATA gs_obj TYPE ty_obj.
  DATA lv_nsp TYPE trnspace-namespace.

  LOOP AT findings INTO DATA(finding)
       WHERE objname IN s_obj OR enhname IN s_obj.

    READ TABLE it_chmmt INTO DATA(wa_chmmt) WITH KEY ci_id = finding-test.
    IF sy-subrc = 0 AND wa_chmmt-title CS 'Prerequisites for the test'.
      CONTINUE.
    ENDIF.

    READ TABLE it_cmmmt INTO DATA(wa_cmmmt) WITH KEY message_id = finding-code.
    IF sy-subrc = 0 AND wa_cmmmt-title CS 'Syntax error'.
      CONTINUE.
    ENDIF.

    CLEAR gs_obj.
    gs_obj-objtype  = finding-objtype.
    gs_obj-objname  = finding-objname.
    gs_obj-sobjname = finding-sobjname.
    IF gs_obj-sobjname IS INITIAL.
      gs_obj-sobjname = finding-objname.   " fall back to the object itself
    ENDIF.

    " Namespace filter.
    IF s_nsp[] IS NOT INITIAL.
      PERFORM get_namespace USING gs_obj-sobjname CHANGING lv_nsp.
      IF lv_nsp NOT IN s_nsp.
        CONTINUE.
      ENDIF.
    ENDIF.

    APPEND gs_obj TO gt_obj.
  ENDLOOP.

  " Keep one entry per unique sub-object.
  SORT gt_obj BY objname sobjname.
  DELETE ADJACENT DUPLICATES FROM gt_obj COMPARING objname sobjname.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form get_namespace
*&---------------------------------------------------------------------*
FORM get_namespace USING pv_name TYPE clike
                   CHANGING pv_nsp TYPE trnspace-namespace.

  DATA: l_off TYPE i,
        l_len TYPE i,
        l_rest TYPE string.

  CLEAR pv_nsp.

  IF strlen( pv_name ) > 1 AND pv_name(1) = '/'.
    l_rest = pv_name+1.
    FIND FIRST OCCURRENCE OF '/' IN l_rest MATCH OFFSET l_off.
    IF sy-subrc = 0.
      l_len = l_off + 2.                " include both leading and trailing '/'
      pv_nsp = pv_name(l_len).
    ENDIF.
  ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form download_subobject  (frontend mode)
*&---------------------------------------------------------------------*
FORM download_subobject USING ps_obj TYPE ty_obj.

  DATA: ls_log      TYPE ty_log,
        ls_manifest TYPE ty_manifest,
        lv_file     TYPE string,
        lv_fullpath TYPE string,
        lv_versno   TYPE vrsd-versno,
        lv_found    TYPE abap_bool,
        lv_vinfo    TYPE string.

  ls_log-objtype  = ps_obj-objtype.
  ls_log-objname  = ps_obj-objname.
  ls_log-sobjname = ps_obj-sobjname.

  CLEAR: lv_versno, lv_found, lv_vinfo.
  REFRESH repos_tab.
  PERFORM get_subobject_source USING ps_obj
                               CHANGING lv_versno lv_vinfo lv_found.

  IF lv_found = abap_false OR repos_tab IS INITIAL.
    ls_log-status  = 'Skipped'.
    CONCATENATE 'No source could be read for this sub-object' lv_vinfo
      INTO ls_log-message SEPARATED BY space.
    APPEND ls_log TO gt_log.
    RETURN.
  ENDIF.

  ps_obj-versno = lv_versno.
  ls_log-versno = lv_versno.

  lv_file = ps_obj-sobjname.
  REPLACE ALL OCCURRENCES OF '/' IN lv_file WITH '#'.
  CONCATENATE lv_file '.txt' INTO lv_file.
  CONCATENATE p_dir lv_file INTO lv_fullpath.

  CALL FUNCTION 'GUI_DOWNLOAD'
    EXPORTING
      filename = lv_fullpath
      filetype = 'ASC'
    TABLES
      data_tab = repos_tab
    EXCEPTIONS
      OTHERS   = 1.

  IF sy-subrc = 0.
    ls_log-filename = lv_file.
    ls_log-status   = 'Success'.
    CONCATENATE 'Downloaded' lv_vinfo INTO ls_log-message SEPARATED BY space.

    ls_manifest-objtype  = ps_obj-objtype.
    ls_manifest-objname  = ps_obj-objname.
    ls_manifest-sobjname = ps_obj-sobjname.
    ls_manifest-filename = lv_file.
    ls_manifest-versno   = ps_obj-versno.
    APPEND ls_manifest TO gt_manifest.
  ELSE.
    ls_log-status  = 'Error'.
    ls_log-message = 'GUI_DOWNLOAD failed'.
  ENDIF.

  APPEND ls_log TO gt_log.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form get_subobject_source
*&  Dispatcher: fills the global REPOS_TAB with the source of one
*&  sub-object, choosing the version per the P_PREV checkbox.
*&    P_PREV = ' ' -> current active version  (FORM read_source)
*&    P_PREV = 'X' -> previous active version  (FORM fetch_previous_source)
*&  p_versno carries the resolved version number (0 in current mode),
*&  p_vinfo a short note for the log, p_found whether source was read.
*&---------------------------------------------------------------------*
FORM get_subobject_source USING    ps_obj   TYPE ty_obj
                          CHANGING p_versno TYPE vrsd-versno
                                   p_vinfo  TYPE string
                                   p_found  TYPE abap_bool.

  CLEAR: p_versno, p_vinfo, p_found.

  IF p_prev = abap_true.
    PERFORM fetch_previous_source USING ps_obj
                                  CHANGING p_versno p_vinfo p_found.
  ELSE.
    PERFORM read_source USING ps_obj.
    IF repos_tab IS NOT INITIAL.
      p_found = abap_true.
      p_vinfo = '(active version)'.
    ENDIF.
  ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form read_source  - fills REPOS_TAB for one sub-object
*&---------------------------------------------------------------------*
FORM read_source USING ps_obj TYPE ty_obj.

  CASE ps_obj-objtype.
    WHEN 'SSFO'.
      " Smart Form: resolve the generated function module and read it.
      PERFORM read_smartform_source USING ps_obj.

    WHEN 'PROG' OR 'FUGR' OR 'FUGS' OR 'SFPF'.
      object_name = ps_obj-sobjname.
      CALL FUNCTION 'SVRS_GET_VERSION_REPS_40'
        EXPORTING
          object_name           = object_name
          versno                = '00000'
        TABLES
          repos_tab             = repos_tab
        EXCEPTIONS
          no_version            = 1
          system_failure        = 2
          communication_failure = 3.

    WHEN 'CLAS'.
      CLEAR l_seoclskey.
      l_seoclskey = ps_obj-objname.
      CALL FUNCTION 'SEO_CLASS_GET_METHOD_INCLUDES'
        EXPORTING
          clskey                       = l_seoclskey
        IMPORTING
          includes                     = it_includes
        EXCEPTIONS
          _internal_class_not_existing = 1
          OTHERS                       = 2.
      IF sy-subrc = 0.
        READ TABLE it_includes INTO DATA(wa_includes)
          WITH KEY incname = ps_obj-sobjname.
        IF sy-subrc = 0.
          CLEAR ls_mtdkey.
          REFRESH ex_source_code_tab.
          ls_mtdkey-clsname = wa_includes-cpdkey-clsname.
          ls_mtdkey-cpdname = wa_includes-cpdkey-cpdname.
          CALL FUNCTION 'SEO_METHOD_GET_SOURCE'
            EXPORTING
              mtdkey                        = ls_mtdkey
            IMPORTING
              source                        = lt_source
              source_expanded               = ex_source_code_tab
            EXCEPTIONS
              _internal_method_not_existing = 1
              _internal_class_not_existing  = 2
              version_not_existing          = 3
              inactive_new                  = 4
              inactive_deleted              = 5
              OTHERS                        = 6.
          IF sy-subrc = 0.
            LOOP AT ex_source_code_tab INTO DATA(ls_source).
              wa_blank-line = ls_source.
              APPEND wa_blank TO repos_tab.
              CLEAR wa_blank.
            ENDLOOP.
          ENDIF.
        ELSE.
          " Not a method include -> try the class sections.
          DATA l_limu TYPE c LENGTH 4.
          DO 3 TIMES.
            CASE sy-index.
              WHEN 1. l_limu = 'CPUB'.
              WHEN 2. l_limu = 'CPRO'.
              WHEN 3. l_limu = 'CPRI'.
            ENDCASE.
            l_clkey-clsname = ps_obj-objname.
            CALL FUNCTION 'SEO_SECTION_GET_SOURCE'
              EXPORTING
                cifkey               = l_clkey
                limu                 = l_limu
                state                = 'A'
              IMPORTING
                source               = lt_source_seo
                incname              = l_program_sec
              EXCEPTIONS
                class_not_existing   = 1
                version_not_existing = 2
                OTHERS               = 3.
            IF lt_source_seo[] IS NOT INITIAL AND l_program_sec = ps_obj-sobjname.
              LOOP AT lt_source_seo INTO DATA(ls_seo).
                wa_blank-line = ls_seo.
                APPEND wa_blank TO repos_tab.
                CLEAR wa_blank.
              ENDLOOP.
              EXIT.
            ENDIF.
          ENDDO.
        ENDIF.
      ENDIF.

    WHEN OTHERS.
      object_name = ps_obj-sobjname.
      CALL FUNCTION 'SVRS_GET_VERSION_REPS_40'
        EXPORTING
          object_name           = object_name
          versno                = '00000'
        TABLES
          repos_tab             = repos_tab
        EXCEPTIONS
          no_version            = 1
          system_failure        = 2
          communication_failure = 3.
  ENDCASE.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form read_smartform_source
*&  Smart Form (SSFO) source is NOT stored as REPS. A Smart Form is
*&  compiled into a generated function module on activation, and its code
*&  lives in that FM's include. Steps:
*&    1) SSF_FUNCTION_MODULE_NAME - resolve the generated FM for the form
*&    2) FUNCTION_INCLUDE_INFO    - resolve the include holding the FM body
*&    3) READ REPORT              - read the generated source into REPOS_TAB
*&---------------------------------------------------------------------*
FORM read_smartform_source USING ps_obj TYPE ty_obj.

  DATA: lv_formname TYPE tdsfname,
        lv_fm_name  TYPE rs38l_fnam,
        lv_group    TYPE rs38l_area,
        lv_include  TYPE program.

  " The main object of a Smart Form finding is the form name.
  lv_formname = ps_obj-objname.
  IF lv_formname IS INITIAL.
    lv_formname = ps_obj-sobjname.
  ENDIF.

  " 1) Resolve the generated function module for this Smart Form.
  CALL FUNCTION 'SSF_FUNCTION_MODULE_NAME'
    EXPORTING
      formname           = lv_formname
    IMPORTING
      fm_name            = lv_fm_name
    EXCEPTIONS
      no_form            = 1
      no_function_module = 2
      OTHERS             = 3.
  IF sy-subrc <> 0 OR lv_fm_name IS INITIAL.
    RETURN.
  ENDIF.

  " 2) Resolve the include that carries the generated FM source.
  CALL FUNCTION 'FUNCTION_INCLUDE_INFO'
    CHANGING
      funcname = lv_fm_name
      group    = lv_group
      include  = lv_include
    EXCEPTIONS
      OTHERS   = 1.
  IF sy-subrc <> 0 OR lv_include IS INITIAL.
    RETURN.
  ENDIF.

  " 3) Read the generated function-module source code.
  READ REPORT lv_include INTO repos_tab.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form fetch_previous_source
*&  Resolves the PREVIOUS active version of one sub-object AND reads its
*&  historical source into the global REPOS_TAB. Object-type aware.
*&  SEO_*_GET_SOURCE are NOT used (they return the current active source).
*&     PROG / FUGR / FUGS / SFPF / SSFO -> REPS include
*&     CLAS                             -> method (METH) or section version
*&  p_vinfo carries a short note used in the log, e.g. '(via METH)'.
*&---------------------------------------------------------------------*
FORM fetch_previous_source USING    ps_obj    TYPE ty_obj
                           CHANGING p_versno  TYPE vrsd-versno
                                    p_vinfo   TYPE string
                                    p_found   TYPE abap_bool.

  CLEAR: p_versno, p_found, p_vinfo.

  CASE ps_obj-objtype.
    WHEN 'SSFO'.
      " Smart Form: the generated function module is not version-managed,
      " so download its current generated source code.
      PERFORM read_smartform_source USING ps_obj.
      IF repos_tab IS NOT INITIAL.
        p_found = abap_true.
        p_vinfo = '(smartform generated FM)'.
      ENDIF.

    WHEN 'PROG' OR 'FUGR' OR 'FUGS' OR 'SFPF'.
      PERFORM get_previous_version USING ps_obj-sobjname 'REPS'
                                   CHANGING p_versno p_found.
      IF p_found = abap_true.
        p_vinfo = '(prev. via REPS)'.
        PERFORM read_reps USING ps_obj-sobjname p_versno.
      ENDIF.

    WHEN 'CLAS'.
      PERFORM fetch_class_prev USING ps_obj
                               CHANGING p_versno p_vinfo p_found.

    WHEN OTHERS.
      PERFORM get_previous_version USING ps_obj-sobjname 'REPS'
                                   CHANGING p_versno p_found.
      IF p_found = abap_true.
        p_vinfo = '(prev. via REPS)'.
        PERFORM read_reps USING ps_obj-sobjname p_versno.
      ENDIF.
  ENDCASE.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form fetch_class_prev
*&  Handles the previous version of a CLAS sub-object (finding-sobjname
*&  is the generated include name). Tries: direct REPS version, then the
*&  method include via METH (class + method name), then the class
*&  sections (CPUB / CPRO / CPRI / CLSD) generically.
*&---------------------------------------------------------------------*
FORM fetch_class_prev USING    ps_obj   TYPE ty_obj
                      CHANGING p_versno TYPE vrsd-versno
                               p_vinfo  TYPE string
                               p_found  TYPE abap_bool.

  DATA: l_clskey    TYPE seoclskey,
        it_includes TYPE seop_methods_w_include,
        lv_meth_obj TYPE versobjnam,
        lt_sects    TYPE tt_objtype,
        lv_sect     TYPE vrsd-objtype,
        lv_clsname  TYPE versobjnam.

  CLEAR: p_versno, p_found, p_vinfo.

  " 1) Direct REPS version of the include.
  PERFORM get_previous_version USING ps_obj-sobjname 'REPS'
                               CHANGING p_versno p_found.
  IF p_found = abap_true.
    PERFORM read_reps USING ps_obj-sobjname p_versno.
    IF repos_tab IS NOT INITIAL.
      p_vinfo = '(prev. via REPS)'.
      RETURN.
    ENDIF.
    CLEAR: p_versno, p_found.
  ENDIF.

  " 2) Method include -> METH version object (class name + method name).
  l_clskey = ps_obj-objname.
  CALL FUNCTION 'SEO_CLASS_GET_METHOD_INCLUDES'
    EXPORTING
      clskey                       = l_clskey
    IMPORTING
      includes                     = it_includes
    EXCEPTIONS
      _internal_class_not_existing = 1
      OTHERS                       = 2.
  IF sy-subrc = 0.
    READ TABLE it_includes INTO DATA(wa_includes)
      WITH KEY incname = ps_obj-sobjname.
    IF sy-subrc = 0.
      CLEAR lv_meth_obj.
      lv_meth_obj    = wa_includes-cpdkey-clsname.   " class name, pos 1-30
      lv_meth_obj+30 = wa_includes-cpdkey-cpdname.   " method name, from pos 31
      PERFORM get_previous_version USING lv_meth_obj 'METH'
                                   CHANGING p_versno p_found.
      IF p_found = abap_true.
        p_vinfo = '(prev. via METH)'.
        PERFORM read_meth USING lv_meth_obj p_versno.
      ENDIF.
      RETURN.
    ENDIF.
  ENDIF.

  " 3) Section / definition include -> best-effort generic version read.
  CLEAR lv_clsname.
  lv_clsname = ps_obj-objname.
  CLEAR lt_sects.
  APPEND 'CPUB' TO lt_sects.
  APPEND 'CPRO' TO lt_sects.
  APPEND 'CPRI' TO lt_sects.
  APPEND 'CLSD' TO lt_sects.

  LOOP AT lt_sects INTO lv_sect.
    CLEAR: p_versno, p_found.
    PERFORM get_previous_version USING lv_clsname lv_sect
                                 CHANGING p_versno p_found.
    IF p_found = abap_true.
      PERFORM read_generic USING lv_clsname p_versno lv_sect.
      IF repos_tab IS NOT INITIAL.
        CONCATENATE '(prev. via' lv_sect ')' INTO p_vinfo SEPARATED BY space.
        RETURN.
      ENDIF.
      CLEAR: p_versno, p_found.
    ENDIF.
  ENDLOOP.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form read_reps  - historical REPS include via SVRS_GET_VERSION_REPS_40
*&---------------------------------------------------------------------*
FORM read_reps USING pv_objname TYPE clike
                     pv_versno  TYPE vrsd-versno.

  object_name = pv_objname.
  CALL FUNCTION 'SVRS_GET_VERSION_REPS_40'
    EXPORTING
      object_name           = object_name
      versno                = pv_versno
    TABLES
      repos_tab             = repos_tab
    EXCEPTIONS
      no_version            = 1
      system_failure        = 2
      communication_failure = 3.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form read_meth  - historical method (LIMU METH) via SVRS_GET_VERSION_METH_40
*&---------------------------------------------------------------------*
FORM read_meth USING pv_objname TYPE versobjnam
                     pv_versno  TYPE vrsd-versno.

  DATA: lt_vsmodisrc TYPE STANDARD TABLE OF smodisrc,
        lt_vsmodilog TYPE STANDARD TABLE OF smodilog,
        lt_trdir     TYPE STANDARD TABLE OF trdir.

  CALL FUNCTION 'SVRS_GET_VERSION_METH_40'
    EXPORTING
      object_name = pv_objname
      versno      = pv_versno
    TABLES
      vsmodisrc   = lt_vsmodisrc
      repos_tab   = repos_tab
      vsmodilog   = lt_vsmodilog
      trdir_tab   = lt_trdir
    EXCEPTIONS
      no_version  = 1
      OTHERS      = 2.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form read_generic  - class section version via generic SVRS_GET_VERSION
*&---------------------------------------------------------------------*
FORM read_generic USING pv_objname  TYPE clike
                        pv_versno   TYPE vrsd-versno
                        pv_vobjtype TYPE vrsd-objtype.

  DATA: lo_obj  TYPE svrs2_versionable_object,
        wa_text TYPE abaptxt255.

  CLEAR lo_obj.
  lo_obj-objtype     = pv_vobjtype.
  lo_obj-objname     = pv_objname.
  lo_obj-versno      = pv_versno.
  lo_obj-destination = space.

  CALL FUNCTION 'SVRS_GET_VERSION'
    CHANGING
      object              = lo_obj
    EXCEPTIONS
      communication_error = 1
      system_error        = 2
      no_version          = 3
      version_unreadable  = 4
      OTHERS              = 5.

  IF sy-subrc = 0.
    LOOP AT lo_obj-reps-abaptext INTO wa_text.
      APPEND wa_text TO repos_tab.
    ENDLOOP.
  ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form get_previous_version
*&  Returns the PREVIOUS active version (INDEX 2 of the real, non-baseline
*&  version list). Falls back to INDEX 1 when only one version exists.
*&---------------------------------------------------------------------*
FORM get_previous_version USING    p_objname LIKE vrsd-objname
                                   p_objtype LIKE vrsd-objtype
                          CHANGING p_versno  LIKE vrsd-versno
                                   p_found   TYPE abap_bool.

  DATA: lt_version_list  TYPE STANDARD TABLE OF vrsd_40a,
        lt_lversno_list  TYPE STANDARD TABLE OF vrsn,
        lt_real_versions TYPE STANDARD TABLE OF vrsd_40a,
        wa_version       TYPE vrsd_40a,
        lv_fm_objname    LIKE vrsd_40a-objname,
        lv_fm_objtype    LIKE vrsd_40a-objtype.

  CLEAR: p_versno, p_found.

  lv_fm_objname = p_objname.
  lv_fm_objtype = p_objtype.

  CALL FUNCTION 'SVRS_GET_VERSION_DIRECTORY_40'
    EXPORTING
      objname               = lv_fm_objname
      objtype               = lv_fm_objtype
    TABLES
      lversno_list          = lt_lversno_list
      version_list          = lt_version_list
    EXCEPTIONS
      no_entry              = 1
      communication_failure = 2
      system_failure        = 3.

  IF sy-subrc <> 0 OR lt_version_list IS INITIAL.
    RETURN.
  ENDIF.

  SORT lt_version_list BY datum DESCENDING zeit DESCENDING.

  LOOP AT lt_version_list INTO wa_version WHERE datum <> '00000000' AND versmode <> 'U'.
    APPEND wa_version TO lt_real_versions.
  ENDLOOP.

  IF lt_real_versions IS INITIAL.
    RETURN.
  ENDIF.

  " INDEX 2 = previous active version (INDEX 1 is the current one).
  READ TABLE lt_real_versions INTO wa_version INDEX 2.
  IF sy-subrc = 0.
    p_versno = wa_version-versno.
    p_found  = abap_true.
  ELSE.
    READ TABLE lt_real_versions INTO wa_version INDEX 1.
    IF sy-subrc = 0.
      p_versno = wa_version-versno.
      p_found  = abap_true.
    ENDIF.
  ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form write_manifest  (frontend mode - CSV via GUI_DOWNLOAD)
*&  Written as a semicolon-separated CSV (the same layout the background
*&  ZIP mode uses). This avoids SAP_CONVERT_TO_XLS_FORMAT, which relies
*&  on OLE / Excel automation and fails on many systems. Excel opens the
*&  resulting .csv directly.
*&  Columns: Object Type;Object Name;Sub Object;File Name;Version Number
*&---------------------------------------------------------------------*
FORM write_manifest.

  DATA: lt_lines TYPE STANDARD TABLE OF string,
        lv_row   TYPE string,
        lv_file  TYPE string,
        lv_full  TYPE string,
        lv_stamp TYPE char14.

  " Header row.
  CONCATENATE 'Object Type' 'Object Name' 'Sub Object' 'File Name' 'Version Number'
    INTO lv_row SEPARATED BY ';'.
  APPEND lv_row TO lt_lines.

  " Data rows.
  LOOP AT gt_manifest INTO DATA(ls_man).
    CONCATENATE ls_man-objtype ls_man-objname ls_man-sobjname
                ls_man-filename ls_man-versno
      INTO lv_row SEPARATED BY ';'.
    APPEND lv_row TO lt_lines.
  ENDLOOP.

  CONCATENATE sy-datum sy-uzeit INTO lv_stamp.
  IF p_prev = abap_true.
    CONCATENATE 'ZATC_DOWNLOAD_PREV_MANIFEST_' lv_stamp '.csv' INTO lv_file.
  ELSE.
    CONCATENATE 'ZATC_DOWNLOAD_MANIFEST_' lv_stamp '.csv' INTO lv_file.
  ENDIF.
  CONCATENATE p_dir lv_file INTO lv_full.

  cl_gui_frontend_services=>gui_download(
    EXPORTING
      filename = lv_full
      filetype = 'ASC'
    CHANGING
      data_tab = lt_lines
    EXCEPTIONS
      OTHERS   = 1 ).

  IF sy-subrc = 0.
    MESSAGE |Manifest written: { lv_file }| TYPE 'S'.
  ELSE.
    MESSAGE 'Manifest download failed' TYPE 'I'.
  ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form f4_folder
*&---------------------------------------------------------------------*
FORM f4_folder CHANGING pv_dir TYPE string.

  DATA lv_folder TYPE string.

  cl_gui_frontend_services=>directory_browse(
    EXPORTING
      window_title    = 'Select target folder'
    CHANGING
      selected_folder = lv_folder
    EXCEPTIONS
      OTHERS          = 1 ).

  IF lv_folder IS NOT INITIAL.
    pv_dir = lv_folder.
  ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form normalize_folder  - ensure a trailing path separator
*&---------------------------------------------------------------------*
FORM normalize_folder CHANGING pv_dir TYPE string.

  DATA lv_len TYPE i.
  lv_len = strlen( pv_dir ).
  IF lv_len > 0
     AND substring( val = pv_dir off = lv_len - 1 len = 1 ) <> gv_sep.
    CONCATENATE pv_dir gv_sep INTO pv_dir.
  ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form run_in_gui  - frontend mode must run in SAP GUI
*&---------------------------------------------------------------------*
FORM run_in_gui.

  DATA l_url TYPE string.
  CALL FUNCTION 'WEBGUI_GET_FLP_URL'
    IMPORTING
      url = l_url.
  IF l_url IS NOT INITIAL.
    MESSAGE 'Program can only be executed in SAP GUI' TYPE 'E'.
  ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form progress
*&---------------------------------------------------------------------*
FORM progress USING pv_done TYPE i pv_total TYPE i pv_text TYPE clike.

  " SAPGUI_PROGRESS_INDICATOR is harmless in background (simply ignored).
  DATA(lv_pct) = COND i( WHEN pv_total > 0 THEN pv_done * 100 / pv_total ELSE 0 ).
  CALL FUNCTION 'SAPGUI_PROGRESS_INDICATOR'
    EXPORTING
      percentage = lv_pct
      text       = |Processing { pv_text } ({ pv_done }/{ pv_total })|.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form show_log  - ALV summary (frontend mode)
*&---------------------------------------------------------------------*
FORM show_log.

  DATA: lo_alv     TYPE REF TO cl_salv_table,
        lo_columns TYPE REF TO cl_salv_columns_table,
        lo_col     TYPE REF TO cl_salv_column,
        lv_short   TYPE scrtext_s,
        lv_med     TYPE scrtext_m,
        lv_long    TYPE scrtext_l.

  TRY.
      cl_salv_table=>factory(
        IMPORTING r_salv_table = lo_alv
        CHANGING  t_table      = gt_log ).

      lo_alv->get_functions( )->set_all( abap_true ).

      lo_columns = lo_alv->get_columns( ).
      lo_columns->set_optimize( abap_true ).

      TRY.
          lo_col = lo_columns->get_column( 'OBJTYPE' ).
          lv_short = 'Type'.    lv_med = 'Obj Type'.    lv_long = 'Object Type'.
          lo_col->set_short_text( lv_short ).
          lo_col->set_medium_text( lv_med ).
          lo_col->set_long_text( lv_long ).

          lo_col = lo_columns->get_column( 'OBJNAME' ).
          lv_short = 'Object'. lv_med = 'Object Name'. lv_long = 'Object Name'.
          lo_col->set_short_text( lv_short ).
          lo_col->set_medium_text( lv_med ).
          lo_col->set_long_text( lv_long ).

          lo_col = lo_columns->get_column( 'SOBJNAME' ).
          lv_short = 'SubObj'. lv_med = 'Sub Object'.  lv_long = 'Sub Object'.
          lo_col->set_short_text( lv_short ).
          lo_col->set_medium_text( lv_med ).
          lo_col->set_long_text( lv_long ).

          lo_col = lo_columns->get_column( 'VERSNO' ).
          lv_short = 'Version'. lv_med = 'Version No'. lv_long = 'Version Number'.
          lo_col->set_short_text( lv_short ).
          lo_col->set_medium_text( lv_med ).
          lo_col->set_long_text( lv_long ).

          lo_col = lo_columns->get_column( 'FILENAME' ).
          lv_short = 'File'.   lv_med = 'File Name'.   lv_long = 'File Name'.
          lo_col->set_short_text( lv_short ).
          lo_col->set_medium_text( lv_med ).
          lo_col->set_long_text( lv_long ).

          lo_col = lo_columns->get_column( 'STATUS' ).
          lv_short = 'Status'. lv_med = 'Status'.      lv_long = 'Status'.
          lo_col->set_short_text( lv_short ).
          lo_col->set_medium_text( lv_med ).
          lo_col->set_long_text( lv_long ).

          lo_col = lo_columns->get_column( 'MESSAGE' ).
          lv_short = 'Msg'.    lv_med = 'Message'.     lv_long = 'Message'.
          lo_col->set_short_text( lv_short ).
          lo_col->set_medium_text( lv_med ).
          lo_col->set_long_text( lv_long ).
        CATCH cx_salv_not_found.
      ENDTRY.

      lo_alv->display( ).
    CATCH cx_salv_msg INTO DATA(lx).
      MESSAGE lx->get_text( ) TYPE 'I'.
  ENDTRY.

ENDFORM.
