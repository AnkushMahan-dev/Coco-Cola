*----------------------------------------------------------------------*
* Program Name     : Sakshi Singla                                     *
* Program Title    : /CCEJ/RDSDSLSR_SO_MAINT_TOP                       *
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
* Mod No.            : 019                                             *
* Date               : 07-Nov-2017                                     *
* Author             : Ashok Kumar  <S422335>                          *
* Change Reference   : Defect # 9000001959                             *
* Transport Number   :  DJRK994006                                     *
* Change Request     : 8000002507                                      *
* Change Description : Add New field VTTK-DPTBG (shipment plan date)   *
*----------------------------------------------------------------------*
* Mod No.            : MOD-021                                         *
* Date               : 24-Jul-2026                                     *
* Change Description : Performance remediation to resolve report       *
* timeout. Lookup tables that are bulk-selected once and read only via *
* READ TABLE ... BINARY SEARCH converted to SORTED TABLE so order is   *
* guaranteed by the type system (removed the now-redundant explicit    *
* SORT statements in the SUB include). Removed unused I_LIKP/I_VBRK    *
* declarations (dead since MOD-020). No change to selection logic,     *
* business calculations or ALV output.                                 *
*----------------------------------------------------------------------*
* Mod No.            : MOD-022                                         *
* Date               : 27-Jul-2026                                     *
* Change Description : SAT runtime comparison showed MOD-021 made the  *
* report SLOWER than the original, not faster. Root cause: bulk        *
* SELECT ... INTO TABLE into a SORTED TABLE inserts every fetched row  *
* into its sorted position one at a time, which for the large VBAK/    *
* VBAP/VBFA volumes this report handles is more expensive than an      *
* unsorted bulk APPEND plus a single SORT. Reverted all MOD-021        *
* SORTED TABLE declarations back to STANDARD TABLE (matching the       *
* pre-MOD-021 declarations); the explicit SORT + READ TABLE ...        *
* BINARY SEARCH pattern is restored in the SUB include. Kept the       *
* MOD-021 changes that were not part of the regression (LIPS driving-  *
* table de-duplication, CREATE OBJECT/CALL METHOD modernization,       *
* removal of unused I_LIKP/I_VBRK). No change to selection logic,      *
* business calculations or ALV output.                                 *
*----------------------------------------------------------------------*
*&---------------------------------------------------------------------*
*&  Include           /CCEJ/RDSDSLSR_SO_MAINT_TOP
*&---------------------------------------------------------------------*

TYPES:  BEGIN OF  ty_final_sel.
        INCLUDE STRUCTURE /ccej/slss_so_maint_out.
TYPES: select TYPE flag,
            END OF  ty_final_sel.

TYPES: tb_t_final_sel TYPE STANDARD TABLE OF ty_final_sel.

*-- VBAK structure (header)
TYPES: BEGIN OF ty_vbak,
        vbeln TYPE vbeln_va,   " Sales order
        erdat TYPE erdat,      " date
        erzet TYPE erzet,      " Entry time
        ernam TYPE ernam,      " created by
        audat TYPE audat,      " Document Date (Date Received/Sent)
        auart TYPE auart,      " Sales Document Type
        augru TYPE augru,      " Order reason
        submi TYPE submi,      " Collective number
        vkorg TYPE vkorg,      " sales org
        vtweg TYPE vtweg,      " distribution
        spart TYPE spart,      " division
        vkgrp TYPE vkgrp,      "sales group
        vkbur TYPE vkbur,      "Sales Office
**  BOC BY S172466 MOD-001
        knumv TYPE knumv,      " condition number
**  EOC BY S172466 MOD-001
        vsbed TYPE vsbed,      " Shipping Conditions
* Begin of addition for MOD-013|Defect#3886
        ktext TYPE ktext_v,
* End of addition for MOD-013|Defect#3886
        bstnk TYPE bstnk,      " Customer purchase order number
        bsark TYPE bsark,      " Customer purchase order type
        bstdk TYPE bstdk,      " date
        ihrez TYPE ihrez,      " reference
        bname TYPE bname,      " name
        kunnr TYPE kunnr,      " customer
        xblnr	TYPE xblnr_v1,"Reference Document Number" MOD-003
        vsnmr_v TYPE vsnmr_v,  " version field
        vbeln_new TYPE tdobname, " To make field compatible" MOD-001
       END OF ty_vbak,

