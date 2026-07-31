*----------------------------------------------------------------------*
* Program Name     : Sakshi Singla                                     *
* Program Title    : /CCEJ/RDSDSLSR_SO_MAINT_SUB                       *
* Program Type     : Report                                            *
* Description      : Sales Order Maintenance Report                    *
*                                                                      *
* Date             : 09-06-2016                                        *
* Author           : Sakshi Singla <S404344>                           *
* Run Frequency    :                                                   *
* Transaction      : VA03                                              *
* Transport Number : DCRK9A0K09                                        *
* RICEF ID         : OTC-3051-R-01                                     *
* Release          : CCEJ Front Office 5.1                             *
* Additional Info  :                                                   *
*----------------------------------------------------------------------*
*         =========== MODIFICATION LOG ===========                     *
*----------------------------------------------------------------------*
* Mod No.            : MOD-001                                         *
* Date               : 13-AUG-2016                                     *
* Author             : <S182466>  <Monica Singh>                       *
* Change Reference   : OTC-3046-E-02                                   *
* Transport Number   : DCRK9A0K09                                      *
* Change Request     : CCEJ Front Office 5.1                           *
* Change Description : Add the logic to identify promotion and Display *
*Promotion and its value in report output                              *
*----------------------------------------------------------------------*
* Mod No.            : MOD-002                                         *
* Date               : 13-AUG-2016                                     *
* Author             : <S182466>  <Monica Singh>                       *
* Change Reference   : ETE Defect 348                                  *
* Transport Number   : DCRK9A0K09                                      *
* Change Request     : CCEJ Front Office 5.1                           *
* Change Description : Add the logic as mentioned in defect            *
*----------------------------------------------------------------------*
*----------------------------------------------------------------------*
* Mod No.            : MOD-010                                         *
* Date               : 03-Aug-2017                                     *
* Author             : <S404352>  <Abhishek Buckal>                    *
* Change Reference   : Defect 6962                                     *
* Transport Number   : MCRK9A0QTO                                      *
* Change Request     : CCEJ Front Office 5.1                           *
* Change Description : added JDC code and Name in the output           *
*----------------------------------------------------------------------*
* Mod No.            : 013                                             *
* Date               : 21-SEP-2017                                     *
* Author             : Sangeeta  <S171792>                             *
* Change Reference   : R5.1 Defect#3886                                *
* Transport Number   : DCRK9A12HD                                     *
* Change Request     : CRXXXXXX                                        *
* Change Description : Populate Sen den code from  VBAK-KTEXT          *
*----------------------------------------------------------------------*
*----------------------------------------------------------------------*
* Mod No.            : 014                                             *
* Date               : 05-OCT-2017                                     *
* Author             : Abhishek Buckal  <S404352>                      *
* Change Reference   : Wave1 Defect # 4006                             *
* Transport Number   : DCRK9A137L                                      *
* Change Request     : CRXXXXXX                                        *
* Change Description : Senyo Denpyo group is picked from both KTEXT    *
* and from header text.Get from Header Text only if KTEXT is blank and *
* slip classification                                                  *
*----------------------------------------------------------------------*
*----------------------------------------------------------------------*
* Mod No.            : 016                                             *
* Date               : 15-NOV-2017                                     *
* Author             : Abhishek Buckal <S404352>                       *
* Change Reference   : Wave1 Defect # 4389                             *
* Transport Number   : DCRK9A15OU                                      *
* Change Request     : 8000026218                                      *
* Change Description : Changes the item no while reading the data from *
* LIPS Table                                                           *
*----------------------------------------------------------------------*
*----------------------------------------------------------------------*
* Mod No.            : 017                                             *
* Date               : 18-JAN-2017                                     *
* Author             : Abhishek Buckal <S404352>                       *
* Change Reference   : Defect # 4622                                   *
* Transport Number   : MJRK900465                                      *
* Change Request     : 8000000620                                      *
* Change Description : Add the JDC code in the selection screen        *
*----------------------------------------------------------------------*
*----------------------------------------------------------------------*
* Mod No.            : MOD-020                                         *
* Date               : 01-08-2023                                      *
* Author             : Katukuri Manasa EJX9005170                      *
* Change Reference   : 1000003195                                      *
* Transport Number   : MJRK922895                                      *
* Change Request     : 8000013887                                      *
* Change Description : to reduce the Performance issues                *
*----------------------------------------------------------------------*
* Mod No.            : MOD-021                                         *
* Date               : 24-Jul-2026                                     *
* Change Description : Performance remediation to resolve report       *
* timeout: removed explicit SORTs made redundant by the SORTED TABLE    *
* declarations in the TOP include (I_VBAK/I_VBAP/I_VBPA/I_KNA1/        *
* I_VBUV/I_VBRP/I_VBKD/I_VBEP/I_VBUP/I_MAKT/I_STXH/I_KONV/I_A595/       *
* I_KNVV/I_VBFA/I_VBFA_SHIP/I_LIPS/I_VTTK/I_T42); de-duplicated the     *
* driving table for the LIPS FOR ALL ENTRIES select; removed unused    *
* I_LIKP/I_VBRK objects; modernized CREATE OBJECT/CALL METHOD to       *
* inline/functional call syntax; documented previously-empty error     *
* branches. No change to selection logic, business calculations or    *
* ALV output.                                                          *
*----------------------------------------------------------------------*
* Mod No.            : MOD-023                                         *
* Date               : 27-Jul-2026                                     *
* Change Description : Replaced direct reads of MAKT, LIPS and VBRP    *
* with the standard S/4HANA CDS interface views I_ProductDescription,  *
* I_DeliveryDocumentItem and I_BillingDocumentItem respectively,       *
* selecting the CDS field and aliasing it back to the original table   *
* field name (AS matnr/maktx/vbeln/posnr/lfimg/vgpos/fkimg) so no      *
* downstream code changed. VBAK/VBAP/KNA1/KNVV/VTTK were NOT           *
* converted - they rely on client-specific append fields (KTEXT,       *
* VSNMR_V, /SCL/ATWRT, /CCC/GEDATNR, /CCEJ/KNVV_ZKZDEAKBN,              *
* /BEV1/RPFAR1) that standard CDS views do not expose. VBFA, VBEP,     *
* VBPA, VBKD were left as direct table reads - no standard CDS view    *
* could be confirmed with sufficient confidence for their exact        *
* fields without Data Dictionary access.                               *
* IMPORTANT: the view/field names below are based on the standard SAP *
* S/4HANA Virtual Data Model and could NOT be verified against this    *
* system's Data Dictionary from this session - verify in SE11/ADT and  *
* adjust if needed before transporting. No change to selection logic, *
* business calculations or ALV output is intended once confirmed.      *
*----------------------------------------------------------------------*
* Mod No.            : MOD-024                                         *
* Date               : 30-Jul-2026                                     *
* Change Description : Performance remediation for ALV load time       *
* (F_PREP_FCAT): CL_SALV_COLUMNS->SET_OPTIMIZE( ) makes the kernel      *
* content-scan every cell of every row to auto-fit each column's       *
* width; with ~80 columns in this ALV that scan - not the F_GET_DATA   *
* SELECTs - was the likely dominant cost of "data returns quickly but  *
* the ALV is slow to display" for large result sets. Now only called   *
* when I_FINAL has <= 5000 lines; above that, columns fall back to     *
* the DDIC-based default widths already set per column via             *
* SET_DDIC_REFERENCE in F_COLHEAD. No change to selection logic,       *
* business calculations, or ALV output/column widths for result sets   *
* at or under 5000 lines. Reviewed all READ TABLE statements in        *
* F_GET_DATA/F_PROCESS_DATA - all lookups against the STANDARD TABLEs  *
* declared in the TOP include already use SORT + READ TABLE ... BINARY*
* SEARCH (per MOD-022), so no further indexing change was needed       *
* there. Please validate via SAT against a representative large        *
* selection before transporting, per this project's usual practice.    *
* Also removed dead code found while auditing F_PROCESS_DATA for       *
* unused reads: I_VBUP's open-order-status lookup was ASSIGNING a      *
* field-symbol whose fields were never read (only existence/sy-subrc   *
* checked) - changed to TRANSPORTING NO FIELDS; the <L_FS_VBUP> field- *
* symbol declaration is removed as it's now unused. L_O_WI            *
* (/CCEJ/CL_SLS_UTIL_SOVALRET) was instantiated but only called from   *
* GET_WORK_INST blocks that have been commented out since MOD-020 -    *
* removed the dead instantiation. L_I_VBELN/L_WA_VBELN (MOD-004) were  *
* only ever touched inside those same commented-out blocks plus one    *
* CLEAR - removed as dead. No change to selection logic, business      *
* calculations, or ALV output.                                         *
*----------------------------------------------------------------------*
*&---------------------------------------------------------------------*
*&  Include           /CCEJ/RDSDSLSR_SO_MAINT_SUB
*&---------------------------------------------------------------------*
*&---------------------------------------------------------------------*
*&      Form  F_VALIDATE_SELECTION
*&---------------------------------------------------------------------*
*       Validate the selection screen
*----------------------------------------------------------------------*
FORM f_validate_selection .
  DATA : l_v_days TYPE i.
  DATA:l_v_zone TYPE tznzone. "MOD-009

* Validate Creation Date range
  LOOP AT s_erdat.
    IF s_erdat-low IS NOT INITIAL
     AND s_erdat-high IS NOT INITIAL.
      l_v_days = s_erdat-high - s_erdat-low.
      IF l_v_days GT v_days. "7.
        MESSAGE e043.
        "Limit the range of creation date to 7 days
*        maintained in tvarvc name = /CCEJ/SO_MAINTAINED
        CLEAR l_v_days.
        EXIT.
      ENDIF.
    ENDIF.
  ENDLOOP.

* Validate Delivery Date range
  LOOP AT s_vdatu.
    IF s_vdatu-low IS NOT INITIAL
     AND s_vdatu-high IS NOT INITIAL.
      l_v_days = s_vdatu-high - s_vdatu-low.
      IF l_v_days GT v_days."7.
        MESSAGE e044.
        "Limit the range of Delivery date to 7 days
*        maintained in tvarvc name = /CCEJ/SO_MAINTAINED
        CLEAR l_v_days.
        EXIT.
      ENDIF.
    ENDIF.
  ENDLOOP.

* Distribution Channel is incorrect
  IF s_vtweg[] IS NOT INITIAL.
    SELECT SINGLE vtweg INTO v_vtweg                        "#EC WARNOK
      FROM tvtw
      WHERE vtweg IN s_vtweg.

    IF sy-subrc NE 0.
      MESSAGE e099. "Please enter a valid Distribution channel
    ENDIF.
  ENDIF.

* Division is incorrect
  IF s_spart[] IS NOT INITIAL.
    SELECT SINGLE spart INTO v_spart                        "#EC WARNOK
      FROM tspa
      WHERE spart IN s_spart.

    IF sy-subrc NE 0.
      MESSAGE e100.     "Please enter a valid Division
    ENDIF.
  ENDIF.

* Sales order type is incorrect
  IF s_auart[] IS NOT INITIAL.
    SELECT SINGLE auart INTO v_auart                        "#EC WARNOK
      FROM tvak
      WHERE auart IN s_auart.

    IF sy-subrc NE 0.
      MESSAGE e101.     "Please enter a valid Sales Order Type
    ENDIF.
  ENDIF.

* Order Reason is incorrect
  IF s_augru[] IS NOT INITIAL.
    SELECT SINGLE augru INTO v_augru                        "#EC WARNOK
      FROM tvau
      WHERE augru IN s_augru.

    IF sy-subrc NE 0.
      MESSAGE e102. "Please enter a valid Order Reason
    ENDIF.
  ENDIF.

* Shipping Conditions is incorrect
  IF s_vsbed[] IS NOT INITIAL.
    SELECT SINGLE vsbed INTO v_vsbed                        "#EC WARNOK
      FROM tvsb
      WHERE vsbed IN s_vsbed.

    IF sy-subrc NE 0.
      MESSAGE e103. "Please enter valid Shipping Conditions
    ENDIF.
  ENDIF.

* Sold To party is incorrect
  IF s_kunnr[] IS NOT INITIAL.
    SELECT SINGLE kunnr INTO v_kunnr                        "#EC WARNOK
      FROM kna1
      WHERE kunnr IN s_kunnr.

    IF sy-subrc NE 0.
      MESSAGE e105.   "Please enter valid Sold-To-Party
    ENDIF.
  ENDIF.

* Sales Office is incorrect
  IF s_vkbur[] IS NOT INITIAL.
    SELECT SINGLE vkbur INTO v_vkbur                        "#EC WARNOK
      FROM tvbur
      WHERE vkbur IN s_vkbur.

    IF sy-subrc NE 0.
      MESSAGE e106.     "Please enter valid Sales Office
    ENDIF.
  ENDIF.

* Sales Group is incorrect
  IF s_vkgrp[] IS NOT INITIAL.
    SELECT SINGLE vkgrp INTO v_vkgrp                        "#EC WARNOK
      FROM tvkgr
      WHERE vkgrp IN s_vkgrp.

    IF sy-subrc NE 0.
      MESSAGE e107.     "Please enter valid Sales Group
    ENDIF.
  ENDIF.

* Material is incorrect
  IF s_matnr[] IS NOT INITIAL.
    SELECT SINGLE matnr INTO v_matnr                        "#EC WARNOK
      FROM mara
      WHERE matnr IN s_matnr.

    IF sy-subrc NE 0.
      MESSAGE e108.     "Please enter valid Material
    ENDIF.
  ENDIF.

* Sales document item category is incorrect
  IF s_pstyv[] IS NOT INITIAL.
    SELECT SINGLE pstyv INTO v_pstyv                        "#EC WARNOK
      FROM tvpt
      WHERE pstyv IN s_pstyv.

    IF sy-subrc NE 0.
      "Please enter valid Sales document item category
      MESSAGE e109.
    ENDIF.
  ENDIF.

* Shipping Point is incorrect
  IF s_vstel[] IS NOT INITIAL.
    SELECT SINGLE vstel INTO v_vstel                        "#EC WARNOK
      FROM tvst
      WHERE vstel IN s_vstel.

    IF sy-subrc NE 0.
      MESSAGE e111.     "Please enter valid Shipping Point
    ENDIF.
  ENDIF.

* Rejection Reason is incorrect
  IF s_abgru[] IS NOT INITIAL.
    SELECT SINGLE abgru INTO v_abgru                        "#EC WARNOK
      FROM tvag
      WHERE abgru IN s_abgru.

    IF sy-subrc NE 0.
      MESSAGE e112.     "Please enter valid Rejection Reason
    ENDIF.
  ENDIF.

*  Begin of MOD-009 for defect 3146
*  Validation for time zone
  IF NOT p_tzone IS INITIAL.
    CLEAR:l_v_zone.
    SELECT SINGLE tzone
       FROM ttzz
      INTO l_v_zone
      WHERE tzone = p_tzone.

    IF sy-subrc IS NOT INITIAL.
      MESSAGE e144 WITH text-004.
    ENDIF.
  ENDIF.
*  End of MOD-009 for defect 3146

ENDFORM.                    " F_VALIDATE_SELECTION
*&---------------------------------------------------------------------*
*&      Form  F_AUTH_CHECK
*&---------------------------------------------------------------------*
*       Authority check for Sales org and Plant
*----------------------------------------------------------------------*
FORM f_auth_check .

  "Auth object for VKORG
  CONSTANTS:  l_c_obj    TYPE xuobject VALUE 'V_VBAK_VKO',
              "Auth object for WERKS
              l_c_obj1   TYPE xuobject VALUE 'M_MATE_WRK',
              "Field name
              l_c_vkorg  TYPE xufield  VALUE 'VKORG',
               "Field name
              l_c_vtweg  TYPE xufield  VALUE 'VTWEG',
              "Field name
              l_c_spart  TYPE xufield  VALUE 'SPART',
              "Field name
              l_c_werks  TYPE xufield  VALUE 'WERKS',

               "Activity
              l_c_actvt  TYPE xufield  VALUE 'ACTVT',
              "VTWEG value
              l_c_z1     TYPE vtweg    VALUE 'Z1',
              "SPART value
              l_c_z0     TYPE spart    VALUE 'Z0',
               "Display Auth
              l_c_three  TYPE xufield  VALUE '03',
              l_c_inc    TYPE sign     VALUE 'I',
              l_c_eql    TYPE option   VALUE 'EQ'.

  DATA: l_wa_auth_werks TYPE selopt,
        l_wa_bsark TYPE selopt,
        l_i_werks       TYPE STANDARD TABLE OF ty_werks,
        l_wa_auth_vkorg TYPE selopt,
        l_i_vkorg       TYPE STANDARD TABLE OF ty_vkorg,
        l_i_bsark       TYPE STANDARD TABLE OF ty_bsark.


  FIELD-SYMBOLS: <l_fs_werks> TYPE ty_werks,
                 <l_fs_vkorg> TYPE ty_vkorg,
                 <l_fs_bsark> TYPE ty_bsark.

  CLEAR : l_i_vkorg[], i_auth_vkorg[], l_i_bsark[].

  IF s_vkorg[] IS NOT INITIAL.
    SELECT vkorg                                            "#EC WARNOK
      FROM tvko
      INTO TABLE l_i_vkorg
      WHERE vkorg IN s_vkorg.

    IF sy-subrc IS NOT INITIAL.
      MESSAGE e098.     "Please enter a valid Sales Org.
    ELSE.

*-- check for authorization of sales org
      IF <l_fs_vkorg> IS ASSIGNED.
        UNASSIGN <l_fs_vkorg>.
      ENDIF.
      LOOP AT l_i_vkorg ASSIGNING <l_fs_vkorg>.
        AUTHORITY-CHECK OBJECT l_c_obj
              ID l_c_vkorg FIELD <l_fs_vkorg>-vkorg
              ID l_c_vtweg FIELD l_c_z1
              ID l_c_spart FIELD l_c_z0
              ID l_c_actvt FIELD l_c_three.
        IF sy-subrc IS INITIAL.
*-- Appending authorized Sales Org and Preparing range table
          l_wa_auth_vkorg-sign = l_c_inc.
          l_wa_auth_vkorg-option = l_c_eql.
          l_wa_auth_vkorg-low = <l_fs_vkorg>-vkorg.
          APPEND l_wa_auth_vkorg TO i_auth_vkorg.
          CLEAR l_wa_auth_vkorg.
        ENDIF.
      ENDLOOP.
    ENDIF.

    IF i_auth_vkorg IS INITIAL.
      MESSAGE e041. "No Authorisation of Sales Org.
      LEAVE LIST-PROCESSING.
    ENDIF.
  ENDIF.


  CLEAR: l_i_werks, i_auth_werks,i_auth_bsark.
* Delivery Plant is incorrect
  IF s_werks[] IS NOT INITIAL.
    SELECT werks
    FROM t001w
    INTO TABLE l_i_werks
      WHERE werks IN s_werks.

    IF sy-subrc IS NOT INITIAL.
      MESSAGE e110.   "Please enter valid Delivery Plant
    ELSE.
*-- check for authorization of Plant
      IF <l_fs_werks> IS ASSIGNED.
        UNASSIGN <l_fs_werks>.
      ENDIF.
      LOOP AT l_i_werks ASSIGNING <l_fs_werks>.
        AUTHORITY-CHECK OBJECT l_c_obj1
              ID l_c_werks FIELD <l_fs_werks>-werks
              ID l_c_actvt FIELD l_c_three.
        IF sy-subrc IS INITIAL.
*-- Appending authorized plant numbers and Preparing range table
          l_wa_auth_werks-sign = l_c_inc.
          l_wa_auth_werks-option = l_c_eql.
          l_wa_auth_werks-low = <l_fs_werks>-werks.
          APPEND l_wa_auth_werks TO i_auth_werks.
          CLEAR l_wa_auth_werks.
        ENDIF.
      ENDLOOP.
    ENDIF.

    IF i_auth_werks IS INITIAL.
      MESSAGE e097.  "No Authorisation of Plant
      LEAVE LIST-PROCESSING.
    ENDIF.
  ENDIF.
** Check authority for PO type
* PO Type is incorrect
  IF s_bsark[] IS NOT INITIAL.
    SELECT bsark                                            "#EC WARNOK
      FROM t176 INTO TABLE l_i_bsark
      WHERE bsark IN s_bsark.

    IF sy-subrc NE 0.
      MESSAGE e104.     "Please enter valid PO Type
    ELSE.
*-- check for authorization of PO type
      LOOP AT l_i_bsark ASSIGNING <l_fs_bsark>.
*        AUTHORITY-CHECK OBJECT l_c_obj2
*           ID l_c_bsark FIELD <l_fs_bsark>-bsark
*        ID l_c_actvt FIELD l_c_three.
*        IF sy-subrc IS INITIAL.
*-- Appending po type numbers and Preparing range table
        l_wa_bsark-sign = l_c_inc.
        l_wa_bsark-option = l_c_eql.
        l_wa_bsark-low = <l_fs_bsark>-bsark.
        APPEND l_wa_bsark TO i_auth_bsark.
        CLEAR l_wa_bsark.
*        ENDIF.
      ENDLOOP.
      IF i_auth_bsark[] IS INITIAL.
        MESSAGE e197.     "No Authorization for po type
      ENDIF.
    ENDIF.
  ENDIF.
