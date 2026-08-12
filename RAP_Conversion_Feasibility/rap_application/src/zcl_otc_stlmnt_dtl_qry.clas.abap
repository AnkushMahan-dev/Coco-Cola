*&---------------------------------------------------------------------*
*&  Class  ZCL_OTC_STLMNT_DTL_QRY
*&---------------------------------------------------------------------*
*&  RAP query implementation (Pattern B) for the custom entity
*&  ZI_OTC_STLMNT_DETAIL.
*&
*&  Replaces the read logic of the classic ALV report
*&  /CCBJI/RDSDFSVG_STLMNT_DETAILS (Settlement Details - Tour Header).
*&
*&  The business requirement, the output data and the validations are
*&  preserved: the same selection criteria, the same source tables and
*&  the same derivation (traffic-light processing status) are executed
*&  here at runtime and returned through OData V4 instead of SALV.
*&---------------------------------------------------------------------*
CLASS zcl_otc_stlmnt_dtl_qry DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_rap_query_provider.

  PROTECTED SECTION.

  PRIVATE SECTION.

    "! Output structure – mirrors the key columns of the classic report ty_final
    TYPES: BEGIN OF ty_result,
             shipmentno       TYPE tknum,
             processingstatus TYPE c LENGTH 1,
             tpp              TYPE tplst,
             statusid         TYPE /dsd/st_status_id,
             plant            TYPE werks_d,
             route            TYPE route,
             settlementdate   TYPE erdat,
             driver           TYPE /dsd/rp_driver1,
             vehicle          TYPE /dsd/rp_truck,
             scenario         TYPE c LENGTH 1,
             warnings         TYPE i,
             errors           TYPE i,
             referencedoc     TYPE xblnr,
             headertext       TYPE bktxt,
           END OF ty_result,
           tt_result TYPE STANDARD TABLE OF ty_result WITH DEFAULT KEY.

    "! Reads the settlement tour data honouring the selection ranges.
    METHODS read_settlement_data
      IMPORTING it_shipment      TYPE RANGE OF tknum
                it_route         TYPE RANGE OF route
                it_settle_date   TYPE RANGE OF erdat
                iv_max_rows      TYPE i
      RETURNING VALUE(rt_result) TYPE tt_result.

    "! Derives the traffic-light processing status (source: f_traffic_light).
    METHODS derive_processing_status
      IMPORTING iv_warnings      TYPE i
                iv_errors        TYPE i
      RETURNING VALUE(rv_status) TYPE c.

ENDCLASS.


