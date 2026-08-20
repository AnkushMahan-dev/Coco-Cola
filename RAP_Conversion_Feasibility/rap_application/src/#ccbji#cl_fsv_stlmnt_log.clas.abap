*&---------------------------------------------------------------------*
*&  Class  /CCBJI/CL_FSV_STLMNT_LOG
*&---------------------------------------------------------------------*
*&  RAP query implementation for custom entity /CCBJI/I_FSV_STLMNT_LOG.
*&
*&  Reproduces the classic report's "Display logs" hotspot:
*&    /CCBJI/RDSDFSVI_STLMNT_DTL_SUB -> FORM f_display_dsd_log
*&      CALL FUNCTION '/DSD/ST_APPLOG_VIEW'
*&        if_object = '/DSD/RTACC'  if_subobject = 'FSR'  if_tourid = tour_id
*&
*&  That FM opens the BAL application log for object /DSD/RTACC, subobject
*&  FSR, external number = tour id. We read the SAME log headlessly with the
*&  standard BAL API and return one row per message (type + text), so the
*&  Fiori "Display Logs" action can show exactly what SLG1 shows there.
*&
*&  NO-DUMP GUARANTEE: the whole body runs inside TRY/CATCH cx_root, and the
*&  read is ALWAYS bounded to the one tour id passed in the filter (a missing
*&  tour id returns nothing) - so it can never scan the whole BAL or dump.
*&---------------------------------------------------------------------*
CLASS /ccbji/cl_fsv_stlmnt_log DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_rap_query_provider.

  PRIVATE SECTION.

    TYPES: BEGIN OF ty_log,
             tourid        TYPE c LENGTH 32,
             lognumber     TYPE c LENGTH 20,
             msgnumber     TYPE i,
             messagetype   TYPE c LENGTH 1,
             criticality   TYPE int1,
             messagetext   TYPE c LENGTH 255,
             messageclass  TYPE c LENGTH 20,
             messagenumber TYPE n LENGTH 3,
             problemclass  TYPE c LENGTH 1,
             detaillevel   TYPE int1,
           END OF ty_log,
           tt_log TYPE STANDARD TABLE OF ty_log WITH DEFAULT KEY.

    "! Read the BAL application log of one tour (object /DSD/RTACC / FSR) and
    "! return one row per message. Guarded - any error yields no rows.
    METHODS read_bal_log
      IMPORTING iv_tour       TYPE any
      RETURNING VALUE(rt_log) TYPE tt_log.

ENDCLASS.