ENDFORM.                    " F_AUTH_CHECK
*&---------------------------------------------------------------------*
*&      Form  F_GET_DATA
*&---------------------------------------------------------------------*
*       Get data from tables
*----------------------------------------------------------------------*
FORM f_get_data .
  CONSTANTS: l_c_i TYPE sign VALUE 'I',       "Sign
             l_c_eq TYPE option VALUE 'EQ',   "Option
             l_c_j TYPE VBTYPL_N VALUE 'J'," delivery
             l_c_t TYPE VBTYPL_N VALUE 'T'," return order deliveries
             l_c_u TYPE VBTYPL_N VALUE 'U'," performa
             l_c_m TYPE VBTYPL_N VALUE 'M'," invoice
             l_c_8 TYPE VBTYPL_N VALUE '8'," shipment
             l_c_kappl TYPE kappl VALUE 'V'," kappl
             l_c_sign TYPE sign VALUE 'I',
             l_c_option TYPE option VALUE 'EQ',
             l_c_header TYPE posnr VALUE '000000'."MOD-015


  DATA : l_r_lfgsa TYPE RANGE OF lfgsa,
         l_r_vbtyp TYPE RANGE OF VBTYPL_N ," MOD-003
*         l_r_kschl TYPE RANGE OF kschl," for condition type
*         l_wa_kschl LIKE LINE OF l_r_kschl,
         l_r_vkorg TYPE RANGE OF vkorg,
         l_wa_vkorg LIKE LINE OF l_r_vkorg,
*         l_r_kunnr TYPE RANGE OF kunnr,
*         l_wa_kunnr LIKE LINE OF l_r_kunnr,
         l_i_vbfa TYPE STANDARD TABLE OF ty_vbfa," MOD_003
         l_i_vbak TYPE STANDARD TABLE OF ty_vbak,
         l_i_vbap TYPE STANDARD TABLE OF ty_vbap,
         l_i_konv TYPE STANDARD TABLE OF ty_konv,
         l_i_vbpa TYPE STANDARD TABLE OF ty_vbpa,
         l_wa_vbpa TYPE ty_vbpa,
         l_wa_lfgsa LIKE LINE OF l_r_lfgsa,
         l_wa_vbtyp LIKE LINE OF l_r_vbtyp," MOD-003
         l_v_tabix TYPE sytabix,
*        BOC MOD-008
*        EOC MOD-008
*--Start of addition for MOD-010
         l_i_partner TYPE STANDARD TABLE OF ty_partner,
*--End of addition for MOD-010
*        MOD-021: de-duplicated (VBELN/POSNN) driver for the LIPS
*        FOR ALL ENTRIES below, kept separate from l_i_vbfa since that
*        table is still needed with its own VBELN-only de-duplication
*        for the VBFA_SHIP select right after it.
         l_i_vbfa_lips TYPE STANDARD TABLE OF ty_vbfa.
  FIELD-SYMBOLS : <l_fs_vbak> TYPE ty_vbak.

*BOC for MOD-015
*-- to get the JDC AUART
  CLEAR:i_jdc_auart[].
  SELECT sign
         opti
         low
         high
    FROM tvarvc
    INTO TABLE i_jdc_auart
    WHERE name = c_jdc_auart
    AND type = c_type.
  IF sy-subrc IS NOT INITIAL.
    CLEAR:i_jdc_auart.
  ENDIF.
*EOC for MOD-015

*--Start of addition for MOD-010
  " Get the partner fnc
  PERFORM f_partner_fnc CHANGING l_i_partner.
*--End of addition for MOD-010

*--Sales Header Data
  SELECT vbeln erdat
         erzet ernam
         audat auart
         augru submi
         vkorg vtweg
         spart vkgrp
         vkbur
**    BOC BY S172466 MOD-001
         knumv
**    EOC BY S172466 MOD-001
         vsbed
         ktext "Added for MOD-013|S171792
         bstnk bsark
         bstdk ihrez
         bname kunnr
         xblnr" Reference Document Number" MOD-003
         vsnmr_v
    FROM vbak
    INTO TABLE i_vbak
    WHERE vbeln IN s_vbeln
    AND   erdat IN s_erdat
    AND   erzet IN s_erzet
    AND   ernam IN s_ernam
    AND   auart IN s_auart
    AND   augru IN s_augru
    AND   vkorg IN i_auth_vkorg
    AND   vtweg IN s_vtweg
    AND   spart IN s_spart
    AND   vkgrp IN s_vkgrp
    AND   vkbur IN s_vkbur
    AND   vdatu IN s_vdatu
    AND   vsbed IN s_vsbed
    AND   bstnk IN s_bstnk
    AND   bsark IN i_auth_bsark
    AND   kunnr IN s_kunnr.

  IF sy-subrc IS NOT INITIAL.
*  No records found for given selection
    MESSAGE s011 DISPLAY LIKE c_error.
    LEAVE LIST-PROCESSING.
  ENDIF.

  IF i_vbak[] IS NOT INITIAL.

    CLEAR: v_tot_lines.
    DESCRIBE TABLE i_vbak LINES v_tot_lines.
    "If output lines is greater than 100000, throw error
    IF v_tot_lines GT v_records.
      "Please limit your selection criteria

      MESSAGE s070 DISPLAY LIKE c_error.
      LEAVE LIST-PROCESSING.
    ENDIF.
**    check sales office authority
    PERFORM f_check_vkbur_auth.
**BOC BY S172466 MOD-001**
*-- to get the KSCHL
    SELECT sign
           opti
           low
           high
      FROM tvarvc
      INTO TABLE i_kschl
      WHERE name = c_name1
      AND type = c_type.
    IF sy-subrc EQ 0 AND i_vbak[] IS NOT INITIAL.
**        clear table before using
      CLEAR: l_i_vbak.
**        transfer the content into temp table
      l_i_vbak[] = i_vbak[].
**        cort temp table with knumv
      SORT l_i_vbak BY knumv.
**        remove duplicate content from temp value
      DELETE ADJACENT DUPLICATES FROM l_i_vbak COMPARING knumv.
*-- Price details
" *****Code Remediation changes S4 2025_1_A Conversion **begin of change by EJX9007359 04.06.2026 for ATC
* SELECT knumv
* kposn
* stunr
* zaehk
* kschl
* kbetr
* kpein
* knumh
* kwert " MOD-011
* FROM V_KONV_CDS
*        INTO TABLE i_konv
*        FOR ALL ENTRIES IN l_i_vbak
*        WHERE knumv = l_i_vbak-knumv
*        AND   kschl IN i_kschl.
SELECT knumv
kposn
stunr
zaehk
kschl
kbetr
kpein
knumh
kwert " MOD-011
FROM V_KONV_CDS
        INTO TABLE i_konv
        FOR ALL ENTRIES IN l_i_vbak
        WHERE knumv = l_i_vbak-knumv
        AND   kschl IN i_kschl.
" *****Code Remediation changes S4 2025_1_A Conversion **end of change by EJX9007359 04.06.2026 for ATC

      IF sy-subrc EQ 0 AND i_konv IS NOT INITIAL.
**          Delete records where amount is zero
        DELETE i_konv WHERE kbetr IS INITIAL.

**        removing duplicates
        CLEAR:l_i_konv.
        l_i_konv[] = i_konv[].
        SORT l_i_konv BY knumh.
        DELETE ADJACENT DUPLICATES FROM l_i_konv COMPARING knumh.
*BOC for MOD-015
        "Removing KNUMH with blabk values.
        DELETE l_i_konv WHERE knumh IS INITIAL.
*BOC for MOD-015

**          select condition values
        IF l_i_konv IS NOT INITIAL.
**           BOC by S172466 MOD-004
**          create range
*          l_wa_kschl-sign = l_c_sign.
*          l_wa_kschl-option = l_c_option.
*          l_wa_kschl-low = c_kschl_yjr4.
*          APPEND l_wa_kschl TO l_r_kschl.
*          CLEAR: l_wa_kschl-low.
*
*          l_wa_kschl-low = c_kschl_yjrb.
*          APPEND l_wa_kschl TO l_r_kschl.
*          CLEAR: l_wa_kschl-low.
*
*          l_wa_kschl-low = c_kschl_yjss.
*          APPEND l_wa_kschl TO l_r_kschl.
*          CLEAR: l_wa_kschl-low.
*
*          l_wa_kschl-low = c_kschl_yjss.
*          APPEND l_wa_kschl TO l_r_kschl.
*          CLEAR: l_wa_kschl-low.
*
*          l_wa_kschl-low = c_kschl_yjbh.
*          APPEND l_wa_kschl TO l_r_kschl.
*          CLEAR: l_wa_kschl-low.
*
*
*          l_wa_kschl-low = c_kschl_yjsh.
*          APPEND l_wa_kschl TO l_r_kschl.
*          CLEAR: l_wa_kschl-low.

**creating range for sales org
          CLEAR:l_i_vbak[].
          l_i_vbak[] = i_vbak[].
          SORT l_i_vbak BY vkorg.
          DELETE ADJACENT DUPLICATES FROM l_i_vbak COMPARING vkorg.


          LOOP AT l_i_vbak ASSIGNING <l_fs_vbak>.
            l_wa_vkorg-sign = l_c_sign.
            l_wa_vkorg-option = l_c_option.
            l_wa_vkorg-low = <l_fs_vbak>-vkorg.
            APPEND l_wa_vkorg TO l_r_vkorg.
            CLEAR: l_wa_vkorg.
          ENDLOOP.

**           creating range for customer
*          CLEAR:l_i_vbak[].
*          l_i_vbak[] = i_vbak[].
*          SORT l_i_vbak BY kunnr.
*          DELETE ADJACENT DUPLICATES FROM l_i_vbak COMPARING kunnr.


*          LOOP AT l_i_vbak ASSIGNING <l_fs_vbak>.
*            l_wa_kunnr-sign = l_c_sign.
*            l_wa_kunnr-option = l_c_option.
*            l_wa_kunnr-low = <l_fs_vbak>-kunnr.
*            APPEND l_wa_kunnr TO l_r_kunnr.
*            CLEAR: l_wa_kunnr.
*          ENDLOOP.
**           EOC by S172466 MOD-004


          SELECT kschl
                 knuma_ag
                 vkorg
                 kunnr
                 vkbur
                 matnr
                 vrkme
                 knumh
            FROM a595
            BYPASSING BUFFER "MOD-015
            INTO TABLE i_a595
            FOR ALL ENTRIES IN l_i_konv
            WHERE kappl = l_c_kappl
            AND kschl IN i_kschl
            AND vkorg IN l_r_vkorg
*            AND kunnr IN l_r_kunnr
            AND knumh = l_i_konv-knumh.

        ENDIF.
      ENDIF.

    ENDIF.
**EOC BY S172466 MOD-001
*--Sales Item Data
    SELECT vbeln posnr
           matnr charg
           pstyv abgru
           meins
**         BOC BY S172466 MOD-002
           netwr
**         EOC BY S172466 MOD-002
           kwmeng
           klmeng "MOD-018
           vrkme werks
           vstel route
**      BOC BY S172466 MOD-002
*           netpr
**      EOC BY S172466 MOD-002
           knuma_pi
           /scl/atwrt
      FROM vbap
      INTO TABLE i_vbap
      FOR ALL ENTRIES IN i_vbak
      WHERE vbeln = i_vbak-vbeln
      AND   matnr IN s_matnr
      AND   pstyv IN s_pstyv
      AND   abgru IN s_abgru
      AND   werks IN i_auth_werks
      AND   vstel IN s_vstel
*      AND   route IN  s_route MOD-001 Defect 1597
      AND   /scl/atwrt IN s_atwrt.
    IF sy-subrc IS NOT INITIAL.

      MESSAGE s011 DISPLAY LIKE c_error.
**          no data found
      LEAVE LIST-PROCESSING.
    ENDIF.

    IF i_vbap[] IS NOT INITIAL.
**  removing orders from vbak based on item level selection creteria
      CLEAR: l_i_vbap.
**      copying vbap to local table
      l_i_vbap[] = i_vbap[].
**      sort by sales order no.
      SORT l_i_vbap BY vbeln.
**      deleting duplicate sales order no.
      DELETE ADJACENT DUPLICATES FROM l_i_vbap COMPARING vbeln.
**      loop for removing extra entries from vbak
      LOOP AT i_vbak ASSIGNING <l_fs_vbak>.
**         to fill the vbeln_new field
**        BOC BY S172466 MOD-001 ETE Defect 348
        <l_fs_vbak>-vbeln_new = <l_fs_vbak>-vbeln.
**        EOC BY S172466 MOD-001 ETE Defect 348
        CLEAR: l_v_tabix.
**        capturing index
        l_v_tabix = sy-tabix.
**        checking if order present in item table
        READ TABLE l_i_vbap WITH KEY vbeln = <l_fs_vbak>-vbeln
                         TRANSPORTING NO FIELDS
                         BINARY SEARCH.
**        if order no not present in item table
        IF sy-subrc IS NOT INITIAL.
**          delete the corresponding entry in header table
          DELETE i_vbak INDEX l_v_tabix.
        ENDIF.
      ENDLOOP.
**      BOC BY S172466 MOD-003 Defect 1813
      CLEAR:l_i_vbak[].
**      copy to local table
      l_i_vbak[] = i_vbak[].
**      sort table by kunnr
      SORT l_i_vbak BY kunnr.
**      delete duplicates
      DELETE ADJACENT DUPLICATES FROM l_i_vbak COMPARING kunnr.
**      if local table has values
      IF l_i_vbak[] IS NOT INITIAL.
**      select value from customer master
        SELECT kunnr
               /ccej/knvv_zkzdeakbn
          FROM knvv INTO TABLE i_knvv
          FOR ALL ENTRIES IN l_i_vbak
          WHERE kunnr = l_i_vbak-kunnr.
**          if values found
        IF sy-subrc IS INITIAL.
**          sort the table values
          SORT i_knvv BY kunnr.
        ELSE.
          CLEAR: i_knvv[].
        ENDIF.
      ENDIF.
      IF i_vbak[] IS NOT INITIAL.
**        filling range
        CLEAR:l_wa_vbtyp.
        l_wa_vbtyp-sign = l_c_i.
        l_wa_vbtyp-option = l_c_eq.

        l_wa_vbtyp-low = l_c_j. " delivery
        APPEND l_wa_vbtyp TO l_r_vbtyp.
        CLEAR:l_wa_vbtyp-low.


        l_wa_vbtyp-low = l_c_t. " return oredr deleveries
        APPEND l_wa_vbtyp TO l_r_vbtyp.
        CLEAR:l_wa_vbtyp-low.

        l_wa_vbtyp-low = l_c_u."performa
        APPEND l_wa_vbtyp TO l_r_vbtyp.
        CLEAR:l_wa_vbtyp-low.

        l_wa_vbtyp-low = l_c_m." invoice
        APPEND l_wa_vbtyp TO l_r_vbtyp.
        CLEAR:l_wa_vbtyp-low.

**      fetch values of delivery and invoice from document table

        SELECT vbelv
               posnv
               vbeln
               posnn
               vbtyp_n
*               rfmng
               vbtyp_v
               erdat "MOD-008
               erzet "MOD-008
         FROM vbfa INTO TABLE i_vbfa
         FOR ALL ENTRIES IN i_vbak
         WHERE vbelv = i_vbak-vbeln
         AND vbtyp_n IN l_r_vbtyp.
        IF sy-subrc IS INITIAL.
          SORT i_vbfa.
        ENDIF.

**fetch shipment related values
        CLEAR: l_i_vbfa[].
        l_i_vbfa[] = i_vbfa[].
        CLEAR: l_r_vbtyp[].

**        filling range
        CLEAR:l_wa_vbtyp.
        l_wa_vbtyp-sign = l_c_i.
        l_wa_vbtyp-option = l_c_eq.

        l_wa_vbtyp-low = l_c_j. " delivery
        APPEND l_wa_vbtyp TO l_r_vbtyp.
        CLEAR:l_wa_vbtyp-low.


        l_wa_vbtyp-low = l_c_t. " return oredr deleveries
        APPEND l_wa_vbtyp TO l_r_vbtyp.
        CLEAR:l_wa_vbtyp-low.
**keeping the deliveries  data
        DELETE l_i_vbfa WHERE vbtyp_n NOT IN l_r_vbtyp.
        IF l_i_vbfa[] IS NOT INITIAL.
*Begin of Insert MOD-020
*get the quantities from lips
*        MOD-021: de-duplicate the driving table on the exact fields
*        used in the WHERE clause (VBELN/POSNN) before FOR ALL ENTRIES,
*        so the DB does not get redundant OR-conditions for order
*        items that share the same delivery/delivery-item combination.
          l_i_vbfa_lips[] = l_i_vbfa[].
          SORT l_i_vbfa_lips BY vbeln posnn.
          DELETE ADJACENT DUPLICATES FROM l_i_vbfa_lips
                                     COMPARING vbeln posnn.
*         MOD-023: CDS view I_DeliveryDocumentItem instead of direct
*         LIPS access; fields aliased back to the original LIPS names.
*         REFERENCESDDOCUMENTITEM is the least certain field name of
*         this set - verify all view/field names in SE11 before
*         transport.
          SELECT deliverydocument        AS vbeln,
          deliverydocumentitem           AS posnr,
          actualdeliveryquantity         AS lfimg,
          referencesddocumentitem        AS vgpos
          FROM i_deliverydocumentitem
          INTO TABLE @i_lips
          FOR ALL ENTRIES IN @l_i_vbfa_lips
          WHERE deliverydocument = @l_i_vbfa_lips-vbeln
          AND deliverydocumentitem = @l_i_vbfa_lips-posnn.
          IF sy-subrc IS NOT INITIAL.
            CLEAR:i_lips[].
          ENDIF.
          SORT l_i_vbfa BY vbeln.
          DELETE ADJACENT DUPLICATES FROM l_i_vbfa COMPARING vbeln.
*End of Insert MOD-020
          SELECT vbelv
                 posnv
                 vbeln
                 posnn
                 vbtyp_n
*                 rfmng
                 vbtyp_v
           FROM vbfa INTO TABLE i_vbfa_ship
           FOR ALL ENTRIES IN l_i_vbfa
           WHERE vbelv = l_i_vbfa-vbeln
           AND vbtyp_n = l_c_8.
          IF sy-subrc IS INITIAL.
            IF i_vbfa_ship[] IS NOT INITIAL.
" *****Code Remediation changes S4 2025_S Conversion **begin of change by EJX9007360 2026.06.09 ATC
* SELECT tknum
* BOC MOD-008
* erdat erzet dtabf uzabf dptbg sttrg " added in MOD-019 by S422335
* EOC MOD-008
* /bev1/rpfar1
* FROM vttk INTO TABLE i_vttk
              SELECT tknum
              erdat erzet dtabf uzabf dptbg sttrg
                     /bev1/rpfar1
                FROM vttk INTO TABLE i_vttk "#EC CI_USAGE_OK[2270199]
                FOR ALL ENTRIES IN i_vbfa_ship
                WHERE tknum = i_vbfa_ship-vbeln.
" *****Code Remediation changes S4 2025_S Conversion **end of change by EJX9007360 2026.06.09 ATC
              IF sy-subrc IS INITIAL.
                SORT i_vttk BY tknum.
              ENDIF.

            ENDIF.


          ENDIF.
**            get the quantities from lips
*Begin of comment MOD-020
*          SELECT vbeln
*                 posnr
*                 lfimg
*                 vgpos
*                 FROM lips
*            INTO TABLE i_lips
*            FOR ALL ENTRIES IN l_i_vbfa
*            WHERE vbeln = l_i_vbfa-vbeln
*            AND posnr = l_i_vbfa-posnn.
*
*          IF sy-subrc IS NOT INITIAL.
*            CLEAR:i_lips[].
*          ENDIF.
*End of comment MOD-020
        ENDIF.
**
**      EOC BY S172466 MOD-003 Defect 1813
**      BOC BY S172466 MOD-001 ETE Defect 348

*      **Select on shxt to fetch the langauage
        SELECT  tdobject
                tdname
                tdid
                tdspras
          FROM stxh
          INTO TABLE i_stxh
          FOR ALL ENTRIES IN i_vbak
          WHERE tdobject = c_hobj
          AND tdname = i_vbak-vbeln_new
          AND tdid = c_txtid1.
        IF sy-subrc IS NOT INITIAL.
          CLEAR: i_stxh[].
        ENDIF.
      ENDIF.
**      EOC BY S172466 MOD-001 ETE Defect 348
*-- Select only Open orders
      IF rb_o_ord = c_x AND i_vbap[] IS NOT INITIAL.
**fill range for Sales ordr status (LFSTA)**
        l_wa_lfgsa-sign = l_c_i.
        l_wa_lfgsa-option = l_c_eq.
        l_wa_lfgsa-low = c_stat1.
        APPEND l_wa_lfgsa TO l_r_lfgsa.

        CLEAR: l_wa_lfgsa-low.
        l_wa_lfgsa-low = c_stat2.
        APPEND l_wa_lfgsa TO l_r_lfgsa.

        SELECT vbeln
               posnr
               lfgsa
          FROM VBAP
          INTO TABLE i_vbup
          FOR ALL ENTRIES IN i_vbap
          WHERE vbeln = i_vbap-vbeln
          AND   posnr = i_vbap-posnr
          AND   lfgsa IN l_r_lfgsa .
        IF sy-subrc IS NOT INITIAL.
          CLEAR: i_vbup[].
        ENDIF.

      ENDIF.
*--Schedule Line Details
      SELECT vbeln
             posnr
             etenr
             edatu
**        **      BOC BY S172466 MOD-003 Defect 1813
*             wmeng
*             bmeng
*        **      BOC BY S172466 MOD-003 Defect 1813
        FROM vbep
        INTO TABLE i_vbep
        FOR ALL ENTRIES IN i_vbap
        WHERE vbeln = i_vbap-vbeln
        AND   posnr = i_vbap-posnr.
      IF sy-subrc IS NOT INITIAL.
        CLEAR: i_vbep[].
      ENDIF.

