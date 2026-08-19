@EndUserText.label: 'OTC DSD Settlement Application Log'
@ObjectModel.query.implementedBy: 'ABAP:/CCBJI/CL_FSV_STLMNT_LOG'
@Metadata.allowExtensions: true
@ObjectModel.usageType: { serviceQuality: #A,
                          sizeCategory:   #S,
                          dataClass:      #MIXED }
define custom entity /CCBJI/I_FSV_STLMNT_LOG
{
      // Application log of the classic report: BAL object /DSD/RTACC,
      // subobject FSR, external number = Tour ID (form f_display_dsd_log ->
      // /DSD/ST_APPLOG_VIEW). One row per BAL message, keyed by the tour +
      // the message's log handle + message number so it is stable and unique.
      //
      // TourId is MANDATORY: the query never scans the whole BAL, it only
      // reads the log of the one tour passed by the "Display Logs" action.
      @EndUserText.label: 'Tour ID'
      @Consumption.filter: { mandatory: true }
  key TourId        : abap.char(32);

      @EndUserText.label: 'Log Number'
  key LogNumber     : abap.char(20);

      @EndUserText.label: 'Message No.'
  key MsgNumber     : abap.int4;

      // Message type A/E/W/S/I (classic ALV traffic-light column).
      @EndUserText.label: 'Type'
      MessageType   : abap.char(1);

      // Fiori criticality for colouring: 1 red / 2 yellow / 3 green / 0 gray.
      @EndUserText.label: 'Criticality'
      Criticality   : abap.int1;

      @EndUserText.label: 'Message Text'
      MessageText   : abap.char(255);

      @EndUserText.label: 'Message Class'
      MessageClass  : abap.char(20);

      @EndUserText.label: 'Message Number'
      MessageNumber : abap.numc(3);

      @EndUserText.label: 'Problem Class'
      ProblemClass  : abap.char(1);

      @EndUserText.label: 'Detail Level'
      DetailLevel   : abap.int1;
}
