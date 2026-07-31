*&---------------------------------------------------------------------*
*& Report  /CCEJ/RUSDSLSR_SO_MAINT
*&
*&---------------------------------------------------------------------*
*---------------------------------------------------------------------*
* Program Name     : /CCEJ/RUSDSLSR_SO_MAINT                           *
* Program Title    : Sales Order Maintenance Report                    *
* Program Type     : Report                                            *
* Description      : Sales Order Maintenance Report                    *
* Date             : 09-06-2016                                        *
* Author           : Sakshi Singla <S404344>                           *
* Run Frequency    : As and when required                             *
* Transaction      : VA03                                              *
* Transport Number : DCRK9A0K09                                        *
* RICEF ID         : OTC-3051-R-01                                     *
* Release          : CCEJ Front Office 5.1                             *
* Additional Info  : The requirement is to display Sales Order header  *
*                    data and item data in ALV. The user can then      *
*                    display and change sales order, diaplay customer, *
*                    display material and mass updae sales orders.     *
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
* Mod No.            : MOD-003                                         *
* Date               : 27-DEC-2016                                     *
* Author             : <S182466>  <Monica Singh>                       *
* Change Reference   : ETE Defect 1813                                 *
* Transport Number   : DCRK9A0K09                                      *
* Change Request     : CCEJ Front Office 5.1                           *
* Change Description : Added new fields for delivery, shipment and     *
*billing                                                               *
*----------------------------------------------------------------------*
* Mod No.            : MOD-004                                         *
* Date               : 10-Jan-2017                                     *
* Author             : <S182466>  <Monica Singh>                       *
* Change Reference   :  Defect                                         *
* Transport Number   : DCRK9A0K09                                      *
* Change Request     : CCEJ Front Office 5.1                           *
* Change Description : performnace improvement changes                 *
*----------------------------------------------------------------------*
* Mod No.            : MOD-005                                         *
* Date               : 02-Mar-2017                                     *
* Author             : <S404352>  <Abhishek Bucal>                     *
* Change Reference   :  Defect  2448                                   *
* Transport Number   :  DCRK9A0WDV                                     *
* Change Request     : CCEJ Front Office 5.1                           *
* Change Description : Maintain TVARVC for no. of records selection &  *
* NO. of records and line selection error only in foreground process   *
*----------------------------------------------------------------------*
* Mod No.            : MOD-006                                         *
* Date               : 01-Apr-2017                                     *
* Author             : <S172466>  <Monica Singh>                       *
* Change Reference   :  Defect 2870                                    *
* Transport Number   :  MCRK9A0ES0                                     *
* Change Request     : CCEJ Front Office 5.1                           *
* Change Description : Added a condition type for calculating unit price*
*----------------------------------------------------------------------*
* Mod No.            : MOD-007                                         *
* Date               : 12-Apr-2017                                     *
* Author             : <S172466>  <Monica Singh>                       *
* Change Reference   : Pilot Defect 3044                               *
* Transport Number   :  MCRK9A0GRM                                     *
* Change Request     : CCEJ Front Office 5.1                           *
* Change Description : Added heirarchy for condition type for          *
*calculating unit price                                                *
* Adding the logic to move the event code AT new endat just after vbap *
* loop in perform f_process_data                                       *
*----------------------------------------------------------------------*
* Mod No.            : MOD-008                                         *
* Date               : 20-Apr-2017                                     *
* Author             : <S172466>  <Monica Singh>                       *
* Change Reference   : Pilot Defect 3146                               *
* Transport Number   :  MCRK9A0HMU                                     *
* Change Request     : CCEJ Front Office 5.1                           *
* Change Description : added two new fields to the report output:      *
*incompletion flag and build quantity                                  *
*----------------------------------------------------------------------*
* Mod No.            : MOD-009                                         *
* Date               : 20-Apr-2017                                     *
* Author             : <S123118>  <Sudha Yadav>                        *
* Change Reference   : Pilot Defect 3146                               *
* Transport Number   :  MCRK9A0HMU                                     *
* Change Request     : CCEJ Front Office 5.1                           *
* Change Description : added time zone in selection screen and         *
* converted date and time in time zone entered on screen               *
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
* Mod No.            : MOD-011                                         *
* Date               : 11-Aug-2017                                     *
* Author             : <S172466>  <Monica Singh>                       *
* Change Reference   : Defect 3679                                     *
* Transport Number   : DCRK9A10WL                                      *
* Change Request     : CCEJ Front Office 5.1                           *
* Change Description : added condition type and logic for YJBL  Bottle *
*Lease and  YJSL  Crate Lease                                          *
*----------------------------------------------------------------------*
* Mod No.            : MOD-012                                         *
* Date               : 30-Aug-2017                                     *
* Author             : <S172466>  <Monica Singh>                       *
* Change Reference   : Defect 3785                                     *
* Transport Number   : DCRK9A11PQ                                      *
* Change Request     : CCEJ Front Office 5.1                           *
* Change Description : chanes done for JDC name                        *
*----------------------------------------------------------------------*
* Mod No.            : 013                                             *
* Date               : 21-SEP-2017                                     *
* Author             : Sangeeta  <S171792>                             *
* Change Reference   : R5.1 Defect#3886                                *
* Transport Number   : DCRK9A12HD                                      *
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
* Mod No.            : 015                                             *
* Date               : 11-OCT-2017                                     *
* Author             : Imran Sarvadi  <S124919>                        *
* Change Reference   : Wave1 Defect # 4059                             *
* Transport Number   : DCRK9A137L                                      *
* Change Request     : CRXXXXXX                                        *
* Change Description : Performance improvement                         *
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
* Mod No.            : 018                                             *
* Date               : 18-May-2017                                     *
* Author             : Imran Sarvadi  <S124919>                        *
* Change Reference   : Defect # 9000000684                             *
* Transport Number   : MJRK902384                                      *
* Change Request     : 8000001479                                      *
* Change Description : Add New field VBAP-KLMENG to output             *
*----------------------------------------------------------------------*
* Mod No.            : 019                                             *
* Date               : 07-Nov-2017                                     *
* Author             : Ashok Kumar  <S422335>                          *
* Change Reference   : Defect # 9000001959                             *
* Transport Number   :  DJRK994006                                     *
* Change Request     : 8000002507                                      *
* Change Description : Add New field VTTK-DPTBG (shipment plan date)   *
*                      Change logic for delivery start/end time        *
*----------------------------------------------------------------------*
* Mod No.            : MOD-020                                         *
* Date               : 01-08-2023                                      *
* Author             : Katukuri Manasa EJX9005170                      *
* Change Reference   : 1000003195                                      *
* Transport Number   : MJRK922895                                      *
* Change Request     : 8000013887                                      *
* Change Description : to reduce the Performance issues                *
*----------------------------------------------------------------------*
REPORT zso_maint_pe MESSAGE-ID /ccej/otc.
*-----------Data declaration-----------------------------------------*
INCLUDE ZSO_MAINT_TOP_PE.
*INCLUDE zrusdslsi_so_maint_top.

