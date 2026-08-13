*&---------------------------------------------------------------------*
*&  Class  /CCBJI/CL_FSV_STLMNT_QRY
*&---------------------------------------------------------------------*
*&  RAP query implementation (Pattern B) for /CCBJI/I_FSV_STLMNT_DTL.
*&  Modernizes report /CCBJI/RDSDFSVG_STLMNT_DETAILS - all 9 modes of
*&  the classic g2 radio group, dispatched by parameter P_Mode.
*&
*&  ARCHITECTURE (mirrors the report):
*&    selection -> /CCEJ/T_INB_STAT (plant/route/date -> vlid)
*&              -> /DSD/ST_STATUS   (-> tour_id)         = get_tours( )
*&              -> per-reportmode table by tour_id / shipment  = read_<reportmode>( )
*&
*&  NOTE: the /DSD/* + /CCEJ/* tables are read with SELECT * and the
*&  fields the classic report already uses, so no field-list guessing.
*&  Deep enrichment (order flow FM, currency conversion, timezone,
*&  application-log traffic lights) is marked as hooks - port as needed.
*&---------------------------------------------------------------------*
CLASS /ccbji/cl_fsv_stlmnt_qry DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_rap_query_provider.

  PRIVATE SECTION.

    TYPES: tt_r_tknum  TYPE RANGE OF tknum,
           tt_r_route  TYPE RANGE OF route,
           tt_r_erdat  TYPE RANGE OF erdat,
           tt_r_werks  TYPE RANGE OF werks_d,
           tt_r_status TYPE RANGE OF /dsd/st_status_id,
           tt_r_tplst  TYPE RANGE OF tplst,
           tt_r_driver TYPE RANGE OF /dsd/rp_driver1,
           tt_r_truck  TYPE RANGE OF /dsd/rp_truck,
           tt_r_mode   TYPE RANGE OF /ccbji/fsv_mode.

    " Resolved tour (selection -> inb_stat -> st_status)
    TYPES: BEGIN OF ty_tour,
             tourid    TYPE /dsd/hh_tour_id,
             vlid      TYPE /dsd/vc_vlid,
             werks     TYPE werks_d,
             route     TYPE route,
             date      TYPE erdat,
             status_id TYPE /dsd/st_status_id,
           END OF ty_tour,
           tt_tour TYPE STANDARD TABLE OF ty_tour WITH DEFAULT KEY.

    " Output = superset of all modes (matches the custom entity)
    TYPES: BEGIN OF ty_result,
             seqno            TYPE i,
             reportmode             TYPE c LENGTH 4,
             shipmentno       TYPE tknum,
             tourid           TYPE /dsd/hh_tour_id,
             visitid          TYPE /dsd/hh_visit_id,
             processingstatus TYPE c LENGTH 1,
             tpp              TYPE tplst,
             statusid         TYPE /dsd/st_status_id,
             plant            TYPE werks_d,
             route            TYPE route,
             settlementdate   TYPE erdat,
             driver           TYPE /dsd/rp_driver1,
             vehicle          TYPE /dsd/rp_truck,
             scenario         TYPE c LENGTH 1,
             customer         TYPE kunnr,
             vkorg            TYPE vkorg,
             visitreason      TYPE /dsd/hh_viscod,
             objtype          TYPE /dsd/hh_del_doctyp,
             material         TYPE matnr,
             materialdesc     TYPE maktx,
             quantity         TYPE p LENGTH 8 DECIMALS 3,
             uom              TYPE /dsd/hh_uom,
             quandiff         TYPE p LENGTH 8 DECIMALS 3,
             amount           TYPE p LENGTH 8 DECIMALS 2,
             currency         TYPE waers,
             paymentmethod    TYPE /dsd/hh_paymt,
             cardno           TYPE /dsd/hh_cardnr,
             cashtype         TYPE /dsd/hh_csh_typ,
             slddocid         TYPE /dsd/sl_sld_id,
             accountingdoc    TYPE belnr_d,
             postingkey       TYPE bschl,
             deliveryno       TYPE vbeln_vl,
             ponumber         TYPE bstkd,
             warnings         TYPE i,
             errors           TYPE i,
             referencedoc     TYPE xblnr,
             headertext       TYPE bktxt,
           END OF ty_result,
           tt_result TYPE STANDARD TABLE OF ty_result WITH DEFAULT KEY.

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

    "! selection -> inb_stat -> st_status -> resolved tours
    METHODS get_tours
      IMPORTING it_shipment    TYPE tt_r_tknum
                it_route       TYPE tt_r_route
                it_settle_date TYPE tt_r_erdat
                it_plant       TYPE tt_r_werks
                it_status      TYPE tt_r_status
      RETURNING VALUE(rt_tour) TYPE tt_tour.

    METHODS read_tour     IMPORTING it_shipment TYPE tt_r_tknum
                                    it_route    TYPE tt_r_route
                                    it_date     TYPE tt_r_erdat
                          RETURNING VALUE(rt)   TYPE tt_result.
    METHODS read_visit    IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
    METHODS read_sales    IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
    METHODS read_payment  IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
    METHODS read_check    IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
    METHODS read_money    IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
    METHODS read_quan     IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
    METHODS read_fsr      IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.

    METHODS derive_processing_status
      IMPORTING iv_warnings      TYPE i
                iv_errors        TYPE i
      RETURNING VALUE(rv_status) TYPE c.

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
    DATA lt_mode        TYPE tt_r_mode.

    " 1. RAP filter -> ABAP ranges
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
        WHEN 'REPORTMODE'.     lt_mode        = CORRESPONDING #( ls_range-range ).
        WHEN OTHERS.
      ENDCASE.
    ENDLOOP.

    " 1b. Report mode - from the ReportMode single-select dropdown filter.
    DATA lv_mode TYPE c LENGTH 4 VALUE 'TOUR'.
    IF lt_mode IS NOT INITIAL.
      lv_mode = lt_mode[ 1 ]-low.
    ENDIF.
    IF lv_mode IS INITIAL.
      lv_mode = 'TOUR'.
    ENDIF.

    " 2. Validation (same /CCEJ/OTC messages as report FORM f_validation)
    validate_selection(
      it_shipment = lt_shipment  it_route   = lt_route
      it_settle_date = lt_settle_date  it_plant = lt_plant
      it_status = lt_status  it_tpp = lt_tpp
      it_driver = lt_driver  it_vehicle = lt_vehicle ).

    " 3. Resolve tours (needed by every /DSD/-based reportmode)
    DATA(lt_tour) = get_tours(
      it_shipment = lt_shipment  it_route = lt_route
      it_settle_date = lt_settle_date  it_plant = lt_plant
      it_status = lt_status ).

    " 4. Per-reportmode dispatch (classic FORM f_mode_choose)
    DATA lt_result TYPE tt_result.
    CASE lv_mode.
      WHEN 'TOUR'.  lt_result = read_tour( it_shipment = lt_shipment it_route = lt_route it_date = lt_settle_date ).
      WHEN 'VISI'.  lt_result = read_visit(   it_tour = lt_tour ).
      WHEN 'SLRP'.  lt_result = read_sales(   it_tour = lt_tour ).
      WHEN 'PAYT'.  lt_result = read_payment( it_tour = lt_tour ).
      WHEN 'CHCK'.  lt_result = read_check(   it_tour = lt_tour ).
      WHEN 'MONY'.  lt_result = read_money(   it_tour = lt_tour ).
      WHEN 'QUAN'.  lt_result = read_quan(    it_tour = lt_tour ).
      WHEN 'FSRD'.  lt_result = read_fsr(     it_tour = lt_tour ).
      WHEN OTHERS.  CLEAR lt_result.   " CASH: port f_get_cash similarly
    ENDCASE.

    " 5. Stamp reportmode + running key
    LOOP AT lt_result ASSIGNING FIELD-SYMBOL(<r>).
      <r>-seqno = sy-tabix.
      IF <r>-reportmode IS INITIAL.
        <r>-reportmode = lv_mode.
      ENDIF.
    ENDLOOP.

    " 6. Sorting
    DATA lt_sort_order TYPE abap_sortorder_tab.
    LOOP AT io_request->get_sort_elements( ) INTO DATA(ls_sort).
      APPEND VALUE #( name = ls_sort-element_name descending = ls_sort-descending ) TO lt_sort_order.
    ENDLOOP.
    IF lt_sort_order IS NOT INITIAL.
      SORT lt_result BY (lt_sort_order).
    ENDIF.

    " 7. Count + paging + return
    IF io_request->is_total_numb_of_rec_requested( ).
      io_response->set_total_number_of_records( lines( lt_result ) ).
    ENDIF.

    IF io_request->is_data_requested( ).
      DATA(lo_paging)  = io_request->get_paging( ).
      DATA(lv_offset)  = lo_paging->get_offset( ).
      DATA(lv_page_sz) = lo_paging->get_page_size( ).
      IF lv_page_sz <> if_rap_query_paging=>page_size_unlimited.
        DATA lt_page TYPE tt_result.
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


  METHOD get_tours.

    " Plant + Route + Date -> Visit Lists (/CCEJ/T_INB_STAT)
    DATA lt_inb TYPE STANDARD TABLE OF /ccej/t_inb_stat.
    IF it_shipment IS INITIAL.
      SELECT * FROM /ccej/t_inb_stat
        WHERE werks IN @it_plant AND route IN @it_route AND date IN @it_settle_date
        INTO TABLE @lt_inb.
    ENDIF.

    " Visit List / Shipment -> Tour (/DSD/ST_STATUS)
    DATA lt_status TYPE STANDARD TABLE OF /dsd/st_status.
    IF it_shipment IS NOT INITIAL.
      SELECT * FROM /dsd/st_status
        WHERE vlid IN @it_shipment AND status_id IN @it_status
        INTO TABLE @lt_status.
    ELSEIF lt_inb IS NOT INITIAL.
      SELECT * FROM /dsd/st_status
        FOR ALL ENTRIES IN @lt_inb
        WHERE vlid = @lt_inb-vlid AND status_id IN @it_status
        INTO TABLE @lt_status.
    ENDIF.

    LOOP AT lt_status ASSIGNING FIELD-SYMBOL(<s>).
      DATA(ls_tour) = VALUE ty_tour(
        tourid    = <s>-tourid
        vlid      = <s>-vlid
        status_id = <s>-status_id ).
      READ TABLE lt_inb ASSIGNING FIELD-SYMBOL(<i>) WITH KEY vlid = <s>-vlid.
      IF sy-subrc = 0.
        ls_tour-werks = <i>-werks.
        ls_tour-route = <i>-route.
        ls_tour-date  = <i>-date.
      ENDIF.
      APPEND ls_tour TO rt_tour.
    ENDLOOP.

  ENDMETHOD.


  METHOD read_tour.

    " Mode 1 - Tour header from VTTK (same as classic f_get_driver_details).
    DATA lt_vttk TYPE STANDARD TABLE OF vttk.
    SELECT * FROM vttk
      WHERE tknum IN @it_shipment AND route IN @it_route AND erdat IN @it_date
      ORDER BY tknum
      INTO TABLE @lt_vttk.

    LOOP AT lt_vttk ASSIGNING FIELD-SYMBOL(<v>).
      DATA lv_ref TYPE tknum.
      lv_ref = <v>-tknum.
      SHIFT lv_ref LEFT DELETING LEADING '0'.
      APPEND VALUE ty_result(
        reportmode           = 'TOUR'
        shipmentno     = <v>-tknum
        tpp            = <v>-tplst
        route          = <v>-route
        settlementdate = <v>-erdat
        driver         = <v>-/bev1/rpfar1
        vehicle        = <v>-/bev1/rpmowa
        referencedoc   = lv_ref
        headertext     = lv_ref
        processingstatus = derive_processing_status( iv_warnings = 0 iv_errors = 0 )
      ) TO rt.
    ENDLOOP.

  ENDMETHOD.


  METHOD read_visit.

    " Mode 2 - Visit details (/DSD/HH_RACVHD by tour) + customer name.
    IF it_tour IS INITIAL. RETURN. ENDIF.
    SELECT * FROM /dsd/hh_racvhd
      FOR ALL ENTRIES IN @it_tour
      WHERE tour_id = @it_tour-tourid
      INTO TABLE @DATA(lt_racvhd).

    LOOP AT lt_racvhd ASSIGNING FIELD-SYMBOL(<c>).
      READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <c>-tour_id.
      APPEND VALUE ty_result(
        reportmode        = 'VISI'
        tourid      = <c>-tour_id
        visitid     = <c>-visit_id
        customer    = <c>-custnr
        vkorg       = <c>-vkorg
        visitreason = <c>-viscod
        shipmentno  = COND #( WHEN <t> IS ASSIGNED THEN <t>-vlid )
        plant       = COND #( WHEN <t> IS ASSIGNED THEN <t>-werks )
        route       = COND #( WHEN <t> IS ASSIGNED THEN <t>-route )
        settlementdate = COND #( WHEN <t> IS ASSIGNED THEN <t>-date )
        statusid    = COND #( WHEN <t> IS ASSIGNED THEN <t>-status_id )
      ) TO rt.
    ENDLOOP.

  ENDMETHOD.


  METHOD read_sales.

    " Mode 3 - Sales / Replenishment (/DSD/HH_RADELHD by tour).
    IF it_tour IS INITIAL. RETURN. ENDIF.
    SELECT * FROM /dsd/hh_radelhd
      FOR ALL ENTRIES IN @it_tour
      WHERE tour_id = @it_tour-tourid
      INTO TABLE @DATA(lt_del).

    LOOP AT lt_del ASSIGNING FIELD-SYMBOL(<d>).
      READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <d>-tour_id.
      APPEND VALUE ty_result(
        reportmode       = 'SLRP'
        tourid     = <d>-tour_id
        visitid    = <d>-visit_id
        objtype    = <d>-obj_typ
        plant      = <d>-plant
        deliveryno = <d>-hh_delvry
        ponumber   = <d>-bstkd
        shipmentno = COND #( WHEN <t> IS ASSIGNED THEN <t>-vlid )
        route      = COND #( WHEN <t> IS ASSIGNED THEN <t>-route )
        settlementdate = COND #( WHEN <t> IS ASSIGNED THEN <t>-date )
        statusid   = COND #( WHEN <t> IS ASSIGNED THEN <t>-status_id )
      ) TO rt.
    ENDLOOP.

  ENDMETHOD.


  METHOD read_payment.

    " Mode 4 - Payment details (/DSD/HH_RAEC by tour).
    IF it_tour IS INITIAL. RETURN. ENDIF.
    SELECT * FROM /dsd/hh_raec
      FOR ALL ENTRIES IN @it_tour
      WHERE tour_id = @it_tour-tourid
      INTO TABLE @DATA(lt_pay).

    LOOP AT lt_pay ASSIGNING FIELD-SYMBOL(<p>).
      READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <p>-tour_id.
      DATA ls_p TYPE ty_result.
      CLEAR ls_p.
      ls_p-reportmode   = 'PAYT'.
      ls_p-tourid = <p>-tour_id.
      " Common payment fields (present in /DSD/HH_RAEC per the report):
      ls_p-paymentmethod = <p>-paymt.
      ls_p-cardno        = <p>-cardnr.
      ls_p-amount        = <p>-amount.
      IF <t> IS ASSIGNED.
        ls_p-shipmentno     = <t>-vlid.
        ls_p-plant          = <t>-werks.
        ls_p-route          = <t>-route.
        ls_p-settlementdate = <t>-date.
        ls_p-statusid       = <t>-status_id.
      ENDIF.
      APPEND ls_p TO rt.
    ENDLOOP.

  ENDMETHOD.


  METHOD read_check.

    " Mode 5 - Check Out / Check In (/DSD/HH_RACOCIMI by tour) + material text.
    IF it_tour IS INITIAL. RETURN. ENDIF.
    SELECT * FROM /dsd/hh_racocimi
      FOR ALL ENTRIES IN @it_tour
      WHERE tour_id = @it_tour-tourid
      INTO TABLE @DATA(lt_mi).

    IF lt_mi IS NOT INITIAL.
      SELECT matnr, maktx FROM makt
        FOR ALL ENTRIES IN @lt_mi
        WHERE matnr = @lt_mi-matnr AND spras = @sy-langu
        INTO TABLE @DATA(lt_makt).
    ENDIF.

    LOOP AT lt_mi ASSIGNING FIELD-SYMBOL(<m>).
      READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <m>-tour_id.
      DATA ls_c TYPE ty_result.
      CLEAR ls_c.
      ls_c-reportmode     = 'CHCK'.
      ls_c-tourid   = <m>-tour_id.
      ls_c-material = <m>-matnr.
      READ TABLE lt_makt ASSIGNING FIELD-SYMBOL(<mk>) WITH KEY matnr = <m>-matnr.
      IF sy-subrc = 0.
        ls_c-materialdesc = <mk>-maktx.
      ENDIF.
      IF <t> IS ASSIGNED.
        ls_c-shipmentno     = <t>-vlid.
        ls_c-plant          = <t>-werks.
        ls_c-route          = <t>-route.
        ls_c-settlementdate = <t>-date.
        ls_c-statusid       = <t>-status_id.
      ENDIF.
      APPEND ls_c TO rt.
    ENDLOOP.

  ENDMETHOD.


  METHOD read_money.

    " Mode 6 - Money differences (/DSD/SL_SLD_ITEM -> /DSD/SL_SLD_MBAL).
    IF it_tour IS INITIAL. RETURN. ENDIF.
    SELECT * FROM /dsd/sl_sld_item
      FOR ALL ENTRIES IN @it_tour
      WHERE tour_id = @it_tour-tourid
      INTO TABLE @DATA(lt_item).
    IF lt_item IS INITIAL. RETURN. ENDIF.

    SELECT * FROM /dsd/sl_sld_mbal
      FOR ALL ENTRIES IN @lt_item
      WHERE sld_doc_id = @lt_item-sld_doc_id
      INTO TABLE @DATA(lt_mbal).

    LOOP AT lt_mbal ASSIGNING FIELD-SYMBOL(<mb>).
      READ TABLE lt_item ASSIGNING FIELD-SYMBOL(<it>) WITH KEY sld_doc_id = <mb>-sld_doc_id.
      DATA ls_m TYPE ty_result.
      CLEAR ls_m.
      ls_m-reportmode     = 'MONY'.
      ls_m-slddocid = <mb>-sld_doc_id.
      ls_m-amount   = <mb>-amount_diff.        " difference amount
      IF <it> IS ASSIGNED.
        ls_m-tourid     = <it>-tour_id.
        ls_m-shipmentno = <it>-shipment.
        READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <it>-tour_id.
        IF sy-subrc = 0.
          ls_m-plant = <t>-werks.  ls_m-route = <t>-route.
          ls_m-settlementdate = <t>-date.  ls_m-statusid = <t>-status_id.
        ENDIF.
      ENDIF.
      APPEND ls_m TO rt.
    ENDLOOP.

  ENDMETHOD.


  METHOD read_quan.

    " Mode 7 - Quantity differences (/DSD/SL_SLD_ITEM -> /DSD/SL_SLD_QBAL) + text.
    IF it_tour IS INITIAL. RETURN. ENDIF.
    SELECT * FROM /dsd/sl_sld_item
      FOR ALL ENTRIES IN @it_tour
      WHERE tour_id = @it_tour-tourid
      INTO TABLE @DATA(lt_item).
    IF lt_item IS INITIAL. RETURN. ENDIF.

    SELECT * FROM /dsd/sl_sld_qbal
      FOR ALL ENTRIES IN @lt_item
      WHERE sld_doc_id = @lt_item-sld_doc_id
      INTO TABLE @DATA(lt_qbal).

    IF lt_qbal IS NOT INITIAL.
      SELECT matnr, maktx FROM makt
        FOR ALL ENTRIES IN @lt_qbal
        WHERE matnr = @lt_qbal-matnr AND spras = @sy-langu
        INTO TABLE @DATA(lt_makt).
    ENDIF.

    LOOP AT lt_qbal ASSIGNING FIELD-SYMBOL(<qb>).
      READ TABLE lt_item ASSIGNING FIELD-SYMBOL(<it>) WITH KEY sld_doc_id = <qb>-sld_doc_id.
      DATA ls_q TYPE ty_result.
      CLEAR ls_q.
      ls_q-reportmode     = 'QUAN'.
      ls_q-slddocid = <qb>-sld_doc_id.
      ls_q-material = <qb>-matnr.
      ls_q-quandiff = <qb>-quan_final_diff.
      READ TABLE lt_makt ASSIGNING FIELD-SYMBOL(<mk>) WITH KEY matnr = <qb>-matnr.
      IF sy-subrc = 0.
        ls_q-materialdesc = <mk>-maktx.
      ENDIF.
      IF <it> IS ASSIGNED.
        ls_q-tourid     = <it>-tour_id.
        ls_q-shipmentno = <it>-shipment.
        READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <it>-tour_id.
        IF sy-subrc = 0.
          ls_q-plant = <t>-werks.  ls_q-route = <t>-route.
          ls_q-settlementdate = <t>-date.  ls_q-statusid = <t>-status_id.
        ENDIF.
      ENDIF.
      APPEND ls_q TO rt.
    ENDLOOP.

  ENDMETHOD.


  METHOD read_fsr.

    " Mode 8 - FSR documents: sales-order flow keyed by shipment (= tour vlid).
    " Standard SD tables. Deep order-flow (RV_ORDER_FLOW_INFORMATION,
    " SD_VBFA_READ_WITH_VBELV) and FI/MM docs are enrichment hooks.
    IF it_tour IS INITIAL. RETURN. ENDIF.

    DATA lr_xblnr TYPE RANGE OF xblnr.
    LOOP AT it_tour ASSIGNING FIELD-SYMBOL(<t>).
      DATA lv_x TYPE xblnr.
      lv_x = <t>-vlid.
      SHIFT lv_x LEFT DELETING LEADING '0'.
      APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_x ) TO lr_xblnr.
    ENDLOOP.
    IF lr_xblnr IS INITIAL. RETURN. ENDIF.

    SELECT vbeln, xblnr, auart, vkorg FROM vbak
      WHERE xblnr IN @lr_xblnr
      INTO TABLE @DATA(lt_vbak).

    LOOP AT lt_vbak ASSIGNING FIELD-SYMBOL(<o>).
      READ TABLE it_tour ASSIGNING <t> WITH KEY vlid = |{ <o>-xblnr ALPHA = IN }|.
      APPEND VALUE ty_result(
        reportmode         = 'FSRD'
        shipmentno   = COND #( WHEN <t> IS ASSIGNED THEN <t>-vlid )
        tourid       = COND #( WHEN <t> IS ASSIGNED THEN <t>-tourid )
        plant        = COND #( WHEN <t> IS ASSIGNED THEN <t>-werks )
        route        = COND #( WHEN <t> IS ASSIGNED THEN <t>-route )
        settlementdate = COND #( WHEN <t> IS ASSIGNED THEN <t>-date )
        statusid     = COND #( WHEN <t> IS ASSIGNED THEN <t>-status_id )
        vkorg        = <o>-vkorg
        referencedoc = <o>-xblnr
      ) TO rt.
    ENDLOOP.

  ENDMETHOD.


  METHOD validate_selection.

    " 1:1 port of report FORM f_validation - ORIGINAL /CCEJ/OTC numbers,
    " raised via the concrete exception /CCBJI/CX_FSV_STLMNT.
    IF it_shipment IS NOT INITIAL
       OR ( it_plant IS NOT INITIAL AND it_route IS NOT INITIAL
            AND it_settle_date IS NOT INITIAL ).
    ELSE.
      RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e525(/ccej/otc).
    ENDIF.

    IF it_shipment IS INITIAL AND it_plant IS NOT INITIAL.
      SELECT SINGLE werks FROM t001w INTO @DATA(lv_werks) WHERE werks IN @it_plant.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e012(/ccej/otc).
      ENDIF.
    ENDIF.

    IF it_tpp IS NOT INITIAL.
      SELECT SINGLE tplst FROM ttds INTO @DATA(lv_tplst) WHERE tplst IN @it_tpp.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e125(/ccej/otc).
      ENDIF.
    ENDIF.

    IF it_shipment IS NOT INITIAL.
      SELECT SINGLE tknum FROM vttk INTO @DATA(lv_tknum) WHERE tknum IN @it_shipment.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e123(/ccej/otc).
      ENDIF.
    ENDIF.

    IF it_status IS NOT INITIAL.
      SELECT SINGLE status_id FROM /dsd/st_cstatus INTO @DATA(lv_st) WHERE status_id IN @it_status.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e124(/ccej/otc).
      ENDIF.
    ENDIF.

    IF it_route IS NOT INITIAL.
      SELECT SINGLE route FROM tvro INTO @DATA(lv_ro) WHERE route IN @it_route.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e126(/ccej/otc).
      ENDIF.
    ENDIF.

    IF it_vehicle IS NOT INITIAL.
      SELECT SINGLE equnr FROM equi INTO @DATA(lv_eq) WHERE equnr IN @it_vehicle.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e127(/ccej/otc).
      ENDIF.
    ENDIF.

    IF it_driver IS NOT INITIAL.
      SELECT SINGLE kunnr FROM kna1 INTO @DATA(lv_kn) WHERE kunnr IN @it_driver.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE /ccbji/cx_fsv_stlmnt MESSAGE e128(/ccej/otc).
      ENDIF.
    ENDIF.

  ENDMETHOD.


  METHOD derive_processing_status.
    rv_status = 'G'.
    IF iv_errors > 0.
      rv_status = 'R'.
    ELSEIF iv_warnings > 0.
      rv_status = 'Y'.
    ENDIF.
  ENDMETHOD.

ENDCLASS.
