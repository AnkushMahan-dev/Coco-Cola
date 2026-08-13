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
      // Value help: a released shipment VH view or a custom one over VTTK.
      // @Consumption.valueHelpDefinition: [{ entity: { name: 'I_Shipment', element: 'Shipment' } }]
  key ShipmentNo       : tknum;

      // Derived traffic light  G = ok , Y = warnings , R = errors  (source: f_traffic_light)
      @EndUserText.label: 'Processing Status'
      ProcessingStatus : abap.char(1);

      @EndUserText.label: 'Transp. Planning Point'
      Tpp              : tplst;

      @EndUserText.label: 'Status'
      // Value help over the settlement status check table /DSD/ST_CSTATUS
      // (build a small VH custom entity/view and reference it here):
      // @Consumption.valueHelpDefinition: [{ entity: { name: '/CCBJI/I_FSV_STATUS_VH', element: 'StatusId' } }]
      StatusId         : /dsd/st_status_id;

      @EndUserText.label: 'Plant'
      // Plant F4 from the released VDM plant view (key element = Plant).
      @Consumption.valueHelpDefinition: [ { entity: { name: 'I_Plant', element: 'Plant' } } ]
      @Consumption.filter.mandatory: true
      Plant            : werks_d;

      @EndUserText.label: 'Route'
      // Route F4 from the released route view (verify the name on your system).
      @Consumption.valueHelpDefinition: [ { entity: { name: 'I_Route', element: 'Route' } } ]
      @Consumption.filter.mandatory: true
      Route            : route;

      @EndUserText.label: 'Settlement Date'
      @Consumption.filter.mandatory: true
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
