@EndUserText.label: 'Plant Value Help (Settlement Details)'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Search.searchable: true
define view entity /CCBJI/I_FSV_PLANT_VH
  as select from t001w
{
      @Search.defaultSearchElement: true
      @Search.fuzzinessThreshold: 0.8
  key werks as Plant,
      name1 as PlantName
}