*-- VBAP structure (Line Item)
       BEGIN OF ty_vbap,
         vbeln TYPE vbeln_va,  " sales order number
         posnr TYPE posnr_va,  " item number
         matnr TYPE matnr,     " material
         charg TYPE charg_d,   " charg
         pstyv TYPE pstyv,     " item category
         abgru TYPE abgru,     " order reason
         meins TYPE meins,     " base unit
**       BOC BY S172466 MOD-002
         netwr TYPE netwr_ap, " Amount
**       EOC BY S172466 MOD-002
         kwmeng TYPE kwmeng,   " Cumulative Order Quantity
         klmeng TYPE klmeng,   "Case Quantity MOD-018
         vrkme TYPE vrkme,     "Sales unit
         werks TYPE werks_d,   " plant
         vstel TYPE vstel,     " Shipping Point/Receiving Point
         route TYPE route,     " route
*         netpr TYPE netpr,     "amount" MOD-002
         knuma_pi TYPE knuma_pi,"Shipping Point/Receiving Point
         /scl/atwrt TYPE atwrt," subcode
       END OF ty_vbap,

*-- Ship To Party Structure
       BEGIN OF ty_vbpa,
         vbeln TYPE vbeln, " sales order
         posnr TYPE posnr, "item
         parvw TYPE parvw, " partner type
         kunnr TYPE kunnr, " customer
       END OF ty_vbpa,


*-- Ship to Party Name structure
       BEGIN OF ty_kna1,
         kunnr TYPE kunnr, " customer
         name1 TYPE name1_gp," name
         "Bottler Account group code
         /ccc/gedatnr	TYPE /ccc/md_gedatnr,"MOD-008
       END OF ty_kna1,
**       BOC BY S172466 MOD-004
       BEGIN OF ty_vbeln,
         vbeln TYPE tdobname,
       END OF ty_vbeln,
**       EOC BY S172466 MOD-004

**      BOC BY S172466 MOD-008 defect 3146
*      Incompletion Log
       BEGIN OF ty_vbuv,
         vbeln TYPE vbeln,
         posnr TYPE posnr,
       END OF ty_vbuv,

*       Invoice item
        BEGIN OF ty_vbrp,
          vbeln TYPE vbeln_vf,
          posnr TYPE posnr_vf,
          fkimg TYPE fkimg,
        END OF ty_vbrp,

**      EOC BY S172466 MOD-008 defect 3146

*-- Sales Center and Route Structure
       BEGIN OF ty_vbkd,
         vbeln TYPE vbeln," slaes order
         posnr TYPE posnr," item
         ihrez TYPE ihrez," reference field
         ihrez_e TYPE ihrez_e," reference field 2
       END OF ty_vbkd,

*-- Schedule Line details structure
       BEGIN OF ty_vbep,
         vbeln TYPE vbeln_va, " sales order
         posnr TYPE posnr_va, " item
         etenr TYPE etenr,    "Delivery Schedule Line Number
         edatu TYPE edatu,    " date
**      BOC BY S172466 MOD-003 Defect 1813
*         wmeng TYPE wmeng,     " order qty
*         bmeng TYPE bmeng,     " confirmed qty
**      EOC BY S172466 MOD-003 Defect 1813
       END OF ty_vbep,

*-- Sales Order status structure
       BEGIN OF ty_vbup,
         vbeln TYPE vbeln, " sales order no.
         posnr TYPE posnr, " item
         lfgsa TYPE lfgsa, " overall status of doc
       END OF ty_vbup,

       BEGIN OF ty_makt,
         matnr TYPE matnr, " material
         maktx TYPE maktx, " material description
       END OF ty_makt,

**       BOC BY S172466 MOD-001
       BEGIN OF ty_stxh,
          tdobject  TYPE tdobject,
          tdname TYPE   tdobname,
          tdid TYPE   tdid,
          tdspras TYPE 	spras,
       END OF ty_stxh,
**       EOC BY S172466 MOD-001

**BOC BY S172466 MOD-001**
*-- Price details structure

       BEGIN OF ty_konv,
         knumv TYPE knumv, " condition no.
         kposn TYPE kposn, " item no.
" *****Code Remediation changes S4 2025_S Conversion **begin of change by EJX9007360 2026.06.09 ATC
* zaehk  TYPE dzaehk," condition count
         stunr  TYPE stunr, " step number
          zaehk  TYPE dzaehk, "#EC CI_USAGE_OK[2220005]
         kschl TYPE kscha, " condition type
         kbetr TYPE kbetr, " condition value
         kpein TYPE kpein, " Condition unit
         knumh TYPE knumh, " condition record no.
