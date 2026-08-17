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

      // NO value help - the user types the Visit List (a /DSD/ST_STATUS-VLID)
      // which is NOT a VTTK shipment, so a value help would wrongly reject it.
      // Free text: any value is accepted.
      @EndUserText.label: 'Shipment / Visit List'
      ShipmentNo       : tknum;

      // Plain character type on purpose: the data element /dsd/hh_tour_id
      // maps to Edm.Guid in OData V4, which fails to serialize the numeric
      // tour id (e.g. 209162643559 -> "not a valid UUID"). Same for Visit ID.
      @EndUserText.label: 'Tour ID'
      TourId           : abap.char(20);

      @EndUserText.label: 'Visit ID'
      VisitId          : abap.char(20);

      @EndUserText.label: 'Processing Status'
      ProcessingStatus : abap.char(1);

      @EndUserText.label: 'Transp. Planning Point'
      Tpp              : tplst;

      // NO value help - the status list did not contain the actual data
      // values. Free text: type any status.
      @EndUserText.label: 'Status'
      StatusId         : /dsd/st_status_id;

      // NO value help - the plant list (T001W) did not contain the DSD
      // plant JW64 that the data actually uses, so it could not be selected.
      // Free text: type any plant (e.g. JW64). Not mandatory.
      @EndUserText.label: 'Plant'
      Plant            : werks_d;

      // NO value help - route values differ in format (2501 vs 002501) from
      // the check table, so a value help would reject valid input. Free text.
      @EndUserText.label: 'Route'
      Route            : route;

      // #INTERVAL renders a Fiori calendar date-range picker (from - to),
      // instead of the frustrating multi-value "conditions" input.
      // Filters VTTK created date (erdat) exactly like the classic report.
      @EndUserText.label: 'Settlement Date'
      @Consumption.filter: { selectionType: #INTERVAL }
      SettlementDate   : erdat;

      @EndUserText.label: 'Driver'
      Driver           : /dsd/rp_driver1;

      @EndUserText.label: 'Co-Driver'
      CoDriver         : /dsd/rp_driver1;

      @EndUserText.label: 'Vehicle'
      Vehicle          : /dsd/rp_truck;

      @EndUserText.label: 'Scenario'
      Scenario         : abap.char(1);

      @EndUserText.label: 'Driver Swap'
      DriverSwap       : abap.char(1);

      @EndUserText.label: 'Visit Group'
      VisitGroup       : /dsd/vc_authority;

      @EndUserText.label: 'IDoc No.'
      IDocNo           : edi_docnum;

      @EndUserText.label: 'Created On'
      CreatedOn        : abap.dats;

      @EndUserText.label: 'Created Time'
      CreatedTime      : abap.tims;

      @EndUserText.label: 'Created By'
      CreatedBy        : abap.char(12);

      @EndUserText.label: 'Changed On'
      ChangedOn        : abap.dats;

      @EndUserText.label: 'Changed At'
      ChangedTime      : abap.tims;

      @EndUserText.label: 'Changed By'
      ChangedBy        : abap.char(12);

      // Exception traffic light as a Fiori criticality (0 gray / 1 red /
      // 2 yellow / 3 green). Referenced by ProcessingStatus criticality.
      @EndUserText.label: 'Exception'
      Light            : abap.int1;

      @EndUserText.label: 'Customer'
      Customer         : kunnr;

      @EndUserText.label: 'Sales Organization'
      Vkorg            : vkorg;

      @EndUserText.label: 'Visit Reason'
      VisitReason      : /dsd/hh_viscod;

      @EndUserText.label: 'Distribution Channel'
      DistChannel      : vtweg;

      @EndUserText.label: 'Division'
      Division         : spart;

      @EndUserText.label: 'Account Group'
      AccountGroup     : ktokd;

      @EndUserText.label: 'Business Type'
      BusinessType     : katr4;

      @EndUserText.label: 'Equipment Owner'
      EquipOwner       : /scl/mdmd_equp_own;

      @EndUserText.label: 'Processing Indicator'
      ManProc          : /dsd/de_man_proc;

      @EndUserText.label: 'Visit Log Status'
      VisitLog         : /ccej/sls_vlog_status;

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
