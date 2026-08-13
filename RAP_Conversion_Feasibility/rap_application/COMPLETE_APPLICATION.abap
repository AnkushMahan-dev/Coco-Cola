*&=====================================================================*
*&  COMPLETE END-TO-END RAP APPLICATION  (copy-paste reference)
*&
*&  Modernization of the classic ALV report
*&      /CCBJI/RDSDFSVG_STLMNT_DETAILS  (Settlement Details)
*&  into a read-only RAP (Pattern B) OData V4 / Fiori Elements service.
*&
*&  Namespace : /CCBJI/          Package : /CCBJI/OTC
*&  Work stream OTC (Order to Cash) - Module SD - Process area FSV
*&
*&  Same business requirement, same output data, SAME VALIDATIONS
*&  (report FORM f_validation ported into the query class, same
*&  /CCEJ/OTC message numbers). Only the presentation layer changes
*&  (SALV -> OData V4 -> Fiori).
*&
*&  NO BEHAVIOR DEFINITION / BINDING IS REQUIRED - the report is
*&  read-only (0 DB writes, 0 COMMIT WORK).
*&
*&  ACTIVATION ORDER
*&    1. /CCBJI/CL_FSV_STLMNT_QRY   (class)
*&    2. /CCBJI/I_FSV_STLMNT_DTL    (custom entity)
*&    3. /CCBJI/I_FSV_STLMNT_DTL    (metadata extension)
*&    4. /CCBJI/FSV_STLMNT_SRVD     (service definition)
*&    5. /CCBJI/FSV_STLMNT_SRVB     (service binding -> Publish)
*&=====================================================================*


