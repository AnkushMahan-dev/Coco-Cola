*&---------------------------------------------------------------------*
*& Report ZSMARTFORM_NODE_REMEDIATION
*&  Adds ATC pseudo-comments to program-line (CODE) text in a Smart
*&  Form, via the public XML round-trip on CL_SSF_FB_SMART_FORM.
*&  Single object: enqueue -> load -> patch -> upload -> store(active).
*&  Transport is recorded by STORE's internal set_correction_request
*&  (standard CTS); a transportable request will be prompted/used.
*&---------------------------------------------------------------------*
REPORT zsmartform_node_remediation.

PARAMETERS: p_form TYPE tdsfname OBLIGATORY,
            p_test TYPE flag AS CHECKBOX DEFAULT 'X',   " patch + report, no save
            p_dump TYPE flag AS CHECKBOX.               " print XML for diagnosis

DATA: go_form  TYPE REF TO cl_ssf_fb_smart_form,
      gx_fb    TYPE REF TO cx_ssf_fb,
      gv_dirty TYPE abap_bool,
      gv_hits  TYPE i.

START-OF-SELECTION.

  DATA: lo_ixml TYPE REF TO if_ixml,
        lo_doc  TYPE REF TO if_ixml_document.

  lo_ixml = cl_ixml=>create( ).
  lo_doc  = lo_ixml->create_document( ).

  CREATE OBJECT go_form.

* --- Lock for modification (MODIFY = edit mode) ------------------------
* STORE later checks this object's ENQUEUED flag = c_mode_edit. The SAME
* object must lock, load, upload and store.
  TRY.
      go_form->enqueue(
*        suppress_language_check = 'X'
*        suppress_corr_check     = 'X'
*        korrnum  = 'Q4RK902351'
        mode                    = 'MODIFY'
        formname                = p_form ).
    CATCH cx_ssf_fb INTO gx_fb.
      MESSAGE gx_fb TYPE 'E'.
  ENDTRY.

* --- Load active version, serialize whole form to XML ------------------
  TRY.
      go_form->load( im_formname = p_form
                     im_active   = 'X' ).

      go_form->xml_download(
        EXPORTING parent   = lo_doc
        CHANGING  document = lo_doc ).
    CATCH cx_ssf_fb INTO gx_fb.
      MESSAGE gx_fb TYPE 'E'.
  ENDTRY.

* --- Patch matching code text nodes ------------------------------------
  PERFORM patch_text_nodes USING lo_doc.

  WRITE: / 'CODE lines patched:', gv_hits.

* --- Optional: dump the (patched) XML to screen for diagnosis ----------
  IF p_dump = 'X'.
    PERFORM dump_xml USING lo_ixml lo_doc.
  ENDIF.

* --- Test mode: stop here ----------------------------------------------
  IF p_test = 'X'.
    go_form->dequeue( formname = p_form ).
    WRITE: / 'Test mode - nothing saved.'.
    RETURN.
  ENDIF.

  IF gv_dirty = abap_false.
    go_form->dequeue( formname = p_form ).
    WRITE: / 'No CODE line required changes.'.
    RETURN.
  ENDIF.

* --- Get the patched form root element ---------------------------------
  DATA lo_upelem TYPE REF TO if_ixml_element.

  lo_upelem = lo_doc->get_root_element( ).

  IF lo_upelem IS INITIAL.
    go_form->dequeue( formname = p_form ).
    WRITE: / 'Could not locate the form root element - aborted before save.'.
    RETURN.
  ENDIF.

* --- Upload patched XML back into go_form, store ACTIVE ----------------
* sform MUST be go_form (the locked object). STORE -> set_correction_request
* records the change into a transportable request (CTS prompt may appear).
  TRY.
      go_form->xml_upload(
        EXPORTING dom      = lo_upelem
                  formname = p_form
                  language = sy-langu
        CHANGING  sform    = go_form ).

      go_form->header-lastuser = sy-uname.

      go_form->store( im_formname = p_form
                      im_language = sy-langu
                      im_active   = 'X' ).
      COMMIT WORK AND WAIT.
    CATCH cx_ssf_fb INTO gx_fb.
      go_form->dequeue( formname = p_form ).
      MESSAGE gx_fb TYPE 'E'.
  ENDTRY.

  go_form->dequeue( formname = p_form ).
  WRITE: / 'Form stored (active). Check the editor node, then re-run ATC.'.