*-----------Selection Screen-----------------------------------------*
INCLUDE ZSO_MAINT_SEL_PE.
*INCLUDE zrusdslsi_so_maint_sel.

*-----------Subroutines----------------------------------------------
INCLUDE ZSO_MAINT_SUB_PE.
*INCLUDE zrusdslsi_so_maint_sub.

*-----------Initialization-------------------------------------------*
INITIALIZATION.
* Initialize global variables
  PERFORM f_initialize.
  " Put Search Help for select Options

AT SELECTION-SCREEN ON VALUE-REQUEST FOR s_atwrt-low.

  PERFORM f_f4_help USING c_sb_low .

AT SELECTION-SCREEN ON VALUE-REQUEST FOR s_atwrt-high.

  PERFORM f_f4_help USING c_sb_high .
*-----------At Selection-Screen--------------------------------------*
AT SELECTION-SCREEN.

*  Validate select options
  PERFORM f_validate_selection.

*  Authorization Check
  PERFORM f_auth_check.

*-----------At Selection-Screen on Value Request---------------------*
AT SELECTION-SCREEN ON VALUE-REQUEST FOR p_layout.
*  F4 Help for Layout
  PERFORM f_layout_f4.

*-----------Start-Of-Selection---------------------------------------*
START-OF-SELECTION.
* Get data from tables
  PERFORM f_get_data.
* Process data
  PERFORM f_process_data.

*-----------End-Of-Selection---------------------------------------*
END-OF-SELECTION.
* Display ALV grid
  IF i_alv IS NOT INITIAL.        "Display ALV
    PERFORM f_display_alv.
  ELSE.                           "If no output lines, throw error
    MESSAGE i069 DISPLAY LIKE c_error.      "No Data Found
    LEAVE LIST-PROCESSING.
  ENDIF.