*--Ship To Party
**removing duplicates**
      CLEAR: l_i_vbap.
      l_i_vbap[] = i_vbap[].
      SORT l_i_vbap BY vbeln.
      DELETE ADJACENT DUPLICATES FROM l_i_vbap COMPARING vbeln.
      SELECT vbeln
             posnr
             parvw
             kunnr
        INTO TABLE i_vbpa
        FROM vbpa
*Start of Comment MOD-020
*        FOR ALL ENTRIES IN  i_vbap
*        WHERE vbeln = i_vbap-vbeln
*End of comment MOD-020
*Start of Insert MOD-020
        FOR ALL ENTRIES IN l_i_vbap
        WHERE vbeln = l_i_vbap-vbeln
*End of Insert MOD-020
*--Start of commenting for MOD-010
*        AND parvw = c_ship
*--End of commenting for MOD-010
*--Start of addition for MOD-010
        AND parvw IN l_i_partner
*--End of addition for MOD-010
        AND kunnr IN s_kunnr1.
      IF sy-subrc IS NOT INITIAL.
        CLEAR: i_vbpa[].
*    Begin of change in MOD-019 BY s422335
      ELSE.
        l_i_vbpa[] = i_vbpa[].
        SORT l_i_vbpa BY kunnr.
        DELETE ADJACENT DUPLICATES FROM l_i_vbpa COMPARING kunnr.
        SELECT zkzkunnrfnb zkhaistimf zkhaistimt
        FROM /ccej/tzktsd0042
        INTO TABLE i_t42
        FOR ALL ENTRIES IN l_i_vbpa
        WHERE zkzkunnrfnb = l_i_vbpa-kunnr.
        IF sy-subrc IS INITIAL.
          SORT i_t42 BY zkzkunnrfnb.
        ENDIF.
*    End of change in MOD-019
      ENDIF.

*--Sales Center and Route
      SELECT vbeln
             posnr
             ihrez
             ihrez_e
        INTO TABLE i_vbkd
        FROM vbkd
*Begin of comment MOD-020
*        FOR ALL ENTRIES IN i_vbap
*        WHERE vbeln = i_vbap-vbeln
*End of comment MOD-020
*Begin of Insert MOD-020
        FOR ALL ENTRIES IN l_i_vbap
        WHERE vbeln = l_i_vbap-vbeln
*End of Insert MOD-020
          AND posnr = l_c_header."MOD-015

      IF sy-subrc IS NOT INITIAL.
        CLEAR: i_vbkd[].
      ENDIF.


**for material description**
      CLEAR: l_i_vbap.
      l_i_vbap[] = i_vbap[].
      SORT l_i_vbap BY matnr.
      DELETE ADJACENT DUPLICATES FROM l_i_vbap COMPARING matnr.
      IF l_i_vbap[] IS NOT INITIAL.
*       MOD-023: CDS view I_ProductDescription instead of direct MAKT
*       access; fields aliased back to the original MAKT names so
*       nothing downstream changes. Verify view/field names in SE11
*       before transport.
        SELECT product            AS matnr,
               productdescription AS maktx
            FROM i_productdescription
          INTO TABLE @i_makt
          FOR ALL ENTRIES IN @l_i_vbap
          WHERE product  = @l_i_vbap-matnr
          AND   language = @sy-langu.
        IF sy-subrc IS NOT INITIAL.
          CLEAR: i_makt[].
        ENDIF.

      ENDIF.

    ENDIF.

*--Sold-To-Party Name and Ship-To-Party Name
**cleraing tables**
    CLEAR: l_i_vbpa[], l_i_vbak[].
**    getting unique recode of customer from vbpa for ship to party
**     transfer the records of vbpa to a local table
    l_i_vbpa[] = i_vbpa[].
**    check for vbpa initial
    IF l_i_vbpa IS NOT INITIAL.
**      sort by customer
      SORT l_i_vbpa BY kunnr.
**      remove duplicate records by customer
      DELETE ADJACENT DUPLICATES FROM l_i_vbpa COMPARING kunnr.

**    getting unique customers from vbak for sold to party
      l_i_vbak[] = i_vbak[].
**      sort by customer
      SORT l_i_vbak BY kunnr.
**    get unique customers from vbak
      DELETE ADJACENT DUPLICATES FROM l_i_vbak COMPARING kunnr.
**       loop and tranfer vbak customers to same temp. table
      LOOP AT l_i_vbak ASSIGNING <l_fs_vbak>.
        l_wa_vbpa-kunnr = <l_fs_vbak>-kunnr.
        APPEND l_wa_vbpa TO l_i_vbpa.
        CLEAR: l_wa_vbpa.
      ENDLOOP.
**      sort again
      SORT l_i_vbpa BY kunnr.
      DELETE ADJACENT DUPLICATES FROM l_i_vbpa COMPARING kunnr.
      IF l_i_vbpa IS NOT INITIAL.

        SELECT kunnr
               name1
               /ccc/gedatnr "MOD-008
          INTO TABLE i_kna1
          FROM kna1
          FOR ALL ENTRIES IN  l_i_vbpa
          WHERE kunnr = l_i_vbpa-kunnr.
      ENDIF.
    ENDIF.

**BOC BY S172466 MOD-008 Defcet 3146
**if there is any entry in table vbuv for a particular sales order
*it will be considered as an incomplete order
    SELECT vbeln
           posnr
      FROM vbuv INTO TABLE i_vbuv
      FOR ALL ENTRIES IN i_vbak
      WHERE vbeln EQ i_vbak-vbeln.
    IF sy-subrc IS NOT INITIAL.
      CLEAR: i_vbuv[].
    ELSEIF sy-subrc IS INITIAL.
      SORT i_vbuv BY vbeln posnr.
    ENDIF.


**fetch Billing header details
    IF i_vbfa[] IS NOT INITIAL.
      CLEAR: l_i_vbfa[].
      l_i_vbfa[] = i_vbfa[].
      CLEAR: l_r_vbtyp[].

**        filling range
      CLEAR:l_wa_vbtyp.
      l_wa_vbtyp-sign = l_c_i.
      l_wa_vbtyp-option = l_c_eq.

      l_wa_vbtyp-low = l_c_u. " performa
      APPEND l_wa_vbtyp TO l_r_vbtyp.
      CLEAR:l_wa_vbtyp-low.


      l_wa_vbtyp-low = l_c_m. "invoice
      APPEND l_wa_vbtyp TO l_r_vbtyp.
      CLEAR:l_wa_vbtyp-low.
**keeping the Invoice  data
      DELETE l_i_vbfa WHERE vbtyp_n NOT IN l_r_vbtyp.
      SORT l_i_vbfa BY vbeln.
      DELETE ADJACENT DUPLICATES FROM l_i_vbfa
      COMPARING vbeln.
      IF l_i_vbfa[] IS NOT INITIAL.
*Begin of comment MOD-020
*     Get Invoice header details
*        SELECT vbeln erzet erdat
*         FROM vbrk INTO TABLE i_vbrk
*         FOR ALL ENTRIES IN l_i_vbfa
*         WHERE vbeln = l_i_vbfa-vbeln.
*        IF sy-subrc IS INITIAL.
*          SORT i_vbrk BY vbeln.
*End of comment MOD-020
*     Get Invoice item details
*       MOD-023: CDS view I_BillingDocumentItem instead of direct
*       VBRP access; fields aliased back to the original VBRP names.
*       Verify view/field names in SE11 before transport.
        SELECT billingdocument AS vbeln,
               billingdocumentitem AS posnr,
               billingquantity AS fkimg
         FROM i_billingdocumentitem INTO TABLE @i_vbrp
*Bgein of comment MOD-020
*            FOR ALL ENTRIES IN i_vbrk
*            WHERE vbeln = i_vbrk-vbeln.
*End of comment MOD-020
*Begin of insert MOD-020
         FOR ALL ENTRIES IN @l_i_vbfa
         WHERE billingdocument = @l_i_vbfa-vbeln.
*End of insert MOD-020
        IF sy-subrc IS INITIAL.
          SORT i_vbrp BY vbeln posnr.
        ENDIF.
*        ENDIF.  --MOD-020
      ENDIF.
    ENDIF.
**EOC BY S172466 MOD-008 Defcet 3146
  ENDIF.





ENDFORM.                    " F_GET_DATA
*&---------------------------------------------------------------------*
*&      Form  F_DISPLAY_ALV
*&---------------------------------------------------------------------*
*       Display ALV
*----------------------------------------------------------------------*
FORM f_display_alv .

*-- ALV display
  PERFORM f_grid_display.

ENDFORM.                    " F_DISPLAY_ALV
*&---------------------------------------------------------------------*
*&      Form  F_GRID_DISPLAY
*&---------------------------------------------------------------------*
*       Grid display
*----------------------------------------------------------------------*
FORM f_grid_display .

  DATA: l_o_exc TYPE REF TO cx_salv_msg,  " class Object for exceptions
       l_v_exc_msg TYPE string. "For exception messages

  i_final[] = i_alv[].

  TRY.
      cl_salv_table=>factory(
        EXPORTING
          list_display = if_salv_c_bool_sap=>false
        IMPORTING
          r_salv_table = o_table
        CHANGING
          t_table      = i_final ).

    CATCH cx_salv_msg INTO l_o_exc.
      l_v_exc_msg = l_o_exc->get_text( ).
      MESSAGE l_v_exc_msg TYPE c_error.

  ENDTRY.

* ====To Set the columns headings, width and F4 help==================
  PERFORM f_prep_fcat.
* ===== To set the PF status for Application Tool Bar =================
  PERFORM f_set_pf.
* ===== To set the Layout for ALV display ==============================
  PERFORM f_set_layout.
* ===== To get the Select Column at left most of ALV display ===========
  "It's for selection of multiple Records from ALV for further actions
  PERFORM f_get_sel_fct.
* ===== To Handle User Command After ALV Display ======================
  "To handle custom buttons (Deactivate/Update/Repost) at Application
  "Tool Bar of ALV
  PERFORM f_handle_ucomm .
* ====================== To Display ALV ================================
  o_table->display( ).

ENDFORM.                    " F_GRID_DISPLAY
*&---------------------------------------------------------------------*
*&      Form  F_INITIALIZE
*&---------------------------------------------------------------------*
*       Initialize global tables and variables
*----------------------------------------------------------------------*
FORM f_initialize .
**clearing tables and workarea**
  CLEAR : i_alv,
          i_vbak,

          i_kschl,
          i_vbap,
          i_vbpa,
          i_kna1,
          i_vbkd,
          i_vbep,
          i_vbup,
          i_konv,
          v_sel_line,
          v_tot_lines,

          i_auth_werks,
          i_auth_vkorg,
          i_sel_orders.
**  clearing variables
  CLEAR:v_char4,
        v_vkorg ,
        v_vtweg ,
        v_spart ,
        v_vbeln ,
        v_erdat ,
        v_erzet ,
        v_ernam ,
        v_auart ,
        v_augru ,
        v_vsbed ,
        v_bsark ,
        v_kunnr ,
        v_vdatu ,
        v_bstnk ,
        v_vkbur ,
        v_vkgrp,
        v_matnr ,
        v_pstyv ,
        v_werks,
        v_abgru ,
        v_vstel,
*        v_route, defect 1597
        v_atwrt ,
        v_com_sc ,
        v_del_sc,
        v_days,
        v_lines.
**get value from tvarvc for no of days**
  PERFORM f_get_days.

ENDFORM.                    " F_INITIALIZE
*&---------------------------------------------------------------------*
*&      Form  F_LAYOUT_F4
*&---------------------------------------------------------------------*
*       F4 help for ALV layout
*----------------------------------------------------------------------*
FORM f_layout_f4 .

  wa_variant-report = sy-repid.

  CALL FUNCTION 'REUSE_ALV_VARIANT_F4'
    EXPORTING
      is_variant    = wa_variant
      i_save        = c_x
    IMPORTING
      es_variant    = wa_variant
    EXCEPTIONS
      not_found     = 1
      program_error = 2
      OTHERS        = 3.
  IF sy-subrc <> 0.
    MESSAGE ID sy-msgid TYPE c_succ NUMBER sy-msgno
            WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
  ELSE.
    p_layout = wa_variant-variant.
  ENDIF.

ENDFORM.                    " F_LAYOUT_F4
*&---------------------------------------------------------------------*
*&      Form  F_PROCESS_DATA
*&---------------------------------------------------------------------*
*       Read the data that has been retrieved from tables in F_GET_DATA
*----------------------------------------------------------------------*
FORM f_process_data .
  CONSTANTS:  l_c_curr TYPE waers_curc VALUE 'JPY'," MOD-002
**               BOC BY S172466 MOD-003 Defcet 1813
             l_c_j TYPE VBTYPL_N VALUE 'J'," delivery
             l_c_t TYPE VBTYPL_N VALUE 'T',"return order deleveries
             l_c_u TYPE VBTYPL_N VALUE 'U'," performa
             l_c_m TYPE VBTYPL_N VALUE 'M'," invoice
             l_c_8 TYPE VBTYPL_N VALUE '8'," shipment
             l_c_first_item TYPE posnr_va VALUE '000010',"MOD-008
**               EOC BY S172466 MOD-003 Defcet 1813
** BOC BY S172466 MOD-011**
             l_c_i TYPE sign VALUE 'I',
             l_c_eq TYPE option VALUE 'EQ'.
** EOC BY S172466 MOD-011**
  DATA: l_wa_alv TYPE /ccej/slss_so_maint_out,
        l_wa_wi TYPE /ccej/slss_wrkinst,
        l_v_tabix TYPE sytabix," MOD-001
        l_v_count TYPE i," MOD-001
        l_v_val TYPE kbetr_kond," MOD-002 defect 1553
        l_v_val1 TYPE kbetr_kond," MOD-011
        l_v_kbetr TYPE bapicurr-bapicurr," MOD-002 defect 1553
        l_v_kbetr1 TYPE bapicurr-bapicurr," MOD-011
        l_v_dmbtr TYPE bapicurr-bapicurr," MOD-002
        l_v_index TYPE sy-tabix," MOD-004
        l_v_flag TYPE flag," MOD-007
**         BOC BY S172466 MOD-011
        l_r_kschl TYPE RANGE OF kschl,
        l_wa_kschl LIKE LINE OF l_r_kschl,
        l_i_konv TYPE STANDARD TABLE OF ty_konv.
**         EOC BY S172466 MOD-0011

  DATA:l_v_zone TYPE tznzone. "MOD-009

*  MOD-024: L_O_WI (/CCEJ/CL_SLS_UTIL_SOVALRET) was only called from
*  the two commented-out GET_WORK_INST blocks below, dead since
*  MOD-020 replaced that logic with the L_I_TEXT/READ_MULTIPLE_TEXTS
*  approach - removed the now-unused instantiation.
  DATA:l_v_syno_dynpro TYPE /ccej/mdm_zkzdengrpcd.

*-----Field Symbols
  FIELD-SYMBOLS : <l_fs_vbpa> TYPE ty_vbpa,
                  <l_fs_kunnr1> TYPE ty_kna1,
                  <l_fs_kunnr2> TYPE ty_kna1," MOD-004
                  <l_fs_vbep> TYPE ty_vbep,
                  <l_fs_vbkd> TYPE ty_vbkd,
                  <l_fs_vbap> TYPE ty_vbap,
                  <l_fs_makt> TYPE ty_makt,
                  <l_fs_konv> TYPE ty_konv," MOD-001
                  <l_fs_konv1> TYPE ty_konv," MOD-001
                  <l_fs_konv2> TYPE ty_konv," MOD-011
                  <l_fs_a595> TYPE ty_a595," MOD-001
**                  BOC Y S172466 MOD-003 Defcet 1813
                  <l_fs_vbfa> TYPE ty_vbfa,
                  <l_fs_lips> TYPE ty_lips,
                  <l_fs_lips1> TYPE ty_lips,
                  <l_fs_knvv> TYPE ty_knvv,
                  <l_fs_t42> TYPE ty_t42, " added in MOD-019 by S422335
                  <l_fs_vbfa_ship> TYPE ty_vbfa,
                  <l_fs_vttk> TYPE ty_vttk,
**                  EOC Y S172466 MOD-003 Defcet 1813
                   <l_fs_vbak> TYPE ty_vbak," MOD-004
*                  BOC MOD-008
                   <l_fs_vbrp> TYPE ty_vbrp,
*                  EOC MOD-008
*--Start of addition for MOD-010
                   <l_fs_vbpa_1> TYPE ty_vbpa,
                   <l_fs_kunnr_3> TYPE ty_kna1.
*--End of addition for MOD-010
*Begin of changes MOD-020
  DATA: l_i_name TYPE tspsrname,
        l_wa_name TYPE stxdrname,
        l_v_lines TYPE i,
        l_i_tdid TYPE tspsrid,
        l_i_text TYPE text_lh,
        l_i_text_tmp TYPE text_lh,
        l_v_line TYPE sy-tabix.
  FIELD-SYMBOLS: <l_fs_text> TYPE itclh,
                 <l_wa_tdline> TYPE tline.
  CONSTANTS: l_c_txtid1 TYPE tdid VALUE 'Z911',
             l_c_txtid2 TYPE tdid VALUE 'Z918',
             l_c_txtid3 TYPE tdid VALUE 'YJ03',
             l_c_txtid4 TYPE tdid VALUE 'YJ04',
             l_c_txtid5 TYPE tdid VALUE 'YJ05'.
*End of changes MOD-020
*Begin of MOD-009 for defect 3146
*  Get the User profile Time zone
  CLEAR:l_v_zone.
  SELECT SINGLE tzone FROM usr02
    INTO l_v_zone
    WHERE bname = sy-uname.
  IF sy-subrc IS NOT INITIAL.
    CLEAR:l_v_zone.
  ENDIF.
*  End of MOD-009 for defect 3146

**  sorting of various tables
**  MOD-022: restored (see MOD-022 log in TOP include) - these tables
**  are STANDARD TABLE again, so they must be explicitly sorted here
**  before the READ TABLE ... BINARY SEARCH calls below/later in this
**  form can rely on their order.
  SORT i_vbap BY vbeln posnr.
  SORT i_vbak BY vbeln.
  SORT i_konv BY knumv kposn kschl.
  SORT i_a595 BY knumh.
**   BOC BY S172466 MOD-007 Defcet 3044
*  SORT i_vbep BY vbeln posnr.
  SORT i_vbep BY vbeln posnr etenr.
**   EOC BY S172466 MOD-007 Defect 3044
*--Start of commenting for MOD-010
*  SORT i_vbpa BY vbeln posnr.
*--End of commenting for MOD-010
*--Start of addition for MOD-010
  SORT i_vbpa BY vbeln parvw.
*--End of addition for MOD-010
  SORT i_vbkd BY vbeln.
  SORT i_kna1 BY kunnr.
  SORT i_vbup BY vbeln posnr.
  SORT i_makt BY matnr.
  SORT i_stxh BY tdobject tdname tdid tdspras." MOD-001
**  BOC BY S172466 MOD-003 Defect 1813
  SORT i_knvv BY kunnr.
  SORT i_vbfa BY vbelv vbtyp_n posnv posnn.
  SORT i_vbfa_ship BY vbelv vbtyp_n.
  SORT i_lips BY vbeln posnr vgpos.

**  EOC BY S172466 MOD-003 Defect 1813
** BOC BY S172466 MOD-004
**  BOC BY S172466 MOD-008
  l_i_konv[] = i_konv[].
**  create range  for the new condition types.
  l_wa_kschl-sign = l_c_i.
  l_wa_kschl-option = l_c_eq.
  l_wa_kschl-low = c_kschl_yjbl."YJBL  Bottle Lease
  APPEND l_wa_kschl TO l_r_kschl.
  CLEAR: l_wa_kschl.

  l_wa_kschl-sign = l_c_i.
  l_wa_kschl-option = l_c_eq.
  l_wa_kschl-low = c_kschl_yjsl."  YJSL	Crate Lease
  APPEND l_wa_kschl TO l_r_kschl.

  DELETE l_i_konv WHERE kschl IN l_r_kschl.

**   EOC bY S172466 MOD-008
*Begin of comment MOD-020
*  LOOP AT i_vbak ASSIGNING <l_fs_vbak>.
*    l_wa_vbeln-vbeln = <l_fs_vbak>-vbeln.
*    APPEND l_wa_vbeln TO l_i_vbeln.
*    CLEAR: l_wa_vbeln.
*  ENDLOOP.
*End of comment MOD-020
*Begin of Insert MOD-020
  l_wa_name-sign = l_c_i.
  l_wa_name-option = l_c_eq.
*  MOD-022: this range only depends on constants, not on the current
*  <l_fs_vbak> row, so it is fetched once here, before the loop,
*  instead of via a lazily-guarded SELECT lexically inside the LOOP
*  below - avoids a SELECT statement inside a loop altogether.
  SELECT
  sign
  opti AS option
  low
  high
  FROM tvarvc
  INTO CORRESPONDING FIELDS OF TABLE l_i_tdid
  WHERE name = /ccej/cl_sls_util_sovalret=>cc_ty_vnam
  AND type = /ccej/cl_sls_util_sovalret=>cc_ty_kind.
  IF sy-subrc = 0.
    LOOP AT i_vbak ASSIGNING <l_fs_vbak>.
      IF <l_fs_vbak>-auart NOT IN i_jdc_auart.
        l_wa_name-low = <l_fs_vbak>-vbeln.
        APPEND l_wa_name TO l_i_name.
        l_v_lines = l_v_lines + 1.
        IF l_v_lines = 1000.
          CALL FUNCTION 'READ_MULTIPLE_TEXTS'
            EXPORTING
              object                  = 'VBBK'
              name_ranges             = l_i_name
              id_ranges               = l_i_tdid
            IMPORTING
              text_table              = l_i_text_tmp
