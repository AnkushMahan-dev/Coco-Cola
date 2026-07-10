*&---------------------------------------------------------------------*
*& Report  ZR_PROG_LINE_COUNTER
*&---------------------------------------------------------------------*
*& Title       : Source Code Line Counter (Main Program + Includes)
*& Application : SAP ECC 6.0 - compatible (NetWeaver 7.00 and higher,
*&               no S/4HANA-only syntax or classes are used)
*& Purpose     : For every object entered on the selection screen, count
*&               the number of source-code lines of THAT object and
*&               display it together with its main program:
*&                 - Object Name  = always the entered object itself
*&                 - Main Program = the entered program itself, or the
*&                                  underlying main program / pool of the
*&                                  entered object
*&               Includes of a main program are NOT expanded - only the
*&               objects actually entered appear in the output.
*&
*&               Supported object types (Object Type column):
*&                 PROG    - report / module pool / subroutine pool
*&                 INCLUDE - include (one row per main program)
*&                 CLAS    - global class  (all class includes summed)
*&                 INTF    - global interface
*&                 FUNC    - function module (its source include)
*&                 FUGR    - function group (all group includes summed)
*&                 SSFO    - smartform (its generated function module)
*&                 ENHO    - enhancement (recognised; see notes)
*&
*&               The result is presented in a standard ALV grid that
*&               supports the full set of ALV features (sort, filter,
*&               multiple sort, layout variants, Excel export, print,
*&               find / search, hide / show columns, resizing, totals /
*&               subtotals and all standard toolbar functions).
*&
*& Object type : Local object ($TMP) - development class / package $TMP
*&
*& Author      : Diligent Global
*& Date        : 2026-07-09
*&---------------------------------------------------------------------*
*& Change history
*&   2026-07-09  Initial version
*&---------------------------------------------------------------------*
REPORT zr_prog_line_counter LINE-SIZE 255.

*&---------------------------------------------------------------------*
*& Tables (used for the selection-screen reference field only)
*&---------------------------------------------------------------------*
TABLES trdir.

*&---------------------------------------------------------------------*
*& Global type definitions
*&---------------------------------------------------------------------*
* Plain list of program / object names
TYPES tt_program TYPE STANDARD TABLE OF programm WITH DEFAULT KEY.

TYPES: BEGIN OF ty_output,
         main_program TYPE programm,      " Original / actual main program
         object_name  TYPE programm,      " Program or include name
         object_type  TYPE char10,        " PROG / INCLUDE
         no_of_lines  TYPE i,             " Total source code lines
       END OF ty_output,
       tt_output TYPE STANDARD TABLE OF ty_output WITH DEFAULT KEY.

* Message log for objects that could not be processed
TYPES: BEGIN OF ty_message,
         object_name TYPE programm,
         text        TYPE string,
       END OF ty_message,
       tt_message TYPE STANDARD TABLE OF ty_message WITH DEFAULT KEY.

* Constants for the object type column and program sub-type
CONSTANTS: gc_type_prog    TYPE char10      VALUE 'PROG',
           gc_type_include TYPE char10      VALUE 'INCLUDE',
           gc_type_class   TYPE char10      VALUE 'CLAS',
           gc_type_intf    TYPE char10      VALUE 'INTF',
           gc_type_func    TYPE char10      VALUE 'FUNC',
           gc_type_fugr    TYPE char10      VALUE 'FUGR',
           gc_type_form    TYPE char10      VALUE 'SSFO',
           gc_type_enho    TYPE char10      VALUE 'ENHO',
           gc_type_enhs    TYPE char10      VALUE 'ENHS',
           gc_type_enhc    TYPE char10      VALUE 'ENHC',
           gc_subc_include TYPE trdir-subc  VALUE 'I'.

* Fan-out guard: a widely shared include can belong to a very large
* number of main programs. When an include is entered, one output row is
* produced per main program it belongs to; this caps that number so the
* output stays manageable for a common / shared include.
CONSTANTS gc_max_mainprograms TYPE i VALUE 50.

*&---------------------------------------------------------------------*
*& Selection screen
*&---------------------------------------------------------------------*
* SELECT-OPTIONS for the program / object name.
*   NO INTERVALS  -> hides the "high" field so that only single values
*                    can be maintained on the main screen.
* Multiple single values (multiple selections) remain possible via the
* multiple-selection push button. Interval maintenance in the complex
* selection popup is additionally rejected in AT SELECTION-SCREEN below.
SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE text-b01.
SELECT-OPTIONS so_prog FOR trdir-name NO INTERVALS.
SELECTION-SCREEN END OF BLOCK b1.

