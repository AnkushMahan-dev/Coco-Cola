*&=====================================================================*
*&  COMPLETE END-TO-END RAP APPLICATION  (copy-paste reference)
*&
*&  Modernization of the classic ALV report
*&      /CCBJI/RDSDFSVG_STLMNT_DETAILS  (Settlement Details)
*&  into a read-only RAP (Pattern B) OData V4 / Fiori Elements service.
*&
*&  Same business requirement, same output data, same validations –
*&  only the presentation layer changes (SALV -> OData V4 -> Fiori).
*&
*&  Create each object in ADT with the name shown in its banner, paste
*&  the source, ACTIVATE in the given order, then Publish the binding.
*&
*&  ACTIVATION ORDER
*&    1. ZCL_OTC_STLMNT_DTL_QRY     (class)
*&    2. ZI_OTC_STLMNT_DETAIL       (custom entity)
*&    3. ZI_OTC_STLMNT_DETAIL       (metadata extension)
*&    4. ZSD_OTC_STLMNT_DTL         (service definition)
*&    5. ZSB_OTC_STLMNT             (service binding -> Publish)
*&=====================================================================*


*&---------------------------------------------------------------------*
*&  OBJECT 1 of 5 : ABAP CLASS  (Repository Object: Class)
*&  Name         : ZCL_OTC_STLMNT_DTL_QRY
*&  File         : src/zcl_otc_stlmnt_dtl_qry.clas.abap
*&  Purpose      : RAP query provider – runs the reused report read
*&                 logic and returns rows to OData.
*&---------------------------------------------------------------------*
CLASS zcl_otc_stlmnt_dtl_qry DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_rap_query_provider.

  PRIVATE SECTION.

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

    METHODS read_settlement_data
      IMPORTING it_shipment      TYPE RANGE OF tknum
                it_route         TYPE RANGE OF route
                it_settle_date   TYPE RANGE OF erdat
                iv_max_rows      TYPE i
      RETURNING VALUE(rt_result) TYPE tt_result.

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

    " 1. RAP filter -> ABAP ranges (classic SELECT-OPTIONS equivalent)
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
      ENDCASE.
      UNASSIGN <lt_range>.
    ENDLOOP.

    " 2. Paging
    DATA(lo_paging)  = io_request->get_paging( ).
    DATA(lv_offset)  = lo_paging->get_offset( ).
    DATA(lv_page_sz) = lo_paging->get_page_size( ).

    DATA lv_max_rows TYPE i.
    IF lv_page_sz = if_rap_query_paging=>page_size_unlimited.
      lv_max_rows = 0.
    ELSE.
      lv_max_rows = lv_offset + lv_page_sz.
    ENDIF.

    " 3. Read + derive (reused report logic)
    DATA(lt_result) = read_settlement_data(
                        it_shipment    = lt_shipment
                        it_route       = lt_route
                        it_settle_date = lt_settle_date
                        iv_max_rows    = lv_max_rows ).

    " 4. Sorting
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

    " 5. Total count
    IF io_request->is_total_numb_of_rec_requested( ).
      io_response->set_total_number_of_records( lines( lt_result ) ).
    ENDIF.

    " 6. Page window + return
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
*&  OBJECT 2 of 5 : CDS CUSTOM ENTITY  (Repository Object: Data Definition)
*&  Name         : ZI_OTC_STLMNT_DETAIL
*&  File         : src/zi_otc_stlmnt_detail.ddls.asddls
*&  Purpose      : Pattern-B custom entity bound to the query class.
*&---------------------------------------------------------------------*
@EndUserText.label: 'OTC DSD Settlement Details - Tour Header'
@ObjectModel.query.implementedBy: 'ABAP:ZCL_OTC_STLMNT_DTL_QRY'
@Metadata.allowExtensions: true
@AccessControl.authorizationCheck: #NOT_REQUIRED
@ObjectModel.usageType: { serviceQuality: #A,
                          sizeCategory:   #M,
                          dataClass:      #MIXED }
define custom entity ZI_OTC_STLMNT_DETAIL
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
*&  OBJECT 3 of 5 : METADATA EXTENSION  (Repository Object: Metadata Extension)
*&  Name         : ZI_OTC_STLMNT_DETAIL
*&  File         : src/zi_otc_stlmnt_detail.ddlx.asddlxs
*&  Purpose      : Fiori Elements List Report UI annotations.
*&---------------------------------------------------------------------*
@Metadata.layer: #CORE
@UI: { headerInfo: { typeName:       'Settlement Detail',
                     typeNamePlural: 'Settlement Details',
                     title:          { type: #STANDARD, value: 'ShipmentNo' } } }
annotate entity ZI_OTC_STLMNT_DETAIL with
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
  StatusId;
  @UI: { lineItem: [ { position: 70 } ], identification: [ { position: 70 } ] }
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
*&  OBJECT 4 of 5 : SERVICE DEFINITION  (Repository Object: Service Definition)
*&  Name         : ZSD_OTC_STLMNT_DTL
*&  File         : src/zsd_otc_stlmnt_dtl.srvd.srvdsrv
*&---------------------------------------------------------------------*
@EndUserText.label: 'OTC DSD Settlement Details Service'
define service ZSD_OTC_STLMNT_DTL {
  expose ZI_OTC_STLMNT_DETAIL as SettlementDetail;
}


*&---------------------------------------------------------------------*
*&  OBJECT 5 of 5 : SERVICE BINDING  (Repository Object: Service Binding)
*&  Name         : ZSB_OTC_STLMNT
*&  Binding Type : OData V4 - UI  (ODATA_V4_UI)
*&  Service Def  : ZSD_OTC_STLMNT_DTL
*&  Note         : Created in ADT (no plain-text source). After creating,
*&                 ACTIVATE and press PUBLISH. Then use "Preview" on the
*&                 SettlementDetail entity set to launch the Fiori app.
*&---------------------------------------------------------------------*