*             ERROR_TABLE             =
            EXCEPTIONS
              wrong_access_to_archive = 1
              OTHERS                  = 2.
          IF sy-subrc <> 0.
*           Text read failed for this batch - continue without work
*           instruction free-text for these orders rather than abort
*           the whole report; ensure no partial data is carried forward.
            CLEAR: l_i_text_tmp.
          ENDIF.
          APPEND LINES OF l_i_text_tmp TO l_i_text.
          CLEAR: l_i_text_tmp, l_i_name, l_v_lines.
        ENDIF.
      ENDIF.
    ENDLOOP.
  ENDIF.
  IF l_i_name IS NOT INITIAL.
    CALL FUNCTION 'READ_MULTIPLE_TEXTS'
      EXPORTING
        object                  = 'VBBK'
        name_ranges             = l_i_name
        id_ranges               = l_i_tdid
      IMPORTING
        text_table              = l_i_text_tmp
*       ERROR_TABLE             =
      EXCEPTIONS
        wrong_access_to_archive = 1
        OTHERS                  = 2.
    IF sy-subrc <> 0.
*     Text read failed for this final batch - continue without work
*     instruction free-text for these orders rather than abort the
*     whole report; ensure no partial data is carried forward.
      CLEAR: l_i_text_tmp.
    ENDIF.
    APPEND LINES OF l_i_text_tmp TO l_i_text.
    CLEAR: l_i_text_tmp, l_i_name.
  ENDIF.
  SORT l_i_text BY header-tdname header-tdid header-tdspras.
*End of Insert MOD-020

 DATA lv_dec TYPE i.
  SELECT SINGLE decimals FROM i_currency
    WHERE currency = @l_c_curr INTO @lv_dec.
  IF sy-subrc <> 0.
    lv_dec = 2.                       " safe fallback = no shift
  ENDIF.
  DATA(lv_factor) = ipow( base = 10 exp = 2 - lv_dec ).
** BOC BY S172466 MOD-004
  LOOP AT i_vbap ASSIGNING <l_fs_vbap>.
**    BOC BY S172466 MOD-007 Defcet 3044
** BOC BY S172466 MOD-004
    AT NEW vbeln.

      IF <fs_vbak> IS ASSIGNED.
        UNASSIGN <fs_vbak>.
      ENDIF.
      READ TABLE i_vbak ASSIGNING <fs_vbak>
                        WITH KEY vbeln = <l_fs_vbap>-vbeln
                        BINARY SEARCH.
*-- Read the Sales center and Route
      IF <l_fs_vbkd> IS ASSIGNED.
        UNASSIGN <l_fs_vbkd>.
      ENDIF.
      READ TABLE i_vbkd ASSIGNING <l_fs_vbkd>
                        WITH KEY vbeln = <l_fs_vbap>-vbeln
                                 BINARY SEARCH.

*-- read the Ship-To Party
      IF <l_fs_vbpa> IS ASSIGNED.
        UNASSIGN <l_fs_vbpa>.
      ENDIF.
      READ TABLE i_vbpa ASSIGNING <l_fs_vbpa>
                        WITH KEY vbeln = <l_fs_vbap>-vbeln
                        "Start of addition for MOD-010
                                 parvw = c_ship
                        "End of addition for MOD-010
                                  BINARY SEARCH.
      IF <l_fs_vbpa> IS ASSIGNED.

*-- read the ship to party name
        IF <l_fs_kunnr1> IS ASSIGNED.
          UNASSIGN <l_fs_kunnr1>.
        ENDIF.
        READ TABLE i_kna1 ASSIGNING <l_fs_kunnr1>
                          WITH KEY kunnr = <l_fs_vbpa>-kunnr
                                   BINARY SEARCH .

      ENDIF.

      "Start of addition for MOD-010
      IF <l_fs_vbpa_1> IS ASSIGNED.
        UNASSIGN <l_fs_vbpa_1>.
      ENDIF.

      IF <l_fs_kunnr_3> IS ASSIGNED.
        UNASSIGN <l_fs_kunnr_3>.
      ENDIF.
**-- read the JDC code
      READ TABLE i_vbpa ASSIGNING <l_fs_vbpa_1>
                        WITH KEY vbeln = <l_fs_vbap>-vbeln
                        "Start of addition for MOD-010
                                 parvw = c_jdc
                        "End of addition for MOD-010
                                  BINARY SEARCH.
      IF <l_fs_vbpa_1> IS ASSIGNED.
**-- read the JDC name
        READ TABLE i_kna1 ASSIGNING <l_fs_kunnr_3>
*                          WITH KEY kunnr = <l_fs_vbpa>-kunnr" MOD-012
                          WITH KEY kunnr = <l_fs_vbpa_1>-kunnr " MOD-012
                                   BINARY SEARCH .
      ENDIF.

      "End of addition for MOD-010
      IF <l_fs_knvv> IS ASSIGNED.
        UNASSIGN <l_fs_knvv>.
      ENDIF.
      IF <fs_vbak> IS ASSIGNED.

        CLEAR: l_v_syno_dynpro.
        "Start of addition for MOD-014
        IF <fs_vbak>-vsnmr_v+10(1) EQ c_one
          AND <fs_vbak>-ktext IS INITIAL.
          "End of addition for MOD-014
**     fetch syno dynpro code
          PERFORM f_get_syno_dynpro USING <fs_vbak>-vbeln
                                    CHANGING l_v_syno_dynpro.
        ELSE. "++ MOD-014
*   Begin of addition for MOD-013|Defect#3886
          l_v_syno_dynpro = <fs_vbak>-ktext.
*   End of addition for MOD-013|Defect#3886
        ENDIF. "++ MOD-014
        READ TABLE i_knvv ASSIGNING <l_fs_knvv>
              WITH KEY kunnr = <fs_vbak>-kunnr
              BINARY SEARCH.


        CLEAR: l_wa_wi.
        "for JDC Order types not required.
        IF <fs_vbak>-auart NOT IN i_jdc_auart."MOD-015
*Begin of comment MOD-020
*          CALL METHOD l_o_wi->get_work_inst
*            EXPORTING
*              im_ordno               = <fs_vbak>-vbeln
***          BOC BY S172466 MOD-004
*              im_vbeln               = l_i_vbeln
***          EOC BY S172466 MOD-004
*            IMPORTING
*              ex_work_inst           = l_wa_wi
*            EXCEPTIONS
*              no_data_found          = 1
*              text_id_not_maintained = 2
*              read_text_fail         = 3
*              OTHERS                 = 4.
*End of comment MOD-020
*Begin of Insert MOD-020
          READ TABLE l_i_text TRANSPORTING NO FIELDS
                     WITH KEY header-tdname = <fs_vbak>-vbeln
                               BINARY SEARCH.
          IF sy-subrc = 0.
            l_v_index = sy-tabix.
            LOOP AT l_i_text ASSIGNING <l_fs_text> FROM l_v_index.
              IF <l_fs_text>-header-tdname <> <fs_vbak>-vbeln.
                EXIT.
              ENDIF.
              CASE <l_fs_text>-header-tdid.
                WHEN l_c_txtid1. " Text ID Z911
                  "Period Work instruction 1
                  READ TABLE <l_fs_text>-lines ASSIGNING <l_wa_tdline>
                  INDEX 1.
                  IF sy-subrc IS INITIAL.
                    l_wa_wi-work_ins1 = <l_wa_tdline>-tdline.
                  ENDIF.
                  IF <l_wa_tdline> IS ASSIGNED.
                    UNASSIGN <l_wa_tdline>.
                  ENDIF.
                WHEN l_c_txtid2. " Text ID Z918
                  READ TABLE <l_fs_text>-lines ASSIGNING <l_wa_tdline>
                  INDEX 1.
                  IF sy-subrc IS INITIAL.
                    "Period Work instruction 2
                    l_wa_wi-work_ins2 = <l_wa_tdline>-tdline.
                  ENDIF.
                  IF <l_wa_tdline> IS ASSIGNED.
                    UNASSIGN <l_wa_tdline>.
                  ENDIF.
                WHEN l_c_txtid3. " Text ID YJ03
                  READ TABLE <l_fs_text>-lines ASSIGNING <l_wa_tdline>
                  INDEX 1.
                  IF sy-subrc IS INITIAL.
                    "One time Work instruction 1
                    l_wa_wi-spl_work_ins1 = <l_wa_tdline>-tdline.
                  ENDIF.
                  IF <l_wa_tdline> IS ASSIGNED.
                    UNASSIGN <l_wa_tdline>.
                  ENDIF.
                WHEN l_c_txtid4. " Text ID YJ04
                  READ TABLE <l_fs_text>-lines ASSIGNING <l_wa_tdline>
                  INDEX 1.
                  IF sy-subrc IS INITIAL.
                    "One time Work instruction 2
                    l_wa_wi-spl_work_ins2 = <l_wa_tdline>-tdline.
                  ENDIF.
                  IF <l_wa_tdline> IS ASSIGNED.
                    UNASSIGN <l_wa_tdline>.
                  ENDIF.
                WHEN l_c_txtid5. " Text ID YJ05
                  CLEAR: l_v_line.
                  LOOP AT <l_fs_text>-lines ASSIGNING <l_wa_tdline>.
                    IF <l_wa_tdline>-tdformat IS NOT INITIAL.
                      l_v_line = l_v_line + 1.
                    ELSE.
                      l_v_line = sy-tabix.
                    ENDIF.
                    IF l_v_line EQ 1.
                      "One time Work instruction free text
                      CONCATENATE l_wa_wi-work_ins_free
                      <l_wa_tdline>-tdline
                      INTO l_wa_wi-work_ins_free.
                    ELSEIF l_v_line EQ 2.
                      "One time Work instruction free text
                      l_wa_wi-spe_delv_tim_f =
                      <l_wa_tdline>-tdline.
                    ELSEIF l_v_line EQ 3.
                      "One time Work instruction free text
                      l_wa_wi-spe_delv_tim_t =
                      <l_wa_tdline>-tdline.
                    ENDIF.
                  ENDLOOP.
                  IF <l_wa_tdline> IS ASSIGNED.
                    UNASSIGN <l_wa_tdline>.
                    CLEAR l_v_line.
                  ENDIF.
                WHEN OTHERS.
                  "Do nothing
              ENDCASE.
            ENDLOOP.
          ENDIF.
*End of Insert MOD-020
        ENDIF."MOD-015

        IF <l_fs_kunnr2> IS ASSIGNED.
          UNASSIGN <l_fs_kunnr2>.
        ENDIF.
* -- read the sold to party name
        READ TABLE i_kna1 ASSIGNING <l_fs_kunnr2>
                          WITH KEY kunnr = <fs_vbak>-kunnr
                          BINARY SEARCH .
      ENDIF.
    ENDAT." MOD-004
**    BOC BY S172466 MOD-007 Defcet 3044
*-- Select only Open orders
    IF rb_o_ord = c_x AND i_vbap[] IS NOT INITIAL.
      "Status equal to Not yet processed OR Partially processed

*     MOD-024: this is an existence check only - no field of I_VBUP is
*     ever read - so TRANSPORTING NO FIELDS avoids the field-symbol
*     assignment for every VBAP row that reaches here.
      READ TABLE i_vbup TRANSPORTING NO FIELDS
                        WITH KEY vbeln = <l_fs_vbap>-vbeln
                                 posnr = <l_fs_vbap>-posnr
                        BINARY SEARCH.
      IF sy-subrc IS NOT INITIAL.
**        to skip rest of the loop.
        CONTINUE.
      ENDIF.

    ENDIF.
*-- Item data
    l_wa_alv-posnr = <l_fs_vbap>-posnr.
    l_wa_alv-matnr = <l_fs_vbap>-matnr.
    READ TABLE i_makt ASSIGNING <l_fs_makt>
                     WITH KEY matnr =  <l_fs_vbap>-matnr
                     BINARY SEARCH.
    IF sy-subrc IS INITIAL.
      l_wa_alv-maktx = <l_fs_makt>-maktx.
    ENDIF.
    l_wa_alv-pstyv = <l_fs_vbap>-pstyv.
    l_wa_alv-werks = <l_fs_vbap>-werks.
    l_wa_alv-abgru = <l_fs_vbap>-abgru.
    l_wa_alv-vstel = <l_fs_vbap>-vstel.
*    l_wa_alv-route = <l_fs_vbap>-route.
    l_wa_alv-kwmeng = <l_fs_vbap>-kwmeng.
    l_wa_alv-klmeng = <l_fs_vbap>-klmeng."MOD-018
    l_wa_alv-vrkme = <l_fs_vbap>-vrkme.
    l_wa_alv-meins = <l_fs_vbap>-meins.
**    BOC BY S172466 MOD-002
*    l_wa_alv-netpr = <l_fs_vbap>-netpr.

    IF <l_fs_vbap>-netwr IS NOT INITIAL.
**   sum the amount value
*      CALL FUNCTION 'BAPI_CURRENCY_CONV_TO_EXTERNAL'
*        EXPORTING
*          currency        = l_c_curr
*          amount_internal = <l_fs_vbap>-netwr
*        IMPORTING
*          amount_external = l_v_dmbtr.
*      l_wa_alv-netwr = l_v_dmbtr .
l_wa_alv-netwr = <l_fs_vbap>-netwr * lv_factor.
    ENDIF.

**    EOC BY S172466 MOD-002
    l_wa_alv-atwrt = <l_fs_vbap>-/scl/atwrt.

*-- Read the schedule line details
    READ TABLE i_vbep ASSIGNING <l_fs_vbep>
                      WITH KEY vbeln = <l_fs_vbap>-vbeln
                      posnr = <l_fs_vbap>-posnr
                      BINARY SEARCH.
    IF <l_fs_vbep> IS ASSIGNED
      AND sy-subrc IS INITIAL.
      l_wa_alv-etenr = <l_fs_vbep>-etenr.
      l_wa_alv-edatu = <l_fs_vbep>-edatu.
**      BOC BY S172466 MOD-003 Defect 1813
*      l_wa_alv-wmeng = <l_fs_vbep>-wmeng.
*      l_wa_alv-bmeng = <l_fs_vbep>-bmeng.
**      EOC BY S172466 MOD-003 Defect 1813
    ENDIF.


*** BOC BY S172466 MOD-004
*    AT NEW vbeln.
*
*      IF <fs_vbak> IS ASSIGNED.
*        UNASSIGN <fs_vbak>.
*      ENDIF.
*      READ TABLE i_vbak ASSIGNING <fs_vbak>
*                        WITH KEY vbeln = <l_fs_vbap>-vbeln
*                        BINARY SEARCH.
**-- Read the Sales center and Route
*      IF <l_fs_vbkd> IS ASSIGNED.
*        UNASSIGN <l_fs_vbkd>.
*      ENDIF.
*      READ TABLE i_vbkd ASSIGNING <l_fs_vbkd>
*                        WITH KEY vbeln = <l_fs_vbap>-vbeln
*                                 BINARY SEARCH.
*
**-- read the Ship-To Party
*      IF <l_fs_vbpa> IS ASSIGNED.
*        UNASSIGN <l_fs_vbpa>.
*      ENDIF.
*      READ TABLE i_vbpa ASSIGNING <l_fs_vbpa>
*                        WITH KEY vbeln = <l_fs_vbap>-vbeln
*                                  BINARY SEARCH.
*      IF <l_fs_vbpa> IS ASSIGNED.
*
**-- read the ship to party name
*        IF <l_fs_kunnr1> IS ASSIGNED.
*          UNASSIGN <l_fs_kunnr1>.
*        ENDIF.
*        READ TABLE i_kna1 ASSIGNING <l_fs_kunnr1>
*                          WITH KEY kunnr = <l_fs_vbpa>-kunnr
*                                   BINARY SEARCH .
*
*      ENDIF.
*
*      IF <l_fs_knvv> IS ASSIGNED.
*        UNASSIGN <l_fs_knvv>.
*      ENDIF.
*      IF <fs_vbak> IS ASSIGNED.
*
*        CLEAR: l_v_syno_dynpro.
***     fetch syno dynpro code
*        PERFORM f_get_syno_dynpro USING <fs_vbak>-vbeln
*                                  CHANGING l_v_syno_dynpro.
*
*        READ TABLE i_knvv ASSIGNING <l_fs_knvv>
*              WITH KEY kunnr = <fs_vbak>-kunnr
*              BINARY SEARCH.
*
*
*        CLEAR: l_wa_wi.
*        CALL METHOD l_o_wi->get_work_inst
*          EXPORTING
*            im_ordno               = <fs_vbak>-vbeln
***          BOC BY S172466 MOD-004
*            im_vbeln               = l_i_vbeln
***          EOC BY S172466 MOD-004
*          IMPORTING
*            ex_work_inst           = l_wa_wi
*          EXCEPTIONS
*            no_data_found          = 1
*            text_id_not_maintained = 2
*            read_text_fail         = 3
*            OTHERS                 = 4.
*
*        IF <l_fs_kunnr2> IS ASSIGNED.
*          UNASSIGN <l_fs_kunnr2>.
*        ENDIF.
** -- read the sold to party name
*        READ TABLE i_kna1 ASSIGNING <l_fs_kunnr2>
*                          WITH KEY kunnr = <fs_vbak>-kunnr
*                          BINARY SEARCH .
*      ENDIF.
*    ENDAT." MOD-004

    IF <l_fs_vbpa> IS ASSIGNED.
      l_wa_alv-kunnr1 = <l_fs_vbpa>-kunnr.
    ENDIF.

    IF  <l_fs_kunnr1> IS ASSIGNED.

      l_wa_alv-name2 = <l_fs_kunnr1>-name1.

    ENDIF.

*--Start of addition for MOD-010
    IF <l_fs_vbpa_1> IS ASSIGNED.
      l_wa_alv-kunnr2 = <l_fs_vbpa_1>-kunnr.
    ENDIF.

    IF <l_fs_kunnr_3> IS ASSIGNED.
      l_wa_alv-name3 = <l_fs_kunnr_3>-name1.
    ENDIF.
*--End of addition for MOD-010

**Filter data based on Ship to
    IF s_kunnr1[] IS NOT INITIAL AND l_wa_alv-kunnr1 NOT IN s_kunnr1.
      CONTINUE.
    ENDIF.
*--start of addition for MOD-017
    IF s_jdc[] IS NOT INITIAL AND l_wa_alv-kunnr2 NOT IN s_jdc.
      CONTINUE.
    ENDIF.
*--End of addition for MOD-017
    IF <l_fs_vbkd> IS ASSIGNED.

      l_wa_alv-ihrez    = <l_fs_vbkd>-ihrez+0(4).
      l_wa_alv-ihrez1   = <l_fs_vbkd>-ihrez+4(4).
      l_wa_alv-ihrez_e  = <l_fs_vbkd>-ihrez_e+0(4).
      l_wa_alv-ihrez_e1 = <l_fs_vbkd>-ihrez_e+4(4).
    ENDIF.
**   output filtering based on selection screen comm. sales center
    IF s_com_sc[] IS NOT INITIAL AND
       l_wa_alv-ihrez NOT IN s_com_sc.
      CONTINUE.
    ENDIF.
**output filtering based on comm route
    IF s_com_rt[] IS NOT INITIAL AND
      l_wa_alv-ihrez1 NOT IN s_com_rt.
      CONTINUE.
    ENDIF.
**output filtering based on order sales center
    IF s_del_sc[] IS NOT INITIAL AND
      l_wa_alv-ihrez_e NOT IN s_del_sc.
      CONTINUE.
    ENDIF.
** output filtering based on order route
    IF s_del_rt[] IS NOT INITIAL AND
      l_wa_alv-ihrez_e1 NOT IN s_del_rt.
      CONTINUE.
    ENDIF.
*    IF sy-subrc IS INITIAL.
    IF <fs_vbak> IS ASSIGNED.

*-- Header data
      l_wa_alv-vbeln = <fs_vbak>-vbeln.
      l_wa_alv-vkorg = <fs_vbak>-vkorg.
      l_wa_alv-vtweg = <fs_vbak>-vtweg.
      l_wa_alv-spart = <fs_vbak>-spart.
      l_wa_alv-auart = <fs_vbak>-auart.

*Begin of MOD-009 for defect 3146
*Convert into local time and date based on time zone
      IF NOT <fs_vbak>-erdat IS INITIAL .
        PERFORM f_get_local_time USING  <fs_vbak>-erdat
              <fs_vbak>-erzet
              CHANGING  l_wa_alv-erdat
                  l_wa_alv-erzet.
      ENDIF.
*      l_wa_alv-erdat = <fs_vbak>-erdat.
*      l_wa_alv-erzet = <fs_vbak>-erzet.
*End of mMOD-009 for defect 3146

      l_wa_alv-ernam = <fs_vbak>-ernam.
      l_wa_alv-audat = <fs_vbak>-audat.
      l_wa_alv-augru = <fs_vbak>-augru.
      l_wa_alv-vsbed = <fs_vbak>-vsbed.
      l_wa_alv-bsark = <fs_vbak>-bsark.
      l_wa_alv-bstnk = <fs_vbak>-bstnk.
      l_wa_alv-bstdk = <fs_vbak>-bstdk.