*&---------------------------------------------------------------------*
*& Local class - encapsulates the whole processing logic
*&---------------------------------------------------------------------*
CLASS lcl_line_counter DEFINITION FINAL.

  PUBLIC SECTION.

    METHODS:
      "! Main entry point - drives collection and display
      run,

      "! Reads all objects from the selection screen and collects
      "! main program + include line counts into GT_OUTPUT.
      collect_data.

  PRIVATE SECTION.

    DATA: gt_output   TYPE tt_output,
          gt_messages TYPE tt_message.

    METHODS:
      "! Processes a single object entered on the selection screen:
      "! determines its type, resolves its source and adds the output row.
      process_object
        IMPORTING iv_object TYPE programm,

      "! Determines the object kind (PROG / INCLUDE / CLAS / INTF / FUNC /
      "! FUGR / SSFO / ENHO) of the entered name using TFDIR, TADIR and
      "! TRDIR. Returns space when the object is unknown / unsupported.
      get_object_kind
        IMPORTING iv_object      TYPE programm
        RETURNING VALUE(rv_kind) TYPE char10,

      "! Handles an entered INCLUDE: one row per main program it belongs
      "! to (the include itself is what appears in the OBJECT NAME column).
      process_include
        IMPORTING iv_object TYPE programm,

      "! Resolves the set of source includes to be counted for the
      "! non-program object kinds (class, interface, function group,
      "! function module, smartform). ev_message is filled when the object
      "! is recognised but its source cannot be counted.
      collect_source_by_kind
        IMPORTING iv_object    TYPE programm
                  iv_kind      TYPE char10
        EXPORTING ev_main      TYPE programm
                  et_includes  TYPE tt_program
                  ev_message   TYPE string,

      "! Builds the function-group main program name (SAPL...) from the
      "! group name, handling namespaces (/NS/GRP -> /NS/SAPLGRP).
      build_pool_name
        IMPORTING iv_group      TYPE programm
        RETURNING VALUE(rv_pool) TYPE programm,

      "! Returns the source include (and its program) of a function module.
      "! iv_func is generic so both a 30-char function name and a 40-char
      "! program-name field can be passed.
      get_func_details
        IMPORTING iv_func     TYPE clike
        EXPORTING ev_program  TYPE programm
                  ev_include  TYPE programm
                  ev_ok       TYPE abap_bool,

      "! Resolves the main program(s) that a given include belongs to by
      "! reading the program include index table D010INC directly (no
      "! function module). Returns an empty table for an orphan include
      "! (no master program).
      resolve_main_programs
        IMPORTING iv_include     TYPE programm
        RETURNING VALUE(rt_main) TYPE tt_program,

      "! Reads the source of an object and returns its line count.
      "! Returns -1 when the source could not be read.
      get_line_count
        IMPORTING iv_object       TYPE programm
        RETURNING VALUE(rv_lines) TYPE i,

      "! Adds one row to the output table (with de-duplication).
      add_output_row
        IMPORTING iv_main_program TYPE programm
                  iv_object_name  TYPE programm
                  iv_object_type  TYPE char10
                  iv_lines        TYPE i,

      "! Central authority check for reading development sources.
      is_authorized
        IMPORTING iv_object            TYPE programm
        RETURNING VALUE(rv_authorized) TYPE abap_bool,

      "! Adds a message to the processing log.
      add_message
        IMPORTING iv_object TYPE programm
                  iv_text   TYPE string,

      "! Displays GT_OUTPUT in a fully featured ALV grid.
      display_alv,

      "! Displays the collected processing messages (if any).
      display_messages.

ENDCLASS.                    "lcl_line_counter DEFINITION

