*&---------------------------------------------------------------------*
*& Function Module  Z_VERCMP_GET_SOURCE
*&---------------------------------------------------------------------*
*& Remote-enabled helper for report ZVERSION_COMPARE.
*&
*& Reads the ACTIVE source of a program together with its last-changed
*& data. It must be created as a *Remote-Enabled Module* (SE37 ->
*& Attributes -> Processing Type -> "Remote-Enabled Module") and must
*& exist in EVERY system that the report addresses through an RFC
*& destination (i.e. in the local system AND in the remote target
*& system such as QJR). The report calls it with DESTINATION, so the
*& interface must be known locally and the module must execute remotely.
*&
*& Why a custom module: the standard source readers (e.g.
*& RPY_PROGRAM_READ) are NOT remote-enabled, so they cannot be called
*& with DESTINATION. A thin wrapper around READ REPORT solves this
*& cleanly and works for namespaced programs (e.g. /CCBJI/...).
*&---------------------------------------------------------------------*
*&  SE37 INTERFACE DEFINITION (enter these on the tabs, not as code):
*&
*&  Attributes : Processing Type = Remote-Enabled Module
*&
*&  Import:
*&    IV_PROGRAM    TYPE  PROGRAMM
*&
*&  Export:
*&    EV_FOUND      TYPE  FLAG
*&    EV_LINES      TYPE  I
*&    EV_CHG_DATE   TYPE  SYDATUM
*&    EV_CHG_USER   TYPE  SYUNAME
*&
*&  Tables:
*&    ET_SOURCE     STRUCTURE  ABAPTXT255
*&---------------------------------------------------------------------*
FUNCTION z_vercmp_get_source.
*"----------------------------------------------------------------------
*"*"Local Interface:
*"  IMPORTING
*"     VALUE(IV_PROGRAM) TYPE  PROGRAMM
*"  EXPORTING
*"     VALUE(EV_FOUND) TYPE  FLAG
*"     VALUE(EV_LINES) TYPE  I
*"     VALUE(EV_CHG_DATE) TYPE  SYDATUM
*"     VALUE(EV_CHG_USER) TYPE  SYUNAME
*"  TABLES
*"      ET_SOURCE STRUCTURE  ABAPTXT255
*"----------------------------------------------------------------------

  DATA: lt_source TYPE STANDARD TABLE OF abaptxt255.

  CLEAR: ev_found, ev_lines, ev_chg_date, ev_chg_user.
  REFRESH et_source.

* Read the active source of the program (works for namespaced names).
  READ REPORT iv_program INTO lt_source.
  IF sy-subrc <> 0.
    RETURN.                            " program not found -> EV_FOUND = space
  ENDIF.

  ev_found    = 'X'.
  et_source[] = lt_source.
  DESCRIBE TABLE et_source LINES ev_lines.

* Last-changed data of the active source (report source directory).
  SELECT SINGLE unam udat
    FROM reposrc
    INTO (ev_chg_user, ev_chg_date)
    WHERE progname = iv_program
      AND r3state  = 'A'.

ENDFUNCTION.