*      l_wa_alv-refer = <fs_vbak>-ihrez.
      l_wa_alv-bname = <fs_vbak>-bname.
      l_wa_alv-vkbur = <fs_vbak>-vkbur.
      l_wa_alv-vkgrp = <fs_vbak>-vkgrp.
      l_wa_alv-kunnr = <fs_vbak>-kunnr.
      l_wa_alv-submi = <fs_vbak>-submi.
      l_wa_alv-tax   = <fs_vbak>-vsnmr_v+0(1).
      l_wa_alv-case_ind         = <fs_vbak>-vsnmr_v+1(1).
      l_wa_alv-promo_price      = <fs_vbak>-vsnmr_v+2(1).
      l_wa_alv-promo_summ       = <fs_vbak>-vsnmr_v+3(1).
      l_wa_alv-handl_typ        = <fs_vbak>-vsnmr_v+4(1).
      l_wa_alv-cont_typ         = <fs_vbak>-vsnmr_v+5(1).
      l_wa_alv-pr_round_typ     = <fs_vbak>-vsnmr_v+6(1).
      l_wa_alv-pr_round_digit   = <fs_vbak>-vsnmr_v+7(1).
      l_wa_alv-amt_round_typ    = <fs_vbak>-vsnmr_v+8(1).
      l_wa_alv-denpyo_class     = <fs_vbak>-vsnmr_v+9(1).
      l_wa_alv-slip_class       =  <fs_vbak>-vsnmr_v+10(1).
**      BOC BY S172466 MOD-003 defect 1813

*Visit List
      l_wa_alv-visitlist = <fs_vbak>-xblnr.


      IF <l_fs_knvv> IS ASSIGNED.
*Cash/Credit Indicator
        l_wa_alv-/ccej/knvv_zkzdeakbn = <l_fs_knvv>-/ccej/knvv_zkzdeakbn.
      ENDIF.
      READ TABLE i_vbfa ASSIGNING <l_fs_vbfa> WITH KEY vbelv = <fs_vbak>-vbeln
                                            vbtyp_n  = l_c_j
                                            posnv = <l_fs_vbap>-posnr
                                            BINARY SEARCH.
      IF sy-subrc IS NOT INITIAL.
        READ TABLE i_vbfa ASSIGNING <l_fs_vbfa> WITH KEY vbelv = <fs_vbak>-vbeln
                                                   vbtyp_n  = l_c_t
                                                   posnv = <l_fs_vbap>-posnr
                                                   BINARY SEARCH.

      ENDIF.
      IF sy-subrc IS INITIAL AND <l_fs_vbfa> IS ASSIGNED.
*Delivery Number
        l_wa_alv-delivery = <l_fs_vbfa>-vbeln.
*Delivery Item
        l_wa_alv-delivery_itm = <l_fs_vbfa>-posnn.

*BOC MOD-008
*Delivery Creation Date/Time
*Begin of mOD-009 for defect 3146
*Convert into local time and date based on time zone
        IF NOT <l_fs_vbfa>-erdat IS INITIAL.
          PERFORM f_get_local_time USING <l_fs_vbfa>-erdat
                <l_fs_vbfa>-erzet
                CHANGING  l_wa_alv-delivery_erdat
                    l_wa_alv-delivery_erzet.
        ENDIF.
*        l_wa_alv-delivery_erdat = <l_fs_vbfa>-erdat.
*        l_wa_alv-delivery_erzet = <l_fs_vbfa>-erzet.
*End of MOD-009 for defect 3146
*        READ TABLE i_likp ASSIGNING <l_fs_likp> WITH KEY vbeln = <l_fs_vbfa>-vbeln
*                                                         BINARY SEARCH.
*        IF sy-subrc IS INITIAL.
*          l_wa_alv-delivery_erdat = <l_fs_likp>-erdat.
*          l_wa_alv-delivery_erzet = <l_fs_likp>-erzet.
*        ENDIF.
*        IF <l_fs_likp> IS ASSIGNED.
*          UNASSIGN <l_fs_likp>.
*        ENDIF.
*EOC MOD-008
*Delivery Quantity
        READ TABLE i_lips ASSIGNING <l_fs_lips> WITH KEY vbeln = <l_fs_vbfa>-vbeln
                                                         posnr =  <l_fs_vbfa>-posnn
                                                         BINARY SEARCH.
        IF sy-subrc IS INITIAL.
          CLEAR: l_v_index.
          l_v_index = sy-tabix.
          l_wa_alv-delivery_qty = <l_fs_lips>-lfimg.
          IF l_wa_alv-delivery_qty IS INITIAL.
            LOOP AT i_lips ASSIGNING <l_fs_lips1> FROM l_v_index WHERE vgpos =
                                                       <l_fs_vbfa>-posnv."++MOD-016
*              <l_fs_lips>-posnr ."--MOD-016
              IF <l_fs_lips1>-vbeln = <l_fs_lips>-vbeln.
                l_wa_alv-delivery_qty =  l_wa_alv-delivery_qty + <l_fs_lips1>-lfimg.
              ELSE.
                EXIT.
              ENDIF.


            ENDLOOP.
          ENDIF.
        ENDIF.


        READ TABLE i_vbfa_ship ASSIGNING <l_fs_vbfa_ship> WITH KEY vbelv = <l_fs_vbfa>-vbeln
                                                                vbtyp_n = l_c_8
                                                                BINARY SEARCH.
        IF sy-subrc IS INITIAL.
*Shipment Number
          l_wa_alv-tknum = <l_fs_vbfa_ship>-vbeln.
          READ TABLE i_vttk ASSIGNING <l_fs_vttk> WITH KEY tknum = <l_fs_vbfa_ship>-vbeln
          BINARY SEARCH.
          IF sy-subrc IS INITIAL.
*Route
            l_wa_alv-route = <l_fs_vttk>-/bev1/rpfar1+6(4).
            l_wa_alv-dptbg = <l_fs_vttk>-dptbg. " added in MOD-019 by S422335
*           BOC MOD-008
*            *Begin of MOD-009 for defect 3146
*Convert into local time and date based on time zone
            IF NOT  <l_fs_vttk>-erdat IS INITIAL.
              PERFORM f_get_local_time USING <l_fs_vttk>-erdat
                    <l_fs_vttk>-erzet
                    CHANGING   l_wa_alv-tknum_erdat
                      l_wa_alv-tknum_erzet.
            ENDIF.
*            l_wa_alv-tknum_erdat = <l_fs_vttk>-erdat.
*            l_wa_alv-tknum_erzet = <l_fs_vttk>-erzet.
*         End of MOD-009 for defect 3146
            l_wa_alv-sttrg = <l_fs_vttk>-sttrg.
*           BOC MOD-008
*            *Begin of MOD-009 for defect 3146
*Convert into local time and date based on time zone
            IF p_tzone NE c_zone AND
               l_v_zone NE  c_zone.
              IF  NOT <l_fs_vttk>-dtabf IS INITIAL.
                PERFORM f_get_local_time USING  <l_fs_vttk>-dtabf
                       <l_fs_vttk>-uzabf
                      CHANGING    l_wa_alv-dtabf
                        l_wa_alv-uzabf.
              ELSE.
                l_wa_alv-dtabf = <l_fs_vttk>-dtabf.
                l_wa_alv-uzabf = <l_fs_vttk>-uzabf.
              ENDIF.
            ELSE.
              l_wa_alv-dtabf = <l_fs_vttk>-dtabf.
              l_wa_alv-uzabf = <l_fs_vttk>-uzabf.
            ENDIF.

*            l_wa_alv-dtabf = <l_fs_vttk>-dtabf.
*            l_wa_alv-uzabf = <l_fs_vttk>-uzabf.
*       End of MOD-009 for defect 3146
*           EOC MOD-008
          ENDIF.
        ENDIF.
      ENDIF.
      READ TABLE i_vbfa ASSIGNING <l_fs_vbfa> WITH KEY vbelv = <fs_vbak>-vbeln
                                                 vbtyp_n  = l_c_u
                                                 posnv = <l_fs_vbap>-posnr
                                                 BINARY SEARCH.
      IF sy-subrc IS INITIAL.
*Pro forma Number
        l_wa_alv-proforma = <l_fs_vbfa>-vbeln.
*Proforma Item
        l_wa_alv-proforma_item = <l_fs_vbfa>-posnn.

*     BOC MOD-008
*Begin of mOD-009 for defect 3146
*Convert into local time and date based on time zone
        IF  NOT  <l_fs_vbfa>-erdat IS INITIAL.
          PERFORM f_get_local_time USING <l_fs_vbfa>-erdat
                <l_fs_vbfa>-erzet
                CHANGING  l_wa_alv-proforma_erdat
                   l_wa_alv-proforma_erzet.
        ENDIF.
*        l_wa_alv-proforma_erdat = <l_fs_vbfa>-erdat.
*        l_wa_alv-proforma_erzet = <l_fs_vbfa>-erzet.
*End of mOD-009 for defect 3146
*     EOC MOD-008
      ENDIF.
      READ TABLE i_vbfa ASSIGNING <l_fs_vbfa> WITH KEY vbelv = <fs_vbak>-vbeln
                                                 vbtyp_n  = l_c_m
                                                 posnv = <l_fs_vbap>-posnr
                                                 BINARY SEARCH.
      IF sy-subrc IS INITIAL.
*Billing
        l_wa_alv-billing = <l_fs_vbfa>-vbeln.
*Billing Item
        l_wa_alv-billing_itm = <l_fs_vbfa>-posnn.

*     BOC MOD-008
        READ TABLE i_vbrp ASSIGNING <l_fs_vbrp> WITH KEY vbeln = <l_fs_vbfa>-vbeln
                                                         posnr = <l_fs_vbfa>-posnn
                                                BINARY SEARCH.
        IF sy-subrc IS INITIAL.
          l_wa_alv-billing_qty = <l_fs_vbrp>-fkimg.
        ENDIF.
        IF <l_fs_vbrp> IS ASSIGNED.
          UNASSIGN <l_fs_vbrp>.
        ENDIF.
*     EOC MOD-008

      ENDIF.

**      EOC BY S172466 MOD-003 defect 1813
*
*      AT NEW vbeln.
*        CLEAR: l_v_syno_dynpro.
***     fetch syno dynpro code
*        PERFORM f_get_syno_dynpro USING <fs_vbak>-vbeln
*                                  CHANGING l_v_syno_dynpro.
*      ENDAT.
      IF l_v_syno_dynpro IS NOT INITIAL.
        l_wa_alv-sen_den_code     = l_v_syno_dynpro.
      ENDIF.


      IF <l_fs_kunnr2> IS ASSIGNED.

        l_wa_alv-name1 = <l_fs_kunnr2>-name1.
*       BOC MOD-008
        l_wa_alv-/ccc/gedatnr = <l_fs_kunnr2>-/ccc/gedatnr.
*       EOC MOD-008

      ENDIF.

      IF l_wa_wi IS NOT INITIAL.
        l_wa_alv-per_work_inst1 = l_wa_wi-work_ins1.
        l_wa_alv-per_work_inst2 = l_wa_wi-work_ins2.
        l_wa_alv-sp_work_inst1 = l_wa_wi-spl_work_ins1.
        l_wa_alv-sp_work_inst2 = l_wa_wi-spl_work_ins2.
        l_wa_alv-work_inst_text = l_wa_wi-work_ins_free.
        l_wa_alv-spe_delv_tim_f = l_wa_wi-spe_delv_tim_f.
        l_wa_alv-spe_delv_tim_t = l_wa_wi-spe_delv_tim_t.
      ENDIF.
**BOC BY S172466 MOD-001
*-- Read price details
*      READ TABLE i_konv ASSIGNING <l_fs_konv1> " MOD_011
      READ TABLE l_i_konv ASSIGNING <l_fs_konv1> " MOD-011
                        WITH  KEY knumv = <fs_vbak>-knumv
                                  kposn = <l_fs_vbap>-posnr
                                  BINARY SEARCH.
      IF sy-subrc IS INITIAL.
**        get the index
        CLEAR:l_v_tabix,
              l_v_flag." MOD-007
        l_v_tabix = sy-tabix.
**        set the counter
        l_v_count = 1.
**        loop to get the knumh number
*        LOOP AT i_konv ASSIGNING <l_fs_konv> FROM l_v_tabix. " MOD-011
        LOOP AT l_i_konv ASSIGNING <l_fs_konv> FROM l_v_tabix. " MOD-011
**        exit condition
          IF <l_fs_konv1>-knumv = <l_fs_konv>-knumv AND
             <l_fs_konv1>-kposn = <l_fs_konv>-kposn.

**BOC BY S172466 MOD-002 defect 1553
*            CLEAR: l_v_kbetr, l_v_val.
*            l_v_val = <l_fs_konv>-kbetr .
*            CALL FUNCTION 'BAPI_CURRENCY_CONV_TO_EXTERNAL'
*              EXPORTING
*                currency        = l_c_curr
*                amount_internal = l_v_val
*              IMPORTING
*                amount_external = l_v_kbetr.
*            l_v_val = l_v_kbetr / <l_fs_konv>-kpein.
CLEAR: l_v_kbetr, l_v_val.
            l_v_kbetr = <l_fs_konv>-kbetr * lv_factor.
            l_v_val   = l_v_kbetr / <l_fs_konv>-kpein.
**EOC BY S172466 MOD-002 defect 1553

**BOC BY S172466 MOD-002
            "Sales price Exclusive Price " UNIT PRICE

            IF <l_fs_konv>-kschl = c_kschl_yjr4.
              l_wa_alv-kbetr_unit = l_v_val."<l_fs_konv>-kbetr.
              l_v_flag = abap_true. " MOD-007
*              l_wa_alv-per_u = <l_fs_konv>-kpein. " MOD-002

*            ENDIF." MOD-007

**            BOC BY S172466 MOD-006
              "Sales price Exclusive Price " UNIT PRICE
*            IF <l_fs_konv>-kschl = c_kschl_yjr0." MOD-007
            ELSEIF <l_fs_konv>-kschl = c_kschl_yjr0.
              IF l_v_flag IS INITIAL.
                l_wa_alv-kbetr_unit = l_v_val."<l_fs_konv>-kbetr.
              ENDIF.
*              l_wa_alv-per_u = <l_fs_konv>-kpein. " MOD-002

            ENDIF.
**             BOC BY S172466 MOD-007
            IF <l_fs_konv>-kschl = c_kschl_yjr5.
              l_wa_alv-kbetr_unit = l_v_val."<l_fs_konv>-kbetr.
              l_v_flag = abap_true.

**             EOC BY S172466 MOD-007
              "Sales price Exclusive Price " UNIT PRICE

*            IF <l_fs_konv>-kschl = c_kschl_yjr6." MOD-007
            ELSEIF <l_fs_konv>-kschl = c_kschl_yjr6. " MOD-007
              IF l_v_flag IS INITIAL." MOD-007
                l_wa_alv-kbetr_unit = l_v_val."<l_fs_konv>-kbetr.
              ENDIF." MOD-007

*              l_wa_alv-per_u = <l_fs_konv>-kpein. " MOD-002

            ENDIF.
**            EOC BY S172466 MOD-006
*           "EOS Price
            IF <l_fs_konv>-kschl = c_kschl_yjrb .
              l_wa_alv-kbetr_eos = l_v_val ."<l_fs_konv>-kbetr.

*              l_wa_alv-per_e = <l_fs_konv>-kpein. " MOD-002
            ENDIF.
*           "Bottle sales
            IF <l_fs_konv>-kschl = c_kschl_yjbs .
              l_wa_alv-kbetr_bottle = l_v_val."<l_fs_konv>-kbetr.

*              l_wa_alv-per_b = <l_fs_konv>-kpein. " MOD-002
            ENDIF.
*                "Shell sales
            IF <l_fs_konv>-kschl = c_kschl_yjss.
              l_wa_alv-kbetr_shell = l_v_val."<l_fs_konv>-kbetr.

*              l_wa_alv-per_s = <l_fs_konv>-kpein. " MOD-002
            ENDIF.
*                "Bottle Deposit
            IF <l_fs_konv>-kschl = c_kschl_yjbh.
**               BOC BY S172466 MOD-011
              READ TABLE i_konv ASSIGNING <l_fs_konv2> WITH KEY knumv = <fs_vbak>-knumv
                                                                kposn = <l_fs_vbap>-posnr
                                                                kschl = c_kschl_yjbl
                                                                BINARY SEARCH.
              IF sy-subrc IS INITIAL.
                CLEAR: l_v_kbetr1, l_v_val1.
*                l_v_val1 = <l_fs_konv2>-kbetr .
*                CALL FUNCTION 'BAPI_CURRENCY_CONV_TO_EXTERNAL'
*                  EXPORTING
*                    currency        = l_c_curr
*                    amount_internal = l_v_val1
*                  IMPORTING
*                    amount_external = l_v_kbetr1.

                l_v_kbetr1 = <l_fs_konv2>-kbetr * lv_factor.
                l_v_val1   = l_v_kbetr1 / <l_fs_konv2>-kpein.
                IF <l_fs_konv2>-kwert < 0.
                  l_v_val1 = l_v_val1 * -1 .
                ENDIF.
                l_wa_alv-kbetr_bottle = l_v_val + l_v_val1.
              ELSE.

**               EOC BY S172466 MOD-011
                l_wa_alv-kbetr_bottle = l_v_val."<l_fs_konv>-kbetr.
              ENDIF." MOD-011
*              l_wa_alv-per_b = <l_fs_konv>-kpein. " MOD-002
            ENDIF.
*                "Crate Deposit
            IF <l_fs_konv>-kschl = c_kschl_yjsh.
**               BOC BY S172466 MOD-011
              READ TABLE i_konv ASSIGNING <l_fs_konv2> WITH KEY knumv = <fs_vbak>-knumv
                                                                kposn = <l_fs_vbap>-posnr
                                                                kschl = c_kschl_yjsl
                                                                BINARY SEARCH.
              IF sy-subrc IS INITIAL.
                CLEAR: l_v_kbetr1, l_v_val1.
*                l_v_val1 = <l_fs_konv2>-kbetr .
*                CALL FUNCTION 'BAPI_CURRENCY_CONV_TO_EXTERNAL'
*                  EXPORTING
*                    currency        = l_c_curr
*                    amount_internal = l_v_val1
*                  IMPORTING
*                    amount_external = l_v_kbetr1.
                l_v_kbetr1 = <l_fs_konv2>-kbetr * lv_factor.
                l_v_val1   = l_v_kbetr1 / <l_fs_konv2>-kpein.
                IF <l_fs_konv2>-kwert < 0.
                  l_v_val1 = l_v_val1 * -1 .
                ENDIF.
                l_wa_alv-kbetr_shell = l_v_val + l_v_val1.
              ELSE.
*                 EOC BY S172466 MOD-011
                l_wa_alv-kbetr_shell = l_v_val."<l_fs_konv>-kbetr.
              ENDIF." MOD-011
*              l_wa_alv-per_s = <l_fs_konv>-kpein. " MOD-002
            ENDIF.
**         get the sales deal(promotion deal) and the amount
            READ TABLE i_a595 ASSIGNING <l_fs_a595>
                              WITH KEY knumh = <l_fs_konv>-knumh
                              BINARY SEARCH.

            IF sy-subrc IS INITIAL.
**          promo code 1
              IF l_v_count = 1.

                l_wa_alv-promo_code1 = <l_fs_a595>-knuma_ag.
                l_wa_alv-promo_amt1 = l_v_val."<l_fs_konv>-kbetr *100 .

*                l_wa_alv-per1 = <l_fs_konv>-kpein.

              ENDIF.
**           promo code 2
              IF l_v_count = 2.

                l_wa_alv-promo_code2 = <l_fs_a595>-knuma_ag.
                l_wa_alv-promo_amt2 = l_v_val."<l_fs_konv>-kbetr * 100.

*                l_wa_alv-per2 = <l_fs_konv>-kpein.
              ENDIF.
**            promo code 3
              IF l_v_count = 3.
                l_wa_alv-promo_code3 = <l_fs_a595>-knuma_ag.
                l_wa_alv-promo_amt3 = l_v_val."<l_fs_konv>-kbetr * 100.

*                l_wa_alv-per3 = <l_fs_konv>-kpein.
              ENDIF.
              l_v_count = l_v_count + 1.

            ENDIF.
          ELSE.
            EXIT.
          ENDIF.
        ENDLOOP.
        CLEAR: l_v_tabix, l_v_count.
      ENDIF.

*BOC MOD-008
*Check Incompletion Log of Order
*     check if entry exist for item
      READ TABLE i_vbuv TRANSPORTING NO FIELDS
      WITH KEY vbeln = l_wa_alv-vbeln
               posnr = l_wa_alv-posnr
               BINARY SEARCH.
      IF sy-subrc IS INITIAL.
*Update With Red Light for that item
        l_wa_alv-incomplete_log = c_red.
      ELSE.
*     check if entry exist for order
        READ TABLE i_vbuv TRANSPORTING NO FIELDS
        WITH KEY vbeln = l_wa_alv-vbeln
                 posnr = ' '
                 BINARY SEARCH.
        IF sy-subrc IS INITIAL.
*Update With Red Light for that item
          l_wa_alv-incomplete_log = c_red.
        ELSE.
*Update With Red Light for first item only
          l_wa_alv-incomplete_log = c_green.
        ENDIF.
      ENDIF.
*EOC MOD-008

