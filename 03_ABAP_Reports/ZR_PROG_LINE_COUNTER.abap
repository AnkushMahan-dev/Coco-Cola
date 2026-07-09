*&---------------------------------------------------------------------*
*& Report  ZR_PROG_LINE_COUNTER
*&---------------------------------------------------------------------*
*& Title       : Source Code Line Counter (Main Program + Includes)
*& Application : SAP ECC 6.0 - compatible (NetWeaver 7.00 and higher,
*&               no S/4HANA-only syntax or classes are used)
*& Purpose     : For every program / object entered on the selection
*&               screen, determine the corresponding MAIN program,
*&               read the complete source code of the main program and
*&               all of its associated includes, and count the number of
*&               source-code lines of each object separately.
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
TYPES: BEGIN OF ty_output,
         main_program TYPE programm,      " Original / actual main program
         object_name  TYPE programm,      " Program or include name
         object_type  TYPE char10,        " PROG / INCLUDE
         no_of_lines  TYPE i,             " Total source code lines
       END OF ty_output,
       tt_output TYPE STANDARD TABLE OF ty_output.

* Message log for objects that could not be processed
TYPES: BEGIN OF ty_message,
         object_name TYPE programm,
         text        TYPE string,
       END OF ty_message,
       tt_message TYPE STANDARD TABLE OF ty_message.

