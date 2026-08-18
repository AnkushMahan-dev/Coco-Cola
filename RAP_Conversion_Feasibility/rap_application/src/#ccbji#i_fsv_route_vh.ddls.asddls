@EndUserText.label: 'Route Value Help (Settlement Details)'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Search.searchable: true
define view entity /CCBJI/I_FSV_ROUTE_VH
  as select distinct from tvro
{
      // Suggestions WITHOUT leading zeros (002501 -> 2501), matching how the
      // data actually stores the route and how the backend query normalizes it.
      // This is a plain (non-fixed) value list, so the filter still ACCEPTS any
      // typed value that is not in the list.
      @Search.defaultSearchElement: true
  key cast( ltrim( route, '0' ) as route ) as Route
}
