@EndUserText.label: 'Status Value Help (Settlement Details)'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Search.searchable: true
define view entity /CCBJI/I_FSV_STATUS_VH
  as select from /dsd/st_cstatus
{
      @Search.defaultSearchElement: true
  key status_id as StatusId
}
