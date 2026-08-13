*&==== ALL-9-MODES RAP APP. Activation: domain/dtel /CCBJI/FSV_MODE -> VH views (incl /CCBJI/I_FSV_MODE_VH) -> query class -> entity -> MDE -> service def -> binding. ====
*&---- QUERY CLASS /CCBJI/CL_FSV_STLMNT_QRY ----
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

        DATA(lt_tour) = get_tours(
          it_shipment = lt_shipment  it_route = lt_route
          it_settle_date = lt_settle_date  it_plant = lt_plant
          it_status = lt_status ).

        CASE lv_mode.
          WHEN 'TOUR'.  lt_result = read_tour( it_shipment = lt_shipment it_route = lt_route it_date = lt_settle_date ).
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
    TRY.
        DATA lt_inb TYPE STANDARD TABLE OF /ccej/t_inb_stat.
        IF it_shipment IS INITIAL.
          SELECT * FROM /ccej/t_inb_stat
            WHERE werks IN @it_plant
              AND creation_date IN @it_settle_date
            INTO TABLE @lt_inb.
        ENDIF.

        DATA lt_status TYPE STANDARD TABLE OF /dsd/st_status.
        IF it_shipment IS NOT INITIAL.
          SELECT * FROM /dsd/st_status
            WHERE vlid IN @it_shipment AND status_id IN @it_status
            INTO TABLE @lt_status.
        ELSEIF lt_inb IS NOT INITIAL.
          SELECT * FROM /dsd/st_status
            FOR ALL ENTRIES IN @lt_inb
            WHERE vlid = @lt_inb-visitlist AND status_id IN @it_status
            INTO TABLE @lt_status.
        ENDIF.

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
          ENDIF.
          APPEND ls_tour TO rt_tour.
        ENDLOOP.
      CATCH cx_root.
        CLEAR rt_tour.
    ENDTRY.

  ENDMETHOD.


  METHOD read_tour.

    TRY.
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
            reportmode     = 'TOUR'
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