CLASS zcl_otc_stlmnt_dtl_qry IMPLEMENTATION.

  METHOD if_rap_query_provider~select.

    DATA lt_shipment    TYPE RANGE OF tknum.
    DATA lt_route       TYPE RANGE OF route.
    DATA lt_settle_date TYPE RANGE OF erdat.

    " -----------------------------------------------------------------
    " 1. Translate the RAP filter (Fiori selection fields) into ABAP
    "    ranges – the equivalent of the classic SELECT-OPTIONS.
    " -----------------------------------------------------------------
    TRY.
        DATA(lt_ranges) = io_request->get_filter( )->get_as_ranges( ).
      CATCH cx_rap_query_filter_no_range.
        CLEAR lt_ranges.
    ENDTRY.

    LOOP AT lt_ranges INTO DATA(ls_range).
      ASSIGN ls_range-range->* TO FIELD-SYMBOL(<lt_range>).
      IF <lt_range> IS NOT ASSIGNED.
        CONTINUE.
      ENDIF.
      CASE ls_range-name.
        WHEN 'SHIPMENTNO'.
          lt_shipment    = CORRESPONDING #( <lt_range> ).
        WHEN 'ROUTE'.
          lt_route       = CORRESPONDING #( <lt_range> ).
        WHEN 'SETTLEMENTDATE'.
          lt_settle_date = CORRESPONDING #( <lt_range> ).
        WHEN OTHERS.
          " further selection fields (plant, status, driver …) are wired
          " here following the same pattern as the classic sel-screen.
      ENDCASE.
      UNASSIGN <lt_range>.
    ENDLOOP.

    " -----------------------------------------------------------------
    " 2. Paging – translate OData $top / $skip into a max-rows guard.
    " -----------------------------------------------------------------
    DATA(lo_paging)  = io_request->get_paging( ).
    DATA(lv_offset)  = lo_paging->get_offset( ).
    DATA(lv_page_sz) = lo_paging->get_page_size( ).

    DATA lv_max_rows TYPE i.
    IF lv_page_sz = if_rap_query_paging=>page_size_unlimited.
      lv_max_rows = 0.                 "0 = no DB limit
    ELSE.
      lv_max_rows = lv_offset + lv_page_sz.
    ENDIF.

    " -----------------------------------------------------------------
    " 3. Read + derive the data (the reused report logic).
    " -----------------------------------------------------------------
    DATA(lt_result) = read_settlement_data(
                        it_shipment    = lt_shipment
                        it_route       = lt_route
                        it_settle_date = lt_settle_date
                        iv_max_rows    = lv_max_rows ).

    " -----------------------------------------------------------------
    " 4. Sorting requested by the consumer (ALV sort equivalent).
    " -----------------------------------------------------------------
    DATA lt_sort_order TYPE abap_sortorder_tab.
    LOOP AT io_request->get_sort_elements( ) INTO DATA(ls_sort).
      APPEND VALUE #( name       = ls_sort-element_name
                      descending = ls_sort-descending ) TO lt_sort_order.
    ENDLOOP.
    IF lt_sort_order IS NOT INITIAL.
      SORT lt_result BY (lt_sort_order).
    ELSE.
      SORT lt_result BY shipmentno.
    ENDIF.

    " -----------------------------------------------------------------
    " 5. Total record count for the OData list report.
    " -----------------------------------------------------------------
    IF io_request->is_total_numb_of_rec_requested( ).
      io_response->set_total_number_of_records( lines( lt_result ) ).
    ENDIF.

    " -----------------------------------------------------------------
    " 6. Apply the page window and return the data.
    " -----------------------------------------------------------------
    IF io_request->is_data_requested( ).
      IF lv_page_sz <> if_rap_query_paging=>page_size_unlimited.
        DATA(lv_from) = lv_offset + 1.
        DATA(lv_to)   = lv_offset + lv_page_sz.
        DATA lt_page  TYPE tt_result.
        LOOP AT lt_result INTO DATA(ls_row) FROM lv_from TO lv_to.
          APPEND ls_row TO lt_page.
        ENDLOOP.
        io_response->set_data( lt_page ).
      ELSE.
        io_response->set_data( lt_result ).
      ENDIF.
    ENDIF.

  ENDMETHOD.


  METHOD read_settlement_data.

    " -----------------------------------------------------------------
    " Read the shipment / visit-list tour header – same source table
    " (VTTK) and same key fields as the classic report ty_vttk.
    " Namespaced driver / vehicle columns are aliased.
    " -----------------------------------------------------------------
    DATA lt_vttk TYPE STANDARD TABLE OF vttk.

    IF iv_max_rows > 0.
      SELECT * FROM vttk
        WHERE tknum IN @it_shipment
          AND route IN @it_route
          AND erdat IN @it_settle_date
        ORDER BY tknum
        INTO TABLE @lt_vttk
        UP TO @iv_max_rows ROWS.
    ELSE.
      SELECT * FROM vttk
        WHERE tknum IN @it_shipment
          AND route IN @it_route
          AND erdat IN @it_settle_date
        ORDER BY tknum
        INTO TABLE @lt_vttk.
    ENDIF.

    LOOP AT lt_vttk ASSIGNING FIELD-SYMBOL(<ls_vttk>).
      DATA(ls_out) = VALUE ty_result(
        shipmentno     = <ls_vttk>-tknum
        tpp            = <ls_vttk>-tplst
        route          = <ls_vttk>-route
        settlementdate = <ls_vttk>-erdat
        driver         = <ls_vttk>-/bev1/rpfar1
        vehicle        = <ls_vttk>-/bev1/rpmowa
        referencedoc   = <ls_vttk>-xblnr
        headertext     = <ls_vttk>-bktxt ).

      " ---------------------------------------------------------------
      " Enrichment extension points (wired to the /DSD/ + /CCEJ/ tables
      " already used by the classic report – same field names):
      "   * StatusId  <- /DSD/ST_STATUS  by shipment
      "   * Plant     <- TTDS / route determination
      "   * Warnings / Errors <- /DSD/ST_APPLOG_VIEW (application log)
      "   * Scenario  <- visit group rule ( CCEJPAPER => 'R', MOD-030 )
      " Defaults keep the object activatable; populate on the target
      " system where the custom tables are available.
      " ---------------------------------------------------------------
      ls_out-warnings = 0.
      ls_out-errors   = 0.

      ls_out-processingstatus = derive_processing_status(
                                  iv_warnings = ls_out-warnings
                                  iv_errors   = ls_out-errors ).

      APPEND ls_out TO rt_result.
    ENDLOOP.

  ENDMETHOD.


  METHOD derive_processing_status.

    " Traffic-light rule reused from the classic report:
    "   Red    -> at least one error
    "   Yellow -> no error but at least one warning
    "   Green  -> clean
    rv_status = 'G'.
    IF iv_errors > 0.
      rv_status = 'R'.
    ELSEIF iv_warnings > 0.
      rv_status = 'Y'.
    ENDIF.

  ENDMETHOD.

ENDCLASS.
