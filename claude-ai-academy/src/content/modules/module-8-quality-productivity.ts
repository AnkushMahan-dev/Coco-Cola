import type { Module } from "../types";

export const module8: Module = {
  slug: "quality-productivity",
  title: "Quality & Productivity",
  shortTitle: "Quality",
  icon: "gauge",
  description:
    "Use Claude to tune ABAP performance, run structured AI-assisted code reviews, and generate documentation that stays in sync with your code.",
  lessons: [
    // ------------------------------------------------------------------
    // Lesson 1: ABAP Performance Optimization with Claude
    // ------------------------------------------------------------------
    {
      slug: "performance-optimization",
      title: "ABAP Performance Optimization with Claude",
      description:
        "Feed ST05/SAT/SQLM evidence to Claude, eliminate nested SELECTs and SELECT *, choose the right internal table access patterns, push code down to HANA, and verify every suggestion with real measurements.",
      duration: 35,
      level: "Advanced",
      keywords: [
        "performance",
        "ST05",
        "SAT",
        "SQLM",
        "FOR ALL ENTRIES",
        "HANA pushdown",
        "AMDP",
        "sorted table",
      ],
      overview: [
        "Performance tuning is one of the highest-value uses of Claude for an ABAP developer, because the classic bottlenecks — SELECTs inside loops, wrong internal table types, SELECT * on wide tables, logic that belongs in the database — follow patterns that Claude recognizes instantly. What Claude cannot do is run your workload. The workflow that actually works is evidence-driven: you collect trace data with ST05, SAT, or SQL Monitor (SQLM), paste the summarized evidence plus the offending code into Claude, and let it propose targeted rewrites. Then you measure again. Claude proposes, the trace disposes.",
        "This lesson walks through the four big optimization families with before/after code: replacing nested SELECTs with FOR ALL ENTRIES, joins, or CDS views; fixing internal table access patterns with sorted keys, hashed keys, and secondary keys; eliminating SELECT * in favor of explicit field lists; and pushing calculations to HANA with code-to-data techniques (CDS views and AMDP). For each family you will learn a prompt shape that gives Claude the context it needs — table sizes, key fields, trace numbers — so its suggestions are grounded rather than generic.",
        "The most important habit you will take away is skepticism. Claude will sometimes claim a rewrite is 'ten times faster.' It cannot know that. Every suggestion in this lesson ends the same way: wrap the old and new variants in runtime measurements (GET RUN TIME, SAT comparison mode, or an ST05 re-trace) and let the numbers decide. An optimization that is not measured is a rumor.",
      ],
      objectives: [
        "Summarize ST05, SAT, and SQLM trace output into a compact form Claude can reason about.",
        "Use Claude to rewrite nested SELECT loops into FOR ALL ENTRIES, joins, or CDS view reads with correct edge-case handling.",
        "Choose sorted, hashed, and secondary table keys with Claude's help and understand the complexity trade-offs it cites.",
        "Ask Claude for HANA code-to-data rewrites (CDS aggregation, AMDP) and know when pushdown is worth it.",
        "Verify every AI optimization claim with a runtime measurement before transporting it.",
      ],
      steps: [
        {
          title: "Collect evidence first: ST05, SAT, and SQLM summaries",
          body: [
            "Never start a tuning session by pasting raw code and asking 'make this faster.' Start in the system: run an ST05 SQL trace over the slow transaction, or an SAT runtime analysis, or pull production numbers from SQL Monitor (SQLM). You do not need to export megabytes of trace files — Claude works best with a short structured summary: the top statements by total time, their execution counts, records fetched, and the identical-selects indicator from ST05's summary view.",
            "On your Windows laptop the practical route is: in SAP GUI, use the trace list's local file export (System > List > Save > Local File) or simply select the top rows and copy them with Ctrl+Y / Ctrl+C, then paste into Claude alongside the code. Ten lines of trace evidence turn Claude from a pattern-guesser into a diagnostician that can say 'statement 3 runs 4,812 times and returns one row each time — that is your nested SELECT.'",
          ],
          code: {
            language: "text",
            filename: "prompt-trace-summary.txt",
            code: `You are an ABAP performance expert. Here is an ST05 summary for
report ZBEV_MARGIN_REPORT (runtime 214 seconds, S/4HANA 2023):

Statement summary (top 4 by total duration):
1. SELECT on VBAP    | executions: 4,812 | identical: 92% | rows: 4,812 | 96.2s
2. SELECT on KONV    | executions: 4,812 | identical: 88% | rows: 19,248 | 61.7s
3. SELECT * on MARA  | executions: 1     | rows: 312,455  | 38.1s
4. SELECT on T006A   | executions: 4,812 | identical: 99% | rows: 4,812 | 9.4s

The driving loop processes ~4,800 sales order items.

Tasks:
1. Diagnose each statement: why is it slow, and what pattern is it?
2. Propose a rewrite for each, ranked by expected impact.
3. Tell me exactly what to re-measure in ST05 to confirm each fix.
Do NOT invent runtime improvement percentages.`,
          },
          callout: {
            type: "tip",
            title: "The 'identical selects' column is gold",
            body: "A high identical-selects percentage in ST05 means the same statement runs repeatedly with the same or looped values — the signature of a SELECT in a LOOP or a missing buffer. Always include this column in what you paste to Claude; it changes the diagnosis from 'slow SQL' to 'wrong access pattern'.",
          },
        },
        {
          title: "Eliminate nested SELECTs: FOR ALL ENTRIES, joins, CDS",
          body: [
            "The most common finding is a SELECT inside a LOOP. Claude knows three escape routes: a single JOIN (best when the data is needed row-by-row anyway), FOR ALL ENTRIES (when the driver data is already in an internal table), or a CDS view that pre-associates the tables. When you ask for the rewrite, state which release you are on and demand the FOR ALL ENTRIES guard rails explicitly: the driver table must be checked for emptiness (an empty FOR ALL ENTRIES table selects everything), duplicates should be removed from the driver, and the full key must be selected because FOR ALL ENTRIES silently deduplicates result rows.",
            "Paste the actual loop, not a paraphrase. Claude will map the loop's WHERE fields onto the join conditions and will usually spot secondary problems in the same pass — such as an unnecessary ORDER BY or a table read that can be buffered once outside the loop.",
          ],
          code: {
            language: "abap",
            filename: "zbev_margin_before_after.abap",
            code: `*--- BEFORE: SELECT inside LOOP (4,812 round trips) -------------------
LOOP AT lt_items ASSIGNING FIELD-SYMBOL(<ls_item>).
  SELECT SINGLE netwr waerk
    FROM vbap
    INTO ( <ls_item>-netwr, <ls_item>-waerk )
    WHERE vbeln = <ls_item>-vbeln
      AND posnr = <ls_item>-posnr.
ENDLOOP.

*--- AFTER: one array fetch with FOR ALL ENTRIES ----------------------
IF lt_items IS NOT INITIAL.
  DATA(lt_driver) = lt_items.
  SORT lt_driver BY vbeln posnr.
  DELETE ADJACENT DUPLICATES FROM lt_driver COMPARING vbeln posnr.

  SELECT vbeln, posnr, netwr, waerk
    FROM vbap
    FOR ALL ENTRIES IN @lt_driver
    WHERE vbeln = @lt_driver-vbeln
      AND posnr = @lt_driver-posnr
    INTO TABLE @DATA(lt_vbap).

  LOOP AT lt_items ASSIGNING FIELD-SYMBOL(<ls_item>).
    READ TABLE lt_vbap ASSIGNING FIELD-SYMBOL(<ls_vbap>)
         WITH KEY vbeln = <ls_item>-vbeln
                  posnr = <ls_item>-posnr
         BINARY SEARCH.
    IF sy-subrc = 0.
      <ls_item>-netwr = <ls_vbap>-netwr.
      <ls_item>-waerk = <ls_vbap>-waerk.
    ENDIF.
  ENDLOOP.
ENDIF.`,
          },
        },
        {
          title: "Fix internal table access: sorted, hashed, secondary keys",
          body: [
            "After the database round trips are gone, the next wall is often in-memory: READ TABLE ... WITH KEY on a STANDARD table is a linear scan, and inside a loop over n rows that is O(n²). Ask Claude to classify every internal table in the routine by its access pattern — filled once and read by full key (hashed), read by partial key or range (sorted), or accessed by two different keys (secondary key). Claude is very good at this classification when you paste the declarations together with every READ/LOOP that touches them.",
            "Also ask Claude for the complexity analysis in Big-O terms: 'for 300,000 rows, what is the cost of this READ before and after?' Forcing it to reason about complexity rather than vague speed claims produces suggestions you can sanity-check yourself. Remember that sorted and hashed tables change semantics too — inserts must respect the key, and hashed tables forbid duplicate keys — so ask Claude to list the behavioral differences of each rewrite, not just the speedup.",
          ],
          code: {
            language: "abap",
            filename: "table_keys.abap",
            code: `*--- BEFORE: standard table, linear READ inside a loop ----------------
DATA lt_mara TYPE STANDARD TABLE OF ty_mara.

*--- AFTER: hashed for unique full-key access -------------------------
DATA lt_mara TYPE HASHED TABLE OF ty_mara
     WITH UNIQUE KEY matnr.

*--- AFTER: sorted + secondary key for two access paths ---------------
DATA lt_cond TYPE SORTED TABLE OF ty_cond
     WITH NON-UNIQUE KEY vbeln posnr
     WITH NON-UNIQUE SORTED KEY by_matnr COMPONENTS matnr.

" Primary key access: O(log n)
READ TABLE lt_cond ASSIGNING FIELD-SYMBOL(<ls_cond>)
     WITH TABLE KEY vbeln = lv_vbeln posnr = lv_posnr.

" Secondary key access: O(log n) instead of O(n)
LOOP AT lt_cond ASSIGNING <ls_cond>
     USING KEY by_matnr WHERE matnr = lv_matnr.
  " ...
ENDLOOP.`,
          },
        },
        {
          title: "Kill SELECT * and push logic down to HANA",
          body: [
            "SELECT * on a wide table like MARA or VBAK drags dozens of unused columns across the network and defeats HANA's column store, which is fastest when it touches few columns. Ask Claude to cross-reference the SELECT against the fields actually used downstream and emit an explicit field list — it does this tediously and reliably, which is exactly the kind of work you want to delegate.",
            "The bigger prize on S/4HANA is code-to-data: instead of fetching hundreds of thousands of rows and aggregating in ABAP, let the database aggregate. Claude can convert a fetch-then-LOOP-then-COLLECT pattern into a CDS view with aggregation and GROUP BY, or into an AMDP method when you need SQLScript features like window functions. Give it the row counts from your trace so it can judge whether pushdown is worthwhile — pushing down a 200-row aggregation buys nothing and costs readability.",
          ],
          code: {
            language: "abap",
            filename: "zbev_i_salesagg.ddls.abap",
            code: `@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Sales aggregation for margin report'
define view entity ZBEV_I_SalesAgg
  as select from vbap
{
  key vbap.matnr,
  key vbap.werks,
      @Semantics.amount.currencyCode: 'waerk'
      sum( vbap.netwr ) as total_net,
      vbap.waerk,
      count( * )        as item_count
}
group by
  vbap.matnr,
  vbap.werks,
  vbap.waerk`,
          },
          callout: {
            type: "warning",
            title: "Pushdown moves load, it does not delete it",
            body: "AMDP and heavy CDS aggregations shift CPU from the application server to the HANA database. On a system where HANA is already the bottleneck, aggressive pushdown can make overall throughput worse. Always tell Claude which tier is constrained, and confirm with your Basis team before transporting AMDP-heavy changes.",
          },
        },
        {
          title: "Ask for complexity analysis, not adjectives",
          body: [
            "A useful discipline: after Claude proposes a rewrite, follow up with 'Give me the algorithmic complexity of the old and new versions in terms of n = number of items and m = number of database rows, and list the assumptions.' This forces a checkable argument. If Claude says the old code is O(n·m) because of a linear READ inside a loop, you can verify that claim by reading the code yourself in thirty seconds.",
            "Reject any answer that contains an unmeasured percentage ('this will be 80% faster'). Claude cannot know your data distribution, buffer states, or index landscape. Complexity arguments and trace evidence are legitimate; invented benchmark numbers are not, and telling Claude so in the prompt ('do not estimate runtimes') noticeably improves answer quality.",
          ],
        },
        {
          title: "Verify with runtime measurements before transporting",
          body: [
            "Close the loop the same way you opened it: with measurements. For quick A/B checks inside a test report, bracket both variants with GET RUN TIME and run each several times to warm the buffers. For real programs, re-run SAT in comparison mode or re-trace with ST05 and compare execution counts — the nested SELECT fix should show the count on VBAP dropping from 4,812 to 1, which is a far stronger proof than any wall-clock number on a shared dev box.",
            "Paste the before/after measurements back into Claude and ask it to write the change documentation for the transport: what was changed, why, evidence before and after. That closes the tuning session with an artifact your reviewer (see the next lesson) will thank you for.",
          ],
          code: {
            language: "abap",
            filename: "zbev_perf_harness.abap",
            code: `DATA: lv_t0 TYPE i, lv_t1 TYPE i.
CONSTANTS lc_runs TYPE i VALUE 5.

DO lc_runs TIMES.
  GET RUN TIME FIELD lv_t0.
  NEW zcl_bev_margin_old( )->run( lt_items ).
  GET RUN TIME FIELD lv_t1.
  WRITE: / |OLD run { sy-index }: { lv_t1 - lv_t0 } microseconds|.
ENDDO.

DO lc_runs TIMES.
  GET RUN TIME FIELD lv_t0.
  NEW zcl_bev_margin_new( )->run( lt_items ).
  GET RUN TIME FIELD lv_t1.
  WRITE: / |NEW run { sy-index }: { lv_t1 - lv_t0 } microseconds|.
ENDDO.`,
          },
        },
      ],
      screenshots: [
        {
          caption: "ST05 summarized trace copied from SAP GUI into Claude with the diagnosis prompt",
          description:
            "Split screen on Windows: SAP GUI ST05 trace summary list on the left with the top statements highlighted, Claude Desktop on the right showing the pasted summary and Claude's per-statement diagnosis.",
        },
        {
          caption: "Claude's before/after FOR ALL ENTRIES rewrite next to the SAT comparison result",
          description:
            "Claude Desktop showing a before/after ABAP diff for a nested SELECT fix, alongside an SAT runtime comparison window where the database time bar has visibly shrunk between two measurements.",
        },
      ],
      video: {
        caption: "Live tuning session: from 214 seconds to measurable proof",
        description:
          "A recorded walkthrough of tracing a slow beverage-margin report with ST05, summarizing the trace for Claude, applying the FOR ALL ENTRIES and hashed-table rewrites, and re-measuring with SAT comparison mode to confirm the win.",
        duration: "14:30",
      },
      sapExample: {
        title: "Tuning the FizzBrands promotion uplift report",
        scenario:
          "FizzBrands, a carbonated soft drink producer, runs ZBEV_PROMO_UPLIFT every Monday to compare promotional versus baseline sales for ~350 SKUs across 40 distribution centers. The job has grown from 3 minutes to 41 minutes over two years. SQLM shows one statement on the custom promotions table ZBEV_PROMO executed 1.4 million times per run. The developer traces one execution with ST05 and takes the evidence to Claude.",
        prompt: `Here is the hot loop from ZBEV_PROMO_UPLIFT plus SQLM evidence:
ZBEV_PROMO selected 1.4M times/run, 97% identical selects, avg 1 row.
ZBEV_PROMO has ~180,000 rows, key: MATNR, WERKS, PROMO_ID.
The loop runs over lt_sales (~1.4M rows, fields MATNR, WERKS, FKDAT, NETWR).

[pasted loop code]

Rewrite to: (1) fetch ZBEV_PROMO once, (2) use an appropriate internal
table type for lookups by MATNR+WERKS with date filtering on FKDAT
between VALID_FROM and VALID_TO, (3) keep results identical.
Explain the complexity before and after. No runtime estimates.`,
        code: {
          language: "abap",
          filename: "zcl_bev_promo_uplift.clas.abap",
          code: `METHOD calculate_uplift.
  " One array fetch instead of 1.4M single selects
  SELECT matnr, werks, promo_id, valid_from, valid_to, uplift_pct
    FROM zbev_promo
    INTO TABLE @DATA(lt_promo).

  " Sorted key: partial-key LOOP by matnr+werks is O(log n) to position
  DATA lt_promo_srt TYPE SORTED TABLE OF zbev_promo
       WITH NON-UNIQUE KEY matnr werks.
  lt_promo_srt = lt_promo.

  LOOP AT it_sales ASSIGNING FIELD-SYMBOL(<ls_sale>).
    LOOP AT lt_promo_srt ASSIGNING FIELD-SYMBOL(<ls_promo>)
         WHERE matnr = <ls_sale>-matnr
           AND werks = <ls_sale>-werks.
      IF <ls_sale>-fkdat BETWEEN <ls_promo>-valid_from
                             AND <ls_promo>-valid_to.
        APPEND VALUE #( matnr    = <ls_sale>-matnr
                        werks    = <ls_sale>-werks
                        promo_id = <ls_promo>-promo_id
                        uplift   = <ls_sale>-netwr *
                                   <ls_promo>-uplift_pct / 100 )
               TO rt_uplift.
      ENDIF.
    ENDLOOP.
  ENDLOOP.
ENDMETHOD.`,
        },
        explanation: [
          "Claude's diagnosis matched the SQLM evidence: 1.4 million identical single selects meant the promotions table was being re-read for every sales line even though it only holds 180,000 rows and fits comfortably in memory. The rewrite fetches it once and replaces the database lookup with a sorted-table LOOP over a partial key, which positions in O(log n) and then scans only the handful of promotions per material/plant.",
          "Claude also flagged something the prompt did not ask about: the date filter cannot be part of the sorted key because it is a range condition, so it stays as an IF inside the inner loop — and it explained why moving VALID_FROM into the key would not help. That kind of unsolicited correctness note is a sign the model had enough context.",
          "The developer re-ran SQLM after the change: executions on ZBEV_PROMO dropped from 1.4 million to 1, and the Monday job now completes in under 4 minutes. The measured evidence — not Claude's rewrite alone — is what went into the transport documentation.",
        ],
      },
      bestPractices: [
        "Always paste trace evidence (ST05/SAT/SQLM summaries) with the code — execution counts and identical-select percentages change the diagnosis.",
        "Tell Claude your release and database ('S/4HANA 2023 on HANA') so it suggests syntax and pushdown options you can actually use.",
        "Demand the FOR ALL ENTRIES guard rails explicitly: empty-table check, deduplicated driver, full key in the field list.",
        "Ask for Big-O complexity arguments instead of accepting speed adjectives or invented percentages.",
        "Measure before and after with GET RUN TIME, SAT comparison mode, or an ST05 re-trace — execution-count drops are the most portable proof.",
        "Fix one bottleneck at a time and re-measure, so you know which change produced which effect.",
        "Have Claude list behavioral differences of every rewrite (duplicate handling, sort order, empty-result semantics), not just the performance story.",
      ],
      commonMistakes: [
        {
          mistake: "Pasting a 2,000-line report and asking 'why is this slow?' with no trace data.",
          fix: "Trace first, then paste only the hot path plus a 5-10 line trace summary. Claude diagnoses evidence far better than it guesses from bulk code.",
        },
        {
          mistake: "Accepting a FOR ALL ENTRIES rewrite without the empty-driver-table check.",
          fix: "An empty FOR ALL ENTRIES table means the WHERE clause is dropped and the whole table is selected. Always keep the IF ... IS NOT INITIAL guard and verify Claude included it.",
        },
        {
          mistake: "Trusting Claude's claim that a change is 'roughly 10x faster'.",
          fix: "Claude cannot measure your system. Strip runtime claims from its answers ('no runtime estimates' in the prompt) and produce your own numbers with SAT or GET RUN TIME.",
        },
        {
          mistake: "Converting every internal table to HASHED because 'hashed is fastest'.",
          fix: "Hashed tables only help full-unique-key access and forbid duplicates. Range and partial-key access needs SORTED; ask Claude to classify each table by its actual access pattern.",
        },
        {
          mistake: "Pushing tiny aggregations into AMDP and making the code unreadable.",
          fix: "Give Claude the row counts and ask whether pushdown is worth it. Below tens of thousands of rows, a clean ABAP SQL statement usually wins on maintainability.",
        },
      ],
      tips: [
        "In SAP GUI on Windows, Ctrl+Y turns the cursor into a block selector — perfect for copying just the columns you need from an ST05 list into Claude.",
        "Save your best tuning prompts as .txt files in a OneDrive folder; a prompt with the trace-summary skeleton pre-typed saves five minutes per session.",
        "Use Windows Snipping Tool (Win+Shift+S) to capture an SAT hit list and paste the image straight into Claude — it reads the columns from screenshots well.",
        "Ask Claude to generate the GET RUN TIME harness for you; it is boilerplate it writes perfectly and it keeps you honest about measuring.",
        "Keep a 'performance diary' markdown file per system with each finding, prompt, and measured result — it becomes team gold within months.",
      ],
      exercise: {
        title: "Optimize the pallet-capacity check",
        scenario:
          "FizzBrands' outbound delivery user-exit calls ZCL_BEV_PALLET->CHECK_CAPACITY for every delivery item. ST05 shows a SELECT on ZBEV_PALLET_CFG (12,000 rows, key MATNR + WERKS) executed once per item with 95% identical selects, and SAT shows 60% of runtime inside a READ TABLE ... WITH KEY on a standard table LT_STOCK filled with 250,000 rows.",
        tasks: [
          "Write a prompt for Claude that includes the trace evidence and asks for a diagnosis of both findings, forbidding runtime estimates.",
          "Rewrite the ZBEV_PALLET_CFG access: fetch once outside the item loop and choose an appropriate internal table type for MATNR+WERKS lookups.",
          "Fix the LT_STOCK access pattern so the per-item lookup is no longer a linear scan.",
          "Write a GET RUN TIME harness that measures old versus new logic over the same input, five runs each.",
          "List which ST05/SAT numbers you would re-check to prove both fixes worked.",
        ],
        hint: "ZBEV_PALLET_CFG is read by its full key — that points to one table type. LT_STOCK is read by full key too, but if any consumer loops over a partial key, a secondary key is the safer choice.",
        solution: {
          language: "abap",
          filename: "zcl_bev_pallet_solution.abap",
          code: `" Fetch configuration once, before the item loop
SELECT matnr, werks, max_layers, units_per_layer
  FROM zbev_pallet_cfg
  INTO TABLE @DATA(lt_cfg_raw).

DATA lt_cfg TYPE HASHED TABLE OF zbev_pallet_cfg
     WITH UNIQUE KEY matnr werks.
lt_cfg = lt_cfg_raw.

" Stock: hashed primary key + sorted secondary key for partial access
DATA lt_stock TYPE HASHED TABLE OF ty_stock
     WITH UNIQUE KEY matnr werks lgort
     WITH NON-UNIQUE SORTED KEY by_mat COMPONENTS matnr.

LOOP AT it_delivery_items ASSIGNING FIELD-SYMBOL(<ls_item>).
  READ TABLE lt_cfg ASSIGNING FIELD-SYMBOL(<ls_cfg>)
       WITH TABLE KEY matnr = <ls_item>-matnr
                      werks = <ls_item>-werks.
  CHECK sy-subrc = 0.

  READ TABLE lt_stock ASSIGNING FIELD-SYMBOL(<ls_stock>)
       WITH TABLE KEY matnr = <ls_item>-matnr
                      werks = <ls_item>-werks
                      lgort = <ls_item>-lgort.
  IF sy-subrc = 0.
    DATA(lv_capacity) = <ls_cfg>-max_layers * <ls_cfg>-units_per_layer.
    IF <ls_item>-lfimg > lv_capacity - <ls_stock>-reserved.
      APPEND VALUE #( item = <ls_item>-posnr
                      type = 'E'
                      text = 'Pallet capacity exceeded' )
             TO rt_messages.
    ENDIF.
  ENDIF.
ENDLOOP.`,
        },
      },
      quiz: [
        {
          question:
            "ST05 shows a statement executed 4,800 times with 95% identical selects and one row per execution. What is the most likely cause?",
          options: [
            "A missing database index on the selected table",
            "A SELECT statement inside a loop over ~4,800 rows",
            "A HANA pushdown that should be reverted to ABAP",
            "Table buffering that is switched on but bypassed",
          ],
          correctIndex: 1,
          explanation:
            "High execution counts with a high identical-selects percentage and single-row results are the classic fingerprint of a SELECT inside a loop. An index problem would show fewer executions with high per-execution cost instead.",
        },
        {
          question: "Which guard is mandatory before a FOR ALL ENTRIES statement?",
          options: [
            "SORT the result table by the primary key",
            "Convert the driver table to a hashed table",
            "Check that the driver table is not initial",
            "Add ORDER BY PRIMARY KEY to the SELECT",
          ],
          correctIndex: 2,
          explanation:
            "If the FOR ALL ENTRIES table is empty, the WHERE conditions referring to it are dropped and the statement selects all rows of the database table. The emptiness check is non-negotiable.",
        },
        {
          question:
            "Claude claims its rewrite 'will be about 85% faster.' What is the correct reaction?",
          options: [
            "Transport it — Claude has seen millions of similar rewrites",
            "Ask Claude to raise the estimate by benchmarking internally",
            "Discard the rewrite because the estimate proves hallucination",
            "Keep the rewrite as a candidate but verify with your own runtime measurement",
          ],
          correctIndex: 3,
          explanation:
            "Claude cannot measure your system, so any percentage is invented — but the rewrite itself may still be excellent. Evaluate the code on its merits, then prove the improvement with GET RUN TIME, SAT, or an ST05 re-trace.",
        },
        {
          question:
            "An internal table with 300,000 rows is read by full unique key inside a loop, and nowhere else. Which table type does Claude correctly recommend?",
          options: [
            "STANDARD TABLE with BINARY SEARCH after a SORT",
            "HASHED TABLE WITH UNIQUE KEY",
            "SORTED TABLE WITH NON-UNIQUE KEY",
            "STANDARD TABLE with a secondary sorted key",
          ],
          correctIndex: 1,
          explanation:
            "Full unique-key access is the textbook case for a hashed table: O(1) per read regardless of size. Sorted tables (O(log n)) win when partial-key or range access is also needed.",
        },
      ],
      summary: [
        "Evidence first: ST05/SAT/SQLM summaries turn Claude from a guesser into a diagnostician — paste counts, not adjectives.",
        "The four big wins are loop-SELECT elimination, correct internal table keys, explicit field lists instead of SELECT *, and selective HANA pushdown.",
        "Ask for complexity arguments and forbid runtime estimates; Claude reasons well but cannot measure.",
        "No optimization is done until GET RUN TIME, SAT comparison, or a re-trace proves it — unmeasured claims never go into a transport.",
      ],
      download: {
        name: "ABAP Performance Tuning Prompt Pack",
        description:
          "Ready-to-fill prompt templates for trace-driven tuning sessions plus a measurement checklist.",
        filename: "abap-performance-prompt-pack.md",
        content: `# ABAP Performance Tuning Prompt Pack

## 1. Trace diagnosis prompt
\`\`\`
You are an ABAP performance expert. System: <release, DB>.
Program: <name>, runtime <n> seconds.

ST05/SQLM summary (top statements):
<table | executions | identical % | rows | time>

Hot code:
<paste hot path only>

Tasks:
1. Diagnose each statement (pattern + root cause).
2. Propose rewrites ranked by expected impact.
3. Tell me what to re-measure to confirm each fix.
Do NOT invent runtime percentages.
\`\`\`

## 2. Internal table classification prompt
\`\`\`
Classify each internal table below by access pattern and recommend
STANDARD / SORTED / HASHED plus secondary keys. Give Big-O before/after
for n = <rows>. List behavioral differences of each change.

<declarations + every READ/LOOP that touches them>
\`\`\`

## 3. HANA pushdown assessment prompt
\`\`\`
Rows involved: <n>. Current pattern: fetch + LOOP aggregation.
Should this move to a CDS aggregation view or AMDP? Consider that
our constrained tier is <app server | HANA>. If yes, generate the
CDS/AMDP version; if no, say so and explain.
\`\`\`

## Measurement checklist
- [ ] Baseline trace saved (ST05/SAT/SQLM) before any change
- [ ] FOR ALL ENTRIES: empty check, dedup, full key selected
- [ ] One change at a time, re-measured after each
- [ ] Execution counts compared (strongest evidence)
- [ ] GET RUN TIME harness: >= 5 runs, buffers warmed
- [ ] Before/after evidence attached to transport documentation
`,
      },
      relatedSlugs: ["cds-views", "atc-remediation", "s4hana-migration", "prompt-engineering"],
    },

    // ------------------------------------------------------------------
    // Lesson 2: AI-Assisted Code Reviews
    // ------------------------------------------------------------------
    {
      slug: "code-reviews",
      title: "AI-Assisted Code Reviews",
      description:
        "Turn Claude into a tireless first-pass reviewer for ABAP: checklist-driven reviews, transport and abapGit diff reviews, GitHub PR integration, and a layered ATC + AI + human process where a person always signs off.",
      duration: 30,
      level: "Intermediate",
      keywords: [
        "code review",
        "abapGit",
        "pull request",
        "ATC",
        "review checklist",
        "transport",
        "authority-check",
      ],
      overview: [
        "Most ABAP teams review code under time pressure, which means reviews collapse into 'looks fine' unless something jumps off the screen. Claude changes the economics: it will happily apply a 30-point checklist to every method of every object in a transport, at the same depth on Friday afternoon as on Monday morning. The goal of this lesson is not to replace your reviewers — it is to give them a first pass that catches naming violations, missing error handling, unguarded SELECTs, absent AUTHORITY-CHECKs, and hardcoded values before a human spends a minute on the code.",
        "You will learn to build a team review checklist that Claude applies consistently, to feed it real review inputs — transport object lists, abapGit diffs, and GitHub pull requests — and to write review prompts that produce actionable, severity-ranked findings instead of essays. We also cover the layered model that works in practice: ATC handles the mechanical checks it is authoritative for, Claude handles pattern-level and intent-level findings, and a human reviewer arbitrates and approves. No AI finding blocks or approves a merge on its own.",
        "Finally, we talk etiquette. AI-generated review comments land differently than human ones: posted raw and unfiltered they feel like spam and erode trust in the process. You will learn simple team rules — label AI findings, curate before posting, never let the volume of minor findings bury the one critical one — that keep AI review welcome rather than resented.",
      ],
      objectives: [
        "Build a reusable ABAP review checklist covering naming, error handling, database access, authority checks, and hardcoding.",
        "Run Claude reviews against transport object lists, abapGit diffs, and GitHub pull requests.",
        "Write review prompt templates that return severity-ranked, line-referenced findings.",
        "Combine ATC, Claude, and human review into distinct layers without duplicate noise.",
        "Apply team etiquette rules for posting AI-assisted review comments, keeping a human as final approver.",
      ],
      steps: [
        {
          title: "Codify your team's review checklist",
          body: [
            "Claude reviews are only as consistent as the checklist you give it. Spend an hour with your team turning tribal knowledge into an explicit markdown checklist: naming conventions (does your shop use ZCL_<APP>_ prefixes? Hungarian or not?), mandatory error handling (no empty CATCH blocks, sy-subrc checked after every relevant statement), database rules (no SELECT in loops, explicit field lists, FOR ALL ENTRIES guards), security rules (AUTHORITY-CHECK before data exposure, no client-crossing selects), and hardcoding bans (no literal plant codes, RFC destinations, or user names).",
            "Store the checklist in your abapGit repository so it is versioned alongside the code it governs. Every review prompt then starts the same way: 'Review the following ABAP against this checklist' — which means two developers running Claude reviews get comparable output, and the checklist itself improves through pull requests like any other artifact.",
          ],
          code: {
            language: "text",
            filename: "review-prompt-template.txt",
            code: `You are reviewing ABAP for a beverage company's S/4HANA system.
Apply ONLY the checklist below. For each finding output:
  [SEVERITY: critical|major|minor] [CHECK-ID] <object>.<method>, line <n>
  Finding: <one sentence>
  Suggestion: <concrete fix, with code if short>

Checklist:
N1 Naming: classes ZCL_BEV_*, interfaces ZIF_BEV_*, no single-letter vars
E1 No empty CATCH blocks; every CX_ caught must be handled or re-raised
E2 sy-subrc checked after READ TABLE, CALL FUNCTION with exceptions
D1 No SELECT inside LOOP; no SELECT *
D2 FOR ALL ENTRIES: empty-driver guard present
S1 AUTHORITY-CHECK before returning business data to a consumer
S2 No hardcoded plant, company code, RFC destination, or username
H1 No literals for configurable values; use constants or TVARVC/customizing

Do not comment on style topics outside the checklist.
End with a summary table: findings per severity.

Code to review:
<paste code or diff here>`,
          },
          callout: {
            type: "tip",
            title: "Constrain the review, improve the review",
            body: "The single biggest quality lever is the sentence 'Do not comment on topics outside the checklist.' Without it, Claude volunteers dozens of stylistic opinions that bury the critical findings. A constrained reviewer is a useful reviewer.",
          },
        },
        {
          title: "Review transport contents before release",
          body: [
            "The transport release is a natural review gate. From SE01/SE09, export the object list of the transport, then pull the relevant sources — either via your abapGit repo on Windows or by copying objects from the editor — and hand the bundle to Claude with the checklist. Ask one extra transport-specific question: 'Does this object list look complete and consistent? Flag suspicious combinations,' which catches things like a changed CDS view without its regenerated access control, or a class change without the referenced message class.",
            "For emergency corrections this is especially valuable: the person releasing a hotfix at 21:00 is exactly the person who benefits from a machine applying the full checklist while they focus on whether the fix actually addresses the incident.",
          ],
        },
        {
          title: "Review abapGit diffs and GitHub pull requests",
          body: [
            "If your team serializes code with abapGit, reviews get much sharper because you can feed Claude a diff instead of whole objects. In the abapGit repo cloned on your Windows laptop, run git diff against the target branch and paste the unified diff. Claude reviews diffs well: it sees exactly what changed, comments only on changed hunks when told to, and can be asked whether the change is consistent with the surrounding unchanged context that appears in the diff margins.",
            "On GitHub, Claude Code and the GitHub integration take this further: Claude can fetch the PR, read every changed file with full context, and draft review comments anchored to specific lines. The workflow that respects human ownership is: Claude drafts, you curate in the pending-review state, you submit under your own name with AI-assisted findings labeled.",
          ],
          code: {
            language: "text",
            filename: "pr-review-workflow.txt",
            code: `# From the abapGit repo clone on Windows (PowerShell):
git fetch origin
git diff origin/main...feature/zbev-rebate-engine > diff.txt

# Then prompt Claude:
Review this abapGit unified diff against our checklist (attached).
Rules:
- Comment ONLY on changed lines (+/-) and their immediate context.
- If a change makes existing unchanged code unsafe, flag it as
  [context-risk] with an explanation.
- Output findings grouped by file, with diff line references.
- Draft each finding as a GitHub review comment I can paste,
  prefixed with "[AI-assisted] ".`,
          },
        },
        {
          title: "Layer ATC, Claude, and human review",
          body: [
            "Do not ask Claude to re-implement ATC. The Code Inspector and ATC are authoritative for what they check — syntax, security baseline via code vulnerability analyzer, naming via your local checks — and their findings come with suppression workflows and audit trails. The efficient stack is: layer 1, ATC runs automatically and must be green (or have approved exemptions) before review starts; layer 2, Claude applies the team checklist plus intent-level review ('does this method do what its name and ABAP Doc claim?'); layer 3, a human reviews Claude's curated findings, the design, and the business logic, and gives the only approval that counts.",
            "Paste the ATC result list into the Claude review prompt so it does not duplicate those findings — and so it can do something ATC cannot: prioritize. 'Given these 47 ATC findings and my diff, which three should I fix before this goes to QA?' is a question Claude answers genuinely well.",
          ],
          code: {
            language: "mermaid",
            filename: "review-layers.mmd",
            code: `flowchart LR
    DEV[Developer commits\nabapGit push] --> ATC[Layer 1: ATC/CI\nmechanical checks]
    ATC -->|green or exempted| AI[Layer 2: Claude review\nchecklist + intent]
    AI -->|curated findings| HUM[Layer 3: Human reviewer\ndesign + business logic]
    HUM -->|approve| REL[Transport release / PR merge]
    HUM -->|request changes| DEV
    AI -.->|never approves\nor blocks alone| REL`,
          },
          callout: {
            type: "warning",
            title: "The human is the approver, always",
            body: "Configure your process so that no AI output can approve or auto-merge. Claude findings are input to a human decision. This is both good engineering and, in many regulated CPG environments, a compliance requirement for change management (SOX-relevant transports need an accountable human approver).",
          },
        },
        {
          title: "Etiquette: posting AI findings without poisoning the well",
          body: [
            "Volume kills trust. If a teammate opens their PR and finds 40 machine-generated nitpicks, the next thing they do is ignore all AI comments forever. Team rules that work: the reviewer who ran Claude curates findings before posting and drops anything they would not have raised themselves; AI-assisted comments are labeled (a simple '[AI-assisted]' prefix) so authors know the provenance; minor findings get batched into one summary comment instead of 25 line comments; and disagreement with an AI finding is settled by humans, with the checklist updated afterwards so the same argument never happens twice.",
            "Also agree on tone. Have Claude phrase findings as observations and suggestions ('this READ TABLE has no sy-subrc check; suggest adding one') rather than commands. You are accountable for every comment you post, whichever tool drafted it.",
          ],
        },
      ],
      screenshots: [
        {
          caption: "Claude applying the team checklist to an abapGit diff with severity-ranked findings",
          description:
            "Claude Desktop on Windows showing a pasted unified diff of a Z-class and Claude's response: findings grouped by severity with check IDs, line references, and suggested fixes, ending in a summary table.",
        },
        {
          caption: "Curating Claude-drafted review comments in a GitHub pending review",
          description:
            "GitHub pull request review screen with several pending comments prefixed '[AI-assisted]', one being edited by the human reviewer before submitting the review under their own name.",
        },
      ],
      video: {
        caption: "A full AI-assisted review of a rebate-engine pull request",
        description:
          "Screen recording of the three-layer review in action: ATC results checked first, Claude reviewing the abapGit diff against the team checklist, the reviewer curating and posting labeled findings on GitHub, and the human approval closing the loop.",
        duration: "11:45",
      },
      sapExample: {
        title: "Reviewing the FizzBrands trade-rebate accrual transport",
        scenario:
          "FizzBrands is shipping ZCL_BEV_REBATE_ACCRUAL, a new engine that posts monthly rebate accruals for key retail accounts. The transport touches one class, a CDS view, and a message class. The junior developer's code works in DEV, ATC is green, and the senior reviewer has 20 minutes before the release meeting. She runs a Claude first pass on the abapGit diff.",
        prompt: `Review this diff for transport K900482 (rebate accrual engine)
against the attached ZBEV review checklist. ATC is green — do not
repeat ATC-class findings. Focus on: error handling around the
posting BAPI, authority checks, hardcoding, and whether the code
matches the ABAP Doc claims. Severity-ranked, line-referenced.

[diff of zcl_bev_rebate_accrual.clas.abap + zbev_i_rebatebase.ddls.asddls]`,
        code: {
          language: "abap",
          filename: "zcl_bev_rebate_accrual.clas.abap",
          code: `" Finding [critical][E1] line 142: BAPI return table ignored
" --- BEFORE (from diff) ---
CALL FUNCTION 'BAPI_ACC_DOCUMENT_POST'
  EXPORTING documentheader = ls_header
  TABLES    accountgl      = lt_gl
            currencyamount = lt_amounts
            return         = lt_return.
COMMIT WORK.

" --- Claude's suggested fix ---
CALL FUNCTION 'BAPI_ACC_DOCUMENT_POST'
  EXPORTING documentheader = ls_header
  TABLES    accountgl      = lt_gl
            currencyamount = lt_amounts
            return         = lt_return.

IF line_exists( lt_return[ type = 'E' ] )
   OR line_exists( lt_return[ type = 'A' ] ).
  CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
  RAISE EXCEPTION TYPE zcx_bev_posting_error
    EXPORTING it_return = lt_return.
ELSE.
  CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
    EXPORTING wait = abap_true.
ENDIF.`,
        },
        explanation: [
          "Claude returned six findings in ninety seconds. The critical one is shown above: the BAPI's RETURN table was never evaluated and COMMIT WORK ran unconditionally, meaning a failed accrual posting would be silently committed as nothing while the calling job reported success. ATC did not flag this — evaluating a returned table is an intent-level check, not a mechanical one.",
          "Two major findings followed: the customer key account list was hardcoded as literals (checklist S2/H1, fix: move to a TVARVC-backed constant class), and the CDS view lacked an access control while the class exposed its data via an OData-facing method (checklist S1).",
          "The senior reviewer confirmed the critical finding in two minutes, dropped one minor naming nitpick she disagreed with, posted four labeled comments, and spent her remaining time on the one thing only she could judge: whether accruing at key-account level rather than store level matched what finance had actually asked for. That division of labor is the whole point.",
        ],
      },
      bestPractices: [
        "Version the review checklist in git next to the code; review prompts always reference the current checklist.",
        "Review diffs, not whole objects, whenever possible — findings get sharper and cheaper.",
        "Paste ATC results into the prompt and tell Claude not to duplicate them; ask it to prioritize instead.",
        "Require severity ranking and line references in the output format so findings are actionable.",
        "Curate before posting: drop findings you would not personally defend, and label the rest '[AI-assisted]'.",
        "Batch minor findings into one summary comment; reserve line comments for major and critical issues.",
        "Keep approval authority exclusively human — no AI output ever approves, blocks, or merges on its own.",
      ],
      commonMistakes: [
        {
          mistake: "Posting Claude's raw review output as 30 individual PR comments.",
          fix: "Curate first. Your teammates will tune out AI comments entirely after one noisy review. One summary comment for minors, line comments only for majors.",
        },
        {
          mistake: "Asking Claude to review with no checklist, getting a different review every time.",
          fix: "A versioned team checklist plus 'comment only on checklist topics' makes reviews reproducible and comparable across reviewers.",
        },
        {
          mistake: "Treating a clean Claude review as approval to release the transport.",
          fix: "Claude is layer 2 of 3. A human reads the curated findings, judges the design and business logic, and gives the only approval that counts.",
        },
        {
          mistake: "Letting Claude duplicate ATC findings, then arguing about which tool is right.",
          fix: "ATC is authoritative for its checks. Feed its results into the prompt with 'do not repeat these' and use Claude for intent-level review and prioritization.",
        },
        {
          mistake: "Reviewing code that contains real customer names, prices, or credentials.",
          fix: "Scrub or anonymize business data and secrets before pasting. Review the code shape, not the confidential content — see the security guidelines lesson.",
        },
      ],
      tips: [
        "Save the review prompt template as a Claude project instruction or a text expansion snippet (e.g., PhraseExpress on Windows) so a review starts in one keystroke.",
        "git diff --stat first: paste the file list and ask Claude 'what would you look at hardest in this changeset?' before the detailed pass.",
        "For SE09 transports, the object list export via System > List > Save > Local File gives you a clean text file to attach to the prompt.",
        "Ask Claude to end every review with 'the one question a human reviewer should focus on' — it is often genuinely insightful.",
        "Track checklist evolution: when a human overrules an AI finding, record the decision in the checklist file so the debate never repeats.",
      ],
      exercise: {
        title: "First-pass review of a pricing user-exit change",
        scenario:
          "A colleague submits an abapGit PR changing ZCL_BEV_PRICING_EXIT: it adds a promotional discount for the 'ENERGY' brand line. The diff shows a new method APPLY_PROMO_DISCOUNT with a SELECT SINGLE inside the pricing item loop, a hardcoded discount of 12%, a hardcoded sales org '1000', and a bare CATCH cx_sy_arithmetic_error block with only a comment inside. ATC is green.",
        tasks: [
          "Write the full review prompt: checklist excerpt, output format rules, 'diff-only' constraint, and the no-ATC-duplication instruction.",
          "Run the review mentally (or with Claude) and write the four findings you expect, each with severity, check ID, and a one-line fix.",
          "Draft the curated GitHub comments: one line comment for each major/critical finding, one batched summary for minors, all labeled '[AI-assisted]'.",
          "Decide what the human reviewer must still verify personally before approving.",
        ],
        hint: "Severity comes from impact: silent error swallowing and the loop SELECT affect correctness and performance in production pricing — the hardcoded 12% is a maintainability major, not a critical.",
        solution: {
          language: "abap",
          filename: "apply_promo_discount_fixed.abap",
          code: `METHOD apply_promo_discount.
  " [D1] fetch promo config once, not per pricing item
  SELECT brand, discount_pct, vkorg
    FROM zbev_promo_cfg
    WHERE brand = 'ENERGY'
    INTO TABLE @DATA(lt_promo).          " [H1] 12% now from config

  DATA(lt_promo_h) = CORRESPONDING zif_bev_types=>tt_promo_hash( lt_promo ).

  LOOP AT ct_items ASSIGNING FIELD-SYMBOL(<ls_item>).
    " [S2] sales org from the document, not hardcoded '1000'
    READ TABLE lt_promo_h ASSIGNING FIELD-SYMBOL(<ls_promo>)
         WITH TABLE KEY brand = <ls_item>-brand
                        vkorg = <ls_item>-vkorg.
    CHECK sy-subrc = 0.

    TRY.
        <ls_item>-discount = <ls_item>-netpr *
                             <ls_promo>-discount_pct / 100.
      CATCH cx_sy_arithmetic_error INTO DATA(lx_arith).
        " [E1] never swallow: log and re-raise as application error
        RAISE EXCEPTION TYPE zcx_bev_pricing_error
          EXPORTING previous = lx_arith
                    iv_item  = <ls_item>-posnr.
    ENDTRY.
  ENDLOOP.
ENDMETHOD.`,
        },
      },
      quiz: [
        {
          question: "What is the correct role of Claude in a three-layer review process?",
          options: [
            "Replace ATC, since Claude covers the same checks with more context",
            "Provide a checklist-driven first pass whose curated findings feed a human decision",
            "Approve low-risk transports automatically so humans review only critical ones",
            "Review only code that ATC has flagged as problematic",
          ],
          correctIndex: 1,
          explanation:
            "ATC stays authoritative for mechanical checks, Claude adds a consistent checklist and intent-level pass, and a human curates and approves. Claude neither replaces ATC nor approves anything on its own.",
        },
        {
          question: "Why should you paste ATC results into the Claude review prompt?",
          options: [
            "So Claude can suppress the ATC findings in the system",
            "Because ATC results are required for Claude to parse ABAP",
            "So Claude avoids duplicating them and can prioritize across all findings instead",
            "So Claude can prove ATC wrong where the tools disagree",
          ],
          correctIndex: 2,
          explanation:
            "Feeding ATC output in with a 'do not repeat these' instruction eliminates duplicate noise and lets Claude do what ATC cannot: rank everything by real-world impact for this specific change.",
        },
        {
          question: "A teammate complains that AI review comments are noisy. Which team rule addresses this best?",
          options: [
            "Run Claude reviews only on transports larger than 10 objects",
            "Curate findings before posting and batch minors into one summary comment",
            "Switch the review output format from markdown to plain text",
            "Have Claude post comments from its own service account for transparency",
          ],
          correctIndex: 1,
          explanation:
            "Noise is a curation problem. The reviewer drops findings they would not defend, batches minor items, and labels the rest — keeping the signal high and the trust intact.",
        },
        {
          question:
            "Claude flags that a BAPI's RETURN table is never evaluated before COMMIT WORK, which ATC did not report. What kind of finding is this?",
          options: [
            "A false positive, since ATC is authoritative for error handling",
            "An intent-level correctness finding — exactly what the AI layer is for",
            "A style preference that belongs in the minor summary comment",
            "A licensing issue with the BAPI call",
          ],
          correctIndex: 1,
          explanation:
            "Evaluating whether returned messages are handled before committing is a semantic, intent-level check. This class of finding — real correctness risk invisible to mechanical checkers — is where AI review earns its place.",
        },
      ],
      summary: [
        "A versioned team checklist plus a constrained output format turns Claude into a reproducible first-pass reviewer.",
        "Feed real inputs — transport object lists, abapGit diffs, GitHub PRs — and review diffs rather than whole objects when you can.",
        "Layer the process: ATC for mechanical checks, Claude for checklist and intent, a human for design, business logic, and the only approval.",
        "Curate and label AI findings before posting; volume and unlabeled provenance are what destroy trust in AI review.",
      ],
      download: {
        name: "ABAP AI Review Checklist & Prompt Template",
        description:
          "A starter team review checklist with check IDs, the constrained review prompt, and posting etiquette rules — ready to commit to your abapGit repo.",
        filename: "abap-review-checklist.md",
        content: `# ABAP AI Review Checklist (v1.0)

Commit this file to your repo. Reference it in every review prompt.

## Checks
| ID | Area | Rule |
|----|------|------|
| N1 | Naming | Classes ZCL_<APP>_*, interfaces ZIF_<APP>_*, meaningful variable names |
| E1 | Errors | No empty CATCH; handle or re-raise every caught exception |
| E2 | Errors | sy-subrc evaluated after READ TABLE / CALL FUNCTION with exceptions |
| E3 | Errors | BAPI RETURN tables evaluated before COMMIT; rollback on E/A |
| D1 | DB | No SELECT inside LOOP; explicit field lists (no SELECT *) |
| D2 | DB | FOR ALL ENTRIES: empty-driver guard, deduped driver, full key |
| S1 | Security | AUTHORITY-CHECK before exposing business data |
| S2 | Security | No hardcoded org units, RFC destinations, users, endpoints |
| H1 | Hardcoding | Configurable values via constants class / TVARVC / customizing |
| T1 | Testability | New logic reachable by ABAP Unit; dependencies injectable |

## Review prompt (paste, then attach diff)
\`\`\`
Review this ABAP diff against checklist v1.0 (attached).
ATC is green - do not repeat ATC-class findings.
Comment ONLY on changed lines and their immediate context.
Output per finding:
[severity][check-id] <object>, line <n>: finding. Suggestion: fix.
End with a severity summary table and "the one question a human
reviewer should focus on".
\`\`\`

## Posting etiquette
1. Curate: drop anything you would not personally defend.
2. Label: prefix posted findings with [AI-assisted].
3. Batch: minors go into one summary comment.
4. Approve: only a human approves; AI never blocks or merges.
5. Learn: overruled findings update this checklist via PR.
`,
      },
      relatedSlugs: ["github-integration", "atc-remediation", "security-guidelines", "ai-coding-best-practices"],
    },

    // ------------------------------------------------------------------
    // Lesson 3: Documentation Generation
    // ------------------------------------------------------------------
    {
      slug: "documentation-generation",
      title: "Documentation Generation",
      description:
        "Generate class documentation, spec drafts, Mermaid flow diagrams, transport changelogs, ABAP Doc comments, and end-user guides straight from your ABAP code — and keep it all versioned next to the code in git.",
      duration: 22,
      level: "Beginner",
      keywords: [
        "documentation",
        "ABAP Doc",
        "Mermaid",
        "technical spec",
        "changelog",
        "abapGit",
        "translation",
      ],
      overview: [
        "Documentation is the work everyone agrees matters and nobody has time for — which makes it the easiest win with Claude. Because the code already contains most of the truth, Claude can draft class and interface documentation, technical specification sections, flow diagrams, changelogs, and even end-user instructions directly from the ABAP you paste in. Your job shifts from author to editor: you verify, correct the business intent the code cannot express, and commit.",
        "This lesson covers the full documentation menu: ABAP Doc comments (the \"! comments that Eclipse ADT shows as element info), class/interface reference docs in markdown, drafting technical specs from code and functional specs from requirements (and checking the two against each other), Mermaid diagrams that render in GitHub and in your abapGit repo's markdown, and transport/changelog documentation generated from commit diffs.",
        "Because many SAP shops in the CPG world run bilingual — German headquarters, English global template, or the reverse — we finish with translation: Claude translates documentation between German and English while preserving SAP terminology (Buchungskreis stays company code, not 'booking circle'). The unifying habit throughout: documentation lives in git next to the abapGit-serialized code, so a code PR and its doc update travel in the same commit.",
      ],
      objectives: [
        "Generate ABAP Doc comments and markdown class documentation from existing Z-code.",
        "Draft technical spec sections from code and cross-check them against a functional spec.",
        "Produce Mermaid flow and sequence diagrams from ABAP logic that render directly in GitHub.",
        "Create changelog and transport documentation from abapGit commit diffs.",
        "Translate SAP documentation between German and English with correct SAP terminology.",
      ],
      steps: [
        {
          title: "Generate ABAP Doc comments from existing code",
          body: [
            "ABAP Doc comments — the lines starting with \"! above declarations — are the documentation closest to the code and the kind Eclipse ADT surfaces as tooltips (F2 element info). Paste a class's public section and method implementations into Claude and ask for ABAP Doc on every public element: a one-line purpose, parameter descriptions with units and value ranges where the code reveals them, and @raising documentation for every exception.",
            "The important instruction is 'document what the code does, and mark anything you cannot infer with TODO'. That keeps Claude from inventing business context. You fill in the TODOs — usually two minutes of the domain knowledge only you have — and paste the finished section back into ADT.",
          ],
          code: {
            language: "abap",
            filename: "zcl_bev_truck_load.clas.abap",
            code: `"! <p class="shorttext synchronized">Truck load builder for outbound deliveries</p>
"! Groups delivery items into truck loads respecting weight and
"! pallet limits per vehicle type. TODO: confirm rounding rule
"! for mixed-pallet layers with logistics.
CLASS zcl_bev_truck_load DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    "! Builds optimized truck loads from open delivery items.
    "! @parameter it_deliveries | Open deliveries (must share one route)
    "! @parameter iv_vehicle_type | Vehicle type from ZBEV_VEHICLE (e.g. 'TR40')
    "! @parameter rt_loads | Proposed loads, one row per truck
    "! @raising zcx_bev_load_error | Route mixed or vehicle type unknown
    METHODS build_loads
      IMPORTING it_deliveries   TYPE zif_bev_types=>tt_deliveries
                iv_vehicle_type TYPE zbev_vehicle_type
      RETURNING VALUE(rt_loads) TYPE zif_bev_types=>tt_loads
      RAISING   zcx_bev_load_error.
ENDCLASS.`,
          },
          callout: {
            type: "info",
            title: "Synchronized short texts",
            body: "The <p class=\"shorttext synchronized\"> tag in ABAP Doc keeps the comment in sync with the repository object's short description. Ask Claude to include it on class and method headers so the SE24/ADT descriptions and the ABAP Doc never drift apart.",
          },
        },
        {
          title: "Draft technical specs from code — and diff them against functional specs",
          body: [
            "For a technical spec, give Claude the code plus your shop's spec template headings (purpose, process flow, objects involved, error handling, authorizations, restart behavior) and ask it to fill in what the code supports and flag what it cannot know. The result is a solid 80% draft in minutes instead of an afternoon of writing.",
            "The underused trick is the reverse check: paste the functional spec and the code together and ask 'list every statement in the functional spec that the code does not implement, and every code behavior the spec does not mention.' This spec-versus-code diff routinely uncovers real gaps — a tolerance check the spec required but nobody built, or an undocumented fallback a developer added under pressure.",
          ],
          code: {
            language: "text",
            filename: "spec-diff-prompt.txt",
            code: `Here is functional spec FS-2024-118 (rebate accrual) and the
implementation ZCL_BEV_REBATE_ACCRUAL.

Task 1: List every functional requirement in the spec that the code
does NOT implement (quote the spec line).
Task 2: List every code behavior NOT mentioned in the spec
(quote the method and line).
Task 3: For each gap, classify: spec outdated | code incomplete |
needs clarification with business.
Do not paraphrase requirements - quote them.

[functional spec text]
[class source]`,
          },
        },
        {
          title: "Turn ABAP logic into Mermaid diagrams",
          body: [
            "A process flow diagram communicates faster than a page of prose, and Mermaid diagrams are plain text — which means Claude writes them, git versions them, and GitHub renders them inside your markdown automatically. Paste a method or a report's main flow and ask for a flowchart of the decision logic, or paste an interface scenario (IDoc in, BAPI call, status update) and ask for a sequence diagram.",
            "Keep diagrams at the altitude readers need: ask for 'business-step level, maximum 12 nodes' rather than a node per ABAP statement. Store the .mmd source or the fenced code block in the repo's docs folder next to the class it describes.",
          ],
          code: {
            language: "mermaid",
            filename: "truck-load-flow.mmd",
            code: `flowchart TD
    A[Read open deliveries for route] --> B{Same route?}
    B -- no --> E[Raise ZCX_BEV_LOAD_ERROR]
    B -- yes --> C[Read vehicle limits from ZBEV_VEHICLE]
    C --> D[Sort items: full pallets first]
    D --> F{Item fits current truck?}
    F -- yes --> G[Add to load, update weight and pallet count]
    F -- no --> H[Close load, open new truck]
    H --> G
    G --> I{More items?}
    I -- yes --> F
    I -- no --> J[Return proposed loads]`,
          },
        },
        {
          title: "Changelog and transport documentation from diffs",
          body: [
            "When code lives in abapGit, every transport-worthy change is a commit range — and a commit range is something Claude can document. From your Windows clone, run git log and git diff for the release range, paste both, and ask for a changelog grouped by object with a 'why' line per change and a flat list suitable for the transport's documentation text. This turns release documentation from archaeology into a two-minute review task.",
            "The same pattern documents an individual transport: paste the SE09 object list plus the relevant diffs and ask for the change description your change-management process requires — including a rollback note ('reverting this transport restores behavior X').",
          ],
          code: {
            language: "text",
            filename: "changelog-prompt.txt",
            code: `# PowerShell, in the abapGit clone:
git log --oneline v2.3.0..HEAD > log.txt
git diff v2.3.0..HEAD -- src/ > diff.txt

# Prompt:
From this git log and diff of our abapGit repo, generate:
1. CHANGELOG.md section "v2.4.0" - grouped by object,
   one line per change: what changed and why (infer from
   commit messages; mark unclear ones [verify]).
2. A plain-text transport documentation block (max 20 lines)
   for change management, including affected objects,
   functional impact, test focus, and rollback note.`,
          },
        },
        {
          title: "End-user docs, git as the single home, and DE↔EN translation",
          body: [
            "Claude can also write for non-developers: paste a report's selection screen logic and main flow and ask for an end-user guide ('what does each field mean, what does the output show, what do the messages mean and what should the user do about each'). Because the guide derives from code, it stays accurate as long as you regenerate it when the code changes — which is why it belongs in the same repo, in a docs/ folder, updated in the same PR as the code.",
            "For bilingual shops, ask Claude to translate documentation while keeping SAP terminology canonical: give it a small glossary (Buchungskreis = company code, Werk = plant, Lieferung = delivery) and the instruction to keep transaction codes, table names, and field names untranslated. Claude handles German-English SAP translation remarkably well, but the glossary keeps edge cases consistent across the whole documentation set.",
          ],
          callout: {
            type: "tip",
            title: "Docs live in the same commit as the code",
            body: "Adopt one rule: a PR that changes behavior must update docs/ in the same commit. Reviewers can then diff documentation like code, and the AI-review layer from the previous lesson can even check whether the doc update matches the code change.",
          },
        },
      ],
      screenshots: [
        {
          caption: "Claude generating ABAP Doc comments, previewed as element info in Eclipse ADT",
          description:
            "Left: Claude Desktop with generated \"! ABAP Doc comments for a Z-class. Right: Eclipse ADT on Windows showing the same class with the F2 element info popup rendering the new documentation.",
        },
        {
          caption: "A Claude-generated Mermaid flowchart rendered in the abapGit repo's README on GitHub",
          description:
            "GitHub file view of docs/truck-load-flow.md in an abapGit repository, showing the rendered Mermaid flowchart of the truck load algorithm next to the commit that updated both code and diagram.",
        },
      ],
      video: {
        caption: "From undocumented Z-class to committed docs in 15 minutes",
        description:
          "A walkthrough documenting a legacy beverage-logistics class: generating ABAP Doc, a markdown reference page, and a Mermaid flow diagram with Claude, then committing docs and code together via abapGit and reviewing the rendered result on GitHub.",
        duration: "10:00",
      },
      sapExample: {
        title: "Documenting the FizzBrands empties-management interface",
        scenario:
          "FizzBrands tracks returnable bottles and crates ('empties') through ZCL_BEV_EMPTIES_SYNC, an eight-year-old class that syncs deposit balances with a legacy depot system via RFC. The original developer left; the only documentation is the class name. A new team member must extend it and decides to document it first — with Claude doing the heavy lifting.",
        prompt: `Here is ZCL_BEV_EMPTIES_SYNC (full source, ~600 lines). Generate:
1. A markdown reference doc: purpose, public API table
   (method | parameters | purpose), error handling, RFC dependencies.
2. A Mermaid sequence diagram of SYNC_DEPOSITS: our system,
   the RFC destination DEPOT_LEGACY, and the ZBEV_EMPTIES table.
3. ABAP Doc comments for the public section.
Mark everything you infer but cannot verify with [assumed].
Keep table and field names exactly as in the code.`,
        code: {
          language: "mermaid",
          filename: "empties-sync-sequence.mmd",
          code: `sequenceDiagram
    participant JOB as ZBEV_EMPTIES_JOB (daily)
    participant CLS as ZCL_BEV_EMPTIES_SYNC
    participant RFC as DEPOT_LEGACY (RFC)
    participant DB as ZBEV_EMPTIES

    JOB->>CLS: sync_deposits( iv_date )
    CLS->>DB: SELECT open balances per customer
    CLS->>RFC: Z_DEPOT_GET_DEPOSITS( customers )
    RFC-->>CLS: depot balances
    CLS->>CLS: compare, build delta [assumed: depot wins on conflict]
    CLS->>DB: MODIFY zbev_empties (delta rows)
    CLS-->>JOB: rt_log (synced / failed customers)
    Note over CLS,RFC: RFC failure: retries 3x, then raises ZCX_BEV_SYNC_ERROR`,
        },
        explanation: [
          "Claude produced the reference doc, sequence diagram, and ABAP Doc in one pass. Crucially, the [assumed] markers did their job: the diagram's note 'depot wins on conflict' was flagged as inferred, and when the new developer checked with the logistics team it turned out to be wrong in one case — manual corrections in SAP were supposed to win. The documentation exercise surfaced a live bug before any extension work began.",
          "The generated public API table also revealed that two public methods were never called anywhere (Claude suggested where-used verification, which SE80's where-used list confirmed on the Windows GUI). They were deprecated in the same PR that added the docs.",
          "Everything — reference markdown, .mmd diagram, ABAP Doc in the class source — went into one abapGit commit. The next developer to touch empties management starts from a rendered GitHub page instead of 600 undocumented lines.",
        ],
      },
      bestPractices: [
        "Always instruct Claude to mark inferred content ([assumed] or TODO) — documentation that guesses silently is worse than none.",
        "Keep docs in a docs/ folder in the same abapGit repo and update them in the same PR as the code change.",
        "Generate ABAP Doc with synchronized short texts so ADT/SE24 descriptions never drift from the comments.",
        "Ask for diagrams at business-step altitude with a node limit; regenerate them when the flow changes.",
        "Use the spec-versus-code diff prompt before every major enhancement — it finds real gaps cheaply.",
        "Maintain a small DE↔EN glossary file in the repo and attach it to every translation prompt.",
        "Regenerate end-user docs from code after functional changes rather than patching prose by hand.",
      ],
      commonMistakes: [
        {
          mistake: "Committing Claude's documentation draft without reading it.",
          fix: "Claude documents what the code appears to do, including its bugs, and marks guesses only if you told it to. Editing the draft is the job; five focused minutes is usually enough.",
        },
        {
          mistake: "Letting Claude translate SAP terms literally (Buchungskreis becoming 'booking circle').",
          fix: "Attach a glossary and instruct: SAP terminology per official translations, transaction codes and technical names untranslated.",
        },
        {
          mistake: "Storing generated docs in a wiki far away from the code.",
          fix: "Docs belong in git next to the abapGit sources so one PR updates both and reviewers can diff documentation like code.",
        },
        {
          mistake: "Asking for a diagram of a 600-line class and getting an unreadable 80-node graph.",
          fix: "Constrain altitude: 'business-step level, max 12 nodes, one diagram per public method if needed.'",
        },
        {
          mistake: "Documenting once and never regenerating.",
          fix: "Make 'docs updated?' a checklist item in your AI-assisted review; regenerating from changed code is cheaper than writing was.",
        },
      ],
      tips: [
        "In Eclipse ADT on Windows, Shift+F2 shows the rendered ABAP Doc — use it to verify Claude's comments immediately after pasting them in.",
        "Preview Mermaid locally before committing: VS Code's built-in markdown preview renders Mermaid fences with the Markdown Preview Mermaid extension.",
        "Ask for the changelog in both formats at once: markdown for the repo and a plain-text block sized for the SE09 documentation field.",
        "Pin your spec template headings in a Claude project so every tech-spec draft lands pre-structured.",
        "For legacy classes, start with 'explain this class to a new team member in 10 bullets' — it is the fastest way to check Claude understood the code before generating formal docs.",
      ],
      exercise: {
        title: "Document the crate-deposit calculator",
        scenario:
          "You inherit ZCL_BEV_DEPOSIT_CALC, which computes bottle and crate deposit amounts per delivery for FizzBrands' German market (Pfand handling). It has no documentation, one public method CALCULATE with three parameters, and the German business team needs an English explanation of the rules it implements.",
        tasks: [
          "Write the prompt asking Claude for ABAP Doc comments on the public section, with [assumed] markers and synchronized short texts.",
          "Ask for a Mermaid flowchart of CALCULATE at business-step level (max 10 nodes).",
          "Generate a short end-user explanation in English of how deposits are calculated, with SAP terms handled via a mini glossary (Pfand = deposit, Leergut = empties, Lieferung = delivery).",
          "Define the docs/ folder structure and the single commit that ships code comments and markdown together.",
        ],
        hint: "One prompt can request all three outputs; number them and ask Claude to keep technical names (ZBEV_* tables, field names) untranslated in the English text.",
        solution: {
          language: "abap",
          filename: "zcl_bev_deposit_calc_doc.abap",
          code: `"! <p class="shorttext synchronized">Deposit (Pfand) calculator per delivery</p>
"! Calculates bottle and crate deposit amounts for German-market
"! deliveries based on ZBEV_DEPOSIT_RATE. Crate deposit applies per
"! full crate; loose bottles use the bottle rate.
"! [assumed] Partial crates are charged as loose bottles - verify
"! with the empties team.
CLASS zcl_bev_deposit_calc DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    "! Calculates total deposit for one delivery.
    "! @parameter iv_vbeln | Outbound delivery number
    "! @parameter iv_simulate | 'X' = no update to ZBEV_DEPOSIT_LOG
    "! @parameter rs_result | Deposit amounts: bottles, crates, total (EUR)
    "! @raising zcx_bev_deposit_error | Rate missing in ZBEV_DEPOSIT_RATE
    METHODS calculate
      IMPORTING iv_vbeln         TYPE vbeln_vl
                iv_simulate      TYPE abap_bool DEFAULT abap_false
      RETURNING VALUE(rs_result) TYPE zif_bev_types=>ty_deposit_result
      RAISING   zcx_bev_deposit_error.
ENDCLASS.

* docs/ structure committed together with the class change:
*   docs/zcl_bev_deposit_calc.md   (reference + English rule summary)
*   docs/deposit-calc-flow.mmd     (Mermaid flowchart, max 10 nodes)
*   Commit: "Document deposit calculator (ABAP Doc + docs/), no logic change"`,
        },
      },
      quiz: [
        {
          question: "Why should you instruct Claude to mark inferred content with [assumed] or TODO?",
          options: [
            "It makes the documentation longer and more thorough",
            "It separates code-derived facts from guesses so you know exactly what to verify",
            "ADT requires TODO markers to render ABAP Doc",
            "It allows Claude to skip the parts it finds difficult",
          ],
          correctIndex: 1,
          explanation:
            "Code reveals mechanics but not business intent. Explicit markers turn unverifiable inferences into a visible review list — and, as in the empties example, checking them can even surface real bugs.",
        },
        {
          question: "What is the main advantage of Mermaid over drawing tools for SAP documentation?",
          options: [
            "Mermaid diagrams can be executed as ABAP unit tests",
            "Mermaid supports the official SAP icon set",
            "Mermaid is plain text, so Claude writes it, git versions it, and GitHub renders it",
            "Mermaid diagrams are automatically translated between languages",
          ],
          correctIndex: 2,
          explanation:
            "Text-based diagrams fit the whole workflow: generated from code by Claude, diffed and reviewed in PRs like code, and rendered automatically in GitHub markdown — no binary files, no separate tool.",
        },
        {
          question: "A German 'Buchungskreis' should appear in the English documentation as…",
          options: [
            "Booking circle",
            "Company code",
            "Posting area",
            "Buchungskreis (never translated)",
          ],
          correctIndex: 1,
          explanation:
            "SAP terminology has official translations: Buchungskreis is company code. A small glossary in the prompt keeps Claude on the canonical terms while technical names (tables, fields, transactions) stay untranslated.",
        },
        {
          question: "Where should generated documentation for an abapGit-managed class live?",
          options: [
            "In the corporate wiki, separate from the code",
            "In the docs/ folder of the same repo, updated in the same PR as the code",
            "As attachments on the transport request only",
            "In a shared network drive folder per developer",
          ],
          correctIndex: 1,
          explanation:
            "Docs in the same repo travel with the code: one PR updates both, reviewers diff documentation like code, and nothing drifts to a forgotten wiki page.",
        },
      ],
      summary: [
        "Claude drafts ABAP Doc, reference docs, specs, diagrams, changelogs, and end-user guides from code — you edit and verify instead of writing from scratch.",
        "Always require [assumed]/TODO markers; the verification list is where documentation finds real bugs.",
        "Mermaid diagrams and markdown docs live in the abapGit repo and ship in the same commit as the code they describe.",
        "For bilingual shops, translate with a glossary so SAP terms stay canonical and technical names stay untranslated.",
      ],
      download: {
        name: "SAP Documentation Prompt Library",
        description:
          "Copy-paste prompts for ABAP Doc, reference docs, spec-vs-code diffs, Mermaid diagrams, changelogs, and DE↔EN translation with glossary.",
        filename: "sap-documentation-prompts.md",
        content: `# SAP Documentation Prompt Library

## ABAP Doc generation
\`\`\`
Generate ABAP Doc ("! comments) for every public element below.
Include <p class="shorttext synchronized"> on class/method headers,
@parameter and @raising lines, units/value ranges where the code
shows them. Mark anything you cannot infer with TODO.
[paste public section + implementations]
\`\`\`

## Class reference doc
\`\`\`
Generate a markdown reference for this class: purpose, public API
table (method | parameters | purpose), error handling, dependencies
(tables, RFCs, classes). Mark inferences with [assumed].
\`\`\`

## Spec-vs-code diff
\`\`\`
Compare functional spec and code. List (1) spec requirements not
implemented, (2) code behavior not in the spec, (3) classification:
spec outdated | code incomplete | clarify with business.
Quote, don't paraphrase.
\`\`\`

## Mermaid flow diagram
\`\`\`
Create a Mermaid flowchart of <method> at business-step level,
max 12 nodes, error paths included. Output only the mermaid block.
\`\`\`

## Changelog / transport doc
\`\`\`
From this git log + diff, generate (1) CHANGELOG.md section grouped
by object with a why per change (mark unclear as [verify]),
(2) a 20-line plain-text transport documentation block: objects,
impact, test focus, rollback note.
\`\`\`

## DE <-> EN translation
\`\`\`
Translate to <English|German>. Rules: SAP terms per official SAP
translations (glossary below wins), transaction codes / table /
field names untranslated, keep markdown structure.
Glossary: Buchungskreis=company code; Werk=plant; Lieferung=delivery;
Pfand=deposit; Leergut=empties.
[document]
\`\`\`
`,
      },
      relatedSlugs: ["eclipse-adt", "github-integration", "prompt-library", "claude-desktop"],
    },
  ],
};