**      EOC BY S172466 MOD-001
*     Begin of change in MOD-019 by S422335
      IF l_wa_alv-kunnr1 IS NOT INITIAL.
        READ TABLE i_t42 ASSIGNING <l_fs_t42> WITH KEY
                                         zkzkunnrfnb = l_wa_alv-kunnr1
                                         BINARY SEARCH.
        IF sy-subrc IS INITIAL.
          WRITE <l_fs_t42>-zkhaistimf TO l_wa_alv-spe_delv_tim_f.
          WRITE <l_fs_t42>-zkhaistimt TO l_wa_alv-spe_delv_tim_t.
        ELSE.
          CLEAR : l_wa_alv-spe_delv_tim_f, l_wa_alv-spe_delv_tim_t.
        ENDIF.
      ENDIF.
*     End of change in MOD-019 by S422335
      APPEND l_wa_alv TO i_alv.
      CLEAR:l_wa_alv.
    ENDIF.


  ENDLOOP.

*BOC MOD-008
*Filter by Bottler Account Group Code
  IF s_bagc[] IS NOT INITIAL.
    DELETE i_alv WHERE /ccc/gedatnr NOT IN s_bagc.
  ENDIF.
*EOC MOD-008

ENDFORM.                    " F_PROCESS_DATA
*&---------------------------------------------------------------------*
*&      Form  F_SET_PF
*&---------------------------------------------------------------------*
*       Form to set PF status
*----------------------------------------------------------------------*

FORM f_set_pf .
  CONSTANTS: l_c_pf_detail  TYPE sypfkey VALUE '/CCEJ/ALV_BUTTONS'.

  o_table->set_screen_status(  pfstatus      = l_c_pf_detail
                               report        = sy-repid
                            set_functions =   o_table->c_functions_all
                               ).
ENDFORM.                    " F_SET_PF
*&---------------------------------------------------------------------*
*&      Form  F_GET_SEL_FCT
*&---------------------------------------------------------------------*
*       form to enable multiple selection
*----------------------------------------------------------------------*
FORM f_get_sel_fct.
  o_selections = o_table->get_selections( ).
  o_selections->set_selection_mode(
                  if_salv_c_selection_mode=>row_column ).
ENDFORM.                    " F_GET_SEL_FCT
*&---------------------------------------------------------------------*
*&      Form  F_PREP_FCAT
*&---------------------------------------------------------------------*
*     Form for field catalog
*----------------------------------------------------------------------*
FORM f_prep_fcat .
  CONSTANTS:
           l_c_vbeln TYPE dd03p-fieldname VALUE 'VBELN',
           l_c_auart TYPE dd03p-fieldname VALUE 'AUART',
           l_c_ernam TYPE dd03p-fieldname VALUE 'ERNAM',
           l_c_erzet TYPE dd03p-fieldname VALUE 'ERZET',
*           BOC MOD-009
           l_c_del_erdat TYPE dd03p-fieldname VALUE 'DELIVERY_ERDAT',
           l_c_ship_erdat TYPE dd03p-fieldname VALUE 'TKNUM_ERDAT',
           l_c_per_erdat TYPE dd03p-fieldname VALUE 'PROFORMA_ERDAT',
*  EOC MOD-009
*          BOC MOD-008
           l_c_del_erzet TYPE dd03p-fieldname VALUE 'DELIVERY_ERZET',
           l_c_ship_erzet TYPE dd03p-fieldname VALUE 'TKNUM_ERZET',
           l_c_per_erzet TYPE dd03p-fieldname VALUE 'PROFORMA_ERZET',
           l_c_sttrg TYPE dd03p-fieldname VALUE 'STTRG',
           l_c_dtabf TYPE dd03p-fieldname VALUE 'DTABF',
           l_c_uzabf TYPE dd03p-fieldname VALUE 'UZABF',
           l_c_/ccc/gedatnr TYPE dd03p-fieldname VALUE '/CCC/GEDATNR',
*          EOC MOD-008
           l_c_augru TYPE dd03p-fieldname VALUE 'AUGRU',
           l_c_vsbed TYPE dd03p-fieldname VALUE 'VSBED',
           l_c_bsark TYPE dd03p-fieldname VALUE 'BSARK',
           l_c_bname TYPE dd03p-fieldname VALUE 'BNAME',
*           l_c_refer TYPE dd03p-fieldname VALUE 'REFER',
           l_c_vkbur TYPE dd03p-fieldname VALUE 'VKBUR',
           l_c_vkgrp TYPE dd03p-fieldname VALUE 'VKGRP',
           l_c_kunnr TYPE dd03p-fieldname VALUE 'KUNNR',
           l_c_kunnr1 TYPE dd03p-fieldname VALUE 'KUNNR1',
           l_c_name_sold TYPE dd03p-fieldname VALUE 'NAME1',
           l_c_name_ship TYPE dd03p-fieldname VALUE 'NAME2',
           l_c_ihrez TYPE dd03p-fieldname VALUE 'IHREZ',
           l_c_ihrez_e TYPE dd03p-fieldname VALUE 'IHREZ_E',
           l_c_werks TYPE dd03p-fieldname VALUE 'VKBUR',"'WERKS',
           l_c_submi TYPE dd03p-fieldname VALUE 'SUBMI',
           l_c_per_work_inst1 TYPE dd03p-fieldname
                              VALUE 'PER_WORK_INST1',
           l_c_per_work_inst2 TYPE dd03p-fieldname
                              VALUE 'PER_WORK_INST2',
           l_c_work_inst2_text TYPE dd03p-fieldname
                               VALUE 'WORK_INST_TEXT',
           l_c_spe_delv_tim_f TYPE dd03p-fieldname
           VALUE  'SPE_DELV_TIM_F',
           l_c_spe_delv_tim_t TYPE  dd03p-fieldname
           VALUE 'SPE_DELV_TIM_T',
           l_c_sp_work_inst1 TYPE dd03p-fieldname
                             VALUE 'SP_WORK_INST1',
           l_c_sp_work_inst2 TYPE dd03p-fieldname
                             VALUE 'SP_WORK_INST2',
           l_c_tax   TYPE dd03p-fieldname
                     VALUE 'TAX',
           l_c_case_ind TYPE dd03p-fieldname
                        VALUE 'CASE_IND',
           l_c_promo_price  TYPE dd03p-fieldname
                            VALUE 'PROMO_PRICE',
           l_c_promo_summ  TYPE dd03p-fieldname
                           VALUE 'PROMO_SUMM',
           l_c_handl_typ TYPE dd03p-fieldname
                         VALUE 'HANDL_TYP',
           l_c_cont_typ TYPE dd03p-fieldname VALUE 'CONT_TYP',
           l_c_pr_round_typ TYPE dd03p-fieldname
                            VALUE 'PR_ROUND_TYP',
           l_c_pr_round_digit TYPE dd03p-fieldname
                              VALUE 'PR_ROUND_DIGIT',
           l_c_amt_round_typ TYPE dd03p-fieldname
                             VALUE 'AMT_ROUND_TYP',
           l_c_denpyo_class TYPE dd03p-fieldname
                            VALUE 'DENPYO_CLASS',
           l_c_slip_class TYPE dd03p-fieldname
                            VALUE 'SLIP_CLASS',
           l_c_sen_den_code TYPE dd03p-fieldname
                            VALUE 'SEN_DEN_CODE',
            l_c_maktx TYPE dd03p-fieldname
                            VALUE 'MAKTX',
           l_c_atwrt TYPE dd03p-fieldname VALUE 'ATWRT',
           l_c_matnr TYPE dd03p-fieldname VALUE 'MATNR',
           l_c_pstyv TYPE dd03p-fieldname VALUE 'PSTYV',
           l_c_abgru TYPE dd03p-fieldname VALUE 'ABGRU',
           l_c_vstel TYPE dd03p-fieldname VALUE 'VSTEL',
*           l_c_route TYPE dd03p-fieldname VALUE 'ROUTE',MOD-001 defect 1597
           l_c_vrkme TYPE dd03p-fieldname VALUE 'VRKME',
           l_c_meins TYPE dd03p-fieldname
                            VALUE 'MEINS',
           l_c_kbetr_eos TYPE dd03p-fieldname
                           VALUE 'KBETR_EOS',
           l_c_kbetr_unit TYPE dd03p-fieldname
                            VALUE 'KBETR_UNIT',
           l_c_kbetr_bottle TYPE dd03p-fieldname
                              VALUE 'KBETR_BOTTLE',
           l_c_kbetr_shell TYPE dd03p-fieldname
                             VALUE 'KBETR_SHELL',
           l_c_promo_code1 TYPE dd03p-fieldname
                             VALUE 'PROMO_CODE1',
           l_c_promo_amt1 TYPE dd03p-fieldname VALUE 'PROMO_AMT1',
           l_c_promo_code2 TYPE dd03p-fieldname
                             VALUE 'PROMO_CODE2',
           l_c_promo_amt2 TYPE dd03p-fieldname
                            VALUE 'PROMO_AMT2',
           l_c_promo_code3 TYPE dd03p-fieldname
                             VALUE 'PROMO_CODE3',
           l_c_promo_amt3 TYPE dd03p-fieldname
                            VALUE 'PROMO_AMT3',
**                            BOC BY S172466 MOD-003 Defect 1813
 l_c_cc TYPE dd03p-fieldname VALUE '/CCEJ/KNVV_ZKZDEAKBN'," Cash/Credit Indicator
l_c_delivery TYPE dd03p-fieldname VALUE 'DELIVERY'," Delivery
l_c_del_itm TYPE dd03p-fieldname VALUE 'DELIVERY_ITM'," delivery item
l_c_del_qty TYPE dd03p-fieldname VALUE 'DELIVERY_QTY'," delivery qty
l_c_tknum TYPE dd03p-fieldname VALUE 'TKNUM',"shipment
l_c_route TYPE dd03p-fieldname VALUE 'ROUTE'," route
l_c_proforma TYPE dd03p-fieldname VALUE 'PROFORMA',"Proforma
l_c_proforma_itm TYPE dd03p-fieldname VALUE 'PROFORMA_ITEM'," proforma item
l_c_visitlist TYPE dd03p-fieldname VALUE 'VISITLIST'," visitlist
l_c_billing TYPE dd03p-fieldname VALUE 'BILLING',"billing
l_c_billing_itm TYPE dd03p-fieldname VALUE 'BILLING_ITM'," billing item
**                            EOC BY S172466 MOD-003 Defect 1813
           l_c_vbak  TYPE dd03p-tabname   VALUE 'VBAK',
           l_c_vbap  TYPE dd03p-tabname   VALUE 'VBAP',
           l_c_tvkgr  TYPE dd03p-tabname   VALUE 'TVKGR',
           l_c_t001w  TYPE dd03p-tabname   VALUE 'VBAK',"'T001W',
           l_c_kna1  TYPE dd03p-tabname   VALUE 'KNA1',
           l_c_knvv  TYPE dd03p-tabname   VALUE 'KNVV',
           l_c_kalks  TYPE dd03p-tabname   VALUE 'KALKS',
**         BOC BY S172466 MOD-003 Defect 1813
           l_c_vttk  TYPE dd03p-tabname   VALUE 'VTTK',
           l_c_lips  TYPE dd03p-tabname   VALUE 'LIPS',
           l_c_vbrp  TYPE dd03p-tabname   VALUE 'VBRP',
*           l_c_tknum TYPE dd03p-fieldname VALUE 'TKNUM',
           l_c_posnr TYPE dd03p-fieldname VALUE 'POSNR',
           l_c_lfimg TYPE dd03p-fieldname VALUE 'LFIMG',
           l_c_cash TYPE dd03p-fieldname VALUE '/BEV1/RPFAR1',
**         EOC BY S172466 MOD-003 Defect 1813

*--Start of addition for MOD-010
           l_c_jdc_code TYPE dd03p-tabname   VALUE 'KUNNR2',
           l_c_jdc_name TYPE dd03p-tabname   VALUE 'NAME3',
*--End of addition for MOD-010
           l_c_klmeng TYPE dd03p-tabname   VALUE 'KLMENG'.

  DATA: l_o_columns TYPE REF TO cl_salv_columns.  "To get columns
  DATA: l_v_final_lines TYPE i." MOD-024
  CONSTANTS: l_c_optimize_max_lines TYPE i VALUE 5000." MOD-024

* To get all the columns of final ALV table
  l_o_columns = o_table->get_columns( ).
*  MOD-024: SET_OPTIMIZE makes the kernel scan every cell of every
*  row to content-fit each column's width, so its cost scales with
*  rows * columns; with ~80 columns in this ALV it became the
*  dominant cost of "ALV taking time to load" once the pulled result
*  set got large, even though F_GET_DATA's SELECTs were fast. Below
*  the threshold, behaviour/output is unchanged from before. Above
*  it, columns fall back to the DDIC-based default widths already
*  set per column via SET_DDIC_REFERENCE in F_COLHEAD, instead of a
*  pixel-perfect content fit, only for large pulls.
  DESCRIBE TABLE i_final LINES l_v_final_lines.
  IF l_v_final_lines <= l_c_optimize_max_lines.
    l_o_columns->set_optimize( ).  "To Optimize width of columns in ALV
  ENDIF.

**************** Labelling of ALV Columns Headings *******************
** Sales Order Number
  PERFORM f_colhead USING l_o_columns
                            l_c_vbak   "reference table
                            l_c_vbeln   "reference field
                            l_c_vbeln
                            text-t01.
** Doc.Type
  PERFORM f_colhead USING l_o_columns
                            l_c_vbak   "reference table
                            l_c_auart   "reference field
                            l_c_auart
                            text-t05.

**Created At
  PERFORM f_colhead USING l_o_columns
                            space   "reference table
                            space   "reference field
                            l_c_erzet
                            text-t07.
** Created By
  PERFORM f_colhead USING l_o_columns
                           space   "reference table
                            space   "reference field
                            l_c_ernam
                            text-t51.

*  Order Reason
  PERFORM f_colhead USING l_o_columns
                            l_c_vbak   "reference table
                            l_c_augru   "reference field
                            l_c_augru
                            text-t09.
**Ship Condition*
  PERFORM f_colhead USING l_o_columns
                           l_c_vbak   "reference table
                           l_c_vsbed   "reference field
                           l_c_vsbed
                           text-t10.
*** PO Type*
  PERFORM f_colhead USING l_o_columns
                           l_c_vbak   "reference table
                           l_c_bsark   "reference field
                           l_c_bsark
                           text-t11.

**   reference
*  PERFORM f_colhead USING l_o_columns
*                          space        "reference table
*                          space        "reference field
*                          l_c_refer
*                          text-t14 .
*   Name
  PERFORM f_colhead USING l_o_columns
                          space        "reference table
                          space        "reference field
                          l_c_bname
                          text-t15 .
**   Sales Ofc
  PERFORM f_colhead USING l_o_columns
                          l_c_vbak        "reference table
                          l_c_vkbur        "reference field
                          l_c_vkbur
                          text-t52.
**   Sales group
  PERFORM f_colhead USING l_o_columns
                          l_c_tvkgr        "reference table
                          l_c_vkgrp        "reference field
                          l_c_vkgrp
                          text-t54.
**  Sold-To Party
  PERFORM f_colhead USING l_o_columns
                            space   "reference table
                            space   "reference field
                            l_c_kunnr
                            text-t16 .

**  Sold-To Party Name
  PERFORM f_colhead USING l_o_columns
                            l_c_kna1   "reference table
                            l_c_kunnr   "reference field
                            l_c_name_sold
                            text-t17 .
**  Ship-To Party
  PERFORM f_colhead USING l_o_columns
                            space   "reference table
                            space   "reference field
                            l_c_kunnr1
                            text-t18 .
**  Ship-To Party Name
  PERFORM f_colhead USING l_o_columns
                            l_c_kna1        "reference table
                            l_c_kunnr   "reference field
                            l_c_name_ship
                            text-t19.

*--Start of addition for MOD-010
** JDC Code
  PERFORM f_colhead USING l_o_columns
                            l_c_kna1        "reference table
                            l_c_kunnr   "reference field
                            l_c_jdc_code
                            text-t84.

** JDC Name
  PERFORM f_colhead USING l_o_columns
                            l_c_kna1        "reference table
                            l_c_kunnr   "reference field
                            l_c_jdc_name
                            text-t85.
*--End of addition for MOD-010
* Commercial Sales Center
  PERFORM f_colhead USING   l_o_columns
                             l_c_t001w    "T001- ref table
                             l_c_werks     "WERKS -  ref field
                             l_c_ihrez   "COMM_SALESCEN
                             text-t55.   " Commercial Sales Center
* Order Sales Center
  PERFORM f_colhead USING   l_o_columns
                             l_c_t001w    "T001- ref table
                             l_c_werks     "WERKS -  ref field
                             l_c_ihrez_e   "ORD_SALESCEN
                             text-t56.   " Order Sales Center
**  Contract price
  PERFORM f_colhead USING l_o_columns
                            space        "reference table
                            space   "reference field
                            l_c_submi
                            text-t20.
***  Periodic WI code1
  PERFORM f_colhead USING l_o_columns
                             space        "reference table
                            space   "reference field
                            l_c_per_work_inst1
                            text-t21.
***  Periodic WI code2
  PERFORM f_colhead USING l_o_columns
                              space        "reference table
                            space   "reference field
                            l_c_per_work_inst2
                            text-t22.
**  WI Free Text
  PERFORM f_colhead USING l_o_columns
                            space        "reference table
                            space   "reference field
                            l_c_work_inst2_text
                            text-t23.
** time from
  PERFORM f_colhead USING l_o_columns
                            space        "reference table
                            space   "reference field
                            l_c_spe_delv_tim_f
                            text-t24.
**  time to
  PERFORM f_colhead USING l_o_columns
                           space        "reference table
                           space   "reference field
                           l_c_spe_delv_tim_t
                           text-t25.
*  "Special Work Instruction Code1*
  PERFORM f_colhead USING l_o_columns
                           space        "reference table
                            space   "reference field
                          l_c_sp_work_inst1
                          text-t26.

*Special Work Instruction Code2*
  PERFORM f_colhead USING l_o_columns
                           space        "reference table
                            space   "reference field
                          l_c_sp_work_inst2
                          text-t27.
  "Cons. Tax Indicator
  PERFORM f_colhead USING l_o_columns
                            l_c_knvv        "reference table
                            l_c_kalks   "reference field
                            l_c_tax
                            text-t28.
**  other Indicators
  PERFORM f_colhead USING l_o_columns
                            space        "reference table
                            space   "reference field
                            l_c_case_ind
                            text-t29.
  PERFORM f_colhead USING l_o_columns
                            space        "reference table
                            space   "reference field
                            l_c_promo_price
                            text-t30.
  PERFORM f_colhead USING l_o_columns
                            space        "reference table
                            space   "reference field
                            l_c_promo_summ
                            text-t31.
  PERFORM f_colhead USING l_o_columns
                            space        "reference table
                            space   "reference field
                            l_c_handl_typ
                            text-t32.
  PERFORM f_colhead USING l_o_columns
                            space        "reference table
                            space   "reference field
                            l_c_cont_typ
                            text-t33.
  PERFORM f_colhead USING l_o_columns
                            space        "reference table
                            space   "reference field
                            l_c_pr_round_typ
                            text-t34.
  PERFORM f_colhead USING l_o_columns
                            space        "reference table
                            space   "reference field
                            l_c_pr_round_digit
                            text-t35.
  PERFORM f_colhead USING l_o_columns
                            space        "reference table
                            space   "reference field
                            l_c_amt_round_typ
                            text-t36.
  PERFORM f_colhead USING l_o_columns
                            space        "reference table
                            space   "reference field
                            l_c_denpyo_class
                            text-t37.
  PERFORM f_colhead USING l_o_columns
                            space        "reference table
                            space   "reference field
                            l_c_slip_class
                            text-t38.
**  syno dynpro group code
  PERFORM f_colhead USING l_o_columns
                          space        "reference table
                          space   "reference field
                          l_c_sen_den_code
                          text-t53.
**  material desc
  PERFORM f_colhead USING l_o_columns
                        l_c_vbap        "reference table
                        l_c_matnr   "reference field
                        l_c_maktx
                        text-t62.
**  item categort
  PERFORM f_colhead USING l_o_columns
                        l_c_vbap        "reference table
                        l_c_pstyv   "reference field
                        l_c_pstyv
                        text-t58.
**  reason for rejection
  PERFORM f_colhead USING l_o_columns
                        l_c_vbap        "reference table
                        l_c_abgru   "reference field
                        l_c_abgru
                        text-t59.
**  shipping point
  PERFORM f_colhead USING l_o_columns
                        l_c_vbap        "reference table
                        l_c_vstel   "reference field
                        l_c_vstel
                        text-t60.
**  BOC BY S172466 MOD-001 defect 1597
***  route
*  PERFORM f_colhead USING l_o_columns
*                        l_c_vbap        "reference table
*                        l_c_route   "reference field
*                        l_c_route
*                        text-t61.
*  **  EOC BY S172466 MOD-001 defect 1597
*subcode
  PERFORM f_colhead USING l_o_columns
                             space        "reference table
                             space   "reference field
                             l_c_atwrt
                             text-t39.
* sales unit
  PERFORM f_colhead USING l_o_columns
                            l_c_vbap        "reference table
                            l_c_meins   "reference field
                            l_c_vrkme
                            text-t57.