" *****Code Remediation changes S4 2025_S Conversion **end of change by EJX9007360 2026.06.09 ATC
         kwert TYPE kwert," Condition val" MOD-011
       END OF ty_konv,

**       condition type
       BEGIN OF ty_a595,
         kschl  TYPE kscha, " condition type
         knuma_ag TYPE   knuma_ag," sales deal
         vkorg  TYPE vkorg,       " sales org
         kunnr  TYPE kunnr_v,     " customer
         vkbur  TYPE vkbur,       " sales office
         matnr  TYPE matnr,       "material
         vrkme  TYPE vrkme,       " sales unit
         knumh  TYPE knumh,       " condition record number
        END OF ty_a595,
** EOC BY S172466 MOD-001
*-- Plant structure
       BEGIN OF ty_werks,
         werks TYPE werks_d,      "Plant
       END OF ty_werks,

*-- PSales Org structure
       BEGIN OF ty_vkorg,
         vkorg TYPE vkorg,      " Sales Org
       END OF ty_vkorg,

       BEGIN OF ty_bsark,   " po type
         bsark TYPE bsark,
       END OF ty_bsark,

**       BOC BY S172466 MOD-003 defect 1813
      BEGIN OF ty_knvv,
        kunnr TYPE kunnr," customer
        /ccej/knvv_zkzdeakbn TYPE /ccej/knvv_zkzdeakbn," Trading division
      END OF ty_knvv,
**      " FOr delivery related info
      BEGIN OF ty_vbfa,
        vbelv	TYPE vbeln_von,
        posnv	TYPE posnr_von,
        vbeln TYPE 	vbeln_nach,
        posnn	TYPE posnr_nach,
        vbtyp_n	TYPE VBTYPL_N ,
*        rfmng  TYPE rfmng,
        vbtyp_v	TYPE VBTYPL_V ,
        erdat TYPE erdat,
        erzet TYPE erzet,
      END OF ty_vbfa,

**     for delivery quantity
      BEGIN OF ty_lips,
        vbeln TYPE vbeln_vl,
        posnr TYPE posnr_vl,
        lfimg TYPE lfimg,
        vgpos TYPE vgpos,
        END OF ty_lips,
      " for shipment
      BEGIN OF ty_vttk,
        tknum TYPE tknum,
*       BOC MOD-008
        erdat TYPE erdat,
        erzet TYPE erzet,
        dtabf TYPE dtabf,
        uzabf TYPE uzabf,
        dptbg TYPE dptbg, " added in MOD-019 by S422335
        sttrg TYPE sttrg,
*       EOC MOD-008
       /bev1/rpfar1  TYPE  /dsd/rp_driver1, "Driver 1
        END OF ty_vttk,
*       Begin of change in MOD-019 by S422335
        BEGIN OF ty_t42,
         zkzkunnrfnb TYPE /ccej/zkzkunnrfnb,
         zkhaistimf TYPE /ccej/zkhaistimf,
         zkhaistimt TYPE /ccej/zkhaistimt,
        END OF ty_t42.
*       End of change in MOD-019

**       EOC BY S172466 MOD-003 defect 1813
*--Start of addition for MOD-010
TYPES:BEGIN OF ty_partner,
        sign  TYPE tvarv_sign,
        opti  TYPE tvarv_opti,
        low	  TYPE tvarv_val,
        high  TYPE tvarv_val,
      END OF ty_partner.
TYPES:tb_partner TYPE STANDARD TABLE OF ty_partner.
*--End of addition for MOD-010
*-----Table Types
TYPES  tb_alv  TYPE STANDARD TABLE OF  /ccej/slss_so_maint_out."ty_alv.

*-----Constants
"ALV
CONSTANTS:  "Error message
           c_error       TYPE char1        VALUE  'E',
           "Success message
           c_succ        TYPE char1        VALUE  'S',

           "Ship to party
           c_ship        TYPE parvw        VALUE  'WE',
             "radiobutton
           c_x           TYPE c            VALUE 'X',
            "Sales order status: not yet processed
           c_stat1       TYPE lfstk        VALUE 'A',
            "Sales order status:partially processed
           c_stat2       TYPE lfstk        VALUE 'B',