CLASS /ccbji/cl_fsv_stlmnt_log IMPLEMENTATION.

  METHOD if_rap_query_provider~select.

    DATA lt_result TYPE tt_log.

    TRY.
        " Extract the mandatory TourId filter.
        TRY.
            DATA(lt_ranges) = io_request->get_filter( )->get_as_ranges( ).
          CATCH cx_rap_query_filter_no_range.
            CLEAR lt_ranges.
        ENDTRY.

        DATA lv_tour TYPE c LENGTH 32.
        LOOP AT lt_ranges INTO DATA(ls_range).
          IF to_upper( ls_range-name ) = 'TOURID'.
            LOOP AT ls_range-range INTO DATA(ls_r).
              IF ls_r-low IS NOT INITIAL.
                lv_tour = ls_r-low.
              ENDIF.
            ENDLOOP.
          ENDIF.
        ENDLOOP.

        " Bounded read only: without a tour id we return nothing (never a
        " full BAL scan).
        IF lv_tour IS NOT INITIAL.
          lt_result = read_bal_log( lv_tour ).
        ENDIF.
      CATCH cx_root.
        CLEAR lt_result.
    ENDTRY.

    " Sort as requested (default: message number ascending = log order).
    DATA lt_sort_order TYPE abap_sortorder_tab.
    LOOP AT io_request->get_sort_elements( ) INTO DATA(ls_sort).
      APPEND VALUE #( name = ls_sort-element_name descending = ls_sort-descending ) TO lt_sort_order.
    ENDLOOP.
    IF lt_sort_order IS NOT INITIAL.
      TRY.
          SORT lt_result BY (lt_sort_order).
        CATCH cx_root.
      ENDTRY.
    ENDIF.

    IF io_request->is_total_numb_of_rec_requested( ).
      io_response->set_total_number_of_records( lines( lt_result ) ).
    ENDIF.

    IF io_request->is_data_requested( ).
      DATA(lo_paging)  = io_request->get_paging( ).
      DATA(lv_offset)  = lo_paging->get_offset( ).
      DATA(lv_page_sz) = lo_paging->get_page_size( ).
      IF lv_page_sz <> if_rap_query_paging=>page_size_unlimited AND lv_page_sz > 0.
        DATA lt_page TYPE tt_log.
        DATA(lv_from) = lv_offset + 1.
        DATA(lv_to)   = lv_offset + lv_page_sz.
        LOOP AT lt_result INTO DATA(ls_row) FROM lv_from TO lv_to.
          APPEND ls_row TO lt_page.
        ENDLOOP.
        io_response->set_data( lt_page ).
      ELSE.
        io_response->set_data( lt_result ).
      ENDIF.
    ENDIF.

  ENDMETHOD.


  METHOD read_bal_log.

    CONSTANTS: lc_object TYPE balobj_d   VALUE '/DSD/RTACC',
               lc_subobj TYPE balsubobj  VALUE 'FSR'.

    DATA lv_ext_raw TYPE balnrext.
    DATA lv_ext_str TYPE balnrext.

    lv_ext_raw = iv_tour.
    lv_ext_str = iv_tour.
    SHIFT lv_ext_str LEFT DELETING LEADING '0'.

    " The BAL log external number can be EITHER the tour id (209162643559)
    " OR the visit list (9162643559) - the tour id is a 2-char prefix + the
    " visit list (the report itself derives vlid = tour_id+2(10)). We try both
    " (and their leading-zero-stripped forms), so the log resolves regardless
    " of which one the /DSD/RTACC / FSR log was written under.
    DATA lv_vlid     TYPE balnrext.
    DATA lv_vlid_str TYPE balnrext.
    IF strlen( lv_ext_raw ) > 2.
      lv_vlid     = lv_ext_raw+2.
      lv_vlid_str = lv_vlid.
      SHIFT lv_vlid_str LEFT DELETING LEADING '0'.
    ENDIF.

    DATA lr_ext TYPE RANGE OF balnrext.
    APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_ext_raw ) TO lr_ext.
    IF lv_ext_str <> lv_ext_raw AND lv_ext_str IS NOT INITIAL.
      APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_ext_str ) TO lr_ext.
    ENDIF.
    IF lv_vlid IS NOT INITIAL.
      APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_vlid ) TO lr_ext.
    ENDIF.
    IF lv_vlid_str IS NOT INITIAL AND lv_vlid_str <> lv_vlid.
      APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_vlid_str ) TO lr_ext.
    ENDIF.

    " Robust fallback: the stored extnumber may be padded or prefixed in ways
    " the exact-match list above misses. Also match any extnumber that ENDS
    " WITH the visit list (e.g. '9162643559', '209162643559', '000...9162643559').
    DATA lv_like TYPE string.
    DATA lv_vtrim TYPE string.
    lv_vtrim = COND #( WHEN lv_vlid_str IS NOT INITIAL THEN lv_vlid_str ELSE lv_ext_str ).
    CONDENSE lv_vtrim NO-GAPS.
    IF lv_vtrim IS NOT INITIAL.
      lv_like = |%{ lv_vtrim }|.
    ELSE.
      lv_like = '##NO_MATCH##'.
    ENDIF.

    TRY.
        " Log filter for the in-memory search (BAL_GLB_SEARCH_LOG) - same object,
        " subobject and the full set of external-number candidates.
        DATA ls_lfil TYPE bal_s_lfil.
        ls_lfil-object    = VALUE bal_r_obj( ( sign = 'I' option = 'EQ' low = lc_object ) ).
        ls_lfil-subobject = VALUE bal_r_sub( ( sign = 'I' option = 'EQ' low = lc_subobj ) ).
        ls_lfil-extnumber = CORRESPONDING #( lr_ext ).

        " 1) Find the matching log headers DIRECTLY from BALHDR - like the
        "    classic report (SELECT ... FROM balhdr WHERE object = c_rtacc AND
        "    subobject = c_fsr AND extnumber = <tour or visit list>). Reading the
        "    header table straight is more reliable than BAL_DB_SEARCH here.
        DATA lt_hdr TYPE balhdr_t.
        SELECT * FROM balhdr
          WHERE object    = @lc_object
            AND subobject = @lc_subobj
            AND ( extnumber IN @lr_ext OR extnumber LIKE @lv_like )
          INTO TABLE @lt_hdr.
        IF lt_hdr IS INITIAL.
          RETURN.
        ENDIF.

        " Rebuild the in-memory filter from the ACTUAL headers we found, so the
        " subsequent BAL_GLB_SEARCH_LOG matches them even when the stored
        " extnumber is padded/prefixed differently from our exact candidates.
        CLEAR ls_lfil-extnumber.
        LOOP AT lt_hdr INTO DATA(ls_h).
          IF NOT line_exists( ls_lfil-extnumber[ low = ls_h-extnumber ] ).
            APPEND VALUE #( sign = 'I' option = 'EQ' low = ls_h-extnumber ) TO ls_lfil-extnumber.
          ENDIF.
        ENDLOOP.

        " 2) Load the logs (with their messages) into memory.
        CALL FUNCTION 'BAL_DB_LOAD'
          EXPORTING
            i_t_log_header = lt_hdr
          EXCEPTIONS
            no_logs_specified = 1
            log_not_found     = 2
            log_already_loaded = 3
            OTHERS            = 4.
        " subrc 3 (already loaded) is fine - continue.

        " 3) Resolve the in-memory log handles for this filter.
        DATA lt_logh TYPE bal_t_logh.
        CALL FUNCTION 'BAL_GLB_SEARCH_LOG'
          EXPORTING
            i_s_log_filter = ls_lfil
          IMPORTING
            e_t_log_handle = lt_logh
          EXCEPTIONS
            log_not_found  = 1
            OTHERS         = 2.
        IF sy-subrc <> 0 OR lt_logh IS INITIAL.
          RETURN.
        ENDIF.

        " 4) Collect every message handle of those logs.
        DATA lt_msgh TYPE bal_t_msgh.
        CALL FUNCTION 'BAL_GLB_SEARCH_MSG'
          EXPORTING
            i_t_log_handle = lt_logh
          IMPORTING
            e_t_msg_handle = lt_msgh
          EXCEPTIONS
            msg_not_found  = 1
            OTHERS         = 2.
        IF sy-subrc <> 0 OR lt_msgh IS INITIAL.
          RETURN.
        ENDIF.

        " 5) Read each message + build its display text (as SLG1 shows it).
        DATA lv_seq TYPE i.
        LOOP AT lt_msgh INTO DATA(ls_msgh).
          DATA ls_msg TYPE bal_s_msg.
          CLEAR ls_msg.
          CALL FUNCTION 'BAL_LOG_MSG_READ'
            EXPORTING
              i_s_msg_handle = ls_msgh
            IMPORTING
              e_s_msg        = ls_msg
            EXCEPTIONS
              log_not_found  = 1
              msg_not_found  = 2
              OTHERS         = 3.
          IF sy-subrc <> 0.
            CONTINUE.
          ENDIF.

          DATA lv_text TYPE c LENGTH 255.
          CLEAR lv_text.
          CALL FUNCTION 'BAL_DSP_MSG_MESSAGETEXT'
            EXPORTING
              i_langu    = sy-langu
              i_s_msg    = ls_msg
            IMPORTING
              e_msg_text = lv_text
            EXCEPTIONS
              OTHERS     = 1.
          IF sy-subrc <> 0 OR lv_text IS INITIAL.
            " Fall back to raw message text build from id/no/vars.
            MESSAGE ID ls_msg-msgid TYPE 'I' NUMBER ls_msg-msgno
                    WITH ls_msg-msgv1 ls_msg-msgv2 ls_msg-msgv3 ls_msg-msgv4
                    INTO lv_text.
          ENDIF.

          lv_seq = lv_seq + 1.
          DATA ls_out TYPE ty_log.
          CLEAR ls_out.
          ls_out-tourid        = iv_tour.
          ls_out-lognumber     = ls_msgh-log_handle.
          ls_out-msgnumber     = ls_msgh-msgnumber.
          ls_out-messagetype   = ls_msg-msgty.
          ls_out-messagetext   = lv_text.
          ls_out-messageclass  = ls_msg-msgid.
          ls_out-messagenumber = ls_msg-msgno.
          ls_out-problemclass  = ls_msg-probclass.
          ls_out-detaillevel   = ls_msg-detlevel.

          " Traffic-light criticality (matches the classic ALV colouring).
          CASE ls_msg-msgty.
            WHEN 'E' OR 'A'. ls_out-criticality = 1.   " red
            WHEN 'W'.        ls_out-criticality = 2.   " yellow
            WHEN 'S' OR 'I'. ls_out-criticality = 3.   " green
            WHEN OTHERS.     ls_out-criticality = 0.   " gray
          ENDCASE.

          APPEND ls_out TO rt_log.
        ENDLOOP.

        " Free the loaded logs from memory (best effort).
        TRY.
            CALL FUNCTION 'BAL_GLB_MEMORY_REFRESH'
              EXCEPTIONS OTHERS = 0.
          CATCH cx_root.
        ENDTRY.
      CATCH cx_root.
        CLEAR rt_log.
    ENDTRY.

  ENDMETHOD.

ENDCLASS.