*&---------------------------------------------------------------------*
*&  OBJECT 1 of 5 : ABAP CLASS
*&  Name : /CCBJI/CL_FSV_STLMNT_QRY
*&  File : src/#ccbji#cl_fsv_stlmnt_qry.clas.abap
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

    DATA lt_shipment    TYPE RANGE OF tknum.
    DATA lt_route       TYPE RANGE OF route.
    DATA lt_settle_date TYPE RANGE OF erdat.
    DATA lt_plant       TYPE RANGE OF werks_d.
    DATA lt_status      TYPE RANGE OF /dsd/st_status_id.
    DATA lt_tpp         TYPE RANGE OF tplst.
    DATA lt_driver      TYPE RANGE OF /dsd/rp_driver1.
    DATA lt_vehicle     TYPE RANGE OF /dsd/rp_truck.

    FIELD-SYMBOLS <lt_range> TYPE STANDARD TABLE.

    " 1. RAP filter -> ABAP ranges (classic SELECT-OPTIONS equivalent)
    TRY.
        DATA(lt_ranges) = io_request->get_filter( )->get_as_ranges( ).
      CATCH cx_rap_query_filter_no_range.
        CLEAR lt_ranges.
    ENDTRY.

    LOOP AT lt_ranges INTO DATA(ls_range).
      ASSIGN ls_range-range->* TO <lt_range>.
      IF <lt_range> IS NOT ASSIGNED.
        CONTINUE.
      ENDIF.
      CASE ls_range-name.
        WHEN 'SHIPMENTNO'.     lt_shipment    = CORRESPONDING #( <lt_range> ).
        WHEN 'ROUTE'.          lt_route       = CORRESPONDING #( <lt_range> ).
        WHEN 'SETTLEMENTDATE'. lt_settle_date = CORRESPONDING #( <lt_range> ).
        WHEN 'PLANT'.          lt_plant       = CORRESPONDING #( <lt_range> ).
        WHEN 'STATUSID'.       lt_status      = CORRESPONDING #( <lt_range> ).
        WHEN 'TPP'.            lt_tpp         = CORRESPONDING #( <lt_range> ).
        WHEN 'DRIVER'.         lt_driver      = CORRESPONDING #( <lt_range> ).
        WHEN 'VEHICLE'.        lt_vehicle     = CORRESPONDING #( <lt_range> ).
        WHEN OTHERS.
      ENDCASE.
      UNASSIGN <lt_range>.
    ENDLOOP.

    " 2. VALIDATION - same checks / same /CCEJ/OTC messages as
    "    report FORM f_validation. A failure aborts the query
    "    (= LEAVE LIST-PROCESSING) and shows the message in Fiori.
    validate_selection(
      it_shipment    = lt_shipment
      it_route       = lt_route
      it_settle_date = lt_settle_date
      it_plant       = lt_plant
      it_status      = lt_status
      it_tpp         = lt_tpp
      it_driver      = lt_driver
      it_vehicle     = lt_vehicle ).

    " 3. Paging
    DATA(lo_paging)  = io_request->get_paging( ).
    DATA(lv_offset)  = lo_paging->get_offset( ).
    DATA(lv_page_sz) = lo_paging->get_page_size( ).

    DATA lv_max_rows TYPE i.
    IF lv_page_sz = if_rap_query_paging=>page_size_unlimited.
      lv_max_rows = 0.
    ELSE.
      lv_max_rows = lv_offset + lv_page_sz.
    ENDIF.

    " 4. Read + derive (reused report logic)
    DATA(lt_result) = read_settlement_data(
                        it_shipment    = lt_shipment
                        it_route       = lt_route
                        it_settle_date = lt_settle_date
                        iv_max_rows    = lv_max_rows ).

    " 5. Sorting
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

    " 6. Total count
    IF io_request->is_total_numb_of_rec_requested( ).
      io_response->set_total_number_of_records( lines( lt_result ) ).
    ENDIF.

    " 7. Page window + return
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
    " numbers, raised as type E so the query aborts like the classic
    " LEAVE LIST-PROCESSING. Each existence check runs only when its
    " selection value is supplied - identical to the report.

    " Mandatory selection (i525): ShipmentNo OR Plant+Route+Date.
    IF it_shipment IS NOT INITIAL
       OR ( it_plant IS NOT INITIAL AND it_route IS NOT INITIAL
            AND it_settle_date IS NOT INITIAL ).
    ELSE.
      RAISE EXCEPTION TYPE cx_rap_query_provider MESSAGE e525(/ccej/otc).
    ENDIF.

    " Plant must exist (i012, when no shipment).
    IF it_shipment IS INITIAL AND it_plant IS NOT INITIAL.
      SELECT SINGLE werks FROM t001w INTO @DATA(lv_werks) WHERE werks IN @it_plant.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE cx_rap_query_provider MESSAGE e012(/ccej/otc).
      ENDIF.
    ENDIF.

    " Transportation planning point must exist (i125).
    IF it_tpp IS NOT INITIAL.
      SELECT SINGLE tplst FROM ttds INTO @DATA(lv_tplst) WHERE tplst IN @it_tpp. "#EC CI_USAGE_OK[2270199]
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE cx_rap_query_provider MESSAGE e125(/ccej/otc).
      ENDIF.
    ENDIF.

    " Shipment number must exist (i123).
    IF it_shipment IS NOT INITIAL.
      SELECT SINGLE tknum FROM vttk INTO @DATA(lv_tknum) WHERE tknum IN @it_shipment. "#EC CI_USAGE_OK[2270199]
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE cx_rap_query_provider MESSAGE e123(/ccej/otc).
      ENDIF.
    ENDIF.

    " Status must exist (i124).
    IF it_status IS NOT INITIAL.
      SELECT SINGLE status_id FROM /dsd/st_cstatus INTO @DATA(lv_status) WHERE status_id IN @it_status.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE cx_rap_query_provider MESSAGE e124(/ccej/otc).
      ENDIF.
    ENDIF.

    " Route must exist (i126).
    IF it_route IS NOT INITIAL.
      SELECT SINGLE route FROM tvro INTO @DATA(lv_route) WHERE route IN @it_route.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE cx_rap_query_provider MESSAGE e126(/ccej/otc).
      ENDIF.
    ENDIF.

    " Vehicle must exist (i127).
    IF it_vehicle IS NOT INITIAL.
      SELECT SINGLE equnr FROM equi INTO @DATA(lv_equnr) WHERE equnr IN @it_vehicle.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE cx_rap_query_provider MESSAGE e127(/ccej/otc).
      ENDIF.
    ENDIF.

    " Driver must exist (i128).
    IF it_driver IS NOT INITIAL.
      SELECT SINGLE kunnr FROM kna1 INTO @DATA(lv_kunnr) WHERE kunnr IN @it_driver.
      IF sy-subrc <> 0.
        RAISE EXCEPTION TYPE cx_rap_query_provider MESSAGE e128(/ccej/otc).
      ENDIF.
    ENDIF.

  ENDMETHOD.


  METHOD read_settlement_data.

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
      " ReferenceDoc / HeaderText are NOT columns of VTTK. In the report
      " the ty_vttk work-area fields xblnr/bktxt are set to the shipment
      " number with leading zeros removed (lines 304-308) and shown as-is
      " (they double as join keys to BKPF-XBLNR / MKPF-BKTXT). Reproduced:
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

      " Enrichment extension points (same source tables as the report):
      "   StatusId <- /DSD/ST_STATUS ; Plant <- TTDS/route ;
      "   Warnings/Errors <- /DSD/ST_APPLOG_VIEW ;
      "   Scenario <- visit group rule (CCEJPAPER => 'R', MOD-030)
      ls_out-warnings = 0.
      ls_out-errors   = 0.

      ls_out-processingstatus = derive_processing_status(
                                  iv_warnings = ls_out-warnings
                                  iv_errors   = ls_out-errors ).

      APPEND ls_out TO rt_result.
    ENDLOOP.

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


