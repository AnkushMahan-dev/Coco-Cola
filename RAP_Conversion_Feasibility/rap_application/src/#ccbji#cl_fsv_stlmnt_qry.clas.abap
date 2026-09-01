*&---------------------------------------------------------------------*
*&  Class  /CCBJI/CL_FSV_STLMNT_QRY
*&---------------------------------------------------------------------*
*&  RAP query implementation (Pattern B) for /CCBJI/I_FSV_STLMNT_DTL.
*&  Modernizes report /CCBJI/RDSDFSVG_STLMNT_DETAILS - all 9 modes of
*&  the classic g2 radio group, dispatched by the ReportMode filter.
*&
*&  ARCHITECTURE (mirrors the report):
*&    selection -> /CCEJ/T_INB_STAT (plant/date -> visit list)
*&              -> /DSD/ST_STATUS   (-> tour_id)         = get_tours( )
*&              -> per-reportmode table by tour_id / shipment = read_<mode>( )
*&
*&  NO-DUMP GUARANTEE: the whole select() body and every read_* method run
*&  inside TRY/CATCH cx_root, so no input can ever short-dump the service -
*&  any DB/data error simply yields an empty result set.
*&---------------------------------------------------------------------*
CLASS /ccbji/cl_fsv_stlmnt_qry DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_rap_query_provider.

  PRIVATE SECTION.

    TYPES: tt_r_tknum  TYPE RANGE OF tknum,
           tt_r_route  TYPE RANGE OF route,
           tt_r_erdat  TYPE RANGE OF erdat,
           tt_r_werks  TYPE RANGE OF werks_d,
           tt_r_status TYPE RANGE OF /dsd/st_status_id,
           tt_r_tplst  TYPE RANGE OF tplst,
           tt_r_driver TYPE RANGE OF /dsd/rp_driver1,
           tt_r_truck  TYPE RANGE OF /dsd/rp_truck,
           tt_r_mode   TYPE RANGE OF /ccbji/fsv_mode,
           ty_status   TYPE c LENGTH 1,
           ty_rowkey   TYPE c LENGTH 120,
           ty_tour32   TYPE c LENGTH 32,
           ty_visit6   TYPE n LENGTH 6,
           ty_amt      TYPE p LENGTH 15 DECIMALS 2.

    " Detail-level filter ranges (Option A - every exposed filter is applied
    " as a post-filter on the built result, so filters that are not part of
    " tour resolution - Customer, Material, etc. - genuinely narrow the list).
    TYPES: tt_r_kunnr  TYPE RANGE OF kunnr,
           tt_r_matnr  TYPE RANGE OF matnr,
           tt_r_vkorg  TYPE RANGE OF vkorg,
           tt_r_paymt  TYPE RANGE OF /dsd/hh_paymt,
           tt_r_waers  TYPE RANGE OF waers,
           tt_r_sldid  TYPE RANGE OF /dsd/sl_sld_id,
           tt_r_visit  TYPE RANGE OF ty_visit6,
           tt_r_tour   TYPE RANGE OF ty_tour32,
           tt_r_viscod TYPE RANGE OF /dsd/hh_viscod,
           tt_r_objtyp TYPE RANGE OF /dsd/hh_del_doctyp,
           tt_r_vbeln  TYPE RANGE OF vbeln_vl,
           tt_r_casht  TYPE RANGE OF /dsd/hh_csh_typ.

    TYPES: BEGIN OF ty_tour,
             tourid    TYPE /dsd/hh_tour_id,
             vlid      TYPE /dsd/vc_vlid,
             shipment  TYPE tknum,
             werks     TYPE werks_d,
             route     TYPE route,
             date      TYPE erdat,
             idoc      TYPE edi_docnum,
             status_id TYPE /dsd/st_status_id,
           END OF ty_tour,
           tt_tour TYPE STANDARD TABLE OF ty_tour WITH DEFAULT KEY.

    TYPES tt_status TYPE STANDARD TABLE OF /dsd/st_status WITH DEFAULT KEY.

    TYPES: BEGIN OF ty_result,
             rowkey            TYPE c LENGTH 120,
             seqno            TYPE i,
             reportmode       TYPE c LENGTH 4,
             shipmentno       TYPE tknum,
             tourid           TYPE c LENGTH 32,
             visitid          TYPE n LENGTH 6,
             processingstatus TYPE c LENGTH 2,
             tpp              TYPE tplst,
             statusid         TYPE /dsd/st_status_id,
             plant            TYPE werks_d,
             route            TYPE route,
             settlementdate   TYPE erdat,
             driver           TYPE /dsd/rp_driver1,
             codriver         TYPE /dsd/rp_driver1,
             vehicle          TYPE /dsd/rp_truck,
             scenario         TYPE c LENGTH 1,
             driverswap          TYPE c LENGTH 1,
             visitgroup       TYPE /dsd/vc_authority,
             idocno           TYPE edi_docnum,
             createdon        TYPE dats,
             createdtime      TYPE tims,
             createdby        TYPE c LENGTH 12,
             changedon        TYPE dats,
             changedtime      TYPE tims,
             changedby        TYPE c LENGTH 12,
             light            TYPE int1,
             exceptiontext    TYPE c LENGTH 10,
             customer         TYPE kunnr,
             vkorg            TYPE vkorg,
             visitreason      TYPE /dsd/hh_viscod,
             distchannel      TYPE vtweg,
             division         TYPE spart,
             accountgroup     TYPE ktokd,
             businesstype     TYPE katr4,
             biztypeext       TYPE katr4,
             equipowner       TYPE c LENGTH 2,
             manproc          TYPE c LENGTH 1,
             visitlog         TYPE c LENGTH 1,
             objtype          TYPE /dsd/hh_del_doctyp,
             material         TYPE matnr,
             materialdesc     TYPE maktx,
             quantity         TYPE p LENGTH 8 DECIMALS 3,
             uom              TYPE /dsd/hh_uom,
             quandiff         TYPE p LENGTH 8 DECIMALS 3,
             amount           TYPE p LENGTH 8 DECIMALS 2,
             currency         TYPE waers,
             paymentmethod    TYPE /dsd/hh_paymt,
             cardno           TYPE /dsd/hh_cardnr,
             cashtype         TYPE /dsd/hh_csh_typ,
             slddocid         TYPE /dsd/sl_sld_id,
             accountingdoc    TYPE belnr_d,
             postingkey       TYPE bschl,
             deliveryno       TYPE vbeln_vl,
             ponumber         TYPE bstkd,
             warnings         TYPE i,
             errors           TYPE i,
             referencedoc     TYPE xblnr,
             headertext       TYPE bktxt,
             " ---- Option B: exact per-mode columns from the classic report ----
             " Sales (ty_final1)
             deliveryitem     TYPE c LENGTH 6,
             podate           TYPE dats,
             tacode           TYPE c LENGTH 4,
             reason           TYPE c LENGTH 4,
             reasoncode       TYPE c LENGTH 4,
             batch            TYPE c LENGTH 10,
             condtype         TYPE c LENGTH 4,
             origqty          TYPE p LENGTH 8 DECIMALS 3,
             " Sales - extra classic columns (f_get_sales / f_split_value):
             " Package group (MARA-/SCL/PKGGROUP), Money type + Set ID split
             " out of /SCL/ORIG_QTY, and Sales amount (quan * amount for VL).
             packagegroup     TYPE c LENGTH 4,
             moneytype        TYPE c LENGTH 2,
             setid            TYPE c LENGTH 3,
             moneycode        TYPE c LENGTH 4,
             salesamt         TYPE p LENGTH 8 DECIMALS 2,
             attr3            TYPE c LENGTH 4,
             " Check (ty_final3)
             checkid          TYPE c LENGTH 12,
             itemno           TYPE c LENGTH 6,
             quanplan         TYPE p LENGTH 8 DECIMALS 3,
             quancount        TYPE p LENGTH 8 DECIMALS 3,
             " Payment (ty_final2)
             cashid           TYPE c LENGTH 20,
             paymentdescr     TYPE c LENGTH 20,
             checkno          TYPE c LENGTH 13,
             fiscyear         TYPE n LENGTH 4,
             compcode         TYPE c LENGTH 4,
             " Payment FI posting detail (from CDS I_OperationalAcctgDocItem + BKPF)
             postingitem      TYPE n LENGTH 3,
             postingamount    TYPE p LENGTH 8 DECIMALS 2,
             postingcurrency  TYPE c LENGTH 5,
             postingdate      TYPE dats,
             documentdate     TYPE dats,
             doctype          TYPE c LENGTH 2,
             reversaldoc      TYPE c LENGTH 10,
             " Money (ty_final4)
             amountco         TYPE p LENGTH 8 DECIMALS 2,
             amountexpenses   TYPE p LENGTH 8 DECIMALS 2,
             amountearnings   TYPE p LENGTH 8 DECIMALS 2,
             amountci         TYPE p LENGTH 8 DECIMALS 2,
             amountplan       TYPE p LENGTH 8 DECIMALS 2,
             amountdiff       TYPE p LENGTH 8 DECIMALS 2,
             amountdiffeval   TYPE p LENGTH 8 DECIMALS 2,
             " Quantity (ty_final5)
             quancheckout     TYPE p LENGTH 8 DECIMALS 3,
             quandelivered    TYPE p LENGTH 8 DECIMALS 3,
             quanreturn       TYPE p LENGTH 8 DECIMALS 3,
             quancheckin      TYPE p LENGTH 8 DECIMALS 3,
             quanfinaldiff    TYPE p LENGTH 8 DECIMALS 3,
             valuefindiff     TYPE p LENGTH 8 DECIMALS 2,
             " FSR Documents - full document chain (classic f_get_shipment_data
             " / f_build_itab / f_get_data): sales order, delivery, invoice,
             " material doc and accounting doc.
             salesdoc         TYPE c LENGTH 10,
             salesdoctype     TYPE c LENGTH 4,
             orderdate        TYPE dats,
             deliverytype     TYPE c LENGTH 4,
             deliverydate     TYPE dats,
             materialdoc      TYPE c LENGTH 10,
             billingtype      TYPE c LENGTH 4,
             invoiceno        TYPE c LENGTH 10,
             invoicedate      TYPE dats,
             refkey           TYPE c LENGTH 20,
             cominv           TYPE c LENGTH 10,
             cominvtype       TYPE c LENGTH 4,
             cominvdate       TYPE dats,
             comfidoc         TYPE c LENGTH 10,
             comfitype        TYPE c LENGTH 4,
             comfidate        TYPE dats,
             " Route Summary (CASH) - full classic f_set_columns4 figures,
             " captured from the external cash-difference program's ALV.
             summarystatus    TYPE c LENGTH 20,
             paymentdiffstatus TYPE c LENGTH 20,
             tradingdiv       TYPE c LENGTH 4,
             visittype        TYPE c LENGTH 4,
             empid            TYPE c LENGTH 20,
             promoamt         TYPE p LENGTH 8 DECIMALS 2,
             aggfreeamt       TYPE p LENGTH 8 DECIMALS 2,
             freevendamt      TYPE p LENGTH 8 DECIMALS 2,
             aggsampleqty     TYPE p LENGTH 8 DECIMALS 3,
             sampleamount     TYPE p LENGTH 8 DECIMALS 2,
             netamt           TYPE p LENGTH 8 DECIMALS 2,
             cashcollected    TYPE p LENGTH 8 DECIMALS 2,
             recharge         TYPE p LENGTH 8 DECIMALS 2,
             refund           TYPE p LENGTH 8 DECIMALS 2,
             receipt          TYPE p LENGTH 8 DECIMALS 2,
             uncollectcash    TYPE p LENGTH 8 DECIMALS 2,
             bankedamt        TYPE p LENGTH 8 DECIMALS 2,
             theorcash        TYPE p LENGTH 8 DECIMALS 2,
             totcash          TYPE p LENGTH 8 DECIMALS 2,
             emoney           TYPE p LENGTH 8 DECIMALS 2,
             prepaid          TYPE p LENGTH 8 DECIMALS 2,
             totpayment       TYPE p LENGTH 8 DECIMALS 2,
             diffamt          TYPE p LENGTH 8 DECIMALS 2,
             drivercredit     TYPE p LENGTH 8 DECIMALS 2,
             driverdebit      TYPE p LENGTH 8 DECIMALS 2,
             driverreceive    TYPE p LENGTH 8 DECIMALS 2,
             drivergive       TYPE p LENGTH 8 DECIMALS 2,
             " Tour Details extra columns (classic f_get_driver_details)
             checkin          TYPE c LENGTH 1,
             checkout         TYPE c LENGTH 1,
             origedate        TYPE dats,
             logstatus        TYPE c LENGTH 1,
             manrel           TYPE c LENGTH 1,
             origin           TYPE c LENGTH 1,
             planned          TYPE c LENGTH 1,
             presalesstatus   TYPE c LENGTH 1,
             tourstatus       TYPE c LENGTH 4,
             fsrstatus        TYPE c LENGTH 10,
             " Payment extra columns (classic f_get_payment)
             recipient        TYPE kunnr,
             dummyflag        TYPE c LENGTH 1,
             plog             TYPE c LENGTH 1,
             rcptexp          TYPE c LENGTH 4,
           END OF ty_result,
           tt_result TYPE STANDARD TABLE OF ty_result WITH DEFAULT KEY.

    METHODS get_tours
      IMPORTING it_shipment    TYPE tt_r_tknum
                it_route       TYPE tt_r_route
                it_settle_date TYPE tt_r_erdat
                it_plant       TYPE tt_r_werks
                it_status      TYPE tt_r_status
      RETURNING VALUE(rt_tour) TYPE tt_tour.

    "! Build tours from status rows (enrich plant/route/date from /CCEJ,
    "! apply the leading-zero-insensitive route filter). Shared by get_tours
    "! and sample_tours.
    METHODS enrich_tours
      IMPORTING it_status      TYPE tt_status
                it_route       TYPE tt_r_route
      RETURNING VALUE(rt_tour) TYPE tt_tour.

    "! Blank search: sample tours FROM THE SELECTED MODE'S detail table, so
    "! every mode (not just Tour) returns data when Go is pressed with no
    "! filter. iv_max is DERIVED FROM THE PAGING WINDOW (offset + page size),
    "! so the count grows as the client scrolls instead of being a hard 100;
    "! a per-mode cap keeps in-memory rows bounded (no TSV dump).
    METHODS sample_tours
      IMPORTING iv_mode        TYPE /ccbji/fsv_mode
                iv_max         TYPE i
      RETURNING VALUE(rt_tour) TYPE tt_tour.

    METHODS read_tour     IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
    METHODS read_visit    IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
    METHODS read_sales    IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
    METHODS read_payment  IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
    METHODS read_check    IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
    METHODS read_money    IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
    METHODS read_quan     IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
    METHODS read_fsr      IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.
    METHODS read_cash     IMPORTING it_tour TYPE tt_tour RETURNING VALUE(rt) TYPE tt_result.

    "! CASH Object Page single-row read: reconstruct exactly the clicked row
    "! from its RowKey (mode + visit id + visit list) WITHOUT re-running the
    "! external cash-difference program, and enrich the cheap header fields.
    "! Keeps tour id EMPTY so the rebuilt RowKey matches the list row.
    METHODS read_cash_key
      IMPORTING iv_vlid       TYPE /dsd/vc_vlid
                iv_visit      TYPE ty_visit6
      RETURNING VALUE(rt)     TYPE tt_result.

    METHODS derive_processing_status
      IMPORTING iv_warnings      TYPE i
                iv_errors        TYPE i
      RETURNING VALUE(rv_status) TYPE ty_status.

    "! Safe dynamic component copy (used by the CASH mode's dynamic ALV mapping).
    METHODS move_comp
      IMPORTING is_row  TYPE any
                iv_comp TYPE string
      CHANGING  cv      TYPE any.

    "! Convert an internal amount to JPY external format, exactly like the
    "! classic f_currency_conversion (BAPI_CURRENCY_CONV_TO_EXTERNAL, JPY).
    "! Guarded - on any error the input value is returned unchanged (no dump).
    METHODS conv_jpy
      IMPORTING iv_in         TYPE p
      RETURNING VALUE(rv_out) TYPE ty_amt.

    "! Convert a UTC date/time to Japan local time (classic
    "! f_get_local_timezone via ISU_DATE_TIME_CONVERT_TIMEZONE, zone JAPAN).
    METHODS to_local_time
      IMPORTING iv_date TYPE dats
                iv_time TYPE tims
      EXPORTING ev_date TYPE dats
                ev_time TYPE tims.

    "! Split /SCL/ORIG_QTY (char17) into money code / set id / money type,
    "! exactly like classic f_split_value: take the integer part before the
    "! decimal point, left-pad with zeros to 9 digits, then slice
    "! 0(4)=money code, 4(3)=set id, 7(2)=money type.
    METHODS split_orig_qty
      IMPORTING iv_qty         TYPE p
      EXPORTING ev_money_type  TYPE c
                ev_set_id      TYPE c
                ev_money_code  TYPE c.

ENDCLASS.


