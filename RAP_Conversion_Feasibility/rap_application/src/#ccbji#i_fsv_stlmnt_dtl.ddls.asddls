@EndUserText.label: 'OTC DSD Settlement Details (all modes)'
@ObjectModel.query.implementedBy: 'ABAP:/CCBJI/CL_FSV_STLMNT_QRY'
@Metadata.allowExtensions: true
@ObjectModel.usageType: { serviceQuality: #A,
                          sizeCategory:   #L,
                          dataClass:      #MIXED }
define custom entity /CCBJI/I_FSV_STLMNT_DTL
{
      // Content-based key: mode(4) + tour(32) + natural keys. Stable and
      // reconstructable, so the Object Page can read a single row by key
      // (a running number could not be reproduced on the by-key read).
  key RowKey            : abap.char(120);

      // Running row number (display only, no longer the key).
      Seqno            : abap.int4;

      // Report mode = the classic g2 radio group. As a SELECTION FIELD
      // typed with the fixed-value domain /CCBJI/FSV_MODE it renders as a
      // single-select DROPDOWN, is mandatory, and defaults to Tour Details.
      // NO value help annotation: the data element's domain /CCBJI/FSV_MODE has
      // fixed values (TOUR/VISI/SLRP/PAYT/CHCK/MONY/QUAN/FSRD/CASH), so Fiori
      // Elements renders this SINGLE-select mandatory filter as a real DROPDOWN
      // (showing the value texts) instead of an F4 value-help input.
      @EndUserText.label: 'Report Mode'
      @Consumption.filter: { mandatory: true, selectionType: #SINGLE, defaultValue: 'TOUR' }
      ReportMode       : /ccbji/fsv_mode;

      // NO value help - a value help over the Visit List (/DSD/ST_STATUS is a
      // very large table) made the F4 dialog extremely slow. Free text instead:
      // type the Visit List with or without leading zeros; the backend matches
      // both. (Plant / Route / Status keep their value helps - small, fast tables.)
      @EndUserText.label: 'Shipment / Visit List'
      ShipmentNo       : tknum;

      // Plain char(32): matches /dsd/hh_tour_id length (CHAR 32) but avoids its
      // /DSD/HH_GUID domain which OData V4 maps to Edm.Guid (fails on the
      // numeric tour id 209162643559 -> "not a valid UUID").
      @EndUserText.label: 'Tour ID'
      TourId           : abap.char(32);

      // /dsd/hh_visit_id is NUMC 6.
      @EndUserText.label: 'Visit ID'
      VisitId          : abap.numc(6);

      // /dsd/hh_recstat / procstat are CHAR 2.
      @EndUserText.label: 'Processing Status'
      ProcessingStatus : abap.char(2);

      @EndUserText.label: 'Transp. Planning Point'
      Tpp              : tplst;

      // Value help = /DSD/ST_CSTATUS status codes. Plain (non-fixed) list, so a
      // status not in the list is still accepted. (The earlier blank 'Status'
      // header was NOT caused by this value help - it was the mode column-hide
      // using Column.setVisible, which only half-hides MDC columns. That is now
      // fixed via StateUtil.applyExternalState in the ListReport controller, so
      // the value help is safely restored and the Status filter keeps its F4.)
      @EndUserText.label: 'Status'
      @Consumption.valueHelpDefinition: [ { entity: { name: '/CCBJI/I_FSV_STATUS_VH', element: 'StatusId' } } ]
      StatusId         : /dsd/st_status_id;

      // Value help = plants from T001W (includes DSD plants such as JW64).
      // Plain (non-fixed) list, so any plant typed is still accepted.
      @EndUserText.label: 'Plant'
      @Consumption.valueHelpDefinition: [ { entity: { name: '/CCBJI/I_FSV_PLANT_VH', element: 'Plant' } } ]
      Plant            : werks_d;

      // Value help = routes from TVRO shown WITHOUT leading zeros (2501, not
      // 002501). Plain (non-fixed) list; the backend normalizes leading zeros
      // so both 2501 and 002501 resolve, and a route not in the list is accepted.
      @EndUserText.label: 'Route'
      @Consumption.valueHelpDefinition: [ { entity: { name: '/CCBJI/I_FSV_ROUTE_VH', element: 'Route' } } ]
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

      // Readable Exception text (OK / Warning / Error), coloured in the UI by
      // the Light criticality - the classic Tour "Exception" traffic-light column.
      @EndUserText.label: 'Exception'
      ExceptionText    : abap.char(10);

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

      @EndUserText.label: 'Attrib. 4'
      BusinessType     : katr4;

      // Same KATR4 value, but Route Summary labels it 'Business Type Extension'
      // (classic f_set_columns4), so it is exposed as a separate column there.
      @EndUserText.label: 'Business Type Extension'
      BizTypeExt       : katr4;

      // Plain character types: the original data elements (/scl/mdmd_equp_own,
      // /dsd/de_man_proc, /ccej/sls_vlog_status) break OData V4 $metadata
      // compilation. Char maps cleanly to Edm.String.
      // /scl/mdmd_equp_own is CHAR 2.
      @EndUserText.label: 'Equipment Owner'
      EquipOwner       : abap.char(2);

      @EndUserText.label: 'Manually Processed'
      ManProc          : abap.char(1);

      @EndUserText.label: 'Visit Log Status'
      VisitLog         : abap.char(1);

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

      @EndUserText.label: 'HHT Document No.'
      PoNumber         : bstkd;

      @EndUserText.label: 'Warnings'
      Warnings         : abap.int4;

      @EndUserText.label: 'Errors'
      Errors           : abap.int4;

      @EndUserText.label: 'Reference Document'
      ReferenceDoc     : xblnr;

      @EndUserText.label: 'Header Text'
      HeaderText       : bktxt;

      // ---- Option B: exact per-mode columns from the classic report --------
      // Sales / Replenishment (classic ty_final1)
      @EndUserText.label: 'Delivery Item'
      DeliveryItem     : abap.char(6);

      @EndUserText.label: 'PO Date'
      PoDate           : abap.dats;

      @EndUserText.label: 'Transaction Code'
      TaCode           : abap.char(4);

      @EndUserText.label: 'Reason'
      Reason           : abap.char(4);

      // Same 'reason' value, but Check-Out/In and Money Difference label it
      // 'Reason Code' (Sales/Replenishment keeps 'Removal Indicator' on Reason).
      @EndUserText.label: 'Reason Code'
      ReasonCode       : abap.char(4);

      @EndUserText.label: 'Batch'
      Batch            : abap.char(10);

      @EndUserText.label: 'Condition Type'
      CondType         : abap.char(4);

      @EndUserText.label: 'Original Quantity'
      OrigQty          : abap.dec(15, 3);

      // Sales - extra classic columns. Package group (MARA-/SCL/PKGGROUP),
      // Money type + Set ID sliced out of /SCL/ORIG_QTY, and the derived
      // Sales amount (quantity * amount for Visit-List objects).
      @EndUserText.label: 'Package Group'
      PackageGroup     : abap.char(4);

      @EndUserText.label: 'Money Type'
      MoneyType        : abap.char(2);

      @EndUserText.label: 'Set ID'
      SetId            : abap.char(3);

      @EndUserText.label: 'Money Code'
      MoneyCode        : abap.char(4);

      @EndUserText.label: 'Sales Amount'
      SalesAmt         : abap.dec(15, 2);

      // Customer attribute 3 (KNA1-KATR3), classic Sales "Attr. 3" column.
      @EndUserText.label: 'Attr. 3'
      Attr3            : abap.char(4);

      // Check Out/In (classic ty_final3)
      @EndUserText.label: 'Check ID'
      CheckId          : abap.char(12);

      @EndUserText.label: 'Item No.'
      ItemNo           : abap.char(6);

      @EndUserText.label: 'Target Quantity'
      QuanPlan         : abap.dec(15, 3);

      @EndUserText.label: 'Counted Quantity'
      QuanCount        : abap.dec(15, 3);

      // Payment (classic ty_final2)
      @EndUserText.label: 'Cash ID'
      CashId           : abap.char(20);

      @EndUserText.label: 'Payment Description'
      PaymentDescr     : abap.char(20);

      @EndUserText.label: 'Check Number'
      CheckNo          : abap.char(13);

      @EndUserText.label: 'Fiscal Year'
      FiscYear         : abap.numc(4);

      @EndUserText.label: 'Company Code'
      CompCode         : abap.char(4);

      // Payment FI posting detail (from CDS I_OperationalAcctgDocItem + BKPF)
      @EndUserText.label: 'Posting Item'
      PostingItem      : abap.numc(3);

      @EndUserText.label: 'Posting Amount'
      PostingAmount    : abap.dec(15, 2);

      @EndUserText.label: 'Posting Currency'
      PostingCurrency  : abap.char(5);

      @EndUserText.label: 'Posting Date'
      PostingDate      : abap.dats;

      @EndUserText.label: 'Document Date'
      DocumentDate     : abap.dats;

      @EndUserText.label: 'Document Type'
      DocType          : abap.char(2);

      @EndUserText.label: 'Reversal Document'
      ReversalDoc      : abap.char(10);

      // Money difference (classic ty_final4)
      @EndUserText.label: 'Amount Check-Out'
      AmountCo         : abap.dec(15, 2);

      @EndUserText.label: 'Amount Expenses'
      AmountExpenses   : abap.dec(15, 2);

      @EndUserText.label: 'Amount Earnings'
      AmountEarnings   : abap.dec(15, 2);

      @EndUserText.label: 'Amount Check-In'
      AmountCi         : abap.dec(15, 2);

      @EndUserText.label: 'Amount Planned'
      AmountPlan       : abap.dec(15, 2);

      // Money difference amount (classic amount_diff, column 'Difference').
      @EndUserText.label: 'Difference Amount'
      AmountDiff       : abap.dec(15, 2);

      // Money difference In/Out evaluation (classic amount_diff_eval,
      // column label 'Mon. Diff. In/Out').
      @EndUserText.label: 'Mon. Diff. In/Out'
      AmountDiffEval   : abap.dec(15, 2);

      // Quantity difference (classic ty_final5)
      @EndUserText.label: 'Quantity Check-Out'
      QuanCheckout     : abap.dec(15, 3);

      @EndUserText.label: 'Quantity Delivered'
      QuanDelivered    : abap.dec(15, 3);

      @EndUserText.label: 'Quantity Returned'
      QuanReturn       : abap.dec(15, 3);

      @EndUserText.label: 'Quantity Check-In'
      QuanCheckin      : abap.dec(15, 3);

      @EndUserText.label: 'Quantity Final Diff.'
      QuanFinalDiff    : abap.dec(15, 3);

      @EndUserText.label: 'Value Final Diff.'
      ValueFinDiff     : abap.dec(15, 2);

      // ---- FSR Documents : full document chain (classic f_get_shipment_data)
      @EndUserText.label: 'Sales Document'
      SalesDoc         : abap.char(10);

      @EndUserText.label: 'Sales Doc. Type'
      SalesDocType     : abap.char(4);

      @EndUserText.label: 'Order Date'
      OrderDate        : abap.dats;

      @EndUserText.label: 'Delivery Type'
      DeliveryType     : abap.char(4);

      @EndUserText.label: 'Delivery Date'
      DeliveryDate     : abap.dats;

      @EndUserText.label: 'Material Document'
      MaterialDoc      : abap.char(10);

      @EndUserText.label: 'Billing Type'
      BillingType      : abap.char(4);

      @EndUserText.label: 'Invoice'
      InvoiceNo        : abap.char(10);

      @EndUserText.label: 'Invoice Date'
      InvoiceDate      : abap.dats;

      // FSR - reference key + intercompany invoice / FI (classic MOD-014/029)
      @EndUserText.label: 'Reference Key'
      RefKey           : abap.char(20);

      @EndUserText.label: 'Intercompany Invoice'
      ComInv           : abap.char(10);

      @EndUserText.label: 'Intercomp. Invoice Type'
      ComInvType       : abap.char(4);

      @EndUserText.label: 'Intercomp. Invoice Date'
      ComInvDate       : abap.dats;

      @EndUserText.label: 'Intercompany FI Document'
      ComFiDoc         : abap.char(10);

      @EndUserText.label: 'Intercompany FI Type'
      ComFiType        : abap.char(4);

      @EndUserText.label: 'Intercompany FI Date'
      ComFiDate        : abap.dats;

      // ---- Route Summary (CASH) : full classic f_set_columns4 figures -------
      @EndUserText.label: 'Summary Status'
      SummaryStatus    : abap.char(20);

      @EndUserText.label: 'Payment difference status'
      PaymentDiffStatus : abap.char(20);

      @EndUserText.label: 'Trading Division'
      TradingDiv       : abap.char(4);

      @EndUserText.label: 'Visit Type'
      VisitType        : abap.char(4);

      @EndUserText.label: 'Employee ID'
      EmpId            : abap.char(20);

      @EndUserText.label: 'Promotion Amount'
      PromoAmt         : abap.dec(15, 2);

      @EndUserText.label: 'Aggregated Free Amount'
      AggFreeAmt       : abap.dec(15, 2);

      @EndUserText.label: 'Free Vend Amount'
      FreeVendAmt      : abap.dec(15, 2);

      @EndUserText.label: 'Aggregated Sample Qty'
      AggSampleQty     : abap.dec(15, 3);

      @EndUserText.label: 'Sample Amount'
      SampleAmount     : abap.dec(15, 2);

      @EndUserText.label: 'Net Amount'
      NetAmt           : abap.dec(15, 2);

      @EndUserText.label: 'Cash Collected'
      CashCollected    : abap.dec(15, 2);

      @EndUserText.label: 'Recharge'
      Recharge         : abap.dec(15, 2);

      @EndUserText.label: 'Refund'
      Refund           : abap.dec(15, 2);

      @EndUserText.label: 'Receipt'
      Receipt          : abap.dec(15, 2);

      @EndUserText.label: 'Uncollected Cash'
      UncollectCash    : abap.dec(15, 2);

      @EndUserText.label: 'Banked Amount'
      BankedAmt        : abap.dec(15, 2);

      @EndUserText.label: 'Theoretical Cash'
      TheorCash        : abap.dec(15, 2);

      @EndUserText.label: 'Total Cash'
      TotCash          : abap.dec(15, 2);

      @EndUserText.label: 'E-Money'
      EMoney           : abap.dec(15, 2);

      @EndUserText.label: 'Prepaid'
      Prepaid          : abap.dec(15, 2);

      @EndUserText.label: 'Total Payment'
      TotPayment       : abap.dec(15, 2);

      @EndUserText.label: 'Difference Amount'
      DiffAmt          : abap.dec(15, 2);

      @EndUserText.label: 'Driver Credit'
      DriverCredit     : abap.dec(15, 2);

      @EndUserText.label: 'Driver Debit'
      DriverDebit      : abap.dec(15, 2);

      @EndUserText.label: 'Driver Receive'
      DriverReceive    : abap.dec(15, 2);

      @EndUserText.label: 'Driver Give'
      DriverGive       : abap.dec(15, 2);

      // ---- Tour Details extra columns (classic f_get_driver_details) --------
      @EndUserText.label: 'Check-In'
      CheckIn          : abap.char(1);

      @EndUserText.label: 'Check-Out'
      CheckOut         : abap.char(1);

      @EndUserText.label: 'Orig. Execution Date'
      OrigEDate        : abap.dats;

      @EndUserText.label: 'Log Status'
      LogStatus        : abap.char(1);

      @EndUserText.label: 'Manual Release'
      ManRel           : abap.char(1);

      @EndUserText.label: 'Origin'
      Origin           : abap.char(1);

      @EndUserText.label: 'Planned'
      Planned          : abap.char(1);

      @EndUserText.label: 'Presales Status'
      PresalesStatus   : abap.char(1);

      @EndUserText.label: 'Tour Status'
      TourStatus       : abap.char(4);

      @EndUserText.label: 'FSR Status'
      FsrStatus        : abap.char(10);

      // ---- Payment extra columns (classic f_get_payment) --------------------
      @EndUserText.label: 'Recipient'
      Recipient        : kunnr;

      @EndUserText.label: 'Dummy Account Flag'
      DummyFlag        : abap.char(1);

      @EndUserText.label: 'Payment Log'
      Plog             : abap.char(1);

      @EndUserText.label: 'Rcpt/Exp.'
      RcptExp          : abap.char(4);
}
