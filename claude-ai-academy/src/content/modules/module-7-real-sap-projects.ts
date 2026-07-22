import type { Module } from "../types";

export const module7: Module = {
  slug: "real-sap-projects",
  title: "Real SAP Project Playbooks",
  shortTitle: "SAP Projects",
  description:
    "Apply Claude to real S/4HANA migration, ATC remediation, CDS, RAP, and OData work with end-to-end playbooks drawn from a live bottling-company transformation program.",
  icon: "briefcase",
  lessons: [
    {
      slug: "real-sap-project-examples",
      title: "Real SAP Project Examples",
      description:
        "A portfolio tour of where Claude delivers measurable value across an SAP program: code analysis, spec-to-code, testing, data migration, cutover, and incident analysis.",
      duration: 30,
      level: "Intermediate",
      keywords: [
        "SAP project",
        "use cases",
        "ROI",
        "productivity",
        "custom code analysis",
        "data migration",
        "cutover",
        "incident analysis",
      ],
      overview: [
        "Most teams start using Claude for one narrow task, usually explaining a piece of legacy code, and stop there. On a real SAP program there are at least a dozen workstreams where an AI assistant changes the economics of the work: custom code analysis before an S/4HANA conversion, turning functional specs into first-draft ABAP, generating ABAP Unit tests for untested Z-code, building field-mapping documents for data migration, drafting cutover runbooks, and triaging production incidents from short dumps and job logs.",
        "This lesson walks through the portfolio of use cases at our reference customer: a CPG beverage bottler running ECC 6.0 with roughly 4,200 custom objects in the ZCC* and ZB* namespaces, mid-way through an S/4HANA brownfield conversion. For each use case you will see what the input artifact is (code, spec, spreadsheet, dump), what you ask Claude to produce, and how the team measured the gain.",
        "You will also learn how to pick your first use cases. The best candidates share three traits: the input is text-representable (code, logs, CSVs), the output is verifiable (compiles, passes ATC, matches a reconciliation report), and the task is high-volume or high-tedium. Low-volume judgment calls, like deciding your target architecture, are where Claude assists but humans decide."
      ],
      objectives: [
        "Map the major workstreams of an SAP program to concrete Claude use cases",
        "Score candidate use cases by ROI using volume, verifiability, and tedium",
        "Run a legacy-code analysis and a spec-to-code workflow end to end",
        "Generate ABAP Unit tests and data-migration mapping docs with Claude",
        "Define simple before/after metrics to prove productivity gains to management"
      ],
      steps: [
        {
          title: "Inventory the program and find text-shaped work",
          body: [
            "Start by listing the workstreams on your program: custom code remediation, functional gaps, interfaces, data migration, testing, cutover, and hypercare. For each, ask: what artifacts exist as text? ABAP source, ATC result exports, functional specs in Word, LSMW/LTMC field mappings in Excel, ST22 dumps, SM37 job logs, and /IWFND/ERROR_LOG entries are all text-shaped and therefore Claude-shaped.",
            "At the bottler, the team pulled the custom object inventory from table TADIR filtered on the ZCC* and ZB* namespaces, joined usage data from SCMON/SUSG, and exported it to CSV. That single spreadsheet, roughly 4,200 rows, became the backbone for prioritizing every AI-assisted activity that followed: dead code was flagged for decommissioning instead of remediation, and the top 300 most-executed objects got the deepest review."
          ],
          code: {
            language: "text",
            filename: "prompt-inventory-triage.txt",
            code: `I'm attaching a CSV export of our custom code inventory (TADIR + SCMON usage).
Columns: OBJECT_TYPE, OBJECT_NAME, PACKAGE, LAST_EXECUTED, EXEC_COUNT_90D, AUTHOR, CREATED_ON.

Context: ECC 6.0 moving to S/4HANA 2023, custom namespaces ZCC* and ZB*.

Tasks:
1. Bucket the objects: DECOMMISSION (no execution in 90 days AND created > 3 years ago),
   REMEDIATE (executed, likely affected by S/4 simplifications),
   REVIEW (everything else).
2. Within REMEDIATE, flag likely S/4 impact: objects whose names suggest
   SD rebates (ZCC_REBATE*), classic MM inventory (ZB_MB5*), or FI totals tables.
3. Output a summary table with counts per bucket and a top-20 list by EXEC_COUNT_90D.`
          },
          callout: {
            type: "tip",
            title: "Usage data beats opinions",
            body: "Before debating which Z-programs matter, turn on SCMON/SUSG for at least one full month-end and one quarter-end. Claude can bucket 4,000 objects in minutes, but only if the usage columns are real."
          }
        },
        {
          title: "Legacy code analysis: explain before you change",
          body: [
            "The single highest-adoption use case is code explanation. Paste a Z-report or a function module and ask for a structured summary: purpose, inputs/outputs, database touches, and risky constructs. This is how new team members onboard onto a 15-year-old codebase, and it is the first step before any remediation.",
            "Make the request structured. A free-form 'explain this code' answer is nice to read but hard to file. Ask for a fixed template so the outputs can be pasted into your wiki or Solution Manager documentation with a consistent shape."
          ],
          code: {
            language: "text",
            filename: "prompt-code-analysis.txt",
            code: `Analyze this ABAP include from our ECC 6.0 system (code pasted below).

Return exactly these sections:
## Purpose (2 sentences, business language)
## Inputs (selection screen params, importing params)
## Database access (tables read/written, with SELECT patterns)
## External calls (FMs, BAPIs, class methods)
## Risk flags (SELECT *, native SQL, hardcoded values, missing AUTHORITY-CHECK,
   direct table updates, implicit sort dependencies)
## S/4HANA watchlist (anything touching MATNR length, VBFA, KONV, BSEG/BSIS,
   MB* transactions, removed FMs)

Code:
[paste ZCC_REBATE_SETTLEMENT here]`
          }
        },
        {
          title: "Spec-to-code: first drafts, not final code",
          body: [
            "For new development, feed Claude the functional spec and your development standards, and ask for a first draft. The realistic gain is not that Claude writes finished code; it is that the developer starts from an 80% skeleton with naming conventions, error handling, and doc-comments already in place, instead of a blank editor.",
            "The bottler's team standardized on a two-shot pattern: shot one produces a technical design (objects to create, method breakdown, table access strategy) that a senior developer reviews in ten minutes; shot two generates the code from the approved design. Reviewing a design is far cheaper than reviewing 600 lines of code that took the wrong approach."
          ],
          code: {
            language: "abap",
            filename: "zcl_cc_empties_deposit.clas.abap",
            code: `CLASS zcl_cc_empties_deposit DEFINITION
  PUBLIC FINAL CREATE PUBLIC.

  PUBLIC SECTION.
    TYPES: BEGIN OF ty_deposit_line,
             matnr        TYPE matnr,
             werks        TYPE werks_d,
             deposit_qty  TYPE menge_d,
             deposit_amt  TYPE dmbtr,
             currency     TYPE waers,
           END OF ty_deposit_line,
           ty_deposit_lines TYPE STANDARD TABLE OF ty_deposit_line
                            WITH EMPTY KEY.

    "! Calculates bottle/crate deposit amounts for a delivery.
    "! Generated first draft via Claude from FS-LOG-042, reviewed by A. Mahajan.
    METHODS calculate_for_delivery
      IMPORTING iv_vbeln         TYPE vbeln_vl
      RETURNING VALUE(rt_result) TYPE ty_deposit_lines
      RAISING   zcx_cc_deposit_error.

  PRIVATE SECTION.
    METHODS read_delivery_items
      IMPORTING iv_vbeln        TYPE vbeln_vl
      RETURNING VALUE(rt_items) TYPE ty_deposit_lines
      RAISING   zcx_cc_deposit_error.
ENDCLASS.

CLASS zcl_cc_empties_deposit IMPLEMENTATION.
  METHOD calculate_for_delivery.
    DATA(lt_items) = read_delivery_items( iv_vbeln ).
    SELECT matnr, werks, deposit_rate, waers
      FROM zcc_deposit_rate
      FOR ALL ENTRIES IN @lt_items
      WHERE matnr = @lt_items-matnr
        AND werks = @lt_items-werks
      INTO TABLE @DATA(lt_rates).
    LOOP AT lt_items ASSIGNING FIELD-SYMBOL(<ls_item>).
      READ TABLE lt_rates INTO DATA(ls_rate)
        WITH KEY matnr = <ls_item>-matnr werks = <ls_item>-werks.
      IF sy-subrc = 0.
        <ls_item>-deposit_amt = <ls_item>-deposit_qty * ls_rate-deposit_rate.
        <ls_item>-currency    = ls_rate-waers.
      ENDIF.
      APPEND <ls_item> TO rt_result.
    ENDLOOP.
  ENDMETHOD.

  METHOD read_delivery_items.
    SELECT lips~matnr, lips~werks, lips~lfimg AS deposit_qty
      FROM lips
      WHERE vbeln = @iv_vbeln
        AND mtart = 'ZLGU'      "empties material type
      INTO CORRESPONDING FIELDS OF TABLE @rt_items.
    IF rt_items IS INITIAL.
      RAISE EXCEPTION NEW zcx_cc_deposit_error( textid = zcx_cc_deposit_error=>no_empties ).
    ENDIF.
  ENDMETHOD.
ENDCLASS.`
          }
        },
        {
          title: "Test generation and data migration mapping",
          body: [
            "Untested Z-code is the hidden liability of every conversion. Claude can read a class and generate ABAP Unit test skeletons with meaningful given/when/then cases, including edge cases developers rarely bother with: initial inputs, missing customizing entries, and boundary quantities. You still review the assertions, but the boilerplate cost drops to near zero.",
            "For data migration, the winning artifact is the field-mapping workbook. Paste the legacy structure (say, a ZCC_CUST_EXT customer extension table) and the S/4 target (Business Partner via LTMC/Migration Cockpit templates), and ask Claude to propose the mapping, flag type conflicts, and draft the transformation rules in plain English for the functional team to sign off."
          ],
          code: {
            language: "text",
            filename: "prompt-migration-mapping.txt",
            code: `You are helping map legacy ECC customer master extensions to S/4HANA Business Partner.

Source: table ZCC_CUST_EXT (DDIC definition pasted below), plus KNA1/KNVV extracts.
Target: S/4 Migration Cockpit object "Customer" (BP), template columns pasted below.

Produce a mapping table with columns:
SOURCE_FIELD | SOURCE_TYPE | TARGET_STRUCTURE | TARGET_FIELD | RULE | OPEN_QUESTION

Rules must be explicit, e.g. "Concatenate REGION + '-' + ROUTE_CODE, max 10 chars,
truncate and log if longer". Anything ambiguous goes in OPEN_QUESTION, do not guess.
Flag every field where source length > target length.`
          },
          callout: {
            type: "warning",
            title: "Never let Claude invent mapping rules",
            body: "In migration mapping, an invented rule is worse than a blank cell. Instruct Claude explicitly to route ambiguity into an OPEN_QUESTION column for the functional owner, and reject any output where that column is suspiciously empty."
          }
        },
        {
          title: "Cutover docs and incident analysis",
          body: [
            "Cutover runbooks are painful because they combine hundreds of small steps with strict ordering, owners, and durations. Claude excels at transforming a messy list of tasks from a workshop into a normalized runbook table, generating communication templates for each go/no-go gate, and stress-testing the plan by asking 'what is missing?' against a standard cutover checklist.",
            "In hypercare, paste an ST22 short dump (the relevant sections: category, error analysis, source extract, active calls) and ask for probable root cause plus a triage recommendation. Teams at the bottler cut mean time to first diagnosis from about 45 minutes to under 10 for the common dump classes, because the analyst starts with a hypothesis instead of a blank stack trace."
          ],
          code: {
            language: "text",
            filename: "prompt-dump-triage.txt",
            code: `Analyze this ST22 short dump from our S/4HANA quality system.

Runtime error: ITAB_DUPLICATE_KEY
Program: ZCC_ROUTE_SETTLEMENT
Include: ZCC_ROUTE_SETTLEMENT_F01, line 214

[paste "Error analysis", "Source Code Extract" and "Active Calls/Events" sections]

Answer:
1. Most likely root cause in one paragraph.
2. Which recent change types could trigger this (code, customizing, master data)?
3. Immediate mitigation vs. proper fix.
4. Exact debugger breakpoint locations to confirm the hypothesis.`
          }
        },
        {
          title: "Measure the gain or it never happened",
          body: [
            "Pick two or three metrics per use case and record a baseline before rollout. Good metrics are boring: hours per remediated object, ATC findings closed per developer-week, unit-test coverage on touched objects, time-to-first-diagnosis on P1/P2 incidents, and rework rate on migration mapping documents.",
            "Report ranges, not miracles. The bottler's honest numbers after one quarter: code explanation and test generation around 60-70% time savings, spec-to-code around 30-40% (review time eats part of the gain), migration mapping around 50%, and incident triage 70% faster to first hypothesis. Those numbers won budget for the next phase; a claim of '10x everything' would not have survived the first steering committee question."
          ]
        }
      ],
      screenshots: [
        {
          caption: "Claude analyzing a custom code inventory CSV with triage buckets",
          description: "Claude Desktop showing an uploaded TADIR/SCMON CSV and a response table bucketing 4,200 Z-objects into DECOMMISSION, REMEDIATE, and REVIEW with counts."
        },
        {
          caption: "Structured legacy-code analysis output for a Z-report",
          description: "A Claude conversation where a pasted ZCC report is summarized under fixed headings: Purpose, Inputs, Database access, Risk flags, and S/4HANA watchlist."
        }
      ],
      video: {
        caption: "Portfolio walkthrough: six Claude use cases on one SAP program",
        description: "A narrated tour through the bottler's program board, demonstrating inventory triage, code analysis, spec-to-code, test generation, migration mapping, and dump triage with live prompts.",
        duration: "14:20"
      },
      sapExample: {
        title: "Triaging the ZCC/ZB custom code portfolio before conversion",
        scenario:
          "The bottler's conversion project needs a remediation estimate for the steering committee in five days. The technical team has a TADIR export of 4,218 custom objects in ZCC* and ZB*, 90 days of SCMON usage data, and no time to open each object. They use Claude to produce a defensible triage and a top-risk shortlist.",
        prompt: `Attached: custom_code_inventory.csv (4,218 rows: OBJECT_TYPE, OBJECT_NAME, PACKAGE,
DEVCLASS_TEXT, LAST_EXECUTED, EXEC_COUNT_90D, LINES_OF_CODE).

Company context: beverage bottler, ECC 6.0 EHP8 -> S/4HANA 2023 brownfield.
Namespaces ZCC* (core) and ZB* (bottling plants). Heavy SD rebates, empties/deposit
handling, route-to-market settlement, classic MM inventory reports.

1. Triage every object into DECOMMISSION / REMEDIATE / REVIEW using the rules:
   - DECOMMISSION: EXEC_COUNT_90D = 0 and LAST_EXECUTED older than 2024-01-01
   - REMEDIATE: executed and name/package suggests S/4-affected areas
     (rebates, MB51/MB5B clones, KONV readers, BSEG readers, MATNR handling)
   - REVIEW: the rest
2. Estimate remediation effort per REMEDIATE object: S (<0.5d), M (0.5-2d), L (>2d)
   using LINES_OF_CODE and the affected area as drivers. State your banding rules.
3. Return: summary counts, effort totals in person-days, and the 25 riskiest objects
   with a one-line reason each.`,
        code: {
          language: "abap",
          filename: "zcc_scmon_export.prog.abap",
          code: `REPORT zcc_scmon_export.
"Extracts the inventory Claude will triage: TADIR + usage + size.
DATA lt_out TYPE STANDARD TABLE OF zcc_s_code_inventory WITH EMPTY KEY.

SELECT tadir~object AS object_type,
       tadir~obj_name AS object_name,
       tadir~devclass AS package,
       tdevct~ctext   AS devclass_text
  FROM tadir
  LEFT OUTER JOIN tdevct
    ON tdevct~devclass = tadir~devclass AND tdevct~spras = @sy-langu
  WHERE tadir~obj_name LIKE 'ZCC%' OR tadir~obj_name LIKE 'ZB%'
  INTO CORRESPONDING FIELDS OF TABLE @lt_out.

LOOP AT lt_out ASSIGNING FIELD-SYMBOL(<ls_out>).
  "Merge SUSG aggregated usage (simplified for the example)
  SELECT SINGLE used_cnt, used_date
    FROM zcc_susg_agg
    WHERE obj_name = @<ls_out>-object_name
    INTO ( @<ls_out>-exec_count_90d, @<ls_out>-last_executed ).
ENDLOOP.

cl_gui_frontend_services=>gui_download(
  EXPORTING filename = 'C:\\temp\\custom_code_inventory.csv'
            filetype = 'ASC' write_field_separator = 'X'
  CHANGING  data_tab = lt_out ).`
        },
        explanation: [
          "The workflow deliberately splits responsibilities. ABAP extracts facts (what exists, what runs, how big it is) because that must be exact. Claude applies judgment at scale (bucketing, effort banding, risk narrative) because that is where a human would spend two weeks doing the same thing object by object.",
          "Notice that the prompt forces Claude to state its banding rules. That converts an opaque estimate into an auditable one: the steering committee can challenge 'L means over 2 days for KONV readers' rather than a mystery number, and the team can rerun with adjusted rules in minutes.",
          "The output shortlist of 25 risky objects became the pilot scope for the next lesson's SI-check remediation. Starting with a Claude-ranked shortlist, rather than alphabetical order, meant the pilot hit the objects most likely to break month-end settlement, which is exactly the evidence a go/no-go decision needs."
        ]
      },
      bestPractices: [
        "Start with use cases whose outputs are mechanically verifiable: code that compiles, ATC that re-runs clean, mappings that reconcile.",
        "Give Claude the same context pack every time: system versions, namespaces, coding standards, and business domain in a reusable preamble.",
        "Use two-shot workflows for new code: approve a design summary before asking for the implementation.",
        "Force structured output templates so results can be filed in wikis, ALM tools, or Excel without reformatting.",
        "Record baseline metrics before rollout; report ranges honestly to keep credibility with management.",
        "Route all ambiguity to explicit OPEN_QUESTION fields instead of letting the model guess business rules.",
        "Keep a shared prompt library per workstream so gains do not depend on one enthusiast's private prompts."
      ],
      commonMistakes: [
        {
          mistake: "Rolling out Claude for everything at once and measuring nothing.",
          fix: "Pick two or three high-volume, verifiable use cases, baseline them, run a four-week pilot, then expand with data in hand."
        },
        {
          mistake: "Pasting code without system context, so advice targets the wrong release.",
          fix: "Always state ECC 6.0 vs. S/4HANA 2023, the ABAP version, and your namespace conventions in the first message."
        },
        {
          mistake: "Treating spec-to-code output as finished development.",
          fix: "Position generated code as a reviewed first draft; require the same code review and ATC gates as human-written code."
        },
        {
          mistake: "Letting Claude invent field mappings or business rules when the spec is silent.",
          fix: "Demand an OPEN_QUESTION column and reject outputs that resolve ambiguity by guessing."
        },
        {
          mistake: "Claiming 10x productivity to management based on one good afternoon.",
          fix: "Report measured ranges per use case (e.g., 60-70% on test generation, 30-40% on spec-to-code) with the baseline method attached."
        }
      ],
      tips: [
        "Keep a 'context pack' text file (system landscape, namespaces, standards) and paste it at the top of every new project conversation.",
        "CSV beats screenshots: export ATC results, TADIR lists, and job logs as text so Claude can compute over them.",
        "Ask Claude to critique your cutover runbook against a generic checklist; the gaps it finds are usually real.",
        "For dumps, paste only the relevant ST22 sections; the full dump wastes context on kernel noise.",
        "End pilot reviews by asking Claude to summarize which prompt patterns worked; fold the winners into the team library."
      ],
      exercise: {
        title: "Build your own use-case shortlist",
        scenario:
          "You are the technical lead for the bottler's Wave 2 (three bottling plants on ZB* code). You have a TADIR export with usage data, 240 open ATC findings, and a backlog of 18 functional specs. Management wants a one-page proposal for where AI assistance goes first.",
        tasks: [
          "Write the context-pack preamble (5-8 lines) you would prepend to every Claude conversation on this program.",
          "Draft a prompt that triages the TADIR export into decommission/remediate/review buckets with explicit rules.",
          "Pick the two use cases you would pilot first and justify each with the volume/verifiability/tedium test.",
          "Define one baseline metric per pilot use case and how you would measure it for four weeks.",
          "Draft the prompt you would use to generate ABAP Unit test skeletons for one ZB* class."
        ],
        hint: "High-volume plus verifiable beats impressive. Test generation and ATC triage almost always beat spec-to-code as a first pilot.",
        solution: {
          language: "text",
          filename: "solution-context-pack-and-prompt.txt",
          code: `CONTEXT PACK (prepend to every conversation):
System: ECC 6.0 EHP8 -> S/4HANA 2023 brownfield, Wave 2 = plants DE01/DE02/PL01.
Namespaces: ZCC* (core), ZB* (plant-specific). ABAP 7.54 target, Eclipse ADT.
Standards: classes over reports, no SELECT *, exception classes ZCX_*,
all new SELECTs with ORDER BY or explicit SORT. Domain: beverage bottling,
empties/deposits, route settlement, SD rebates (moving to condition contracts).

PILOT CHOICE: (1) ABAP Unit test generation for the 40 most-executed ZB* classes:
high volume, output verifiable by running the tests, pure tedium today.
(2) ATC findings triage/fix for the 240 open findings: verifiable by ATC re-run.

METRICS: tests - median minutes per test class, before (manual, ~90) vs after;
ATC - findings closed per developer-week, before vs after.

TEST GENERATION PROMPT:
"Generate an ABAP Unit test class (FOR TESTING, RISK LEVEL HARMLESS) for the
class below. Use CL_ABAP_TESTDOUBLE-style isolation for DB access via the
existing ZIF_CC_DAO interface. Cover: happy path, empty input, missing
customizing row, quantity = 0, and one boundary case you identify yourself.
Name methods given_when_then style. Code: [paste ZCL_B_FILLING_LINE_CALC]"`
        }
      },
      quiz: [
        {
          question: "Which trait matters MOST when selecting a first Claude use case on an SAP program?",
          options: [
            "The task involves the newest SAP technology",
            "The output can be mechanically verified (compiles, re-runs clean, reconciles)",
            "The task is highly visible to management",
            "The task requires deep business judgment"
          ],
          correctIndex: 1,
          explanation: "Verifiable outputs (passing tests, clean ATC re-runs, reconciled mappings) let you trust and measure AI-assisted work. Judgment-heavy, low-volume tasks are the weakest starting point."
        },
        {
          question: "In the two-shot spec-to-code pattern, what does the first shot produce?",
          options: [
            "The complete ABAP implementation",
            "A technical design summary for a senior developer to approve",
            "The ABAP Unit tests",
            "The transport request"
          ],
          correctIndex: 1,
          explanation: "Shot one yields a reviewable design (objects, methods, table access strategy). Approving a design in minutes is far cheaper than discovering a wrong approach inside 600 lines of generated code."
        },
        {
          question: "Why should migration-mapping prompts demand an OPEN_QUESTION column?",
          options: [
            "It makes the output table wider and more impressive",
            "Excel requires it for LTMC uploads",
            "An invented mapping rule is worse than a flagged gap; ambiguity must go to the functional owner",
            "Claude cannot process tables without it"
          ],
          correctIndex: 2,
          explanation: "Silent guesses in data migration surface as reconciliation failures at cutover. Forcing ambiguity into an explicit column keeps humans in charge of business rules."
        },
        {
          question: "Which productivity claim is most likely to survive a steering committee review?",
          options: [
            "\"Claude makes every developer 10x faster\"",
            "\"AI eliminates the need for code review\"",
            "\"Test generation showed 60-70% time savings against a measured 90-minute baseline\"",
            "\"Everyone feels more productive\""
          ],
          correctIndex: 2,
          explanation: "Measured ranges against a stated baseline are auditable. Unbounded multipliers and feelings are not, and one skeptical question demolishes them."
        }
      ],
      summary: [
        "SAP programs are full of text-shaped work: code, ATC exports, specs, mappings, dumps, and runbooks are all strong Claude inputs.",
        "Pick pilots by volume, verifiability, and tedium; test generation and inventory triage usually win over glamorous use cases.",
        "Use two-shot design-then-code for new development and structured templates for analysis so outputs are reviewable and filable.",
        "Baseline before, measure during, and report honest ranges; credibility funds the next phase."
      ],
      download: {
        name: "SAP Program Use-Case Playbook",
        description: "Prompt templates and a scoring worksheet for selecting and measuring Claude use cases across an SAP program.",
        filename: "sap-project-use-case-playbook.md",
        content: `# SAP Program Use-Case Playbook

## Context pack template (prepend to every conversation)
\`\`\`
System: <ECC 6.0 EHPx | S/4HANA 20xx>, ABAP <version>, tools: <SE80/ADT>
Namespaces: ZCC* (core), ZB* (plants). Transport landscape: DEV->QAS->PRD.
Standards: <link or 5 bullet rules>
Domain: beverage bottling - empties/deposits, route settlement, SD rebates.
\`\`\`

## Use-case scoring worksheet
Score each candidate 1-5 on: Volume | Verifiability | Tedium | Data availability.
Pilot anything scoring 16+. Defer anything under 10.

| Use case | Vol | Verif | Tedium | Data | Total |
|---|---|---|---|---|---|
| Legacy code explanation | | | | | |
| ABAP Unit test generation | | | | | |
| ATC findings triage | | | | | |
| Spec-to-code first drafts | | | | | |
| Migration field mapping | | | | | |
| Cutover runbook drafting | | | | | |
| ST22/incident triage | | | | | |

## Prompt: inventory triage
\`\`\`
Attached: custom code inventory CSV (TADIR + SCMON columns ...).
Triage into DECOMMISSION / REMEDIATE / REVIEW using these rules: <rules>.
Estimate S/M/L effort per REMEDIATE object and state your banding rules.
Return summary counts + top-25 risk list with one-line reasons.
\`\`\`

## Prompt: structured code analysis
\`\`\`
Analyze this ABAP object. Return exactly: Purpose / Inputs / Database access /
External calls / Risk flags / S/4HANA watchlist. Code: [paste]
\`\`\`

## Prompt: ABAP Unit generation
\`\`\`
Generate a FOR TESTING class (RISK LEVEL HARMLESS) for the class below.
Isolate DB access via <interface>. Cover happy path, empty input, missing
customizing, zero quantity, one self-identified boundary case. [paste class]
\`\`\`

## Prompt: ST22 triage
\`\`\`
Analyze this short dump. Answer: root-cause hypothesis, triggering change types,
mitigation vs proper fix, breakpoints to confirm. [paste dump sections]
\`\`\`

## Metrics checklist
- [ ] Baseline captured BEFORE pilot (same task, same team, manual)
- [ ] One metric per use case, measured weekly for 4 weeks
- [ ] Rework/defect rate tracked alongside speed
- [ ] Honest range reported (never a single miracle number)
`
      },
      relatedSlugs: ["s4hana-migration", "atc-remediation", "prompt-engineering", "claude-code"]
    },
    {
      slug: "s4hana-migration",
      title: "S/4HANA Custom Code Migration",
      description:
        "Use Claude to remediate custom code for S/4HANA: simplification item checks, MATNR extension, removed transactions and FMs, and batch refactoring over abapGit repos with Claude Code.",
      duration: 40,
      level: "Advanced",
      keywords: [
        "S/4HANA",
        "custom code migration",
        "simplification items",
        "ATC readiness",
        "MATNR",
        "abapGit",
        "brownfield conversion",
        "remediation"
      ],
      overview: [
        "A brownfield conversion turns your entire Z-portfolio into a remediation backlog overnight. The ATC run with the S/4HANA readiness variant against the bottler's ZCC*/ZB* code produced 11,300 findings across 1,900 objects: MATNR length conflicts, reads on KONV and VBFA-adjacent structures, BSEG selects that must move to ACDOCA-aware patterns, calls to removed function modules, and clones of removed MB* transactions. No team reads 11,300 findings by hand and stays sane.",
        "This lesson is the playbook the bottler used: run the remote ATC readiness check from a central check system, export findings, and use Claude to cluster them into remediation patterns rather than individual fixes. One pattern ('replace KONV access with PRCD_ELEMENTS via V_KONV') fixes 400 findings; triaging by pattern instead of by finding is the entire game.",
        "You will also see the heavy machinery: simplification item notes analysis (turning dense SAP Notes into decision tables), and batch refactoring with Claude Code over abapGit-exported repositories, where one well-specified instruction remediates dozens of programs in a reviewable Git branch instead of one editor session at a time."
      ],
      objectives: [
        "Run and export S/4HANA readiness checks (ATC remote check with the S4HANA_READINESS variant) for Claude-based triage",
        "Cluster thousands of findings into a small set of remediation patterns with Claude",
        "Remediate the classic conversion topics: MATNR length, KONV/PRCD_ELEMENTS, BSEG/ACDOCA, removed FMs and transactions, material ledger impacts",
        "Turn simplification item SAP Notes into concise decision tables for the team",
        "Execute batch refactoring over abapGit repos with Claude Code, with Git-reviewable diffs"
      ],
      steps: [
        {
          title: "Run the readiness check and export the raw material",
          body: [
            "On the central check system (or via SAP BTP-based remote ATC), run ATC with the S/4HANA readiness variant (based on check class CL_CI_TEST_S4HANA_READINESS or via S4SIC on the target release) against your Z-namespaces. Export the results list to a spreadsheet: object, check ID, message, priority, line, and quick-fix availability.",
            "Do not sample the export. Claude handles the full CSV, and the value of the first analysis is a complete frequency table: which check messages occur, how often, and across which packages. That table is your remediation work-breakdown structure."
          ],
          code: {
            language: "text",
            filename: "prompt-si-clustering.txt",
            code: `Attached: atc_readiness_export.csv - 11,300 rows from an ATC run with the
S/4HANA readiness variant. Columns: OBJECT, OBJ_TYPE, PACKAGE, CHECK_TITLE,
MESSAGE_TEXT, PRIO, LINE, NOTE_NUMBER.

Tasks:
1. Frequency table: findings per CHECK_TITLE + NOTE_NUMBER, descending.
2. Cluster into remediation PATTERNS - one pattern = one repeatable fix recipe.
   Examples of what I mean: "KONV read -> PRCD_ELEMENTS/V_KONV",
   "MATNR move-length conflict -> use MATNR type + FM conversion",
   "BSEG secondary-index select -> ACDOCA/compatibility view decision".
3. For each pattern: affected object count, mechanical vs judgment-required,
   a 3-step fix recipe, and which SAP Note to read.
4. Recommend an order of attack: biggest mechanical clusters first.`
          }
        },
        {
          title: "MATNR extension: find real breakage, not noise",
          body: [
            "The 40-character MATNR generates enormous finding volume, and most of it is harmless because compatibility is preserved when you use proper DDIC types. Real breakage hides in: hardcoded lengths (CHAR18 declarations, offsets like matnr+0(18)), OFFSET/LENGTH string operations, external interfaces with fixed-width files, and CONVERSION_EXIT handling around ALPHA on numeric materials.",
            "Ask Claude to separate the two classes. Paste the MATNR-related findings plus the flagged code sections, and require a verdict per occurrence: SAFE (typed with MATNR, no length assumption) versus FIX (with the exact rewrite). This typically collapses thousands of findings into a few hundred genuine edits."
          ],
          code: {
            language: "abap",
            filename: "matnr_fix_pattern.abap",
            code: `"BEFORE (flagged): fixed length + offset logic breaks with 40-char MATNR
DATA lv_matnr TYPE char18.
lv_matnr = ls_mara-matnr.
lv_prefix = ls_mara-matnr+0(4).
CONCATENATE lv_matnr '-' lv_werks INTO lv_key.

"AFTER: DDIC-typed, no length assumptions, explicit external formatting
DATA lv_matnr TYPE matnr.
lv_matnr = ls_mara-matnr.

"Prefix logic re-specified with the business: first segment up to '-'
DATA(lv_prefix) = substring_before( val = |{ ls_mara-matnr }| sub = '-' ).

"External file interface: explicit output conversion, agreed width 40
DATA(lv_matnr_ext) = |{ ls_mara-matnr ALPHA = OUT WIDTH = 40 }|.
DATA(lv_key) = |{ lv_matnr }-{ lv_werks }|.`
          },
          callout: {
            type: "warning",
            title: "Interfaces break silently",
            body: "MATNR length issues inside ABAP usually dump or fail ATC. Fixed-width IDoc segments, legacy file interfaces, and EDI mappings truncate silently. Have Claude grep specifically for OPEN DATASET, TRANSFER, and WE* segment handling around MATNR fields."
          }
        },
        {
          title: "Removed transactions, FMs, and the pricing/finance data model",
          body: [
            "Clones of removed transactions (MB1A/MB1B/MB1C-style logic, classic MM reports) and calls to removed or deprecated function modules need per-case decisions: replace with a BAPI (BAPI_GOODSMVT_CREATE), redirect to the new transaction (MIGO), or retire the clone. Paste each cluster and ask Claude for a decision table with the replacement API and a code sketch.",
            "For pricing, KONV is replaced by PRCD_ELEMENTS with the compatibility view V_KONV; direct KONV writes must go. For finance, BSEG/BSIS/BSAS/GLT0 reads meet ACDOCA and compatibility views: reads often keep working via CDS compatibility views but with performance caveats, while any code relying on totals tables or index tables needs redesign. Material ledger is mandatory in S/4HANA, so custom valuation reports reading MBEW history need review against ML tables (currently via CKMLCR/CKMLHD-aware logic or released CDS views)."
          ],
          code: {
            language: "abap",
            filename: "konv_to_prcd_elements.abap",
            code: `"BEFORE (flagged by readiness check): direct KONV access
SELECT knumv, kposn, kschl, kbetr, waers
  FROM konv
  WHERE knumv = @ls_vbak-knumv
  INTO TABLE @DATA(lt_konv).

"AFTER: pricing data lives in PRCD_ELEMENTS; V_KONV is the compatibility view.
"Prefer the released view for a brownfield-safe, redirect-friendly read:
SELECT knumv, kposn, kschl, kbetr, waers
  FROM v_konv
  WHERE knumv = @ls_vbak-knumv
  INTO TABLE @DATA(lt_prc).

"Writes may NOT target KONV/PRCD_ELEMENTS directly - route through pricing
"APIs (e.g. standard pricing calls / PRC APIs) instead of UPDATE konv.`
          }
        },
        {
          title: "Turn simplification item notes into decision tables",
          body: [
            "Every finding cluster points to a simplification item and an SAP Note, and those notes are long. Paste the note text (from the Simplification Item Catalog or SI check output) and ask Claude for a one-page decision table: what changed, who is affected, detection method, remediation options ranked, and effort class. Store these in the team wiki as the canonical crib sheet per SI.",
            "Be strict about hallucination risk here: instruct Claude to only summarize what is in the pasted note and to mark anything it adds from general knowledge with [GENERAL], so a developer never mistakes model background for note content. Verify note numbers against the SAP Support Portal before publishing the crib sheet."
          ],
          code: {
            language: "text",
            filename: "prompt-si-note-digest.txt",
            code: `Below is the full text of SAP Note 2267306 (simplification item: pricing
data model KONV -> PRCD_ELEMENTS). Produce a one-page digest:

| Section | Content |
|---|---|
| What changed | ... |
| Affected custom patterns | reads / writes / appends of KONV, KONP joins ... |
| Detection | which ATC checks / code patterns to grep |
| Remediation options (ranked) | 1) V_KONV read redirect 2) released CDS 3) redesign |
| Effort class per option | S / M / L with rationale |
| Gotchas | currency decimals, KBETR handling, archived documents |

Rules: summarize ONLY the pasted note. Anything you add from general knowledge
must be prefixed [GENERAL]. Do not invent note numbers or transaction codes.`
          },
          callout: {
            type: "danger",
            title: "Verify every SAP Note number",
            body: "Language models can produce plausible-looking but wrong SAP Note numbers. Treat any note number Claude outputs as a claim to verify in the SAP Support Portal, never as a citation."
          }
        },
        {
          title: "Batch refactoring with Claude Code over abapGit repos",
          body: [
            "For mechanical patterns at volume, leave the GUI. Export the affected packages with abapGit to a Git repository, open it with Claude Code on your Windows laptop, and give one precise instruction per pattern: the before-shape, the after-shape, the invariants (do not touch logic, preserve comments, add a marker comment), and the scope (which files). Claude Code edits across dozens of source files, and Git gives you a reviewable diff per pattern.",
            "The bottler ran this for the V_KONV redirect across 84 programs: one branch per pattern, one commit per program, a senior developer reviewing diffs in the pull request, then abapGit pull into the sandbox system and an ATC re-run as the acceptance gate. The re-run, not the diff review alone, is what proves the cluster closed."
          ],
          code: {
            language: "text",
            filename: "claude-code-batch-instruction.txt",
            code: `In this abapGit repo (src/ contains .prog.abap and .clas.abap files):

Pattern: replace direct KONV SELECTs with V_KONV.
Scope: only files listed in konv_findings.csv (column OBJECT).
Rules:
- Rewrite "FROM konv" to "FROM v_konv" ONLY in SELECT statements; field lists,
  WHERE clauses and INTO targets stay byte-identical unless a field no longer
  exists (then stop and list the file under BLOCKED instead of guessing).
- Never touch INSERT/UPDATE/DELETE/MODIFY on konv - list those under BLOCKED.
- Add the marker comment "* S4-REMEDIATION: KONV->V_KONV (SI 2267306)" above
  each changed SELECT.
- One git commit per file, message: "s4: konv->v_konv <OBJECT>".
Output at the end: table of CHANGED files and BLOCKED files with reasons.`
          }
        },
        {
          title: "Close the loop: re-run, retest, record",
          body: [
            "A pattern is done when the ATC readiness re-run shows zero findings for its check in the touched objects, the ABAP Unit suite for those packages is green, and the diff has a human approval. Track remediation as burn-down per pattern, not per finding; the steering committee chart 'patterns closed 9 of 14, findings down from 11,300 to 2,100' tells the real story.",
            "Feed the re-run deltas back to Claude: 'these 37 objects still show the finding after remediation, here are their diffs, what did we miss?' The residuals are usually the interesting cases - dynamic SQL, generated code, macro usage - and Claude's second pass on a small residual set is far more accurate than its first pass on everything."
          ]
        }
      ],
      screenshots: [
        {
          caption: "ATC readiness findings clustered into remediation patterns",
          description: "Claude's response to the 11,300-row export: a frequency table by check and note number, followed by 14 named remediation patterns with object counts and fix recipes."
        },
        {
          caption: "Claude Code batch-refactoring an abapGit repo",
          description: "Claude Code in a terminal on Windows editing multiple .prog.abap files for the KONV to V_KONV pattern, with a Git diff panel showing marker comments above each rewritten SELECT."
        }
      ],
      video: {
        caption: "From 11,300 findings to 14 patterns: an S/4 remediation sprint",
        description: "Live session: exporting the readiness ATC run, clustering findings with Claude, remediating a MATNR cluster manually, then batch-fixing the KONV cluster with Claude Code over abapGit and verifying with an ATC re-run.",
        duration: "18:45"
      },
      sapExample: {
        title: "Remediating ZCC_REBATE_SETTLEMENT for the S/4 conversion",
        scenario:
          "ZCC_REBATE_SETTLEMENT is the bottler's most business-critical custom program: it settles retailer rebates monthly and reads KONV, BSEG, and classic rebate tables (KONA/KONP). The readiness check flags 62 findings in this one program, and SD rebate processing itself is replaced by settlement management (condition contracts) in S/4HANA. The team needs a remediation design, not just line fixes.",
        prompt: `Context: ECC 6.0 -> S/4HANA 2023 brownfield. Program ZCC_REBATE_SETTLEMENT
(source attached, 1,400 lines) settles retailer rebates monthly.
Readiness findings attached (62 rows): KONV reads, BSEG reads via BSIS pattern,
KONA/KONP rebate-agreement logic, one call to a removed FM.

SD rebates are replaced by settlement management / condition contracts in S/4.

Deliver:
1. Split the findings: SURVIVES CONVERSION (fix code, keep logic) vs
   OBSOLETE WITH REBATES (logic replaced by condition contracts).
2. For SURVIVES: concrete rewrites (V_KONV, ACDOCA-aware selects) as diffs.
3. For OBSOLETE: what the condition-contract equivalent covers, what residual
   custom logic (empties handling, route-specific bonuses) still needs a home,
   and a target design sketch (CDS + small class) for that residue.
4. A risk list for the parallel-run month.`,
        code: {
          language: "abap",
          filename: "zcc_rebate_settlement_fix.abap",
          code: `"Finding cluster 3: open-item reads via BSIS with secondary-index mindset.
"BEFORE:
SELECT bukrs, belnr, gjahr, dmbtr, shkzg
  FROM bsis
  WHERE bukrs = @p_bukrs
    AND hkont = @gc_rebate_accrual_acct
    AND budat IN @s_budat
  INTO TABLE @DATA(lt_bsis).

"AFTER: single source of truth is the Universal Journal. The compatibility
"view keeps BSIS reads working, but the honest S/4 pattern reads ACDOCA and
"pushes aggregation into HANA:
SELECT rbukrs AS bukrs, belnr, gjahr,
       SUM( hsl ) AS amount_cc
  FROM acdoca
  WHERE rldnr  = '0L'
    AND rbukrs = @p_bukrs
    AND racct  = @gc_rebate_accrual_acct
    AND budat  IN @s_budat
  GROUP BY rbukrs, belnr, gjahr
  INTO TABLE @DATA(lt_accruals).

"Removed-FM cluster: CUSTOMER_MASTER read FM replaced with released CDS view
SELECT SINGLE customer, customername
  FROM i_customer
  WHERE customer = @lv_kunnr
  INTO @DATA(ls_customer).`
        },
        explanation: [
          "The decisive move is asking Claude to split findings by fate: code that survives conversion and merely needs new data-access patterns, versus logic that the simplification itself makes obsolete. Mechanically fixing KONA/KONP handling would have been wasted effort, because condition contracts replace the whole rebate-agreement model; the readiness check flags lines, but the remediation unit is a business process.",
          "For the surviving code, note the pattern of the ACDOCA rewrite: it does not just swap table names, it moves the SUM and GROUP BY into the database, which is the code-pushdown habit S/4HANA rewards. Claude proposed this shape when the prompt stated the target release; without that context it tends to produce minimal, ECC-flavored fixes.",
          "The 'residual logic' question in the prompt is where senior review matters most. Claude correctly identified that empties-deposit bonuses and route-specific incentives have no standard home in condition contracts and sketched a small CDS-plus-class design for them - but the decision to build that versus change the business process was made in a workshop, with Claude's sketch as the strawman."
        ]
      },
      bestPractices: [
        "Always run and export the complete readiness ATC result; frequency tables over full data are the basis for pattern clustering.",
        "Remediate by pattern, not by finding: one recipe, one Git branch, one ATC re-run as the acceptance gate.",
        "State source and target releases in every prompt so fixes use S/4-idiomatic patterns (code pushdown, released CDS views).",
        "Separate mechanical clusters (batch with Claude Code) from judgment clusters (developer with Claude assisting) explicitly.",
        "Treat SAP Note numbers from Claude as claims to verify, and force [GENERAL] tagging when digesting pasted notes.",
        "Keep writes sacred: never let a batch instruction touch INSERT/UPDATE/DELETE paths; route those to humans.",
        "Track burn-down per pattern for management; findings counts alone overstate both the problem and the progress."
      ],
      commonMistakes: [
        {
          mistake: "Fixing MATNR findings one by one when most are false alarms on properly typed code.",
          fix: "Have Claude classify each occurrence SAFE vs FIX with justification, then only edit the FIX list (offsets, CHAR18, fixed-width interfaces)."
        },
        {
          mistake: "Swapping KONV to V_KONV everywhere, including write statements.",
          fix: "Compatibility views cover reads only. Batch instructions must BLOCK any DML on replaced tables and escalate to a developer."
        },
        {
          mistake: "Mechanically remediating code whose business function is itself simplified away (classic SD rebates, totals-table reports).",
          fix: "First ask 'does this logic survive conversion?'; align with the functional team before spending effort on obsolete code."
        },
        {
          mistake: "Letting Claude Code refactor an abapGit repo with vague instructions like 'fix the S/4 issues'.",
          fix: "One pattern per instruction with before-shape, after-shape, invariants, scope file list, and a BLOCKED escape hatch."
        },
        {
          mistake: "Declaring victory on the diff review without re-running ATC and unit tests in the sandbox.",
          fix: "The acceptance gate is the readiness re-run at zero findings for the pattern plus a green ABAP Unit run, imported via abapGit."
        }
      ],
      tips: [
        "Run the readiness check early and repeatedly; the export is cheap and the burn-down trend is your best status slide.",
        "Ask Claude for a grep list per pattern (regexes over abapGit sources) to catch occurrences ATC misses in dynamic code.",
        "Keep a 'pattern recipe card' per cluster in the wiki: before/after code, invariants, and the batch instruction that worked.",
        "Use one Git branch per pattern and one commit per object; bisecting a broken import becomes trivial.",
        "Paste residual findings after each re-run back to Claude; second-pass analysis on residuals is where the subtle bugs surface."
      ],
      exercise: {
        title: "Cluster and batch-fix a readiness export",
        scenario:
          "You receive atc_readiness_export.csv with 3,400 findings across the ZB* plant packages: 1,900 MATNR-related, 700 KONV reads, 420 BSEG/BSIS selects, 210 removed-FM calls, 170 miscellaneous. The abapGit repo for the packages is on your laptop and Claude Code is installed.",
        tasks: [
          "Write the clustering prompt that turns the CSV into remediation patterns with mechanical/judgment classification.",
          "Draft the MATNR classification prompt that splits SAFE vs FIX occurrences with justification per line.",
          "Write the full Claude Code batch instruction for the KONV to V_KONV pattern including scope, invariants, and BLOCKED handling.",
          "Define the acceptance gate for the KONV pattern (what must be true before the branch merges).",
          "Sketch the burn-down slide: what numbers do you show the steering committee after week one?"
        ],
        hint: "Your batch instruction is a contract, not a wish. If it does not say what to do when a field is missing from V_KONV, Claude Code will decide for you.",
        solution: {
          language: "text",
          filename: "solution-batch-instruction.txt",
          code: `CLAUDE CODE BATCH INSTRUCTION - PATTERN P02 (KONV read redirect)

Repo: C:\\dev\\abapgit\\zb_plants  (src/**.prog.abap, src/**.clas.abap)
Scope: exactly the 143 objects in konv_findings.csv, column OBJECT. Touch no
other file.

Transform, per SELECT statement reading FROM konv:
  1. Replace table name konv with v_konv. Keep field list, WHERE, INTO,
     FOR ALL ENTRIES byte-identical.
  2. If the SELECT uses a field not available in V_KONV, make NO change and
     record the file under BLOCKED with the field name.
  3. Insert above the statement:
     * S4-REMEDIATION: KONV->V_KONV (SI catalog: pricing data model)
Never modify: INSERT/UPDATE/MODIFY/DELETE on konv (record under BLOCKED),
dynamic FROM clauses (record under BLOCKED), commented-out code.

Git: branch s4/p02-konv-vkonv, one commit per object,
message "s4(p02): konv->v_konv <OBJECT>".
Final output: CHANGED table (object, #selects changed) + BLOCKED table
(object, reason).

ACCEPTANCE GATE (before merge):
[ ] Senior dev approves PR diff
[ ] abapGit pull to sandbox OK, syntax check clean
[ ] ATC readiness re-run: 0 KONV findings on the 143 objects
[ ] ABAP Unit for affected packages green
[ ] BLOCKED list converted to developer backlog items`
        }
      },
      quiz: [
        {
          question: "Why cluster readiness findings into patterns before fixing anything?",
          options: [
            "ATC requires findings to be grouped before exemptions",
            "One repeatable recipe can close hundreds of findings; triage and acceptance then operate at pattern level",
            "Patterns reduce the transport count",
            "SAP Notes are only readable in groups"
          ],
          correctIndex: 1,
          explanation: "11,300 findings collapse into roughly a dozen fix recipes. Working per pattern makes batching, review, and ATC re-run gates tractable; working per finding does not scale."
        },
        {
          question: "Which MATNR-related occurrence genuinely needs a fix?",
          options: [
            "DATA lv_matnr TYPE matnr used in a SELECT",
            "A method parameter typed MATNR passed to a BAPI",
            "A fixed-width file interface writing MATNR into an 18-character field",
            "A WHERE clause comparing MARA-MATNR to a MATNR variable"
          ],
          correctIndex: 2,
          explanation: "Properly DDIC-typed usage survives the length extension. Hardcoded lengths, offsets, and fixed-width external interfaces are the real breakage, and file interfaces fail silently by truncation."
        },
        {
          question: "What must a Claude Code batch instruction do about UPDATE statements on KONV?",
          options: [
            "Rewrite them to UPDATE v_konv",
            "Rewrite them to UPDATE prcd_elements",
            "Delete them since pricing is read-only",
            "Leave them unchanged and report them as BLOCKED for a developer"
          ],
          correctIndex: 3,
          explanation: "Compatibility views support reads only, and direct DML on replaced pricing tables must be redesigned around APIs. Batch automation should never touch write paths; it escalates them."
        },
        {
          question: "When is a remediation pattern considered closed?",
          options: [
            "When the pull request diff looks correct",
            "When Claude reports all files changed",
            "When the ATC readiness re-run shows zero findings for that check on the touched objects and unit tests are green",
            "When the transport is released"
          ],
          correctIndex: 2,
          explanation: "The diff review is necessary but not sufficient. The mechanical proof is the re-run at zero plus green tests after importing the changes into a real system."
        }
      ],
      summary: [
        "Export the full readiness ATC result and let Claude cluster it: the remediation unit is the pattern, not the finding.",
        "Classic clusters have known shapes: MATNR SAFE/FIX split, KONV to V_KONV reads, BSEG to ACDOCA-aware selects, removed FMs to BAPIs/CDS.",
        "Ask first whether the business logic survives conversion; simplified-away processes (classic rebates) need redesign, not line fixes.",
        "Batch mechanical patterns with Claude Code over abapGit under strict instructions; close each pattern with an ATC re-run and green tests."
      ],
      download: {
        name: "S/4HANA Remediation Pattern Kit",
        description: "Clustering prompts, pattern recipe cards, and the batch-instruction template for Claude Code over abapGit repos.",
        filename: "s4hana-migration-pattern-kit.md",
        content: `# S/4HANA Custom Code Remediation - Pattern Kit

## Prompt: cluster the readiness export
\`\`\`
Attached: ATC readiness export CSV (<n> rows: OBJECT, CHECK_TITLE, MESSAGE_TEXT,
PRIO, LINE, NOTE_NUMBER). 1) Frequency table by check+note. 2) Cluster into
remediation patterns (one pattern = one repeatable recipe). 3) Per pattern:
object count, mechanical vs judgment, 3-step recipe, note to read.
4) Order of attack: biggest mechanical clusters first.
\`\`\`

## Prompt: MATNR SAFE/FIX split
\`\`\`
For each MATNR finding below (finding + surrounding code), verdict SAFE or FIX.
SAFE = properly typed, no length assumption. FIX = CHAR18/offsets/fixed-width
interfaces/concatenation with length math. For FIX give the exact rewrite.
Also grep-list: OPEN DATASET / TRANSFER / IDoc segments touching MATNR.
\`\`\`

## Pattern recipe card template
\`\`\`
PATTERN: <id> <name>            SI/Note: <verified note no.>
BEFORE shape: <code>            AFTER shape: <code>
Invariants: <what must not change>
Mechanical? <yes/no>            Batch-eligible? <yes/no>
Acceptance: ATC re-run 0 findings + ABAP Unit green + PR approved
\`\`\`

## Claude Code batch instruction template
\`\`\`
Repo: <path>  Scope: ONLY objects in <findings.csv> column OBJECT.
Transform: <before -> after, byte-identical elsewhere>.
If <edge case>: NO change, record under BLOCKED with reason.
Never touch: DML on replaced tables, dynamic FROM, comments-only code.
Git: branch s4/<pattern>, one commit per object.
Output: CHANGED table + BLOCKED table.
\`\`\`

## Classic cluster cheat sheet
- MATNR 40 chars: fix offsets/CHAR18/fixed-width interfaces only
- KONV -> V_KONV (reads) / pricing APIs (writes)
- BSEG/BSIS/BSAS -> ACDOCA with GROUP BY pushdown (or compatibility views, measured)
- Totals tables (GLT0 etc.) -> ACDOCA aggregation
- MB1A/MB1B/MB1C clones -> BAPI_GOODSMVT_CREATE / MIGO
- Classic SD rebates -> settlement management / condition contracts (redesign!)
- Material ledger mandatory: revisit MBEW-history valuation reports

## Verification checklist per pattern
- [ ] PR reviewed by senior developer
- [ ] abapGit pull to sandbox, syntax check clean
- [ ] ATC readiness re-run: 0 findings for the pattern's check
- [ ] ABAP Unit green on affected packages
- [ ] BLOCKED items converted to backlog
- [ ] Note number verified in SAP Support Portal
`
      },
      relatedSlugs: ["atc-remediation", "claude-code", "real-sap-project-examples", "eclipse-adt"]
    },
    {
      slug: "atc-remediation",
      title: "ATC Remediation with Claude",
      description:
        "Feed exported ATC findings to Claude for prioritization and fix generation, handle pragmas and exemptions correctly, and run a bulk remediation workflow with Claude Code.",
      duration: 35,
      level: "Advanced",
      keywords: [
        "ATC",
        "code inspector",
        "pseudo-comments",
        "pragmas",
        "exemptions",
        "SELECT *",
        "ORDER BY",
        "bulk remediation"
      ],
      overview: [
        "ATC (ABAP Test Cockpit) is where code quality debt becomes visible and, on most systems, where it stays visible for years. The bottler's quality gate tightened during the S/4 program: priority 1 and 2 findings now block transport release, which turned a background annoyance into a delivery blocker. The backlog at the start: 6,800 findings across the ZCC*/ZB* portfolio.",
        "Claude changes the economics in three places. First, triage: an exported findings list becomes a prioritized, clustered work plan in one conversation. Second, fixes: the classic findings - SELECT * where few fields are used, missing ORDER BY after the pool/cluster-to-HANA migration, unsecured dynamic WHERE clauses, obsolete statements from the pre-7.40 era - all have well-defined fix shapes Claude produces reliably when given the surrounding code. Third, scale: with Claude Code over an abapGit repo you remediate whole finding families in one reviewed branch.",
        "Just as important is what not to automate. Exemptions and pseudo-comments/pragmas are governance instruments, not fix shortcuts. This lesson covers when a pragma is legitimate, how to write an exemption request a quality manager will approve, and how to stop Claude (or a hurried developer) from papering over real defects with suppressions."
      ],
      objectives: [
        "Export ATC results and drive a triage conversation that clusters findings by check, priority, and fix shape",
        "Generate correct fixes for the classic findings: SELECT *, missing ORDER BY, dynamic SQL injection risks, obsolete statements",
        "Apply pseudo-comments and pragmas only where technically justified, and write approvable exemption requests",
        "Verify every fix wave with an ATC re-run and unit tests before transport",
        "Run a bulk remediation workflow with Claude Code over an abapGit repository"
      ],
      steps: [
        {
          title: "Export findings and build the triage table",
          body: [
            "Run ATC (transaction ATC or via ADT) with your quality variant and export the result list to Excel/CSV: check, message code, priority, object, include, line, and message text. In ADT you can also work from the ATC Problems view, but the CSV is what scales to a Claude conversation.",
            "Ask Claude for a two-dimensional triage: by priority (what blocks transports) and by fix shape (what can be batched). The output you want is a work plan: 'Family A: 1,240 x SELECT * with narrow field usage, mechanical, batch-eligible. Family B: 310 x missing ORDER BY on sorted-read consumers, semi-mechanical, needs read-site inspection.' Priorities decide when; fix shapes decide how."
          ],
          code: {
            language: "text",
            filename: "prompt-atc-triage.txt",
            code: `Attached: atc_findings.csv - 6,800 rows exported from ATC.
Columns: CHECK_ID, MESSAGE_CODE, PRIO, OBJECT, INCLUDE, LINE, MESSAGE_TEXT.
Quality gate: PRIO 1+2 block transport release.

1. Pivot: findings by CHECK_ID x PRIO, descending count.
2. Group into FIX FAMILIES where one recipe fixes all members. For each family:
   count, PRIO mix, fix recipe (2-4 lines), batch-eligible yes/no, and what a
   reviewer must inspect per fix.
3. Which families clear the largest number of PRIO 1+2 findings per day of
   effort? Give a 2-week attack plan for a team of 3 developers.
4. List finding types in this export that should NEVER be auto-fixed.`
          }
        },
        {
          title: "Fix family: SELECT * and wide reads",
          body: [
            "SELECT * findings are the highest-volume family on most systems. The fix is not just listing fields; it is discovering which fields the code actually uses downstream. Paste the SELECT plus the consuming code and ask Claude to derive the used-field set, rewrite the SELECT with an explicit field list into a matching inline-declared structure, and flag cases where the target is passed on wholesale (then the fix needs a decision, not a rewrite).",
            "Watch for the classic trap: code that MOVE-CORRESPONDINGs the result into another structure or hands the full row to a FORM. Claude should mark these NEEDS-DECISION rather than shrinking the field list and silently breaking a distant consumer."
          ],
          code: {
            language: "abap",
            filename: "fix_select_star.abap",
            code: `"BEFORE - ATC: 'Use of SELECT *' (and no ORDER BY)
SELECT * FROM vbak
  WHERE erdat IN @s_erdat
    AND auart = 'ZTA'
  INTO TABLE @DATA(lt_vbak).
LOOP AT lt_vbak ASSIGNING FIELD-SYMBOL(<ls_vbak>).
  WRITE: / <ls_vbak>-vbeln, <ls_vbak>-kunnr, <ls_vbak>-netwr.
ENDLOOP.

"AFTER - explicit field list derived from actual usage, deterministic order
SELECT vbeln, kunnr, netwr
  FROM vbak
  WHERE erdat IN @s_erdat
    AND auart = 'ZTA'
  ORDER BY vbeln
  INTO TABLE @DATA(lt_orders).
LOOP AT lt_orders ASSIGNING FIELD-SYMBOL(<ls_order>).
  WRITE: / <ls_order>-vbeln, <ls_order>-kunnr, <ls_order>-netwr.
ENDLOOP.`
          }
        },
        {
          title: "Fix family: missing ORDER BY after pool/cluster to HANA",
          body: [
            "On the old database, pool and cluster tables (and primary-index access paths generally) often returned rows in primary key order by accident, and old code silently relies on it: BINARY SEARCH reads, DELETE ADJACENT DUPLICATES, AT NEW group processing. On HANA the order guarantee is gone, and this family causes the nastiest post-migration defects because nothing dumps - results are just quietly wrong.",
            "The mechanical fix is ORDER BY PRIMARY KEY (or explicit fields) on the SELECT, or a SORT before the dependent read. But the real work is finding the dependency: ask Claude to trace each flagged SELECT's internal table to every consumer and classify it ORDER-DEPENDENT or ORDER-FREE with the evidence line. Fix the dependent ones; for genuinely order-free reads, adding ORDER BY everywhere costs HANA performance for nothing."
          ],
          code: {
            language: "abap",
            filename: "fix_missing_order_by.abap",
            code: `"BEFORE - worked on anyDB by accident, wrong on HANA:
SELECT matnr, charg, clabs
  FROM mchb
  WHERE werks = @p_werks
  INTO TABLE @DATA(lt_batch).
"...200 lines later:
READ TABLE lt_batch INTO DATA(ls_batch)
  WITH KEY matnr = lv_matnr BINARY SEARCH.   "<- order dependency!

"AFTER - make the contract explicit at the source:
SELECT matnr, charg, clabs
  FROM mchb
  WHERE werks = @p_werks
  ORDER BY matnr, charg
  INTO TABLE @DATA(lt_batch).

"Or better: kill the order dependency entirely with a sorted table type
DATA lt_batch2 TYPE SORTED TABLE OF ty_batch WITH UNIQUE KEY matnr charg.
SELECT matnr, charg, clabs FROM mchb
  WHERE werks = @p_werks
  INTO TABLE @lt_batch2.
READ TABLE lt_batch2 INTO ls_batch WITH KEY matnr = lv_matnr charg = lv_charg.`
          },
          callout: {
            type: "warning",
            title: "This family fails silently",
            body: "Missing-ORDER-BY defects produce wrong aggregates and skipped groups, not dumps. Prioritize this family by business criticality of the consuming report, not by ATC priority alone - month-end settlement logic goes first."
          }
        },
        {
          title: "Fix family: dynamic SQL and obsolete statements",
          body: [
            "Unsecured dynamic WHERE clauses (concatenating user input into (lv_where)) are the security-relevant family: fix with escaping via cl_abap_dyn_prg (escape_quotes, check_table_name_str, check_column_name) or, better, by eliminating the dynamic clause where a static alternative exists. Never batch-fix these blind; each site needs a look at where the input originates.",
            "Obsolete statements are the opposite: almost pure mechanics. HEADER LINE tables, OCCURS, LIKE for types in new code, COMPUTE, MOVE ... TO, class-based exceptions replacing MESSAGE ... RAISING in methods - Claude modernizes these to 7.40+ syntax reliably. Batch them, but keep semantics changes visible in the diff: converting a header-line table touches every statement that used the implicit work area."
          ],
          code: {
            language: "abap",
            filename: "fix_dynamic_sql.abap",
            code: `"BEFORE - ATC: possible SQL injection via dynamic WHERE
CONCATENATE 'KUNNR = ''' p_kunnr '''' INTO lv_where.
SELECT vbeln FROM vbak WHERE (lv_where) INTO TABLE @DATA(lt_vbeln).

"AFTER option 1 - static SQL (best when the shape is known):
SELECT vbeln FROM vbak
  WHERE kunnr = @p_kunnr
  INTO TABLE @DATA(lt_vbeln_ok).

"AFTER option 2 - unavoidable dynamics, secured:
DATA(lv_kunnr_esc) = cl_abap_dyn_prg=>escape_quotes( CONV string( p_kunnr ) ).
DATA(lv_where_ok)  = |KUNNR = '{ lv_kunnr_esc }'|.
SELECT vbeln FROM vbak WHERE (lv_where_ok) INTO TABLE @lt_vbeln_ok.

"Dynamic column names must be allow-listed, not escaped:
cl_abap_dyn_prg=>check_column_name( lv_dyn_col ). "raises on bad input`
          }
        },
        {
          title: "Pragmas, pseudo-comments, and exemptions done right",
          body: [
            "Some findings are correct code that the check cannot prove correct. For those, ABAP offers pragmas (##NEEDED, ##NO_TEXT, ##WARN_OK - consumed by the compiler/extended check) and pseudo-comments for Code Inspector checks (\"#EC CI_NOORDER, \"#EC CI_SUBRC and friends). A suppression is a signed statement 'I inspected this and it is fine' - so your standard must require a justification comment on the same line or directly above, naming the reason.",
            "Findings that cannot be suppressed in code (or per your governance must not be) go through ATC exemptions: requested by the developer with rationale, approved by a quality manager, time-boxed where possible. Claude helps by drafting the justification from the code context - but never let it decide that a suppression is warranted. The honest workflow: Claude proposes FIX or ESCALATE, humans decide EXEMPT."
          ],
          code: {
            language: "abap",
            filename: "pragmas_done_right.abap",
            code: `"Legitimate: order irrelevant, single-row existence check, documented
"Reason: pure existence check, no order dependency (reviewed 2026-07, AM)
SELECT SINGLE @abap_true FROM zcc_route_lock
  WHERE route_id = @iv_route_id
  INTO @DATA(lv_locked).                            "#EC CI_NOORDER

"Legitimate: parameter kept for released-API compatibility
METHODS settle
  IMPORTING iv_simulate TYPE abap_bool ##NEEDED.

"NOT legitimate - hiding a real defect. Never do this:
"SELECT * FROM vbak INTO TABLE @DATA(lt_all).      "#EC CI_ALL_FIELDS_NEEDED
"  (no analysis done, comment lies, reviewer rubber-stamps)`
          },
          callout: {
            type: "danger",
            title: "Suppression is a signature",
            body: "Every pragma or pseudo-comment must carry a dated justification and survive code review. Instruct Claude explicitly: 'never propose a pragma or exemption; propose FIX or ESCALATE only'. Auto-suppression is how quality gates rot."
          }
        },
        {
          title: "Bulk remediation with Claude Code and the re-run gate",
          body: [
            "For batch-eligible families, mirror the S/4 pattern workflow: abapGit export, one branch per family, a Claude Code instruction with the fix recipe, invariants, and a NEEDS-DECISION escape hatch, one commit per object, human PR review. Pull into the development system, run ATC on the touched objects, and compare: the family's finding count must hit zero, and no new findings may appear.",
            "Automate the comparison. Export before and after CSVs and ask Claude to diff them: findings resolved, findings unchanged, findings introduced. The 'introduced' list is the quality control on your quality control - a shrunken field list that broke a MOVE-CORRESPONDING shows up right there as a new syntax or extended-check finding."
          ],
          code: {
            language: "text",
            filename: "prompt-rerun-diff.txt",
            code: `Attached: atc_before.csv and atc_after.csv (same columns, same object scope,
exported before and after remediation branch 'atc/f01-select-star').

1. RESOLVED: findings in before but not after - count by CHECK_ID.
2. SURVIVORS: in both - list each with OBJECT/LINE; hypothesize why the fix
   missed it (dynamic code? generated include? macro?).
3. INTRODUCED: in after but not before - list ALL individually; these are
   regressions from the fix wave and block the merge.
4. Verdict per the gate: family closed yes/no.`
          }
        }
      ],
      screenshots: [
        {
          caption: "ATC findings CSV triaged into fix families",
          description: "Claude Desktop conversation: an uploaded 6,800-row ATC export answered with a CHECK_ID x priority pivot and a table of nine fix families, each with a recipe and batch-eligibility flag."
        },
        {
          caption: "Before/after ATC re-run comparison for one fix family",
          description: "Split view of atc_before.csv and atc_after.csv with Claude's diff verdict: 1,238 resolved, 2 survivors in generated includes, 0 introduced, family gate passed."
        }
      ],
      video: {
        caption: "Clearing a 6,800-finding ATC backlog in three waves",
        description: "End-to-end demo: exporting ATC results, family triage with Claude, fixing SELECT * and ORDER BY families with Claude Code over abapGit, writing one legitimate exemption, and the before/after re-run diff.",
        duration: "16:10"
      },
      sapExample: {
        title: "The month-end MCHB report that lied on HANA",
        scenario:
          "After the HANA migration, plant controllers report that ZB_BATCH_AGE_LIST, the batch-age report used to decide which stock ships first, shows different totals on consecutive runs with identical data. ATC flags the program with CI_NOORDER findings among 40 others. The team feeds the program and its findings to Claude for a root-cause-first remediation instead of blind fixing.",
        prompt: `Program ZB_BATCH_AGE_LIST (source attached, 800 lines) shows non-deterministic
group totals since our HANA migration. ATC findings for the program attached
(41 rows, includes several CI_NOORDER).

1. Trace every internal table filled by SELECT to its consumers. Classify each
   consumer ORDER-DEPENDENT (BINARY SEARCH / AT NEW / DELETE ADJACENT
   DUPLICATES / READ ... INDEX) or ORDER-FREE, citing the line numbers.
2. Explain the non-deterministic totals: which exact consumer breaks when row
   order changes?
3. Propose fixes with this preference order: sorted/hashed table types >
   ORDER BY on the SELECT > SORT before consumer. Justify per site.
4. For the remaining 41 findings: FIX recipe or ESCALATE. Do not propose
   pragmas or exemptions.`,
        code: {
          language: "abap",
          filename: "zb_batch_age_list_fix.abap",
          code: `"Root cause found by the trace: AT NEW on an unsorted SELECT result.
"BEFORE:
SELECT mchb~matnr, mchb~charg, mchb~clabs, mcha~hsdat
  FROM mchb
  INNER JOIN mcha ON mcha~matnr = mchb~matnr
                 AND mcha~werks = mchb~werks
                 AND mcha~charg = mchb~charg
  WHERE mchb~werks = @p_werks AND mchb~clabs > 0
  INTO TABLE @gt_batches.
LOOP AT gt_batches INTO gs_batch.
  AT NEW matnr.                     "wrong groups when rows arrive unsorted
    CLEAR gv_mat_total.
  ENDAT.
  gv_mat_total = gv_mat_total + gs_batch-clabs.
  AT END OF matnr.
    PERFORM write_material_total USING gs_batch-matnr gv_mat_total.
  ENDAT.
ENDLOOP.

"AFTER: group semantics made explicit - immune to database row order
SELECT mchb~matnr, mchb~charg, mchb~clabs, mcha~hsdat
  FROM mchb
  INNER JOIN mcha ON mcha~matnr = mchb~matnr
                 AND mcha~werks = mchb~werks
                 AND mcha~charg = mchb~charg
  WHERE mchb~werks = @p_werks AND mchb~clabs > 0
  ORDER BY mchb~matnr, mchb~charg
  INTO TABLE @DATA(lt_batches).

LOOP AT lt_batches INTO DATA(ls_batch)
     GROUP BY ( matnr = ls_batch-matnr ) INTO DATA(lo_group).
  DATA(lv_total) = REDUCE menge_d( INIT s TYPE menge_d
                                   FOR <m> IN GROUP lo_group
                                   NEXT s = s + <m>-clabs ).
  write_material_total( iv_matnr = lo_group-matnr iv_total = lv_total ).
ENDLOOP.`
        },
        explanation: [
          "The prompt's structure is the lesson: root cause before remediation. Asking Claude to trace producer-to-consumer order dependencies found the one AT NEW that made totals non-deterministic - the defect controllers saw - and simultaneously produced the ORDER-DEPENDENT/ORDER-FREE classification that decides which of the CI_NOORDER findings get ORDER BY and which get fixed differently.",
          "The chosen fix upgrades the code rather than patching it: LOOP AT ... GROUP BY with a REDUCE makes the grouping independent of physical row order, so the class of bug is eliminated, not just this instance. The ORDER BY stays for stable output ordering, which the report consumers expect on paper anyway.",
          "Note the last line of the prompt: 'Do not propose pragmas or exemptions.' On a program with a known live defect, every suppression proposal is noise. The team added exactly one \"#EC CI_NOORDER later - on a pure existence-check SELECT SINGLE - through their normal review, with a dated justification."
        ]
      },
      bestPractices: [
        "Triage exported findings by fix family, not one by one; the family recipe is what makes bulk work reviewable.",
        "For SELECT * fixes, derive the field list from actual downstream usage and mark wholesale-row consumers NEEDS-DECISION.",
        "Treat missing-ORDER-BY findings as correctness bugs ranked by business criticality; they fail silently on HANA.",
        "Fix dynamic SQL by preferring static SQL, then cl_abap_dyn_prg escaping/allow-listing; never batch-fix injection findings blind.",
        "Require a dated justification comment on every pragma/pseudo-comment and route exemptions through the quality manager.",
        "Instruct Claude to output only FIX or ESCALATE - suppression is a human decision with a signature.",
        "Gate every fix wave on the before/after ATC re-run diff: resolved, survivors, and zero introduced findings."
      ],
      commonMistakes: [
        {
          mistake: "Shrinking a SELECT * field list without checking downstream consumers that use the full row.",
          fix: "Trace usage first; where the row is passed on wholesale, mark NEEDS-DECISION and fix the consumer contract before the SELECT."
        },
        {
          mistake: "Adding ORDER BY PRIMARY KEY to every flagged SELECT indiscriminately.",
          fix: "Classify consumers as order-dependent or order-free; pay the sort cost only where a dependency exists, or remove the dependency with sorted/hashed tables."
        },
        {
          mistake: "Letting Claude propose pseudo-comments and exemptions as 'fixes'.",
          fix: "Constrain outputs to FIX or ESCALATE. Suppressions require human analysis, a dated justification, and (for exemptions) approver sign-off."
        },
        {
          mistake: "Escaping dynamic column or table names with escape_quotes.",
          fix: "escape_quotes protects value literals only; identifiers must be validated with cl_abap_dyn_prg=>check_column_name / check_table_name_str or an explicit allow-list."
        },
        {
          mistake: "Merging a bulk-fix branch because the diff looked clean.",
          fix: "Run ATC on the touched objects after import and diff before/after exports; zero introduced findings is part of the merge gate."
        }
      ],
      tips: [
        "Sort the attack plan by PRIO 1+2 findings cleared per day of effort; that metric aligns the team with the transport gate.",
        "Keep the ATC check variant text handy and paste it with the export so Claude knows exactly which checks produced which codes.",
        "Ask Claude for a regex per fix family to grep the abapGit repo; it catches occurrences in rarely-executed includes that ATC baselined.",
        "Survivor findings after a wave are usually generated code or macros - handle them manually and note the pattern for next time.",
        "Track your suppression count as a KPI alongside findings; a falling findings curve with a rising pragma curve is a red flag."
      ],
      exercise: {
        title: "Run a fix-family wave end to end",
        scenario:
          "Your ATC export for package ZB_LOGISTICS shows 412 findings: 240 SELECT * (PRIO 3), 88 missing ORDER BY (PRIO 2), 61 obsolete statements (PRIO 3), 18 dynamic WHERE findings (PRIO 1), 5 findings on a SELECT SINGLE existence check. The transport gate blocks PRIO 1+2. The package is in an abapGit repo.",
        tasks: [
          "Decide the wave order and justify it against the transport gate and silent-failure risk.",
          "Write the Claude prompt that classifies the 88 ORDER BY findings into order-dependent and order-free with evidence.",
          "Write the fix for one dynamic WHERE finding assuming the value comes from a selection screen parameter.",
          "Decide what happens to the 5 existence-check findings and write the exact code/comment if you suppress.",
          "Define the merge gate for the wave branch."
        ],
        hint: "PRIO 1 injection findings are few and need eyes-on each; the 88 PRIO 2 ORDER BY findings block transports AND fail silently - they are your first bulk wave.",
        solution: {
          language: "abap",
          filename: "solution-wave.abap",
          code: `"WAVE ORDER: 1) 18 dynamic WHERE (PRIO 1, manual, eyes-on each)
"            2) 88 ORDER BY (PRIO 2 gate-blockers, silent-failure risk, bulk
"               after dependency classification)
"            3) 240 SELECT * + 61 obsolete (PRIO 3, batch-eligible)
"            5 existence checks: review individually, suppress only if true.

"Task 3 - dynamic WHERE fix (input from selection screen):
"BEFORE:
"CONCATENATE 'LGORT = ''' p_lgort '''' INTO lv_where.
"AFTER - static SQL, dynamics eliminated:
SELECT matnr, lgort, labst
  FROM mard
  WHERE werks = @p_werks
    AND lgort = @p_lgort          "static beats escaped-dynamic
  ORDER BY matnr
  INTO TABLE @DATA(lt_stock).

"Task 4 - existence check, suppression WITH signature:
"Reason: pure existence check, result order irrelevant (reviewed 2026-07, AM)
SELECT SINGLE @abap_true FROM zb_line_stop
  WHERE werks = @p_werks AND line_id = @iv_line
  INTO @DATA(lv_stopped).                          "#EC CI_NOORDER

"MERGE GATE for branch atc/zb-logistics-wave1:
"[ ] PR approved by senior dev  [ ] ATC re-run on touched objects
"[ ] 0 introduced findings      [ ] PRIO 1+2 count for package = 0
"[ ] ABAP Unit green            [ ] suppressions: 1, justified + dated`
        }
      },
      quiz: [
        {
          question: "Why do missing-ORDER-BY findings deserve priority beyond their ATC priority rating?",
          options: [
            "They always cause short dumps in production",
            "On HANA the old accidental ordering is gone, so order-dependent consumers produce silently wrong results",
            "They prevent transports from being created",
            "HANA requires ORDER BY on every SELECT"
          ],
          correctIndex: 1,
          explanation: "BINARY SEARCH, AT NEW, and DELETE ADJACENT DUPLICATES relied on ordering that anyDB primary-index access happened to provide. On HANA results arrive in any order, and the failures are wrong numbers, not dumps."
        },
        {
          question: "A SELECT * result is passed wholesale to a FORM in another include. What should Claude's output be for this finding?",
          options: [
            "A shortened field list based on the LOOP that follows",
            "A pragma to suppress the finding",
            "NEEDS-DECISION: the consumer contract must be examined before narrowing the selection",
            "Conversion to SELECT SINGLE"
          ],
          correctIndex: 2,
          explanation: "Narrowing the field list can break distant consumers of the full row. These sites need a human decision about the data contract; batch rewriting them is how fix waves cause regressions."
        },
        {
          question: "Which is the correct tool for securing a dynamic COLUMN name in a WHERE clause?",
          options: [
            "cl_abap_dyn_prg=>escape_quotes",
            "cl_abap_dyn_prg=>check_column_name or an explicit allow-list",
            "Wrapping the name in single quotes",
            "TRY/CATCH around the SELECT"
          ],
          correctIndex: 1,
          explanation: "escape_quotes protects value literals. Identifiers (columns, tables) must be validated against expected names - check_column_name/check_table_name_str or an allow-list - or the injection remains."
        },
        {
          question: "What makes a pseudo-comment like \"#EC CI_NOORDER acceptable in the bottler's governance?",
          options: [
            "The finding count was too high to fix",
            "Claude recommended it",
            "A dated justification documents the analysis, and it survives code review",
            "The developer plans to fix it after go-live"
          ],
          correctIndex: 2,
          explanation: "A suppression is a signed 'inspected and safe' statement. Without documented analysis and review it is just a hidden defect - which is why Claude is instructed to propose only FIX or ESCALATE."
        }
      ],
      summary: [
        "Export ATC findings and triage into fix families; the family recipe drives bulk work, priorities drive sequencing against the transport gate.",
        "The classic families have known shapes: usage-derived field lists for SELECT *, dependency-classified ORDER BY fixes, static-first dynamic SQL hardening, mechanical 7.40+ modernization.",
        "Pragmas and exemptions are governance instruments requiring human analysis, dated justification, and approval - never AI-proposed shortcuts.",
        "Every wave closes with a before/after re-run diff: resolved, survivors explained, zero introduced."
      ],
      download: {
        name: "ATC Remediation Prompt Pack",
        description: "Triage, fix-family, and re-run diff prompts plus the suppression governance checklist.",
        filename: "atc-remediation-prompts.md",
        content: `# ATC Remediation Prompt Pack

## Triage prompt
\`\`\`
Attached: ATC export CSV (CHECK_ID, MESSAGE_CODE, PRIO, OBJECT, INCLUDE, LINE,
MESSAGE_TEXT). Gate: PRIO 1+2 block transports.
1) Pivot CHECK_ID x PRIO. 2) Group into FIX FAMILIES (one recipe fixes all):
count, PRIO mix, recipe, batch-eligible?, reviewer checklist. 3) Rank families
by PRIO 1+2 cleared per effort-day; give a 2-week plan for 3 devs.
4) List finding types that must NEVER be auto-fixed.
\`\`\`

## SELECT * fix prompt
\`\`\`
For each SELECT * below (with its consuming code): derive the used-field set,
rewrite with explicit fields + inline declaration, keep semantics identical.
If the row is passed on wholesale (FORM/method/MOVE-CORRESPONDING), output
NEEDS-DECISION with the consumer location instead of a rewrite.
\`\`\`

## ORDER BY classification prompt
\`\`\`
Trace each flagged SELECT's target table to all consumers. Classify each
consumer ORDER-DEPENDENT (BINARY SEARCH, AT NEW/AT END, DELETE ADJACENT
DUPLICATES, READ ... INDEX) or ORDER-FREE with line-number evidence.
Fix preference: sorted/hashed table type > ORDER BY > SORT before consumer.
\`\`\`

## Dynamic SQL prompt
\`\`\`
For each dynamic WHERE/FROM below: state where the input originates.
Prefer: 1) static SQL rewrite; 2) cl_abap_dyn_prg=>escape_quotes for values,
check_column_name/check_table_name_str for identifiers. Output FIX or
ESCALATE only. Never propose suppression.
\`\`\`

## Re-run diff prompt
\`\`\`
Attached: atc_before.csv, atc_after.csv (same scope). Report RESOLVED (by
check), SURVIVORS (each, with hypothesis), INTRODUCED (each - merge blockers).
Verdict: family closed yes/no.
\`\`\`

## Suppression governance checklist
- [ ] Suppression proposed by a human, not the model
- [ ] Dated justification comment at the site (who, why, when)
- [ ] Pseudo-comment/pragma matches the exact check (\\"#EC ... / ##...)
- [ ] Exemptions: rationale filed, quality manager approved, time-boxed
- [ ] Suppression count tracked as KPI next to findings count

## Wave merge gate
- [ ] PR reviewed  - [ ] ATC re-run on touched objects
- [ ] 0 introduced findings  - [ ] gate-relevant PRIO count = 0
- [ ] ABAP Unit green  - [ ] survivors converted to backlog
`
      },
      relatedSlugs: ["s4hana-migration", "claude-code", "code-reviews", "performance-optimization"]
    },
    {
      slug: "cds-views",
      title: "CDS Views with Claude",
      description:
        "Generate and review CDS view entities with Claude: DDL syntax, associations, UI and analytics annotations, DCL access control, and converting classic SE11 views and reports to CDS.",
      duration: 30,
      level: "Intermediate",
      keywords: [
        "CDS views",
        "DDL",
        "annotations",
        "associations",
        "access control",
        "DCL",
        "view entity",
        "code pushdown"
      ],
      overview: [
        "CDS view entities are the data backbone of S/4HANA development: they feed Fiori Elements apps, analytical queries, RAP business objects, and OData services, and they carry semantics (currencies, quantities, texts, authorization) as annotations instead of ABAP code. For a team raised on SE11 views and ALV report loops, the shift is less about SQL and more about learning the annotation vocabulary and the layered view architecture (basic/interface layer, composite, consumption).",
        "Claude is unusually effective here because CDS is declarative text with strong conventions. It generates syntactically correct DDL with associations and annotations from a plain-language spec, converts classic SE11 database views and SELECT-heavy reports into view stacks, and - the underrated use case - explains an existing five-layer standard view stack (I_SalesDocument and friends) when you need to know where a field actually comes from.",
        "This lesson builds the bottler's route-profitability view stack step by step: interface views on the custom ZCC tables, associations to standard entities, UI and analytics annotations for consumption, and a DCL role so plant analysts see only their own sales organization. Along the way you will learn the review checklist for AI-generated CDS, because a view that activates is not yet a view that is correct."
      ],
      objectives: [
        "Generate CDS view entities from plain-language specs with correct DDL syntax and naming conventions",
        "Model associations and expose them properly instead of hard joins where consumers need flexibility",
        "Apply annotation groups deliberately: @AccessControl, @Semantics, @UI, @Analytics",
        "Convert SE11 views and classic reports to layered CDS stacks with Claude",
        "Write and review DCL access controls, and use Claude to explain existing view stacks"
      ],
      steps: [
        {
          title: "Spec in, view entity out",
          body: [
            "Give Claude the target tables with their key fields, the layering convention, and your naming standard, and ask for a basic interface view. Insist on modern DEFINE VIEW ENTITY (not the obsolete DDIC-based DEFINE VIEW), explicit key definitions, and @Semantics annotations for every amount and quantity - the classic omission that later breaks aggregation in analytics.",
            "The prompt below is the reusable shape: context, tables, conventions, and an explicit list of what must be annotated. Vague prompts produce views that activate but carry no semantics; the annotation requirements are the difference between a demo and an artifact you can build on."
          ],
          code: {
            language: "text",
            filename: "prompt-cds-generate.txt",
            code: `Generate a CDS view entity (DEFINE VIEW ENTITY, ABAP 7.5+/S4 2023 syntax).

Context: beverage bottler. Table ZCC_ROUTE_SETTL holds route settlement lines:
MANDT, ROUTE_ID (key), SETTL_DATE (key), VKORG, KUNNR, MATNR,
QTY_CASES (QUAN 13.3, unit field QTY_UOM), REVENUE (CURR 15.2, currency
field CURR_CODE), DEPOSIT_AMT (CURR 15.2, same currency), DRIVER_ID.

Requirements:
- Name: ZCC_I_RouteSettlement, @AccessControl.authorizationCheck: #CHECK
- Keys marked, camelCase aliases for all fields
- @Semantics.amount/quantity annotations wired to the unit/currency fields
- Associations (exposed, not joined): _Customer to I_Customer on KUNNR,
  _Material to I_Material (composition later), _Route to zcc_i_route
- @ObjectModel.usageType annotations suitable for a transactional interface view
- No parameters yet.`
          }
        },
        {
          title: "Associations over joins",
          body: [
            "Associations are lazy joins: they cost nothing until a consumer follows the path, and they make the view reusable because each consumer decides what to expand. The rule of thumb the team enforces: interface views expose associations; only consumption views (or measures that genuinely need it) resolve them into columns.",
            "When reviewing generated DDL, check the ON conditions first - Claude gets the syntax right effortlessly but can guess wrong about client handling, leading zeros, or which standard view is the released association target on your release. Verify association targets exist in your system (ADT: Ctrl+Shift+A) before you build three layers on top."
          ],
          code: {
            language: "cds",
            filename: "zcc_i_routesettlement.ddls.asddls",
            code: `@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Route Settlement - Interface View'
@VDM.viewType: #BASIC
@ObjectModel.usageType: {
  serviceQuality: #A,
  sizeCategory: #L,
  dataClass: #TRANSACTIONAL
}
define view entity ZCC_I_RouteSettlement
  as select from zcc_route_settl
  association [0..1] to I_Customer     as _Customer on $projection.Customer = _Customer.Customer
  association [0..1] to I_Material     as _Material on $projection.Material = _Material.Material
  association [0..1] to ZCC_I_Route    as _Route    on $projection.RouteId  = _Route.RouteId
{
  key route_id        as RouteId,
  key settl_date      as SettlementDate,
      vkorg           as SalesOrganization,
      kunnr           as Customer,
      matnr           as Material,

      @Semantics.quantity.unitOfMeasure: 'QuantityUnit'
      qty_cases       as QuantityCases,
      qty_uom         as QuantityUnit,

      @Semantics.amount.currencyCode: 'Currency'
      revenue         as Revenue,
      @Semantics.amount.currencyCode: 'Currency'
      deposit_amt     as DepositAmount,
      curr_code       as Currency,

      driver_id       as DriverId,

      /* Exposed associations - consumers decide what to follow */
      _Customer,
      _Material,
      _Route
}`
          }
        },
        {
          title: "Consumption layer: UI and analytics annotations",
          body: [
            "The consumption view is where @UI and @Analytics annotations turn data into an application. For a Fiori Elements list report you annotate selection fields, line items with positions, and header info; for embedded analytics you set @Analytics.query: true with @AggregationDefault on measures and axis defaults on dimensions. Ask Claude for one concern per view - a query view and a UI consumption view are different artifacts even over the same interface view.",
            "Generated annotation blocks tend to be over-complete. Prune what you do not need: every annotation is a maintenance commitment, and a list report with forty @UI.lineItem positions helps nobody. The review question is 'what does the app actually show?', not 'what could it show?'."
          ],
          code: {
            language: "cds",
            filename: "zcc_c_routeprofitq.ddls.asddls",
            code: `@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Route Profitability - Analytical Query'
@Analytics.query: true
define view entity ZCC_C_RouteProfitabilityQ
  as select from ZCC_I_RouteSettlement
{
      @AnalyticsDetails.query.display: #KEY_TEXT
      @AnalyticsDetails.query.axis: #ROWS
  key RouteId,

      @AnalyticsDetails.query.axis: #ROWS
      SalesOrganization,

      @AnalyticsDetails.query.axis: #FREE
      Customer,

      @AnalyticsDetails.query.axis: #COLUMNS
      SettlementDate,

      @Semantics.amount.currencyCode: 'Currency'
      @DefaultAggregation: #SUM
      Revenue,

      @Semantics.amount.currencyCode: 'Currency'
      @DefaultAggregation: #SUM
      DepositAmount,

      @Semantics.amount.currencyCode: 'Currency'
      @DefaultAggregation: #SUM
      @EndUserText.label: 'Net Revenue'
      cast( Revenue - DepositAmount as abap.curr(15,2) ) as NetRevenue,

      Currency
}`
          },
          callout: {
            type: "tip",
            title: "One concern per view",
            body: "Resist the mega-view with UI, analytics, and search annotations together. Layer instead: interface view (semantics), then one consumption view per use - Fiori list, analytical query, value help. Claude happily generates whichever you ask; you have to do the asking discipline."
          }
        },
        {
          title: "Converting SE11 views and classic reports",
          body: [
            "For SE11 database views the conversion is mostly mechanical: paste the join conditions and field list, get a view entity with proper aliases and semantics. The judgment call is layering - a straight one-to-one conversion of forty ZV* views reproduces your spaghetti in new syntax. Ask Claude to first propose which views collapse into shared interface views plus thin consumption layers.",
            "Classic reports convert differently: the SELECT/LOOP/collect logic becomes aggregation, CASE expressions, and calculated columns pushed into the view, with the report shrinking to an ALV over the CDS entity (or disappearing into a Fiori list report). Paste the whole report and ask Claude to split it: what moves into CDS, what stays as ABAP (interaction, authority checks beyond DCL scope, output)."
          ],
          code: {
            language: "text",
            filename: "prompt-report-to-cds.txt",
            code: `Below is classic report ZB_DAILY_FILLING_OUTPUT (500 lines): selects AFKO/AFPO
plus ZB_LINE_MASTER, loops to compute per-line fill rates and scrap %, COLLECTs
into a totals table, writes ALV.

1. Split the logic: PUSHDOWN (goes into CDS: joins, aggregation, CASE-based
   classifications, rate calculations) vs KEEP-IN-ABAP (selection screen,
   authority check on plant, ALV events, export button).
2. Generate the CDS stack: ZB_I_FillingOrderItem (interface, semantics),
   ZB_C_DailyFillingOutput (aggregation by line + day, with parameters
   p_plant and p_date).
3. Generate the replacement report: 30 lines max, SELECT from the parameterized
   consumption view into an ALV IDA or cl_salv_table.
4. List behavior differences I must test (rounding, zero-output lines, units).`
          }
        },
        {
          title: "Access control with DCL",
          body: [
            "@AccessControl.authorizationCheck: #CHECK is a promise you must keep with a DCL source, or every read on some releases logs warnings and, worse, the view silently protects nothing it claimed to protect. Generate the DCL together with the view: the standard pattern maps a PFCG authorization object (here V_VBAK_VKO-style on sales organization) to a WHERE-like condition on the view's fields.",
            "Have Claude review DCL for the two classic mistakes: conditions on non-key fields that consumers can alias away in upper layers, and inherited roles missing when a consumption view selects from a protected interface view (inheritance is the default, but redefinitions and #NOT_REQUIRED escape hatches sneak in during 'it does not work' debugging and never leave)."
          ],
          code: {
            language: "cds",
            filename: "zcc_i_routesettlement.dcls.asdcls",
            code: `@EndUserText.label: 'Access control: Route Settlement by Sales Org'
@MappingRole: true
define role ZCC_I_ROUTESETTLEMENT {
  grant select on ZCC_I_RouteSettlement
    where ( SalesOrganization ) =
      aspect pfcg_auth( zcc_vkorg, VKORG, actvt = '03' );
}`
          },
          callout: {
            type: "warning",
            title: "#NOT_REQUIRED is a decision, not a default",
            body: "Every view Claude generates with @AccessControl.authorizationCheck: #NOT_REQUIRED must be challenged in review. It is correct for value helps and some basic views - and a data-leak bug on anything a user can query directly."
          }
        },
        {
          title: "Explaining existing view stacks",
          body: [
            "The read-direction use case pays off daily: when a Fiori app shows a wrong margin, the answer is buried four views deep. Collect the DDL sources of the stack (ADT: open each level, or pull from abapGit) and paste them together, then ask Claude to trace one output field to its origin: every rename, cast, currency conversion, and CASE it passes through, plus which associations and DCL apply on the path.",
            "This works on standard content too. Tracing how I_SalesDocumentItem derives a pricing field, or which layer of an analytical stack introduces a restriction, is exactly the archaeology Claude is good at - and the explanation becomes documentation you paste into the incident ticket."
          ]
        }
      ],
      screenshots: [
        {
          caption: "Generated interface view with semantics annotations in ADT",
          description: "Eclipse ADT showing ZCC_I_RouteSettlement DDL side by side with the Claude conversation that generated it, activation successful, annotation view open on the Revenue field."
        },
        {
          caption: "Field-origin trace through a four-level CDS stack",
          description: "Claude's answer tracing NetRevenue from the analytical query down to zcc_route_settl-revenue and deposit_amt, listing each cast, alias, and the DCL role applied at the interface layer."
        }
      ],
      video: {
        caption: "Building the route-profitability CDS stack with Claude",
        description: "From ZCC_ROUTE_SETTL table to interface view, analytical query, and DCL role: generating each layer with Claude, reviewing annotations in ADT, testing with the data preview, and tracing a field through the finished stack.",
        duration: "13:40"
      },
      sapExample: {
        title: "Route profitability: from ZCC table to protected analytical query",
        scenario:
          "Sales controlling wants route-level profitability (revenue minus deposits, cases sold) sliceable by sales organization and customer, in an embedded analytics story - by Friday. The data sits in ZCC_ROUTE_SETTL. Plant analysts may only see their own sales organization. A developer pairs with Claude to build the three artifacts: interface view, analytical query, DCL.",
        prompt: `Build a CDS stack on table ZCC_ROUTE_SETTL (DDIC definition pasted below).

Layers:
1. ZCC_I_RouteSettlement - interface view entity: keys ROUTE_ID + SETTL_DATE,
   camelCase aliases, @Semantics for QTY_CASES (unit QTY_UOM) and the two
   amounts (currency CURR_CODE), exposed associations to I_Customer,
   I_Material, ZCC_I_Route. @AccessControl #CHECK.
2. ZCC_C_RouteProfitabilityQ - @Analytics.query: true, rows RouteId +
   SalesOrganization, columns SettlementDate, free Customer; measures
   Revenue, DepositAmount, and calculated NetRevenue = Revenue - DepositAmount
   (cast curr 15.2), all #SUM.
3. DCL for the interface view: sales org via pfcg_auth on our custom auth
   object ZCC_VKORG (field VKORG, actvt 03).

Then: list 5 things a reviewer should verify before transport, specific to
this stack.`,
        code: {
          language: "cds",
          filename: "zcc_i_route.ddls.asddls",
          code: `/* Supporting dimension view generated in the same session */
@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Route Master - Interface View'
@ObjectModel.representativeKey: 'RouteId'
define view entity ZCC_I_Route
  as select from zcc_route_mast
  association [0..1] to ZCC_I_RouteText as _Text
    on $projection.RouteId = _Text.RouteId
{
      @ObjectModel.text.association: '_Text'
  key route_id     as RouteId,
      vkorg        as SalesOrganization,
      truck_type   as TruckType,
      depot_id     as DepotId,
      valid_from   as ValidFrom,
      valid_to     as ValidTo,

      _Text
}`
        },
        explanation: [
          "The stack came back activation-clean, but the value was in the review step the prompt demanded. Claude's own five-point reviewer list flagged that NetRevenue subtracts DepositAmount without checking both amounts share CURR_CODE - true in this table by design, but only because settlement lines are single-currency; the reviewer added a comment documenting that invariant so the next developer does not 'fix' it with a conversion.",
          "The DCL worked on first activation but initially granted on _Route.SalesOrganization through the association path - Claude's plausible guess. The team corrected it to the view's own SalesOrganization field: authorization conditions should sit on the protected view's projection, where they cannot be bypassed by a consumer that never follows the association.",
          "Total elapsed time was under a day, with roughly half spent in ADT data preview and the Fiori story verifying numbers against the old Excel process. That ratio - generation fast, verification human - is the healthy shape of CDS work with Claude, and it is why annotation discipline (semantics wired correctly) matters more than raw generation speed."
        ]
      },
      bestPractices: [
        "Always generate DEFINE VIEW ENTITY with explicit @Semantics on every amount and quantity; retrofitting semantics later breaks consumers.",
        "Expose associations in interface views; resolve them only in consumption layers that need columns.",
        "Keep one concern per view: interface semantics, analytical query, UI consumption, and value help are separate artifacts.",
        "Verify that association targets and released standard views exist on your release before layering on top.",
        "Generate the DCL in the same session as any #CHECK view, and challenge every #NOT_REQUIRED in review.",
        "Convert SE11 view portfolios by first asking Claude for a consolidation proposal, not one-to-one translation.",
        "Test with ADT data preview against known figures before wiring a Fiori story to a new stack."
      ],
      commonMistakes: [
        {
          mistake: "Accepting generated views without @Semantics.amount/quantity wiring because they activate fine.",
          fix: "Activation checks syntax, not meaning. Review every measure's unit/currency reference; analytics aggregation depends on it."
        },
        {
          mistake: "Hard-joining customer, material, and text tables in the interface view.",
          fix: "Model them as exposed associations; joins in the base layer force every consumer to pay for data it may not need."
        },
        {
          mistake: "Trusting Claude's guess of standard association targets (I_* views) that differ per release.",
          fix: "Check each referenced entity exists and is released in your system (ADT element info / released-objects list) before building on it."
        },
        {
          mistake: "Shipping @AccessControl.authorizationCheck: #CHECK without a DCL, or #NOT_REQUIRED without a documented reason.",
          fix: "#CHECK and its DCL travel together in one transport; #NOT_REQUIRED requires an explicit review decision recorded in the source."
        },
        {
          mistake: "Converting a classic report by moving all logic including authority checks into the view.",
          fix: "Split deliberately: set operations push down; interaction, non-data authorization, and output stay in ABAP. Test rounding and unit edge cases."
        }
      ],
      tips: [
        "Keep your naming and layering convention (ZCC_I_/ZCC_C_, VDM view types) in the context pack; Claude follows it consistently once stated.",
        "Ask for the reviewer checklist with every generated stack - Claude critiquing its own output catches real issues surprisingly often.",
        "Paste activation errors verbatim; CDS messages are cryptic and Claude usually decodes the actual cause instantly.",
        "For field-origin questions, paste the whole stack in one message; per-view questions lose the cross-layer renames.",
        "Use parameters (WITH PARAMETERS) instead of hoping consumers filter; Claude adds them cleanly when the prompt names them."
      ],
      exercise: {
        title: "Convert an SE11 view cluster to a CDS stack",
        scenario:
          "Package ZB_QUALITY has three SE11 views used by four reports: ZV_QM_LOT (QALS join MARA), ZV_QM_RESULT (QALS join QAVE), ZV_QM_LOT_PLANT (same as ZV_QM_LOT plus T001W). Reports compute lot rejection rates per plant and material group. You must deliver a CDS stack plus one analytical query, with plant-level access control on a custom auth object ZB_WERKS.",
        tasks: [
          "Write the consolidation prompt: which SE11 views collapse into which interface views, and why.",
          "Generate the interface view for inspection lots with semantics and associations (spec it in the prompt: keys, measures, targets).",
          "Generate the analytical query with rejection rate as a calculated measure - decide and document how you avoid division by zero.",
          "Write the DCL for plant-level access.",
          "List the verification steps before you delete the old SE11 views."
        ],
        hint: "Three overlapping SE11 views usually collapse into one interface view plus associations; the T001W variant is just a followed association, not a separate base view.",
        solution: {
          language: "cds",
          filename: "solution-zb_c_lotrejectionq.ddls.asddls",
          code: `/* Interface layer: ONE view replaces ZV_QM_LOT + ZV_QM_LOT_PLANT
   (plant data via _Plant association), ZV_QM_RESULT folds in via join
   because usage decision is 1:1 to the lot here. */
@AccessControl.authorizationCheck: #CHECK
@Analytics.query: true
@EndUserText.label: 'Lot Rejection Rate - Query'
define view entity ZB_C_LotRejectionQ
  as select from ZB_I_InspectionLot
{
      @AnalyticsDetails.query.axis: #ROWS
  key Plant,
      @AnalyticsDetails.query.axis: #ROWS
      MaterialGroup,

      @DefaultAggregation: #SUM
      LotCount,
      @DefaultAggregation: #SUM
      RejectedCount,

      /* rate computed division-safe; #FORMULA avoids wrong AVG-of-rates */
      @DefaultAggregation: #FORMULA
      @EndUserText.label: 'Rejection Rate %'
      cast( case when LotCount > 0
                 then ( RejectedCount * 100 ) / LotCount
                 else 0 end as abap.dec(7,2) ) as RejectionRatePct
}

/* DCL for the interface view:
define role ZB_I_INSPECTIONLOT {
  grant select on ZB_I_InspectionLot
    where ( Plant ) = aspect pfcg_auth( zb_werks, WERKS, actvt = '03' );
}
Verification before deleting SE11 views: where-used on all 3 views,
data preview totals vs old reports (3 plants, 2 periods), auth test with
a single-plant test user, transport sequence view->DCL->reports. */`
        }
      },
      quiz: [
        {
          question: "Why should interface views expose associations instead of resolving them as joins?",
          options: [
            "Associations are the only join type HANA supports",
            "Joins are forbidden in view entities",
            "Associations are evaluated only when followed, keeping the base view cheap and reusable for consumers with different needs",
            "Associations bypass access control"
          ],
          correctIndex: 2,
          explanation: "An unused exposed association costs nothing at runtime. Hard joins in the base layer make every consumer pay for every joined table, and force new views when needs differ."
        },
        {
          question: "A generated view with @AccessControl.authorizationCheck: #CHECK activates and returns data in your developer session. What is still possibly wrong?",
          options: [
            "Nothing - activation proves the view is secure",
            "Without a matching DCL role, the declared check protects nothing for end users",
            "#CHECK requires a parameter",
            "The view must also set #NOT_REQUIRED"
          ],
          correctIndex: 1,
          explanation: "#CHECK is a declaration that a DCL will enforce access. Developers with broad authorizations see data either way; the missing DCL surfaces as unprotected data (and warnings) for real users."
        },
        {
          question: "What is the main risk of missing @Semantics.amount.currencyCode on a measure?",
          options: [
            "The view fails to activate",
            "A syntax warning in ADT only",
            "Analytics and Fiori consumers aggregate and display the amount without currency handling, mixing currencies silently",
            "The field becomes read-only"
          ],
          correctIndex: 2,
          explanation: "The view activates fine - semantics annotations are meaning, not syntax. Downstream aggregation across currencies without the reference is the classic silent-wrong-numbers bug."
        },
        {
          question: "When converting a classic report to CDS, which part should typically stay in ABAP?",
          options: [
            "The GROUP BY aggregation",
            "CASE-based classifications of rows",
            "Selection-screen interaction, ALV events, and authorization logic beyond DCL scope",
            "The joins between header and item tables"
          ],
          correctIndex: 2,
          explanation: "Set operations belong in the view (code pushdown). Interaction, output events, and non-data-scoped authorization remain application logic in the thin remaining report."
        }
      ],
      summary: [
        "Claude generates activation-clean CDS quickly; your review focus is semantics annotations, association targets, and layering discipline.",
        "Interface views carry keys, semantics, and exposed associations; consumption views carry @UI or @Analytics - one concern per view.",
        "#CHECK views ship with their DCL in the same transport, and every #NOT_REQUIRED is an explicit, documented review decision.",
        "Convert SE11 portfolios via consolidation proposals, and use stack-tracing prompts to debug and document existing view hierarchies."
      ],
      download: {
        name: "CDS Generation and Review Kit",
        description: "Prompt templates for generating, converting, and reviewing CDS view stacks, plus the pre-transport checklist.",
        filename: "cds-views-prompt-kit.md",
        content: `# CDS Views with Claude - Prompt Kit

## Generation prompt skeleton
\`\`\`
Generate a CDS view entity (DEFINE VIEW ENTITY, S/4 2023 syntax).
Table(s): <DDIC definitions>. Name: <Z.._I_...> per our convention.
Keys: <...>. camelCase aliases. @Semantics for every amount (currency field
<..>) and quantity (unit field <..>). Associations (EXPOSED, not joined):
<_Assoc -> target ON ...>. @AccessControl: #CHECK.
Also output: the matching DCL and a 5-point reviewer checklist.
\`\`\`

## Report-to-CDS conversion prompt
\`\`\`
Classic report pasted below. 1) Split logic: PUSHDOWN (joins, aggregation,
CASE, rates) vs KEEP-IN-ABAP (selection screen, auth, ALV events).
2) Generate the stack: interface view + parameterized consumption view.
3) Replacement report <=30 lines over the consumption view.
4) List behavior differences to test (rounding, zero rows, units).
\`\`\`

## SE11 consolidation prompt
\`\`\`
Here are <n> SE11 view definitions and their consumers. Propose the minimal
set of interface views + associations that replaces them. Map old view ->
new view/path. Flag consumers needing code changes beyond the FROM clause.
\`\`\`

## Stack-explanation prompt
\`\`\`
DDL sources of a view stack pasted below (all layers). Trace field <X> in
<top view> to its physical origin: every alias, cast, calculation,
association, and the DCL applied on the path. Output as a table per layer.
\`\`\`

## Pre-transport review checklist
- [ ] DEFINE VIEW ENTITY (not obsolete DDIC-based DEFINE VIEW)
- [ ] Every amount/quantity has @Semantics wired to a field IN this view
- [ ] Associations exposed in interface layer; ON conditions verified
- [ ] Referenced I_* targets exist and are released on our release
- [ ] #CHECK <-> DCL pair in the same transport; #NOT_REQUIRED justified
- [ ] Data preview totals verified against a known-good source
- [ ] Naming/layering per convention (I_/C_, VDM annotations)
`
      },
      relatedSlugs: ["rap-development", "odata", "eclipse-adt", "s4hana-migration"]
    },
    {
      slug: "rap-development",
      title: "RAP Development with Claude",
      description:
        "Generate full RAP stacks with Claude: behavior definitions (managed and unmanaged), behavior implementations, EML, validations, determinations, actions, draft handling, and EML-based ABAP Unit tests.",
      duration: 40,
      level: "Advanced",
      keywords: [
        "RAP",
        "behavior definition",
        "BDEF",
        "EML",
        "managed scenario",
        "draft handling",
        "determinations",
        "ABAP Unit"
      ],
      overview: [
        "The RESTful ABAP Programming model (RAP) is the prescribed way to build transactional apps and services in S/4HANA and BTP ABAP: CDS entities for data, behavior definitions (BDEF) for the transactional contract, behavior implementations in ABAP, and service definitions/bindings for OData exposure. For developers coming from BAPI-and-dynpro land, the hard part is not any single artifact - it is that a working business object needs five artifacts wired together with exact naming and typing conventions.",
        "That wiring is precisely what Claude is good at. Given a spec, it generates the whole vertical slice - table, interface and projection views, BDEF with the right implementation type, the behavior pool with handler methods whose signatures actually match the BDEF, and the service definition - consistently named and cross-referenced. The failure mode is equally characteristic: plausible code against the wrong RAP flavor (managed vs unmanaged, draft vs non-draft) or outdated syntax, which is why every prompt must pin the scenario precisely.",
        "This lesson builds the bottler's Returnable Container Contract object - plants lend crates and kegs to customers under contract - as a managed, draft-enabled RAP BO with validations, a determination, and an action, then tests it with EML in ABAP Unit. Along the way you learn the review points that matter: authorization handling, numbering, side effects of determinations, and where unmanaged scenarios (wrapping the existing ZCC settlement engine) are the honest choice."
      ],
      objectives: [
        "Pin the RAP scenario (managed/unmanaged, draft, strict mode) in prompts so generated code targets the right flavor",
        "Generate a complete RAP vertical slice from a spec: table, CDS, BDEF, behavior pool, service definition and binding",
        "Implement validations, determinations, and actions with correctly typed handler methods and %tky/reported handling",
        "Decide managed vs unmanaged rationally and wrap legacy logic in unmanaged scenarios",
        "Write EML-based ABAP Unit tests that verify behavior without a UI"
      ],
      steps: [
        {
          title: "Pin the scenario before generating anything",
          body: [
            "Every RAP prompt starts with the scenario block: managed or unmanaged, draft or not, strict(2) mode, late numbering or early, on-premise release or BTP, and the naming convention for the whole slice. Without it, Claude defaults to a plausible mixture - often managed-with-draft in cloud syntax - and you discover the mismatch only when handler signatures refuse to compile.",
            "The bottler's convention, stated once per session: managed with draft for new objects, unmanaged only when wrapping existing engines; strict(2); late numbering for contract numbers from a number range; ZCC_R_* for root views (or ZCC_I_*), ZCC_C_* projections, ZBP_CC_* behavior pools, LHC_* local handler classes."
          ],
          code: {
            language: "text",
            filename: "prompt-rap-scenario.txt",
            code: `RAP scenario pin (keep for the whole session):
- S/4HANA 2023 on-premise, ABAP language version: standard, ADT + abapGit
- Managed scenario WITH draft, strict ( 2 ), late numbering
- Persistence: new table ZCC_CONT_CNTRCT (I will paste the fields)
- Naming: root view ZCC_R_ContainerContract, projection
  ZCC_C_ContainerContract, BDEF on the R-view, behavior pool
  ZBP_CC_CONTAINERCONTRACT, service def ZCC_UI_CONTAINERCONTRACT,
  binding OData V4 UI.
- Authorization: authorization master, instance checks against ZCC_VKORG
- All artifacts must cross-reference consistently. Ask me before deviating.

First deliverable: the table DDL and the root view entity only.`
          }
        },
        {
          title: "Generate the vertical slice",
          body: [
            "Work top-down in deliverable-sized steps: table plus root view, then the BDEF, then the projection and its BDEF, then the behavior pool skeleton, then the service definition/binding. After each step, activate in ADT before asking for the next - RAP errors cascade, and a typo in the root view name silently corrupts every later artifact if you let Claude keep generating on top of it.",
            "The BDEF is the contract everything hangs on. Review it line by line: implementation class name, persistent table, lock master, draft table, field controls (readonly, mandatory), and which standard operations are exposed. A wrong 'field ( readonly ) ContractId' here costs an afternoon in the UI later."
          ],
          code: {
            language: "abap",
            filename: "zcc_r_containercontract.bdef.asbdef",
            code: `managed implementation in class zbp_cc_containercontract unique;
strict ( 2 );
with draft;

define behavior for ZCC_R_ContainerContract alias Contract
persistent table zcc_cont_cntrct
draft table zcc_cont_cntrcd
etag master LastChangedAt
lock master total etag LastChangedAt
authorization master ( instance )
late numbering
{
  create;
  update;
  delete;

  field ( readonly ) ContractId, CreatedAt, CreatedBy, LastChangedAt;
  field ( mandatory ) Customer, ContainerType, Plant, ValidFrom;

  determination setDepositRate on modify { field ContainerType, Plant; }

  validation validateDates on save { field ValidFrom, ValidTo; create; update; }
  validation validateCustomer on save { field Customer; create; }

  action ( features : instance ) terminateContract result [1] $self;

  draft action Activate optimized;
  draft action Discard;
  draft action Edit;
  draft action Resume;
  draft determine action Prepare { validation validateDates; validation validateCustomer; }

  mapping for zcc_cont_cntrct
  {
    ContractId    = contract_id;
    Customer      = kunnr;
    ContainerType = cont_type;
    Plant         = werks;
    DepositRate   = deposit_rate;
    Currency      = waers;
    ValidFrom     = valid_from;
    ValidTo       = valid_to;
    Status        = status;
    CreatedBy     = created_by;
    CreatedAt     = created_at;
    LastChangedAt = last_changed_at;
  }
}`
          },
          callout: {
            type: "info",
            title: "Activate after every artifact",
            body: "RAP artifacts validate against each other at activation. Generate one artifact, activate it in ADT, paste any error back verbatim, then request the next. Batch-generating five artifacts and debugging the pile is measurably slower."
          }
        },
        {
          title: "Behavior implementation: validations and determinations",
          body: [
            "Handler methods live in the behavior pool's local handler class, and their signatures are dictated by the BDEF (FOR VALIDATE ON SAVE, FOR DETERMINE ON MODIFY, IMPORTING keys FOR ...). Claude generates these correctly when the BDEF is in the prompt - always paste your final, activated BDEF, not the draft it generated earlier, because your manual edits change the required signatures.",
            "The review points inside the methods: READ ENTITIES ... IN LOCAL MODE for own-BO access (skips feature/authorization re-checks), failed-reported filling with %tky and a meaningful message class, and determinations that modify only their declared fields. A determination quietly writing extra fields is RAP's version of a dynpro exit with side effects - legal-looking, and a debugging nightmare."
          ],
          code: {
            language: "abap",
            filename: "zbp_cc_containercontract.clas.locals_imp.abap",
            code: `CLASS lhc_contract DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS validateDates FOR VALIDATE ON SAVE
      IMPORTING keys FOR Contract~validateDates.
    METHODS setDepositRate FOR DETERMINE ON MODIFY
      IMPORTING keys FOR Contract~setDepositRate.
    METHODS terminateContract FOR MODIFY
      IMPORTING keys FOR ACTION Contract~terminateContract RESULT result.
    METHODS get_instance_features FOR INSTANCE FEATURES
      IMPORTING keys REQUEST requested_features FOR Contract RESULT result.
ENDCLASS.

CLASS lhc_contract IMPLEMENTATION.
  METHOD validateDates.
    READ ENTITIES OF zcc_r_containercontract IN LOCAL MODE
      ENTITY Contract
        FIELDS ( ValidFrom ValidTo ) WITH CORRESPONDING #( keys )
      RESULT DATA(lt_contracts).
    LOOP AT lt_contracts INTO DATA(ls_contract)
         WHERE ValidTo IS NOT INITIAL AND ValidTo < ValidFrom.
      APPEND VALUE #( %tky = ls_contract-%tky ) TO failed-contract.
      APPEND VALUE #( %tky = ls_contract-%tky
                      %state_area = 'DATES'
                      %msg = new_message( id       = 'ZCC_CONTRACT'
                                          number   = '003'
                                          severity = if_abap_behv_message=>severity-error
                                          v1       = ls_contract-ValidTo )
                      %element-validto   = if_abap_behv=>mk-on
                      %element-validfrom = if_abap_behv=>mk-on )
             TO reported-contract.
    ENDLOOP.
  ENDMETHOD.

  METHOD setDepositRate.
    READ ENTITIES OF zcc_r_containercontract IN LOCAL MODE
      ENTITY Contract
        FIELDS ( ContainerType Plant ) WITH CORRESPONDING #( keys )
      RESULT DATA(lt_contracts).
    SELECT cont_type, werks, deposit_rate, waers
      FROM zcc_deposit_rate
      FOR ALL ENTRIES IN @lt_contracts
      WHERE cont_type = @lt_contracts-ContainerType
        AND werks     = @lt_contracts-Plant
      INTO TABLE @DATA(lt_rates).
    MODIFY ENTITIES OF zcc_r_containercontract IN LOCAL MODE
      ENTITY Contract
        UPDATE FIELDS ( DepositRate Currency )
        WITH VALUE #( FOR ls_c IN lt_contracts
                      LET ls_r = VALUE #( lt_rates[ cont_type = ls_c-ContainerType
                                                    werks     = ls_c-Plant ] OPTIONAL ) IN
                      ( %tky        = ls_c-%tky
                        DepositRate = ls_r-deposit_rate
                        Currency    = ls_r-waers ) ).
  ENDMETHOD.

  METHOD terminateContract.
    MODIFY ENTITIES OF zcc_r_containercontract IN LOCAL MODE
      ENTITY Contract
        UPDATE FIELDS ( Status ValidTo )
        WITH VALUE #( FOR key IN keys
                      ( %tky = key-%tky Status = 'T' ValidTo = cl_abap_context_info=>get_system_date( ) ) ).
    READ ENTITIES OF zcc_r_containercontract IN LOCAL MODE
      ENTITY Contract ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(lt_after).
    result = VALUE #( FOR ls_c IN lt_after ( %tky = ls_c-%tky %param = ls_c ) ).
  ENDMETHOD.

  METHOD get_instance_features.
    READ ENTITIES OF zcc_r_containercontract IN LOCAL MODE
      ENTITY Contract FIELDS ( Status ) WITH CORRESPONDING #( keys )
      RESULT DATA(lt_contracts).
    result = VALUE #( FOR ls_c IN lt_contracts
                      ( %tky = ls_c-%tky
                        %action-terminateContract = COND #( WHEN ls_c-Status = 'T'
                          THEN if_abap_behv=>fc-o-disabled
                          ELSE if_abap_behv=>fc-o-enabled ) ) ).
  ENDMETHOD.
ENDCLASS.`
          }
        },
        {
          title: "Managed vs unmanaged: wrap the legacy engine honestly",
          body: [
            "Managed RAP owns persistence: create/update/delete and draft handling come for free, and your code contributes only validations, determinations, actions, and feature control. Unmanaged RAP hands you the wheel - your handlers implement the operations, your saver class writes the database - and exists precisely for wrapping legacy engines that already own the transaction, like the bottler's route settlement posting logic with fifteen years of embedded rules.",
            "Ask Claude to argue the decision before generating: 'Given this existing function group with these FMs owning locking and posting, managed or unmanaged, and why?' The honest answer for a legacy engine is usually unmanaged (or managed with unmanaged save - the additional save/save handling variants), because re-implementing posting logic inside a managed BO duplicates the engine and forks the truth. Get the reasoning on record, then generate."
          ],
          code: {
            language: "text",
            filename: "prompt-managed-vs-unmanaged.txt",
            code: `Decision request before any code:

We must expose route settlement as a RAP BO. Existing assets: function group
ZCC_SETTLE with FMs ZCC_SETTLE_CREATE / _CHANGE / _POST (they own enqueue via
EZCC_SETTLE, number range ZC_SETTLE, and FI posting via BAPI_ACC_DOCUMENT_POST
+ own COMMIT logic today).

1. Recommend: managed / managed with unmanaged save / unmanaged. Justify
   against: who owns locking, numbering, commit, and side effects.
2. What must CHANGE in the FMs to fit RAP's save sequence (no COMMIT WORK in
   the save phase, late numbering hook, cleanup)?
3. Sketch the BDEF for your recommendation - operations only, no draft yet.
4. List the risks if we chose managed and re-implemented posting instead.`
          },
          callout: {
            type: "warning",
            title: "COMMIT WORK is the classic collision",
            body: "Legacy engines commit; RAP's save sequence forbids it inside the transactional phase. Any wrapped FM must be refactored so RAP owns the commit - this is the single most common unmanaged-RAP defect, and Claude will flag it only if your prompt mentions the FM does its own commits."
          }
        },
        {
          title: "Draft, projection, and service exposure",
          body: [
            "With draft enabled, users get save-later and lock-free editing, but you inherit obligations: a draft table, the standard draft actions in the BDEF, total etag discipline, and Prepare wiring so validations run before activation. The projection layer then selectively exposes fields and operations to the UI service, and metadata extensions carry the @UI annotations - keep them out of the root views.",
            "Finish the slice with the service definition and an OData V4 UI binding, publish it locally in ADT, and smoke-test in the preview. Claude's role in this stage is mostly explaining errors: RAP activation and runtime messages (missing draft actions, etag violations, unauthorized field changes) are precise but dense, and pasting them verbatim gets you the fix plus the reason."
          ],
          code: {
            language: "cds",
            filename: "zcc_c_containercontract.ddls.asddls",
            code: `@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Container Contract - Projection'
@Metadata.allowExtensions: true
define root view entity ZCC_C_ContainerContract
  provider contract transactional_query
  as projection on ZCC_R_ContainerContract
{
  key ContractId,
      Customer,
      _Customer.CustomerName as CustomerName,
      ContainerType,
      Plant,
      @Semantics.amount.currencyCode: 'Currency'
      DepositRate,
      Currency,
      ValidFrom,
      ValidTo,
      Status,
      LastChangedAt,

      _Customer
}`
          }
        },
        {
          title: "Test the behavior with EML in ABAP Unit",
          body: [
            "EML (Entity Manipulation Language) lets ABAP code drive the BO exactly as the OData runtime would - which makes it the perfect test harness: no UI, no service, just MODIFY ENTITIES / COMMIT ENTITIES / READ ENTITIES against the behavior. Ask Claude for a test class per behavior aspect: one for validations (invalid data must land in failed/reported), one for determinations (derived fields present after create), one for actions (state transitions and feature control).",
            "Two disciplines make these tests trustworthy. First, isolate persistence with CDS test doubles / entity stubs where the environment supports it, or run against a dedicated test client with cleanup. Second, always assert on mapped-failed-reported, not just on data: a validation that fails silently without a reported message is a UI bug waiting to happen, and only the test that checks reported catches it."
          ],
          code: {
            language: "abap",
            filename: "ztc_cc_contract_behavior.clas.abap",
            code: `CLASS ztc_cc_contract_behavior DEFINITION PUBLIC FINAL CREATE PUBLIC
  FOR TESTING RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    METHODS create_with_invalid_dates FOR TESTING RAISING cx_static_check.
    METHODS deposit_rate_determined   FOR TESTING RAISING cx_static_check.
ENDCLASS.

CLASS ztc_cc_contract_behavior IMPLEMENTATION.
  METHOD create_with_invalid_dates.
    MODIFY ENTITIES OF zcc_r_containercontract
      ENTITY Contract
        CREATE FIELDS ( Customer ContainerType Plant ValidFrom ValidTo )
        WITH VALUE #( ( %cid          = 'C1'
                        Customer      = '0000100077'
                        ContainerType = 'KEG50'
                        Plant         = 'DE01'
                        ValidFrom     = '20260801'
                        ValidTo       = '20260701' ) )  "end before start
      MAPPED   DATA(mapped)
      FAILED   DATA(failed)
      REPORTED DATA(reported).

    COMMIT ENTITIES RESPONSE OF zcc_r_containercontract
      FAILED   DATA(commit_failed)
      REPORTED DATA(commit_reported).

    cl_abap_unit_assert=>assert_not_initial(
      act = commit_failed-contract
      msg = 'Invalid date range must fail the save' ).
    cl_abap_unit_assert=>assert_not_initial(
      act = commit_reported-contract
      msg = 'Validation must report a message, not fail silently' ).
  ENDMETHOD.

  METHOD deposit_rate_determined.
    MODIFY ENTITIES OF zcc_r_containercontract
      ENTITY Contract
        CREATE FIELDS ( Customer ContainerType Plant ValidFrom )
        WITH VALUE #( ( %cid = 'C1' Customer = '0000100077'
                        ContainerType = 'CRATE24' Plant = 'DE01'
                        ValidFrom = cl_abap_context_info=>get_system_date( ) ) )
      MAPPED DATA(mapped) FAILED DATA(failed) REPORTED DATA(reported).

    READ ENTITIES OF zcc_r_containercontract
      ENTITY Contract ALL FIELDS WITH
        VALUE #( ( %cid_ref = 'C1' ) )
      RESULT DATA(lt_result).

    cl_abap_unit_assert=>assert_not_initial(
      act = lt_result[ 1 ]-DepositRate
      msg = 'Determination must derive deposit rate from customizing' ).
  ENDMETHOD.
ENDCLASS.`
          }
        }
      ],
      screenshots: [
        {
          caption: "Complete RAP slice in the ADT Project Explorer",
          description: "Eclipse ADT showing the generated artifact set - table, R- and C-views, both BDEFs, behavior pool, metadata extension, service definition and V4 binding - with the service preview rendering the Container Contract list."
        },
        {
          caption: "EML behavior test run in ABAP Unit",
          description: "ADT ABAP Unit view with the ztc_cc_contract_behavior test class green, next to the Claude conversation that generated the failed/reported assertions."
        }
      ],
      video: {
        caption: "A full RAP BO from spec to green EML tests",
        description: "Building the Returnable Container Contract object live: scenario pinning, artifact-by-artifact generation with activation between steps, validation and determination implementation, draft-enabled preview, and EML unit tests.",
        duration: "19:30"
      },
      sapExample: {
        title: "Returnable Container Contracts: a managed draft BO in two days",
        scenario:
          "The bottler tracks returnable containers (kegs, CO2 cylinders, crates) lent to hospitality customers on paper contracts today. Sales operations wants a Fiori app: create contracts, derive deposit rates from plant customizing, validate date ranges and customer status, terminate contracts with an action, draft support for slow data entry in the field. One developer, one Claude session per artifact layer, two days including tests.",
        prompt: `Session context: [scenario pin from step 1 pasted here].

The BDEF below is activated and final (my edits included) - generate the
behavior pool implementation for it:

[activated BDEF pasted verbatim]

Requirements:
- validateDates: ValidTo >= ValidFrom when ValidTo set; message class
  ZCC_CONTRACT, msg 003, mark both %element fields.
- validateCustomer: customer must exist in I_Customer and not be flagged
  for deletion; msg 004/005.
- setDepositRate determination: read ZCC_DEPOSIT_RATE by ContainerType+Plant,
  update DepositRate+Currency; missing rate is NOT an error here (validation
  on save handles it, msg 006).
- terminateContract action: set Status 'T', ValidTo = today, return $self;
  disabled via instance features when already terminated.
- All reads/modifies IN LOCAL MODE. Fill failed AND reported everywhere.
Then generate ztc_cc_contract_behavior: EML tests for both validations, the
determination, and the action's feature control.`,
        code: {
          language: "abap",
          filename: "lhc_contract_validatecustomer.abap",
          code: `METHOD validateCustomer.
  READ ENTITIES OF zcc_r_containercontract IN LOCAL MODE
    ENTITY Contract
      FIELDS ( Customer ) WITH CORRESPONDING #( keys )
    RESULT DATA(lt_contracts).

  SELECT customer, deletionindicator
    FROM i_customer
    FOR ALL ENTRIES IN @lt_contracts
    WHERE customer = @lt_contracts-Customer
    INTO TABLE @DATA(lt_customers).

  LOOP AT lt_contracts INTO DATA(ls_contract).
    READ TABLE lt_customers INTO DATA(ls_customer)
      WITH KEY customer = ls_contract-Customer.
    DATA(lv_invalid) = xsdbool( sy-subrc <> 0
                             OR ls_customer-deletionindicator = abap_true ).
    IF lv_invalid = abap_true.
      APPEND VALUE #( %tky = ls_contract-%tky ) TO failed-contract.
      APPEND VALUE #( %tky = ls_contract-%tky
                      %state_area = 'CUSTOMER'
                      %msg = new_message(
                               id       = 'ZCC_CONTRACT'
                               number   = COND #( WHEN sy-subrc <> 0
                                                  THEN '004' ELSE '005' )
                               severity = if_abap_behv_message=>severity-error
                               v1       = ls_contract-Customer )
                      %element-customer = if_abap_behv=>mk-on )
             TO reported-contract.
    ENDIF.
  ENDLOOP.
ENDMETHOD.`
        },
        explanation: [
          "The prompt's key move is pasting the activated BDEF back rather than trusting the earlier generated draft. The developer had changed the action to feature-controlled and added a state area convention; regenerating handlers against the real contract is what made every FOR-method signature compile on first activation.",
          "Note the deliberate split between determination and validation for the deposit rate: the determination derives silently and tolerates a missing customizing row, while a separate on-save validation raises message 006 if the rate is still initial. Claude initially proposed raising the error inside the determination - a common design smell, since determinations run on modify and would nag the user mid-entry. The correction came from the human, and stating the split explicitly in the prompt kept all later regenerations consistent.",
          "The EML test class caught one real defect before the UI ever existed: terminateContract left %param empty in the result table for one code path, which the READ-after-action assertion exposed. That is the payoff of testing behavior at the EML level - the Fiori preview would have shown it only as a subtly stale UI after pressing the button."
        ]
      },
      bestPractices: [
        "Pin the scenario (managed/unmanaged, draft, strict mode, release, naming) at session start and keep it in every prompt.",
        "Generate one artifact at a time and activate in ADT before requesting the next; paste activation errors verbatim.",
        "Always regenerate handler implementations from the activated BDEF, never from Claude's own earlier draft of it.",
        "Keep determinations silent and side-effect-scoped to their declared fields; raise user-facing errors in validations.",
        "Fill failed AND reported with %tky, state areas, and marked %element fields - silent failures are UI bugs.",
        "Choose unmanaged (or unmanaged save) to wrap legacy engines that own locking/numbering/commit; never duplicate posting logic in a managed BO.",
        "Write EML-based ABAP Unit tests per behavior aspect and assert on failed/reported, not only on persisted data."
      ],
      commonMistakes: [
        {
          mistake: "Letting Claude generate the whole five-artifact stack in one shot, then debugging the cascade of cross-reference errors.",
          fix: "Deliverable-sized steps with activation between each; RAP artifacts validate against each other, so errors compound."
        },
        {
          mistake: "Raising error messages inside a determination when derived data is missing.",
          fix: "Determinations derive on modify and should stay silent; enforce completeness in an on-save validation with a proper message."
        },
        {
          mistake: "Wrapping a legacy FM that executes COMMIT WORK inside an unmanaged save.",
          fix: "Refactor the engine so RAP owns the commit; the save phase forbids own commits, and this collision corrupts the LUW."
        },
        {
          mistake: "READ ENTITIES without IN LOCAL MODE inside own handlers, re-triggering authorization and feature checks.",
          fix: "Own-BO access from behavior implementations uses IN LOCAL MODE; external access (other BOs, reports) does not."
        },
        {
          mistake: "Testing only via the Fiori preview and skipping EML tests.",
          fix: "EML in ABAP Unit exercises validations, determinations, actions, and feature control repeatably and pre-UI; preview clicks are not a regression suite."
        }
      ],
      tips: [
        "Keep a golden sample (one activated BDEF + handler pair from your system) in your prompt library; 'follow this style' beats abstract instructions.",
        "Ask Claude to explain unfamiliar BDEF syntax line by line - the BDEF language is compact and the explanations double as team docs.",
        "For late numbering, have Claude generate the adjust_numbers logic and review the number-range object handling carefully.",
        "Feature control belongs in get_instance_features, not hidden in the UI; test it with EML by asserting %action enablement.",
        "When an activation error stumps you, paste the BDEF, the handler signature, and the exact message together - partial context produces guesses."
      ],
      exercise: {
        title: "Extend the contract BO with a renewal action",
        scenario:
          "Product ownership wants a 'Renew Contract' feature: a renewContract action on ZCC_R_ContainerContract that extends ValidTo by 12 months, only allowed on active contracts (Status 'A') whose ValidTo lies within the next 90 days. Renewal must be logged to ZCC_CNTRCT_LOG via a determination on save. You extend the BDEF, the handlers, and the tests.",
        tasks: [
          "Write the BDEF additions: the action with instance feature control and the on-save determination for logging.",
          "Write the prompt that generates both handler implementations from your final BDEF, including the 90-day window rule.",
          "Implement (or generate and review) get_instance_features for the new action.",
          "Write two EML tests: renewal succeeds inside the window, renewal is disabled outside it.",
          "Decide: should the log write be a determination on save or part of the action itself? Justify."
        ],
        hint: "Feature control decides visibility (window + status); the action body can then trust its precondition but should still guard. The log belongs in an on-save determination so ALL paths that change ValidTo are logged, not just the action.",
        solution: {
          language: "abap",
          filename: "solution-renew-action.abap",
          code: `"BDEF additions:
"  action ( features : instance ) renewContract result [1] $self;
"  determination logContractChange on save { field ValidTo, Status; }

METHOD renewContract.
  READ ENTITIES OF zcc_r_containercontract IN LOCAL MODE
    ENTITY Contract FIELDS ( Status ValidTo ) WITH CORRESPONDING #( keys )
    RESULT DATA(lt_contracts).
  DATA(lv_today) = cl_abap_context_info=>get_system_date( ).

  LOOP AT lt_contracts INTO DATA(ls_c).
    "Guard even though feature control filters the UI path:
    IF ls_c-Status <> 'A' OR ls_c-ValidTo - lv_today > 90.
      APPEND VALUE #( %tky = ls_c-%tky ) TO failed-contract.
      APPEND VALUE #( %tky = ls_c-%tky
                      %msg = new_message( id = 'ZCC_CONTRACT' number = '010'
                        severity = if_abap_behv_message=>severity-error ) )
             TO reported-contract.
      CONTINUE.
    ENDIF.
    MODIFY ENTITIES OF zcc_r_containercontract IN LOCAL MODE
      ENTITY Contract UPDATE FIELDS ( ValidTo )
      WITH VALUE #( ( %tky = ls_c-%tky
                      ValidTo = cl_reca_date=>add_to_date(  "or: ValidTo + 365
                                  id_date = ls_c-ValidTo id_years = 1 ) ) ).
  ENDLOOP.

  READ ENTITIES OF zcc_r_containercontract IN LOCAL MODE
    ENTITY Contract ALL FIELDS WITH CORRESPONDING #( keys )
    RESULT DATA(lt_after).
  result = VALUE #( FOR ls IN lt_after ( %tky = ls-%tky %param = ls ) ).
ENDMETHOD.

METHOD get_instance_features.
  READ ENTITIES OF zcc_r_containercontract IN LOCAL MODE
    ENTITY Contract FIELDS ( Status ValidTo ) WITH CORRESPONDING #( keys )
    RESULT DATA(lt_contracts).
  DATA(lv_today) = cl_abap_context_info=>get_system_date( ).
  result = VALUE #( FOR ls_c IN lt_contracts
    ( %tky = ls_c-%tky
      %action-renewContract = COND #(
        WHEN ls_c-Status = 'A' AND ls_c-ValidTo - lv_today <= 90
             AND ls_c-ValidTo >= lv_today
        THEN if_abap_behv=>fc-o-enabled
        ELSE if_abap_behv=>fc-o-disabled ) ) ).
ENDMETHOD.

"Log as ON SAVE determination: catches EVERY ValidTo/Status change
"(action, UI edit, future API), not only the renewal path.`
        }
      },
      quiz: [
        {
          question: "Why must the RAP scenario (managed/unmanaged, draft, strict mode) be pinned in the first prompt?",
          options: [
            "Claude refuses to generate RAP code otherwise",
            "Handler signatures, BDEF syntax, and required artifacts differ per flavor; unpinned prompts yield plausible code for the wrong scenario",
            "Strict mode is mandatory on all releases",
            "The scenario determines the transport layer"
          ],
          correctIndex: 1,
          explanation: "RAP flavors are structurally different contracts. Generated code for the wrong flavor looks right and fails at activation - the most common failure mode of AI-assisted RAP work."
        },
        {
          question: "Where should 'deposit rate missing in customizing' surface as a user-facing error?",
          options: [
            "Inside the setDepositRate determination on modify",
            "In an on-save validation with a proper message",
            "In the projection view",
            "In the Fiori annotation"
          ],
          correctIndex: 1,
          explanation: "Determinations run on modify and should derive silently; raising errors there nags users mid-entry. Completeness is enforced at save time by a validation filling failed and reported."
        },
        {
          question: "A legacy posting engine with its own COMMIT WORK must be exposed via RAP. What is the correct approach?",
          options: [
            "Managed scenario; re-implement the posting logic in the behavior pool",
            "Call the FM as-is from a managed determination",
            "Unmanaged (or unmanaged save) scenario, with the engine refactored so RAP owns the commit",
            "Wrap the FM in a CDS virtual element"
          ],
          correctIndex: 2,
          explanation: "Unmanaged exists for wrapping engines that own the transaction - but the RAP save sequence forbids own commits, so the engine's COMMIT WORK must be removed and ownership handed to RAP."
        },
        {
          question: "What do EML-based ABAP Unit tests verify that Fiori preview clicking cannot?",
          options: [
            "The UI theme renders correctly",
            "Repeatable, pre-UI assertions on failed/reported contents, derived fields, and feature control across regressions",
            "Network latency of the OData service",
            "The service binding version"
          ],
          correctIndex: 1,
          explanation: "EML drives the BO exactly like the OData runtime, so tests assert on validation messages, determination results, and %action enablement automatically on every run - preview sessions verify one build, once."
        }
      ],
      summary: [
        "Pin the RAP scenario precisely and generate artifact by artifact with activation between steps; regenerate handlers from the activated BDEF.",
        "Determinations derive silently, validations raise messages, actions guard even behind feature control - and everything fills failed plus reported.",
        "Wrap legacy engines with unmanaged (save) scenarios and remove their COMMIT WORK; never fork posting logic into a managed BO.",
        "EML in ABAP Unit is the regression suite for behavior: test validations, determinations, actions, and feature control without a UI."
      ],
      download: {
        name: "RAP Generation Prompt Pack",
        description: "Scenario-pin template, artifact-by-artifact prompts, the managed-vs-unmanaged decision prompt, and the EML test checklist.",
        filename: "rap-development-prompts.md",
        content: `# RAP Development with Claude - Prompt Pack

## Scenario pin (start every session)
\`\`\`
S/4HANA <release> on-premise | BTP ABAP. Managed WITH draft | unmanaged.
strict ( 2 ). Late | early numbering. Table: <...>.
Naming: <R-view / C-view / ZBP_ / service def / binding>.
Authorization master ( instance ), auth object <...>.
Cross-reference all artifacts consistently. Ask before deviating.
\`\`\`

## Artifact sequence (activate between EVERY step)
1. Table DDL + root view entity
2. Root BDEF (review line by line: lock, etag, draft table, field control)
3. Projection view + projection BDEF + metadata extension
4. Behavior pool from the ACTIVATED root BDEF (paste it verbatim)
5. Service definition + binding, publish, preview smoke test
6. EML test classes

## Handler generation prompt
\`\`\`
The BDEF below is activated and final - generate the behavior pool.
[paste BDEF]
Rules: all own-BO access IN LOCAL MODE; fill failed AND reported with %tky,
%state_area, %msg (message class <..>), marked %element fields;
determinations modify ONLY their declared fields and never raise user errors;
actions guard their preconditions even when feature-controlled.
\`\`\`

## Managed vs unmanaged decision prompt
\`\`\`
Existing engine: <FMs, who owns enqueue/numbering/commit/side effects>.
Recommend managed / managed with unmanaged save / unmanaged; justify against
ownership of locking, numbering, commit. List required engine refactorings
(esp. COMMIT WORK removal) and the risks of re-implementing in managed.
\`\`\`

## EML test checklist
- [ ] One test class per behavior aspect (validations / determinations / actions)
- [ ] Invalid data: assert failed AND reported non-initial (no silent failures)
- [ ] Determinations: derived fields present after CREATE via READ ENTITIES
- [ ] Actions: state transition asserted via READ after action; %param filled
- [ ] Feature control: %action-<name> enabled/disabled per instance state
- [ ] Draft: Activate runs Prepare validations (negative test)

## Review red flags in generated RAP code
- READ/MODIFY without IN LOCAL MODE inside handlers
- Error messages raised in determinations
- failed filled without reported (silent UI failures)
- BDEF field control contradicting the metadata extension
- Wrapped legacy code still containing COMMIT WORK / ROLLBACK
`
      },
      relatedSlugs: ["cds-views", "odata", "eclipse-adt", "code-reviews"]
    },
    {
      slug: "odata",
      title: "OData Services with Claude",
      description:
        "Build and debug OData V2/V4 services with Claude: SEGW DPC/MPC method logic, RAP service bindings, $filter and $expand handling, /IWFND/ERROR_LOG troubleshooting, and Fiori Elements annotations.",
      duration: 35,
      level: "Intermediate",
      keywords: [
        "OData",
        "SEGW",
        "service binding",
        "gateway",
        "$filter",
        "$expand",
        "ERROR_LOG",
        "Fiori Elements"
      ],
      overview: [
        "OData is the wire protocol of the SAP UI world, and most landscapes run both generations at once: classic SEGW projects with hand-written DPC_EXT methods feeding older Fiori and third-party consumers, and RAP service bindings exposing CDS-based V4 services for new apps. The bottler is typical - 23 SEGW services in production (route accounting, driver handhelds, customer portal) and all new development on RAP bindings - so developers need fluency in both, plus the judgment of when each applies.",
        "Claude earns its keep across the whole lifecycle. On the classic side it generates the tedious DPC_EXT method logic correctly: converting IO_TECH_REQUEST_CONTEXT filters into WHERE conditions, implementing $expand via deep entities, paging with $top/$skip and inlinecount. On the RAP side the service layer is mostly declarative, so Claude's role shifts to annotations for Fiori Elements and to explaining why the UI does not show what you expect.",
        "The troubleshooting chapter may be the most valuable: gateway errors are logged precisely but read like kernel dumps. Pasting an /IWFND/ERROR_LOG entry - error text, request URI, and the backend stack - into Claude typically yields the actual cause (a metadata mismatch, a missing conversion exit, a CX_SY_OPEN_SQL_DB in a filter branch nobody tested) in one round trip, along with the /IWFND/GW_CLIENT reproduction request to verify the fix."
      ],
      objectives: [
        "Choose correctly between maintaining SEGW V2 services and building RAP V4 service bindings",
        "Generate DPC_EXT method implementations that honor $filter, $expand, paging, and inlinecount",
        "Troubleshoot gateway errors by feeding /IWFND/ERROR_LOG entries to Claude and reproducing in /IWFND/GW_CLIENT",
        "Test services systematically with /IWFND/GW_CLIENT and Postman, including CSRF handling for writes",
        "Apply UI annotations so Fiori Elements renders list reports and object pages without custom UI code"
      ],
      steps: [
        {
          title: "Map the landscape: SEGW V2 vs RAP V4",
          body: [
            "The decision rule the bottler uses: existing SEGW services get maintained (bug fixes, small extensions) but never redesigned; every new service is a RAP service binding - OData V4 for new Fiori apps, V2 binding only when a consumer (an older SAP Fiori launchpad component, a third-party tool) demands it. Redirecting maintenance effort into rewrites is how gateway landscapes end up half-migrated for years.",
            "When you inherit an unknown SEGW service, let Claude do the archaeology: paste the MPC_EXT DEFINE method (or the runtime metadata from /sap/opu/odata/.../$metadata) plus the DPC_EXT redefinitions, and ask for a service map - entity sets, which CRUD-Q operations are actually implemented versus inherited-and-dumping, and which ones contain custom logic worth preserving."
          ],
          code: {
            language: "text",
            filename: "prompt-segw-archaeology.txt",
            code: `I inherited SEGW project ZCC_ROUTE_SRV (OData V2). Pasted below:
1) the $metadata document, 2) the list of redefined methods in
ZCL_ZCC_ROUTE_SRV_DPC_EXT with their source.

Produce a service map:
| EntitySet | Operation | Implemented? | Custom logic summary | Risk notes |
Cover GET_ENTITYSET, GET_ENTITY, CREATE, UPDATE, DELETE per set.
"Implemented?" = redefined with real logic / redefined but delegates /
not redefined (framework raises 'not implemented').
Risk notes: missing filter handling, hardcoded values, missing paging,
SELECTs inside loops. End with: which 3 methods to refactor first and why.`
          }
        },
        {
          title: "Generate DPC_EXT logic: $filter done right",
          body: [
            "The classic SEGW bug is ignoring the filter: a GET_ENTITYSET that selects everything and lets the gateway (or worse, the client) discard rows. The correct pattern converts IO_TECH_REQUEST_CONTEXT->GET_FILTER( )->GET_FILTER_SELECT_OPTIONS( ) into ranges applied in the WHERE clause, falls back for unconvertible expressions, and honors $top/$skip and $inlinecount at the database level.",
            "This is boilerplate with sharp edges - exactly what you delegate. Give Claude the entity type, the underlying tables or CDS view, and the filterable properties, and require the full contract in the prompt: select-option conversion per property, OSQL pushdown, paging, inlinecount, and an explicit error for filters the service cannot honor (silently ignoring a filter corrupts consumer logic)."
          ],
          code: {
            language: "abap",
            filename: "zcl_zcc_route_srv_dpc_ext.abap",
            code: `METHOD routeset_get_entityset.
  DATA: lt_r_route TYPE RANGE OF zcc_route_id,
        lt_r_date  TYPE RANGE OF dats.

  "1. Convert $filter to ranges - reject what we cannot honor
  DATA(lo_filter) = io_tech_request_context->get_filter( ).
  LOOP AT lo_filter->get_filter_select_options( ) INTO DATA(ls_so).
    CASE ls_so-property.
      WHEN 'ROUTE_ID'.
        lt_r_route = CORRESPONDING #( ls_so-select_options ).
      WHEN 'SETTLEMENT_DATE'.
        lt_r_date  = CORRESPONDING #( ls_so-select_options ).
      WHEN OTHERS.
        RAISE EXCEPTION TYPE /iwbep/cx_mgw_tech_exception
          EXPORTING textid = /iwbep/cx_mgw_tech_exception=>internal_error.
    ENDCASE.
  ENDLOOP.

  "2. Paging pushed to the database
  DATA(lv_top)  = io_tech_request_context->get_top( ).
  DATA(lv_skip) = io_tech_request_context->get_skip( ).

  SELECT route_id, settl_date AS settlement_date, vkorg, kunnr,
         revenue, curr_code
    FROM zcc_route_settl
    WHERE route_id   IN @lt_r_route
      AND settl_date IN @lt_r_date
    ORDER BY route_id, settl_date
    INTO CORRESPONDING FIELDS OF TABLE @et_entityset
    UP TO @( COND i( WHEN lv_top > 0 THEN lv_top + lv_skip ELSE 0 ) ) ROWS.
  IF lv_skip > 0.
    DELETE et_entityset TO lv_skip.
  ENDIF.

  "3. $inlinecount=allpages
  IF io_tech_request_context->has_inlinecount( ) = abap_true.
    SELECT COUNT(*) FROM zcc_route_settl
      WHERE route_id IN @lt_r_route AND settl_date IN @lt_r_date
      INTO @es_response_context-inlinecount.
  ENDIF.
ENDMETHOD.`
          },
          callout: {
            type: "warning",
            title: "Never ignore a filter silently",
            body: "A GET_ENTITYSET that drops an unrecognized $filter property returns too much data as if it were the answer. Consumers aggregate it and report wrong numbers. Fail loudly on unhandled filters - the error is a gift compared to the silent alternative."
          }
        },
        {
          title: "$expand and deep entities",
          body: [
            "For V2, $expand is served either generically (the framework calls your GET_ENTITYSET/GET_ENTITY per association - correct but chatty) or explicitly via GET_EXPANDED_ENTITYSET with a deep structure - one round trip, your responsibility. The rule: implement the deep variant for the two or three expand paths the app actually uses (header with items, route with stops), and let the framework handle exotic ones.",
            "Claude generates the deep-entity plumbing well: the nested structure typed after your entity model, the association-driven fill logic, and the ET_EXPANDED_TECH_CLAUSES entries that tell the framework which paths you covered (forget those and the framework re-expands on top of your work, doubling the reads). Paste your MPC entity types and name the expand paths; require the tech clauses in the output."
          ],
          code: {
            language: "text",
            filename: "prompt-expanded-entityset.txt",
            code: `SEGW project ZCC_ROUTE_SRV, V2. Entity types pasted below: Route (key
RouteId) and RouteStop (keys RouteId, StopSeq), association Route_Stops,
navigation property "Stops".

Generate GET_EXPANDED_ENTITYSET for RouteSet handling $expand=Stops:
- Deep structure: route fields + STOPS as an internal table of stop type
- One SELECT for routes (honor $filter on RouteId/PlanDate as ranges,
  $top/$skip pushed down), one SELECT FOR ALL ENTRIES for stops, group in
  memory with VALUE/FOR expressions
- Append 'STOPS' to et_expanded_tech_clauses so the framework does not
  re-expand
- Any other $expand path: do NOT handle, leave to the framework default
- Copy structure/variable naming from the method skeleton pasted below.`
          }
        },
        {
          title: "RAP service bindings and Fiori Elements annotations",
          body: [
            "On the RAP side there is no DPC to write: the service definition selects entities, the binding publishes them, and query options come free from the framework (SADL). Development effort moves to annotations - and that is where apps quietly disappoint: a list report with no columns, filters missing, value helps dead. Almost always the cause is annotation gaps, not service defects.",
            "The efficient loop: tell Claude what the page should look like in plain words ('list report: filter by plant, container type, status; columns X, Y, Z with status criticality; object page with two facets') and let it generate the metadata extension. For the reverse direction, paste an existing metadata extension and ask what the resulting UI shows - a review technique that catches annotation bugs before deployment."
          ],
          code: {
            language: "cds",
            filename: "zcc_c_containercontract.ddlx.asddlx",
            code: `@Metadata.layer: #CUSTOMER
@UI: {
  headerInfo: {
    typeName: 'Container Contract',
    typeNamePlural: 'Container Contracts',
    title: { type: #STANDARD, value: 'ContractId' },
    description: { type: #STANDARD, value: 'CustomerName' }
  }
}
annotate view ZCC_C_ContainerContract with
{
  @UI.facet: [ { id: 'General', type: #IDENTIFICATION_REFERENCE,
                 label: 'General Data', position: 10 },
               { id: 'Validity', type: #FIELDGROUP_REFERENCE,
                 targetQualifier: 'Validity', label: 'Validity', position: 20 } ]

  @UI: { lineItem: [ { position: 10 } ], identification: [ { position: 10 } ] }
  ContractId;

  @UI: { lineItem: [ { position: 20 } ], selectionField: [ { position: 10 } ],
         identification: [ { position: 20 } ] }
  Customer;

  @UI: { lineItem: [ { position: 30 } ], selectionField: [ { position: 20 } ],
         identification: [ { position: 30 } ] }
  ContainerType;

  @UI: { lineItem: [ { position: 40 } ], selectionField: [ { position: 30 } ] }
  Plant;

  @UI: { lineItem: [ { position: 50 } ], identification: [ { position: 40 } ] }
  DepositRate;

  @UI: { lineItem: [ { position: 60, criticality: 'StatusCriticality' } ],
         selectionField: [ { position: 40 } ] }
  Status;

  @UI.fieldGroup: [ { qualifier: 'Validity', position: 10 } ]
  ValidFrom;
  @UI.fieldGroup: [ { qualifier: 'Validity', position: 20 } ]
  ValidTo;

  @UI: { lineItem: [ { position: 70, type: #FOR_ACTION,
                       dataAction: 'terminateContract',
                       label: 'Terminate' } ] }
  @UI.hidden: true
  LastChangedAt;
}`
          }
        },
        {
          title: "Troubleshooting with /IWFND/ERROR_LOG and Claude",
          body: [
            "When a consumer reports 'the app shows an error', the trail is: /IWFND/ERROR_LOG on the gateway (frontend) system for the error context and request URI, /IWBEP/ERROR_LOG on the backend for embedded-deployment details, and the error context's call stack. Copy all three parts of the relevant entry - error text, request data, stack - into one Claude message, and state the deployment (embedded vs hub) because it changes which log is authoritative.",
            "Ask for cause, fix, and reproduction. The reproduction matters: a /IWFND/GW_CLIENT request (URI, method, headers, body) that triggers the error turns 'we think we fixed it' into 'the request that failed now returns 200'. Common catches in this workflow at the bottler: date properties without conversion exits producing malformed Edm.DateTime, a CREATE dumping on a missing mandatory field the UI never sends, and metadata cache staleness after transport (fix: /IWFND/CACHE_CLEANUP on both systems)."
          ],
          code: {
            language: "text",
            filename: "prompt-errorlog-triage.txt",
            code: `Gateway error triage. Deployment: hub (Gateway 7.5x front, S/4 backend).

/IWFND/ERROR_LOG entry pasted below in full:
- Error text: [paste]
- Request URI + method + status: [paste]
- Error context / call stack: [paste]
Backend /IWBEP/ERROR_LOG for the same timestamp: [paste if present]

Answer in this order:
1. Root cause in two sentences (name the exact layer: metadata, provider
   class, SADL, auth, cache).
2. The fix, with code or config transaction.
3. A /IWFND/GW_CLIENT reproduction request (URI, method, headers, body)
   I can run before and after the fix.
4. If cache-related: exact cleanup steps front AND back.`
          },
          callout: {
            type: "tip",
            title: "After every service transport: cache",
            body: "Half of all 'works in DEV, broken in QAS' gateway tickets are metadata cache staleness. Clean up with /IWFND/CACHE_CLEANUP (hub) and /IWBEP/CACHE_CLEANUP (backend) before debugging anything else."
          }
        },
        {
          title: "Systematic testing: GW_CLIENT and Postman",
          body: [
            "/IWFND/GW_CLIENT is the fastest inner loop: no network setup, runs under your SAP user, and stores test requests. Postman earns its place for consumer-perspective suites: environment variables per system, collection runners for regression, and honest CSRF handling (GET with X-CSRF-Token: Fetch, then POST/PATCH with the token and the same session cookies).",
            "Have Claude generate the test plan from the service metadata: for each entity set, the CRUD-Q requests including negative cases - invalid keys (404 expected), filter on a non-filterable property, missing mandatory fields on CREATE (400 with a proper message, not a 500 dump), oversized $top. Export it as a Postman collection JSON and it becomes the regression suite the next transport runs against."
          ],
          code: {
            language: "text",
            filename: "prompt-postman-suite.txt",
            code: `Attached: $metadata of /sap/opu/odata4/sap/zcc_ui_containercontract/....
Generate a Postman collection (v2.1 JSON) for system variable {{host}}:

Per entity set:
- Q: list with $top=10, one $filter per selection field, $count=true
- R: single by key (200) and by invalid key (expect 404)
- C: minimal valid POST body; and one missing-mandatory POST (expect 400,
  assert error message is NOT a generic 500)
- U: PATCH one field with If-Match etag handling
- D: delete + re-read (expect 404)
- CSRF: pre-request GET with X-CSRF-Token: Fetch, token reuse via variable
Include tests[] assertions for status codes and, on Q, that every returned
row matches the filter value.`
          }
        }
      ],
      screenshots: [
        {
          caption: "Filter-honoring GET_ENTITYSET generated for a SEGW service",
          description: "Side-by-side of the Claude conversation and the ADT editor with ROUTESET_GET_ENTITYSET: select-option conversion, paging pushdown, and the inlinecount block highlighted."
        },
        {
          caption: "/IWFND/ERROR_LOG entry triaged by Claude",
          description: "SAP GUI showing a gateway error log entry with its call stack, next to Claude's response naming the missing conversion exit as root cause and the GW_CLIENT reproduction request."
        }
      ],
      video: {
        caption: "Two generations of OData, one workflow",
        description: "Fixing a filter bug in a classic SEGW service with Claude-generated DPC logic, then building a RAP V4 binding with Fiori Elements annotations, and closing with a live ERROR_LOG triage and a Postman regression run.",
        duration: "15:50"
      },
      sapExample: {
        title: "The driver handheld sync that timed out at month-end",
        scenario:
          "Delivery drivers sync their handhelds via the V2 service ZCC_ROUTE_SRV every morning. At month-end, syncs time out and /IWFND/ERROR_LOG fills with timeout entries for RouteSet requests. The service is nine years old; the developer who wrote it left. A developer pastes the DPC_EXT method and the error log entry into Claude before touching anything.",
        prompt: `Production issue: V2 service ZCC_ROUTE_SRV, RouteSet GET_ENTITYSET times out
at month-end (error log entry pasted below - /IWFND/ERROR_LOG, timeout after
60s, URI: /sap/opu/odata/sap/ZCC_ROUTE_SRV/RouteSet?$filter=DriverId eq
'D0421' and PlanDate eq datetime'2026-06-30T00:00:00'&$expand=Stops).

Current GET_ENTITYSET source pasted below (78 lines).

1. Explain why this times out at month-end specifically. I see it SELECTs
   all routes for the plant and filters in a LOOP; confirm or correct.
2. Rewrite: push DriverId and PlanDate filters into the WHERE clause,
   keep behavior identical otherwise. Flag anything else pathological.
3. The $expand=Stops goes through the generic framework path today - is an
   explicit GET_EXPANDED_ENTITYSET worth it here? Estimate the round trips
   saved for a typical 40-stop route day.
4. Give me the GW_CLIENT request to measure before/after response time.`,
        code: {
          language: "abap",
          filename: "routeset_get_entityset_fixed.abap",
          code: `"Root cause confirmed by Claude: full-plant SELECT + ABAP-side filtering.
"Month-end = 30x data volume, so the LOOP filter turned linear cost into
"a timeout. The filter was never pushed to the database.

"BEFORE (the pathological core):
"  SELECT * FROM zcc_route_plan INTO TABLE lt_all WHERE werks = gv_werks.
"  LOOP AT lt_all INTO ls_plan.
"    IF ls_plan-driver_id = lv_driver AND ls_plan-plan_date = lv_date. ...

"AFTER:
METHOD routeset_get_entityset.
  DATA: lt_r_driver TYPE RANGE OF zcc_driver_id,
        lt_r_date   TYPE RANGE OF dats.

  LOOP AT io_tech_request_context->get_filter(
            )->get_filter_select_options( ) INTO DATA(ls_so).
    CASE ls_so-property.
      WHEN 'DRIVER_ID'. lt_r_driver = CORRESPONDING #( ls_so-select_options ).
      WHEN 'PLAN_DATE'. lt_r_date   = CORRESPONDING #( ls_so-select_options ).
      WHEN OTHERS.
        RAISE EXCEPTION TYPE /iwbep/cx_mgw_tech_exception.
    ENDCASE.
  ENDLOOP.

  SELECT route_id, plan_date, driver_id, werks, truck_id, status
    FROM zcc_route_plan
    WHERE werks     = @gv_werks
      AND driver_id IN @lt_r_driver
      AND plan_date IN @lt_r_date
    ORDER BY route_id
    INTO CORRESPONDING FIELDS OF TABLE @et_entityset.
ENDMETHOD.

"Measured with /IWFND/GW_CLIENT (same URI as production error):
"before 61.4s (timeout), after 0.3s. Explicit GET_EXPANDED_ENTITYSET for
"Stops deferred: framework path now does 1+1 calls at 0.5s total - fine.`
        },
        explanation: [
          "The prompt models the discipline this lesson teaches: diagnose before rewriting. The developer stated a hypothesis (ABAP-side filtering) and asked Claude to confirm or correct against the pasted source - Claude confirmed it and additionally flagged that the method read all columns via SELECT * while the entity exposes six, a second fix folded into the rewrite.",
          "Question 3 shows cost-aware engineering with the model: Claude estimated the expand round trips and, given the measured post-fix timings, recommended against the explicit deep-entity implementation for now. Not building something is a legitimate Claude-assisted outcome, and writing that reasoning into the ticket prevented the next developer from 'optimizing' it speculatively.",
          "The GW_CLIENT measurement bracket - same production URI before and after - is what turned this from an anecdote into a closed ticket: 61.4 seconds to 0.3 seconds, attached as evidence. Every generated fix in this module ends with a reproduction artifact, and gateway work is where that habit pays most visibly."
        ]
      },
      bestPractices: [
        "Maintain SEGW services, build new ones as RAP bindings; V4 by default, V2 bindings only for consumers that require them.",
        "Push $filter, $top/$skip, and counts into the database in every GET_ENTITYSET; reject unhandled filter properties loudly.",
        "Implement explicit GET_EXPANDED_ENTITYSET only for the expand paths the app really uses, and always fill the tech clauses.",
        "Paste complete ERROR_LOG entries (text, URI, stack, both systems on hub deployments) in one message for triage.",
        "Clean metadata caches after every service transport before debugging anything else.",
        "End every fix with a reproduction request in /IWFND/GW_CLIENT or Postman, measured before and after.",
        "Generate Postman regression collections from $metadata so every transport gets the same consumer-perspective test run."
      ],
      commonMistakes: [
        {
          mistake: "GET_ENTITYSET selects everything and filters in ABAP, or ignores $filter entirely.",
          fix: "Convert filter select-options to ranges in the WHERE clause; raise a tech exception for properties you cannot honor."
        },
        {
          mistake: "Implementing GET_EXPANDED_ENTITYSET but forgetting ET_EXPANDED_TECH_CLAUSES.",
          fix: "Append each handled navigation path to the tech clauses; otherwise the framework re-expands and doubles the database load."
        },
        {
          mistake: "Debugging 'works in DEV, fails in QAS' service issues for hours before touching the cache.",
          fix: "Run /IWFND/CACHE_CLEANUP and /IWBEP/CACHE_CLEANUP right after transport, then re-test before deeper analysis."
        },
        {
          mistake: "Testing writes in Postman without CSRF token handling and blaming the service for 403s.",
          fix: "Fetch the token with a GET plus X-CSRF-Token: Fetch, reuse token and session cookies on the write; script it once per collection."
        },
        {
          mistake: "Hand-building Fiori list pages because 'the service returns no columns'.",
          fix: "The service is fine; the annotations are missing. Generate the metadata extension (lineItem, selectionField, facets) and let Fiori Elements render."
        }
      ],
      tips: [
        "Keep the $metadata document of each service in the repo; it is the single best context artifact for any OData prompt.",
        "Ask Claude to explain an unfamiliar DPC_EXT method before editing it - the explanation doubles as the missing documentation.",
        "In hub deployments, always state which system a log entry came from; the same error text means different things per layer.",
        "For V2 date/time bugs, have Claude show the exact Edm.DateTime literal your ABAP produces versus what the URI carries.",
        "Store the GW_CLIENT reproduction request in the ticket; the next regression starts from evidence, not memory."
      ],
      exercise: {
        title: "Fix and regression-proof a broken SEGW service",
        scenario:
          "The customer portal reports HTTP 500 on /sap/opu/odata/sap/ZCC_PORTAL_SRV/OrderSet?$filter=CustomerId eq '100077'&$top=20. /IWFND/ERROR_LOG shows CX_SY_OPEN_SQL_DB in ORDERSET_GET_ENTITYSET; the method concatenates the filter value into a dynamic WHERE string. The service also ignores $top and has no tests.",
        tasks: [
          "Write the triage prompt including the error log parts you would paste and the deployment question.",
          "Rewrite ORDERSET_GET_ENTITYSET: safe filter handling via select-options (no dynamic WHERE), $top/$skip pushdown.",
          "Explain why the dynamic-WHERE version was also a security defect, not just a stability bug.",
          "Specify the GW_CLIENT reproduction request and the expected before/after behavior.",
          "Draft the prompt that generates a Postman regression collection for OrderSet from the $metadata."
        ],
        hint: "The CustomerId value with a quote in it (O'Brien...) is both your crash reproduction and your injection proof - one test case, two findings.",
        solution: {
          language: "abap",
          filename: "solution-orderset_get_entityset.abap",
          code: `METHOD orderset_get_entityset.
  "Fix: no dynamic WHERE - filter values go through typed ranges, which
  "removes both the CX_SY_OPEN_SQL_DB crash (quote in value breaks the
  "generated SQL string) AND the injection surface (values were
  "concatenated unescaped into executable SQL).
  DATA lt_r_customer TYPE RANGE OF kunnr.

  LOOP AT io_tech_request_context->get_filter(
            )->get_filter_select_options( ) INTO DATA(ls_so).
    CASE ls_so-property.
      WHEN 'CUSTOMER_ID'.
        lt_r_customer = CORRESPONDING #( ls_so-select_options ).
        "Restore leading zeros the portal never sends:
        LOOP AT lt_r_customer ASSIGNING FIELD-SYMBOL(<ls_r>).
          <ls_r>-low = |{ <ls_r>-low ALPHA = IN }|.
        ENDLOOP.
      WHEN OTHERS.
        RAISE EXCEPTION TYPE /iwbep/cx_mgw_tech_exception.
    ENDCASE.
  ENDLOOP.

  DATA(lv_top)  = io_tech_request_context->get_top( ).
  DATA(lv_skip) = io_tech_request_context->get_skip( ).

  SELECT vbeln AS order_id, kunnr AS customer_id, erdat AS created_on,
         netwr AS net_value, waerk AS currency
    FROM vbak
    WHERE kunnr IN @lt_r_customer
      AND auart = 'ZTA'
    ORDER BY vbeln DESCENDING
    INTO CORRESPONDING FIELDS OF TABLE @et_entityset
    UP TO @( COND i( WHEN lv_top > 0 THEN lv_top + lv_skip ELSE 0 ) ) ROWS.
  IF lv_skip > 0.
    DELETE et_entityset TO lv_skip.
  ENDIF.
ENDMETHOD.

"GW_CLIENT reproduction:
"GET /sap/opu/odata/sap/ZCC_PORTAL_SRV/OrderSet
"    ?$filter=CustomerId eq 'O''Brien'&$top=20
"Before: HTTP 500 CX_SY_OPEN_SQL_DB. After: HTTP 200, empty result set.
"Plus the original URI: 200 with exactly 20 rows, all CustomerId 100077.`
        }
      },
      quiz: [
        {
          question: "A SEGW GET_ENTITYSET receives a $filter on a property it does not handle. What should it do?",
          options: [
            "Ignore the filter and return the full entity set",
            "Return an empty result to be safe",
            "Raise a technical exception so the consumer gets an error instead of silently unfiltered data",
            "Log a warning and continue"
          ],
          correctIndex: 2,
          explanation: "Silently unfiltered data looks like a valid answer and corrupts consumer-side logic and aggregates. A loud error is diagnosable; wrong data in a driver handheld is not."
        },
        {
          question: "After transporting a service change, QAS shows old metadata and odd UI behavior. First action?",
          options: [
            "Debug the DPC_EXT class in QAS",
            "Run /IWFND/CACHE_CLEANUP (and /IWBEP/CACHE_CLEANUP on the backend) and re-test",
            "Re-transport the service",
            "Regenerate the SEGW project"
          ],
          correctIndex: 1,
          explanation: "Metadata cache staleness is the most common post-transport gateway symptom. Cache cleanup takes a minute and eliminates the largest false-lead before any debugging."
        },
        {
          question: "Why does implementing GET_EXPANDED_ENTITYSET require filling ET_EXPANDED_TECH_CLAUSES?",
          options: [
            "It is needed for CSRF validation",
            "It declares which navigation paths you served, so the framework does not expand them again on top of your result",
            "It enables $inlinecount",
            "It registers the method in the service catalog"
          ],
          correctIndex: 1,
          explanation: "The tech clauses tell the framework 'already done'. Without them it runs its generic expansion anyway, doubling reads and sometimes duplicating data in the response."
        },
        {
          question: "In a Fiori Elements list report over a RAP V4 service, no columns appear although the service returns data. Most likely cause?",
          options: [
            "The OData service is not published",
            "The behavior definition lacks a create operation",
            "Missing @UI.lineItem annotations in the metadata extension",
            "The CDS view has no ORDER BY"
          ],
          correctIndex: 2,
          explanation: "Fiori Elements renders from annotations. Data without lineItem annotations produces an empty table skeleton - the classic 'service is broken' ticket that is actually an annotation gap."
        }
      ],
      summary: [
        "Run both OData generations deliberately: maintain SEGW V2, build new services as RAP bindings, and let Claude do the archaeology on inherited projects.",
        "Generated DPC logic must honor the protocol: filters as ranges in WHERE, paging and counts pushed down, unhandled options rejected loudly.",
        "Triage gateway errors by pasting complete ERROR_LOG entries and always produce a GW_CLIENT reproduction, measured before and after the fix.",
        "On the RAP side the effort is annotations - generate metadata extensions from plain-language page descriptions and review them by asking Claude what UI they produce."
      ],
      download: {
        name: "OData Troubleshooting and Testing Kit",
        description: "Error-log triage prompts, DPC generation templates, the cache checklist, and a Postman collection generator prompt.",
        filename: "odata-troubleshooting-kit.md",
        content: `# OData Services with Claude - Troubleshooting and Testing Kit

## ERROR_LOG triage prompt
\`\`\`
Deployment: <embedded | hub>. /IWFND/ERROR_LOG entry: error text, URI +
method + status, error context/call stack [paste all]. Backend
/IWBEP/ERROR_LOG same timestamp [paste if hub].
Answer: 1) root cause + layer, 2) fix (code or transaction),
3) GW_CLIENT reproduction request, 4) cache steps if relevant.
\`\`\`

## GET_ENTITYSET generation prompt
\`\`\`
SEGW project <..>, entity type <..> over <table/CDS>. Filterable:
<properties>. Generate GET_ENTITYSET with: select-options -> ranges in
WHERE (ALPHA = IN where needed), tech exception on unhandled properties,
$top/$skip pushed to OSQL, $inlinecount, ORDER BY <keys>. No SELECT *.
\`\`\`

## GET_EXPANDED_ENTITYSET prompt
\`\`\`
Entity types + association pasted. Handle ONLY $expand=<path>: deep
structure, one SELECT + FOR ALL ENTRIES, group via VALUE/FOR, append
'<PATH>' to et_expanded_tech_clauses. Other paths: framework default.
\`\`\`

## Post-transport checklist
- [ ] /IWFND/CACHE_CLEANUP on gateway/hub
- [ ] /IWBEP/CACHE_CLEANUP on backend (hub deployments)
- [ ] $metadata reloaded and diffed against DEV
- [ ] GW_CLIENT smoke request per entity set (stored requests)
- [ ] Postman regression collection green

## CSRF recipe (Postman)
1. GET any service URL, header X-CSRF-Token: Fetch (keep cookies)
2. Save response header token to {{csrf}}
3. POST/PATCH/DELETE with X-CSRF-Token: {{csrf}} + same cookie jar

## Postman suite generator prompt
\`\`\`
Attached $metadata. Generate a Postman v2.1 collection: per entity set
Q/R/C/U/D incl. negative cases (invalid key 404, missing mandatory 400
not 500, non-filterable property), CSRF pre-request script, tests[]
assertions on status + filter correctness. Host as {{host}}.
\`\`\`
`
      },
      relatedSlugs: ["rap-development", "cds-views", "sap-gui", "troubleshooting"]
    }
  ]
};
