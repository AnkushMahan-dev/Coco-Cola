@EndUserText.label: 'OTC DSD Settlement Details'
@ObjectModel.query.implementedBy: 'ABAP:/CCBJI/CL_FSV_STLMNT_QRY'
@Metadata.allowExtensions: true
@AccessControl.authorizationCheck: #NOT_REQUIRED
@ObjectModel.usageType: { serviceQuality: #A,
                          sizeCategory:   #M,
                          dataClass:      #MIXED }
define custom entity /CCBJI/I_FSV_STLMNT_DTL
  with parameters
    // Report mode = the classic g2 radio-button group. Rendered as a
    // MANDATORY dropdown (fixed values from domain /CCBJI/FSV_MODE).
    @EndUserText.label: 'Report Mode'
    @Consumption.defaultValue: 'TOUR'
    P_Mode : /ccbji/fsv_mode
{
      // Key of the settlement tour header row (one row per shipment / visit list)
      @EndUserText.label: 'Shipment / Visit List'
      @Consumption.valueHelpDefinition: [ { entity: { name: '/CCBJI/I_FSV_SHIP_VH', element: 'ShipmentNo' } } ]
  key ShipmentNo       : tknum;

      // Derived traffic light  G = ok , Y = warnings , R = errors  (source: f_traffic_light)
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
