@EndUserText.label: 'Visit List Value Help'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Search.searchable: true
define view entity /CCBJI/I_FSV_VLIST_VH
  as select distinct from /dsd/vc_vlh
{
      // Suggestions are the VALID Visit Lists from the visit-list master
      // /dsd/vc_vlh - the same table the classic report validates the entered
      // "Shipment / Visit List" against (rb_visi: "Invalid Visit List(s) not
      // maintained in table /dsd/vc_vlh"). Shown WITHOUT leading zeros. Plain
      // (non-fixed) value list, so any typed Visit List not in the list is still
      // ACCEPTED, and the backend query matches it with or without leading zeros.
      @Search.defaultSearchElement: true
  key cast( ltrim( vlid, '0' ) as tknum ) as ShipmentNo
}
