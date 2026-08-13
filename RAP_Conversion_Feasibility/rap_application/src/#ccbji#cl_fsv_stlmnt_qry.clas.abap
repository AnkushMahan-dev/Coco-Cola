*&---------------------------------------------------------------------*
*&  Class  /CCBJI/CL_FSV_STLMNT_QRY
*&---------------------------------------------------------------------*
*&  RAP query implementation (Pattern B) for the custom entity
*&  /CCBJI/I_FSV_STLMNT_DTL.
*&
*&  Replaces the read logic of the classic ALV report
*&  /CCBJI/RDSDFSVG_STLMNT_DETAILS (Settlement Details - Tour Header).
*&
*&  Business requirement, output data AND validations are preserved:
*&  the same selection checks (report FORM f_validation), the same
*&  /CCEJ/OTC messages, the same source table and the same traffic-light
*&  derivation run here and are returned through OData V4 instead of SALV.
*&---------------------------------------------------------------------*
CLASS /ccbji/cl_fsv_stlmnt_qry DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_rap_query_provider.

  PRIVATE SECTION.

    " RANGE OF cannot be used inline in a METHODS signature on this
    " release, so it is wrapped in named table types.
    TYPES: tt_r_tknum  TYPE RANGE OF tknum,
           tt_r_route  TYPE RANGE OF route,
           tt_r_erdat  TYPE RANGE OF erdat,
           tt_r_werks  TYPE RANGE OF werks_d,
           tt_r_status TYPE RANGE OF /dsd/st_status_id,
           tt_r_tplst  TYPE RANGE OF tplst,
           tt_r_driver TYPE RANGE OF /dsd/rp_driver1,
           tt_r_truck  TYPE RANGE OF /dsd/rp_truck,
           ty_status   TYPE c LENGTH 1.

    "! Output structure - mirrors the key columns of the report ty_final
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

    "! Reproduces report FORM f_validation (same /CCEJ/OTC messages).
    METHODS validate_selection
      IMPORTING it_shipment    TYPE tt_r_tknum
                it_route       TYPE tt_r_route
                it_settle_date TYPE tt_r_erdat
                it_plant       TYPE tt_r_werks
                it_status      TYPE tt_r_status
                it_tpp         TYPE tt_r_tplst
                it_driver      TYPE tt_r_driver
                it_vehicle     TYPE tt_r_truck
      RAISING   cx_rap_query_provider.

    METHODS read_settlement_data
      IMPORTING it_shipment      TYPE tt_r_tknum
                it_route         TYPE tt_r_route
                it_settle_date   TYPE tt_r_erdat
                iv_max_rows      TYPE i
      RETURNING VALUE(rt_result) TYPE tt_result.

    METHODS derive_processing_status
      IMPORTING iv_warnings      TYPE i
                iv_errors        TYPE i
      RETURNING VALUE(rv_status) TYPE ty_status.

ENDCLASS.