*&---------------------------------------------------------------------*
*& Form patch_text_nodes  - iterate ALL text nodes, patch matching ones
*&---------------------------------------------------------------------*
FORM patch_text_nodes USING pio_doc TYPE REF TO if_ixml_document.

  DATA: lo_iter TYPE REF TO if_ixml_node_iterator,
        lo_node TYPE REF TO if_ixml_node,
        lv_text TYPE string.

  lo_iter = pio_doc->create_iterator( ).

  lo_node = lo_iter->get_next( ).
  WHILE lo_node IS NOT INITIAL.

    IF lo_node->get_type( ) = if_ixml_node=>co_node_text.
      lv_text = lo_node->get_value( ).

      IF lv_text IS NOT INITIAL.

*       ---- TEST PROBE (active) -------------------------------------
        IF lv_text CS 'clear gv_name.'.
          CONCATENATE lv_text 'Test Dynamic Code' INTO lv_text SEPARATED BY space.
          lo_node->set_value( lv_text ).
          gv_dirty = abap_true.
          gv_hits  = gv_hits + 1.
        ENDIF.

*       ---- REAL CONDITIONS (enable later) --------------------------
*        IF lv_text CS 'SELECT SINGLE' AND lv_text NS '#EC CI_NOORDER'.
*          CONCATENATE lv_text '"#EC CI_NOORDER' INTO lv_text SEPARATED BY space.
*          lo_node->set_value( lv_text ).
*          gv_dirty = abap_true.
*          gv_hits  = gv_hits + 1.
*        ENDIF.
*
*        IF lv_text CS 'CLIENT SPECIFIED' AND lv_text NS '#EC CI_USAGE_OK'.
*          CONCATENATE lv_text '"#EC CI_USAGE_OK' INTO lv_text SEPARATED BY space.
*          lo_node->set_value( lv_text ).
*          gv_dirty = abap_true.
*          gv_hits  = gv_hits + 1.
*        ENDIF.

      ENDIF.
    ENDIF.

    lo_node = lo_iter->get_next( ).
  ENDWHILE.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form dump_xml  - render the DOM (normalized) and WRITE it
*&---------------------------------------------------------------------*
FORM dump_xml USING pio_ixml TYPE REF TO if_ixml
                    pio_doc  TYPE REF TO if_ixml_document.

  DATA: lo_sf      TYPE REF TO if_ixml_stream_factory,
        lo_ostream TYPE REF TO if_ixml_ostream,
        lo_rend    TYPE REF TO if_ixml_renderer,
        lv_xml     TYPE xstring,
        lt_str     TYPE TABLE OF string,
        lv_line    TYPE string,
        lv_text    TYPE string,
        lo_conv    TYPE REF TO cl_abap_conv_in_ce.

  lo_sf      = pio_ixml->create_stream_factory( ).
  lo_ostream = lo_sf->create_ostream_xstring( string = lv_xml ).
  lo_rend    = pio_ixml->create_renderer( document = pio_doc
                                          ostream  = lo_ostream ).
  lo_rend->set_normalizing( is_normalizing = 'X' ).
  lo_rend->render( ).

  TRY.
      lo_conv = cl_abap_conv_in_ce=>create( input = lv_xml ).
      lo_conv->read( IMPORTING data = lv_text ).
    CATCH cx_root.
  ENDTRY.

  SPLIT lv_text AT cl_abap_char_utilities=>newline INTO TABLE lt_str.
  LOOP AT lt_str INTO lv_line.
    WRITE: / lv_line.
  ENDLOOP.

ENDFORM.
