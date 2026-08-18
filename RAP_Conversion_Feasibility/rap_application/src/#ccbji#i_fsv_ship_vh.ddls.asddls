@EndUserText.label: 'Shipment / Visit List Value Help'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Search.searchable: true
define view entity /CCBJI/I_FSV_SHIP_VH
  as select from vttk
{
      @Search.defaultSearchElement: true
  key tknum as ShipmentNo,
      tplst as Tpp,
      route as Route,
      erdat as CreatedOn
}