* Constants for the object type column and program sub-type
CONSTANTS: gc_type_prog    TYPE char10      VALUE 'PROG',
           gc_type_include TYPE char10      VALUE 'INCLUDE',
           gc_subc_include TYPE trdir-subc  VALUE 'I'.

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
      "! Processes a single object entered on the selection screen.
      "! Determines the main program(s) and collects all rows.
      process_object
        IMPORTING iv_object TYPE programm,

      "! Collects the main program and all of its includes for output.
      collect_main_and_includes
        IMPORTING iv_main_program TYPE programm,

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

      "! Reads the technical program sub-type (TRDIR-SUBC).
      "! Returns space when the object does not exist.
      get_program_subc
        IMPORTING iv_object      TYPE programm
        RETURNING VALUE(rv_subc) TYPE trdir-subc,

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

    DATA: lt_objects TYPE STANDARD TABLE OF programm,
          lv_object  TYPE programm.

    " Read all program / object names matching the entered single values.
    " TRDIR is available in ECC and holds all reportable program objects
    " (main programs as well as includes).
    SELECT name FROM trdir
           INTO TABLE lt_objects
           WHERE name IN so_prog
           ORDER BY name.

    IF sy-subrc <> 0.
      " Nothing matched in TRDIR - fall back to the literal input values
      " so that a clear "not found" message is raised per object.
      LOOP AT so_prog WHERE low IS NOT INITIAL.
        lv_object = so_prog-low.
        APPEND lv_object TO lt_objects.
      ENDLOOP.
    ENDIF.

    LOOP AT lt_objects INTO lv_object.
      process_object( lv_object ).
    ENDLOOP.

  ENDMETHOD.                    "collect_data

  METHOD process_object.

    DATA: lv_subc TYPE trdir-subc,
          lt_main TYPE STANDARD TABLE OF programm,
          lv_main TYPE programm,
          lv_text TYPE string.

    " Authorization check before touching the source.
    IF is_authorized( iv_object ) = abap_false.
      CONCATENATE 'Not authorized to read source of' iv_object
                  INTO lv_text SEPARATED BY space.
      add_message( iv_object = iv_object iv_text = lv_text ).
      RETURN.
    ENDIF.

    lv_subc = get_program_subc( iv_object ).

    IF lv_subc IS INITIAL.
      CONCATENATE 'Object' iv_object 'does not exist or has no active source'
                  INTO lv_text SEPARATED BY space.
      add_message( iv_object = iv_object iv_text = lv_text ).
      RETURN.
    ENDIF.

    IF lv_subc = gc_subc_include.
      " The input is an include -> determine its main program(s).
      CALL FUNCTION 'RS_GET_MAINPROGRAMS'
        EXPORTING
          name         = iv_object
        TABLES
          mainprograms = lt_main
        EXCEPTIONS
          OTHERS       = 1.

      IF sy-subrc <> 0 OR lt_main IS INITIAL.
        " Orphan include without a master program: report the include
        " itself as its own object so that its lines are still counted.
        add_output_row( iv_main_program = iv_object
                        iv_object_name  = iv_object
                        iv_object_type  = gc_type_include
                        iv_lines        = get_line_count( iv_object ) ).
        RETURN.
      ENDIF.

      LOOP AT lt_main INTO lv_main.
        collect_main_and_includes( lv_main ).
      ENDLOOP.

    ELSE.
      " The input is a main program (executable report, module pool,
      " function group main program, ...). Treat it as the main program.
      collect_main_and_includes( iv_object ).
    ENDIF.

  ENDMETHOD.                    "process_object

  METHOD collect_main_and_includes.

    DATA: lt_includes TYPE STANDARD TABLE OF rs38l_incl,
          lv_include  TYPE rs38l_incl,
          lv_obj      TYPE programm,
          lv_lines    TYPE i,
          lv_text     TYPE string.

    " Row for the main program itself.
    lv_lines = get_line_count( iv_main_program ).
    IF lv_lines >= 0.
      add_output_row( iv_main_program = iv_main_program
                      iv_object_name  = iv_main_program
                      iv_object_type  = gc_type_prog
                      iv_lines        = lv_lines ).
    ELSE.
      CONCATENATE 'Source of main program' iv_main_program
                  'could not be read' INTO lv_text SEPARATED BY space.
      add_message( iv_object = iv_main_program iv_text = lv_text ).
    ENDIF.

    " Retrieve all includes belonging to the main program.
    " RS_GET_ALL_INCLUDES is a standard, ECC-compatible function module.
    CALL FUNCTION 'RS_GET_ALL_INCLUDES'
      EXPORTING
        program      = iv_main_program
      TABLES
        includetab   = lt_includes
      EXCEPTIONS
        not_existent = 1
        no_program   = 2
        OTHERS       = 3.

    IF sy-subrc <> 0.
      " Main program has no resolvable includes - not an error, simply
      " nothing more to add.
      RETURN.
    ENDIF.

    SORT lt_includes.
    DELETE ADJACENT DUPLICATES FROM lt_includes.

    LOOP AT lt_includes INTO lv_include.
      IF lv_include IS INITIAL OR lv_include = iv_main_program.
        CONTINUE.
      ENDIF.

      lv_obj   = lv_include.
      lv_lines = get_line_count( lv_obj ).
      IF lv_lines >= 0.
        add_output_row( iv_main_program = iv_main_program
                        iv_object_name  = lv_obj
                        iv_object_type  = gc_type_include
                        iv_lines        = lv_lines ).
      ELSE.
        CONCATENATE 'Include' lv_obj 'of' iv_main_program
                    'could not be read' INTO lv_text SEPARATED BY space.
        add_message( iv_object = lv_obj iv_text = lv_text ).
      ENDIF.
    ENDLOOP.

  ENDMETHOD.                    "collect_main_and_includes

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

  METHOD get_program_subc.

    " TRDIR holds the technical attributes of every program object.
    " SUBC = 'I' identifies an include; other values identify main
    " program types (1 = executable, M = module pool, F = function
    " group, K = class pool, S = subroutine pool, ...).
    SELECT SINGLE subc FROM trdir
           INTO rv_subc
           WHERE name = iv_object.

    IF sy-subrc <> 0.
      CLEAR rv_subc.
    ENDIF.

  ENDMETHOD.                    "get_program_subc

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
          lx_not_found    TYPE REF TO cx_salv_not_found.

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
            MESSAGE lx_not_found->get_text( ) TYPE 'S' DISPLAY LIKE 'W'.
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
        MESSAGE lx_msg->get_text( ) TYPE 'E'.
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
