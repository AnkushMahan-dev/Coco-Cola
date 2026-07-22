import type { Module } from "../types";

export const module5: Module = {
  slug: "sap-toolchain",
  title: "Claude in the SAP Toolchain",
  shortTitle: "SAP Tools",
  icon: "database",
  description:
    "Pair Claude with SAP GUI, Eclipse ADT and the community ABAP MCP server to bring AI assistance into every stage of your ABAP development workflow.",
  lessons: [
    // ------------------------------------------------------------------
    // Lesson 1: Claude alongside SAP GUI
    // ------------------------------------------------------------------
    {
      slug: "sap-gui",
      title: "Claude alongside SAP GUI",
      description:
        "Practical side-by-side workflows on Windows: copy ABAP from SE80/SE38 into Claude, paste ST22 dumps, screenshot SAP GUI screens, and analyze job logs and traces — all without any native AI integration.",
      duration: 25,
      level: "Beginner",
      keywords: [
        "SAP GUI",
        "SE80",
        "SE38",
        "ST22 dump analysis",
        "screenshots",
        "Snipping Tool",
        "SM37 job logs",
        "copy paste workflow",
      ],
      overview: [
        "SAP GUI is still where most ABAP developers spend a large part of their day: SE80 and SE38 for code, ST22 for dumps, SM37 for jobs, ST05 for traces, SE16 for table data. SAP GUI has no built-in AI integration and no plugin API for Claude — and that is fine. The most reliable workflow is refreshingly low-tech: copy text out of SAP GUI, paste it into Claude Desktop or claude.ai in your browser, and paste Claude's answers back. Add Windows screenshots for anything that does not copy cleanly (ALV grids, popup messages, graphical screens) and you have a complete AI-assisted workflow with zero installation on the SAP side.",
        "This lesson turns that copy/paste loop into a disciplined, fast routine on a Windows laptop. You will learn which SAP GUI content copies well as text (source code, dump long texts, job logs), which is better captured as a screenshot (selection screens, ALV layouts, error popups), and how to arrange SAP GUI and Claude side by side with Windows Snap layouts so the round trip takes seconds, not minutes.",
        "Because SE16 and ST22 can expose real business data — customer names, prices, employee IDs — the lesson also covers the data-privacy guardrails your company expects: anonymize before you paste, prefer structure over content, and never paste production personal data into any AI tool.",
      ],
      objectives: [
        "Copy ABAP source from SE80/SE38 into Claude and get useful explanations, reviews and refactoring suggestions.",
        "Paste ST22 short dumps into Claude and extract the root cause and a concrete fix.",
        "Capture SAP GUI screens with Win+Shift+S and paste screenshots into Claude for visual explanation.",
        "Analyze SM37 job logs and ST05 trace excerpts with Claude while respecting data-privacy rules.",
        "Set up an efficient side-by-side Windows layout so the SAP GUI ↔ Claude round trip is fast.",
      ],
      steps: [
        {
          title: "Arrange SAP GUI and Claude side by side with Snap layouts",
          body: [
            "Before anything else, fix your window layout. On Windows 11, hover over the maximize button (or press Win+Z) to open Snap layouts, and place SAP GUI on the left half and Claude Desktop (or claude.ai in Edge/Chrome) on the right half. On Windows 10, drag windows to screen edges or use Win+Left / Win+Right. If you have a second monitor, dedicate one to SAP GUI and one to Claude.",
            "This sounds trivial, but it is the difference between a two-second round trip and constant Alt+Tab fumbling. Developers who keep Claude permanently visible ask it 10x more questions — and get correspondingly more value. Pin Claude Desktop to the taskbar (right-click → Pin to taskbar) so it is always one click away.",
          ],
          callout: {
            type: "tip",
            title: "Keyboard shortcuts worth memorizing",
            body: "Win+Left/Win+Right to snap windows, Win+Shift+S for screenshots, Ctrl+Y in SAP GUI for block selection, Ctrl+A then Ctrl+C in the ABAP editor to grab a whole program. These five shortcuts cover 90% of the SAP GUI ↔ Claude workflow.",
          },
        },
        {
          title: "Copy ABAP source from SE80/SE38 into Claude",
          body: [
            "Open your program or class in SE80 or SE38, click into the editor, press Ctrl+A then Ctrl+C, and paste into Claude. For older non-Unicode editors or list outputs, use Ctrl+Y to enter block-selection mode, drag over the text, then Ctrl+C. Always tell Claude what the code is and what you want: 'explain', 'review for performance', 'modernize to 7.4+ syntax', or 'find the bug'.",
            "For large programs, paste the main routine plus the specific FORM/method you care about rather than 20,000 lines at once. Claude handles long inputs well, but a focused paste with a focused question gets a sharper answer. Include the relevant DDIC context (table/structure definitions from SE11) when the logic depends on it — Claude cannot see your system, so you are its eyes.",
          ],
          code: {
            language: "text",
            filename: "Prompt: reviewing SE38 code",
            code: `I'm pasting an ABAP report from SE38 (transaction runs on ECC 6.0 EHP8,
ABAP 7.50). Please:
1. Explain what it does in plain English (2-3 sentences).
2. Flag any SELECT statements inside loops.
3. Suggest a modernized version using ABAP 7.4+ syntax
   (inline declarations, FOR loops, VALUE #, string templates).

Relevant DDIC: ZTSD_ORDERS has fields VBELN, KUNNR, NETWR, ERDAT.

[paste code here]`,
          },
        },
        {
          title: "Paste ST22 short dumps for root-cause analysis",
          body: [
            "In ST22, double-click the dump, then use the long-text view. The most valuable sections are: category and runtime error name, 'Error analysis', 'Source Code Extract' (with the arrow marking the failing line), 'Active Calls/Events' (the call stack), and 'Chosen variables'. Select the text with the mouse (or use System → List → Save → Local File to export the whole dump as text), copy, and paste into Claude with a request for root cause and fix.",
            "Claude is remarkably good at ST22 analysis because dumps are structured and verbose: a CX_SY_ITAB_LINE_NOT_FOUND with the failing READ TABLE line and the variable contents is usually enough for a precise diagnosis. Before pasting, scan the 'Chosen variables' section for personal data (customer names, bank details) and blank it out.",
          ],
          code: {
            language: "text",
            filename: "Prompt: ST22 dump triage",
            code: `Analyze this ST22 short dump from our ECC dev system.
Give me:
1. Root cause in one sentence.
2. The exact code change to fix it (ABAP 7.50 syntax).
3. How to reproduce it safely in dev.
4. Whether a similar pattern elsewhere in the program could dump too.

--- DUMP (variables anonymized) ---
Category:            ABAP Programming Error
Runtime Error:       ITAB_LINE_NOT_FOUND
Exception:           CX_SY_ITAB_LINE_NOT_FOUND
Program:             ZSD_DELIVERY_UPDATE
...
Source Code Extract:
>>>>> READ TABLE lt_orders INTO ls_order WITH KEY vbeln = lv_vbeln.
      lv_kunnr = ls_order-kunnr.
...`,
          },
        },
        {
          title: "Screenshot SAP GUI screens with Win+Shift+S",
          body: [
            "Not everything copies as text: ALV grid layouts, selection screens, customizing trees in SPRO, error popups, graphical planning boards. Press Win+Shift+S (Snipping Tool), drag a rectangle over the SAP GUI area, and the capture lands on your clipboard — paste it straight into Claude with Ctrl+V. Claude reads the screenshot and can explain fields, error messages, and screen flow.",
            "Screenshots are ideal for 'what does this screen/field/message mean?' questions and for functional-technical handovers ('here is the VA01 screen, which user exit fires when this field changes?'). Crop tightly to the relevant area: less noise means better answers, and you avoid capturing unrelated data such as other customers' orders in the same list.",
          ],
          callout: {
            type: "warning",
            title: "Screenshots carry data too",
            body: "A screenshot of SE16 on KNA1 contains customer master data just as surely as a text paste does. Apply the same privacy rules to images: crop out or blur names, addresses, bank data and personnel numbers before pasting into Claude, and never screenshot production HR or payment screens.",
          },
        },
        {
          title: "Analyze SM37 job logs, ST05 traces and SE16 data — carefully",
          body: [
            "For failed background jobs, open SM37, select the job, view the job log, and export or copy it into Claude together with the program name — Claude will correlate the log messages with likely code paths. For performance work, run an ST05 SQL trace, use the summarized list ('Trace List → Summarize by SQL Statement'), and paste the top statements with their execution counts and durations; ask Claude which indexes or code changes would help. For SE16/SE16N data, paste only the handful of rows needed to illustrate the problem.",
            "Data privacy is the hard rule here: SE16 output is real business data. Prefer pasting field names and data patterns over actual values, anonymize keys (replace customer 1000234 with CUST_A), and follow your company's AI usage policy — many CPG and pharma customers prohibit any production personal data in external AI tools. When in doubt, reproduce the issue in the dev/QA client with test data and paste that instead.",
          ],
          code: {
            language: "text",
            filename: "Prompt: ST05 trace analysis",
            code: `Here is a summarized ST05 SQL trace from a nightly pricing job
(program ZSD_PRICE_RECALC, ECC 6.0, HANA DB). Explain which
statements dominate runtime and what code or index changes you
recommend. Note: identical SELECTs on KONV executed 48,000 times.

Statement                              Executions   Duration(ms)
SELECT ... FROM konv WHERE knumv = ?       48,213      412,900
SELECT ... FROM vbak WHERE vbeln = ?       48,213       88,150
SELECT ... FROM zprice_cfg (full scan)          1        3,410`,
          },
        },
        {
          title: "Generate test data and eCATT/SCAT ideas with Claude",
          body: [
            "Claude will happily design test data for you: give it the structure of your custom table or the selection screen of your report and ask for boundary-value test cases (empty, single row, 10k rows, special characters, fiscal-year boundaries). It can also draft eCATT test script outlines (SECATT) — the sequence of transactions, input parameters and check steps — which you then record and refine in the system. Legacy SCAT scripts can be pasted in for explanation before you migrate them to eCATT or ABAP Unit.",
            "A practical pattern: ask Claude to generate an ABAP snippet that fills your Z-table with realistic, clearly-fake test data (names like TESTCUST_001) so nobody ever confuses it with production data. Run it in the dev client via SE38.",
          ],
          code: {
            language: "abap",
            filename: "zsd_fill_test_orders.prog.abap",
            code: `REPORT zsd_fill_test_orders.

" Generated with Claude: 50 clearly-fake orders for ZTSD_ORDERS
" covering boundary values (zero, max NETWR, month-end dates).
DATA(lt_orders) = VALUE ztt_sd_orders(
  FOR i = 1 UNTIL i > 50
  ( vbeln = |TEST{ i ALIGN = RIGHT PAD = '0' WIDTH = 7 }|
    kunnr = |TESTCUST_{ i MOD 5 }|
    netwr = SWITCH #( i MOD 3
                      WHEN 0 THEN '0.00'
                      WHEN 1 THEN '999999.99'
                      ELSE '150.75' )
    erdat = sy-datum - ( i MOD 30 ) ) ).

DELETE FROM ztsd_orders WHERE vbeln LIKE 'TEST%'.
INSERT ztsd_orders FROM TABLE @lt_orders.
COMMIT WORK.
MESSAGE |{ lines( lt_orders ) } test orders created.| TYPE 'S'.`,
          },
        },
      ],
      screenshots: [
        {
          caption: "SAP GUI (SE38 editor) snapped left, Claude Desktop snapped right on Windows 11",
          description:
            "A Windows 11 desktop split in half: on the left the SE38 ABAP editor showing a Z-report with code selected, on the right Claude Desktop with the same code pasted into the chat box and a review prompt typed above it.",
        },
        {
          caption: "Pasting a Win+Shift+S screenshot of an ST22 dump into Claude",
          description:
            "The Snipping Tool capture overlay drawn over an ST22 short dump screen, with the resulting screenshot pasted into a Claude conversation and Claude's root-cause analysis beginning below it.",
        },
      ],
      video: {
        caption: "Full round trip: SE38 bug → ST22 dump → Claude analysis → fix",
        description:
          "Screen recording on a Windows laptop showing a report dumping, the developer opening ST22, copying the dump long text into Claude, receiving a root-cause explanation and corrected code, and pasting the fix back into SE38.",
        duration: "9:15",
      },
      sapExample: {
        title: "Beverage bottler: nightly delivery job dumps after go-live",
        scenario:
          "A CPG beverage bottler running ECC 6.0 EHP8 on-premise went live with a new delivery-consolidation report ZSD_DELIVERY_UPDATE. On the third night the background job canceled with ITAB_LINE_NOT_FOUND in ST22, blocking 1,200 deliveries. The on-call ABAP developer has SAP GUI and Claude Desktop on her Windows laptop and 30 minutes before the warehouse shift starts.",
        prompt: `This ST22 dump is from ZSD_DELIVERY_UPDATE (ECC 6.0, ABAP 7.50).
The job ran fine for two nights and dumped tonight. Variables are
anonymized. Explain the root cause, why it only failed tonight,
and give me a corrected code block plus a defensive pattern for
every similar READ TABLE in the program.

Runtime Error: ITAB_LINE_NOT_FOUND
Source Code Extract:
>>>>> READ TABLE lt_orders INTO ls_order WITH KEY vbeln = lv_vbeln.
      lv_kunnr = ls_order-kunnr.
Chosen variables: lv_vbeln = '0080001234', lines(lt_orders) = 1187`,
        code: {
          language: "abap",
          filename: "Fix suggested by Claude",
          code: `" Root cause: order 0080001234 was archived between selection and
" processing, so the READ found no line but sy-subrc was ignored
" and ls_order kept stale data until the next unguarded access.
" Defensive 7.4+ pattern for every lookup:
TRY.
    DATA(ls_order) = lt_orders[ vbeln = lv_vbeln ].
  CATCH cx_sy_itab_line_not_found.
    " Order vanished (archiving/deletion) - log and skip, don't dump
    MESSAGE i042(zsd) WITH lv_vbeln INTO DATA(lv_msg).
    zcl_sd_joblog=>add( lv_msg ).
    CONTINUE.
ENDTRY.`,
        },
        explanation: [
          "Claude identified from the dump alone that the failing READ TABLE ignored sy-subrc and that the timing pattern (worked twice, failed on night three) pointed at data changing between selection and processing — in this case the weekly archiving run removing an order mid-job. That contextual reasoning ('why only tonight?') is exactly what a rushed on-call developer tends to skip.",
          "The suggested fix uses the modern table-expression syntax with CX_SY_ITAB_LINE_NOT_FOUND handling, turning a hard dump into a logged skip. The developer pasted the corrected block into SE38 via the emergency correction process, restarted the job from SM37, and the remaining 1,186 deliveries processed. The whole loop — copy dump, get analysis, apply fix — took under 15 minutes, all through copy/paste with zero SAP-side installation.",
        ],
      },
      bestPractices: [
        "Keep Claude permanently visible next to SAP GUI (Snap layouts or a second monitor) so asking a question costs seconds, not a context switch.",
        "Always state the system context in your prompt: release (ECC 6.0 / S/4HANA), ABAP version, database, and what transaction the artifact came from.",
        "Paste dumps and logs as text when possible — text is searchable and precise; use screenshots only for visual layouts and popups.",
        "Anonymize before you paste: replace customer numbers, names, bank data and personnel numbers with placeholders, in both text and screenshots.",
        "Ask for structured output ('give me root cause, fix, and prevention') so answers are actionable, not essays.",
        "Verify every generated fix in the dev system with your own eyes — Claude cannot run your code or see your customizing.",
        "Prefer dev/QA data with clearly-fake test records (TESTCUST_001) over production extracts for any example you share with Claude.",
      ],
      commonMistakes: [
        {
          mistake: "Pasting a 15,000-line include and asking 'find the bug' with no context.",
          fix: "Narrow it down first: paste the failing FORM/method, the dump's source extract, and the relevant DDIC definitions, and describe the symptom precisely.",
        },
        {
          mistake: "Copying SE16 output with real customer and pricing data into Claude.",
          fix: "Anonymize keys and values first, paste only the rows needed to show the pattern, or reproduce with test data in the dev client. Follow your company's AI data policy.",
        },
        {
          mistake: "Trusting Claude's fix and transporting it without testing because 'it looked right'.",
          fix: "Treat Claude's output like a colleague's code review suggestion: syntax-check in SE38 (Ctrl+F2), run it in dev, add a test, then transport.",
        },
        {
          mistake: "Screenshotting an entire 1920px SAP GUI window when the question is about one field.",
          fix: "Crop with Win+Shift+S to just the relevant screen area — tighter screenshots give better answers and leak less unrelated data.",
        },
        {
          mistake: "Asking about SAP standard behavior without naming the transaction or release.",
          fix: "Include transaction code, release and EhP level; standard behavior differs significantly between ECC and S/4HANA.",
        },
      ],
      tips: [
        "System → List → Save → Local File exports almost any SAP GUI list (SM37 logs, ST22 dumps, SE16 output) as a text file you can drag into Claude.",
        "Use Ctrl+Y in old-style SAP GUI screens to block-select text that normal selection cannot grab.",
        "Create a Claude Project (or a saved prompt) with your system landscape description so you never retype 'ECC 6.0 EHP8, ABAP 7.50, HANA' again.",
        "For recurring dump types, ask Claude to write you a one-page 'triage cheat sheet' per runtime error and save it in your team wiki.",
        "Windows clipboard history (Win+V) lets you keep several SAP GUI copies queued while you compose one combined prompt.",
      ],
      exercise: {
        title: "Triage a dump end-to-end with Claude",
        scenario:
          "Your team's dev system has a report that dumps with CONVT_NO_NUMBER whenever a user enters a European-formatted amount ('1.234,56') on the selection screen. You have SAP GUI and Claude side by side on your Windows laptop.",
        tasks: [
          "Reproduce the dump in the dev client and open it in ST22.",
          "Copy the dump's 'Error analysis' and 'Source Code Extract' sections into Claude and ask for root cause plus fix.",
          "Screenshot the selection screen with Win+Shift+S and ask Claude how to make the input field format-tolerant.",
          "Ask Claude to generate a defensive conversion routine in ABAP 7.4+ syntax and syntax-check it in SE38.",
          "Write a three-line summary of the root cause for your ticket, drafted by Claude and edited by you.",
        ],
        hint: "The dump's 'Chosen variables' section shows the exact offending string. Give Claude that string plus the failing MOVE/COMPUTE line — that is all it needs. For the fix, ask about CL_ABAP_DECFLOAT or replacing the separators before conversion.",
        solution: {
          language: "abap",
          filename: "Defensive amount conversion",
          code: `" Tolerant conversion of user-entered amounts ('1.234,56' or '1,234.56')
DATA(lv_raw) = p_amount_input.        " e.g. '1.234,56'
CONDENSE lv_raw NO-GAPS.

" Normalize: strip thousands separators, unify decimal comma to point
IF lv_raw CA ','.
  REPLACE ALL OCCURRENCES OF '.' IN lv_raw WITH ''.
  REPLACE ',' IN lv_raw WITH '.'.
ENDIF.

TRY.
    DATA(lv_amount) = CONV netwr( lv_raw ).
  CATCH cx_sy_conversion_no_number.
    MESSAGE e045(zsd) WITH p_amount_input. " 'Amount &1 is not numeric'
ENDTRY.`,
        },
      },
      quiz: [
        {
          question: "What is the recommended way to get an ST22 dump into Claude?",
          options: [
            "Screenshot every page of the dump, since dumps cannot be copied",
            "Copy the key sections (error analysis, source extract, variables) as text, anonymizing sensitive values",
            "Export the entire system log from SM21 and paste all of it",
            "Retype the runtime error name only — Claude needs nothing else",
          ],
          correctIndex: 1,
          explanation:
            "Dumps copy well as text and text gives Claude precise, searchable input. The error analysis, source code extract and chosen variables are the highest-value sections — and variables must be checked for personal data before pasting.",
        },
        {
          question: "Which Windows shortcut captures a region of the SAP GUI screen to the clipboard for pasting into Claude?",
          options: ["Win+Shift+S", "Ctrl+Alt+Del", "Win+L", "Alt+F4"],
          correctIndex: 0,
          explanation:
            "Win+Shift+S opens the Snipping Tool overlay; the selected region lands on the clipboard and can be pasted directly into a Claude conversation with Ctrl+V.",
        },
        {
          question: "You want Claude's help with slow SQL found via ST05. What should you paste?",
          options: [
            "Nothing — Claude can connect to ST05 directly from the browser",
            "The complete raw trace file including every single statement",
            "The summarized trace list (top statements with execution counts and durations) plus the program name and DB platform",
            "Only the program name, because traces are always confidential",
          ],
          correctIndex: 2,
          explanation:
            "The summarized ST05 list gives Claude exactly the signal it needs (which statements dominate and how often they run) without megabytes of noise. SAP GUI has no AI integration, so everything moves via copy/paste.",
        },
        {
          question: "Why must screenshots be treated with the same data-privacy care as text pastes?",
          options: [
            "Because screenshots are lower quality than text",
            "Because Claude cannot read images at all",
            "Because images use more clipboard memory",
            "Because a screenshot of SE16 or a sales order contains the same real business data as copied text",
          ],
          correctIndex: 3,
          explanation:
            "Claude reads images well — which means an SE16 screenshot exposes customer data exactly like a text paste. Crop tightly and blur or exclude personal data before pasting.",
        },
      ],
      summary: [
        "SAP GUI has no AI integration, so the workflow is disciplined copy/paste plus Win+Shift+S screenshots — fast once your windows are snapped side by side.",
        "ST22 dumps, SM37 job logs and summarized ST05 traces are high-signal text inputs that Claude analyzes extremely well when you add system context.",
        "Data privacy is non-negotiable: anonymize values in text and screenshots, prefer dev-client test data, and follow your company's AI policy.",
        "Always verify Claude's suggestions in the dev system before transporting — Claude advises, you remain the developer of record.",
      ],
      download: {
        name: "SAP GUI + Claude workflow cheat sheet",
        description:
          "One-page reference of shortcuts, copy/paste techniques per transaction, and the privacy checklist for pasting SAP data into Claude.",
        filename: "sap-gui-claude-cheatsheet.md",
        content: `# SAP GUI + Claude: Windows Workflow Cheat Sheet

## Window setup
- Win+Z (Win 11) or Win+Left / Win+Right: snap SAP GUI left, Claude right
- Pin Claude Desktop to taskbar; use a second monitor if available
- Win+V: clipboard history for multi-paste prompts

## Getting content out of SAP GUI
| Source | Technique |
| --- | --- |
| SE80/SE38 code | Click editor, Ctrl+A, Ctrl+C |
| ST22 dump | Copy long-text sections, or System > List > Save > Local File |
| SM37 job log | Job log display > System > List > Save > Local File |
| ST05 trace | Trace List > Summarize by SQL Statement, then copy |
| SE16/SE16N rows | Copy only needed rows; anonymize first |
| Any visual screen | Win+Shift+S region capture, Ctrl+V into Claude |
| Old list screens | Ctrl+Y block selection, then Ctrl+C |

## Prompt skeleton
1. Context: release (ECC/S4), ABAP version, DB, transaction
2. Artifact: pasted code / dump / log / screenshot
3. Ask: root cause? fix? modernize? test cases?
4. Output shape: "give me 1) cause 2) fix 3) prevention"

## Privacy checklist (before EVERY paste)
- [ ] No customer/vendor names, addresses, bank data
- [ ] No personnel numbers or HR data
- [ ] Keys anonymized (CUST_A instead of 1000234)
- [ ] Screenshot cropped to relevant area only
- [ ] Production personal data: NEVER
- [ ] Company AI usage policy respected

## Golden rules
- Text > screenshot when both are possible
- One focused question per paste beats "find the bug" on 15k lines
- Verify every fix in dev (Ctrl+F2 syntax check, then execute)
`,
      },
      relatedSlugs: ["claude-desktop", "prompt-engineering", "eclipse-adt", "security-guidelines"],
    },

    // ------------------------------------------------------------------
    // Lesson 2: Eclipse ADT + Claude Workflows
    // ------------------------------------------------------------------
    {
      slug: "eclipse-adt",
      title: "Eclipse ADT + Claude Workflows",
      description:
        "Use ABAP Development Tools in Eclipse as your modern ABAP IDE and pair it with Claude for class design, CDS views, error explanation, ABAP Unit and abapGit-based Claude Code sessions.",
      duration: 30,
      level: "Intermediate",
      keywords: [
        "Eclipse ADT",
        "ABAP Development Tools",
        "CDS views",
        "ABAP Unit",
        "abapGit",
        "pretty printer",
        "AMDP",
        "Claude Code",
      ],
      overview: [
        "ABAP Development Tools (ADT) in Eclipse is SAP's strategic ABAP IDE: classes, CDS views, AMDP, RAP business objects and behavior definitions can only be edited properly there, and everyday features like multi-tab editing, real Ctrl+C/Ctrl+V that always works, quick fixes, where-used with preview and ABAP Unit integration make it dramatically better AI-pairing territory than SE80. Because ADT is a normal Windows desktop application with normal text editing, moving code between ADT and Claude is frictionless.",
        "This lesson covers the practical ADT + Claude loop: copy a class or CDS view out of ADT, have Claude explain, review or extend it, and paste results back into ADT where the syntax check, ATC and ABAP Unit act as your safety net. You will also learn to feed ADT's error markers and stack traces to Claude, use the 'Source Code' tab trick for CDS and AMDP artifacts, keep generated code clean with the pretty printer, and — the power move — use abapGit inside ADT to export whole packages to Git so Claude Code can work on your ABAP offline as ordinary files.",
        "Everything runs on your Windows laptop: Eclipse with the ADT plugin, Claude Desktop or claude.ai beside it, and optionally Claude Code in a terminal on an abapGit-exported repository.",
      ],
      objectives: [
        "Set up an efficient ADT + Claude editing loop for classes, interfaces and CDS views on Windows.",
        "Use Claude to explain ADT error markers, activation errors and syntax-check messages.",
        "Generate ABAP Unit test classes with Claude and run them in ADT (Ctrl+Shift+F10).",
        "Work with CDS/AMDP source through ADT's source-code views together with Claude.",
        "Export packages with abapGit so Claude Code can operate on your ABAP as files in a Git repository.",
      ],
      steps: [
        {
          title: "Why ADT is the right IDE for AI-assisted ABAP",
          body: [
            "If you are still doing everything in SE80, install ADT first (Eclipse IDE + the ABAP Development Tools plugin from tools.hana.ondemand.com — your BASIS team typically provides the sanctioned bundle). ADT gives you a real editor: unlimited undo, multi-cursor, reliable clipboard, dark mode, and side-by-side editors inside Eclipse itself. Modern artifacts — CDS views, behavior definitions, service bindings, AMDP — have no full-featured SE80 editor at all.",
            "For AI pairing specifically, ADT wins because everything is text. A class in ADT is one scrollable text document (Global Class tab), not a tree of includes; copying it to Claude and pasting a rewritten version back is a 10-second operation. Snap Eclipse to the left of your screen and Claude to the right, exactly like the SAP GUI lesson.",
          ],
        },
        {
          title: "Round-trip a class: copy to Claude, paste back, activate",
          body: [
            "Open the class in ADT, click into the Global Class source, Ctrl+A / Ctrl+C, and paste into Claude with a concrete instruction — 'add a method that returns open deliveries per customer, 7.4+ syntax, keep the existing style'. Paste Claude's version back, press Ctrl+F2 for the syntax check and Ctrl+F3 to activate. ADT's checks are your contract: nothing Claude writes reaches the system unverified.",
            "For surgical changes, copy only the relevant method plus the class definition section so Claude knows the available attributes and types. Ask Claude to return only the changed method — full-class rewrites invite accidental regressions and make the diff hard to review in the ADT compare editor (right-click → Compare With → Revision History).",
          ],
          code: {
            language: "abap",
            filename: "zcl_delivery_service (method added by Claude)",
            code: `METHOD get_open_deliveries.
  " Added via Claude round-trip; activated with Ctrl+F3 in ADT.
  SELECT FROM likp
    FIELDS vbeln, kunnr, wadat_ist, lfart
    WHERE kunnr = @iv_kunnr
      AND wadat_ist IS INITIAL
    ORDER BY vbeln
    INTO TABLE @rt_deliveries
    UP TO @iv_max_rows ROWS.

  IF sy-subrc <> 0.
    RAISE EXCEPTION NEW zcx_delivery_not_found( iv_kunnr = iv_kunnr ).
  ENDIF.
ENDMETHOD.`,
          },
        },
        {
          title: "Let Claude explain ADT errors and activation failures",
          body: [
            "ADT surfaces errors as markers in the Problems view and as activation dialogs that are often terse ('Type ZIF_X is unknown', 'The behavior definition is inconsistent'). Select the error text in the Problems view (Ctrl+C works there), paste it into Claude together with the surrounding code, and ask what it means and how to fix it. For runtime issues, the ABAP stack trace from the ADT debugger or the feed reader (dumps appear in the ADT Feed Reader view) pastes just as well.",
            "This is especially valuable for RAP and CDS error messages, which assume framework knowledge many ECC-era developers have not built yet. Claude can translate 'SADL runtime error' or an annotation complaint into plain language and point at the exact annotation or behavior-definition line to change.",
          ],
          callout: {
            type: "info",
            title: "Give Claude the error AND the source",
            body: "An ADT error message alone is often ambiguous. Paste the message plus the 20 lines around the marker (or the whole CDS view — they are short). The combination lets Claude point at the exact token to change instead of guessing.",
          },
        },
        {
          title: "CDS views and AMDP through the Source Code view",
          body: [
            "CDS views, metadata extensions and AMDP methods are plain text in ADT — for dictionary artifacts opened from other tools, the 'Source Code' tab/section in the editor shows the DDL. Copy the whole DDL source into Claude to get explanations of joins, associations and annotations, or ask it to draft a new view: 'create a CDS view entity joining VBAK/VBAP with an association to the customer, expose it for OData'. Paste the draft into a new Data Definition (File → New → ABAP DDL Source) and let the ADT syntax check guide the cleanup.",
            "For AMDP, paste the SQLScript body plus the method signature and ask Claude for optimization or for a pure-CDS alternative — a common S/4HANA-program question. Claude knows SQLScript well, but your ADT activation and the SQL console (right-click a view → Open With → Data Preview) remain the ground truth.",
          ],
          code: {
            language: "abap",
            filename: "zi_openorders.ddls.asddls",
            code: `@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Open Orders per Customer'
define view entity ZI_OpenOrders
  as select from vbak
    inner join   vbap on vbap.vbeln = vbak.vbeln
  association [0..1] to I_Customer as _Customer
    on $projection.SoldToParty = _Customer.Customer
{
  key vbak.vbeln           as SalesOrder,
  key vbap.posnr           as SalesOrderItem,
      vbak.kunnr           as SoldToParty,
      vbap.matnr           as Material,
      @Semantics.amount.currencyCode: 'TransactionCurrency'
      vbap.netwr           as NetAmount,
      vbak.waerk           as TransactionCurrency,
      _Customer
}
where vbak.gbstk <> 'C'   // overall status not completed`,
          },
        },
        {
          title: "Generate and run ABAP Unit tests",
          body: [
            "Paste a class into Claude and ask for an ABAP Unit test class: risk level, isolation of dependencies (constructor injection or test doubles via IF_OSQL_TEST_ENVIRONMENT/CDS test double framework where available), and given/when/then naming. Paste the result into the Test Classes tab of your class in ADT and run with Ctrl+Shift+F10. Failures show up in the ABAP Unit view; copy any failure message back to Claude to iterate.",
            "A good habit for legacy code: before letting Claude refactor anything, have it write characterization tests that pin down current behavior, run them green in ADT, then refactor. The tests catch what the refactoring breaks.",
          ],
          code: {
            language: "abap",
            filename: "Test class generated by Claude",
            code: `CLASS ltc_delivery_service DEFINITION FINAL FOR TESTING
  DURATION SHORT RISK LEVEL HARMLESS.
  PRIVATE SECTION.
    DATA:
      mo_cut      TYPE REF TO zcl_delivery_service,
      mo_sql_env  TYPE REF TO if_osql_test_environment.
    CLASS-METHODS class_setup.
    CLASS-METHODS class_teardown.
    METHODS setup.
    METHODS open_deliveries_found   FOR TESTING.
    METHODS no_deliveries_raises    FOR TESTING.
ENDCLASS.

CLASS ltc_delivery_service IMPLEMENTATION.
  METHOD class_setup.
    mo_sql_env = cl_osql_test_environment=>create(
                   i_dependency_list = VALUE #( ( 'LIKP' ) ) ).
  ENDMETHOD.
  METHOD class_teardown.
    mo_sql_env->destroy( ).
  ENDMETHOD.
  METHOD setup.
    mo_cut = NEW #( ).
    mo_sql_env->clear_doubles( ).
  ENDMETHOD.
  METHOD open_deliveries_found.
    mo_sql_env->insert_test_data( VALUE ztt_likp(
      ( vbeln = '0080000001' kunnr = 'TESTCUST_1' ) ) ).
    DATA(lt_result) = mo_cut->get_open_deliveries(
                        iv_kunnr = 'TESTCUST_1' iv_max_rows = 10 ).
    cl_abap_unit_assert=>assert_equals( act = lines( lt_result )
                                        exp = 1 ).
  ENDMETHOD.
  METHOD no_deliveries_raises.
    TRY.
        mo_cut->get_open_deliveries( iv_kunnr = 'NOBODY'
                                     iv_max_rows = 10 ).
        cl_abap_unit_assert=>fail( 'Expected zcx_delivery_not_found' ).
      CATCH zcx_delivery_not_found.
        " expected
    ENDTRY.
  ENDMETHOD.
ENDCLASS.`,
          },
        },
        {
          title: "abapGit in ADT: export packages for Claude Code sessions",
          body: [
            "The abapGit repositories view in ADT (or the standalone ZABAPGIT program) lets you link an ABAP package to a Git repository and push its objects as files — each class, CDS view and interface becomes a .abap/.asddls file on disk. Clone that repository to your Windows laptop (git clone in PowerShell) and you can run Claude Code on it: multi-file refactoring analysis, documentation generation, naming-convention sweeps, dependency mapping — things that are painful one object at a time in a chat window.",
            "The flow is one-directional for safety at most customers: export dev package → Claude Code analyzes/proposes on the files → you apply accepted changes manually in ADT (or pull via abapGit where your governance allows online repos). Never let generated changes bypass the transport system.",
          ],
          code: {
            language: "powershell",
            filename: "PowerShell: clone and start a Claude Code session",
            code: `# One-time: clone the abapGit-exported package repo
cd C:\\dev\\repos
git clone https://git.example.com/sap/zsd-delivery.git
cd .\\zsd-delivery

# Inspect what abapGit exported (classes, CDS, interfaces as files)
Get-ChildItem -Recurse -Include *.abap,*.asddls | Select-Object Name

# Start Claude Code in the repo
claude
# Then, inside Claude Code:
#   "Map the dependencies between all classes in src/ and list
#    every SELECT on LIKP. Propose a refactoring plan - do not
#    change files yet."`,
          },
          callout: {
            type: "tip",
            title: "abapGit is open source",
            body: "abapGit is a community open-source project (abapgit.org), not an SAP product — but it is the de-facto standard for ABAP-to-Git and runs fine on ECC 7.02+ and all S/4HANA releases. Many customers install the ADT abapGit plugin ('abapGit repositories' view) for the smoothest experience.",
          },
        },
      ],
      screenshots: [
        {
          caption: "Eclipse ADT with a global class open, Claude Desktop beside it showing a generated test class",
          description:
            "Eclipse ADT on the left with ZCL_DELIVERY_SERVICE in the Global Class tab and the ABAP Unit view at the bottom showing green tests; Claude Desktop on the right displaying the generated local test class ready to copy.",
        },
        {
          caption: "abapGit repositories view in ADT linked to a Git repo with exported package files",
          description:
            "The abapGit repositories view inside Eclipse listing a linked repository for package ZSD_DELIVERY, and a Windows Explorer window showing the exported .clas.abap and .ddls.asddls files in the cloned folder.",
        },
      ],
      video: {
        caption: "ADT + Claude: from failing activation to green ABAP Unit run",
        description:
          "Screen recording: a CDS view fails activation in ADT, the developer pastes the error and DDL into Claude, applies the corrected annotation, activates, then has Claude generate a test class and runs it green with Ctrl+Shift+F10.",
        duration: "11:40",
      },
      sapExample: {
        title: "S/4HANA program: replacing an SE38 pricing report with a CDS-based service",
        scenario:
          "A global beverage company mid-way through an ECC-to-S/4HANA 2023 conversion must replace a 4,000-line SE38 pricing report with a CDS-based design. The two developers assigned know classic ABAP well but are new to CDS view entities and ABAP Unit. They work in ADT on Windows laptops with Claude Desktop, and the package is mirrored to Git via abapGit for Claude Code analysis.",
        prompt: `We are converting a classic pricing report to CDS on S/4HANA 2023.
Attached is the report's main selection + aggregation logic (pasted
from ADT). Draft:
1. A CDS view entity for the base join (VBAK/VBAP/KONV successor
   PRCD_ELEMENTS) with association to I_Customer.
2. A consumption view with @Analytics annotations for aggregation.
3. A short list of logic that CANNOT move to CDS and must stay in
   an ABAP class (with reasons).
Use view entity syntax, not the obsolete DDIC-based 'define view'.`,
        explanation: [
          "Claude produced a layered CDS draft (basic interface view, composite, consumption) and — importantly — a candid list of report logic that does not belong in CDS: the call to the pricing user-exit, a loop with cross-row state, and an RFC lookup. That triage between declarative CDS and residual ABAP class logic is exactly where teams new to S/4HANA waste weeks.",
          "The developers pasted each DDL draft into new Data Definitions in ADT, let activation errors drive corrections (with Claude explaining each message), and had Claude generate ABAP Unit tests using the CDS test double framework for the residual class. The abapGit mirror then let Claude Code produce a cross-object summary document for the architecture board — generated from the exported files, reviewed by humans, and stored alongside the code.",
        ],
      },
      bestPractices: [
        "Do modern-artifact work (CDS, RAP, AMDP, classes) in ADT, not SE80 — and pair every ADT session with Claude in a snapped window.",
        "Ask Claude for the smallest useful unit (one method, one view) and review diffs in ADT's compare editor before activating.",
        "Always run Ctrl+F2 (syntax check), activation and ATC on pasted code; treat ADT's checks as the gate Claude's output must pass.",
        "Have Claude write characterization tests before it refactors legacy code, and run them in ADT before and after the change.",
        "Run the pretty printer (Shift+F1) on everything you paste in, so generated code matches team formatting settings.",
        "Use abapGit to export packages when the task spans many objects — Claude Code on files beats 30 sequential chat pastes.",
        "Keep transports authoritative: Claude Code proposes on the Git mirror; changes enter the system only through ADT and the transport system.",
      ],
      commonMistakes: [
        {
          mistake: "Pasting Claude's full-class rewrite over a working class and activating without a diff.",
          fix: "Request only the changed methods, and use ADT's Compare With → Revision History (or local history) to review exactly what changed before activating.",
        },
        {
          mistake: "Asking Claude for CDS help without saying which release you are on.",
          fix: "State the release (e.g. S/4HANA 2023, on-prem 7.58) — 'define view entity' syntax, available annotations and released APIs differ per release.",
        },
        {
          mistake: "Treating generated ABAP Unit tests as proof of correctness without reading them.",
          fix: "Review assertions line by line; generated tests can be tautological. A test that never fails is worse than no test.",
        },
        {
          mistake: "Editing abapGit-exported files with Claude Code and pushing them straight back into the system.",
          fix: "Keep the flow proposal-only unless governance explicitly allows abapGit pulls into dev; apply accepted changes in ADT so checks, ATC and transports all engage.",
        },
        {
          mistake: "Copying only the error message from the Problems view and expecting a precise fix.",
          fix: "Paste the message together with the surrounding source (or full DDL) so Claude can identify the exact token or annotation at fault.",
        },
      ],
      tips: [
        "Ctrl+1 in ADT opens quick fixes — try ADT's own suggestion first, then ask Claude when the quick fix does not exist or you do not understand it.",
        "ADT's 'Source Code' section on DDIC objects gives you paste-ready text for tables and structures — perfect context to include with code questions.",
        "Ctrl+Shift+F10 runs ABAP Unit for the focused class; copy red-test output straight into Claude to iterate on fixes.",
        "Element Info (F2) text for released APIs pastes nicely into Claude when you want usage examples for an unfamiliar class.",
        "In Claude Code sessions on abapGit exports, ask for a plan first ('analyze, do not modify') — then approve file edits selectively.",
      ],
      exercise: {
        title: "From legacy method to tested modern code, entirely in ADT",
        scenario:
          "Package ZSD_LEGACY contains ZCL_ORDER_READER with a 120-line method GET_ORDERS that uses SELECT * in a loop, header lines and no error handling. Your task is to modernize it with Claude's help without changing its external behavior.",
        tasks: [
          "Copy the class from ADT into Claude and ask for a plain-English behavior summary; verify it against your own reading.",
          "Have Claude generate characterization tests (ABAP Unit with an OSQL test environment) and run them green in ADT.",
          "Ask Claude to refactor GET_ORDERS to 7.4+ syntax with a single SELECT and proper exception class; paste back and activate.",
          "Re-run the tests; paste any red results into Claude and iterate until green.",
          "Run the pretty printer and ATC checks on the final class.",
        ],
        hint: "Do the tests BEFORE the refactoring. If the test environment class IF_OSQL_TEST_ENVIRONMENT is unavailable on your release, ask Claude for a constructor-injection seam instead (extract the SELECT into a private method you can override in a test subclass).",
        solution: {
          language: "abap",
          filename: "Refactored GET_ORDERS (behavior-preserving)",
          code: `METHOD get_orders.
  " Before: SELECT * inside LOOP over lt_customers, header lines.
  " After: one range-based SELECT, typed result, real exception.
  IF it_customers IS INITIAL.
    RAISE EXCEPTION NEW zcx_order_input_empty( ).
  ENDIF.

  DATA(lt_kunnr_range) = VALUE zrt_kunnr(
    FOR ls_cust IN it_customers
    ( sign = 'I' option = 'EQ' low = ls_cust-kunnr ) ).

  SELECT FROM vbak
    FIELDS vbeln, kunnr, erdat, netwr, waerk
    WHERE kunnr IN @lt_kunnr_range
      AND erdat >= @iv_date_from
    ORDER BY kunnr, vbeln
    INTO CORRESPONDING FIELDS OF TABLE @rt_orders.

  IF rt_orders IS INITIAL.
    RAISE EXCEPTION NEW zcx_order_not_found(
      iv_date_from = iv_date_from ).
  ENDIF.
ENDMETHOD.`,
        },
      },
      quiz: [
        {
          question: "Why is ADT better suited than SE80 for pairing with Claude?",
          options: [
            "ADT has a built-in Claude plugin from SAP",
            "ADT shows classes and CDS artifacts as plain scrollable text with reliable clipboard, making round trips fast; modern artifacts require it anyway",
            "SE80 cannot display classes at all",
            "ADT automatically sends your code to Claude on save",
          ],
          correctIndex: 1,
          explanation:
            "There is no official SAP-Claude plugin in either tool. ADT wins because everything is real text in a real editor — and CDS views, RAP artifacts and AMDP have no complete SE80 editor.",
        },
        {
          question: "Claude generated an ABAP Unit test class. What is the correct next step?",
          options: [
            "Transport it immediately — generated tests are always safe",
            "Run it in production first to be realistic",
            "Paste it into the Test Classes tab, review the assertions, and run it with Ctrl+Shift+F10 in ADT",
            "Delete the existing code it tests to avoid conflicts",
          ],
          correctIndex: 2,
          explanation:
            "Generated tests go into the class's Test Classes tab and are executed with Ctrl+Shift+F10. Review the assertions first — tautological tests give false confidence.",
        },
        {
          question: "What role does abapGit play in the Claude Code workflow?",
          options: [
            "It is an SAP-delivered transport replacement",
            "It exports ABAP package objects as files to a Git repository so Claude Code can analyze and propose changes across many objects at once",
            "It lets Claude log on to SAP GUI",
            "It compiles ABAP locally on the Windows laptop",
          ],
          correctIndex: 1,
          explanation:
            "abapGit (a community open-source project) serializes ABAP objects to files. Cloned locally, the repository becomes ordinary text files that Claude Code can search, analyze and refactor — with humans applying accepted changes back through ADT and transports.",
        },
      ],
      summary: [
        "ADT is the modern ABAP IDE and the natural Claude pairing surface: real text editing makes class and CDS round trips take seconds.",
        "ADT's syntax check, activation, ATC and ABAP Unit are the quality gate every piece of Claude-generated code must pass.",
        "Paste errors together with surrounding source; for CDS/AMDP use the DDL/source views as copy-ready context.",
        "abapGit exports turn packages into files, unlocking Claude Code for multi-object analysis while transports stay authoritative.",
      ],
      download: {
        name: "ADT + Claude workflow checklist",
        description:
          "Checklist covering the round-trip loop, test-first refactoring, CDS drafting and the abapGit export flow for Claude Code.",
        filename: "adt-claude-workflow-checklist.md",
        content: `# Eclipse ADT + Claude: Workflow Checklist

## Setup (once)
- [ ] Eclipse + ABAP Development Tools installed (BASIS-sanctioned bundle)
- [ ] ADT project connected to dev system
- [ ] Claude Desktop / claude.ai snapped beside Eclipse
- [ ] Pretty printer settings aligned with team conventions
- [ ] (Optional) abapGit repositories view installed in ADT

## Class round trip
- [ ] Copy Global Class source (Ctrl+A, Ctrl+C)
- [ ] Prompt includes: release, task, "return only changed methods"
- [ ] Paste back, Ctrl+F2 syntax check, review diff (Compare With)
- [ ] Pretty printer (Shift+F1), activate (Ctrl+F3), run ATC

## Error explanation
- [ ] Copy error from Problems view PLUS surrounding source
- [ ] For CDS: paste whole DDL (they are short)
- [ ] Apply fix manually; never paste blind

## Test-first refactoring
- [ ] Claude writes characterization tests FIRST
- [ ] Tests green in ADT (Ctrl+Shift+F10) before refactor
- [ ] Refactor, re-run, iterate on red output with Claude
- [ ] Review assertions - no tautological tests

## abapGit -> Claude Code
- [ ] Package linked to Git repo, objects pushed
- [ ] git clone to C:\\dev\\repos\\<repo> (PowerShell)
- [ ] Claude Code: analyze/plan first, edit selectively
- [ ] Accepted changes re-applied via ADT + transport
- [ ] Never bypass the transport system

## Prompt starters
- "Explain this activation error, here is the message + DDL: ..."
- "Write ABAP Unit tests with OSQL test environment for: ..."
- "Convert this SELECT-in-loop to a single SELECT, 7.4+ syntax."
- "Draft a CDS view entity (not DDIC-based view) for: ..."
`,
      },
      relatedSlugs: ["sap-gui", "claude-code", "cds-views", "github-integration"],
    },

    // ------------------------------------------------------------------
    // Lesson 3: SAP ABAP MCP Server
    // ------------------------------------------------------------------
    {
      slug: "sap-abap-mcp-server",
      title: "SAP ABAP MCP Server",
      description:
        "Connect Claude directly to an ABAP development system through a community MCP server wrapping the ADT REST APIs: read source, search objects, run ATC — with strict security guardrails and never against production.",
      duration: 35,
      level: "Advanced",
      keywords: [
        "MCP",
        "Model Context Protocol",
        "ABAP MCP server",
        "ADT REST API",
        "claude_desktop_config.json",
        ".mcp.json",
        "service user",
        "least privilege",
      ],
      overview: [
        "Everything so far has been copy/paste: you were the bridge between SAP and Claude. The Model Context Protocol (MCP) removes the bridge. MCP is an open protocol that lets Claude Desktop and Claude Code call external tools — and the ABAP community has built MCP servers that wrap the same ADT REST services Eclipse uses (plus abapGit endpoints in some projects). With one configured, you can ask Claude 'read ZCL_ORDER_PROCESSOR and suggest refactoring' and Claude fetches the source itself, live from the dev system.",
        "Be clear about what these are: community/open-source projects (typically Node.js or Python servers found on GitHub), not official SAP or Anthropic products. Quality and tool coverage vary; typical tools include reading object source, searching the repository, listing package contents, running syntax checks or ATC, and reading transport information. Some expose write operations — most teams disable those and run read-only.",
        "Because an MCP server holds real system credentials and acts whenever Claude decides to call a tool, this lesson is as much about governance as configuration: a dedicated service user with least-privilege, display-only authorizations, development systems only, and an explicit never-production rule agreed with BASIS and security before you configure anything. All configuration is shown for Windows: claude_desktop_config.json under %APPDATA%\\Claude for Claude Desktop, and .mcp.json in the project folder for Claude Code.",
      ],
      objectives: [
        "Explain what MCP is and what a community ABAP MCP server does (wrapping ADT REST APIs / abapGit).",
        "Identify the typical tools exposed: read source, search objects, package listing, ATC, transport info.",
        "Configure an ABAP MCP server in claude_desktop_config.json (Windows) and in Claude Code's .mcp.json.",
        "Set up authentication correctly: dedicated service user, least privilege, dev system only.",
        "Apply security guardrails and know the network/BASIS prerequisites before connecting anything.",
      ],
      steps: [
        {
          title: "Understand the architecture: Claude → MCP server → ADT REST APIs",
          body: [
            "The ADT tools in Eclipse do not speak a proprietary wire format — they call REST services on the ABAP system (ICF nodes under /sap/bc/adt, e.g. repository information system, source retrieval, syntax check, ATC). A community ABAP MCP server is a small local process (usually Node.js, started by Claude Desktop or Claude Code on your Windows laptop) that translates MCP tool calls into those same HTTP requests and returns the results to Claude. Some projects also wrap abapGit's serialization for whole-package reads.",
            "Search GitHub for 'ABAP MCP server' or 'mcp-abap-adt' to find current projects — the ecosystem moves fast and several servers exist with different tool sets. Evaluate them like any open-source dependency: read the code (they are small), check the license, check how credentials are handled (environment variables, not hardcoded), and pin a version. Nothing here is an official SAP product; SAP's own AI offering is Joule, which is a separate, unrelated product.",
          ],
          callout: {
            type: "info",
            title: "MCP in one sentence",
            body: "MCP (Model Context Protocol) is an open standard through which Claude apps discover and call external tools; an ABAP MCP server simply publishes 'read_source', 'search_object', 'run_atc' and similar tools that internally call your dev system's ADT REST endpoints.",
          },
        },
        {
          title: "Clear the BASIS and network prerequisites first",
          body: [
            "Before any config file, verify with BASIS: (1) the ADT ICF services are active in SICF (/sap/bc/adt subtree — they already are if developers use Eclipse against this system); (2) your laptop can reach the system's HTTP(S) port — on VPN or office network, typically port 443 or 44300 for HTTPS, 8000/80xx for HTTP; check with Test-NetConnection in PowerShell; (3) if the system uses SAML/SSO for dialog users, you still need a BASIC-auth-capable service user for the MCP server, which BASIS must approve; (4) TLS: prefer HTTPS and import the corporate CA into Windows if the SAP system uses an internal certificate.",
            "Request a dedicated service user (e.g. ZSVC_MCP_READ) of type Service or System with display-only authorizations: S_ADT for ADT access, S_DEVELOP with ACTVT 03 (display) only, S_TCODE not needed, and explicitly no S_TRANSPRT change or S_DEVELOP ACTVT 01/02. Scope it to the development system only. This request is usually the longest lead-time item — start it early.",
          ],
          code: {
            language: "powershell",
            filename: "PowerShell: connectivity pre-check",
            code: `# Can the laptop reach the dev system's HTTPS port?
Test-NetConnection -ComputerName sapdev01.corp.example.com -Port 44300

# Is the ADT discovery service answering? (expects HTTP 401 without auth)
curl.exe -k -s -o NUL -w "%{http_code}" https://sapdev01.corp.example.com:44300/sap/bc/adt/discovery

# Check Node.js is available for the MCP server process
node --version
npx --version`,
          },
        },
        {
          title: "Configure Claude Desktop: claude_desktop_config.json",
          body: [
            "Claude Desktop on Windows reads MCP server definitions from %APPDATA%\\Claude\\claude_desktop_config.json (open it quickly via Win+R → %APPDATA%\\Claude, or from Claude Desktop: Settings → Developer → Edit Config). Each entry names a command to launch and environment variables to pass. Keep credentials in environment variables — never commit this file anywhere, and never share screenshots of it.",
            "After saving, fully restart Claude Desktop (quit from the system tray, not just close the window). The hammer/tools icon in the chat input shows the server's tools once it connects; failures are logged under %APPDATA%\\Claude\\logs, which is the first place to look when tools do not appear.",
          ],
          code: {
            language: "json",
            filename: "%APPDATA%\\Claude\\claude_desktop_config.json",
            code: `{
  "mcpServers": {
    "abap-dev": {
      "command": "npx",
      "args": ["-y", "mcp-abap-adt@1.2.3"],
      "env": {
        "SAP_URL": "https://sapdev01.corp.example.com:44300",
        "SAP_CLIENT": "100",
        "SAP_USER": "ZSVC_MCP_READ",
        "SAP_PASSWORD": "\${SAP_MCP_PASSWORD}",
        "SAP_LANGUAGE": "EN",
        "TLS_REJECT_UNAUTHORIZED": "1"
      }
    }
  }
}`,
          },
          callout: {
            type: "warning",
            title: "Dev system only — enforce it in the config",
            body: "The only SAP_URL that ever belongs in this file is a development system. Do not create entries for QA or production 'just for reading' — one mis-click and Claude is running tool calls against production. Many teams also firewall the service user to the dev host to make pointing at production physically impossible.",
          },
        },
        {
          title: "Configure Claude Code: .mcp.json in the project",
          body: [
            "For Claude Code, the project-scoped config file is .mcp.json in the project root (for example the folder holding your abapGit-exported repository). Same idea: server name, command, args, env. Add .mcp.json to .gitignore if it contains anything sensitive, or better, reference environment variables set at the user level in Windows (System Properties → Environment Variables, or setx in PowerShell) so the file itself stays secret-free.",
            "Claude Code will ask you to approve the project's MCP servers on first use. Combined with an abapGit clone, this is powerful: Claude Code can diff the Git snapshot against live dev-system source via the MCP server, or pull the latest version of one object without a full re-export.",
          ],
          code: {
            language: "json",
            filename: "C:\\dev\\repos\\zsd-delivery\\.mcp.json",
            code: `{
  "mcpServers": {
    "abap-dev": {
      "command": "npx",
      "args": ["-y", "mcp-abap-adt@1.2.3"],
      "env": {
        "SAP_URL": "https://sapdev01.corp.example.com:44300",
        "SAP_CLIENT": "100",
        "SAP_USER": "ZSVC_MCP_READ",
        "SAP_PASSWORD": "\${SAP_MCP_PASSWORD}"
      }
    }
  }
}`,
          },
        },
        {
          title: "Run a first session: read, search, ATC",
          body: [
            "With the server connected, talk to Claude normally — it decides when to call tools and shows you each call. Good first prompts exercise one tool at a time: 'search for objects matching ZSD_* in package ZSD_DELIVERY', then 'read the source of ZCL_ORDER_PROCESSOR', then the real work: 'read ZCL_ORDER_PROCESSOR and suggest refactoring — list issues ranked by risk, then show the refactored PROCESS_ORDER method'. Because Claude fetches source itself, follow-ups like 'now check its interface ZIF_ORDER_PROCESSOR too' need no copying.",
            "If the server exposes ATC or syntax-check tools, ask Claude to run ATC on the object and interpret the findings — a very effective loop for ATC-remediation work, since Claude sees both the finding and the current source in the same context. Transport-info tools let you ask 'which open transports touch package ZSD_DELIVERY?' during release planning.",
          ],
          code: {
            language: "text",
            filename: "Prompt: first MCP-powered refactoring session",
            code: `Using the abap-dev tools:
1. Read the source of ZCL_ORDER_PROCESSOR.
2. List its methods and any SELECT statements inside loops.
3. Run ATC on it if available and summarize the findings.
4. Propose a refactoring of PROCESS_ORDER in ABAP 7.4+ syntax.
   Do NOT attempt any write operations - output the code in chat,
   I will apply it myself in Eclipse ADT.`,
          },
        },
        {
          title: "Security guardrails: the non-negotiables",
          body: [
            "Write the rules down and review them with your security team before go-live: (1) development systems only, never production and never QA with production data copies containing personal data; (2) read-only service user, ACTVT 03, no transport-changing authorizations — even if the MCP server offers write tools, the user cannot execute them; (3) credentials in Windows user environment variables or a credential manager, never in Git, never in screenshots; (4) pin the MCP server version and re-review before upgrading — it is third-party code holding system credentials; (5) log usage: the service user's activity is visible in standard security audit logs (SM19/SM20 or RSAU), so misuse is detectable; (6) every code change still goes through ADT, code review and the transport system — the MCP server is a reading assistant, not a deployment channel.",
            "Also govern the human side: agree in the team which packages are in scope, and remember that source code read via MCP flows to Claude just like pasted code does — the same data-classification rules apply. Custom code is usually fine under your Anthropic commercial terms; embedded secrets, hardcoded passwords in legacy code, or personal data in test includes are not. Scan before you scope.",
          ],
        },
      ],
      screenshots: [
        {
          caption: "Claude Desktop tools panel showing the connected abap-dev MCP server",
          description:
            "Claude Desktop on Windows with the tools popover open, listing the abap-dev server and its tools (read_source, search_object, run_atc, get_transport_info), and a chat where Claude has just fetched ZCL_ORDER_PROCESSOR.",
        },
        {
          caption: "claude_desktop_config.json open in Notepad at %APPDATA%\\Claude",
          description:
            "Windows Explorer showing the %APPDATA%\\Claude folder and Notepad with the mcpServers JSON block, the SAP_PASSWORD value referencing an environment variable rather than a literal secret.",
        },
      ],
      video: {
        caption: "Zero to first MCP session: config, restart, live refactoring of ZCL_ORDER_PROCESSOR",
        description:
          "Screen recording: editing claude_desktop_config.json on Windows, restarting Claude Desktop, verifying tools appear, then a session where Claude reads a class from the dev system, runs ATC and proposes a refactoring the developer applies in ADT.",
        duration: "13:20",
      },
      sapExample: {
        title: "CPG customer: ATC remediation sprint powered by an ABAP MCP server",
        scenario:
          "A beverage manufacturer preparing an S/4HANA conversion must clear 3,800 ATC findings in custom code (priority 1 and 2) across 40 packages. Manually, each finding means: open object in ADT, read code, understand context, fix, re-check. The team sets up a community ABAP MCP server against the dev system (read-only service user ZSVC_MCP_READ, HTTPS, version-pinned) so Claude can read objects and ATC results directly during remediation sessions.",
        prompt: `Using the abap-dev tools: read ZCL_ORDER_PROCESSOR and its ATC
findings. For each priority-1 finding, show the offending lines,
explain why ATC flags it for S/4HANA readiness, and produce a
corrected version of just the affected method. Flag any fix that
changes behavior (not just syntax) so we route it to functional
testing. Read-only session: I apply all changes via ADT.`,
        code: {
          language: "abap",
          filename: "Typical remediation Claude produced (MATNR length, offset access)",
          code: `" ATC finding: field length conflict for MATNR (18 -> 40 in S/4HANA)
" Before:
"   DATA lv_matnr TYPE char18.
"   lv_matnr = ls_vbap-matnr(18).      " offset/length access
" After (behavior-preserving, S/4-ready):
DATA lv_matnr TYPE matnr.              " char40 in S/4HANA
lv_matnr = ls_vbap-matnr.              " no truncating offset access

" ATC finding: SELECT without ORDER BY relied on implicit ordering
SELECT FROM vbap
  FIELDS vbeln, posnr, matnr, kwmeng
  WHERE vbeln = @iv_vbeln
  ORDER BY posnr                        " explicit, HANA-safe
  INTO TABLE @DATA(lt_items).`,
        },
        explanation: [
          "The MCP connection changed the economics of the sprint: instead of a developer copying each object and its ATC findings into a chat, Claude pulled source and findings itself and kept full context across follow-up questions ('does any caller depend on the truncated length?' triggered further read_source calls on the callers). Throughput on mechanical priority-2 findings roughly tripled, while priority-1 findings with behavior impact were flagged for human functional review exactly as instructed.",
          "Governance held because the guardrails were structural, not aspirational: the service user physically could not write or release transports, the server pointed only at the dev host, and every fix entered the system through ADT with a code review and a transport. The security team's audit at sprint end found the setup compliant — the audit log showed only reads by ZSVC_MCP_READ.",
        ],
      },
      bestPractices: [
        "Treat the MCP server as third-party code holding credentials: read its source, pin its version, and re-review on every upgrade.",
        "Use a dedicated read-only service user (ACTVT 03, S_ADT) scoped to the development system; never a developer's personal user.",
        "Keep secrets out of config files where possible — reference Windows environment variables and never commit or screenshot credentials.",
        "Point MCP servers at development systems only; make QA/production connections impossible via firewall or user lock, not just policy.",
        "Start sessions with explicit tool expectations ('read-only, I apply changes via ADT') so Claude never attempts write tools.",
        "Verify the connection health first (search one object, read one source) before starting substantial work in a session.",
        "Keep the transport system authoritative: MCP is for reading and analysis; changes flow through ADT, review and transports.",
        "Align with BASIS and security before go-live: SICF services, network path, service user, audit logging (SM20/RSAU) all agreed in writing.",
      ],
      commonMistakes: [
        {
          mistake: "Configuring the MCP server with your personal dialog user because it already works in Eclipse.",
          fix: "Personal users have change authorizations and their audit trail becomes meaningless. Request a dedicated read-only service user (e.g. ZSVC_MCP_READ) before connecting anything.",
        },
        {
          mistake: "Editing claude_desktop_config.json and wondering why no tools appear.",
          fix: "Fully restart Claude Desktop (quit from the system tray icon). Then check %APPDATA%\\Claude\\logs for the server's stderr — the usual culprits are JSON syntax errors, wrong port, or Node.js missing.",
        },
        {
          mistake: "Adding a production system entry 'temporarily' to check one object.",
          fix: "Never. Pull the object into dev via transport of copies, or copy/paste that one source manually. Production credentials do not belong in any MCP configuration, ever.",
        },
        {
          mistake: "Assuming the ABAP MCP server is an official, supported SAP product.",
          fix: "These are community open-source projects wrapping ADT REST APIs. Evaluate, version-pin and monitor them like any third-party dependency, and expect to maintain the integration yourself.",
        },
        {
          mistake: "Letting Claude use write-capable tools to push generated code straight into the system.",
          fix: "Disable write tools or (better) use a user that lacks the authorization. All changes go through ADT, code review and the transport system.",
        },
      ],
      tips: [
        "Test the ADT endpoint with curl.exe or Test-NetConnection from PowerShell before blaming the MCP config — most 'MCP bugs' are network or TLS issues.",
        "Name servers by system role ('abap-dev', not 'sap') so it is always obvious in the tool list which system Claude is touching.",
        "Set SAP_LANGUAGE=EN for the service user so ATC texts and messages come back in English for consistent prompting.",
        "In Claude Code, project-scoped .mcp.json means each repo can target its matching dev system — keep one repo per system landscape.",
        "If tool calls suddenly fail with 401s, check for password expiry on the service user — set the user type to Service/System so no dialog password rules apply.",
      ],
      exercise: {
        title: "Design and validate a read-only ABAP MCP setup",
        scenario:
          "Your team wants Claude Desktop connected to the ECC dev system DEV/100 for an upcoming ATC remediation wave. You own the setup: security concept, configuration, and a validated first session — without ever exposing QA or production.",
        tasks: [
          "Draft the service-user request for BASIS: user type, authorizations (display-only), system scope, and the audit-logging expectation.",
          "Verify network prerequisites from your Windows laptop with PowerShell (port reachability, ADT discovery endpoint responding).",
          "Write the claude_desktop_config.json entry with credentials referenced from environment variables, and restart Claude Desktop.",
          "Run a validation session: search a package, read one class, and (if available) run ATC — confirm every call in Claude's tool log is read-only.",
          "Document the guardrails (dev-only, read-only, version pin, transport authority) as a one-page team policy.",
        ],
        hint: "For task 1, the core is S_ADT plus S_DEVELOP restricted to ACTVT 03, user type 'Service' or 'System'. For task 3, set the password once with setx SAP_MCP_PASSWORD \"...\" in PowerShell, then reference it from the config — new environment variables are only visible to Claude Desktop after a full restart.",
        solution: {
          language: "json",
          filename: "Validated claude_desktop_config.json entry",
          code: `{
  "mcpServers": {
    "abap-dev": {
      "command": "npx",
      "args": ["-y", "mcp-abap-adt@1.2.3"],
      "env": {
        "SAP_URL": "https://sapdev01.corp.example.com:44300",
        "SAP_CLIENT": "100",
        "SAP_USER": "ZSVC_MCP_READ",
        "SAP_PASSWORD": "\${SAP_MCP_PASSWORD}",
        "SAP_LANGUAGE": "EN"
      }
    }
  }
}`,
        },
      },
      quiz: [
        {
          question: "What does a community ABAP MCP server fundamentally do?",
          options: [
            "It replaces the SAP application server with a Node.js runtime",
            "It translates MCP tool calls from Claude into HTTP requests against the ABAP system's ADT REST services (and sometimes abapGit) and returns the results",
            "It is SAP's official AI product, also known as Joule",
            "It compiles ABAP code locally on the Windows laptop",
          ],
          correctIndex: 1,
          explanation:
            "ABAP MCP servers are community open-source projects that wrap the same ADT REST endpoints Eclipse uses, exposing them as MCP tools like read_source, search_object and run_atc. They are unrelated to SAP Joule and are not official SAP products.",
        },
        {
          question: "Where does Claude Desktop on Windows look for MCP server configuration?",
          options: [
            "C:\\Program Files\\Claude\\servers.ini",
            ".mcp.json on the Windows desktop",
            "%APPDATA%\\Claude\\claude_desktop_config.json",
            "The SAP system's SICF configuration",
          ],
          correctIndex: 2,
          explanation:
            "Claude Desktop reads %APPDATA%\\Claude\\claude_desktop_config.json; .mcp.json in a project folder is the analogous config for Claude Code. A full restart of Claude Desktop is needed after edits.",
        },
        {
          question: "Which authentication setup is correct for an ABAP MCP server?",
          options: [
            "Your personal dialog user, since it already has the right roles",
            "A shared developer user with SAP_ALL to avoid authorization errors",
            "No authentication — ADT services are public",
            "A dedicated service user with display-only authorizations (e.g. S_DEVELOP ACTVT 03, S_ADT), scoped to the development system",
          ],
          correctIndex: 3,
          explanation:
            "Least privilege is the rule: a dedicated read-only service user makes write operations impossible regardless of what the server exposes, keeps the audit trail clean, and is scoped to dev only.",
        },
        {
          question: "A colleague suggests adding the production system to the MCP config 'read-only, just to check one report'. What is the right response?",
          options: [
            "Fine, as long as the password is strong",
            "No — MCP servers never point at production; move the object to dev or copy the single source manually instead",
            "Yes, but only outside business hours",
            "Yes, if the entry is named 'prod-readonly'",
          ],
          correctIndex: 1,
          explanation:
            "Never-production is a structural guardrail, not a convenience trade-off. One mis-scoped session or server bug against production is unacceptable risk; dev-system alternatives always exist for reading a single object.",
        },
      ],
      summary: [
        "MCP lets Claude call tools directly; community ABAP MCP servers wrap ADT REST APIs so Claude can read source, search objects and run ATC on your dev system without copy/paste.",
        "Configuration lives in %APPDATA%\\Claude\\claude_desktop_config.json (Claude Desktop) or project .mcp.json (Claude Code), with credentials in environment variables.",
        "Security is structural: dedicated read-only service user, dev system only, version-pinned server, and all changes still via ADT and transports.",
        "These servers are community open-source projects, not SAP products — evaluate and maintain them like any third-party dependency, with BASIS and security on board.",
      ],
      download: {
        name: "ABAP MCP server setup and security checklist",
        description:
          "End-to-end checklist for standing up a community ABAP MCP server safely: prerequisites, service user, Windows configuration, validation and guardrails.",
        filename: "abap-mcp-server-checklist.md",
        content: `# ABAP MCP Server: Setup & Security Checklist

> Community/open-source integration (not an SAP product).
> Scope: DEVELOPMENT systems only. Read-only.

## 1. Governance (before any config)
- [ ] Security + BASIS informed and approving in writing
- [ ] Packages in scope agreed; code scanned for secrets/personal data
- [ ] Rule documented: NEVER point at production or QA
- [ ] Rule documented: all changes via ADT + code review + transport

## 2. Service user (BASIS request)
- [ ] Dedicated user, e.g. ZSVC_MCP_READ, type Service/System
- [ ] S_ADT granted; S_DEVELOP restricted to ACTVT 03 (display)
- [ ] No transport-changing authorizations (S_TRANSPRT change: none)
- [ ] Scoped to dev system/client only; audit logging (SM20/RSAU) active

## 3. Network / BASIS prerequisites
- [ ] /sap/bc/adt ICF services active (SICF)
- [ ] Laptop reaches HTTPS port: Test-NetConnection <host> -Port 44300
- [ ] ADT discovery answers (401 without auth is OK):
      https://<host>:44300/sap/bc/adt/discovery
- [ ] HTTPS with corporate CA trusted in Windows
- [ ] Node.js installed (node --version / npx --version)

## 4. Server selection
- [ ] Community project evaluated (source read, license checked)
- [ ] Credential handling verified (env vars, no hardcoding)
- [ ] Version PINNED (e.g. mcp-abap-adt@1.2.3)
- [ ] Write tools disabled or made impossible by user authorizations

## 5. Windows configuration
- [ ] Claude Desktop: %APPDATA%\\Claude\\claude_desktop_config.json
- [ ] Claude Code: .mcp.json in project root (secret-free; env refs)
- [ ] Password via user env var: setx SAP_MCP_PASSWORD "..."
- [ ] Full restart of Claude Desktop after edits (quit via tray)
- [ ] Logs checked on failure: %APPDATA%\\Claude\\logs

## 6. Validation session
- [ ] Tools visible in Claude Desktop tools panel
- [ ] search_object on a known package works
- [ ] read_source on one class works
- [ ] ATC run works (if exposed)
- [ ] Confirmed: every logged call is read-only

## 7. Ongoing
- [ ] Server version upgrades re-reviewed before applying
- [ ] Service-user activity reviewed periodically (SM20)
- [ ] Password rotation per company policy
- [ ] Team policy page kept current (dev-only, read-only, transports)
`,
      },
      relatedSlugs: ["mcp-servers", "claude-code", "security-guidelines", "atc-remediation"],
    },
  ],
};