* base unit
  PERFORM f_colhead USING l_o_columns
                            l_c_vbap        "reference table
                            l_c_meins   "reference field
                            l_c_meins
                            text-t40.
  PERFORM f_colhead USING l_o_columns
                          space        "reference table
                          space   "reference field
                          l_c_kbetr_eos
                          text-t41.
  PERFORM f_colhead USING l_o_columns
                        space        "reference table
                        space   "reference field
                        l_c_kbetr_unit
                        text-t42.
  PERFORM f_colhead USING l_o_columns
                      space        "reference table
                      space   "reference field
                      l_c_kbetr_bottle
                      text-t43.
  PERFORM f_colhead USING l_o_columns
                    space        "reference table
                    space   "reference field
                    l_c_kbetr_shell
                    text-t44.
  PERFORM f_colhead USING l_o_columns
                  space        "reference table
                  space   "reference field
                  l_c_promo_code1
                  text-t45.
  PERFORM f_colhead USING l_o_columns
                space        "reference table
                space   "reference field
                l_c_promo_amt1
                text-t46.
  PERFORM f_colhead USING l_o_columns
              space        "reference table
              space   "reference field
              l_c_promo_code2
              text-t47.
  PERFORM f_colhead USING l_o_columns
            space        "reference table
            space   "reference field
            l_c_promo_amt2
            text-t48.
  PERFORM f_colhead USING l_o_columns
          space        "reference table
          space   "reference field
          l_c_promo_code3
          text-t49.
  PERFORM f_colhead USING l_o_columns
        space        "reference table
        space   "reference field
        l_c_promo_amt3
        text-t50.

**                            BOC BY S172466 MOD-003 Defect 1813
  " Cash/Credit Indicator
  PERFORM f_colhead USING l_o_columns
         space        "reference table
         space   "reference field
         l_c_cc
         text-t63.
  " Delivery
  PERFORM f_colhead USING l_o_columns
          l_c_lips       "reference table
          l_c_vbeln   "reference field
          l_c_delivery
          text-t64.
  " delivery item
  PERFORM f_colhead USING l_o_columns
          l_c_lips       "reference table
          l_c_posnr   "reference field
          l_c_del_itm
          text-t65.
  " delivery qty
  PERFORM f_colhead USING l_o_columns
          l_c_lips        "reference table
          l_c_lfimg   "reference field
          l_c_del_qty
          text-t66.
  "shipment
  PERFORM f_colhead USING l_o_columns
          l_c_vttk        "reference table
          l_c_tknum   "reference field
          l_c_tknum
          text-t67.
  " route
  PERFORM f_colhead USING l_o_columns
          l_c_vttk        "reference table
          l_c_cash   "reference field
          l_c_route
          text-t68.
  "Proforma
  PERFORM f_colhead USING l_o_columns
          l_c_vbrp       "reference table
          l_c_vbeln   "reference field
          l_c_proforma
          text-t69.
  " proforma item
  PERFORM f_colhead USING l_o_columns
          l_c_vbrp        "reference table
          l_c_posnr "reference field
          l_c_proforma_itm
          text-t70.
  " visitlist
  PERFORM f_colhead USING l_o_columns
          space        "reference table
          space   "reference field
          l_c_visitlist
          text-t71.
  "billing
  PERFORM f_colhead USING l_o_columns
          l_c_vbrp       "reference table
          l_c_vbeln   "reference field
          l_c_billing
          text-t72.
  " billing item
  PERFORM f_colhead USING l_o_columns
          l_c_vbrp        "reference table
          l_c_posnr   "reference field
          l_c_billing_itm
          text-t73.
**                            EOC BY S172466 MOD-003 Defect 1813

*BOC MOD-008
**Created At - Delivery
  PERFORM f_colhead USING l_o_columns
                            space   "reference table
                            space   "reference field
                            l_c_del_erzet
*                            text-t07.
text-t81.

**Created At - Shipment
  PERFORM f_colhead USING l_o_columns
                            space   "reference table
                            space   "reference field
                            l_c_ship_erzet
*                            text-t07.
text-t83.

**Created At - Performa
  PERFORM f_colhead USING l_o_columns
                            space   "reference table
                            space   "reference field
                            l_c_per_erzet
*                            text-t07
text-t78.

**Bottler Account Group Code
  PERFORM f_colhead USING l_o_columns
                            space   "reference table
                            space   "reference field
                            l_c_/ccc/gedatnr
                            text-t74.

**Shipment Status
  PERFORM f_colhead USING l_o_columns
                            space   "reference table
                            space   "reference field
                            l_c_sttrg
                            text-t75.


**Shipment Confirmation date
  PERFORM f_colhead USING l_o_columns
                            space   "reference table
                            space   "reference field
                            l_c_dtabf
                            text-t76.


**Shipment Confirmation time
  PERFORM f_colhead USING l_o_columns
                            space   "reference table
                            space   "reference field
                            l_c_uzabf
                            text-t77.
*EOC MOD-008
*BOC MOD-009
**Created On - Delivery
  PERFORM f_colhead USING l_o_columns
                            space   "reference table
                            space   "reference field
                            l_c_del_erdat
                            text-t79.

**Created On - Shipment
  PERFORM f_colhead USING l_o_columns
                            space   "reference table
                            space   "reference field
                            l_c_ship_erdat
                            text-t80.


**Created On - Performa
  PERFORM f_colhead USING l_o_columns
                            space   "reference table
                            space   "reference field
                            l_c_per_erdat
                            text-t82.
*  EOC MOD-009

*BOC for MOD-018
**Case Quantity
  PERFORM f_colhead USING l_o_columns
                            space   "reference table
                            space   "reference field
                            l_c_klmeng
                            text-t86.
*EOC for MOD-018

ENDFORM.                    " F_PREP_FCAT
*&---------------------------------------------------------------------*
*&      Form  F_SET_LAYOUT
*&---------------------------------------------------------------------*
*      Form for layout
*----------------------------------------------------------------------*
FORM f_set_layout .
  DATA: l_o_display   TYPE REF TO cl_salv_display_settings,
        l_o_layout    TYPE REF TO cl_salv_layout,
        l_wa_key       TYPE salv_s_layout_key.

  l_o_display = o_table->get_display_settings( ).
*  To get the Zebra or stripped Layout
  l_o_display->set_striped_pattern( cl_salv_display_settings=>true ).

*  To activate save layout
  l_o_layout = o_table->get_layout( ).
  l_wa_key-report = sy-repid.
  l_o_layout->set_key( l_wa_key ).
  IF p_layout IS NOT INITIAL.
    l_o_layout->set_initial_layout( p_layout ).
  ENDIF.
  l_o_layout->set_save_restriction( if_salv_c_layout=>restrict_none ).

ENDFORM.                    " F_SET_LAYOUT

*----------------------------------------------------------------------*
*       CLASS lcl_user_command DEFINITION
*----------------------------------------------------------------------*
CLASS lcl_user_command DEFINITION FINAL.
  PUBLIC SECTION.

" *****Code Remediation changes S4 2025_1_A Conversion **begin of change by EJX9007359 04.06.2026 for ATC
*    CONSTANTS:"Change order
*               l_c_va02            TYPE syucomm VALUE '&VA02',
*               l_c_va03            TYPE syucomm VALUE '&VA03',
*               l_c_mm03            TYPE syucomm VALUE '&MM03',
*               l_c_vd03            TYPE syucomm VALUE '&VD03',
*               l_c_update          TYPE syucomm VALUE '&UPDATE',
*               l_c_tcode_va02      TYPE sytcode VALUE 'VA02',
*               l_c_tcode_va03      TYPE sytcode VALUE 'VA03',
*               l_c_tcode_mm03      TYPE sytcode VALUE 'MM03',
*               l_c_tcode_vd03      TYPE sytcode VALUE 'VD03',
*               l_c_param_aun       TYPE char3   VALUE 'AUN',
*               l_c_param_mat       TYPE char3   VALUE 'MAT',
*               l_c_param_kun       TYPE char3   VALUE 'KUN'.
    CONSTANTS:"Change order
               l_c_va02            TYPE syucomm VALUE '&VA02',
               "Display order
               l_c_va03            TYPE syucomm VALUE '&VA03',
                "Display material
               l_c_mm03            TYPE syucomm VALUE '&MM03',
                 "Display customer
               l_c_vd03            TYPE syucomm VALUE '&VD03',
               "Update multiple Orders
               l_c_update          TYPE syucomm VALUE '&UPDATE',
                "Tcode VA02
               l_c_tcode_va02      TYPE sytcode VALUE 'VA02',
               "Tcode VA03
               l_c_tcode_va03      TYPE sytcode VALUE 'VA03',
                 "Tcode MM03
               l_c_tcode_mm03      TYPE sytcode VALUE 'MM03',
                  "Tcode VD03
               l_c_tcode_vd03      TYPE sytcode VALUE 'VD03', "#EC CI_USAGE_OK[2265093]
                "Parameter ID for sales order
               l_c_param_aun       TYPE char3   VALUE 'AUN',
                 "Parameter ID for material
               l_c_param_mat       TYPE char3   VALUE 'MAT',
                  "Parameter ID for customer
               l_c_param_kun       TYPE char3   VALUE 'KUN'.
" *****Code Remediation changes S4 2025_1_A Conversion **end of change by EJX9007359 04.06.2026 for ATC


    DATA: "Table which will give the details of selected idocs
          l_i_final_sel TYPE STANDARD TABLE OF ty_final_sel,
          " Class object to check change in data in final table.
          l_o_change TYPE REF TO cl_gui_alv_grid.

    METHODS: "Method which will handle Deactivate/ Update / Repost
            on_user_command FOR EVENT added_function OF cl_salv_events.

    METHODS: "For Long text display
    on_double_click FOR EVENT double_click OF cl_salv_events_table
      IMPORTING row column.

ENDCLASS.                    "lcl_user_command DEFINITION

*----------------------------------------------------------------------*
*       CLASS lcl_user_command IMPLEMENTATION
*----------------------------------------------------------------------*
CLASS lcl_user_command IMPLEMENTATION.

  METHOD on_user_command.
    CONSTANTS:  "Memory id- to set IDoc details, for update
              l_c_mem_id TYPE char30 VALUE '/CCEJ/UPD_SO',
              l_c_refresh        TYPE syucomm   VALUE '&REF'.
    CALL FUNCTION 'GET_GLOBALS_FROM_SLVC_FULLSCR'
      IMPORTING
        e_grid = l_o_change.
    l_o_change->check_changed_data( ).

    FIELD-SYMBOLS: <l_fs_alv> TYPE ty_final_sel."ty_alv.
* To get selected records for process-> using buttons *
* One Extra cloumn of 'Select' will be at the last to show, which all
* are selected
    IF sy-ucomm NE l_c_refresh.
      PERFORM f_get_selected_rows CHANGING l_i_final_sel.
      i_sel_orders[] = l_i_final_sel[].
    ENDIF.
    DELETE i_sel_orders WHERE select EQ space.

    CASE sy-ucomm.    "User Command, after ALV display
      WHEN l_c_va02.
*        * Only one order should be selected
        IF v_sel_line GT 1.
          MESSAGE e066.     "Only 1 order should be selected
        ELSEIF v_sel_line EQ 0.
          MESSAGE e064.     "No Order is selected
        ELSE.
          READ TABLE i_sel_orders ASSIGNING <l_fs_alv> INDEX 1.
          IF sy-subrc IS INITIAL.
            SET PARAMETER ID l_c_param_aun FIELD <l_fs_alv>-vbeln.
            CALL TRANSACTION l_c_tcode_va02 AND SKIP FIRST SCREEN.
            IF sy-subrc IS NOT INITIAL.
              MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno
           WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
            ENDIF.
          ENDIF.
        ENDIF.

*      * IF Display button is pressed
      WHEN l_c_va03.
* Only one order should be selected
        IF v_sel_line GT 1.
          MESSAGE e066.     "Only 1 order should be selected
        ELSEIF v_sel_line EQ 0.
          MESSAGE e064.     "No Order is selected
        ELSE.
          READ TABLE i_sel_orders ASSIGNING <l_fs_alv> INDEX 1.
          IF sy-subrc IS INITIAL.
            SET PARAMETER ID l_c_param_aun FIELD <l_fs_alv>-vbeln.
            CALL TRANSACTION l_c_tcode_va03 AND SKIP FIRST SCREEN.
            IF sy-subrc IS NOT INITIAL.
              MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno
           WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
            ENDIF.
          ENDIF.
        ENDIF.

* If Display Material button is pressed
      WHEN l_c_mm03.
* Only one order should be selected
        IF v_sel_line GT 1.
          MESSAGE e066.     "Only 1 order should be selected
        ELSEIF v_sel_line EQ 0.
          MESSAGE e064.     "No Order is selected
        ELSE.
          READ TABLE i_sel_orders ASSIGNING <l_fs_alv> INDEX 1.
          IF sy-subrc IS INITIAL.
            SET PARAMETER ID l_c_param_mat FIELD <l_fs_alv>-matnr.
            CALL TRANSACTION l_c_tcode_mm03 AND SKIP FIRST SCREEN.
            IF sy-subrc IS NOT INITIAL.
              MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno
            WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
            ENDIF.
          ENDIF.
        ENDIF.

* If Display Customer button is pressed
" *****Code Remediation changes S4 2025_S Conversion **begin of change by EJX9007360 2026.06.09 ATC
* If Display Customer button is pressed
* WHEN l_c_vd03.
* Only one order should be selected
* IF v_sel_line GT 1.
* MESSAGE e066.     "Only 1 order should be selected
* ELSEIF v_sel_line EQ 0.
* MESSAGE e064.     "No Order is selected
* ELSE.
* READ TABLE i_sel_orders ASSIGNING <l_fs_alv> INDEX 1.
* IF sy-subrc IS INITIAL.
* SET PARAMETER ID l_c_param_kun FIELD <l_fs_alv>-kunnr.
* CALL TRANSACTION l_c_tcode_vd03 AND SKIP FIRST SCREEN.
* IF sy-subrc IS NOT INITIAL.
* MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno
* WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
* ENDIF.
      WHEN l_c_vd03.
        IF v_sel_line GT 1.
          MESSAGE e066.     "Only 1 order should be selected
        ELSEIF v_sel_line EQ 0.
          MESSAGE e064.     "No Order is selected
        ELSE.
          READ TABLE i_sel_orders ASSIGNING <l_fs_alv> INDEX 1.
          IF sy-subrc IS INITIAL.
            DATA lv_bp_partner TYPE bu_partner.
            lv_bp_partner = <l_fs_alv>-kunnr.
            DATA(lo_request) = NEW cl_bupa_navigation_request( ).
            lo_request->set_partner_number( iv_value = lv_bp_partner ).
            lo_request->set_bupa_activity( iv_value = '03' ).
            DATA ls_role TYPE bus_roles.
            ls_role-role = 'FLCU01'.
            lo_request->set_bupa_partner_role( ls_role ).
            DATA(lo_options) = NEW cl_bupa_dialog_joel_options( ).
            lo_options->set_locator_visible( space ).
            CALL METHOD cl_bupa_dialog_joel=>start_with_navigation
              EXPORTING iv_request              = lo_request
                        iv_options              = lo_options
                        iv_in_new_internal_mode = abap_true
              EXCEPTIONS already_started = 1 not_allowed = 2 OTHERS = 3.
          ENDIF.
        ENDIF.
" *****Code Remediation changes S4 2025_S Conversion **end of change by EJX9007360 2026.06.09 ATC


* If Update button is pressed
      WHEN l_c_update.
        IF v_sel_line IS INITIAL. "If nothing is selected
          MESSAGE e064.     "No Order is selected
        ELSEIF v_sel_line GT "1000.
                       v_lines."MOD-005
          "If more than 1000 are selected
          "Number of selected items should be less than v_lines
          MESSAGE e065
              WITH v_lines. "MOD-005
        ELSE.
**          send all the items related to the selected order.
          PERFORM f_get_all_items USING i_final
                                  CHANGING i_sel_orders.
**export selected values to program /CCEJ/RUSDSLSR_SO_MASS_UPDATE**
" *****Code Remediation changes S4 2025_S Conversion **begin of change by EJX9007360 2026.06.09 ATC
*          EXPORT i_sel_orders FROM i_sel_orders TO MEMORY ID l_c_mem_id.
          EXPORT i_sel_orders FROM i_sel_orders TO MEMORY ID l_c_mem_id. "#EC CI_FLDEXT_OK[2215424]
" *****Code Remediation changes S4 2025_S Conversion **end of change by EJX9007360 2026.06.09 ATC
*      Another Selection screen will open to update Selected IDocs
          SUBMIT /ccej/rusdslsr_so_mass_update VIA SELECTION-SCREEN AND
          RETURN.
        ENDIF.

        o_table->refresh( ).  "to refresh ALV with new data

*--BOC : SGOEL : 29.09.2016 05:52:01 : MOD: 001
      WHEN l_c_refresh.
* on refresh call the change value in alv
* Initialize global variables
        PERFORM f_initialize.
        CLEAR i_final.
*  Authorization Check
        PERFORM f_auth_check.
* Get data from tables
        PERFORM f_get_data .
* Process data
        PERFORM f_process_data.
* display the alv
        PERFORM f_display_alv.
*--EOC : SGOEL : 29.09.2016 05:52:03 : MOD: 001

      WHEN OTHERS.
        "Do nothing
    ENDCASE.

  ENDMETHOD.                    "on_user_command

  METHOD on_double_click.
    DATA:l_wa_final TYPE /ccej/slss_so_maint_out.
    TYPES: BEGIN OF ty_text,
           text(132),
           END OF ty_text.
    DATA:l_i_text TYPE STANDARD TABLE OF ty_text,
         l_wa_text TYPE ty_text.
    CONSTANTS:l_c_work_inst2_text TYPE dd03p-fieldname
                                VALUE 'WORK_INST_TEXT'.

    CLEAR:l_wa_final.
    READ TABLE i_final INTO l_wa_final INDEX row.
    IF sy-subrc IS INITIAL AND column = l_c_work_inst2_text.
      IF l_wa_final-work_inst_text IS NOT INITIAL.
        l_wa_text = l_wa_final-work_inst_text(110).
        APPEND l_wa_text TO l_i_text.
        CLEAR l_wa_text.
        l_wa_text = l_wa_final-work_inst_text+110(22).
        APPEND l_wa_text TO l_i_text.

        CALL FUNCTION 'TERM_CONTROL_EDIT'
          EXPORTING
            titel          = text-t23
            langu          = sy-langu
          TABLES
            textlines      = l_i_text
          EXCEPTIONS
            user_cancelled = 1
            OTHERS         = 2.
      ENDIF.
    ENDIF.
  ENDMETHOD.                    "on_double_click

ENDCLASS.                    "lcl_user_command IMPLEMENTATION


*&---------------------------------------------------------------------*
*&      Form  F_HANDLE_UCOMM
*&---------------------------------------------------------------------*
*       Form to handle the user command
*----------------------------------------------------------------------*
FORM f_handle_ucomm .
  DATA: l_o_event_handler TYPE REF TO lcl_user_command,
          l_o_events        TYPE REF TO cl_salv_events_table.

  l_o_events = o_table->get_event( ).
  l_o_event_handler = NEW lcl_user_command( ).
  SET HANDLER l_o_event_handler->on_user_command FOR l_o_events.
* register to the event DOUBLE CLICK
  SET HANDLER l_o_event_handler->on_double_click FOR l_o_events.
ENDFORM.                    " F_HANDLE_UCOMM

*&---------------------------------------------------------------------*
*&      Form  F_GET_SELECTED_ROWS
*&---------------------------------------------------------------------*
*      form to get selected rows
*----------------------------------------------------------------------*
*      <--fP_L_I_FINAL_SEL  text final table
*----------------------------------------------------------------------*
FORM f_get_selected_rows  CHANGING fp_i_final_sel TYPE tb_t_final_sel.
  DATA: "Table which gives the indexes of selected rows
          l_i_rows    TYPE lvc_t_row,
          l_v_count_t TYPE i."count of total records in final table

  DATA:  l_wa_final_sel TYPE ty_final_sel.
  FIELD-SYMBOLS: <l_fs_rows> TYPE lvc_s_row.

  CLEAR: fp_i_final_sel.

* To get indexes of selected records
*in interbal table from final table
  l_i_rows = o_selections->get_selected_rows( ).

*  If any one record has been selected
  IF NOT l_i_rows[] IS INITIAL.
    "Move data from final to mark which all records are selected
    fp_i_final_sel[] = i_final[].

*  To get the selected rows count
    DESCRIBE TABLE l_i_rows LINES v_sel_line.
*    To get the total records in final display table
    DESCRIBE TABLE i_final LINES l_v_count_t.

*============ All records selected==================================
    "If Select ALl button is pressed or
*    all records have been selected
    IF v_sel_line = l_v_count_t.
* field-select will be set to show
*      these many records have been selected
      l_wa_final_sel-select = abap_true.
*      To set flag in 'select' column in one go
      MODIFY fp_i_final_sel FROM l_wa_final_sel TRANSPORTING select
      WHERE select = space.
      CLEAR l_wa_final_sel.

*============ One or multiple records selected=======================
      "if one or some records selected from final displayed table
    ELSEIF v_sel_line LT l_v_count_t.
*To set flag in 'select' column
*      for particular selected rows using index
      LOOP AT l_i_rows ASSIGNING <l_fs_rows>.
        READ TABLE fp_i_final_sel INTO l_wa_final_sel
                                INDEX <l_fs_rows>-index.
        IF sy-subrc IS INITIAL.
          l_wa_final_sel-select = abap_true.
          MODIFY fp_i_final_sel FROM l_wa_final_sel
                      INDEX <l_fs_rows>-index
                      TRANSPORTING select.
          CLEAR l_wa_final_sel.
        ENDIF.
      ENDLOOP.
      IF <l_fs_rows> IS ASSIGNED.
        UNASSIGN <l_fs_rows>.
      ENDIF.
    ENDIF.

