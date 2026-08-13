@EndUserText.label: 'Route Value Help (Settlement Details)'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Search.searchable: true
@ObjectModel.resultSet.sizeCategory: #XS
define view entity /CCBJI/I_FSV_ROUTE_VH
  as select from tvro
{
      @Search.defaultSearchElement: true
  key route as Route
}
