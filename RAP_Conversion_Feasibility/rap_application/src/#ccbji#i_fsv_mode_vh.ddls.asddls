@EndUserText.label: 'Report Mode Value Help'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Search.searchable: true
define view entity /CCBJI/I_FSV_MODE_VH
  as select from dd07l as val
    left outer join dd07t as txt
      on  txt.domname    = val.domname
      and txt.as4local   = val.as4local
      and txt.as4vers    = val.as4vers
      and txt.valpos     = val.valpos
      and txt.ddlanguage = $session.system_language
{
      @Search.defaultSearchElement: true
      @ObjectModel.text.element: ['ModeText']
  key cast( val.domvalue_l as /ccbji/fsv_mode ) as ReportMode,

      @Semantics.text: true
      txt.ddtext                                as ModeText
}
where val.domname  = '/CCBJI/FSV_MODE'
  and val.as4local = 'A'