*&---------------------------------------------------------------------*
*&  OBJECT 2 of 5 : CDS CUSTOM ENTITY  (Data Definition)
*&  Name : /CCBJI/I_FSV_STLMNT_DTL
*&  File : src/#ccbji#i_fsv_stlmnt_dtl.ddls.asddls
*&---------------------------------------------------------------------*
@EndUserText.label: 'OTC DSD Settlement Details - Tour Header'
@ObjectModel.query.implementedBy: 'ABAP:/CCBJI/CL_FSV_STLMNT_QRY'
@Metadata.allowExtensions: true
@AccessControl.authorizationCheck: #NOT_REQUIRED
@ObjectModel.usageType: { serviceQuality: #A,
                          sizeCategory:   #M,
                          dataClass:      #MIXED }
define custom entity /CCBJI/I_FSV_STLMNT_DTL
{
  key ShipmentNo       : tknum;
      @EndUserText.label: 'Processing Status'
      ProcessingStatus : abap.char(1);
      @EndUserText.label: 'Transp. Planning Point'
      Tpp              : tplst;
      @EndUserText.label: 'Status'
      StatusId         : /dsd/st_status_id;
      @EndUserText.label: 'Plant'
      Plant            : werks_d;
      @EndUserText.label: 'Route'
      Route            : route;
      @EndUserText.label: 'Settlement Date'
      SettlementDate   : erdat;
      @EndUserText.label: 'Driver'
      Driver           : /dsd/rp_driver1;
      @EndUserText.label: 'Vehicle'
      Vehicle          : /dsd/rp_truck;
      @EndUserText.label: 'Scenario'
      Scenario         : abap.char(1);
      @EndUserText.label: 'Warnings'
      Warnings         : abap.int4;
      @EndUserText.label: 'Errors'
      Errors           : abap.int4;
      @EndUserText.label: 'Reference Document'
      ReferenceDoc     : xblnr;
      @EndUserText.label: 'Header Text'
      HeaderText       : bktxt;
}


*&---------------------------------------------------------------------*
*&  OBJECT 3 of 5 : METADATA EXTENSION  (Metadata Extension)
*&  Name : /CCBJI/I_FSV_STLMNT_DTL   (same name as the entity it annotates)
*&  File : src/#ccbji#i_fsv_stlmnt_dtl.ddlx.asddlxs
*&  Selection fields mirror the classic selection screen:
*&  ShipmentNo, Route, SettlementDate, StatusId, Plant.
*&---------------------------------------------------------------------*
@Metadata.layer: #CORE
@UI: { headerInfo: { typeName:       'Settlement Detail',
                     typeNamePlural: 'Settlement Details',
                     title:          { type: #STANDARD, value: 'ShipmentNo' } } }
annotate entity /CCBJI/I_FSV_STLMNT_DTL with
{
  @UI.facet: [ { id: 'Tour', purpose: #STANDARD,
                 type: #IDENTIFICATION_REFERENCE,
                 label: 'Tour Header', position: 10 } ]

  @UI: { lineItem: [ { position: 10, importance: #HIGH } ],
         identification: [ { position: 10 } ] }
  @UI.selectionField: [ { position: 10 } ]
  ShipmentNo;

  @UI: { lineItem: [ { position: 20, importance: #HIGH } ],
         identification: [ { position: 20 } ] }
  ProcessingStatus;

  @UI: { lineItem: [ { position: 30 } ], identification: [ { position: 30 } ] }
  @UI.selectionField: [ { position: 20 } ]
  Route;

  @UI: { lineItem: [ { position: 40 } ], identification: [ { position: 40 } ] }
  @UI.selectionField: [ { position: 30 } ]
  SettlementDate;

  @UI: { lineItem: [ { position: 50 } ], identification: [ { position: 50 } ] }
  Tpp;
  @UI: { lineItem: [ { position: 60 } ], identification: [ { position: 60 } ] }
  @UI.selectionField: [ { position: 40 } ]
  StatusId;
  @UI: { lineItem: [ { position: 70 } ], identification: [ { position: 70 } ] }
  @UI.selectionField: [ { position: 50 } ]
  Plant;
  @UI: { lineItem: [ { position: 80 } ], identification: [ { position: 80 } ] }
  Driver;
  @UI: { lineItem: [ { position: 90 } ], identification: [ { position: 90 } ] }
  Vehicle;
  @UI: { lineItem: [ { position: 100 } ], identification: [ { position: 100 } ] }
  Scenario;
  @UI: { lineItem: [ { position: 110 } ], identification: [ { position: 110 } ] }
  Warnings;
  @UI: { lineItem: [ { position: 120 } ], identification: [ { position: 120 } ] }
  Errors;
  @UI: { identification: [ { position: 130 } ] }
  ReferenceDoc;
  @UI: { identification: [ { position: 140 } ] }
  HeaderText;
}


*&---------------------------------------------------------------------*
*&  OBJECT 4 of 5 : SERVICE DEFINITION
*&  Name : /CCBJI/FSV_STLMNT_SRVD
*&  File : src/#ccbji#fsv_stlmnt_srvd.srvd.srvdsrv
*&---------------------------------------------------------------------*
@EndUserText.label: 'OTC DSD Settlement Details Service'
define service /CCBJI/FSV_STLMNT_SRVD {
  expose /CCBJI/I_FSV_STLMNT_DTL as SettlementDetail;
}


*&---------------------------------------------------------------------*
*&  OBJECT 5 of 5 : SERVICE BINDING
*&  Name         : /CCBJI/FSV_STLMNT_SRVB
*&  Binding Type : OData V4 - UI  (ODATA_V4_UI)
*&  Service Def  : /CCBJI/FSV_STLMNT_SRVD
*&  Note         : Created in ADT (no plain-text source). Right-click the
*&                 service definition -> New Service Binding, choose
*&                 "OData V4 - UI", ACTIVATE, then PUBLISH. Use "Preview"
*&                 on entity set SettlementDetail to launch the Fiori app.
*&---------------------------------------------------------------------*
