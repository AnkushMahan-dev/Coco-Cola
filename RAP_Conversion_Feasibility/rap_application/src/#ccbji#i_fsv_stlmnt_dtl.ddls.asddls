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
      @Consumption.valueHelpDefinition: [ { entity: { name: '/CCBJI/I_FSV_SHIP_VH', element: 'ShipmentNo' } } ]
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
      @Consumption.valueHelpDefinition: [ { entity: { name: '/CCBJI/I_FSV_STATUS_VH', element: 'StatusId' } } ]
      StatusId         : /dsd/st_status_id;

      @EndUserText.label: 'Plant'
      @Consumption.valueHelpDefinition: [ { entity: { name: '/CCBJI/I_FSV_PLANT_VH', element: 'Plant' } } ]
      @Consumption.filter.mandatory: true
      Plant            : werks_d;

      @EndUserText.label: 'Route'
      @Consumption.valueHelpDefinition: [ { entity: { name: '/CCBJI/I_FSV_ROUTE_VH', element: 'Route' } } ]
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