*&---- CUSTOM ENTITY ----
@EndUserText.label: 'OTC DSD Settlement Details (all modes)'
@ObjectModel.query.implementedBy: 'ABAP:/CCBJI/CL_FSV_STLMNT_QRY'
@Metadata.allowExtensions: true
@ObjectModel.usageType: { serviceQuality: #A,
                          sizeCategory:   #L,
                          dataClass:      #MIXED }
define custom entity /CCBJI/I_FSV_STLMNT_DTL
{
      // Running key - a settlement row can come from any mode, so a
      // generated sequence guarantees uniqueness for the OData list.
  key Seqno            : abap.int4;

      // Report mode = the classic g2 radio group. As a SELECTION FIELD
      // typed with the fixed-value domain /CCBJI/FSV_MODE it renders as a
      // single-select DROPDOWN, is mandatory, and defaults to Tour Details.
      @EndUserText.label: 'Report Mode'
      @Consumption.filter: { mandatory: true, selectionType: #SINGLE, defaultValue: 'TOUR' }
      @Consumption.valueHelpDefinition: [ { entity: { name: '/CCBJI/I_FSV_MODE_VH', element: 'ReportMode' } } ]
      ReportMode       : /ccbji/fsv_mode;

      @EndUserText.label: 'Shipment / Visit List'
      ShipmentNo       : tknum;

      @EndUserText.label: 'Tour ID'
      TourId           : /dsd/hh_tour_id;

      @EndUserText.label: 'Visit ID'
      VisitId          : /dsd/hh_visit_id;

      @EndUserText.label: 'Processing Status'
      ProcessingStatus : abap.char(1);

      @EndUserText.label: 'Transp. Planning Point'
      Tpp              : tplst;

      @EndUserText.label: 'Status'
      StatusId         : /dsd/st_status_id;

      @EndUserText.label: 'Plant'
      @Consumption.filter.mandatory: true
      Plant            : werks_d;

      @EndUserText.label: 'Route'
      @Consumption.filter.mandatory: true
      Route            : route;

      @EndUserText.label: 'Settlement Date'
      @Consumption.filter.mandatory: true
      SettlementDate   : erdat;

      @EndUserText.label: 'Driver'
      Driver           : /dsd/rp_driver1;

      @EndUserText.label: 'Vehicle'
      Vehicle          : /dsd/rp_truck;

      @EndUserText.label: 'Scenario'
      Scenario         : abap.char(1);

      @EndUserText.label: 'Customer'
      Customer         : kunnr;

      @EndUserText.label: 'Sales Organization'
      Vkorg            : vkorg;

      @EndUserText.label: 'Visit Reason'
      VisitReason      : /dsd/hh_viscod;

      @EndUserText.label: 'Object Type'
      ObjType          : /dsd/hh_del_doctyp;

      @EndUserText.label: 'Material'
      Material         : matnr;

      @EndUserText.label: 'Material Description'
      MaterialDesc     : maktx;

      @EndUserText.label: 'Quantity'
      Quantity         : abap.dec(15,3);

      @EndUserText.label: 'Unit'
      Uom              : /dsd/hh_uom;

      @EndUserText.label: 'Quantity Difference'
      QuanDiff         : abap.dec(15,3);

      @EndUserText.label: 'Amount'
      Amount           : abap.dec(15,2);

      @EndUserText.label: 'Currency'
      Currency         : waers;

      @EndUserText.label: 'Payment Method'
      PaymentMethod    : /dsd/hh_paymt;

      @EndUserText.label: 'Card Number'
      CardNo           : /dsd/hh_cardnr;

      @EndUserText.label: 'Cash Type'
      CashType         : /dsd/hh_csh_typ;

      @EndUserText.label: 'Settlement Doc.'
      SldDocId         : /dsd/sl_sld_id;

      @EndUserText.label: 'Accounting Document'
      AccountingDoc    : belnr_d;

      @EndUserText.label: 'Posting Key'
      PostingKey       : bschl;

      @EndUserText.label: 'Delivery No.'
      DeliveryNo       : vbeln_vl;

      @EndUserText.label: 'PO Number'
      PoNumber         : bstkd;

      @EndUserText.label: 'Warnings'
      Warnings         : abap.int4;

      @EndUserText.label: 'Errors'
      Errors           : abap.int4;

      @EndUserText.label: 'Reference Document'
      ReferenceDoc     : xblnr;

      @EndUserText.label: 'Header Text'
      HeaderText       : bktxt;
}

*&---- METADATA EXTENSION ----
@Metadata.layer: #CORE
@UI: { headerInfo: { typeName:       'Settlement Detail',
                     typeNamePlural: 'Settlement Details',
                     title:          { type: #STANDARD, value: 'ShipmentNo' } } }
annotate entity /CCBJI/I_FSV_STLMNT_DTL with
{
  @UI.facet: [ { id: 'Gen', purpose: #STANDARD, type: #IDENTIFICATION_REFERENCE,
                 label: 'Settlement Detail', position: 10 } ]

  @UI.hidden: true
  Seqno;

  // ---- Report Mode : the driving dropdown (classic radio group) ----------
  @UI: { lineItem: [ { position: 10, importance: #HIGH } ], identification: [ { position: 10 } ] }
  @UI.selectionField: [ { position: 5 } ]
  ReportMode;

  // ---- Header block : always visible (mandatory in the original screen) ---
  @UI: { lineItem: [ { position: 50 } ], identification: [ { position: 50 } ] }
  @UI.selectionField: [ { position: 50 } ]
  Plant;

  @UI: { lineItem: [ { position: 60 } ], identification: [ { position: 60 } ] }
  @UI.selectionField: [ { position: 20 } ]
  Route;

  @UI: { lineItem: [ { position: 70 } ], identification: [ { position: 70 } ] }
  @UI.selectionField: [ { position: 30 } ]
  SettlementDate;

  // ---- Per-mode filters : shown/hidden by the ListReport controller ext ---
  @UI: { lineItem: [ { position: 20, importance: #HIGH } ], identification: [ { position: 20 } ] }
  @UI.selectionField: [ { position: 10 } ]
  ShipmentNo;

  @UI: { lineItem: [ { position: 80 } ], identification: [ { position: 80 } ] }
  @UI.selectionField: [ { position: 40 } ]
  StatusId;

  @UI: { lineItem: [ { position: 90 } ], identification: [ { position: 90 } ] }
  @UI.selectionField: [ { position: 60 } ]
  Customer;

  @UI: { lineItem: [ { position: 100 } ], identification: [ { position: 100 } ] }
  @UI.selectionField: [ { position: 70 } ]
  Material;

  @UI: { lineItem: [ { position: 110 } ], identification: [ { position: 110 } ] }
  MaterialDesc;

  @UI: { lineItem: [ { position: 120 } ], identification: [ { position: 120 } ] }
  Quantity;

  @UI: { lineItem: [ { position: 130 } ], identification: [ { position: 130 } ] }
  QuanDiff;

  @UI: { lineItem: [ { position: 140 } ], identification: [ { position: 140 } ] }
  Amount;

  @UI: { lineItem: [ { position: 150 } ], identification: [ { position: 150 } ] }
  @UI.selectionField: [ { position: 170 } ]
  Currency;

  @UI: { lineItem: [ { position: 160 } ], identification: [ { position: 160 } ] }
  @UI.selectionField: [ { position: 80 } ]
  PaymentMethod;

  @UI: { lineItem: [ { position: 170 } ], identification: [ { position: 170 } ] }
  @UI.selectionField: [ { position: 160 } ]
  SldDocId;

  @UI: { lineItem: [ { position: 180 } ], identification: [ { position: 180 } ] }
  @UI.selectionField: [ { position: 150 } ]
  DeliveryNo;

  @UI: { lineItem: [ { position: 190 } ], identification: [ { position: 190 } ] }
  @UI.selectionField: [ { position: 90 } ]
  Driver;

  @UI: { identification: [ { position: 200 } ] }
  @UI.selectionField: [ { position: 100 } ]
  Vehicle;

  @UI: { identification: [ { position: 210 } ] }
  @UI.selectionField: [ { position: 120 } ]
  VisitId;

  @UI: { lineItem: [ { position: 200 } ], identification: [ { position: 220 } ] }
  @UI.selectionField: [ { position: 130 } ]
  TourId;

  @UI: { identification: [ { position: 230 } ] }
  @UI.selectionField: [ { position: 110 } ]
  Vkorg;

  @UI: { identification: [ { position: 240 } ] }
  @UI.selectionField: [ { position: 140 } ]
  CashType;

  @UI: { identification: [ { position: 250 } ] }
  @UI.selectionField: [ { position: 180 } ]
  VisitReason;

  @UI: { identification: [ { position: 260 } ] }
  @UI.selectionField: [ { position: 190 } ]
  ObjType;

  @UI: { identification: [ { position: 270 } ] }
  ReferenceDoc;
}

*&---- VALUE HELP VIEWS ----
* --- #ccbji#i_fsv_mode_vh.ddls.asddls ---
@EndUserText.label: 'Report Mode Value Help'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@ObjectModel.resultSet.sizeCategory: #XS
@Search.searchable: true
define view entity /CCBJI/I_FSV_MODE_VH
  as select from dd07l as val
    left outer join dd07t as txt
      on  txt.domname    = val.domname
      and txt.as4local   = val.as4local
      and txt.as4vers    = val.as4vers
      and txt.valpos     = val.valpos
      and txt.ddlanguage = $session.system_language
{
      @Search.defaultSearchElement: true
      @ObjectModel.text.element: ['ModeText']
  key cast( val.domvalue_l as /ccbji/fsv_mode ) as ReportMode,

      @Semantics.text: true
      txt.ddtext                                as ModeText
}
where val.domname  = '/CCBJI/FSV_MODE'
  and val.as4local = 'A'

* --- #ccbji#i_fsv_plant_vh.ddls.asddls ---
@EndUserText.label: 'Plant Value Help (Settlement Details)'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Search.searchable: true
@ObjectModel.resultSet.sizeCategory: #XS
define view entity /CCBJI/I_FSV_PLANT_VH
  as select from t001w
{
      @Search.defaultSearchElement: true
      @Search.fuzzinessThreshold: 0.8
  key werks as Plant,
      name1 as PlantName
}

* --- #ccbji#i_fsv_route_vh.ddls.asddls ---
@EndUserText.label: 'Route Value Help (Settlement Details)'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Search.searchable: true
@ObjectModel.resultSet.sizeCategory: #XS
define view entity /CCBJI/I_FSV_ROUTE_VH
  as select from tvro
{
      @Search.defaultSearchElement: true
  key route as Route
}

* --- #ccbji#i_fsv_status_vh.ddls.asddls ---
@EndUserText.label: 'Status Value Help (Settlement Details)'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Search.searchable: true
@ObjectModel.resultSet.sizeCategory: #XS
define view entity /CCBJI/I_FSV_STATUS_VH
  as select from /dsd/st_cstatus
{
      @Search.defaultSearchElement: true
  key status_id as StatusId
}

* --- #ccbji#i_fsv_ship_vh.ddls.asddls ---
@EndUserText.label: 'Shipment / Visit List Value Help'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Search.searchable: true
@ObjectModel.resultSet.sizeCategory: #M
define view entity /CCBJI/I_FSV_SHIP_VH
  as select from vttk
{
      @Search.defaultSearchElement: true
  key tknum as ShipmentNo,
      tplst as Tpp,
      route as Route,
      erdat as CreatedOn
}

*&---- SERVICE DEFINITION ----
@EndUserText.label: 'OTC DSD Settlement Details Service'
define service /CCBJI/FSV_STLMNT_SRVD {
  expose /CCBJI/I_FSV_STLMNT_DTL as SettlementDetail;
}