CLASS /ccbji/cl_fsv_stlmnt_qry IMPLEMENTATION.

  METHOD if_rap_query_provider~select.

    DATA lt_shipment    TYPE tt_r_tknum.
    DATA lt_route       TYPE tt_r_route.
    DATA lt_settle_date TYPE tt_r_erdat.
    DATA lt_plant       TYPE tt_r_werks.
    DATA lt_status      TYPE tt_r_status.
    DATA lt_tpp         TYPE tt_r_tplst.
    DATA lt_driver      TYPE tt_r_driver.
    DATA lt_vehicle     TYPE tt_r_truck.
    DATA lt_mode        TYPE tt_r_mode.
    DATA lt_seqno       TYPE RANGE OF int4.
    DATA lt_rowkey      TYPE RANGE OF ty_rowkey.

    " Detail-level (post) filters.
    DATA lt_f_customer  TYPE tt_r_kunnr.
    DATA lt_f_material  TYPE tt_r_matnr.
    DATA lt_f_vkorg     TYPE tt_r_vkorg.
    DATA lt_f_paymt     TYPE tt_r_paymt.
    DATA lt_f_currency  TYPE tt_r_waers.
    DATA lt_f_slddoc    TYPE tt_r_sldid.
    DATA lt_f_visitid   TYPE tt_r_visit.
    DATA lt_f_tourid    TYPE tt_r_tour.
    DATA lt_f_viscod    TYPE tt_r_viscod.
    DATA lt_f_objtyp    TYPE tt_r_objtyp.
    DATA lt_f_delivery  TYPE tt_r_vbeln.
    DATA lt_f_cashtype  TYPE tt_r_casht.

    " Everything that can touch the DB is inside ONE TRY/CATCH so the
    " OData service can NEVER short-dump - any error returns empty rows.
    DATA lt_result TYPE tt_result.
    DATA lv_mode   TYPE c LENGTH 4 VALUE 'TOUR'.

    " CASH Object Page (by-key) reconstruction, WITHOUT re-running the external
    " cash-difference program. Its identity comes straight from the RowKey.
    DATA lv_bykey_cash TYPE abap_bool.
    DATA lv_cash_vlid  TYPE /dsd/vc_vlid.
    DATA lv_cash_visit TYPE n LENGTH 6.

    TRY.
        TRY.
            DATA(lt_ranges) = io_request->get_filter( )->get_as_ranges( ).
          CATCH cx_rap_query_filter_no_range.
            CLEAR lt_ranges.
        ENDTRY.

        LOOP AT lt_ranges INTO DATA(ls_range).
          " Upper-case the element name so matching is case-insensitive -
          " get_as_ranges may return the CDS element name in mixed case
          " (e.g. 'ShipmentNo'); a case-sensitive CASE would silently ignore
          " every filter and return no data.
          DATA(lv_name) = to_upper( ls_range-name ).
          CASE lv_name.
            WHEN 'SHIPMENTNO'.     lt_shipment    = CORRESPONDING #( ls_range-range ).
            WHEN 'ROUTE'.          lt_route       = CORRESPONDING #( ls_range-range ).
            WHEN 'SETTLEMENTDATE'. lt_settle_date = CORRESPONDING #( ls_range-range ).
            WHEN 'PLANT'.          lt_plant       = CORRESPONDING #( ls_range-range ).
            WHEN 'STATUSID'.       lt_status      = CORRESPONDING #( ls_range-range ).
            WHEN 'TPP'.            lt_tpp         = CORRESPONDING #( ls_range-range ).
            WHEN 'DRIVER'.         lt_driver      = CORRESPONDING #( ls_range-range ).
            WHEN 'VEHICLE'.        lt_vehicle     = CORRESPONDING #( ls_range-range ).
            WHEN 'REPORTMODE'.     lt_mode        = CORRESPONDING #( ls_range-range ).
            WHEN 'SEQNO'.          lt_seqno       = CORRESPONDING #( ls_range-range ).
            WHEN 'ROWKEY'.          lt_rowkey       = CORRESPONDING #( ls_range-range ).
            " Detail-level filters (applied as post-filters on the result).
            WHEN 'CUSTOMER'.       lt_f_customer  = CORRESPONDING #( ls_range-range ).
            WHEN 'MATERIAL'.       lt_f_material  = CORRESPONDING #( ls_range-range ).
            WHEN 'VKORG'.          lt_f_vkorg     = CORRESPONDING #( ls_range-range ).
            WHEN 'PAYMENTMETHOD'.  lt_f_paymt     = CORRESPONDING #( ls_range-range ).
            WHEN 'CURRENCY'.       lt_f_currency  = CORRESPONDING #( ls_range-range ).
            WHEN 'SLDDOCID'.       lt_f_slddoc    = CORRESPONDING #( ls_range-range ).
            WHEN 'VISITID'.        lt_f_visitid   = CORRESPONDING #( ls_range-range ).
            WHEN 'TOURID'.         lt_f_tourid    = CORRESPONDING #( ls_range-range ).
            WHEN 'VISITREASON'.    lt_f_viscod    = CORRESPONDING #( ls_range-range ).
            WHEN 'OBJTYPE'.        lt_f_objtyp    = CORRESPONDING #( ls_range-range ).
            WHEN 'DELIVERYNO'.     lt_f_delivery  = CORRESPONDING #( ls_range-range ).
            WHEN 'CASHTYPE'.       lt_f_cashtype  = CORRESPONDING #( ls_range-range ).
            WHEN OTHERS.
          ENDCASE.
        ENDLOOP.

        " "Blank Go" detector for the DB-paged fast paths. A range the parser
        " could not turn into ranges (e.g. a BETWEEN on the Visit List) leaves
        " lt_shipment empty, which would let the fast path treat a real filter as
        " a blank scroll and return everything. So decide "blank" from the RAW
        " filter string: the fast paths run ONLY when it mentions no restricting
        " field. Any filter -> the proven slow path (which applies it) is used.
        DATA lv_blank_go TYPE abap_bool VALUE abap_true.
        DATA lv_fstr     TYPE string.
        TRY.
            " if_rap_query_filter renders the WHERE condition (incl. BETWEEN,
            " which get_as_ranges cannot express) as an OpenSQL string.
            lv_fstr = to_upper( io_request->get_filter( )->get_as_sql_string( ) ).
          CATCH cx_root.
            " Could not render the filter -> be safe, treat it as a real filter
            " so the proven slow path (which applies the filter) is used.
            CLEAR lv_fstr.
            lv_blank_go = abap_false.
        ENDTRY.
        IF lv_fstr CS 'SHIPMENT'   OR lv_fstr CS 'PLANT'      OR lv_fstr CS 'ROUTE'
        OR lv_fstr CS 'SETTLEMENT' OR lv_fstr CS 'STATUS'     OR lv_fstr CS 'DRIVER'
        OR lv_fstr CS 'VEHICLE'    OR lv_fstr CS 'CUSTOMER'   OR lv_fstr CS 'MATERIAL'
        OR lv_fstr CS 'VKORG'      OR lv_fstr CS 'PAYMENT'    OR lv_fstr CS 'CURRENCY'
        OR lv_fstr CS 'SLDDOC'     OR lv_fstr CS 'VISITID'    OR lv_fstr CS 'TOURID'
        OR lv_fstr CS 'VISITREASON' OR lv_fstr CS 'OBJTYPE'   OR lv_fstr CS 'DELIVERY'
        OR lv_fstr CS 'CASHTYPE'   OR lv_fstr CS 'VISITGROUP' OR lv_fstr CS 'TPP'.
          lv_blank_go = abap_false.
        ENDIF.

        " get_as_ranges() silently DROPS an interval (BETWEEN, or >= / <=) on the
        " Shipment / Visit List, so lt_shipment stayed empty and the request fell
        " through to an unbounded sample (memory dump) instead of the classic
        " result. When the range parser gave nothing but the filter DOES restrict
        " ShipmentNo, recover the bounds from the SQL string (which renders the
        " interval) and rebuild lt_shipment. EQ / IN already come through as
        " ranges, so this only has to cover what get_as_ranges cannot express.
        IF lt_shipment IS INITIAL AND lv_fstr CS 'SHIPMENTNO'.
          DATA lv_s1 TYPE tknum.
          DATA lv_s2 TYPE tknum.
          FIND FIRST OCCURRENCE OF REGEX `SHIPMENTNO\s+BETWEEN\s+'([^']*)'\s+AND\s+'([^']*)'`
               IN lv_fstr SUBMATCHES lv_s1 lv_s2.
          IF sy-subrc = 0.
            APPEND VALUE #( sign = 'I' option = 'BT' low = lv_s1 high = lv_s2 ) TO lt_shipment.
          ELSE.
            CLEAR: lv_s1, lv_s2.
            FIND FIRST OCCURRENCE OF REGEX `SHIPMENTNO\s*>=\s*'([^']*)'` IN lv_fstr SUBMATCHES lv_s1.
            FIND FIRST OCCURRENCE OF REGEX `SHIPMENTNO\s*<=\s*'([^']*)'` IN lv_fstr SUBMATCHES lv_s2.
            IF lv_s1 IS NOT INITIAL AND lv_s2 IS NOT INITIAL.
              APPEND VALUE #( sign = 'I' option = 'BT' low = lv_s1 high = lv_s2 ) TO lt_shipment.
            ELSEIF lv_s1 IS NOT INITIAL.
              APPEND VALUE #( sign = 'I' option = 'GE' low = lv_s1 ) TO lt_shipment.
            ELSEIF lv_s2 IS NOT INITIAL.
              APPEND VALUE #( sign = 'I' option = 'LE' low = lv_s2 ) TO lt_shipment.
            ELSE.
              FIND FIRST OCCURRENCE OF REGEX `SHIPMENTNO\s*=\s*'([^']*)'` IN lv_fstr SUBMATCHES lv_s1.
              IF sy-subrc = 0.
                APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_s1 ) TO lt_shipment.
              ENDIF.
            ENDIF.
          ENDIF.
        ENDIF.

        " Leading-zero tolerance: for code fields that are commonly stored
        " zero-padded (customer, material, delivery, settlement doc, visit,
        " tour), add stripped + ALPHA-padded EQ variants so the filter matches
        " whether or not the user typed leading zeros.
        DATA lt_cust_x TYPE tt_r_kunnr.
        lt_cust_x = lt_f_customer.
        LOOP AT lt_cust_x INTO DATA(ls_cx) WHERE sign = 'I' AND option = 'EQ'.
          DATA lv_cs TYPE kunnr.  lv_cs = ls_cx-low.  SHIFT lv_cs LEFT DELETING LEADING '0'.
          APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_cs ) TO lt_f_customer.
          APPEND VALUE #( sign = 'I' option = 'EQ' low = |{ ls_cx-low ALPHA = IN }| ) TO lt_f_customer.
        ENDLOOP.

        DATA lt_mat_x TYPE tt_r_matnr.
        lt_mat_x = lt_f_material.
        LOOP AT lt_mat_x INTO DATA(ls_mx) WHERE sign = 'I' AND option = 'EQ'.
          DATA lv_ms TYPE matnr.  lv_ms = ls_mx-low.  SHIFT lv_ms LEFT DELETING LEADING '0'.
          APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_ms ) TO lt_f_material.
          APPEND VALUE #( sign = 'I' option = 'EQ' low = |{ ls_mx-low ALPHA = IN }| ) TO lt_f_material.
        ENDLOOP.

        DATA lt_dlv_x TYPE tt_r_vbeln.
        lt_dlv_x = lt_f_delivery.
        LOOP AT lt_dlv_x INTO DATA(ls_dx) WHERE sign = 'I' AND option = 'EQ'.
          DATA lv_ds TYPE vbeln_vl.  lv_ds = ls_dx-low.  SHIFT lv_ds LEFT DELETING LEADING '0'.
          APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_ds ) TO lt_f_delivery.
          APPEND VALUE #( sign = 'I' option = 'EQ' low = |{ ls_dx-low ALPHA = IN }| ) TO lt_f_delivery.
        ENDLOOP.

        DATA lt_sld_x TYPE tt_r_sldid.
        lt_sld_x = lt_f_slddoc.
        LOOP AT lt_sld_x INTO DATA(ls_sx) WHERE sign = 'I' AND option = 'EQ'.
          DATA lv_ss TYPE /dsd/sl_sld_id.  lv_ss = ls_sx-low.  SHIFT lv_ss LEFT DELETING LEADING '0'.
          APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_ss ) TO lt_f_slddoc.
        ENDLOOP.

        DATA lt_vis_x TYPE tt_r_visit.
        lt_vis_x = lt_f_visitid.
        LOOP AT lt_vis_x INTO DATA(ls_vx) WHERE sign = 'I' AND option = 'EQ'.
          DATA lv_vs TYPE ty_visit6.  lv_vs = ls_vx-low.
          APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_vs ) TO lt_f_visitid.
        ENDLOOP.

        DATA lt_tour_x TYPE tt_r_tour.
        lt_tour_x = lt_f_tourid.
        LOOP AT lt_tour_x INTO DATA(ls_tx) WHERE sign = 'I' AND option = 'EQ'.
          DATA lv_ts TYPE ty_tour32.  lv_ts = ls_tx-low.  SHIFT lv_ts LEFT DELETING LEADING '0'.
          APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_ts ) TO lt_f_tourid.
        ENDLOOP.

        IF lt_mode IS NOT INITIAL.
          lv_mode = lt_mode[ 1 ]-low.
        ENDIF.
        IF lv_mode IS INITIAL.
          lv_mode = 'TOUR'.
        ENDIF.

        " ===================================================================
        " NO-INPUT VALIDATION (classic f_validation, msg i525): the classic
        " report NEVER runs on a blank screen - it requires a Shipment / Visit
        " List, or Plant + Route + Settlement Date together, or a Tour ID. This
        " runs BEFORE the mode dispatch, so it applies to EVERY report type.
        " With no such key - and not an Object-Page drill-down (RowKey) or seqno
        " paging - return an EMPTY list (like classic), so a non-maintained visit
        " list such as 9002952691 can never appear. It ALSO makes the default
        " (no-input) view instant - no blank-scroll sampling at all.
        "
        " IMPORTANT: this ONLY short-circuits the no-key case. When any key is
        " present the code below runs UNCHANGED, so filtered counts/values are
        " exactly as before.
        DATA lv_has_key TYPE abap_bool.
        IF lt_shipment IS NOT INITIAL
           OR lt_f_tourid IS NOT INITIAL
           OR ( lt_plant IS NOT INITIAL AND lt_route IS NOT INITIAL AND lt_settle_date IS NOT INITIAL ).
          lv_has_key = abap_true.
        ENDIF.
        IF lv_has_key = abap_false AND lt_rowkey IS INITIAL AND lt_seqno IS INITIAL.
          " RAP requires every request aspect to be CONSUMED on every return
          " path, else it raises "Query not fully covered ... get_paging missing".
          DATA(lo_pg_gate)  = io_request->get_paging( ).
          DATA(lt_srt_gate) = io_request->get_sort_elements( ).
          DATA(lt_req_gate) = io_request->get_requested_elements( ).
          IF io_request->is_total_numb_of_rec_requested( ).
            io_response->set_total_number_of_records( 0 ).
          ENDIF.
          IF io_request->is_data_requested( ).
            io_response->set_data( VALUE tt_result( ) ).
          ENDIF.
          RETURN.
        ENDIF.
        " ===================================================================

        " Paging window (read once, reused for the slice at the end). The blank
        " search samples a number of tours DERIVED from this window, so the row
        " count is no longer a hard 100 - it grows as the client scrolls
        " (server-side paging) yet stays bounded so it can never TSV-dump.
        DATA(lo_paging)  = io_request->get_paging( ).
        DATA(lv_offset)  = lo_paging->get_offset( ).
        DATA(lv_page_sz) = lo_paging->get_page_size( ).

        DATA lv_sample_max TYPE i.
        IF lv_page_sz = if_rap_query_paging=>page_size_unlimited OR lv_page_sz <= 0.
          " "Load all" / count request: use a generous default.
          lv_sample_max = 50000.
        ELSE.
          " Enough tours to fill the requested window plus one page of buffer.
          lv_sample_max = lv_offset + ( 2 * lv_page_sz ).
        ENDIF.
        " High safety ceiling only (prevents a runaway blank search from
        " short-dumping); it is NOT a business record limit - a FILTERED
        " selection (plant / route / date / visit list) goes through get_tours
        " and is never capped, exactly like the classic selection screen.
        IF lv_sample_max > 50000. lv_sample_max = 50000. ENDIF.
        IF lv_sample_max < 50.    lv_sample_max = 50.    ENDIF.

        " ============ FAST DB-PAGED PATH: TOUR mode, plain scroll ============
        " Tour is one row per tour (read_tour is an unconditional 1:1 map), so a
        " page needs only the page's tours - not a full compute of every tour
        " then a slice. This resolves + builds ONLY the requested page's tours
        " (deterministic ORDER BY tour_id) and gets the total from a cheap COUNT,
        " so response time no longer grows with the total number of tours and no
        " record cap is involved. It engages ONLY for a plain forward scroll:
        " blank selection, no custom sort, no detail filter, not a by-key read;
        " every other case falls through UNCHANGED to the proven path below.
        IF lv_mode = 'TOUR'
           AND lv_blank_go = abap_true
           AND lt_shipment IS INITIAL AND lt_plant IS INITIAL AND lt_settle_date IS INITIAL
           AND lt_rowkey IS INITIAL AND lt_seqno IS INITIAL
           AND io_request->is_data_requested( ) = abap_true
           AND lv_page_sz <> if_rap_query_paging=>page_size_unlimited AND lv_page_sz > 0
           AND lines( io_request->get_sort_elements( ) ) = 0
           AND lt_driver IS INITIAL AND lt_vehicle IS INITIAL AND lt_tpp IS INITIAL
           AND lt_f_customer IS INITIAL AND lt_f_material IS INITIAL AND lt_f_vkorg IS INITIAL
           AND lt_f_paymt IS INITIAL AND lt_f_currency IS INITIAL AND lt_f_slddoc IS INITIAL
           AND lt_f_visitid IS INITIAL AND lt_f_tourid IS INITIAL AND lt_f_viscod IS INITIAL
           AND lt_f_objtyp IS INITIAL AND lt_f_delivery IS INITIAL AND lt_f_cashtype IS INITIAL.

          " Only the page window of tour ids (tour_id order), skipping the offset.
          " Structured table so FOR ALL ENTRIES can reference a named component.
          TYPES: BEGIN OF ty_ptid, tour_id TYPE /dsd/hh_tour_id, END OF ty_ptid.
          DATA lt_ptid TYPE STANDARD TABLE OF ty_ptid.
          DATA lv_need TYPE i.
          lv_need = lv_offset + lv_page_sz.
          SELECT DISTINCT tour_id FROM /dsd/hh_rahd
            ORDER BY tour_id INTO TABLE @lt_ptid UP TO @lv_need ROWS.
          IF lv_offset > 0.
            IF lines( lt_ptid ) > lv_offset.
              DELETE lt_ptid TO lv_offset.
            ELSE.
              CLEAR lt_ptid.
            ENDIF.
          ENDIF.

          DATA lt_ptour TYPE tt_tour.
          IF lt_ptid IS NOT INITIAL.
            " Use a RANGE (not FOR ALL ENTRIES): /dsd/hh_tour_id and
            " /DSD/ST_STATUS-TOURID have a type mismatch that a range's implicit
            " conversion handles - the same pattern the by-key path already uses.
            DATA lr_ptid TYPE RANGE OF /dsd/hh_tour_id.
            CLEAR lr_ptid.
            LOOP AT lt_ptid ASSIGNING FIELD-SYMBOL(<pt>).
              APPEND VALUE #( sign = 'I' option = 'EQ' low = <pt>-tour_id ) TO lr_ptid.
            ENDLOOP.
            DATA lt_pst TYPE tt_status.
            SELECT * FROM /dsd/st_status
              WHERE tourid IN @lr_ptid
              INTO TABLE @lt_pst.
            lt_ptour = enrich_tours( it_status = lt_pst it_route = VALUE #( ) ).
            SORT lt_ptour BY tourid.
            DELETE ADJACENT DUPLICATES FROM lt_ptour COMPARING tourid.
          ENDIF.

          DATA(lt_prows) = read_tour( it_tour = lt_ptour ).
          LOOP AT lt_prows ASSIGNING FIELD-SYMBOL(<pr>).
            <pr>-seqno = lv_offset + sy-tabix.
            IF <pr>-reportmode IS INITIAL. <pr>-reportmode = 'TOUR'. ENDIF.
            <pr>-rowkey = |{ <pr>-reportmode }~{ <pr>-tourid }~{ <pr>-visitid }~{ <pr>-slddocid }~{ <pr>-material }~{ <pr>-deliveryno }~{ <pr>-shipmentno }|.
          ENDLOOP.
          io_response->set_data( lt_prows ).

          IF io_request->is_total_numb_of_rec_requested( ).
            SELECT COUNT( DISTINCT tour_id ) FROM /dsd/hh_rahd INTO @DATA(lv_tcount).
            io_response->set_total_number_of_records( lv_tcount ).
          ENDIF.
          RETURN.
        ENDIF.
        " =====================================================================

        " ===== FAST DB-PAGED PATH: TOUR with a Visit List filter =============
        " Same idea as the blank TOUR path, but restricted to the entered
        " Shipment / Visit List. Builds ONLY the requested page's tours + a cheap
        " DB COUNT, so a wide range no longer rebuilds the whole result on every
        " scroll. Output IDENTICAL to the slow path (same tours, count, values);
        " only the order becomes deterministic (tour_id).
        "
        " KEY-TYPE NOTE: /DSD/ST_STATUS-TOURID is CHAR 12 while /DSD/HH_RAHD-TOUR_ID
        " is CHAR 32 holding the SAME value left-justified. So:
        "   - hh_rahd.tour_id is matched with a range typed as /dsd/hh_tour_id
        "     (CHAR 32) built from st_status.tourid (assignment pads 12->32),
        "     exactly like the slow path (enrich_tours -> read_tour FAE).
        "   - st_status.tourid is matched with a range typed as /dsd/st_tourid
        "     (CHAR 12) built from hh_rahd.tour_id (assignment truncates 32->12),
        "     exactly like classic (<sld_item>-tourid = <sld_item>-tour_id).
        " Engages ONLY when the sole key is the Visit List (no plant/route/date/
        " status), no detail/driver/vehicle/tpp filter, no sort, not by-key.
        IF lv_mode = 'TOUR'
           AND lt_shipment IS NOT INITIAL
           AND lt_plant IS INITIAL AND lt_settle_date IS INITIAL AND lt_route IS INITIAL
           AND lt_status IS INITIAL
           AND lt_rowkey IS INITIAL AND lt_seqno IS INITIAL
           AND io_request->is_data_requested( ) = abap_true
           AND lv_page_sz <> if_rap_query_paging=>page_size_unlimited AND lv_page_sz > 0
           AND lines( io_request->get_sort_elements( ) ) = 0
           AND lt_driver IS INITIAL AND lt_vehicle IS INITIAL AND lt_tpp IS INITIAL
           AND lt_f_customer IS INITIAL AND lt_f_material IS INITIAL AND lt_f_vkorg IS INITIAL
           AND lt_f_paymt IS INITIAL AND lt_f_currency IS INITIAL AND lt_f_slddoc IS INITIAL
           AND lt_f_visitid IS INITIAL AND lt_f_tourid IS INITIAL AND lt_f_viscod IS INITIAL
           AND lt_f_objtyp IS INITIAL AND lt_f_delivery IS INITIAL AND lt_f_cashtype IS INITIAL.

          " Resolve the entered Visit List(s) into a VLID range EXACTLY as
          " get_tours does, so the tour set is identical.
          DATA lr_fvlid TYPE RANGE OF /dsd/vc_vlid.
          LOOP AT lt_shipment INTO DATA(ls_fsh).
            IF ls_fsh-high IS NOT INITIAL.
              APPEND VALUE #( sign = ls_fsh-sign option = ls_fsh-option low = ls_fsh-low high = ls_fsh-high ) TO lr_fvlid.
            ELSEIF ls_fsh-low IS NOT INITIAL.
              APPEND VALUE #( sign = ls_fsh-sign option = ls_fsh-option low = ls_fsh-low ) TO lr_fvlid.
              APPEND VALUE #( sign = 'I' option = 'EQ' low = |{ ls_fsh-low ALPHA = IN }| ) TO lr_fvlid.
              DATA lv_fvst TYPE /dsd/vc_vlid.
              lv_fvst = ls_fsh-low.
              SHIFT lv_fvst LEFT DELETING LEADING '0'.
              APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_fvst ) TO lr_fvlid.
            ENDIF.
          ENDLOOP.

          " Matching tour ids (CHAR12) -> range typed as HH_RAHD tour id (CHAR32),
          " so hh_rahd.tour_id matches (pads 12->32, like the slow path).
          SELECT DISTINCT tourid FROM /dsd/st_status
            WHERE vlid IN @lr_fvlid
            INTO TABLE @DATA(lt_ftid).
          DATA lr_ftid TYPE RANGE OF /dsd/hh_tour_id.
          LOOP AT lt_ftid INTO DATA(ls_ftid).
            APPEND VALUE #( sign = 'I' option = 'EQ' low = ls_ftid-tourid ) TO lr_ftid.
          ENDLOOP.
          IF lr_ftid IS INITIAL.
            io_response->set_data( VALUE tt_result( ) ).
            IF io_request->is_total_numb_of_rec_requested( ).
              io_response->set_total_number_of_records( 0 ).
            ENDIF.
            RETURN.
          ENDIF.

          " Only the page window of matching tour ids (tour_id order).
          DATA lt_fptid TYPE STANDARD TABLE OF ty_ptid.
          DATA lv_fneed TYPE i.
          lv_fneed = lv_offset + lv_page_sz.
          SELECT DISTINCT tour_id FROM /dsd/hh_rahd
            WHERE tour_id IN @lr_ftid
            ORDER BY tour_id INTO TABLE @lt_fptid UP TO @lv_fneed ROWS.
          IF lv_offset > 0.
            IF lines( lt_fptid ) > lv_offset.
              DELETE lt_fptid TO lv_offset.
            ELSE.
              CLEAR lt_fptid.
            ENDIF.
          ENDIF.

          " Build ONLY the page's tours (same builder as the slow path). The page
          " status is read with a CHAR-12 range (hh_rahd.tour_id 32 -> st tourid
          " 12 by truncation), so st_status.tourid matches.
          DATA lt_fptour TYPE tt_tour.
          IF lt_fptid IS NOT INITIAL.
            DATA lr_fppage TYPE RANGE OF /dsd/st_tourid.
            CLEAR lr_fppage.
            LOOP AT lt_fptid ASSIGNING FIELD-SYMBOL(<fpt>).
              DATA lv_fp12 TYPE /dsd/st_tourid.
              lv_fp12 = <fpt>-tour_id.
              APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_fp12 ) TO lr_fppage.
            ENDLOOP.
            DATA lt_fpst TYPE tt_status.
            SELECT * FROM /dsd/st_status
              WHERE tourid IN @lr_fppage
              INTO TABLE @lt_fpst.
            lt_fptour = enrich_tours( it_status = lt_fpst it_route = VALUE #( ) ).
            SORT lt_fptour BY tourid.
            DELETE ADJACENT DUPLICATES FROM lt_fptour COMPARING tourid.
          ENDIF.

          DATA(lt_fprows) = read_tour( it_tour = lt_fptour ).

          " SAFETY FALLBACK: only take over the request if the fast path actually
          " produced rows. If it yields nothing (e.g. an unforeseen key-format
          " edge case), DO NOT return an empty list - fall through to the proven
          " slow path below, which builds the correct result. Worst case is the
          " old (slower) behaviour; the output is never wrong or empty.
          IF lt_fprows IS NOT INITIAL.
            LOOP AT lt_fprows ASSIGNING FIELD-SYMBOL(<fpr>).
              <fpr>-seqno = lv_offset + sy-tabix.
              IF <fpr>-reportmode IS INITIAL. <fpr>-reportmode = 'TOUR'. ENDIF.
              <fpr>-rowkey = |{ <fpr>-reportmode }~{ <fpr>-tourid }~{ <fpr>-visitid }~{ <fpr>-slddocid }~{ <fpr>-material }~{ <fpr>-deliveryno }~{ <fpr>-shipmentno }|.
            ENDLOOP.
            io_response->set_data( lt_fprows ).

            IF io_request->is_total_numb_of_rec_requested( ).
              SELECT COUNT( DISTINCT tour_id ) FROM /dsd/hh_rahd
                WHERE tour_id IN @lr_ftid
                INTO @DATA(lv_ftcount).
              io_response->set_total_number_of_records( lv_ftcount ).
            ENDIF.
            RETURN.
          ENDIF.
        ENDIF.
        " =====================================================================

        " ======== FAST DB-PAGED PATH: row-explosive modes (windowed) =========
        " Visit / Sales / Payment / Check / Money / Quantity / FSR produce a
        " VARIABLE number of rows per tour, so they cannot be paged by tour like
        " Tour. They are instead computed tour-by-tour in a deterministic
        " tour_id order, stopping as soon as the requested page is filled (when
        " no total count is asked for), so a data-only scroll page no longer
        " computes every tour. When the total IS requested the full set is
        " computed (needed for an exact count). Same builders, same values -
        " only the row order becomes deterministic (tour_id, then per-tour).
        " Engages ONLY for a plain scroll (blank selection, no sort, no filter,
        " not by-key); Route Summary and every other case are untouched.
        IF lv_blank_go = abap_true
           AND lt_shipment IS INITIAL AND lt_plant IS INITIAL AND lt_settle_date IS INITIAL
           AND lt_rowkey IS INITIAL AND lt_seqno IS INITIAL
           AND io_request->is_data_requested( ) = abap_true
           AND lv_page_sz <> if_rap_query_paging=>page_size_unlimited AND lv_page_sz > 0
           AND lines( io_request->get_sort_elements( ) ) = 0
           AND lt_driver IS INITIAL AND lt_vehicle IS INITIAL AND lt_tpp IS INITIAL
           AND lt_f_customer IS INITIAL AND lt_f_material IS INITIAL AND lt_f_vkorg IS INITIAL
           AND lt_f_paymt IS INITIAL AND lt_f_currency IS INITIAL AND lt_f_slddoc IS INITIAL
           AND lt_f_visitid IS INITIAL AND lt_f_tourid IS INITIAL AND lt_f_viscod IS INITIAL
           AND lt_f_objtyp IS INITIAL AND lt_f_delivery IS INITIAL AND lt_f_cashtype IS INITIAL
           AND ( lv_mode = 'VISI' OR lv_mode = 'SLRP' OR lv_mode = 'PAYT'
              OR lv_mode = 'CHCK' OR lv_mode = 'MONY' OR lv_mode = 'QUAN'
              OR lv_mode = 'FSRD' ).

          " Candidate tour ids for the mode, tour_id order (ids only - cheap).
          DATA lt_gtid TYPE STANDARD TABLE OF ty_ptid.
          CASE lv_mode.
            WHEN 'VISI'.           SELECT DISTINCT tour_id FROM /dsd/hh_racvhd   ORDER BY tour_id INTO TABLE @lt_gtid.
            WHEN 'SLRP'.           SELECT DISTINCT tour_id FROM /dsd/hh_radelhd  ORDER BY tour_id INTO TABLE @lt_gtid.
            WHEN 'PAYT'.           SELECT DISTINCT tour_id FROM /dsd/hh_raec     ORDER BY tour_id INTO TABLE @lt_gtid.
            WHEN 'CHCK'.           SELECT DISTINCT tour_id FROM /dsd/hh_racocimi ORDER BY tour_id INTO TABLE @lt_gtid.
            WHEN 'MONY' OR 'QUAN'. SELECT DISTINCT tour_id FROM /dsd/sl_sld_item ORDER BY tour_id INTO TABLE @lt_gtid.
            WHEN 'FSRD'.           SELECT DISTINCT tour_id FROM /dsd/hh_rahd     ORDER BY tour_id INTO TABLE @lt_gtid.
          ENDCASE.

          DATA lv_gtarget TYPE i.
          lv_gtarget = lv_offset + lv_page_sz.
          DATA lv_gfull TYPE abap_bool.
          lv_gfull = io_request->is_total_numb_of_rec_requested( ).

          DATA lt_gpres TYPE tt_result.
          DATA lv_gidx  TYPE i VALUE 0.
          DATA lv_gcnt  TYPE i.
          lv_gcnt = lines( lt_gtid ).
          DATA lr_gbt   TYPE RANGE OF /dsd/hh_tour_id.
          DATA lv_gc2   TYPE i.
          WHILE lv_gidx < lv_gcnt.
            CLEAR lr_gbt.
            lv_gc2 = 0.
            WHILE lv_gidx < lv_gcnt AND lv_gc2 < 100.
              lv_gidx = lv_gidx + 1.
              APPEND VALUE #( sign = 'I' option = 'EQ' low = lt_gtid[ lv_gidx ]-tour_id ) TO lr_gbt.
              lv_gc2 = lv_gc2 + 1.
            ENDWHILE.

            DATA lt_gstat TYPE tt_status.
            SELECT * FROM /dsd/st_status WHERE tourid IN @lr_gbt INTO TABLE @lt_gstat.
            DATA lt_gtour TYPE tt_tour.
            lt_gtour = enrich_tours( it_status = lt_gstat it_route = VALUE #( ) ).
            SORT lt_gtour BY tourid.
            DELETE ADJACENT DUPLICATES FROM lt_gtour COMPARING tourid.

            DATA lt_gbr TYPE tt_result.
            CLEAR lt_gbr.
            CASE lv_mode.
              WHEN 'VISI'. lt_gbr = read_visit(   it_tour = lt_gtour ).
              WHEN 'SLRP'. lt_gbr = read_sales(   it_tour = lt_gtour ).
              WHEN 'PAYT'. lt_gbr = read_payment( it_tour = lt_gtour ).
              WHEN 'CHCK'. lt_gbr = read_check(   it_tour = lt_gtour ).
              WHEN 'MONY'. lt_gbr = read_money(   it_tour = lt_gtour ).
              WHEN 'QUAN'. lt_gbr = read_quan(    it_tour = lt_gtour ).
              WHEN 'FSRD'. lt_gbr = read_fsr(     it_tour = lt_gtour ).
            ENDCASE.
            APPEND LINES OF lt_gbr TO lt_gpres.

            IF lv_gfull = abap_false AND lines( lt_gpres ) >= lv_gtarget.
              EXIT.
            ENDIF.
          ENDWHILE.

          " RowKey + seqno (identical rule to the full path) + duplicate guard.
          DATA lt_gseen TYPE HASHED TABLE OF ty_rowkey WITH UNIQUE KEY table_line.
          LOOP AT lt_gpres ASSIGNING FIELD-SYMBOL(<gr>).
            <gr>-seqno = sy-tabix.
            IF <gr>-reportmode IS INITIAL. <gr>-reportmode = lv_mode. ENDIF.
            <gr>-rowkey = |{ <gr>-reportmode }~{ <gr>-tourid }~{ <gr>-visitid }~{ <gr>-slddocid }~{ <gr>-material }~{ <gr>-deliveryno }~{ <gr>-shipmentno }|.
            IF line_exists( lt_gseen[ table_line = <gr>-rowkey ] ).
              <gr>-rowkey = |{ <gr>-rowkey }~{ <gr>-seqno }|.
            ENDIF.
            INSERT <gr>-rowkey INTO TABLE lt_gseen.
          ENDLOOP.

          IF lv_gfull = abap_true.
            io_response->set_total_number_of_records( lines( lt_gpres ) ).
          ENDIF.

          DATA lt_gpage TYPE tt_result.
          DATA(lv_gf) = lv_offset + 1.
          DATA(lv_gt) = lv_offset + lv_page_sz.
          LOOP AT lt_gpres INTO DATA(ls_g) FROM lv_gf TO lv_gt.
            APPEND ls_g TO lt_gpage.
          ENDLOOP.
          io_response->set_data( lt_gpage ).
          RETURN.
        ENDIF.
        " =====================================================================

        " Resolve tours:
        "  - Object Page by-key read (RowKey): decode mode+tour from the key
        "    and rebuild just that tour, so the single clicked row is reproduced.
        "  - blank Go: sample from the selected mode's own detail table.
        "  - otherwise: resolve from the entered key (visit list / plant+date).
        DATA lt_tour TYPE tt_tour.
        IF lt_rowkey IS NOT INITIAL.
          DATA(lv_key) = CONV string( lt_rowkey[ 1 ]-low ).
          SPLIT lv_key AT '~' INTO TABLE DATA(lt_parts).
          DATA lr_tid TYPE RANGE OF /dsd/hh_tour_id.
          IF lines( lt_parts ) >= 1.
            lv_mode = lt_parts[ 1 ].
          ENDIF.
          IF lv_mode = 'CASH'.
            " CASH Object Page read. To show the FULL aggregated figures on the
            " object page we re-run the external cash-difference program bounded
            " to just this one visit list (same mechanism the list uses), then
            " keep only the requested row. A header-only reconstruction from the
            " RowKey (read_cash_key) is used as a fallback if the program yields
            " nothing, so the page is never empty.
            lv_bykey_cash = abap_true.
            IF lines( lt_parts ) >= 3. lv_cash_visit = lt_parts[ 3 ]. ENDIF.
            IF lines( lt_parts ) >= 7. lv_cash_vlid  = lt_parts[ 7 ]. ENDIF.
            " Resolve the tour(s) behind this visit list so read_cash can bound
            " the external run to S_VLID (get_tours treats ShipmentNo as the
            " visit list, matching leading-zero variants).
            IF lv_cash_vlid IS NOT INITIAL.
              DATA lr_cash_ship TYPE tt_r_tknum.
              APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_cash_vlid ) TO lr_cash_ship.
              lt_tour = get_tours(
                it_shipment    = lr_cash_ship  it_route  = VALUE #( )
                it_settle_date = VALUE #( )     it_plant  = VALUE #( )
                it_status      = VALUE #( ) ).
            ENDIF.
          ELSE.
            IF lines( lt_parts ) >= 2.
              APPEND VALUE #( sign = 'I' option = 'EQ' low = lt_parts[ 2 ] ) TO lr_tid.
            ENDIF.
            DATA lt_st TYPE tt_status.
            SELECT * FROM /dsd/st_status
              WHERE tourid IN @lr_tid
              INTO TABLE @lt_st.
            lt_tour = enrich_tours( it_status = lt_st it_route = VALUE #( ) ).
          ENDIF.
        ELSEIF lt_shipment IS INITIAL AND lt_plant IS INITIAL AND lt_settle_date IS INITIAL.
          lt_tour = sample_tours( iv_mode = lv_mode iv_max = lv_sample_max ).
        ELSE.
          lt_tour = get_tours(
            it_shipment = lt_shipment  it_route = lt_route
            it_settle_date = lt_settle_date  it_plant = lt_plant
            it_status = lt_status ).
        ENDIF.

        CASE lv_mode.
          WHEN 'TOUR'.  lt_result = read_tour(    it_tour = lt_tour ).
          WHEN 'VISI'.  lt_result = read_visit(   it_tour = lt_tour ).
          WHEN 'SLRP'.  lt_result = read_sales(   it_tour = lt_tour ).
          WHEN 'PAYT'.  lt_result = read_payment( it_tour = lt_tour ).
          WHEN 'CHCK'.  lt_result = read_check(   it_tour = lt_tour ).
          WHEN 'MONY'.  lt_result = read_money(   it_tour = lt_tour ).
          WHEN 'QUAN'.  lt_result = read_quan(    it_tour = lt_tour ).
          WHEN 'FSRD'.  lt_result = read_fsr(     it_tour = lt_tour ).
          WHEN 'CASH'.
            IF lv_bykey_cash = abap_true.
              " Object Page single row: run the external cash-difference program
              " bounded to this one visit list so the page shows the full
              " figures; fall back to a header-only reconstruction if empty.
              lt_result = read_cash( it_tour = lt_tour ).
              IF lt_result IS INITIAL.
                lt_result = read_cash_key( iv_vlid = lv_cash_vlid iv_visit = lv_cash_visit ).
              ENDIF.
            ELSE.
              " List: run the external cash-difference program as before.
              lt_result = read_cash( it_tour = lt_tour ).
            ENDIF.
          WHEN OTHERS.  CLEAR lt_result.
        ENDCASE.

        " Option A - apply every detail-level filter as a post-filter, so
        " filters that are not part of tour resolution genuinely narrow the
        " output. Empty ranges are no-ops.
        IF lt_f_customer IS NOT INITIAL. DELETE lt_result WHERE customer      NOT IN lt_f_customer. ENDIF.
        IF lt_f_material IS NOT INITIAL. DELETE lt_result WHERE material      NOT IN lt_f_material. ENDIF.
        IF lt_f_vkorg    IS NOT INITIAL. DELETE lt_result WHERE vkorg         NOT IN lt_f_vkorg.    ENDIF.
        IF lt_f_paymt    IS NOT INITIAL. DELETE lt_result WHERE paymentmethod NOT IN lt_f_paymt.    ENDIF.
        IF lt_f_currency IS NOT INITIAL. DELETE lt_result WHERE currency      NOT IN lt_f_currency. ENDIF.
        IF lt_f_slddoc   IS NOT INITIAL. DELETE lt_result WHERE slddocid      NOT IN lt_f_slddoc.   ENDIF.
        IF lt_f_visitid  IS NOT INITIAL. DELETE lt_result WHERE visitid       NOT IN lt_f_visitid.  ENDIF.
        IF lt_f_tourid   IS NOT INITIAL. DELETE lt_result WHERE tourid        NOT IN lt_f_tourid.   ENDIF.
        IF lt_f_viscod   IS NOT INITIAL. DELETE lt_result WHERE visitreason   NOT IN lt_f_viscod.   ENDIF.
        IF lt_f_objtyp   IS NOT INITIAL. DELETE lt_result WHERE objtype       NOT IN lt_f_objtyp.   ENDIF.
        IF lt_f_delivery IS NOT INITIAL. DELETE lt_result WHERE deliveryno    NOT IN lt_f_delivery. ENDIF.
        IF lt_f_cashtype IS NOT INITIAL. DELETE lt_result WHERE cashtype      NOT IN lt_f_cashtype. ENDIF.
        IF lt_driver     IS NOT INITIAL. DELETE lt_result WHERE driver        NOT IN lt_driver.     ENDIF.
        IF lt_vehicle    IS NOT INITIAL. DELETE lt_result WHERE vehicle       NOT IN lt_vehicle.    ENDIF.
        IF lt_tpp        IS NOT INITIAL. DELETE lt_result WHERE tpp           NOT IN lt_tpp.        ENDIF.
      CATCH cx_root.
        CLEAR lt_result.
    ENDTRY.

    DATA lt_seen_key TYPE HASHED TABLE OF ty_rowkey WITH UNIQUE KEY table_line.
    LOOP AT lt_result ASSIGNING FIELD-SYMBOL(<r>).
      <r>-seqno = sy-tabix.
      IF <r>-reportmode IS INITIAL.
        <r>-reportmode = lv_mode.
      ENDIF.
      " Content-based key: mode~tour~natural-keys. Delimiter-separated so a
      " by-key read can split out mode + tour and rebuild exactly this row.
      <r>-rowkey = |{ <r>-reportmode }~{ <r>-tourid }~{ <r>-visitid }~{ <r>-slddocid }~{ <r>-material }~{ <r>-deliveryno }~{ <r>-shipmentno }|.

      " Safety net: OData V4 REJECTS a response with two identical keys
      " ("Duplicate key predicate") and then renders NO data at all. If any
      " mode ever produces two rows with the same natural key, append the row
      " number so every RowKey is unique and the list still loads.
      IF line_exists( lt_seen_key[ table_line = <r>-rowkey ] ).
        <r>-rowkey = |{ <r>-rowkey }~{ <r>-seqno }|.
      ENDIF.
      INSERT <r>-rowkey INTO TABLE lt_seen_key.
    ENDLOOP.

    " Read-by-key (Object Page): keep only the requested row. RowKey is the key;
    " seqno kept as a legacy safety net. Guarantee at most one row.
    IF lt_rowkey IS NOT INITIAL.
      DELETE lt_result WHERE rowkey NOT IN lt_rowkey.
      IF lines( lt_result ) > 1.
        DELETE lt_result FROM 2.
      ENDIF.
    ELSEIF lt_seqno IS NOT INITIAL.
      DELETE lt_result WHERE seqno NOT IN lt_seqno.
    ENDIF.

    DATA lt_sort_order TYPE abap_sortorder_tab.
    LOOP AT io_request->get_sort_elements( ) INTO DATA(ls_sort).
      APPEND VALUE #( name = ls_sort-element_name descending = ls_sort-descending ) TO lt_sort_order.
    ENDLOOP.
    IF lt_sort_order IS NOT INITIAL.
      TRY.
          SORT lt_result BY (lt_sort_order).
        CATCH cx_root.
      ENDTRY.
    ENDIF.

    IF io_request->is_total_numb_of_rec_requested( ).
      io_response->set_total_number_of_records( lines( lt_result ) ).
    ENDIF.

    IF io_request->is_data_requested( ).
      " lo_paging / lv_offset / lv_page_sz were read once near the top.
      IF lv_page_sz <> if_rap_query_paging=>page_size_unlimited.
        DATA lt_page TYPE tt_result.
        DATA(lv_from) = lv_offset + 1.
        DATA(lv_to)   = lv_offset + lv_page_sz.
        LOOP AT lt_result INTO DATA(ls_row) FROM lv_from TO lv_to.
          APPEND ls_row TO lt_page.
        ENDLOOP.
        io_response->set_data( lt_page ).
      ELSE.
        io_response->set_data( lt_result ).
      ENDIF.
    ENDIF.

  ENDMETHOD.


  METHOD get_tours.

    " Resolve tours from a KEY (visit list, or plant/date). Blank searches are
    " handled by sample_tours, so this returns empty when no key is given -
    " never an unbounded full-table read.
    IF it_shipment IS INITIAL AND it_plant IS INITIAL AND it_settle_date IS INITIAL.
      RETURN.
    ENDIF.

    TRY.
        DATA lt_status TYPE tt_status.

        IF it_shipment IS NOT INITIAL.
          " Visit List -> status / tour   (classic rb_visi branch: the entered
          " "Shipment / Visit List" is matched against /DSD/ST_STATUS-VLID, and
          " only values maintained in /dsd/vc_vlh are valid - see enrich_tours,
          " which drops any status row whose VLID is not a real visit list).
          "     SELECT ... FROM /dsd/st_status WHERE vlid IN s_tknum
          "
          " LEADING-ZERO INSENSITIVE: the user may type the Visit List with or
          " without leading zeros (e.g. 9162643559 or 0009162643559). VLID is
          " stored zero-padded, so for every entered value we match THREE forms
          " - the raw value, the ALPHA (zero-padded) value, and the stripped
          " value - so it resolves regardless of how it was keyed in. A range
          " (BETWEEN) is passed through unchanged so it is applied at the DB.
          DATA lr_vlid TYPE RANGE OF /dsd/vc_vlid.
          LOOP AT it_shipment INTO DATA(ls_sh).
            IF ls_sh-high IS NOT INITIAL.
              " interval (BT / GE-with-high etc): pass through unchanged.
              APPEND VALUE #( sign = ls_sh-sign option = ls_sh-option low = ls_sh-low high = ls_sh-high ) TO lr_vlid.
            ELSEIF ls_sh-low IS NOT INITIAL.
              " single value: match raw + zero-padded + stripped.
              APPEND VALUE #( sign = ls_sh-sign option = ls_sh-option low = ls_sh-low ) TO lr_vlid.
              DATA lv_pad TYPE /dsd/vc_vlid.
              lv_pad = |{ ls_sh-low ALPHA = IN }|.
              APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_pad ) TO lr_vlid.
              DATA lv_str TYPE /dsd/vc_vlid.
              lv_str = ls_sh-low.
              SHIFT lv_str LEFT DELETING LEADING '0'.
              APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_str ) TO lr_vlid.
            ENDIF.
          ENDLOOP.

          SELECT * FROM /dsd/st_status
            WHERE vlid IN @lr_vlid AND status_id IN @it_status
            INTO TABLE @lt_status.
        ELSE.
          " Plant/date -> visit lists -> status / tour
          SELECT * FROM /ccej/t_inb_stat
            WHERE werks IN @it_plant AND creation_date IN @it_settle_date
            INTO TABLE @DATA(lt_inb0).
          IF lt_inb0 IS NOT INITIAL.
            SELECT * FROM /dsd/st_status
              FOR ALL ENTRIES IN @lt_inb0
              WHERE vlid = @lt_inb0-visitlist AND status_id IN @it_status
              INTO TABLE @lt_status.
          ENDIF.
        ENDIF.

        rt_tour = enrich_tours( it_status = lt_status it_route = it_route ).
      CATCH cx_root.
        CLEAR rt_tour.
    ENDTRY.

  ENDMETHOD.


  METHOD enrich_tours.

    IF it_status IS INITIAL.
      RETURN.
    ENDIF.

    TRY.
        " Enrich Plant / Route / Settlement date / IDoc from /CCEJ by visit list.
        SELECT * FROM /ccej/t_inb_stat
          FOR ALL ENTRIES IN @it_status
          WHERE visitlist = @it_status-vlid
          INTO TABLE @DATA(lt_inb).

        " Route filter (leading-zero insensitive: 3408 and 003408 both match).
        DATA lt_rnorm TYPE STANDARD TABLE OF route.
        LOOP AT it_route INTO DATA(ls_rr).
          DATA lv_rn TYPE route.
          lv_rn = ls_rr-low.
          SHIFT lv_rn LEFT DELETING LEADING '0'.
          IF lv_rn IS NOT INITIAL.
            APPEND lv_rn TO lt_rnorm.
          ENDIF.
        ENDLOOP.

        LOOP AT it_status ASSIGNING FIELD-SYMBOL(<s>).
          DATA(ls_tour) = VALUE ty_tour(
            tourid    = <s>-tourid
            vlid      = <s>-vlid
            shipment  = <s>-shipment
            status_id = <s>-status_id ).
          READ TABLE lt_inb ASSIGNING FIELD-SYMBOL(<i>) WITH KEY visitlist = <s>-vlid.
          IF sy-subrc = 0.
            ls_tour-werks = <i>-werks.
            ls_tour-route = <i>-route.
            SHIFT ls_tour-route LEFT DELETING LEADING '0'.
            ls_tour-date  = <i>-creation_date.
            ls_tour-idoc  = <i>-idoc_number.
          ENDIF.

          IF lt_rnorm IS NOT INITIAL.
            READ TABLE lt_rnorm TRANSPORTING NO FIELDS
              WITH KEY table_line = ls_tour-route.
            IF sy-subrc <> 0.
              CONTINUE.
            ENDIF.
          ENDIF.

          APPEND ls_tour TO rt_tour.
        ENDLOOP.
      CATCH cx_root.
        CLEAR rt_tour.
    ENDTRY.

  ENDMETHOD.


  METHOD sample_tours.

    " Blank Go: take a bounded set of tour ids from the SELECTED MODE's detail
    " table (so Visit/Sales/Payment/... return their own data, not only Tour),
    " then resolve them into full tours.
    "
    " DYNAMIC COUNT: iv_max comes from the paging window, so the number of
    " tours (and therefore rows) grows as the client scrolls - it is NOT the
    " old fixed 100. ORDER BY tour_id makes the first-N prefix stable, so each
    " larger page is a superset of the previous one (consistent paging).
    "
    " NO DUMP: single-row-per-tour modes (Tour / FSR / Cash) may take the full
    " requested window; row-explosive modes (Check / Money / Quantity, which
    " emit many detail rows per tour) are capped harder so the in-memory result
    " stays bounded and can never TSV-dump.
    DATA lv_max TYPE i.
    lv_max = iv_max.
    IF lv_max <= 0. lv_max = 2000. ENDIF.

    DATA lv_cap TYPE i.
    CASE iv_mode.
      WHEN 'CHCK' OR 'MONY' OR 'QUAN'. lv_cap = 20000.   " row-explosive modes
      WHEN 'VISI' OR 'SLRP' OR 'PAYT'. lv_cap = 30000.
      WHEN OTHERS.                     lv_cap = 50000.   " Tour / FSR / Cash
    ENDCASE.
    IF lv_max > lv_cap. lv_max = lv_cap. ENDIF.

    TRY.
        DATA lt_tid TYPE STANDARD TABLE OF /dsd/hh_tour_id.
        CASE iv_mode.
          WHEN 'VISI'.
            SELECT DISTINCT tour_id FROM /dsd/hh_racvhd   ORDER BY tour_id INTO TABLE @lt_tid UP TO @lv_max ROWS.
          WHEN 'SLRP'.
            SELECT DISTINCT tour_id FROM /dsd/hh_radelhd  ORDER BY tour_id INTO TABLE @lt_tid UP TO @lv_max ROWS.
          WHEN 'PAYT'.
            SELECT DISTINCT tour_id FROM /dsd/hh_raec     ORDER BY tour_id INTO TABLE @lt_tid UP TO @lv_max ROWS.
          WHEN 'CHCK'.
            SELECT DISTINCT tour_id FROM /dsd/hh_racocimi ORDER BY tour_id INTO TABLE @lt_tid UP TO @lv_max ROWS.
          WHEN 'MONY' OR 'QUAN'.
            SELECT DISTINCT tour_id FROM /dsd/sl_sld_item ORDER BY tour_id INTO TABLE @lt_tid UP TO @lv_max ROWS.
          WHEN OTHERS.
            " TOUR / FSRD / CASH: sample from the tour header.
            SELECT DISTINCT tour_id FROM /dsd/hh_rahd     ORDER BY tour_id INTO TABLE @lt_tid UP TO @lv_max ROWS.
        ENDCASE.
        IF lt_tid IS INITIAL.
          RETURN.
        ENDIF.

        " Use a range (not FOR ALL ENTRIES) so the tour-id type mismatch
        " between the detail tables (/dsd/hh_tour_id) and /DSD/ST_STATUS-TOURID
        " is handled by implicit range conversion.
        DATA lr_tid TYPE RANGE OF /dsd/hh_tour_id.
        lr_tid = VALUE #( FOR t IN lt_tid ( sign = 'I' option = 'EQ' low = t ) ).

        DATA lt_status TYPE tt_status.
        SELECT * FROM /dsd/st_status
          WHERE tourid IN @lr_tid
          INTO TABLE @lt_status.

        rt_tour = enrich_tours( it_status = lt_status it_route = VALUE #( ) ).
      CATCH cx_root.
        CLEAR rt_tour.
    ENDTRY.

  ENDMETHOD.


  METHOD read_tour.

    " Mode 1 - Tour Details, ported column-for-column from the classic
    " f_get_driver_details:
    "   /DSD/HH_RAHD    (by tour_id)  -> driver, co-driver, plant, procstat,
    "                                    created/changed on/time/by, obj_id
    "   /DSD/HH_RACOCIHD(by tour_id)  -> scenario + driver swap (CHECKER)
    "   /DSD/VC_VLH     (by obj_id)   -> visit group (AUTH)
    "   resolved tour   (/CCEJ)       -> plant, route, settlement date, idoc
    "   status_id                      -> Exception traffic light
    " Bounding key is the tour list, so a blank search yields nothing.
    IF it_tour IS INITIAL. RETURN. ENDIF.

    " Fiori criticality: 3 = green (positive), 2 = yellow (critical),
    " 1 = red (negative), 0 = gray (neutral) - matches the classic light.
    CONSTANTS: lc_green  TYPE int1 VALUE 3,
               lc_red    TYPE int1 VALUE 1,
               lc_yellow TYPE int1 VALUE 2,
               lc_gray   TYPE int1 VALUE 0,
               lc_paper  TYPE /dsd/vc_authority VALUE 'CCEJPAPER'.

    TRY.
        SELECT * FROM /dsd/hh_rahd
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_rahd).

        IF lt_rahd IS NOT INITIAL.
          " Scenario + Driver swap source (CHECKER string).
          SELECT tour_id, checker FROM /dsd/hh_racocihd
            FOR ALL ENTRIES IN @lt_rahd
            WHERE tour_id = @lt_rahd-tour_id
            INTO TABLE @DATA(lt_coci).
          " Perf (#4): sort the lookup once, then BINARY SEARCH per row (O(log n)
          " instead of O(n)) - EXACTLY as the classic report does
          " (f_get_driver_details: SORT l_i_racocihd BY tour_id + BINARY SEARCH).
          " Output-neutral: one CHECKER row per tour, so the found row is the same.
          SORT lt_coci BY tour_id.
          " Visit group (AUTH) by visit list (OBJ_ID).
          SELECT vlid, auth, exdat1 FROM /dsd/vc_vlh
            FOR ALL ENTRIES IN @lt_rahd
            WHERE vlid = @lt_rahd-obj_id
            INTO TABLE @DATA(lt_vlh).
          " Perf (#4): VLID is the key of /dsd/vc_vlh (unique), so sort + BINARY
          " SEARCH returns the identical row, just faster.
          SORT lt_vlh BY vlid.
        ENDIF.

        " CLASSIC FIDELITY (f_get_driver_details): the displayed set is ONE row
        " per /DSD/HH_RAHD tour header (inner join on tour_id) - NOT one row per
        " status row. A tourid present in /DSD/ST_STATUS but with no HH_RAHD
        " header is dropped, and the several status rows per tour collapse to a
        " single row. So drive the output from the (unique) tour headers lt_rahd
        " and look up the FIRST resolved status of each tour for the display
        " fields, exactly as classic's "READ TABLE l_i_status ... BINARY SEARCH".
        DATA lt_tstat TYPE tt_tour.
        lt_tstat = it_tour.
        SORT lt_tstat BY tourid.

        LOOP AT lt_rahd ASSIGNING FIELD-SYMBOL(<h>).
          DATA ls_r TYPE ty_result.
          CLEAR ls_r.

          READ TABLE lt_tstat ASSIGNING FIELD-SYMBOL(<t>)
               WITH KEY tourid = <h>-tour_id BINARY SEARCH.
          IF sy-subrc <> 0.
            CONTINUE.
          ENDIF.

          ls_r-reportmode     = 'TOUR'.
          ls_r-shipmentno     = <t>-vlid.
          ls_r-tourid         = <t>-tourid.
          ls_r-plant          = <t>-werks.
          ls_r-route          = <t>-route.
          ls_r-settlementdate = <t>-date.
          ls_r-statusid       = <t>-status_id.
          ls_r-idocno         = <t>-idoc.

          IF abap_true = abap_true.
            ls_r-driver           = <h>-driver.
            ls_r-codriver         = <h>-codriver.
            " Raw RAHD processing status is the classic "Tour Status" (e.g. 30);
            " the classic "Processing status" column (P/E/M/N) is DERIVED from
            " the traffic light below.
            ls_r-tourstatus       = <h>-procstat.
            ls_r-checkin          = <h>-checkin.
            ls_r-checkout         = <h>-checkout.
            ls_r-manrel           = <h>-manrel.
            ls_r-origin           = <h>-origin.
            ls_r-presalesstatus   = <h>-pres_procstat.
            ls_r-createdby        = <h>-creuser.
            ls_r-changedby        = <h>-cnguser.
            " Created / Changed stamps converted UTC -> Japan local time.
            to_local_time( EXPORTING iv_date = <h>-credate iv_time = <h>-cretime
                           IMPORTING ev_date = ls_r-createdon ev_time = ls_r-createdtime ).
            to_local_time( EXPORTING iv_date = <h>-cngdate iv_time = <h>-cngtime
                           IMPORTING ev_date = ls_r-changedon ev_time = ls_r-changedtime ).
            IF <h>-plant IS NOT INITIAL.
              ls_r-plant = <h>-plant.
            ENDIF.

            " Visit group (AUTH).
            READ TABLE lt_vlh ASSIGNING FIELD-SYMBOL(<vl>) WITH KEY vlid = <h>-obj_id BINARY SEARCH.
            IF sy-subrc = 0.
              ls_r-visitgroup = <vl>-auth.
              " Original execution date (classic MOD-030, /DSD/VC_VLH-EXDAT1).
              ls_r-origedate  = <vl>-exdat1.
            ENDIF.

            " Scenario + Driver swap from CHECKER (classic MOD-008/017 rules).
            READ TABLE lt_coci ASSIGNING FIELD-SYMBOL(<co>) WITH KEY tour_id = <t>-tourid BINARY SEARCH.
            IF sy-subrc = 0 AND <co>-checker IS NOT INITIAL.
              DATA(lv_len) = strlen( <co>-checker ) - 1.
              ls_r-scenario = <co>-checker+lv_len(1).
              ls_r-driverswap  = <co>-checker+0(1).
            ELSE.
              ls_r-driverswap = 'N'.
            ENDIF.
            " Scenario valid only for R/V/H, else blank.
            IF ls_r-scenario <> 'R' AND ls_r-scenario <> 'V' AND ls_r-scenario <> 'H'.
              CLEAR ls_r-scenario.
            ENDIF.
            " Driver swap valid only for B/G/A, else N.
            IF ls_r-driverswap <> 'B' AND ls_r-driverswap <> 'G' AND ls_r-driverswap <> 'A'.
              ls_r-driverswap = 'N'.
            ENDIF.
            " MOD-030: visit group CCEJPAPER -> scenario R, driver swap N.
            IF ls_r-visitgroup = lc_paper.
              ls_r-scenario = 'R'.
              ls_r-driverswap  = 'N'.
            ENDIF.
          ENDIF.

          " Exception traffic light from status id (classic mapping).
          CASE ls_r-statusid.
            WHEN '804090'. ls_r-light = lc_green.
            WHEN '804000'. ls_r-light = lc_red.
            WHEN '803000'. ls_r-light = lc_yellow.
            WHEN OTHERS.   ls_r-light = lc_gray.
          ENDCASE.

          " Exception column text (classic ALV exception light -> readable
          " label, coloured by the Light criticality in the UI).
          CASE ls_r-light.
            WHEN lc_green.  ls_r-exceptiontext = 'OK'.
            WHEN lc_yellow. ls_r-exceptiontext = 'Warning'.
            WHEN lc_red.    ls_r-exceptiontext = 'Error'.
            WHEN OTHERS.    CLEAR ls_r-exceptiontext.
          ENDCASE.

          " FSR status = the settlement status id (e.g. 804090).
          ls_r-fsrstatus = ls_r-statusid.
          " Processing status is DERIVED from the traffic light (classic
          " MOD-018): green = P (in process), red = E, yellow = M, gray = N.
          CASE ls_r-light.
            WHEN lc_green.  ls_r-processingstatus = 'P'.
            WHEN lc_red.    ls_r-processingstatus = 'E'.
            WHEN lc_yellow. ls_r-processingstatus = 'M'.
            WHEN OTHERS.    ls_r-processingstatus = 'N'.
          ENDCASE.
          " Planned route from the visit group (classic auth mapping).
          CASE ls_r-visitgroup.
            WHEN 'CCEJVEND'. ls_r-planned = 'P'.
            WHEN 'CCEJPLAN'. ls_r-planned = 'E'.
            WHEN 'CCEJMANL'. ls_r-planned = 'U'.
            WHEN OTHERS.     CLEAR ls_r-planned.
          ENDCASE.
          " Log status (simplified): success when green, else not processed.
          IF ls_r-light = lc_green.
            ls_r-logstatus = 'S'.
          ELSE.
            ls_r-logstatus = 'N'.
          ENDIF.

          DATA lv_ref TYPE xblnr.
          lv_ref = <t>-vlid.
          SHIFT lv_ref LEFT DELETING LEADING '0'.
          ls_r-referencedoc = lv_ref.
          ls_r-headertext   = lv_ref.

          APPEND ls_r TO rt.
        ENDLOOP.
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_visit.

    " Mode 2 - Visit Details, ported column-for-column from the classic
    " f_get_visit_details:
    "   /DSD/HH_RACVHD (by tour_id) -> visit, customer, sales area, reason,
    "                                  changed on/time/by, status, man_proc
    "   KNA1           (by custnr)  -> account group, business type, equip owner
    "   /DSD/HH_RAHD   (by tour_id) -> driver, created date
    "   /DSD/VC_VLP    (vlid+kunnr) -> visit log status + Exception light
    "   resolved tour  (/CCEJ)      -> plant, route, settlement date, status
    IF it_tour IS INITIAL. RETURN. ENDIF.

    CONSTANTS: lc_green    TYPE int1 VALUE 3,
               lc_yellow   TYPE int1 VALUE 2,
               lc_visited  TYPE c LENGTH 1 VALUE 'V',
               lc_plan_nv  TYPE c LENGTH 1 VALUE 'N',
               lc_unplan   TYPE c LENGTH 1 VALUE 'U'.

    TRY.
        SELECT tour_id, visit_id, custnr, vkorg, vtweg, spart, viscod,
               cngdate, cngtime, cnguser, status, man_proc
          FROM /dsd/hh_racvhd
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_visit).
        IF lt_visit IS INITIAL. RETURN. ENDIF.

        " Customer master: account group, business type, equipment owner.
        SELECT kunnr, ktokd, katr4, /scl/equp_ownr FROM kna1
          FOR ALL ENTRIES IN @lt_visit
          WHERE kunnr = @lt_visit-custnr
          INTO TABLE @DATA(lt_kna1).

        " Tour header: driver + created stamp.
        SELECT tour_id, driver, credate, cretime, creuser FROM /dsd/hh_rahd
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_rahd).

        " Visit-list item (planned customers): vlid = tour_id+2(10), kunnr.
        DATA lt_vlpkey TYPE STANDARD TABLE OF /dsd/vc_vlp.
        LOOP AT lt_visit ASSIGNING FIELD-SYMBOL(<vk>).
          APPEND VALUE #( vlid = <vk>-tour_id+2(10) kunnr = <vk>-custnr ) TO lt_vlpkey.
        ENDLOOP.
        IF lt_vlpkey IS NOT INITIAL.
          SELECT vlid, kunnr FROM /dsd/vc_vlp
            FOR ALL ENTRIES IN @lt_vlpkey
            WHERE vlid = @lt_vlpkey-vlid AND kunnr = @lt_vlpkey-kunnr
            INTO TABLE @DATA(lt_vlp).
        ENDIF.

        LOOP AT lt_visit ASSIGNING FIELD-SYMBOL(<c>).
          DATA ls_v TYPE ty_result.
          CLEAR ls_v.
          ls_v-reportmode  = 'VISI'.
          ls_v-tourid      = <c>-tour_id.
          ls_v-visitid     = <c>-visit_id.
          ls_v-customer    = <c>-custnr.
          ls_v-vkorg       = <c>-vkorg.
          ls_v-distchannel = <c>-vtweg.
          ls_v-division    = <c>-spart.
          ls_v-visitreason = <c>-viscod.
          ls_v-changedby   = <c>-cnguser.
          ls_v-processingstatus = <c>-status.
          ls_v-manproc     = <c>-man_proc.
          to_local_time( EXPORTING iv_date = <c>-cngdate iv_time = <c>-cngtime
                         IMPORTING ev_date = ls_v-changedon ev_time = ls_v-changedtime ).

          " Customer master.
          READ TABLE lt_kna1 ASSIGNING FIELD-SYMBOL(<k>) WITH KEY kunnr = <c>-custnr.
          IF sy-subrc = 0.
            ls_v-accountgroup = <k>-ktokd.
            ls_v-businesstype = <k>-katr4.
            ls_v-equipowner   = <k>-/scl/equp_ownr.
          ENDIF.

          " Tour header -> driver + created stamp. Created On comes from the
          " visit's own tour header (classic uses RAHD-credate), converted to
          " Japan local time. Visits under different tours/shipments therefore
          " show different created dates (e.g. shipment 9164600728 = 14.08).
          READ TABLE lt_rahd ASSIGNING FIELD-SYMBOL(<h>) WITH KEY tour_id = <c>-tour_id.
          IF sy-subrc = 0.
            ls_v-driver = <h>-driver.
            " Visit Created On = tour header create stamp converted to Japan
            " local time. The stored stamp (e.g. 13.08 23:52) rolls into the
            " next day in JST (+9h) -> 14.08, matching the GUI.
            to_local_time( EXPORTING iv_date = <h>-credate iv_time = <h>-cretime
                           IMPORTING ev_date = ls_v-createdon ev_time = ls_v-createdtime ).
            IF ls_v-createdon IS INITIAL. ls_v-createdon = <h>-credate. ENDIF.
          ENDIF.

          " Plant / route / settlement date / document from the resolved tour.
          READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <c>-tour_id.
          IF sy-subrc = 0.
            ls_v-shipmentno     = <t>-vlid.
            ls_v-plant          = <t>-werks.
            ls_v-route          = <t>-route.
            ls_v-settlementdate = <t>-date.
            ls_v-statusid       = <t>-status_id.
          ENDIF.

          " Visit log status + Exception light (classic MOD-020 rules).
          READ TABLE lt_vlp TRANSPORTING NO FIELDS
            WITH KEY vlid = <c>-tour_id+2(10) kunnr = <c>-custnr.
          IF sy-subrc = 0.
            IF <c>-man_proc = abap_true.
              ls_v-light = lc_green.  ls_v-visitlog = lc_visited.
            ELSE.
              ls_v-light = lc_yellow. ls_v-visitlog = lc_plan_nv.
            ENDIF.
          ELSE.
            ls_v-light = lc_yellow.   ls_v-visitlog = lc_unplan.
          ENDIF.

          APPEND ls_v TO rt.
        ENDLOOP.
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_sales.

    " Mode SLRP - Sales / Replenishment, ported from classic f_get_sales.
    " Main loop driver = /DSD/HH_RADELIT (delivery items). Enriched with
    " material text (MAKT), delivery header (RADELHD: obj type / PO / PO date),
    " conditions (RADELCND: condition type + amount), customer (RACVHD + KNA1),
    " and scenario (RACOCIHD checker).
    IF it_tour IS INITIAL. RETURN. ENDIF.
    TRY.
        SELECT * FROM /dsd/hh_radelit
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_it).
        IF lt_it IS INITIAL. RETURN. ENDIF.

        " Sorted material-text lookup: the per-item loop below reads it by MATNR,
        " so a sorted key turns each read from a linear scan into a binary search
        " (same values, faster). Exact-match line type keeps the fill positional.
        TYPES: BEGIN OF ty_matdesc, matnr TYPE matnr, maktx TYPE maktx, END OF ty_matdesc.
        DATA lt_makt TYPE SORTED TABLE OF ty_matdesc WITH NON-UNIQUE KEY matnr.
        SELECT matnr, maktx FROM makt
          FOR ALL ENTRIES IN @lt_it
          WHERE matnr = @lt_it-matnr AND spras = @sy-langu
          INTO TABLE @lt_makt.

        " Package group per material (classic reads MARA-/SCL/PKGGROUP).
        SELECT matnr, /scl/pkggroup FROM mara
          FOR ALL ENTRIES IN @lt_it
          WHERE matnr = @lt_it-matnr
          INTO TABLE @DATA(lt_mara).

        SELECT * FROM /dsd/hh_radelhd
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_hd).

        SELECT * FROM /dsd/hh_radelcnd
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_cnd).

        SELECT tour_id, visit_id, custnr FROM /dsd/hh_racvhd
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_cv).

        IF lt_cv IS NOT INITIAL.
          SELECT kunnr, katr3, katr4, /scl/equp_ownr FROM kna1
            FOR ALL ENTRIES IN @lt_cv
            WHERE kunnr = @lt_cv-custnr
            INTO TABLE @DATA(lt_kna1).
        ENDIF.

        SELECT tour_id, checker FROM /dsd/hh_racocihd
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_coci).

        LOOP AT lt_it ASSIGNING FIELD-SYMBOL(<i>).
          DATA ls_s TYPE ty_result.
          CLEAR ls_s.
          ls_s-reportmode   = 'SLRP'.
          ls_s-tourid       = <i>-tour_id.
          ls_s-visitid      = <i>-visit_id.
          ls_s-deliveryno   = <i>-hh_delvry.
          ls_s-deliveryitem = <i>-hh_delvry_it.
          ls_s-material     = <i>-matnr.
          ls_s-plant        = <i>-plant.
          ls_s-quantity     = <i>-quan.
          ls_s-uom          = <i>-uom.
          ls_s-tacode       = <i>-ta_code.
          ls_s-reason       = <i>-reason.
          ls_s-batch        = <i>-charg.
          ls_s-origqty      = <i>-/scl/orig_qty.

          READ TABLE lt_makt ASSIGNING FIELD-SYMBOL(<mk>) WITH KEY matnr = <i>-matnr.
          IF sy-subrc = 0. ls_s-materialdesc = <mk>-maktx. ENDIF.

          READ TABLE lt_mara ASSIGNING FIELD-SYMBOL(<ma>) WITH KEY matnr = <i>-matnr.
          IF sy-subrc = 0. ls_s-packagegroup = <ma>-/scl/pkggroup. ENDIF.

          " Split /SCL/ORIG_QTY into money code(4)+set id(3)+money type(2)
          " exactly like classic f_split_value: integer part left-padded to 9.
          IF <i>-/scl/orig_qty IS NOT INITIAL.
            split_orig_qty( EXPORTING iv_qty = <i>-/scl/orig_qty
                            IMPORTING ev_money_type = ls_s-moneytype
                                      ev_set_id     = ls_s-setid
                                      ev_money_code = ls_s-moneycode ).
          ENDIF.

          READ TABLE lt_hd ASSIGNING FIELD-SYMBOL(<h>)
            WITH KEY tour_id = <i>-tour_id visit_id = <i>-visit_id hh_delvry = <i>-hh_delvry.
          IF sy-subrc = 0.
            ls_s-objtype  = <h>-obj_typ.
            ls_s-ponumber = <h>-bstkd.
            ls_s-podate   = <h>-bstdk.
          ENDIF.

          " Conditions for this delivery item: YJVA/YJCN -> Amount, YJPR ->
          " Promotion amount, YJP0 -> Free Vend amount (classic MOD-001).
          LOOP AT lt_cnd ASSIGNING FIELD-SYMBOL(<cn>)
            WHERE tour_id = <i>-tour_id AND visit_id = <i>-visit_id
              AND hh_delvry = <i>-hh_delvry AND hh_delvry_it = <i>-hh_delvry_it.
            CASE <cn>-cond.
              WHEN 'YJVA' OR 'YJCN'.
                ls_s-condtype = <cn>-cond.
                ls_s-amount   = conv_jpy( <cn>-amount ).
              WHEN 'YJPR'.
                ls_s-promoamt = ls_s-promoamt + conv_jpy( <cn>-amount ).
              WHEN 'YJP0'.
                ls_s-freevendamt = ls_s-freevendamt + conv_jpy( <cn>-amount ).
              WHEN OTHERS.
                IF ls_s-condtype IS INITIAL.
                  ls_s-condtype = <cn>-cond.
                  ls_s-amount   = conv_jpy( <cn>-amount ).
                ENDIF.
            ENDCASE.
          ENDLOOP.

          " Sales amount = quantity * amount, only for Visit-List objects
          " (obj type '20'), matching classic MOD-001.
          IF ls_s-objtype = '20'.
            ls_s-salesamt = ls_s-quantity * ls_s-amount.
          ENDIF.

          READ TABLE lt_cv ASSIGNING FIELD-SYMBOL(<cv>)
            WITH KEY tour_id = <i>-tour_id visit_id = <i>-visit_id.
          IF sy-subrc = 0.
            ls_s-customer = <cv>-custnr.
            READ TABLE lt_kna1 ASSIGNING FIELD-SYMBOL(<k>) WITH KEY kunnr = <cv>-custnr.
            IF sy-subrc = 0.
              ls_s-attr3        = <k>-katr3.
              ls_s-businesstype = <k>-katr4.
              ls_s-equipowner   = <k>-/scl/equp_ownr.
            ENDIF.
          ENDIF.

          READ TABLE lt_coci ASSIGNING FIELD-SYMBOL(<co>) WITH KEY tour_id = <i>-tour_id.
          IF sy-subrc = 0 AND strlen( <co>-checker ) > 10.
            ls_s-scenario = <co>-checker+10(1).
          ENDIF.

          READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <i>-tour_id.
          IF sy-subrc = 0.
            ls_s-shipmentno     = <t>-vlid.
            ls_s-route          = <t>-route.
            ls_s-settlementdate = <t>-date.
            ls_s-statusid       = <t>-status_id.
            IF ls_s-plant IS INITIAL. ls_s-plant = <t>-werks. ENDIF.
          ENDIF.

          APPEND ls_s TO rt.
        ENDLOOP.
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_payment.

    " Mode PAYT - Payment details, ported from classic f_get_payment. Main
    " loop driver = /DSD/HH_RAEC. Customer resolved via RACVHD + KNA1. (The
    " classic BSEG/FI posting-key enrichment via FI_DOCUMENT_READ is omitted -
    " it would need a per-row RFC and is not required for the core payment view.)
    IF it_tour IS INITIAL. RETURN. ENDIF.
    TRY.
        SELECT * FROM /dsd/hh_raec
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_pay).
        IF lt_pay IS INITIAL. RETURN. ENDIF.

        SELECT tour_id, visit_id, custnr FROM /dsd/hh_racvhd
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_cv).
        IF lt_cv IS NOT INITIAL.
          SELECT kunnr, katr4, /scl/equp_ownr FROM kna1
            FOR ALL ENTRIES IN @lt_cv
            WHERE kunnr = @lt_cv-custnr
            INTO TABLE @DATA(lt_kna1).
        ENDIF.

        " FI posting detail. Instead of the classic FI_DOCUMENT_READ (RFC into
        " BSEG), read the released CDS view I_OperationalAcctgDocItem - exactly
        " the replacement the classic report itself adopted for S/4 (MOD-027).
        " Keyed by company code / accounting document / fiscal year from RAEC.
        DATA lt_fikey TYPE STANDARD TABLE OF /dsd/hh_raec.
        lt_fikey = lt_pay.
        SORT lt_fikey BY compcod oi_csh_post fisc_year.
        DELETE ADJACENT DUPLICATES FROM lt_fikey COMPARING compcod oi_csh_post fisc_year.
        DELETE lt_fikey WHERE oi_csh_post IS INITIAL.

        IF lt_fikey IS NOT INITIAL.
          SELECT companycode          AS bukrs,
                 accountingdocument    AS belnr,
                 fiscalyear            AS gjahr,
                 accountingdocumentitem AS buzei,
                 postingkey            AS bschl,
                 absltamtinbalancetransaccrcy AS pswbt,
                 balancetransactioncurrency   AS pswsl,
                 customer              AS kunnr
            FROM i_operationalacctgdocitem
            FOR ALL ENTRIES IN @lt_fikey
            WHERE companycode       = @lt_fikey-compcod
              AND accountingdocument = @lt_fikey-oi_csh_post
              AND fiscalyear        = @lt_fikey-fisc_year
            INTO TABLE @DATA(lt_item).


          SELECT bukrs, belnr, gjahr, blart, budat, bldat, stblg FROM bkpf
            FOR ALL ENTRIES IN @lt_fikey
            WHERE bukrs = @lt_fikey-compcod
              AND belnr = @lt_fikey-oi_csh_post
              AND gjahr = @lt_fikey-fisc_year
            INTO TABLE @DATA(lt_bkpf).
        ENDIF.

        LOOP AT lt_pay ASSIGNING FIELD-SYMBOL(<p>).
          " Build the payment-header template ONCE per RAEC record. The classic
          " f_get_payment then emits one output row PER accounting-document line
          " item (BSEG / I_OperationalAcctgDocItem), which is why a single
          " payment produces several rows (e.g. 4).
          DATA ls_base TYPE ty_result.
          CLEAR ls_base.
          ls_base-reportmode    = 'PAYT'.
          ls_base-tourid        = <p>-tour_id.
          ls_base-paymentmethod = <p>-paymt.
          ls_base-paymentdescr  = <p>-paymt_descr.
          ls_base-cardno        = <p>-cardnr.
          ls_base-checkno       = <p>-checknr.
          ls_base-amount        = conv_jpy( <p>-amount ).
          ls_base-currency      = <p>-curr.
          ls_base-cashid        = <p>-cash_id.
          ls_base-cashtype      = <p>-cash_typ.
          ls_base-accountingdoc = <p>-oi_csh_post.
          ls_base-fiscyear      = <p>-fisc_year.
          ls_base-compcode      = <p>-compcod.
          " Cash id in the key slot keeps payments of the same tour distinct;
          " the posting item (below) makes each line item's row distinct too.
          ls_base-slddocid      = <p>-cash_id.

          " Pick the REAL visit customer for Attrib. 4 / Equipment Owner: the
          " RACVHD party whose KNA1-KATR4 is not 'H' (a driver dummy account).
          " Otherwise the first visit (often the driver) would give KATR4='H'
          " and a blank Equipment Owner.
          LOOP AT lt_cv ASSIGNING FIELD-SYMBOL(<cv>) WHERE tour_id = <p>-tour_id.
            READ TABLE lt_kna1 ASSIGNING FIELD-SYMBOL(<k>) WITH KEY kunnr = <cv>-custnr.
            IF sy-subrc = 0 AND <k>-katr4 <> 'H'.
              ls_base-customer     = <cv>-custnr.
              ls_base-visitid      = <cv>-visit_id.
              ls_base-businesstype = <k>-katr4.
              ls_base-equipowner   = <k>-/scl/equp_ownr.
              EXIT.
            ENDIF.
          ENDLOOP.
          " Fallback: if none found, take the first visit party as before.
          IF ls_base-customer IS INITIAL.
            READ TABLE lt_cv ASSIGNING <cv> WITH KEY tour_id = <p>-tour_id.
            IF sy-subrc = 0.
              ls_base-customer = <cv>-custnr.
              ls_base-visitid  = <cv>-visit_id.
              READ TABLE lt_kna1 ASSIGNING <k> WITH KEY kunnr = <cv>-custnr.
              IF sy-subrc = 0.
                ls_base-businesstype = <k>-katr4.
                ls_base-equipowner   = <k>-/scl/equp_ownr.
              ENDIF.
            ENDIF.
          ENDIF.

          READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <p>-tour_id.
          IF sy-subrc = 0.
            ls_base-shipmentno     = <t>-vlid.
            ls_base-plant          = <t>-werks.
            ls_base-route          = <t>-route.
            ls_base-settlementdate = <t>-date.
            ls_base-statusid       = <t>-status_id.
          ENDIF.

          " Document-level accounting fields (same for every line item).
          IF <p>-oi_csh_post IS NOT INITIAL.
            READ TABLE lt_bkpf ASSIGNING FIELD-SYMBOL(<bk>)
              WITH KEY bukrs = <p>-compcod belnr = <p>-oi_csh_post gjahr = <p>-fisc_year.
            IF sy-subrc = 0.
              ls_base-doctype      = <bk>-blart.
              ls_base-postingdate  = <bk>-budat.
              ls_base-documentdate = <bk>-bldat.
              ls_base-reversaldoc  = <bk>-stblg.
            ENDIF.
          ENDIF.

          " Collect ALL line items of this payment's accounting document.
          DATA lt_pitem LIKE lt_item.
          CLEAR lt_pitem.
          IF <p>-oi_csh_post IS NOT INITIAL.
            LOOP AT lt_item ASSIGNING FIELD-SYMBOL(<fi>)
              WHERE bukrs = <p>-compcod AND belnr = <p>-oi_csh_post
                AND gjahr = <p>-fisc_year.
              APPEND <fi> TO lt_pitem.
            ENDLOOP.
          ENDIF.

          IF lt_pitem IS NOT INITIAL.
            " One row per FI line item.
            LOOP AT lt_pitem ASSIGNING <fi>.
              DATA ls_p TYPE ty_result.
              ls_p = ls_base.
              ls_p-postingitem     = <fi>-buzei.
              ls_p-postingkey      = <fi>-bschl.
              ls_p-postingamount   = conv_jpy( <fi>-pswbt ).
              ls_p-postingcurrency = <fi>-pswsl.
              " Rcpt/Exp column maps to the Cash Type (classic CASH_TYP): '1'
              " for the cash settlement line items, blank for the banked rows.
              ls_p-rcptexp = ls_base-cashtype.
              " Recipient = the posting line's customer/account (classic MOD-006:
              " when settled, "Customer" becomes "Recipient" and the visit
              " customer is shown separately in Customer).
              ls_p-recipient       = <fi>-kunnr.
              IF ls_p-customer IS INITIAL. ls_p-customer = <fi>-kunnr. ENDIF.
              " Payment log status: processed once settled (status >= 804000).
              IF ls_p-statusid >= '804000'.
                ls_p-plog = 'P'.
              ELSE.
                ls_p-plog = 'N'.
              ENDIF.
              " Posting item into the (payment-unused) delivery slot so each
              " line item's RowKey is unique.
              ls_p-deliveryno      = |{ <fi>-buzei }|.
              APPEND ls_p TO rt.
            ENDLOOP.
          ELSE.
            " No accounting line items - emit the payment header alone
            " (classic f_get_payment ELSE branch).
            APPEND ls_base TO rt.
          ENDIF.
        ENDLOOP.

        " ---- "Banked In Amount" rows (classic MOD-027) --------------------
        " Besides the RAEC payment postings, the classic report adds the bank
        " deposit postings: DZ accounting documents whose reference (XBLNR) is
        " the VISIT LIST. Each such document's line items become their own
        " payment rows labelled "Banked In Amount". This is why a visit list
        " with one RAEC payment (2 line items) still shows 4 rows.
        DATA lr_vl TYPE RANGE OF xblnr.
        LOOP AT it_tour ASSIGNING FIELD-SYMBOL(<tv>).
          IF <tv>-vlid IS NOT INITIAL.
            APPEND VALUE #( sign = 'I' option = 'EQ' low = <tv>-vlid ) TO lr_vl.
            DATA lv_vlz TYPE xblnr.
            lv_vlz = <tv>-vlid.
            SHIFT lv_vlz LEFT DELETING LEADING '0'.
            IF lv_vlz <> <tv>-vlid AND lv_vlz IS NOT INITIAL.
              APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_vlz ) TO lr_vl.
            ENDIF.
          ENDIF.
        ENDLOOP.

        IF lr_vl IS NOT INITIAL.
          " DZ bank-deposit documents referenced by the visit list.
          SELECT bukrs, belnr, gjahr, blart, budat, stblg, xblnr FROM bkpf
            WHERE blart = 'DZ' AND xblnr IN @lr_vl
            INTO TABLE @DATA(lt_bank).

          IF lt_bank IS NOT INITIAL.
            SELECT companycode           AS bukrs,
                   accountingdocument     AS belnr,
                   fiscalyear             AS gjahr,
                   accountingdocumentitem AS buzei,
                   postingkey             AS bschl,
                   absltamtinbalancetransaccrcy AS pswbt,
                   balancetransactioncurrency   AS pswsl,
                   customer               AS kunnr
              FROM i_operationalacctgdocitem
              FOR ALL ENTRIES IN @lt_bank
              WHERE companycode        = @lt_bank-bukrs
                AND accountingdocument = @lt_bank-belnr
                AND fiscalyear         = @lt_bank-gjahr
              INTO TABLE @DATA(lt_bankit).

            LOOP AT lt_bank ASSIGNING FIELD-SYMBOL(<bd>).
              " Header from the tour whose visit list = this document's ref.
              DATA ls_bd TYPE ty_result.
              CLEAR ls_bd.
              ls_bd-reportmode    = 'PAYT'.
              ls_bd-paymentmethod = 'CA'.
              ls_bd-paymentdescr  = 'Banked In Amount'.
              ls_bd-visitid       = '000001'.
              ls_bd-accountingdoc = <bd>-belnr.
              ls_bd-compcode      = <bd>-bukrs.
              ls_bd-fiscyear      = <bd>-gjahr.
              ls_bd-doctype       = <bd>-blart.
              ls_bd-postingdate   = <bd>-budat.
              ls_bd-reversaldoc   = <bd>-stblg.
              ls_bd-slddocid      = <bd>-belnr.
              DATA lv_bxz TYPE xblnr.
              lv_bxz = <bd>-xblnr.  SHIFT lv_bxz LEFT DELETING LEADING '0'.
              LOOP AT it_tour ASSIGNING <tv>.
                DATA lv_tvz TYPE xblnr.
                lv_tvz = <tv>-vlid.  SHIFT lv_tvz LEFT DELETING LEADING '0'.
                IF lv_tvz = lv_bxz OR <tv>-vlid = <bd>-xblnr.
                  ls_bd-shipmentno     = <tv>-vlid.
                  ls_bd-tourid         = <tv>-tourid.
                  ls_bd-plant          = <tv>-werks.
                  ls_bd-route          = <tv>-route.
                  ls_bd-settlementdate = <tv>-date.
                  ls_bd-statusid       = <tv>-status_id.
                  EXIT.
                ENDIF.
              ENDLOOP.

              " One row per line item of the bank document.
              DATA lv_any TYPE abap_bool.
              CLEAR lv_any.
              LOOP AT lt_bankit ASSIGNING FIELD-SYMBOL(<bi>)
                WHERE bukrs = <bd>-bukrs AND belnr = <bd>-belnr
                  AND gjahr = <bd>-gjahr.
                DATA ls_br TYPE ty_result.
                ls_br = ls_bd.
                ls_br-postingitem     = <bi>-buzei.
                ls_br-postingkey      = <bi>-bschl.
                ls_br-postingamount   = conv_jpy( <bi>-pswbt ).
                ls_br-postingcurrency = <bi>-pswsl.
                ls_br-amount          = conv_jpy( <bi>-pswbt ).
                ls_br-currency        = <bi>-pswsl.
                ls_br-customer        = <bi>-kunnr.
                ls_br-deliveryno      = |{ <bi>-buzei }|.
                APPEND ls_br TO rt.
                lv_any = abap_true.
              ENDLOOP.
              IF lv_any = abap_false.
                APPEND ls_bd TO rt.
              ENDIF.
            ENDLOOP.
          ENDIF.
        ENDIF.
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_check.

    " Mode CHCK - Check Out/In, ported from classic f_get_check. Main loop
    " driver = /DSD/HH_RACOCIMI (check items). Material text from MAKT; amount /
    " currency / payment method from /DSD/HH_RACOCICI (by tour + check + item).
    IF it_tour IS INITIAL. RETURN. ENDIF.
    TRY.
        SELECT * FROM /dsd/hh_racocimi
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_mi).
        IF lt_mi IS INITIAL. RETURN. ENDIF.

        TYPES: BEGIN OF ty_matdesc, matnr TYPE matnr, maktx TYPE maktx, END OF ty_matdesc.
        DATA lt_makt TYPE SORTED TABLE OF ty_matdesc WITH NON-UNIQUE KEY matnr.
        SELECT matnr, maktx FROM makt
          FOR ALL ENTRIES IN @lt_mi
          WHERE matnr = @lt_mi-matnr AND spras = @sy-langu
          INTO TABLE @lt_makt.

        SELECT * FROM /dsd/hh_racocici
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_ci).

        LOOP AT lt_mi ASSIGNING FIELD-SYMBOL(<m>).
          DATA ls_c TYPE ty_result.
          CLEAR ls_c.
          ls_c-reportmode = 'CHCK'.
          ls_c-tourid     = <m>-tour_id.
          ls_c-checkid    = <m>-check_id.
          ls_c-itemno     = <m>-itemnr.
          ls_c-material   = <m>-matnr.
          ls_c-plant      = <m>-plant.
          ls_c-quanplan   = <m>-quan_plan.
          ls_c-quancount  = <m>-quan_count.
          ls_c-quandiff   = <m>-quan_diff.
          ls_c-uom        = <m>-uom.
          ls_c-reason     = <m>-reason.
          ls_c-reasoncode = <m>-reason.
          ls_c-batch      = <m>-charg.

          READ TABLE lt_makt ASSIGNING FIELD-SYMBOL(<mk>) WITH KEY matnr = <m>-matnr.
          IF sy-subrc = 0. ls_c-materialdesc = <mk>-maktx. ENDIF.

          READ TABLE lt_ci ASSIGNING FIELD-SYMBOL(<ci>)
            WITH KEY tour_id = <m>-tour_id check_id = <m>-check_id itemnr = <m>-itemnr.
          IF sy-subrc = 0.
            ls_c-amount        = conv_jpy( <ci>-amount ).
            ls_c-currency      = <ci>-curr.
            ls_c-paymentmethod = <ci>-paymt.
          ENDIF.

          READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <m>-tour_id.
          IF sy-subrc = 0.
            ls_c-shipmentno     = <t>-vlid.
            ls_c-route          = <t>-route.
            ls_c-settlementdate = <t>-date.
            ls_c-statusid       = <t>-status_id.
            IF ls_c-plant IS INITIAL. ls_c-plant = <t>-werks. ENDIF.
          ENDIF.
          APPEND ls_c TO rt.
        ENDLOOP.
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_money.

    IF it_tour IS INITIAL. RETURN. ENDIF.
    TRY.
        SELECT * FROM /dsd/sl_sld_item
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_item).
        IF lt_item IS INITIAL. RETURN. ENDIF.

        SELECT * FROM /dsd/sl_sld_mbal
          FOR ALL ENTRIES IN @lt_item
          WHERE sld_doc_id = @lt_item-sld_doc_id
          INTO TABLE @DATA(lt_mbal).

        LOOP AT lt_mbal ASSIGNING FIELD-SYMBOL(<mb>).
          READ TABLE lt_item ASSIGNING FIELD-SYMBOL(<it>) WITH KEY sld_doc_id = <mb>-sld_doc_id.
          DATA ls_m TYPE ty_result.
          CLEAR ls_m.
          ls_m-reportmode     = 'MONY'.
          ls_m-slddocid       = <mb>-sld_doc_id.
          ls_m-paymentmethod  = <mb>-payment_type.
          ls_m-amountco       = conv_jpy( <mb>-amount_co ).
          ls_m-amountexpenses = conv_jpy( <mb>-amount_expenses ).
          ls_m-amountearnings = conv_jpy( <mb>-amount_earnings ).
          ls_m-amountci       = conv_jpy( <mb>-amount_ci ).
          ls_m-amount         = conv_jpy( <mb>-amount_diff ).
          ls_m-amountdiff     = conv_jpy( <mb>-amount_diff ).
          ls_m-amountplan     = conv_jpy( <mb>-amount_plan ).
          " 'Mon. Diff. In/Out' (classic ty_final4-amount_diff_eval): the classic
          " only ever fills it via MOVE-CORRESPONDING from /dsd/sl_sld_mbal, and
          " that table has no such column on this system, so it stays blank there
          " too. Read it dynamically so activation is safe and it populates
          " automatically on any system where the column does exist.
          DATA lv_deval TYPE p LENGTH 15 DECIMALS 2.
          ASSIGN COMPONENT 'AMOUNT_DIFF_EVAL' OF STRUCTURE <mb> TO FIELD-SYMBOL(<de>).
          IF sy-subrc = 0.
            " NOTE: do NOT run this through conv_jpy. amount_diff_eval already
            " holds the external value (e.g. 2); conv_jpy converts JPY internal
            " -> external by multiplying by 100, which turned 2 into 200.
            lv_deval = <de>.
            ls_m-amountdiffeval = lv_deval.
          ENDIF.
          ls_m-reason         = <mb>-reason.
          ls_m-reasoncode     = <mb>-reason.
          ls_m-currency       = <mb>-currency_amount.
          IF <it> IS ASSIGNED.
            ls_m-tourid     = <it>-tour_id.
            ls_m-shipmentno = <it>-obj_id.
            READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <it>-tour_id.
            IF sy-subrc = 0.
              ls_m-plant = <t>-werks.  ls_m-route = <t>-route.
              ls_m-settlementdate = <t>-date.  ls_m-statusid = <t>-status_id.
            ENDIF.
          ENDIF.
          APPEND ls_m TO rt.
        ENDLOOP.
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_quan.

    IF it_tour IS INITIAL. RETURN. ENDIF.
    TRY.
        SELECT * FROM /dsd/sl_sld_item
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_item).
        IF lt_item IS INITIAL. RETURN. ENDIF.

        SELECT * FROM /dsd/sl_sld_qbal
          FOR ALL ENTRIES IN @lt_item
          WHERE sld_doc_id = @lt_item-sld_doc_id
          INTO TABLE @DATA(lt_qbal).

        TYPES: BEGIN OF ty_matdesc, matnr TYPE matnr, maktx TYPE maktx, END OF ty_matdesc.
        DATA lt_makt TYPE SORTED TABLE OF ty_matdesc WITH NON-UNIQUE KEY matnr.
        IF lt_qbal IS NOT INITIAL.
          SELECT matnr, maktx FROM makt
            FOR ALL ENTRIES IN @lt_qbal
            WHERE matnr = @lt_qbal-matnr AND spras = @sy-langu
            INTO TABLE @lt_makt.
        ENDIF.

        LOOP AT lt_qbal ASSIGNING FIELD-SYMBOL(<qb>).
          READ TABLE lt_item ASSIGNING FIELD-SYMBOL(<it>) WITH KEY sld_doc_id = <qb>-sld_doc_id.
          DATA ls_q TYPE ty_result.
          CLEAR ls_q.
          ls_q-reportmode    = 'QUAN'.
          ls_q-slddocid      = <qb>-sld_doc_id.
          ls_q-material      = <qb>-matnr.
          ls_q-quanplan      = <qb>-quan_planned.
          ls_q-quancheckout  = <qb>-quan_checkout.
          ls_q-quandiff      = <qb>-quan_diff.
          ls_q-quandelivered = <qb>-quan_delivered.
          ls_q-quanreturn    = <qb>-quan_return.
          ls_q-quancheckin   = <qb>-quan_checkin.
          ls_q-quanfinaldiff = <qb>-quan_final_diff.
          ls_q-uom           = <qb>-uom_for_quan.
          ls_q-valuefindiff  = <qb>-value_fin_diff.
          ls_q-currency      = <qb>-currency_fin_dif.
          ls_q-plant         = <qb>-plant.
          ls_q-batch         = <qb>-charg.
          READ TABLE lt_makt ASSIGNING FIELD-SYMBOL(<mk>) WITH KEY matnr = <qb>-matnr.
          IF sy-subrc = 0.
            ls_q-materialdesc = <mk>-maktx.
          ENDIF.
          IF <it> IS ASSIGNED.
            ls_q-tourid     = <it>-tour_id.
            ls_q-shipmentno = <it>-obj_id.
            READ TABLE it_tour ASSIGNING FIELD-SYMBOL(<t>) WITH KEY tourid = <it>-tour_id.
            IF sy-subrc = 0.
              IF ls_q-plant IS INITIAL. ls_q-plant = <t>-werks. ENDIF.
              ls_q-route = <t>-route.
              ls_q-settlementdate = <t>-date.  ls_q-statusid = <t>-status_id.
            ENDIF.
          ENDIF.
          APPEND ls_q TO rt.
        ENDLOOP.
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_fsr.

    IF it_tour IS INITIAL. RETURN. ENDIF.
    TRY.
        " Classic FSR keys the sales documents by VBAK-XBLNR = the SHIPMENT
        " number (VTTK-TKNUM), matched WITHOUT leading zeros. We build the
        " XBLNR candidates from BOTH the shipment (tknum) AND the visit list
        " (they coincide for many records, differ for some), so it resolves
        " either way.
        DATA lr_xblnr TYPE RANGE OF xblnr.
        LOOP AT it_tour ASSIGNING FIELD-SYMBOL(<t>).
          DATA lv_s TYPE xblnr.
          lv_s = <t>-shipment.
          SHIFT lv_s LEFT DELETING LEADING '0'.
          IF lv_s IS NOT INITIAL.
            APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_s ) TO lr_xblnr.
          ENDIF.
          DATA lv_x TYPE xblnr.
          lv_x = <t>-vlid.
          SHIFT lv_x LEFT DELETING LEADING '0'.
          IF lv_x IS NOT INITIAL.
            APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_x ) TO lr_xblnr.
          ENDIF.
        ENDLOOP.
        IF lr_xblnr IS INITIAL. RETURN. ENDIF.

        SELECT vbeln, xblnr, auart, vkorg, erdat, kunnr FROM vbak
          WHERE xblnr IN @lr_xblnr
          INTO TABLE @DATA(lt_vbak).
        IF lt_vbak IS INITIAL. RETURN. ENDIF.

        " Visit customer per sales order. In DSD the replenishment sales order's
        " sold-to (VBAK-KUNNR) is the DRIVER dummy account, not the end customer.
        " The classic links each sales order to a VISIT via its HHT document
        " number (VBKD-BSTKD = /DSD/HH_RADELHD-PONUMBER); only orders that carry
        " an HHT doc get a visit -> Customer / Attrib. 4 (the others stay blank,
        " which is why the classic fills Customer on some rows only).
        SELECT tour_id, visit_id, custnr FROM /dsd/hh_racvhd
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_fcv).
        " KNA1 for the visit customers (Attrib. 4 / Attr.3 / Equipment Owner).
        IF lt_fcv IS NOT INITIAL.
          SELECT kunnr, katr3, katr4, /scl/equp_ownr FROM kna1
            FOR ALL ENTRIES IN @lt_fcv
            WHERE kunnr = @lt_fcv-custnr
            INTO TABLE @DATA(lt_fkna1).
        ENDIF.
        " HHT document number (PO number) per sales order.
        SELECT vbeln, bstkd FROM vbkd
          FOR ALL ENTRIES IN @lt_vbak
          WHERE vbeln = @lt_vbak-vbeln AND posnr = '000000'
          INTO TABLE @DATA(lt_vbkd).
        " Delivery headers of the tour: map HHT doc (PONUMBER) -> visit.
        SELECT tour_id, visit_id, bstkd FROM /dsd/hh_radelhd
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_rhd).

        " Payment method (classic shows it on the banked / RAEC document row,
        " e.g. CA). Read the tour's cash-posting payment method from /DSD/HH_RAEC.
        DATA lv_fpaymt TYPE /dsd/hh_paymt.
        SELECT tour_id, paymt FROM /dsd/hh_raec
          FOR ALL ENTRIES IN @it_tour
          WHERE tour_id = @it_tour-tourid
          INTO TABLE @DATA(lt_fraec).
        READ TABLE lt_fraec ASSIGNING FIELD-SYMBOL(<rc0>) INDEX 1.
        IF sy-subrc = 0. lv_fpaymt = <rc0>-paymt. ENDIF.

        " Representative visit customer for the appended document row (which is
        " not itself a sales order); captured from the first order that links.
        DATA lv_fcustomer TYPE kunnr.
        DATA lv_fkatr4    TYPE katr4.
        DATA lv_fkatr3    TYPE katr3.
        DATA lv_fequp     TYPE c LENGTH 2.
        DATA lv_fvisit    TYPE /dsd/hh_visit_id.
        DATA lv_fhht      TYPE bstkd.

        " Driver = the sold-to party that is a DRIVER dummy account (KNA1-KATR4
        " = 'H'). Same value on every FSR row (e.g. R5JWMR2401).
        DATA lv_fdriver TYPE /dsd/rp_driver1.
        DATA lr_vkun TYPE RANGE OF kunnr.
        LOOP AT lt_vbak ASSIGNING FIELD-SYMBOL(<vk>).
          IF <vk>-kunnr IS NOT INITIAL.
            APPEND VALUE #( sign = 'I' option = 'EQ' low = <vk>-kunnr ) TO lr_vkun.
          ENDIF.
        ENDLOOP.
        IF lr_vkun IS NOT INITIAL.
          SELECT kunnr, katr4 FROM kna1
            WHERE kunnr IN @lr_vkun
            INTO TABLE @DATA(lt_vkna).
          LOOP AT lt_vkna ASSIGNING FIELD-SYMBOL(<vkn>).
            IF <vkn>-katr4 = 'H'.
              lv_fdriver = <vkn>-kunnr.
              EXIT.
            ENDIF.
          ENDLOOP.
        ENDIF.

        " ---- Document flow: sales order -> delivery / invoice / intercompany
        " Classic f_build_itab reads the SD document flow (VBFA): delivery
        " (category J/T), invoice / credit / debit memo (M/O/P) and the
        " intercompany invoice (category '5').
        SELECT vbelv, vbeln, vbtyp_n FROM vbfa
          FOR ALL ENTRIES IN @lt_vbak
          WHERE vbelv = @lt_vbak-vbeln
            AND ( vbtyp_n = 'J' OR vbtyp_n = 'T'
               OR vbtyp_n = 'M' OR vbtyp_n = 'O' OR vbtyp_n = 'P'
               OR vbtyp_n = '5' OR vbtyp_n = 'R' )
          INTO TABLE @DATA(lt_flow).

        DATA lt_dlv TYPE STANDARD TABLE OF likp.
        DATA lt_inv TYPE STANDARD TABLE OF vbrk.
        DATA lr_dlv TYPE RANGE OF vbeln_vl.
        DATA lr_inv TYPE RANGE OF vbeln_vf.
        LOOP AT lt_flow ASSIGNING FIELD-SYMBOL(<fl>).
          IF <fl>-vbtyp_n = 'J' OR <fl>-vbtyp_n = 'T'.
            APPEND VALUE #( sign = 'I' option = 'EQ' low = <fl>-vbeln ) TO lr_dlv.
          ELSE.
            APPEND VALUE #( sign = 'I' option = 'EQ' low = <fl>-vbeln ) TO lr_inv.
          ENDIF.
        ENDLOOP.
        IF lr_dlv IS NOT INITIAL.
          SELECT vbeln, lfart, lfdat FROM likp
            WHERE vbeln IN @lr_dlv INTO CORRESPONDING FIELDS OF TABLE @lt_dlv.
        ENDIF.
        IF lr_inv IS NOT INITIAL.
          SELECT vbeln, fkart, fkdat, erzet FROM vbrk
            WHERE vbeln IN @lr_inv INTO CORRESPONDING FIELDS OF TABLE @lt_inv.
        ENDIF.

        " ---- FI document by AWKEY = invoice number (classic MOD-001) -------
        " The classic finds the FI/accounting document via BKPF-AWKEY = the
        " billing document number (NOT the shipment reference). AWKEY is stored
        " leading-zero-stripped, so we match on the stripped invoice numbers.
        DATA lr_awk TYPE RANGE OF awkey.
        LOOP AT lr_inv ASSIGNING FIELD-SYMBOL(<ri>).
          DATA lv_awk TYPE awkey.
          lv_awk = <ri>-low.
          SHIFT lv_awk LEFT DELETING LEADING '0'.
          IF lv_awk IS NOT INITIAL.
            APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_awk ) TO lr_awk.
          ENDIF.
        ENDLOOP.
        " Query BOTH the stripped and zero-padded forms so the match works
        " regardless of how AWKEY is stored, then normalise when reading.
        LOOP AT lr_inv ASSIGNING <ri>.
          APPEND VALUE #( sign = 'I' option = 'EQ' low = <ri>-low ) TO lr_awk.
        ENDLOOP.
        DATA lt_bkpf TYPE STANDARD TABLE OF bkpf.
        IF lr_awk IS NOT INITIAL.
          SELECT bukrs, belnr, gjahr, blart, budat, awkey, bktxt FROM bkpf
            WHERE awkey IN @lr_awk
            INTO CORRESPONDING FIELDS OF TABLE @lt_bkpf.
          " Normalise each AWKEY (strip leading zeros of the doc-number part)
          " so the per-row lookup can match on the stripped invoice number.
          LOOP AT lt_bkpf ASSIGNING FIELD-SYMBOL(<nb>).
            DATA lv_nawk TYPE awkey.
            lv_nawk = <nb>-awkey.
            SHIFT lv_nawk LEFT DELETING LEADING '0'.
            <nb>-awkey = lv_nawk.
          ENDLOOP.
        ENDIF.

        " ---- Material document (MATDOC by header text = shipment) ---------
        " S/4HANA universal document table MATDOC (replaces MKPF/MSEG). It is
        " at item level, so DISTINCT the header (MBLNR) per header text.
        DATA lr_bktxt TYPE RANGE OF bktxt.
        LOOP AT it_tour ASSIGNING FIELD-SYMBOL(<tb>).
          DATA lv_bktxt TYPE bktxt.
          lv_bktxt = <tb>-shipment.
          SHIFT lv_bktxt LEFT DELETING LEADING '0'.
          IF lv_bktxt IS NOT INITIAL.
            APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_bktxt ) TO lr_bktxt.
          ENDIF.
        ENDLOOP.
        TYPES: BEGIN OF ty_matdoc,
                 mblnr TYPE mblnr,
                 bktxt TYPE bktxt,
               END OF ty_matdoc.
        DATA lt_mkpf TYPE STANDARD TABLE OF ty_matdoc.
        IF lr_bktxt IS NOT INITIAL.
          SELECT DISTINCT mblnr, bktxt FROM matdoc
            WHERE bktxt IN @lr_bktxt INTO TABLE @lt_mkpf.
        ENDIF.

        " Pre-index the tours by their shipment and visit-list numbers (leading-
        " zero stripped) into a hashed table ONCE, so each order finds its tour
        " in O(1) instead of scanning every tour (was O(orders x tours)). The
        " match rule and the matched tour are identical to the old inner loop -
        " purely a lookup-speed change, same output. The matched line carries
        " the full tour fields so the downstream row build is unchanged.
        TYPES: BEGIN OF ty_tkey,
                 k         TYPE xblnr,
                 tourid    TYPE /dsd/hh_tour_id,
                 vlid      TYPE /dsd/vc_vlid,
                 shipment  TYPE tknum,
                 werks     TYPE werks_d,
                 route     TYPE route,
                 date      TYPE erdat,
                 idoc      TYPE edi_docnum,
                 status_id TYPE /dsd/st_status_id,
               END OF ty_tkey.
        DATA lt_tourkey TYPE HASHED TABLE OF ty_tkey WITH UNIQUE KEY k.
        LOOP AT it_tour ASSIGNING FIELD-SYMBOL(<pk>).
          DATA ls_tk TYPE ty_tkey.
          ls_tk = CORRESPONDING #( <pk> ).
          DATA lv_k TYPE xblnr.
          lv_k = <pk>-shipment.  SHIFT lv_k LEFT DELETING LEADING '0'.
          IF lv_k IS NOT INITIAL AND NOT line_exists( lt_tourkey[ k = lv_k ] ).
            ls_tk-k = lv_k.  INSERT ls_tk INTO TABLE lt_tourkey.
          ENDIF.
          lv_k = <pk>-vlid.      SHIFT lv_k LEFT DELETING LEADING '0'.
          IF lv_k IS NOT INITIAL AND NOT line_exists( lt_tourkey[ k = lv_k ] ).
            ls_tk-k = lv_k.  INSERT ls_tk INTO TABLE lt_tourkey.
          ENDIF.
        ENDLOOP.

        LOOP AT lt_vbak ASSIGNING FIELD-SYMBOL(<o>).
          " Find the tour whose SHIPMENT or VISIT LIST matches this xblnr
          " (both compared leading-zero-insensitive) via the hashed table.
          DATA lv_xb TYPE xblnr.
          lv_xb = <o>-xblnr.
          SHIFT lv_xb LEFT DELETING LEADING '0'.
          DATA lv_found TYPE abap_bool.
          READ TABLE lt_tourkey ASSIGNING FIELD-SYMBOL(<tf>) WITH KEY k = lv_xb.
          lv_found = xsdbool( sy-subrc = 0 ).

          DATA ls_f TYPE ty_result.
          CLEAR ls_f.
          ls_f-reportmode     = 'FSRD'.
          ls_f-vkorg          = <o>-vkorg.
          ls_f-referencedoc   = <o>-xblnr.
          ls_f-salesdoc       = <o>-vbeln.
          ls_f-salesdoctype   = <o>-auart.
          ls_f-orderdate      = <o>-erdat.
          " Driver = the driver dummy account (constant per tour).
          ls_f-driver         = lv_fdriver.
          " HHT document number (PO number) for this sales order.
          READ TABLE lt_vbkd ASSIGNING FIELD-SYMBOL(<vd>) WITH KEY vbeln = <o>-vbeln.
          IF sy-subrc = 0. ls_f-ponumber = <vd>-bstkd. ENDIF.
          " Link this order to a visit via its HHT doc, then to the customer.
          " Only orders that carry an HHT doc get a Customer / Attrib. 4.
          IF ls_f-ponumber IS NOT INITIAL.
            READ TABLE lt_rhd ASSIGNING FIELD-SYMBOL(<rh>) WITH KEY bstkd = ls_f-ponumber.
            IF sy-subrc = 0.
              ls_f-visitid = <rh>-visit_id.
              READ TABLE lt_fcv ASSIGNING FIELD-SYMBOL(<fcv>)
                WITH KEY tour_id = <rh>-tour_id visit_id = <rh>-visit_id.
              IF sy-subrc = 0.
                ls_f-customer = <fcv>-custnr.
                READ TABLE lt_fkna1 ASSIGNING FIELD-SYMBOL(<fkn>) WITH KEY kunnr = <fcv>-custnr.
                IF sy-subrc = 0.
                  ls_f-businesstype = <fkn>-katr4.
                  ls_f-attr3        = <fkn>-katr3.
                  ls_f-equipowner   = <fkn>-/scl/equp_ownr.
                ENDIF.
                " Remember the first linked visit for the document row.
                IF lv_fcustomer IS INITIAL.
                  lv_fcustomer = ls_f-customer.
                  lv_fkatr4    = ls_f-businesstype.
                  lv_fkatr3    = ls_f-attr3.
                  lv_fequp     = ls_f-equipowner.
                  lv_fvisit    = ls_f-visitid.
                  lv_fhht      = ls_f-ponumber.
                ENDIF.
              ENDIF.
            ENDIF.
          ENDIF.
          " Sales document also carried in SldDocId, which is part of the
          " RowKey - so each FSR sales-document row gets a UNIQUE key (many
          " sales docs per tour otherwise collapse to one key, which OData V4
          " rejects as a duplicate key predicate and then shows NO data).
          ls_f-slddocid       = <o>-vbeln.
          IF lv_found = abap_true.
            ls_f-shipmentno     = <tf>-vlid.
            ls_f-tourid         = <tf>-tourid.
            ls_f-plant          = <tf>-werks.
            ls_f-route          = <tf>-route.
            ls_f-settlementdate = <tf>-date.
            ls_f-statusid       = <tf>-status_id.
          ENDIF.

          " Delivery (first J/T in the flow) + delivery type / date.
          READ TABLE lt_flow ASSIGNING <fl>
            WITH KEY vbelv = <o>-vbeln vbtyp_n = 'J'.
          IF sy-subrc <> 0.
            READ TABLE lt_flow ASSIGNING <fl>
              WITH KEY vbelv = <o>-vbeln vbtyp_n = 'T'.
          ENDIF.
          IF sy-subrc = 0.
            ls_f-deliveryno = <fl>-vbeln.
            READ TABLE lt_dlv ASSIGNING FIELD-SYMBOL(<dl>) WITH KEY vbeln = <fl>-vbeln.
            IF sy-subrc = 0.
              ls_f-deliverytype = <dl>-lfart.
              ls_f-deliverydate = <dl>-lfdat.
            ENDIF.
          ENDIF.

          " Invoice / credit / debit (first M/O/P in the flow) + billing info.
          READ TABLE lt_flow ASSIGNING <fl>
            WITH KEY vbelv = <o>-vbeln vbtyp_n = 'M'.
          IF sy-subrc <> 0.
            READ TABLE lt_flow ASSIGNING <fl>
              WITH KEY vbelv = <o>-vbeln vbtyp_n = 'O'.
          ENDIF.
          IF sy-subrc <> 0.
            READ TABLE lt_flow ASSIGNING <fl>
              WITH KEY vbelv = <o>-vbeln vbtyp_n = 'P'.
          ENDIF.
          IF sy-subrc = 0.
            ls_f-invoiceno = <fl>-vbeln.
            READ TABLE lt_inv ASSIGNING FIELD-SYMBOL(<iv>) WITH KEY vbeln = <fl>-vbeln.
            IF sy-subrc = 0.
              ls_f-billingtype = <iv>-fkart.
              " Invoice date in Japan local time (classic f_get_local_time on
              " FKDAT using the creation time ERZET) - can be +1 day vs the raw
              " billing date.
              DATA lv_itim TYPE tims.
              to_local_time( EXPORTING iv_date = <iv>-fkdat iv_time = <iv>-erzet
                             IMPORTING ev_date = ls_f-invoicedate ev_time = lv_itim ).
              IF ls_f-invoicedate IS INITIAL. ls_f-invoicedate = <iv>-fkdat. ENDIF.
            ENDIF.
            " FI / accounting document via BKPF-AWKEY = invoice number
            " (classic MOD-001), leading-zero stripped. This is the correct
            " FI document / doc type / posting date (NOT the shipment BKPF).
            DATA lv_iawk TYPE awkey.
            lv_iawk = <fl>-vbeln.  SHIFT lv_iawk LEFT DELETING LEADING '0'.
            ls_f-refkey = lv_iawk.
            READ TABLE lt_bkpf ASSIGNING FIELD-SYMBOL(<bi>) WITH KEY awkey = lv_iawk.
            IF sy-subrc = 0.
              ls_f-accountingdoc = <bi>-belnr.
              ls_f-compcode      = <bi>-bukrs.
              ls_f-doctype       = <bi>-blart.
              ls_f-fiscyear      = <bi>-gjahr.
              ls_f-postingdate   = <bi>-budat.
              ls_f-headertext    = <bi>-bktxt.
            ENDIF.
          ENDIF.

          " Intercompany invoice (flow category '5') + intercompany FI.
          READ TABLE lt_flow ASSIGNING <fl>
            WITH KEY vbelv = <o>-vbeln vbtyp_n = '5'.
          IF sy-subrc = 0.
            DATA lv_cawk TYPE awkey.
            lv_cawk = <fl>-vbeln.  SHIFT lv_cawk LEFT DELETING LEADING '0'.
            ls_f-cominv = lv_cawk.
            READ TABLE lt_inv ASSIGNING FIELD-SYMBOL(<ci>) WITH KEY vbeln = <fl>-vbeln.
            IF sy-subrc = 0.
              ls_f-cominvtype = <ci>-fkart.
              " Japan local time, same as the primary invoice date (billing
              " create date + time can roll into the next day -> 14.08).
              DATA lv_citim TYPE t.
              to_local_time( EXPORTING iv_date = <ci>-fkdat iv_time = <ci>-erzet
                             IMPORTING ev_date = ls_f-cominvdate ev_time = lv_citim ).
              IF ls_f-cominvdate IS INITIAL. ls_f-cominvdate = <ci>-fkdat. ENDIF.
            ENDIF.
            READ TABLE lt_bkpf ASSIGNING FIELD-SYMBOL(<cb>) WITH KEY awkey = lv_cawk.
            IF sy-subrc = 0.
              ls_f-comfidoc  = <cb>-belnr.
              ls_f-comfitype = <cb>-blart.
              ls_f-comfidate = <cb>-budat.
            ENDIF.
          ENDIF.

          " Material document per sales order (VBFA category 'R'), classic
          " f_build_itab. This is the per-row Material Document (e.g. 6001915134).
          READ TABLE lt_flow ASSIGNING <fl>
            WITH KEY vbelv = <o>-vbeln vbtyp_n = 'R'.
          IF sy-subrc = 0.
            ls_f-materialdoc = <fl>-vbeln.
          ENDIF.

          APPEND ls_f TO rt.
        ENDLOOP.

        " ---- One document row per shipment (classic BKPF / MKPF rows) -----
        " The classic report appends the shipment's accounting document (BKPF)
        " and material document as extra rows (sales-order fields blank). To
        " reproduce the classic RECORD COUNT (e.g. 3 sales orders + 1 document
        " row = 4) we emit exactly ONE combined document row per shipment
        " carrying its accounting doc AND material doc, instead of one row per
        " BKPF/MATDOC entry - the S/4 MATDOC table is item-level and BKPF may
        " hold several postings, either of which would inflate the count.
        SORT lt_bkpf BY belnr.
        DELETE ADJACENT DUPLICATES FROM lt_bkpf COMPARING belnr.
        LOOP AT it_tour ASSIGNING FIELD-SYMBOL(<tk>).
          DATA lv_kx TYPE xblnr.
          lv_kx = <tk>-shipment.  SHIFT lv_kx LEFT DELETING LEADING '0'.
          DATA lv_kv TYPE xblnr.
          lv_kv = <tk>-vlid.      SHIFT lv_kv LEFT DELETING LEADING '0'.

          " First accounting document whose reference matches the shipment/VL.
          DATA lv_have_doc TYPE abap_bool.
          CLEAR lv_have_doc.
          DATA ls_fi TYPE ty_result.
          CLEAR ls_fi.
          LOOP AT lt_bkpf ASSIGNING FIELD-SYMBOL(<bk>).
            DATA lv_bx TYPE xblnr.
            lv_bx = <bk>-xblnr.  SHIFT lv_bx LEFT DELETING LEADING '0'.
            IF lv_bx = lv_kx OR lv_bx = lv_kv.
              ls_fi-accountingdoc = <bk>-belnr.
              ls_fi-compcode      = <bk>-bukrs.
              ls_fi-doctype       = <bk>-blart.
              ls_fi-fiscyear      = <bk>-gjahr.
              ls_fi-postingdate   = <bk>-budat.
              ls_fi-referencedoc  = <bk>-xblnr.
              ls_fi-slddocid      = <bk>-belnr.
              lv_have_doc = abap_true.
              EXIT.
            ENDIF.
          ENDLOOP.

          " First material document (MATDOC) for the shipment header text.
          READ TABLE lt_mkpf ASSIGNING FIELD-SYMBOL(<mb>) WITH KEY bktxt = lv_kx.
          IF sy-subrc = 0.
            ls_fi-materialdoc = <mb>-mblnr.
            IF ls_fi-slddocid IS INITIAL. ls_fi-slddocid = <mb>-mblnr. ENDIF.
            lv_have_doc = abap_true.
          ENDIF.

          " Only emit the extra row when the shipment actually has a document.
          IF lv_have_doc = abap_true.
            ls_fi-reportmode     = 'FSRD'.
            ls_fi-shipmentno     = <tk>-vlid.
            ls_fi-tourid         = <tk>-tourid.
            ls_fi-plant          = <tk>-werks.
            ls_fi-route          = <tk>-route.
            ls_fi-settlementdate = <tk>-date.
            ls_fi-statusid       = <tk>-status_id.
            ls_fi-driver         = lv_fdriver.
            ls_fi-customer       = lv_fcustomer.
            ls_fi-businesstype   = lv_fkatr4.
            ls_fi-attr3          = lv_fkatr3.
            ls_fi-equipowner     = lv_fequp.
            ls_fi-visitid        = lv_fvisit.
            ls_fi-ponumber       = lv_fhht.
            " Payment method (e.g. CA) is shown on this banked/document row.
            ls_fi-paymentmethod  = lv_fpaymt.
            APPEND ls_fi TO rt.
          ENDIF.
        ENDLOOP.
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_cash.

    " Mode CASH - Cash difference. The classic report does NOT read cash tables
    " itself; f_cash_diff SUBMITs external program /CCEJ/RDSDFSVR_CASH_DIFF and
    " captures its SALV output via cl_salv_bs_runtime_info. We reproduce that
    " faithfully: bound the external run to the resolved tours (S_VLID), run it
    " headless, and map the captured ALV columns into our result. Everything is
    " guarded so a missing program or capture failure just yields no rows.
    IF it_tour IS INITIAL. RETURN. ENDIF.

    CONSTANTS lc_prog TYPE progname VALUE '/CCEJ/RDSDFSVR_CASH_DIFF'.

    TRY.
        " Do not attempt SUBMIT if the program does not exist (prevents dump).
        SELECT SINGLE name FROM trdir WHERE name = @lc_prog INTO @DATA(lv_name).
        IF sy-subrc <> 0 OR lv_name IS INITIAL.
          RETURN.
        ENDIF.

        " Selection table: restrict to the resolved visit lists (S_VLID).
        DATA lt_params TYPE STANDARD TABLE OF rsparams.
        LOOP AT it_tour ASSIGNING FIELD-SYMBOL(<t>).
          IF <t>-vlid IS NOT INITIAL.
            APPEND VALUE #( selname = 'S_VLID' kind = 'S'
                            sign = 'I' option = 'EQ' low = <t>-vlid ) TO lt_params.
          ENDIF.
        ENDLOOP.

        " Capture the external ALV headlessly (no display).
        cl_salv_bs_runtime_info=>set( display  = abap_false
                                      metadata = abap_false
                                      data     = abap_true ).

        SUBMIT (lc_prog) WITH SELECTION-TABLE lt_params AND RETURN.

        cl_salv_bs_runtime_info=>get_data_ref( IMPORTING r_data = DATA(lr_data) ).
        cl_salv_bs_runtime_info=>clear_all( ).

        IF lr_data IS NOT BOUND.
          RETURN.
        ENDIF.

        FIELD-SYMBOLS <tab> TYPE ANY TABLE.
        ASSIGN lr_data->* TO <tab>.
        IF <tab> IS NOT ASSIGNED.
          RETURN.
        ENDIF.

        LOOP AT <tab> ASSIGNING FIELD-SYMBOL(<row>).
          DATA ls_h TYPE ty_result.
          CLEAR ls_h.
          ls_h-reportmode = 'CASH'.
          " Dynamic mapping - the external ALV column names (from the classic
          " f_set_columns4). Each is optional; ASSIGN COMPONENT is guarded.
          " Header / dimension columns.
          move_comp( EXPORTING is_row = <row> iv_comp = 'VISITLIST'      CHANGING cv = ls_h-shipmentno ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'MAIN_DRIVER'    CHANGING cv = ls_h-driver ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'VISIT_ID'       CHANGING cv = ls_h-visitid ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'KUNNR'          CHANGING cv = ls_h-customer ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'WERKS'          CHANGING cv = ls_h-plant ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'ROUTE'          CHANGING cv = ls_h-route ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'SETTLMNT_DATE'  CHANGING cv = ls_h-settlementdate ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'KATR4'          CHANGING cv = ls_h-businesstype ).
          " Route Summary labels KATR4 as 'Business Type Extension' (classic
          " f_set_columns4), so surface the same value under that column too.
          ls_h-biztypeext = ls_h-businesstype.
          move_comp( EXPORTING is_row = <row> iv_comp = '/SCL/EQUP_OWNR' CHANGING cv = ls_h-equipowner ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'TRADING_DIV'    CHANGING cv = ls_h-tradingdiv ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'VISIT_TYPE'     CHANGING cv = ls_h-visittype ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'EMPID'          CHANGING cv = ls_h-empid ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'CASHTYPE'       CHANGING cv = ls_h-cashtype ).
          " Quantities.
          move_comp( EXPORTING is_row = <row> iv_comp = 'AGG_QTY'        CHANGING cv = ls_h-quantity ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'UOM'            CHANGING cv = ls_h-uom ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'AGG_SAMPLE_QTY' CHANGING cv = ls_h-aggsampleqty ).
          " Amount figures - one dedicated column each (was collapsed into a
          " few generic Amount* fields, which is why Route Summary looked wrong).
          move_comp( EXPORTING is_row = <row> iv_comp = 'SALES_AMT'      CHANGING cv = ls_h-salesamt ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'PROMO_AMT'      CHANGING cv = ls_h-promoamt ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'AGG_FREE_AMT'   CHANGING cv = ls_h-aggfreeamt ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'FREE_VEND_AMT'  CHANGING cv = ls_h-freevendamt ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'SAMPLE_AMOUNT'  CHANGING cv = ls_h-sampleamount ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'NET_AMT'        CHANGING cv = ls_h-netamt ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'CASH_COLLECTED' CHANGING cv = ls_h-cashcollected ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'RECHARGE'       CHANGING cv = ls_h-recharge ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'REFUND'         CHANGING cv = ls_h-refund ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'RECEIPT'        CHANGING cv = ls_h-receipt ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'UNCOLLECT_CASH' CHANGING cv = ls_h-uncollectcash ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'BANKED_AMT'     CHANGING cv = ls_h-bankedamt ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'THEOR_CASH'     CHANGING cv = ls_h-theorcash ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'TOT_CASH'       CHANGING cv = ls_h-totcash ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'EMONEY'         CHANGING cv = ls_h-emoney ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'PREPAID'        CHANGING cv = ls_h-prepaid ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'TOT_PAYMENT'    CHANGING cv = ls_h-totpayment ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'DIFF_AMT'       CHANGING cv = ls_h-diffamt ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'DRIVER_CREDIT'  CHANGING cv = ls_h-drivercredit ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'DRIVER_DEBIT'   CHANGING cv = ls_h-driverdebit ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'DRIVER_RECEIVE' CHANGING cv = ls_h-driverreceive ).
          move_comp( EXPORTING is_row = <row> iv_comp = 'DRIVER_GIVE'    CHANGING cv = ls_h-drivergive ).
          " Keep the generic Amount as the headline difference for compatibility.
          ls_h-amount = ls_h-diffamt.
          move_comp( EXPORTING is_row = <row> iv_comp = 'SUMMARY_STATUS' CHANGING cv = ls_h-summarystatus ).

          " Traffic light (LIGHT) -> Fiori criticality.
          DATA lv_light TYPE string.
          move_comp( EXPORTING is_row = <row> iv_comp = 'LIGHT' CHANGING cv = lv_light ).
          CASE lv_light.
            WHEN '1' OR 'G'. ls_h-light = 3.
            WHEN '2' OR 'Y'. ls_h-light = 2.
            WHEN '3' OR 'R'. ls_h-light = 1.
            WHEN OTHERS.     ls_h-light = 0.
          ENDCASE.
          " Payment difference status = the classic traffic-light column
          " (coloured by LIGHT). Carry the summary-status text so the column is
          " a coloured status indicator.
          ls_h-paymentdiffstatus = ls_h-summarystatus.

          APPEND ls_h TO rt.
        ENDLOOP.
      CATCH cx_root.
        TRY.
            cl_salv_bs_runtime_info=>clear_all( ).
          CATCH cx_root.
        ENDTRY.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD read_cash_key.

    " Object Page single row for CASH - rebuilt from the RowKey, no external
    " program (that SUBMIT can dump inside a $batch -> HTTP 500). Tour id is
    " kept EMPTY so the rebuilt RowKey matches the list row exactly.
    IF iv_vlid IS INITIAL. RETURN. ENDIF.

    TRY.
        " Match the visit list with and without leading zeros (it may be
        " stored zero-padded even though the key carries it stripped).
        DATA lr_vlid TYPE RANGE OF /dsd/vc_vlid.
        APPEND VALUE #( sign = 'I' option = 'EQ' low = iv_vlid ) TO lr_vlid.
        DATA lv_pad TYPE /dsd/vc_vlid.
        lv_pad = |{ iv_vlid ALPHA = IN }|.
        IF lv_pad <> iv_vlid.
          APPEND VALUE #( sign = 'I' option = 'EQ' low = lv_pad ) TO lr_vlid.
        ENDIF.

        DATA ls_r TYPE ty_result.
        CLEAR ls_r.
        ls_r-reportmode = 'CASH'.
        ls_r-shipmentno = iv_vlid.
        ls_r-visitid    = iv_visit.
        " tourid left EMPTY on purpose (matches the CASH list RowKey).

        " Plant / route / settlement date / idoc from the inbound-status table.
        SELECT SINGLE werks, route, creation_date, idoc_number
          FROM /ccej/t_inb_stat
          WHERE visitlist IN @lr_vlid
          INTO ( @ls_r-plant, @ls_r-route, @ls_r-settlementdate, @ls_r-idocno ).
        IF ls_r-route IS NOT INITIAL.
          SHIFT ls_r-route LEFT DELETING LEADING '0'.
        ENDIF.

        " Status id from the visit-list status table.
        SELECT SINGLE status_id FROM /dsd/st_status
          WHERE vlid IN @lr_vlid
          INTO @ls_r-statusid.

        " Driver + visit group from the visit-list header.
        SELECT SINGLE driver1, auth FROM /dsd/vc_vlh
          WHERE vlid IN @lr_vlid
          INTO ( @ls_r-driver, @ls_r-visitgroup ).

        APPEND ls_r TO rt.
      CATCH cx_root.
        CLEAR rt.
    ENDTRY.

  ENDMETHOD.


  METHOD move_comp.
    " Safe dynamic component read: copy is_row-(iv_comp) into cv if present.
    FIELD-SYMBOLS <f> TYPE any.
    ASSIGN COMPONENT iv_comp OF STRUCTURE is_row TO <f>.
    IF sy-subrc = 0.
      TRY.
          cv = <f>.
        CATCH cx_root.
      ENDTRY.
    ENDIF.
  ENDMETHOD.


  METHOD conv_jpy.
    rv_out = iv_in.
    IF iv_in IS INITIAL.
      RETURN.
    ENDIF.
    TRY.
        DATA lv_ext TYPE bapicurr-bapicurr.
        CALL FUNCTION 'BAPI_CURRENCY_CONV_TO_EXTERNAL'
          EXPORTING
            currency        = 'JPY'
            amount_internal = iv_in
          IMPORTING
            amount_external = lv_ext.
        rv_out = lv_ext.
      CATCH cx_root.
        rv_out = iv_in.
    ENDTRY.
  ENDMETHOD.


  METHOD split_orig_qty.
    CLEAR: ev_money_type, ev_set_id, ev_money_code.
    DATA lv_int TYPE string.
    DATA lv_dec TYPE string.
    DATA(lv_split) = |{ iv_qty }|.
    CONDENSE lv_split NO-GAPS.
    " Keep only the integer part (before the decimal point).
    SPLIT lv_split AT '.' INTO lv_int lv_dec.
    " Strip a possible sign character so the digit slicing lines up.
    REPLACE ALL OCCURRENCES OF '-' IN lv_int WITH ``.
    " Left-pad with zeros to 9 digits (classic pads the integer part).
    DATA(lv_len) = strlen( lv_int ).
    IF lv_len < 9.
      DATA(lv_pad) = 9 - lv_len.
      DO lv_pad TIMES.
        lv_int = |0{ lv_int }|.
      ENDDO.
    ELSEIF lv_len > 9.
      " Guard against overflow: keep the least-significant 9 digits.
      DATA(lv_off) = lv_len - 9.
      lv_int = lv_int+lv_off.
    ENDIF.
    ev_money_code = lv_int+0(4).   " first 4 chars
    ev_set_id     = lv_int+4(3).   " next 3 chars after the money code
    ev_money_type = lv_int+7(2).   " last 2 chars
  ENDMETHOD.


  METHOD derive_processing_status.
    rv_status = 'G'.
    IF iv_errors > 0.
      rv_status = 'R'.
    ELSEIF iv_warnings > 0.
      rv_status = 'Y'.
    ENDIF.
  ENDMETHOD.


  METHOD to_local_time.
    " Convert a UTC created/changed stamp to Japan local time so the RAP
    " "Created On" matches the GUI to the day. Japan Standard Time is a fixed
    " UTC+9 with no daylight saving, so we add 9 hours deterministically via a
    " timestamp instead of relying on a timezone FM / TTZZ customizing (which
    " silently fell back to raw UTC, leaving the date one day short, e.g. a
    " 13.08 23:52 UTC stamp stayed 13.08 instead of rolling to 14.08 JST).
    ev_date = iv_date.
    ev_time = iv_time.
    IF iv_date IS INITIAL.
      RETURN.
    ENDIF.
    " Pure date/time arithmetic (+9h) - no FM, timezone customizing or timestamp
    " class, so it cannot silently fall back to the raw value the way the
    " previous FM/timestamp versions did (they left 13.08 23:52 UTC unchanged
    " instead of rolling to 14.08 JST).
    DATA lv_secs TYPE i.
    lv_secs = iv_time+0(2) * 3600 + iv_time+2(2) * 60 + iv_time+4(2) + 32400.
    DATA lv_date TYPE d.
    lv_date = iv_date.
    WHILE lv_secs >= 86400.
      lv_secs = lv_secs - 86400.
      lv_date = lv_date + 1.
    ENDWHILE.
    ev_date = lv_date.
    DATA: lv_h TYPE n LENGTH 2,
          lv_m TYPE n LENGTH 2,
          lv_s TYPE n LENGTH 2.
    lv_h = lv_secs DIV 3600.
    lv_m = ( lv_secs MOD 3600 ) DIV 60.
    lv_s = lv_secs MOD 60.
    ev_time = lv_h && lv_m && lv_s.
  ENDMETHOD.

ENDCLASS.