*&---------------------------------------------------------------------*
*& Local class implementation
*&---------------------------------------------------------------------*
CLASS lcl_line_counter IMPLEMENTATION.

  METHOD run.

    collect_data( ).

    IF gt_output IS INITIAL.
      MESSAGE 'No source code could be read for the selected objects'(m01)
              TYPE 'S' DISPLAY LIKE 'W'.
      display_messages( ).
      RETURN.
    ENDIF.

    display_alv( ).
    display_messages( ).

  ENDMETHOD.                    "run

  METHOD collect_data.

    DATA: lt_objects TYPE tt_program,
          lv_object  TYPE programm,
          ls_prog    LIKE LINE OF so_prog.

    " Collect the object names entered as single values. The entered
    " names are used directly (not filtered through TRDIR) so that all
    " supported object types - classes, function modules, smartforms,
    " etc., which are not stored in TRDIR under their own name - are
    " processed. An explicit work area is used because the select-option
    " header line is not available in the OO (method) context.
    LOOP AT so_prog INTO ls_prog WHERE low IS NOT INITIAL.
      lv_object = ls_prog-low.
      APPEND lv_object TO lt_objects.
    ENDLOOP.

    SORT lt_objects.
    DELETE ADJACENT DUPLICATES FROM lt_objects.

    LOOP AT lt_objects INTO lv_object.
      process_object( lv_object ).
    ENDLOOP.

  ENDMETHOD.                    "collect_data

  METHOD process_object.

    DATA: lv_kind    TYPE char10,
          lv_main    TYPE programm,
          lt_incl    TYPE tt_program,
          lv_incl    TYPE programm,
          lv_lines   TYPE i,
          lv_total   TYPE i,
          lv_message TYPE string,
          lv_text    TYPE string.

    " Authorization check before touching the source.
    IF is_authorized( iv_object ) = abap_false.
      CONCATENATE 'Not authorized to read source of' iv_object
                  INTO lv_text SEPARATED BY space.
      add_message( iv_object = iv_object iv_text = lv_text ).
      RETURN.
    ENDIF.

    " Determine what kind of object was entered.
    lv_kind = get_object_kind( iv_object ).

    IF lv_kind IS INITIAL.
      CONCATENATE 'Object' iv_object
                  'does not exist or is not a supported object type'
                  INTO lv_text SEPARATED BY space.
      add_message( iv_object = iv_object iv_text = lv_text ).
      RETURN.
    ENDIF.

    " An include yields one row per main program - handle separately.
    IF lv_kind = gc_type_include.
      process_include( iv_object ).
      RETURN.
    ENDIF.

    " Build the list of source includes to be counted for this object.
    IF lv_kind = gc_type_prog.
      " A plain program: its own source is the only source.
      lv_main = iv_object.
      APPEND iv_object TO lt_incl.
    ELSE.
      " Class / interface / function group / function module / smartform
      " / enhancement - resolve the underlying source include(s).
      collect_source_by_kind(
        EXPORTING iv_object   = iv_object
                  iv_kind     = lv_kind
        IMPORTING ev_main     = lv_main
                  et_includes = lt_incl
                  ev_message  = lv_message ).

      IF lv_message IS NOT INITIAL.
        add_message( iv_object = iv_object iv_text = lv_message ).
        RETURN.
      ENDIF.
    ENDIF.

    IF lt_incl IS INITIAL.
      CONCATENATE 'No source could be read for' iv_object
                  INTO lv_text SEPARATED BY space.
      add_message( iv_object = iv_object iv_text = lv_text ).
      RETURN.
    ENDIF.

    " Sum the source lines across all includes that make up the object.
    " The entered object is always what appears in the OBJECT NAME column.
    CLEAR lv_total.
    LOOP AT lt_incl INTO lv_incl.
      lv_lines = get_line_count( lv_incl ).
      IF lv_lines > 0.
        lv_total = lv_total + lv_lines.
      ENDIF.
    ENDLOOP.

    add_output_row( iv_main_program = lv_main
                    iv_object_name  = iv_object
                    iv_object_type  = lv_kind
                    iv_lines        = lv_total ).

  ENDMETHOD.                    "process_object

  METHOD process_include.

    DATA: lt_main  TYPE tt_program,
          lv_main  TYPE programm,
          lv_lines TYPE i,
          lv_text  TYPE string.

    " Line count of the include itself.
    lv_lines = get_line_count( iv_object ).
    IF lv_lines < 0.
      CONCATENATE 'Source of include' iv_object 'could not be read'
                  INTO lv_text SEPARATED BY space.
      add_message( iv_object = iv_object iv_text = lv_text ).
      RETURN.
    ENDIF.

    " Resolve the main program(s) the include belongs to. OBJECT NAME is
    " always the entered include; MAIN PROGRAM is its master program.
    lt_main = resolve_main_programs( iv_object ).

    IF lt_main IS INITIAL.
      " Orphan include with no master: it is its own main-program reference.
      add_output_row( iv_main_program = iv_object
                      iv_object_name  = iv_object
                      iv_object_type  = gc_type_include
                      iv_lines        = lv_lines ).
      RETURN.
    ENDIF.

    LOOP AT lt_main INTO lv_main.
      IF sy-tabix > gc_max_mainprograms.
        EXIT.
      ENDIF.
      add_output_row( iv_main_program = lv_main
                      iv_object_name  = iv_object
                      iv_object_type  = gc_type_include
                      iv_lines        = lv_lines ).
    ENDLOOP.

  ENDMETHOD.                    "process_include

  METHOD get_object_kind.

    DATA: lv_subc TYPE trdir-subc,
          lv_obj  TYPE tadir-obj_name,
          lv_type TYPE tadir-object,
          lv_func TYPE tfdir-funcname,
          lv_cls  TYPE seoclsname,
          lv_form TYPE tdsfname,
          lv_pool TYPE programm.

    lv_obj = iv_object.

    " 1) Global class / interface - authoritative check against SEOCLASS
    "    (works for namespaced names; TADIR is used only to label the
    "    exact type, defaulting to class).
    SELECT SINGLE clsname FROM seoclass INTO lv_cls
           WHERE clsname = iv_object.
    IF sy-subrc = 0.
      SELECT SINGLE object FROM tadir INTO lv_type
             WHERE pgmid = 'R3TR' AND obj_name = lv_obj.
      IF sy-subrc = 0 AND lv_type = 'INTF'.
        rv_kind = gc_type_intf.
      ELSE.
        rv_kind = gc_type_class.
      ENDIF.
      RETURN.
    ENDIF.

    " 2) Function module (stored in TFDIR).
    SELECT SINGLE funcname FROM tfdir INTO lv_func
           WHERE funcname = iv_object.
    IF sy-subrc = 0.
      rv_kind = gc_type_func.
      RETURN.
    ENDIF.

    " 3) Smartform (stored in STXFADM).
    SELECT SINGLE formname FROM stxfadm INTO lv_form
           WHERE formname = iv_object.
    IF sy-subrc = 0.
      rv_kind = gc_type_form.
      RETURN.
    ENDIF.

    " 4) Function group - detected when its main program (SAPL...) exists.
    lv_pool = build_pool_name( iv_object ).
    SELECT SINGLE subc FROM trdir INTO lv_subc
           WHERE name = lv_pool.
    IF sy-subrc = 0.
      rv_kind = gc_type_fugr.
      RETURN.
    ENDIF.

    " 5) Enhancement objects (and any remaining repository object) via TADIR.
    SELECT SINGLE object FROM tadir INTO lv_type
           WHERE pgmid = 'R3TR' AND obj_name = lv_obj.
    IF sy-subrc = 0.
      CASE lv_type.
        WHEN 'ENHO'. rv_kind = gc_type_enho.  RETURN.
        WHEN 'ENHS'. rv_kind = gc_type_enhs.  RETURN.
        WHEN 'ENHC'. rv_kind = gc_type_enhc.  RETURN.
        WHEN 'CLAS'. rv_kind = gc_type_class. RETURN.
        WHEN 'INTF'. rv_kind = gc_type_intf.  RETURN.
        WHEN 'FUGR'. rv_kind = gc_type_fugr.  RETURN.
        WHEN 'SSFO'. rv_kind = gc_type_form.  RETURN.
        WHEN OTHERS.
          " 'PROG' and anything else: refine via TRDIR below.
      ENDCASE.
    ENDIF.

    " 6) Program or include via TRDIR-SUBC.
    SELECT SINGLE subc FROM trdir INTO lv_subc
           WHERE name = iv_object.
    IF sy-subrc = 0.
      IF lv_subc = gc_subc_include.
        rv_kind = gc_type_include.
      ELSE.
        rv_kind = gc_type_prog.
      ENDIF.
      RETURN.
    ENDIF.

    " Unknown / unsupported.
    CLEAR rv_kind.

  ENDMETHOD.                    "get_object_kind

  METHOD collect_source_by_kind.

    DATA: lv_clsname  TYPE seoclsname,
          lv_pool     TYPE programm,
          lt_incl     TYPE tt_program,
          lv_formname TYPE tdsfname,
          lv_fmname   TYPE rs38l_fnam,
          lv_prog     TYPE programm,
          lv_inc      TYPE programm,
          lv_ok       TYPE abap_bool.

    CASE iv_kind.

      WHEN gc_type_class OR gc_type_intf.
        " The class pool program plus all of its generated includes
        " (public / protected / private sections, methods, ...).
        lv_clsname = iv_object.
        lv_pool = cl_oo_classname_service=>get_classpool_name( lv_clsname ).
        ev_main = lv_pool.
        APPEND lv_pool TO et_includes.
        SELECT include FROM d010inc INTO TABLE lt_incl WHERE master = lv_pool.
        APPEND LINES OF lt_incl TO et_includes.

      WHEN gc_type_fugr.
        " The function-group main program plus all of its includes.
        lv_pool = build_pool_name( iv_object ).
        ev_main = lv_pool.
        APPEND lv_pool TO et_includes.
        SELECT include FROM d010inc INTO TABLE lt_incl WHERE master = lv_pool.
        APPEND LINES OF lt_incl TO et_includes.

      WHEN gc_type_func.
        " The single source include of the function module.
        get_func_details( EXPORTING iv_func    = iv_object
                          IMPORTING ev_program = lv_prog
                                    ev_include = lv_inc
                                    ev_ok      = lv_ok ).
        IF lv_ok = abap_false.
          ev_message = 'Function module source include could not be determined'.
          RETURN.
        ENDIF.
        ev_main = lv_prog.
        APPEND lv_inc TO et_includes.

      WHEN gc_type_form.
        " Smartforms have no editable ABAP source; count the generated
        " function module (only available once the form is generated).
        lv_formname = iv_object.
        CALL FUNCTION 'SSF_FUNCTION_MODULE_NAME'
          EXPORTING
            formname = lv_formname
          IMPORTING
            fm_name  = lv_fmname
          EXCEPTIONS
            OTHERS   = 1.
        IF sy-subrc <> 0 OR lv_fmname IS INITIAL.
          ev_message = 'Smartform is not generated - no ABAP source to count'.
          RETURN.
        ENDIF.
        get_func_details( EXPORTING iv_func    = lv_fmname
                          IMPORTING ev_program = lv_prog
                                    ev_include = lv_inc
                                    ev_ok      = lv_ok ).
        IF lv_ok = abap_false.
          ev_message = 'Generated smartform function module source not found'.
          RETURN.
        ENDIF.
        ev_main = lv_prog.
        APPEND lv_inc TO et_includes.

      WHEN gc_type_enho OR gc_type_enhs OR gc_type_enhc.
        " Enhancement objects (implementation / spot / composite) store
        " their code in the enhancement framework, not as a plain source
        " include, so a generic line count is not available in this
        " version.
        ev_message = 'Enhancement object recognised - source-line counting is not supported'.
        RETURN.

    ENDCASE.

    " Clean the include list.
    DELETE et_includes WHERE table_line IS INITIAL.
    SORT et_includes.
    DELETE ADJACENT DUPLICATES FROM et_includes.

  ENDMETHOD.                    "collect_source_by_kind

  METHOD build_pool_name.

    DATA: lv_ns   TYPE string,
          lv_name TYPE string.

    " Namespaced group  /NS/GRP  ->  /NS/SAPLGRP
    " Standard group    GRP      ->  SAPLGRP
    IF iv_group(1) = '/'.
      SPLIT iv_group+1 AT '/' INTO lv_ns lv_name.
      CONCATENATE '/' lv_ns '/SAPL' lv_name INTO rv_pool.
    ELSE.
      CONCATENATE 'SAPL' iv_group INTO rv_pool.
    ENDIF.

  ENDMETHOD.                    "build_pool_name

  METHOD get_func_details.

    DATA: lv_funcname TYPE rs38l_fnam,
          lv_include  TYPE programm,
          lv_program  TYPE programm.

    lv_funcname = iv_func.

    " FUNCTION_INCLUDE_INFO returns the source include and the main
    " program (SAPL...) that a function module belongs to. The optional
    " GROUP / NAMESPACE parameters are not requested.
    CALL FUNCTION 'FUNCTION_INCLUDE_INFO'
      CHANGING
        funcname = lv_funcname
        include  = lv_include
        program  = lv_program
      EXCEPTIONS
        OTHERS   = 1.

    IF sy-subrc = 0 AND lv_include IS NOT INITIAL.
      ev_program = lv_program.
      ev_include = lv_include.
      ev_ok      = abap_true.
    ELSE.
      ev_ok      = abap_false.
    ENDIF.

  ENDMETHOD.                    "get_func_details

  METHOD resolve_main_programs.

    " Resolve the master (main program) of an include directly from the
    " program include index table D010INC (MASTER / INCLUDE). No function
    " module is required - the relationship is read straight from the
    " table, which is available in ECC.
    SELECT master FROM d010inc INTO TABLE rt_main
           WHERE include = iv_include.

    " Drop empty rows and self-references, then de-duplicate: an include
    " may be used by several main programs, each of which is returned.
    DELETE rt_main WHERE table_line IS INITIAL
                      OR table_line = iv_include.
    SORT rt_main.
    DELETE ADJACENT DUPLICATES FROM rt_main.

  ENDMETHOD.                    "resolve_main_programs

  METHOD get_line_count.

    DATA lt_source TYPE STANDARD TABLE OF abaptxt255.

    " READ REPORT reads the active source code of any program object
    " (main program or include). It is available in ECC and requires
    " no additional infrastructure.
    READ REPORT iv_object INTO lt_source.

    IF sy-subrc <> 0.
      rv_lines = -1.                 " Source not available / inactive
      RETURN.
    ENDIF.

    rv_lines = lines( lt_source ).

  ENDMETHOD.                    "get_line_count

  METHOD is_authorized.

    " Standard authorization object for development / source display.
    " ACTVT 03 = Display. Missing authorization is handled gracefully
    " by the caller (object is skipped and logged).
    AUTHORITY-CHECK OBJECT 'S_DEVELOP'
      ID 'DEVCLASS' DUMMY
      ID 'OBJTYPE'  FIELD 'PROG'
      ID 'OBJNAME'  FIELD iv_object
      ID 'P_GROUP'  DUMMY
      ID 'ACTVT'    FIELD '03'.

    IF sy-subrc = 0.
      rv_authorized = abap_true.
    ELSE.
      rv_authorized = abap_false.
    ENDIF.

  ENDMETHOD.                    "is_authorized

  METHOD add_output_row.

    DATA ls_output TYPE ty_output.

    " De-duplicate: the same main program / include combination might be
    " reached through several selection-screen entries.
    READ TABLE gt_output TRANSPORTING NO FIELDS
         WITH KEY main_program = iv_main_program
                  object_name  = iv_object_name.
    IF sy-subrc = 0.
      RETURN.
    ENDIF.

    ls_output-main_program = iv_main_program.
    ls_output-object_name  = iv_object_name.
    ls_output-object_type  = iv_object_type.
    ls_output-no_of_lines  = iv_lines.
    APPEND ls_output TO gt_output.

  ENDMETHOD.                    "add_output_row

  METHOD add_message.

    DATA ls_message TYPE ty_message.

    ls_message-object_name = iv_object.
    ls_message-text        = iv_text.
    APPEND ls_message TO gt_messages.

  ENDMETHOD.                    "add_message

  METHOD display_alv.

    DATA: lo_alv          TYPE REF TO cl_salv_table,
          lo_functions    TYPE REF TO cl_salv_functions_list,
          lo_columns      TYPE REF TO cl_salv_columns_table,
          lo_column       TYPE REF TO cl_salv_column_table,
          lo_sorts        TYPE REF TO cl_salv_sorts,
          lo_aggregations TYPE REF TO cl_salv_aggregations,
          lo_layout       TYPE REF TO cl_salv_layout,
          ls_layout_key   TYPE salv_s_layout_key,
          lx_msg          TYPE REF TO cx_salv_msg,
          lx_not_found    TYPE REF TO cx_salv_not_found,
          lv_msg          TYPE string.

    " Sort GT_OUTPUT so that each main program is followed by its
    " includes; this also drives the ALV subtotal grouping.
    SORT gt_output BY main_program object_type object_name.

    TRY.
        cl_salv_table=>factory(
          IMPORTING
            r_salv_table = lo_alv
          CHANGING
            t_table      = gt_output ).

        " Enable ALL standard ALV functions (sort, filter, export,
        " print, find, layout, column selection, ...).
        lo_functions = lo_alv->get_functions( ).
        lo_functions->set_all( abap_true ).

        " Layout variant handling (save / restore user layouts).
        lo_layout            = lo_alv->get_layout( ).
        ls_layout_key-report = sy-repid.
        lo_layout->set_key( ls_layout_key ).
        lo_layout->set_save_restriction( if_salv_c_layout=>restrict_none ).

        " Column titles and optimized width.
        lo_columns = lo_alv->get_columns( ).
        lo_columns->set_optimize( abap_true ).

        TRY.
            lo_column ?= lo_columns->get_column( 'MAIN_PROGRAM' ).
            lo_column->set_long_text( 'Main Program' ).
            lo_column->set_medium_text( 'Main Program' ).
            lo_column->set_short_text( 'Main Prog' ).

            lo_column ?= lo_columns->get_column( 'OBJECT_NAME' ).
            lo_column->set_long_text( 'Object Name' ).
            lo_column->set_medium_text( 'Object Name' ).
            lo_column->set_short_text( 'Object' ).

            lo_column ?= lo_columns->get_column( 'OBJECT_TYPE' ).
            lo_column->set_long_text( 'Object Type' ).
            lo_column->set_medium_text( 'Object Type' ).
            lo_column->set_short_text( 'Type' ).

            lo_column ?= lo_columns->get_column( 'NO_OF_LINES' ).
            lo_column->set_long_text( 'Number of Lines' ).
            lo_column->set_medium_text( 'No. of Lines' ).
            lo_column->set_short_text( 'Lines' ).
          CATCH cx_salv_not_found INTO lx_not_found.
            " Assign the exception text to a variable first; a functional
            " method call is not allowed as the MESSAGE text operand.
            lv_msg = lx_not_found->get_text( ).
            MESSAGE lv_msg TYPE 'S' DISPLAY LIKE 'W'.
        ENDTRY.

        " Subtotal by main program and grand total of the line count.
        lo_sorts = lo_alv->get_sorts( ).
        TRY.
            lo_sorts->add_sort(
              columnname = 'MAIN_PROGRAM'
              sequence   = if_salv_c_sort=>sort_up
              subtotal   = abap_true ).
          CATCH cx_salv_not_found cx_salv_existing cx_salv_data_error.
            " Sorting is optional - ignore if it cannot be applied.
        ENDTRY.

        lo_aggregations = lo_alv->get_aggregations( ).
        TRY.
            lo_aggregations->add_aggregation(
              columnname  = 'NO_OF_LINES'
              aggregation = if_salv_c_aggregation=>total ).
          CATCH cx_salv_not_found cx_salv_existing cx_salv_data_error.
            " Totals are optional - ignore if they cannot be applied.
        ENDTRY.

        " Zebra striping and list header.
        lo_alv->get_display_settings( )->set_striped_pattern( abap_true ).
        lo_alv->get_display_settings( )->set_list_header(
          'Source Code Line Counter - Main Program & Includes' ).

        lo_alv->display( ).

      CATCH cx_salv_msg INTO lx_msg.
        lv_msg = lx_msg->get_text( ).
        MESSAGE lv_msg TYPE 'E'.
    ENDTRY.

  ENDMETHOD.                    "display_alv

  METHOD display_messages.

    DATA ls_message TYPE ty_message.

    IF gt_messages IS INITIAL.
      RETURN.
    ENDIF.

    " Log the objects that could not be processed. Written to the list
    " so that they remain visible after the ALV is closed.
    LOOP AT gt_messages INTO ls_message.
      WRITE: / ls_message-object_name, ls_message-text.
    ENDLOOP.

  ENDMETHOD.                    "display_messages

ENDCLASS.                    "lcl_line_counter IMPLEMENTATION

*&---------------------------------------------------------------------*
*& Selection screen validations
*&---------------------------------------------------------------------*
AT SELECTION-SCREEN.
  " Reject interval selections. Only single values (option EQ) and
  " multiple single values are permitted; ranges (BT / NB) are rejected.
  LOOP AT so_prog.
    IF so_prog-option = 'BT' OR so_prog-option = 'NB'.
      MESSAGE 'Interval selection is not allowed - enter single values only'(m02)
              TYPE 'E'.
    ENDIF.
    IF so_prog-low IS INITIAL.
      MESSAGE 'Please enter at least one program / object name'(m03)
              TYPE 'E'.
    ENDIF.
  ENDLOOP.

  IF so_prog[] IS INITIAL.
    MESSAGE 'Please enter at least one program / object name'(m03)
            TYPE 'E'.
  ENDIF.

*&---------------------------------------------------------------------*
*& Main program flow
*&---------------------------------------------------------------------*
START-OF-SELECTION.
  DATA go_counter TYPE REF TO lcl_line_counter.

  CREATE OBJECT go_counter.
  go_counter->run( ).