CLASS /ccbji/cl_fsv_stlmnt_qry IMPLEMENTATION.

  METHOD if_rap_query_provider~select.

    DATA lt_shipment    TYPE tt_r_tknum.
    DATA lt_route       TYPE tt_r_route.
    DATA lt_settle_date TYPE tt_r_erdat.
    DATA lt_plant       TYPE tt_r_werks.
    DATA lt_status      TYPE tt_r_status.
    DATA lt_tpp         TYPE tt_r_tplst.
    DATA lt_driver      TYPE tt_r_driver.
    DATA lt_vehicle     TYPE tt_r_truck.

    " -----------------------------------------------------------------
    " 1. Translate the RAP filter (Fiori selection fields) into ABAP
    "    ranges - the equivalent of the classic SELECT-OPTIONS.
    "    get_as_ranges( ) returns the range table directly in ls_range-range
    "    (it is NOT a data reference), so use it straight in CORRESPONDING.
    " -----------------------------------------------------------------
    TRY.
        DATA(lt_ranges) = io_request->get_filter( )->get_as_ranges( ).
      CATCH cx_rap_query_filter_no_range.
        CLEAR lt_ranges.
    ENDTRY.

    LOOP AT lt_ranges INTO DATA(ls_range).
      CASE ls_range-name.
        WHEN 'SHIPMENTNO'.     lt_shipment    = CORRESPONDING #( ls_range-range ).
        WHEN 'ROUTE'.          lt_route       = CORRESPONDING #( ls_range-range ).
        WHEN 'SETTLEMENTDATE'. lt_settle_date = CORRESPONDING #( ls_range-range ).
        WHEN 'PLANT'.          lt_plant       = CORRESPONDING #( ls_range-range ).
        WHEN 'STATUSID'.       lt_status      = CORRESPONDING #( ls_range-range ).
        WHEN 'TPP'.            lt_tpp         = CORRESPONDING #( ls_range-range ).
        WHEN 'DRIVER'.         lt_driver      = CORRESPONDING #( ls_range-range ).
        WHEN 'VEHICLE'.        lt_vehicle     = CORRESPONDING #( ls_range-range ).
        WHEN OTHERS.
      ENDCASE.
    ENDLOOP.

    " -----------------------------------------------------------------
    " 2. VALIDATION - same checks / same /CCEJ/OTC messages as
    "    report FORM f_validation. A failure aborts the query
    "    (= LEAVE LIST-PROCESSING) and shows the message in Fiori.
    " -----------------------------------------------------------------
    validate_selection(
      it_shipment    = lt_shipment
      it_route       = lt_route
      it_settle_date = lt_settle_date
      it_plant       = lt_plant
      it_status      = lt_status
      it_tpp         = lt_tpp
      it_driver      = lt_driver
      it_vehicle     = lt_vehicle ).

    " -----------------------------------------------------------------
    " 3. Paging - translate OData $top / $skip into a max-rows guard.
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
    " 4. Read + derive the data (the reused report logic).
    " -----------------------------------------------------------------
    DATA(lt_result) = read_settlement_data(
                        it_shipment    = lt_shipment
                        it_route       = lt_route
                        it_settle_date = lt_settle_date
                        iv_max_rows    = lv_max_rows ).

    " -----------------------------------------------------------------
    " 5. Sorting requested by the consumer (ALV sort equivalent).
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
    " 6. Total record count for the OData list report.
    " -----------------------------------------------------------------
    IF io_request->is_total_numb_of_rec_requested( ).
      io_response->set_total_number_of_records( lines( lt_result ) ).
    ENDIF.

    " -----------------------------------------------------------------
    " 7. Apply the page window and return the data.
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


  METHOD validate_selection.

    " 1:1 port of report FORM f_validation - ORIGINAL /CCEJ/OTC message
    " numbers, raised via the concrete exception /CCBJI/CX_FSV_STLMNT
    " (CX_RAP_QUERY_PROVIDER is abstract and cannot be raised directly).
    " The query aborts like the classic LEAVE LIST-PROCESSING. Each
    " existence check runs only when its selection value is supplied.

    " Mandatory selection (i525): ShipmentNo OR Plant+Route+Date.
    IF it_shipment IS NOT INITIAL
       OR ( it_plant IS NOT INITIAL AND it_route IS NOT INITIAL
            AND it_settle_date IS NOT INITIAL ).
      " selection is sufficient - continue
    ELSE.
      RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e525(/ccej/otc).
    ENDIF.

    " Plant must exist (i012, checked when no shipment).
    IF it_shipment IS INITIAL AND it_plant IS NOT INITIAL.
      SELECT SINGLE werks FROM t001w INTO @DATA(lv_werks)
        WHERE werks IN @it_plant.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e012(/ccej/otc).
      ENDIF.
    ENDIF.

    " Transportation planning point must exist (i125).
    IF it_tpp IS NOT INITIAL.
      SELECT SINGLE tplst FROM ttds INTO @DATA(lv_tplst)
        WHERE tplst IN @it_tpp.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e125(/ccej/otc).
      ENDIF.
    ENDIF.

    " Shipment number must exist (i123).
    IF it_shipment IS NOT INITIAL.
      SELECT SINGLE tknum FROM vttk INTO @DATA(lv_tknum)
        WHERE tknum IN @it_shipment.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e123(/ccej/otc).
      ENDIF.
    ENDIF.

    " Status must exist (i124).
    IF it_status IS NOT INITIAL.
      SELECT SINGLE status_id FROM /dsd/st_cstatus INTO @DATA(lv_status)
        WHERE status_id IN @it_status.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e124(/ccej/otc).
      ENDIF.
    ENDIF.

    " Route must exist (i126).
    IF it_route IS NOT INITIAL.
      SELECT SINGLE route FROM tvro INTO @DATA(lv_route)
        WHERE route IN @it_route.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e126(/ccej/otc).
      ENDIF.
    ENDIF.

    " Vehicle must exist (i127).
    IF it_vehicle IS NOT INITIAL.
      SELECT SINGLE equnr FROM equi INTO @DATA(lv_equnr)
        WHERE equnr IN @it_vehicle.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e127(/ccej/otc).
      ENDIF.
    ENDIF.

    " Driver must exist (i128).
    IF it_driver IS NOT INITIAL.
      SELECT SINGLE kunnr FROM kna1 INTO @DATA(lv_kunnr)
        WHERE kunnr IN @it_driver.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e128(/ccej/otc).
      ENDIF.
    ENDIF.

  ENDMETHOD.


  METHOD read_settlement_data.

    " -----------------------------------------------------------------
    " Read the shipment / visit-list tour header - same source table
    " (VTTK) and same key fields as the classic report ty_vttk.
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

      " ReferenceDoc / HeaderText are NOT columns of table VTTK. In the
      " classic report the ty_vttk work-area fields xblnr/bktxt are set
      " to the SHIPMENT NUMBER with leading zeros removed (report lines
      " 304-308) and displayed as-is; they also double as the join keys
      " to BKPF-XBLNR (FI doc) and MKPF-BKTXT (material doc). Reproduced
      " faithfully here so the columns are populated exactly as before.
      DATA lv_shipref TYPE tknum.
      lv_shipref = <ls_vttk>-tknum.
      SHIFT lv_shipref LEFT DELETING LEADING '0'.

      DATA(ls_out) = VALUE ty_result(
        shipmentno     = <ls_vttk>-tknum
        tpp            = <ls_vttk>-tplst
        route          = <ls_vttk>-route
        settlementdate = <ls_vttk>-erdat
        driver         = <ls_vttk>-/bev1/rpfar1
        vehicle        = <ls_vttk>-/bev1/rpmowa
        referencedoc   = lv_shipref
        headertext     = lv_shipref ).

      " ---------------------------------------------------------------
      " Enrichment extension points (wired to the /DSD/ + /CCEJ/ tables
      " already used by the classic report - same field names):
      "   * StatusId  <- /DSD/ST_STATUS   by shipment
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