**           BOC BY S172466 MOD-001
           c_type        TYPE rsscr_kind   VALUE 'S',
            "KSCHL TVARVC Name
           c_name1       TYPE rvari_vnam
                         VALUE '/CCEJ/OTC_KSCHL',
           "BOC for MOD-015
            "AUART TVARVC Name
           c_jdc_auart       TYPE rvari_vnam
                         VALUE '/CCEJ/OTC_JDC_AUART',
             "EOC for MOD-015
**           EOC BY S172466 MOD-001
"Sales price Exclusive Price " UNIT PRICE
           c_kschl_yjr4  TYPE kschl        VALUE 'YJR4',
"Sales price Exclusive Price " UNIT PRICE
           c_kschl_yjr0  TYPE kschl        VALUE 'YJR0',
**           BOC BY S172466  MOD-006
"Sales price Exclusive Price " UNIT PRICE
           c_kschl_yjr6  TYPE kschl        VALUE 'YJR6',
**           EOC BY S172466 MOD-006
**           BOC BY S172466 MOD-007
"Sales price Exclusive Price " UNIT PRICE
           c_kschl_yjr5  TYPE kschl        VALUE 'YJR5',
**           EOC BY S172466 MOD-007
*           "EOS Price
           c_kschl_yjrb  TYPE kschl        VALUE 'YJRB',
*           "Bottle sales
           c_kschl_yjbs  TYPE kschl        VALUE 'YJBS',
*                "Shell sales
           c_kschl_yjss  TYPE kschl        VALUE 'YJSS',
            "bottle deposit
           c_kschl_yjbh  TYPE kschl        VALUE 'YJBH',
**            BOC BY S172466 MOD-011
*             YJBL  Bottle Lease
            c_kschl_yjbl  TYPE kschl        VALUE 'YJBL',
*            YJSL	Crate Lease
            c_kschl_yjsl  TYPE kschl        VALUE 'YJSL',
**            EOC BY S172466 MOD-011
           "Crate/shell deposit
           c_kschl_yjsh  TYPE kschl        VALUE 'YJSH',
          " subcode low
            c_sb_low     TYPE dynfnam      VALUE 'S_ATWRT-LOW',
            "subcode high
           c_sb_high    TYPE dynfnam       VALUE 'S_ATWRT-HIGH',
             "Text ID for Header text
           c_txtid1 TYPE tdid VALUE 'YJCH',
             "Text Object for header text of sales document
           c_hobj   TYPE tdobject VALUE 'VBBK',
*          BOC MOD-008
           c_red TYPE char4 VALUE '@0A@',"Red Light
           c_green TYPE char4 VALUE '@08@',"Green Light
*          BOC MOD-008
*--Start of addition for MOD-010
           c_i TYPE sign VALUE 'I',       "Sign
           c_eq TYPE option VALUE 'EQ',   "Option
           "JDC code
           c_jdc        TYPE parvw  VALUE  'SB'.
*--End of addition for MOD-010

*-----Variables
DATA: v_sel_line  TYPE i,          "#EC NEEDED "count of selected lines
      v_tot_lines TYPE i.  "#EC NEEDED  "count of lines in final output

*-----Field Symbols
FIELD-SYMBOLS : <fs_vbak> TYPE ty_vbak.                     "#EC NEEDED


*-----Internal Table and work areas
*-- MOD-022: MOD-021 had converted these lookup tables to SORTED
*-- TABLE. SAT runtime comparison showed that was a net loss: bulk
*-- SELECT ... INTO TABLE against a SORTED/HASHED table target has to
*-- insert every fetched row into its sorted position individually,
*-- which is slower than an unsorted bulk APPEND followed by one SORT
*-- pass for the large volumes this report pulls (VBAK/VBAP/VBFA can
*-- run into tens of thousands of rows). Reverted to STANDARD TABLE;
*-- the SORT + READ TABLE ... BINARY SEARCH pattern (already in place
*-- before MOD-021) is restored in the SUB include.
DATA: i_vbak TYPE STANDARD TABLE OF ty_vbak,                "#EC NEEDED
      i_kschl TYPE STANDARD TABLE OF selopt,      "#EC NEEDED " MOD-001
      i_jdc_auart TYPE STANDARD TABLE OF selopt,  "#EC NEEDED " MOD-015
      i_vbap TYPE STANDARD TABLE OF ty_vbap,                "#EC NEEDED
      i_vbpa TYPE STANDARD TABLE OF ty_vbpa,                "#EC NEEDED
      i_kna1 TYPE STANDARD TABLE OF ty_kna1,                "#EC NEEDED
