@EndUserText.label: 'OTC DSD Settlement Details - Tour Header'
@ObjectModel.query.implementedBy: 'ABAP:/CCBJI/CL_FSV_STLMNT_QRY'
@Metadata.allowExtensions: true
@AccessControl.authorizationCheck: #NOT_REQUIRED
@ObjectModel.usageType: { serviceQuality: #A,
                          sizeCategory:   #M,
                          dataClass:      #MIXED }
define custom entity /CCBJI/I_FSV_STLMNT_DTL
{
      // Key of the settlement tour header row (one row per shipment / visit list)
  key ShipmentNo       : tknum;

      // Derived traffic light  G = ok , Y = warnings , R = errors  (source: f_traffic_light)
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

      // Route scenario ( R = paper based , etc. – source MOD-030 )
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
