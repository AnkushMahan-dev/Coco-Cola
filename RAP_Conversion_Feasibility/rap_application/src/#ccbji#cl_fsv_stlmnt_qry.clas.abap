*&---------------------------------------------------------------------*
*&  Class  /CCBJI/CL_FSV_STLMNT_QRY
*&---------------------------------------------------------------------*
*&  RAP query implementation (Pattern B) for /CCBJI/I_FSV_STLMNT_DTL.
*&  Modernizes report /CCBJI/RDSDFSVG_STLMNT_DETAILS - all 9 modes of
*&  the classic g2 radio group, dispatched by the ReportMode filter.
*&
*&  ARCHITECTURE (mirrors the report):
*&    selection -> /CCEJ/T_INB_STAT (plant/date -> visit list)
*&              -> /DSD/ST_STATUS   (-> tour_id)         = get_tours( )
*&              -> per-reportmode table by tour_id / shipment = read_<mode>( )
*&
*&  NO-DUMP GUARANTEE: the whole select() body and every read_* method run
*&  inside TRY/CATCH cx_root, so no input can ever short-dump the service -
*&  any DB/data error simply yields an empty result set.
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
           tt_r_mode   TYPE RANGE OF /ccbji/fsv_mode,
           ty_status   TYPE c LENGTH 1.

    TYPES: BEGIN OF ty_tour,
             tourid    TYPE /dsd/hh_tour_id,
             vlid      TYPE /dsd/vc_vlid,
             werks     TYPE werks_d,
             route     TYPE route,
             date      TYPE erdat,
             idoc      TYPE edi_docnum,
             status_id TYPE /dsd/st_status_id,
           END OF ty_tour,
           tt_tour TYPE STANDARD TABLE OF ty_tour WITH DEFAULT KEY.

    TYPES: BEGIN OF ty_result,
             seqno            TYPE i,
             reportmode       TYPE c LENGTH 4,
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
             codriver         TYPE /dsd/rp_driver1,
             vehicle          TYPE /dsd/rp_truck,
             scenario         TYPE c LENGTH 1,
             drvswap          TYPE c LENGTH 1,
             visitgroup       TYPE /dsd/vc_authority,
             idocno           TYPE edi_docnum,
             createdon        TYPE dats,
             createdtime      TYPE tims,
             createdby        TYPE c LENGTH 12,
             changedon        TYPE dats,
             changedtime      TYPE tims,
             changedby        TYPE c LENGTH 12,
             light            TYPE int1,
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

    METHODS get_tours
      IMPORTING it_shipment    TYPE tt_r_tknum
                it_route       TYPE tt_r_route
                it_settle_date TYPE tt_r_erdat
                it_plant       TYPE tt_r_werks
                it_status      TYPE tt_r_status
      RETURNING VALUE(rt_tour) TYPE tt_tour.

    METHODS read_tour     IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
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
    DATA lt_mode        TYPE tt_r_mode.

    " Everything that can touch the DB is inside ONE TRY/CATCH so the
    " OData service can NEVER short-dump - any error returns empty rows.
    DATA lt_result TYPE tt_result.
    DATA lv_mode   TYPE c LENGTH 4 VALUE 'TOUR'.

    TRY.
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

        IF lt_mode IS NOT INITIAL.
          lv_mode = lt_mode[ 1 ]-low.
        ENDIF.
        IF lv_mode IS INITIAL.
          lv_mode = 'TOUR'.
        ENDIF.

        " Resolve the selection -> tours (visit list -> /dsd/st_status ->
        " tour_id, enriched with plant/route/date). get_tours has the
        " performance guard, so a blank search yields no tours = no scan.
        DATA(lt_tour) = get_tours(
          it_shipment = lt_shipment  it_route = lt_route
          it_settle_date = lt_settle_date  it_plant = lt_plant
          it_status = lt_status ).

        CASE lv_mode.
          WHEN 'TOUR'.  lt_result = read_tour(    it_tour = lt_tour ).
          WHEN 'VISI'.  lt_result = read_visit(   it_tour = lt_tour ).
          WHEN 'SLRP'.  lt_result = read_sales(   it_tour = lt_tour ).
          WHEN 'PAYT'.  lt_result = read_payment( it_tour = lt_tour ).
          WHEN 'CHCK'.  lt_result = read_check(   it_tour = lt_tour ).
          WHEN 'MONY'.  lt_result = read_money(   it_tour = lt_tour ).
          WHEN 'QUAN'.  lt_result = read_quan(    it_tour = lt_tour ).
          WHEN 'FSRD'.  lt_result = read_fsr(     it_tour = lt_tour ).
          WHEN OTHERS.  CLEAR lt_result.
        ENDCASE.
      CATCH cx_root.
        CLEAR lt_result.
    ENDTRY.

    LOOP AT lt_result ASSIGNING FIELD-SYMBOL(<r>).
      <r>-seqno = sy-tabix.
      IF <r>-reportmode IS INITIAL.
        <r>-reportmode = lv_mode.
      ENDIF.
    ENDLOOP.

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

    " Route is deliberately NOT used here: entity Route is SD route CHAR(6)
    " while /CCEJ/T_INB_STAT-ROUTE is CHAR(4). Comparing them raises
    " CX_SY_OPEN_SQL_DATA_ERROR ('002051' not valid for C(4)). Plant + date
    " resolve the visit lists. Wrapped so no data error can ever dump.
    " PERFORMANCE GUARD: never issue an unbounded full-table read. If the
    " user gave no selective key (no visit list, no plant, no date), return
    " empty - this is what prevents TSV_TNEW_PAGE_ALLOC_FAILED on a blank
    " search (which TRY/CATCH cannot trap, being a resource error).
    IF it_shipment IS INITIAL AND it_plant IS INITIAL AND it_settle_date IS INITIAL.
      RETURN.
    ENDIF.

    TRY.
        DATA lt_status TYPE STANDARD TABLE OF /dsd/st_status.

        IF it_shipment IS NOT INITIAL.
          " Visit List -> status / tour   (classic f_status, rb_visi branch:
          " the Visit List matches /DSD/ST_STATUS-VLID, giving TOUR_ID).
          SELECT * FROM /dsd/st_status
            WHERE vlid IN @it_shipment AND status_id IN @it_status
            INTO TABLE @lt_status.
        ELSE.
          " Plant/date -> visit lists -> status / tour
          SELECT * FROM /ccej/t_inb_stat
            WHERE werks IN @it_plant AND creation_date IN @it_settle_date
            INTO TABLE @DATA(lt_inb0).
          IF lt_inb0 IS NOT INITIAL.
            SELECT * FROM /dsd/st_status
              FOR ALL ENTRIES IN @lt_inb0
              WHERE vlid = @lt_inb0-visitlist AND status_id IN @it_status
              INTO TABLE @lt_status.
          ENDIF.
        ENDIF.

        IF lt_status IS INITIAL.
          RETURN.
        ENDIF.

        " Enrich Plant / Route / Settlement date from /CCEJ by visit list.
        SELECT * FROM /ccej/t_inb_stat
          FOR ALL ENTRIES IN @lt_status
          WHERE visitlist = @lt_status-vlid
          INTO TABLE @DATA(lt_inb).

        LOOP AT lt_status ASSIGNING FIELD-SYMBOL(<s>).
          DATA(ls_tour) = VALUE ty_tour(
            tourid    = <s>-tourid
            vlid      = <s>-vlid
            status_id = <s>-status_id ).
          READ TABLE lt_inb ASSIGNING FIELD-SYMBOL(<i>) WITH KEY visitlist = <s>-vlid.
          IF sy-subrc = 0.
            ls_tour-werks = <i>-werks.
            ls_tour-route = <i>-route.
            ls_tour-date  = <i>-creation_date.
            ls_tour-idoc  = <i>-idoc_number.
          ENDIF.
          APPEND ls_tour TO rt_tour.
        ENDLOOP.
      CATCH cx_root.
        CLEAR rt_tour.
    ENDTRY.

  ENDMETHOD.


  METHOD read_tour.

    " Mode 1 - Tour Details, ported column-for-column from the classic
    " f_get_driver_details:
    "   /DSD/HH_RAHD    (by tour_id)  -> driver, co-driver, plant, procstat,
    "                                    created/changed on/time/by, obj_id
    "   /DSD/HH_RACOCIHD(by tour_id)  -> scenario + driver swap (CHECKER)
    "   /DSD/VC_VLH     (by obj_id)   -> visit group (AUTH)
    "   resolved tour   (/CCEJ)       -> plant, route, settlement date, idoc
    "   status_id                      -> Exception traffic light
    " Bounding key is the tour list, so a blank search yields nothing.
    IF it_tour IS INITIAL. RETURN. ENDIF.

    " Fiori criticality: 3 = green (positive), 2 = yellow (critical),
    " 1 = red (negative), 0 = gray (neutral) - matches the classic light.
    CONSTANTS: lc_green  TYPE int1 VALUE 3,
               lc_red    TYPE int1 VALUE 1,
               lc_yellow TYPE int1 VALUE 2,
               lc_gray   TYPE int1 VALUE 0,
               lc_paper  TYPE /dsd/vc_authority VALUE 'CCEJPAPER'.

    TRY.
        SELECT * FROM /dsd/hh_rahd
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_rahd).

        IF lt_rahd IS NOT INITIAL.
          " Scenario + Driver swap source (CHECKER string).
          SELECT tour_id, checker FROM /dsd/hh_racocihd
            FOR ALL ENTRIES IN @lt_rahd
            WHERE tour_id = @lt_rahd-tour_id
            INTO TABLE @DATA(lt_coci).
          " Visit group (AUTH) by visit list (OBJ_ID).
          SELECT vlid, auth FROM /dsd/vc_vlh
            FOR ALL ENTRIES IN @lt_rahd
            WHERE vlid = @lt_rahd-obj_id
            INTO TABLE @DATA(lt_vlh).
        ENDIF.

        LOOP AT it_tour ASSIGNING FIELD-SYMBOL(<t>).
          DATA ls_r TYPE ty_result.
          CLEAR ls_r.
          ls_r-reportmode     = 'TOUR'.
          ls_r-shipmentno     = <t>-vlid.
          ls_r-tourid         = <t>-tourid.
          ls_r-plant          = <t>-werks.
          ls_r-route          = <t>-route.
          ls_r-settlementdate = <t>-date.
          ls_r-statusid       = <t>-status_id.
          ls_r-idocno         = <t>-idoc.

          READ TABLE lt_rahd ASSIGNING FIELD-SYMBOL(<h>) WITH KEY tour_id = <t>-tourid.
          IF sy-subrc = 0.
            ls_r-driver           = <h>-driver.
            ls_r-codriver         = <h>-codriver.
            ls_r-processingstatus = <h>-procstat.
            ls_r-createdon        = <h>-credate.
            ls_r-createdtime      = <h>-cretime.
            ls_r-createdby        = <h>-creuser.
            ls_r-changedon        = <h>-cngdate.
            ls_r-changedtime      = <h>-cngtime.
            ls_r-changedby        = <h>-cnguser.
            IF <h>-plant IS NOT INITIAL.
              ls_r-plant = <h>-plant.
            ENDIF.

            " Visit group (AUTH).
            READ TABLE lt_vlh ASSIGNING FIELD-SYMBOL(<vl>) WITH KEY vlid = <h>-obj_id.
            IF sy-subrc = 0.
              ls_r-visitgroup = <vl>-auth.
            ENDIF.

            " Scenario + Driver swap from CHECKER (classic MOD-008/017 rules).
            READ TABLE lt_coci ASSIGNING FIELD-SYMBOL(<co>) WITH KEY tour_id = <t>-tourid.
            IF sy-subrc = 0 AND <co>-checker IS NOT INITIAL.
              DATA(lv_len) = strlen( <co>-checker ) - 1.
              ls_r-scenario = <co>-checker+lv_len(1).
              ls_r-drvswap  = <co>-checker+0(1).
            ELSE.
              ls_r-drvswap = 'N'.
            ENDIF.
            " Scenario valid only for R/V/H, else blank.
            IF ls_r-scenario <> 'R' AND ls_r-scenario <> 'V' AND ls_r-scenario <> 'H'.
              CLEAR ls_r-scenario.
            ENDIF.
            " Driver swap valid only for B/G/A, else N.
            IF ls_r-drvswap <> 'B' AND ls_r-drvswap <> 'G' AND ls_r-drvswap <> 'A'.
              ls_r-drvswap = 'N'.
            ENDIF.
            " MOD-030: visit group CCEJPAPER -> scenario R, driver swap N.
            IF ls_r-visitgroup = lc_paper.
              ls_r-scenario = 'R'.
              ls_r-drvswap  = 'N'.
            ENDIF.
          ENDIF.

          " Exception traffic light from status id (classic mapping).
          CASE ls_r-statusid.
            WHEN '804090'. ls_r-light = lc_green.
            WHEN '804000'. ls_r-light = lc_red.
            WHEN '803000'. ls_r-light = lc_yellow.
            WHEN OTHERS.   ls_r-light = lc_gray.
          ENDCASE.

          DATA lv_ref TYPE xblnr.
          lv_ref = <t>-vlid.
          SHIFT lv_ref LEFT DELETING LEADING '0'.
          ls_r-referencedoc = lv_ref.
          ls_r-headertext   = lv_ref.

          APPEND ls_r TO rt.
        ENDLOOP.
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_visit.

    IF it_tour IS INITIAL. RETURN. ENDIF.
    TRY.
        SELECT * FROM /dsd/hh_racvhd
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_racvhd).

        LOOP AT lt_racvhd ASSIGNING FIELD-SYMBOL(<c>).
          READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <c>-tour_id.
          APPEND VALUE ty_result(
            reportmode  = 'VISI'
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
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_sales.

    IF it_tour IS INITIAL. RETURN. ENDIF.
    TRY.
        SELECT * FROM /dsd/hh_radelhd
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_del).

        LOOP AT lt_del ASSIGNING FIELD-SYMBOL(<d>).
          READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <d>-tour_id.
          APPEND VALUE ty_result(
            reportmode = 'SLRP'
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
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_payment.

    IF it_tour IS INITIAL. RETURN. ENDIF.
    TRY.
        SELECT * FROM /dsd/hh_raec
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_pay).

        LOOP AT lt_pay ASSIGNING FIELD-SYMBOL(<p>).
          READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <p>-tour_id.
          DATA ls_p TYPE ty_result.
          CLEAR ls_p.
          ls_p-reportmode    = 'PAYT'.
          ls_p-tourid        = <p>-tour_id.
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
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_check.

    IF it_tour IS INITIAL. RETURN. ENDIF.
    TRY.
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
          ls_c-reportmode = 'CHCK'.
          ls_c-tourid     = <m>-tour_id.
          ls_c-material   = <m>-matnr.
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
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_money.

    IF it_tour IS INITIAL. RETURN. ENDIF.
    TRY.
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
          ls_m-reportmode = 'MONY'.
          ls_m-slddocid   = <mb>-sld_doc_id.
          ls_m-amount     = <mb>-amount_diff.
          IF <it> IS ASSIGNED.
            ls_m-tourid     = <it>-tour_id.
            ls_m-shipmentno = <it>-obj_id.
            READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <it>-tour_id.
            IF sy-subrc = 0.
              ls_m-plant = <t>-werks.  ls_m-route = <t>-route.
              ls_m-settlementdate = <t>-date.  ls_m-statusid = <t>-status_id.
            ENDIF.
          ENDIF.
          APPEND ls_m TO rt.
        ENDLOOP.
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_quan.

    IF it_tour IS INITIAL. RETURN. ENDIF.
    TRY.
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
          ls_q-reportmode = 'QUAN'.
          ls_q-slddocid   = <qb>-sld_doc_id.
          ls_q-material   = <qb>-matnr.
          ls_q-quandiff   = <qb>-quan_final_diff.
          READ TABLE lt_makt ASSIGNING FIELD-SYMBOL(<mk>) WITH KEY matnr = <qb>-matnr.
          IF sy-subrc = 0.
            ls_q-materialdesc = <mk>-maktx.
          ENDIF.
          IF <it> IS ASSIGNED.
            ls_q-tourid     = <it>-tour_id.
            ls_q-shipmentno = <it>-obj_id.
            READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <it>-tour_id.
            IF sy-subrc = 0.
              ls_q-plant = <t>-werks.  ls_q-route = <t>-route.
              ls_q-settlementdate = <t>-date.  ls_q-statusid = <t>-status_id.
            ENDIF.
          ENDIF.
          APPEND ls_q TO rt.
        ENDLOOP.
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_fsr.

    IF it_tour IS INITIAL. RETURN. ENDIF.
    TRY.
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
            reportmode   = 'FSRD'
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
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

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
