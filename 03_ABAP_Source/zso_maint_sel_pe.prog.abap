*----------------------------------------------------------------------*
* Program Name     : Sakshi Singla                                     *
* Program Title    : /CCEJ/RDSDSLSR_SO_MAINT_SEL                       *
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
*----------------------------------------------------------------------*
* Mod No.            : MOD-010                                         *
* Date               : 03-Aug-2017                                     *
* Author             : <S404352>  <Abhishek Buckal>                    *
* Change Reference   : Defect 6962                                     *
* Transport Number   : MCRK9A0QTO                                      *
* Change Request     : CCEJ Front Office 5.1                           *
* Change Description : added JDC code and Name in the output           *
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
*&  Include           /CCEJ/RDSDSLSR_SO_MAINT_SEL
*&---------------------------------------------------------------------*

TABLES: ttzz.
*-- Header Selection Criteria
SELECTION-SCREEN BEGIN OF BLOCK a
                          WITH FRAME TITLE text-001.
"Sales Org
SELECT-OPTIONS:  s_vkorg   FOR v_vkorg OBLIGATORY,
                  "Distribution Channel
                 s_vtweg   FOR v_vtweg OBLIGATORY,
                 "Division
                 s_spart   FOR v_spart,
                   "Sales Order Number
                 s_vbeln   FOR v_vbeln,
                 "Created On
                 s_erdat   FOR v_erdat OBLIGATORY,
                  "Created At
                 s_erzet   FOR v_erzet,
                 "Created By
                 s_ernam   FOR v_ernam,
                 "Sales Document Type
                 s_auart   FOR v_auart OBLIGATORY,
                  "Order Reason
                 s_augru   FOR v_augru,
                 "Shipping Condition
                 s_vsbed   FOR v_vsbed,
                 "PO Type
                 s_bsark   FOR v_bsark OBLIGATORY,
                  "Sold-to
                 s_kunnr   FOR v_kunnr,
                 "Ship-to
                 s_kunnr1  FOR v_kunnr,
                 "JDC Code
                 s_jdc     FOR v_kunnr,"++MOD-017
                 "Req. Delivery date
                 s_vdatu   FOR v_vdatu OBLIGATORY,
                 "Customer PO Number
                 s_bstnk   FOR v_bstnk,
                 "Sales Office
                 s_vkbur   FOR v_vkbur,
                  "Sales Group
                 s_vkgrp   FOR v_vkgrp,
                  "Commercial Sales Center
                 s_com_sc  FOR v_com_sc,
                 "Commercial Route
                 s_com_rt  FOR v_char4,
                 "Delivery Sales Center
                 s_del_sc  FOR v_del_sc,
                 "Delivery Route
                 s_del_rt  FOR v_char4,
                 "Bottler Account Group Code
                 s_bagc FOR v_bagc."MOD-008

PARAMETERS: p_tzone TYPE ttzz-tzone DEFAULT 'JAPAN'. "MOD-009

SELECTION-SCREEN END OF BLOCK a.

*-- Item Selection Criteria
SELECTION-SCREEN BEGIN OF BLOCK b
                          WITH FRAME TITLE text-002.
"Material Number
SELECT-OPTIONS:  s_matnr   FOR v_matnr,
                 "Item Category
                 s_pstyv   FOR v_pstyv,
                 "Delivery Plant
                 s_werks   FOR v_werks,
                 "Rejection Reason
                 s_abgru   FOR v_abgru,
                  "Shipping Point
                 s_vstel   FOR v_vstel,
                  "Route
*                 s_route   FOR v_route, Defect 1597
                  "Subcode
                 s_atwrt   FOR v_atwrt.

SELECTION-SCREEN END OF BLOCK b.

*-- Other Criteria
SELECTION-SCREEN BEGIN OF BLOCK c
                          WITH FRAME TITLE text-003.
"Open orders
PARAMETERS: rb_o_ord RADIOBUTTON GROUP gp1,
              "All orders
            rb_a_ord RADIOBUTTON GROUP gp1 DEFAULT 'X',
            "Layout
            p_layout TYPE slis_vari.

SELECTION-SCREEN END OF BLOCK c.