*============ No record selected==================================
  ELSE.
    MESSAGE e529 . "Please select a Line Item
  ENDIF.
ENDFORM.                    " F_GET_SELECTED_ROWS

*&---------------------------------------------------------------------*
*&      Form  F_COLHEAD
*&---------------------------------------------------------------------*
*       ALV List Column headings and F4 help for some Fields
*----------------------------------------------------------------------*
FORM f_colhead  USING    fp_o_columns TYPE REF TO cl_salv_columns
                         fp_v_reftab  TYPE lvc_tname
                         fp_v_reffld  TYPE lvc_tname
                         fp_v_field   TYPE lvc_fname
                         fp_v_text    TYPE scrtext_l.

  DATA: l_o_column  TYPE REF TO cl_salv_column,
        l_o_coltab  TYPE REF TO cl_salv_column_table, "column table
        "work area for reference
        l_wa_ddic   TYPE salv_s_ddic_reference,
        l_v_exc_msg TYPE string, "For exception messages
        l_o_exc     TYPE REF TO cx_salv_not_found,
        l_v_mtext TYPE scrtext_m,
        l_v_stext TYPE scrtext_s.


  TRY.
* To get the reference field and table- for F4 help
      l_wa_ddic-table = fp_v_reftab.
      l_wa_ddic-field = fp_v_reffld.

* Get the column of ALV for heading and F4 help
      l_o_column = fp_o_columns->get_column( fp_v_field ).

*========== For F4 help on columns in ALV======================
* If reference Table- field given to get F4 help
      IF NOT l_wa_ddic IS INITIAL.
        l_o_column->set_ddic_reference( l_wa_ddic ).
*  Get column to update
        l_o_coltab ?= fp_o_columns->get_column( fp_v_field ).
        "set ref field and table
        l_o_coltab->set_ddic_reference( l_wa_ddic ).
        "set F4 for ALV field
        l_o_coltab->set_f4( if_salv_c_bool_sap=>true ).
      ENDIF.

*=========== For setting the headings of column  ==================
*Only Long text is in consideration
      l_v_stext = fp_v_text.
      l_o_column->set_short_text( l_v_stext ).
* If Heading should be text from manual enter not standard
      IF NOT fp_v_text IS INITIAL .
        l_o_column->set_long_text( fp_v_text ).
      ENDIF.
      l_v_mtext = fp_v_text.
      l_o_column->set_medium_text( l_v_mtext ).
*      l_o_column->set_medium_text( space ).

* Exception Handling
    CATCH cx_salv_not_found INTO l_o_exc.
      l_v_exc_msg = l_o_exc->get_text( ).
      MESSAGE l_v_exc_msg TYPE c_error.
  ENDTRY.
ENDFORM.                    " F_COLHEAD

*&---------------------------------------------------------------------*
*&      Form  F_GET_DAYS
*&---------------------------------------------------------------------*
*      Form to get no. of days
*----------------------------------------------------------------------*

FORM f_get_days .
  TYPES: BEGIN OF l_ty_tvarvc,
         name TYPE rvari_vnam,
        low TYPE tvarv_val,
         END OF l_ty_tvarvc.

  " Name in tvarvc
  CONSTANTS: l_c_tname TYPE rvari_vnam VALUE'/CCEJ/SO_MAINTAINED',
             l_c_tname2 TYPE rvari_vnam VALUE'/CCEJ/SO_RECORDS',
** BOC by S404352 MOD-005
             l_c_tname3 TYPE rvari_vnam
                                 VALUE'/CCEJ/SO_LINE_SELECTION',
** EOC by S404352 MOD-005
             l_c_sign TYPE sign VALUE 'I',
             l_c_option TYPE option VALUE 'EQ',
             " type of parameter
             l_c_kind TYPE rsscr_kind VALUE 'S'.

  DATA: l_i_tvarvc TYPE STANDARD TABLE OF l_ty_tvarvc,
        l_r_name TYPE RANGE OF rvari_vnam,
        l_wa_name LIKE LINE OF l_r_name.

  FIELD-SYMBOLS: <l_fs_tvarvc> TYPE l_ty_tvarvc.

**  creating range
  l_wa_name-sign = l_c_sign.
  l_wa_name-option = l_c_option.

  l_wa_name-low = l_c_tname.
  APPEND l_wa_name TO l_r_name.
  CLEAR: l_wa_name-low.

  l_wa_name-low = l_c_tname2.
  APPEND l_wa_name TO l_r_name.
  CLEAR: l_wa_name-low.

** BOC by S404352 MOD-005
  l_wa_name-low = l_c_tname3.
  APPEND l_wa_name TO l_r_name.
  CLEAR: l_wa_name-low.
** EOC by S404352 MOD-005

**  select value from tvarvc table
  SELECT name low
    FROM tvarvc
    INTO TABLE l_i_tvarvc
    WHERE name IN l_r_name
    AND type = l_c_kind.

  IF sy-subrc IS INITIAL.
    SORT l_i_tvarvc BY name.
**    for no. of days difference
    READ TABLE l_i_tvarvc ASSIGNING <l_fs_tvarvc>
                          WITH KEY name = l_c_tname
                          BINARY SEARCH.
    IF sy-subrc IS INITIAL.
      v_days = <l_fs_tvarvc>-low.
    ENDIF.
**    for no. of records selected.
    READ TABLE l_i_tvarvc ASSIGNING <l_fs_tvarvc>
                          WITH KEY name = l_c_tname2
                          BINARY SEARCH.
    IF sy-subrc IS INITIAL.
      v_records = <l_fs_tvarvc>-low.
    ENDIF.

** BOC by S404352 MOD-005
** for no. of line selection on ALV grid
    READ TABLE l_i_tvarvc ASSIGNING <l_fs_tvarvc>
                        WITH KEY name = l_c_tname3
                        BINARY SEARCH.
    IF sy-subrc IS INITIAL.
      v_lines =  <l_fs_tvarvc>-low.
    ENDIF.
** EOC by S404352 MOD-005

  ELSE.
*      No Value maintained in TVARVC Table for date
*      range & records selected.
    MESSAGE e524.
  ENDIF.
ENDFORM.                    " F_GET_DAYS
*&---------------------------------------------------------------------*
*&      Form  F_GET_SYNO_DYNPRO
*&---------------------------------------------------------------------*
*       text
*----------------------------------------------------------------------*
*      -->P_<FS_VBAK>_VBELN  text
*      <--P_L_V_SYNO_DYNPRO  text
*----------------------------------------------------------------------*
FORM f_get_syno_dynpro  USING    fp_vbeln TYPE vbeln
                    CHANGING fp_syno_dynpro TYPE /ccej/mdm_zkzdengrpcd.

  DATA: l_v_txt_fail TYPE flag.   " To notify failure in reading text
  DATA:l_o_wi TYPE REF TO /ccej/cl_sls_util_sovalret,
         "Header Text of Sales Document
           l_i_head TYPE TABLE OF tline,
           " To make field compatible for read_text FM
          l_v_vbeln    TYPE tdobname,
          l_v_lang     TYPE sylangu.

  l_o_wi = NEW /ccej/cl_sls_util_sovalret( ).
  FIELD-SYMBOLS: <l_fs_head> TYPE tline,
                 <l_fs_stxh> TYPE ty_stxh." MOD-001


  CLEAR: fp_syno_dynpro,
         l_v_vbeln,
         l_v_txt_fail,
         l_i_head[],
         l_v_lang." MOD-001
**moving it to type compatible variable**
  l_v_vbeln = fp_vbeln.

**  BOC BY S172466 MOD-001 ETE Defect 348
  READ TABLE i_stxh ASSIGNING <l_fs_stxh>
                    WITH KEY tdobject = c_hobj
                             tdname = l_v_vbeln
                             tdid =  c_txtid1
                             BINARY SEARCH.
  IF sy-subrc IS INITIAL.
    l_v_lang = <l_fs_stxh>-tdspras.
  ELSE.
    l_v_lang = sy-langu.
  ENDIF.

**  EOC BY S172466 MOD-001 ETE Defect 348

  l_o_wi->get_multiline_text(
    EXPORTING
      im_txt_id    = c_txtid1     "YJCH
      im_txt_name  = l_v_vbeln      "Sales document number
      im_txt_obj   = c_hobj       "VBBK
      im_lang      = l_v_lang      " language
    IMPORTING
      ex_txt_table = l_i_head
      ex_failure   = l_v_txt_fail ).
  IF NOT l_v_txt_fail IS INITIAL.   "failure of read_text
    CLEAR: l_i_head[].
  ENDIF.

  IF NOT l_i_head IS INITIAL.
* Transferring Sales document header text into work area.
**    since syno dynpro is present at line no 35 in text id YJCH
**    so directly reading line no 35
    READ TABLE l_i_head ASSIGNING <l_fs_head> INDEX 35.
    IF sy-subrc IS INITIAL.
      fp_syno_dynpro      = <l_fs_head>-tdline.
      " Dedicated slip group code
    ENDIF.

  ENDIF.

ENDFORM.                    " F_GET_SYNO_DYNPRO
*&---------------------------------------------------------------------*
*&      Form  F_F4_HELP
*&---------------------------------------------------------------------*
*      form for subcode f4 help
*----------------------------------------------------------------------*
*      -->P_C_SB_HIGH  text
*----------------------------------------------------------------------*
FORM f_f4_help  USING      fp_sb TYPE dynfnam.
" *****Code Remediation changes S4 2025_S Conversion **begin of change by EJX9007360 2026.06.09 ATC
*  TYPES : BEGIN OF ty_wtaddi,
*           matnr TYPE matnr,
*          lfdnr TYPE addi_wtkey,
*          addimat TYPE addi_matnr,
*           END OF ty_wtaddi,
*            BEGIN OF ty_makt,
*            matnr  TYPE matnr,
*            spras TYPE spras,
*            maktx  TYPE maktx,
*            END OF ty_makt,
*            BEGIN OF ty_help,
*            atwrt TYPE atwrt,
*            desc     TYPE maktx,
*            END OF ty_help.
  TYPES : BEGIN OF ty_wtaddi,
           matnr TYPE matnr,
          lfdnr TYPE addi_wtkey, "#EC CI_USAGE_OK[2371631]
          addimat TYPE addi_matnr,
           END OF ty_wtaddi,
            BEGIN OF ty_makt,
            matnr  TYPE matnr,
            spras TYPE spras,
            maktx  TYPE maktx,
            END OF ty_makt,

            BEGIN OF ty_help,
            atwrt TYPE atwrt,
            desc     TYPE maktx,
            END OF ty_help.
" *****Code Remediation changes S4 2025_S Conversion **end of change by EJX9007360 2026.06.09 ATC
  DATA :  l_i_wtaddi TYPE STANDARD TABLE OF ty_wtaddi,
          l_i_help TYPE STANDARD TABLE OF ty_help,
          l_i_ret_matchar   TYPE STANDARD TABLE OF ddshretval,
          l_wa_ret_matchar   TYPE ddshretval,
          l_i_makt TYPE STANDARD TABLE OF ty_makt.

  DATA : l_wa_makt TYPE ty_makt,
         l_wa_help TYPE ty_help.

  FIELD-SYMBOLS : <l_wa_wtaddi> TYPE ty_wtaddi.

  DATA : l_v_len TYPE i.


  CONSTANTS : l_c_subcode TYPE dfies-fieldname VALUE 'ATWRT',
            l_c_val     TYPE ddbool_d        VALUE 'S'.
  " get data for F4
  CLEAR l_i_help.


  " get subcodes
  SELECT matnr
         lfdnr
         addimat
   FROM wtaddi
   INTO TABLE l_i_wtaddi
   WHERE matnr IN s_matnr.

  IF sy-subrc IS INITIAL AND l_i_wtaddi[] IS NOT INITIAL.
    " get subcode description
*   MOD-023: CDS view I_ProductDescription instead of direct MAKT
*   access; fields aliased back to the original MAKT names. Verify
*   view/field names in SE11 before transport.
    SELECT product            AS matnr,
           language           AS spras,
           productdescription AS maktx
     FROM i_productdescription
     INTO TABLE @l_i_makt
     FOR ALL ENTRIES IN @l_i_wtaddi
     WHERE product  = @l_i_wtaddi-addimat
      AND language = @sy-langu.

    IF sy-subrc IS INITIAL.
      SORT l_i_makt BY matnr.
    ENDIF.

    LOOP AT l_i_wtaddi ASSIGNING <l_wa_wtaddi>.
      CONDENSE <l_wa_wtaddi>-addimat.

      l_v_len = strlen( <l_wa_wtaddi>-addimat ).
      l_v_len = l_v_len -  4.

" *****Code Remediation changes S4 2025_1_A Conversion **begin of change by EJX9007359 04.06.2026 for ATC
*      l_wa_help-atwrt = <l_wa_wtaddi>-addimat+l_v_len(4).
      l_wa_help-atwrt = <l_wa_wtaddi>-addimat+l_v_len(4). "#EC CI_FLDEXT_OK[2215424]
" *****Code Remediation changes S4 2025_1_A Conversion **end of change by EJX9007359 04.06.2026 for ATC

      CLEAR l_wa_makt.
      READ TABLE  l_i_makt INTO l_wa_makt
      WITH KEY matnr =  <l_wa_wtaddi>-addimat
      BINARY SEARCH.

      IF sy-subrc IS INITIAL.
        l_wa_help-desc = l_wa_makt-maktx.
      ENDIF.

      APPEND  l_wa_help TO l_i_help.
      CLEAR l_wa_help.

    ENDLOOP.
* To populate the possible values for field 'Article Variants'
    CALL FUNCTION 'F4IF_INT_TABLE_VALUE_REQUEST'
      EXPORTING
        retfield        = l_c_subcode
        dynpprog        = sy-repid
        dynpnr          = sy-dynnr
        dynprofield     = fp_sb
        value_org       = l_c_val
      TABLES
        value_tab       = l_i_help
        return_tab      = l_i_ret_matchar
      EXCEPTIONS
        no_values_found = 2
        OTHERS          = 3.
    IF sy-subrc = 0.
      CLEAR l_wa_ret_matchar.
      READ TABLE l_i_ret_matchar INTO l_wa_ret_matchar INDEX 1.
      IF NOT l_wa_ret_matchar-fieldval IS INITIAL.
" *****Code Remediation changes S4 2025_1_A Conversion **begin of change by EJX9007359 04.06.2026 for ATC
*        s_atwrt-low        = l_wa_ret_matchar-fieldval.
*      ENDIF.
*    ENDIF.
*  ENDIF.
        s_atwrt-low        = l_wa_ret_matchar-fieldval. "#EC CI_FLDEXT_OK[2215424]
      ENDIF.
    ENDIF.
  ENDIF.
" *****Code Remediation changes S4 2025_1_A Conversion **end of change by EJX9007359 04.06.2026 for ATC
ENDFORM.                    " F_F4_HELP
*&---------------------------------------------------------------------*
*&      Form  F_GET_ALL_ITEMS
*&---------------------------------------------------------------------*
*      perform to select all items for the selected Sales Order
*----------------------------------------------------------------------*
*      -->P_I_FINAL  text
*      <--P_I_SEL_ORDERS  text
*----------------------------------------------------------------------*
FORM f_get_all_items  USING    fp_i_final TYPE tb_alv
                      CHANGING fp_i_final_sel TYPE tb_t_final_sel.
  " Fs for loop
  FIELD-SYMBOLS: <l_fs_final> TYPE /ccej/slss_so_maint_out.

  DATA: l_i_final TYPE tb_alv, " local table of final table
        l_v_tabix TYPE sytabix." to capture index

**copying final table yto local table**
  l_i_final[] = fp_i_final[].

** sort final select by  Sales doc number**
  SORT fp_i_final_sel BY vbeln.

** loop to find cluster of sales order
  LOOP AT l_i_final ASSIGNING <l_fs_final>.
**    clear varaible before use
    CLEAR: l_v_tabix.
**    capturing index
    l_v_tabix = sy-tabix.
**   check if an entry exists in this table
    READ TABLE fp_i_final_sel WITH KEY vbeln = <l_fs_final>-vbeln
                              TRANSPORTING NO FIELDS
                              BINARY SEARCH.
**    if no entry exists
    IF sy-subrc IS NOT INITIAL.
**      delete from final table
      DELETE l_i_final INDEX l_v_tabix.
    ENDIF.

  ENDLOOP.
**unassigning fs**
  IF <l_fs_final> IS ASSIGNED.
    UNASSIGN <l_fs_final>.
  ENDIF.
*** transfer the cluster to the final select table
  fp_i_final_sel[] = l_i_final[].
ENDFORM.                    " F_GET_ALL_ITEMS
*&---------------------------------------------------------------------*
*&      Form  F_CHECK_VKBUR_AUTH
*&---------------------------------------------------------------------*
*       Sales office authority check
*----------------------------------------------------------------------*
FORM f_check_vkbur_auth .
*  FIELD-SYMBOLS: <l_fs_vbak> TYPE ty_vbak.
  CONSTANTS: l_c_obj TYPE xuobject VALUE 'V_VBKA_VKO',
             l_c_vkbur TYPE xufield VALUE'VKBUR',
             l_c_actvt TYPE xufield VALUE'ACTVT',
             l_c_03  TYPE xufield VALUE '03'.
*  DATA: l_v_vkbur TYPE vkbur.
*
*
*
*  LOOP AT i_vbak ASSIGNING <l_fs_vbak>.
*    AUTHORITY-CHECK OBJECT l_c_obj
*                 ID l_c_vkbur FIELD <l_fs_vbak>-vkbur
*                 ID l_c_actvt FIELD l_c_03.
*    IF sy-subrc IS NOT INITIAL.
*      l_v_vkbur = <l_fs_vbak>-vkbur.
*      <l_fs_vbak>-vkbur = abap_true.
*
*    ENDIF.
*
*  ENDLOOP.
*  DELETE i_vbak WHERE vkbur EQ abap_true.
*  IF i_vbak[] IS INITIAL.
**  Authorization failed for Sales Office &1
*    MESSAGE e216(/scl/tin_otc) WITH l_v_vkbur.
*  ENDIF.
   DATA: lt_vkbur  TYPE SORTED TABLE OF vkbur WITH UNIQUE KEY table_line,
        lr_bad    TYPE RANGE OF vkbur,
        l_v_vkbur TYPE vkbur.
  FIELD-SYMBOLS: <l_fs_vbak> TYPE ty_vbak.

* collect distinct sales offices (duplicates silently ignored)
  LOOP AT i_vbak ASSIGNING <l_fs_vbak>.
    INSERT <l_fs_vbak>-vkbur INTO TABLE lt_vkbur.
  ENDLOOP.

* check each distinct office once; remember the ones that fail
  LOOP AT lt_vkbur ASSIGNING FIELD-SYMBOL(<v>).
    AUTHORITY-CHECK OBJECT l_c_obj
                 ID l_c_vkbur FIELD <v>
                 ID l_c_actvt FIELD l_c_03.
    IF sy-subrc IS NOT INITIAL.
      l_v_vkbur = <v>.
      lr_bad = VALUE #( BASE lr_bad ( sign = 'I' option = 'EQ' low = <v> ) ).
    ENDIF.
  ENDLOOP.

* delete all rows belonging to a failed office in one shot
  IF lr_bad IS NOT INITIAL.
    DELETE i_vbak WHERE vkbur IN lr_bad.
  ENDIF.

  IF i_vbak[] IS INITIAL.
*  Authorization failed for Sales Office &1
    MESSAGE e216(/scl/tin_otc) WITH l_v_vkbur.
  ENDIF.
ENDFORM.                    " F_CHECK_VKBUR_AUTH
*&---------------------------------------------------------------------*
*&      Form  F_GET_LOCAL_TIME
*&---------------------------------------------------------------------*
*      Get local date and time
*----------------------------------------------------------------------*
FORM f_get_local_time  USING    fp_in_date TYPE erdat
                                fp_in_time TYPE erzet
                       CHANGING fp_out_date TYPE erdat
                                fp_out_time TYPE erzet.

  DATA:l_v_tzone TYPE  ttzz-tzone.
  CLEAR:l_v_tzone.
  IF p_tzone IS INITIAL.
    l_v_tzone = sy-zonlo.
  ELSE.
    l_v_tzone =  p_tzone.
  ENDIF.

  CALL FUNCTION 'ISU_DATE_TIME_CONVERT_TIMEZONE'
    EXPORTING
      x_date_utc    = fp_in_date
      x_time_utc    = fp_in_time
      x_timezone    = l_v_tzone
    IMPORTING
      y_date_lcl    = fp_out_date
      y_time_lcl    = fp_out_time
    EXCEPTIONS
      general_fault = 1
      OTHERS        = 2.
  IF sy-subrc <> 0.
    MESSAGE s144 WITH text-005 DISPLAY LIKE  c_error.
    LEAVE LIST-PROCESSING.
  ENDIF.


ENDFORM.                    " F_GET_LOCAL_TIME
*&---------------------------------------------------------------------*
*&      Form  F_PARTNER_FNC
*&---------------------------------------------------------------------*
*       Partner function
*----------------------------------------------------------------------*
FORM f_partner_fnc  CHANGING fp_partner TYPE tb_partner.

  DATA:l_wa_partner TYPE ty_partner.

*--Ship to party
  l_wa_partner-sign = c_i.
  l_wa_partner-opti = c_eq.
  l_wa_partner-low = c_ship.
  APPEND l_wa_partner TO fp_partner.
  CLEAR l_wa_partner-low.
*--JDC Code
  l_wa_partner-low = c_jdc.
  APPEND l_wa_partner TO fp_partner.

ENDFORM.                    " F_PARTNER_FNC
