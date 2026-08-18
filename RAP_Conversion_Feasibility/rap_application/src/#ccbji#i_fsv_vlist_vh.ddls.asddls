@EndUserText.label: 'Visit List Value Help'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Search.searchable: true
define view entity /CCBJI/I_FSV_VLIST_VH
  as select distinct from /dsd/st_status
{
      // Suggestions are the actual Visit Lists (/DSD/ST_STATUS-VLID) - NOT VTTK
      // shipments - shown WITHOUT leading zeros. Plain (non-fixed) value list,
      // so any typed Visit List that is not in the suggestion list is still
      // ACCEPTED, and the backend query matches it with or without leading zeros.
      @Search.defaultSearchElement: true
  key cast( ltrim( vlid, '0' ) as tknum ) as ShipmentNo
}