**      BOC BY S172466 MOD-008 defect 3146
      i_vbuv TYPE STANDARD TABLE OF ty_vbuv,                "#EC NEEDED
      i_vbrp TYPE STANDARD TABLE OF ty_vbrp,                "#EC NEEDED
**      EOC BY S172466 MOD-008 defect 3146
      i_vbkd TYPE STANDARD TABLE OF ty_vbkd,                "#EC NEEDED
      i_vbep TYPE STANDARD TABLE OF ty_vbep,                "#EC NEEDED
      i_vbup TYPE STANDARD TABLE OF ty_vbup,                "#EC NEEDED
      i_makt TYPE STANDARD TABLE OF ty_makt,                "#EC NEEDED
      i_stxh TYPE STANDARD TABLE OF ty_stxh,       "#EC NEEDED" MOD-001
      i_konv TYPE STANDARD TABLE OF ty_konv,       "#EC NEEDED" MOD-001
      i_a595 TYPE STANDARD TABLE OF ty_a595,       "#EC NEEDED" MOD-001
      i_auth_werks TYPE STANDARD TABLE OF selopt,           "#EC NEEDED
      i_auth_bsark TYPE STANDARD TABLE OF selopt,           "#EC NEEDED
      i_auth_vkorg TYPE STANDARD TABLE OF selopt,           "#EC NEEDED
      i_alv        TYPE tb_alv,                             "#EC NEEDED
      i_final TYPE tb_alv,                                  "#EC NEEDED
      i_sel_orders TYPE STANDARD TABLE OF ty_final_sel,     "#EC NEEDED
      i_knvv TYPE STANDARD TABLE OF ty_knvv,       "#EC NEEDED" MOD-003
      i_vbfa TYPE STANDARD TABLE OF ty_vbfa,       "#EC NEEDED" MOD-003
      i_vbfa_ship TYPE STANDARD TABLE OF ty_vbfa,  "#EC NEEDED" MOD-003
      i_lips TYPE STANDARD TABLE OF ty_lips,       "#EC NEEDED" MOD-003
      i_vttk TYPE STANDARD TABLE OF ty_vttk,       "#EC NEEDED" MOD-003
      i_t42 TYPE STANDARD TABLE OF ty_t42,         "#EC NEEDED" MOD-019


wa_variant   TYPE disvariant.
**Selection screen variables*
DATA: v_char4 TYPE char4,
      v_vkorg TYPE vkorg,
      v_vtweg TYPE vtweg,
      v_spart TYPE spart,
      v_vbeln TYPE vbak-vbeln,
      v_erdat TYPE erdat,
      v_erzet TYPE erzet,
      v_ernam TYPE usr21-bname,
      v_auart TYPE vbak-auart,
      v_augru TYPE vbak-augru,
      v_vsbed TYPE vbak-vsbed,
      v_bsark TYPE vbak-bsark,
      v_kunnr TYPE kunnr,
      v_vdatu TYPE edatu_vbak,
      v_bstnk TYPE bstnk,
      v_vkbur TYPE vbak-vkbur,
      v_vkgrp TYPE vbak-vkgrp,
      v_matnr TYPE vbap-matnr,
      v_pstyv TYPE vbap-pstyv,
      v_werks TYPE werks_d,
      v_abgru TYPE vbap-abgru,
      v_vstel TYPE vbap-vstel,
*      v_route TYPE vbap-route,MOD-001 defect 1597
      v_atwrt TYPE atwrt,
      v_com_sc TYPE vbak-vkbur,                             "#EC NEEDED
      v_del_sc TYPE vbak-vkbur,                             "#EC NEEDED
      v_days   TYPE char2,                                  "#EC NEEDED
      v_records TYPE char10,                                "#EC NEEDED
** BOC by S404352 MOD-005
      v_lines  TYPE char10,                                 "#EC NEEDED
** EOC by S404352 MOD-005
      v_bagc TYPE /ccc/md_gedatnr."MOD-008


DATA: o_table   TYPE REF TO cl_salv_table,                  "#EC NEEDED
      o_selections TYPE REF TO cl_salv_selections.          "#EC NEEDED

CONSTANTS: c_zone TYPE ttzz-tzone VALUE 'JAPAN',
"Start of addition for MOD-014
           c_one TYPE /ccc/mdm_discount_ind  VALUE '1'.
"End of addition for MOD-014
