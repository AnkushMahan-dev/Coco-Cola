import type { Module } from "../types";

export const module3: Module = {
  slug: "advanced-capabilities",
  title: "Advanced Claude Capabilities",
  shortTitle: "Advanced",
  icon: "sparkles",
  description:
    "Master Claude Cowork, agentic workflows, Skills, and Connectors to automate SAP office work, codify team knowledge, and connect Claude to your corporate systems.",
  lessons: [
    // =====================================================================
    // Lesson 1: Claude Cowork for SAP Teams
    // =====================================================================
    {
      slug: "cowork",
      title: "Claude Cowork for SAP Teams",
      description:
        "Use Cowork, the agentic workspace mode in Claude Desktop, to automate document-heavy SAP tasks: functional specs, ATC result analysis in Excel, and cutover checklists.",
      duration: 25,
      level: "Intermediate",
      keywords: [
        "cowork",
        "claude desktop",
        "agentic workspace",
        "functional spec",
        "excel automation",
        "atc results",
        "cutover checklist",
      ],
      overview: [
        "Claude Cowork is the agentic workspace mode built into the Claude Desktop app. Instead of chatting and copy-pasting results, you point Cowork at a folder on your Windows laptop and give it a goal. Claude then works autonomously inside that folder: it reads the files it finds there, creates new files (Excel workbooks, Word documents, Markdown reports), and carries out multi-step office tasks from start to finish while you watch its progress.",
        "For SAP teams, this is a major productivity lever for everything that surrounds the ABAP code itself: drafting functional specifications from ticket exports, analyzing ATC result spreadsheets, consolidating transport lists, preparing cutover checklists, and turning meeting notes into structured action plans. These tasks eat hours of developer and consultant time every week, and they are exactly the kind of file-and-document work Cowork is designed for.",
        "In this lesson you will set up a Cowork session on a project folder, learn how Cowork plans and executes multi-step tasks, and apply it to three realistic SAP scenarios. You will also learn where Cowork's boundaries are - it works on local files, not inside your SAP system, so it complements rather than replaces Claude Code and your ABAP tools.",
      ],
      objectives: [
        "Start a Cowork session in Claude Desktop and point it at a Windows project folder",
        "Write task briefs that let Cowork complete multi-step document tasks without constant supervision",
        "Generate a draft functional specification from a ticket export using Cowork",
        "Analyze an ATC results export in Excel with Cowork and produce a prioritized remediation summary",
        "Decide when a task belongs in Cowork versus chat versus Claude Code",
      ],
      steps: [
        {
          title: "Open Cowork and select a working folder",
          body: [
            "Launch the Claude Desktop app on Windows and switch to Cowork. Cowork asks you to choose a folder it may work in - this is its workspace boundary. Create a dedicated folder such as C:\\SAP-Work\\cowork-sessions\\spec-drafts and copy the input files you want Claude to use into it (ticket exports, ATC spreadsheets, template documents).",
            "Keeping a dedicated folder per task type has two benefits: Claude only sees the files that are relevant, and you can review everything it created in one place before sharing it with the team. Never point Cowork at a folder containing files you would not want summarized or transformed, such as HR documents or credentials.",
          ],
          callout: {
            type: "info",
            title: "Cowork works on files, not in SAP",
            body: "Cowork reads and writes files in the folder you select. It does not log on to your SAP system, run transactions, or change ABAP code in the repository. Export the data you need (tickets, ATC results, transport lists) to files first, then let Cowork process them.",
          },
        },
        {
          title: "Write a clear task brief",
          body: [
            "Cowork performs best when you describe the goal, the inputs, and the expected output files in one message - like a mini work order you would hand to a junior colleague. Name the input files explicitly, describe the output format, and state any rules Claude must follow (naming conventions, template sections, language).",
            "A good brief means Cowork can plan the whole task, execute it step by step, and only come back to you when something is genuinely ambiguous.",
          ],
          code: {
            language: "text",
            filename: "cowork-task-brief.txt",
            code: `In this folder you will find ticket-4711-export.txt (a service ticket
export) and FS-Template.docx (our functional spec template).

Task: Draft a functional specification for the change described in the
ticket.

1. Read the ticket export and identify the business requirement,
   affected process, and affected SAP objects.
2. Fill in every section of the template: Purpose, Business Background,
   Process Description (as-is / to-be), Affected Objects, Authorization
   Considerations, Test Cases.
3. Mark anything you had to assume with [ASSUMPTION] so a functional
   consultant can verify it.
4. Save the result as FS_ZSD_INVOICE_SPLIT_v0.1.docx in this folder.

Do not invent transaction codes - if the ticket does not name one,
write [TBD] instead.`,
          },
        },
        {
          title: "Let Cowork plan and monitor its progress",
          body: [
            "After you send the brief, Cowork breaks the task into steps and shows you its plan: read the ticket, extract requirements, open the template, draft each section, save the output. It then executes the steps one by one, and you can watch which file it is reading or writing at any moment.",
            "You stay in control: you can interrupt, refine the instructions mid-task ('use British date format'), or ask it to redo a single section. Treat the first output as a draft for review - especially the [ASSUMPTION] markers you asked for.",
          ],
        },
        {
          title: "Analyze an ATC results export in Excel",
          body: [
            "Cowork can open, analyze, and create Excel files, which makes it ideal for ATC (ABAP Test Cockpit) result exports. Export your ATC run results to a spreadsheet, drop the file in the workspace folder, and ask Cowork for a structured analysis with pivots and a prioritized remediation list.",
            "Because Cowork actually creates a new workbook, the output is something you can attach directly to a status mail or import into your tracking tool - not just a text summary you have to reformat.",
          ],
          code: {
            language: "text",
            filename: "atc-analysis-prompt.txt",
            code: `Analyze atc-results-sprint14.xlsx in this folder.

Create a new workbook atc-analysis-sprint14.xlsx with:
1. Sheet "Summary": findings count by check title, by priority
   (1=error, 2=warning, 3=info), and by package.
2. Sheet "Top Offenders": the 20 objects with the most priority-1
   findings, with object name, package, and finding count.
3. Sheet "Remediation Plan": every priority-1 finding grouped by check
   title, with a short recommended fix per group (e.g. "replace
   SELECT * with a field list", "add ORDER BY before READ BINARY
   SEARCH").
4. Keep the raw data untouched on its original sheet.

Use conditional formatting: red fill for priority 1, yellow for
priority 2.`,
          },
        },
        {
          title: "Build a cutover checklist from scattered inputs",
          body: [
            "Cutover preparation typically means merging inputs from many sources: transport lists, manual activity notes, interface switchover steps, and lessons learned from the last release. Copy those files into the workspace and ask Cowork to consolidate them into a single sequenced checklist with owners, dependencies, and timing columns.",
            "This is where the agentic mode shines: Cowork cross-references the documents, spots duplicates and gaps ('transport TR12 appears in the list but has no activity assigned'), and produces one consistent artifact.",
          ],
          code: {
            language: "text",
            filename: "cutover-checklist-prompt.txt",
            code: `Inputs in this folder:
- transports-release-2405.xlsx (transport list with owners)
- manual-activities.docx (post-import manual steps)
- interface-switchover.md (interface freeze and switch steps)
- lessons-learned-2311.docx (issues from the previous cutover)

Create cutover-checklist-release-2405.xlsx with columns:
Seq | Phase (Pre-Cutover / Cutover / Post-Cutover / Validation) |
Activity | System (DEV/QAS/PRD) | Owner | Depends on Seq | Planned
Duration | Status.

Rules:
- Every transport must appear as an import activity in the right phase.
- Every manual activity must reference the transport it belongs to,
  or be flagged [UNLINKED].
- Add a "Risks" sheet with items derived from the lessons-learned
  document.`,
          },
          callout: {
            type: "tip",
            title: "Iterate on the artifact, not from scratch",
            body: "When reviewers request changes, tell Cowork what to adjust in the existing file ('move all interface steps before transport imports and renumber') instead of regenerating everything. Cowork edits the workbook in place, preserving work you already validated.",
          },
        },
        {
          title: "Review, verify, and hand over",
          body: [
            "Always review Cowork's output before circulating it. Check the [ASSUMPTION] and [TBD] markers, verify object names against the actual system, and spot-check a sample of rows in generated spreadsheets against the source data.",
            "Save the prompt briefs that worked well into a team prompt library - a good Cowork brief is a reusable asset, and over time your team builds a set of standard 'work orders' for recurring SAP document tasks.",
          ],
        },
      ],
      screenshots: [
        {
          caption: "Cowork session with a selected SAP project folder",
          description:
            "The Claude Desktop app in Cowork mode showing the file tree of a Windows folder (ticket export, FS template) on the left and Claude's step-by-step task plan in the main pane.",
        },
        {
          caption: "Generated ATC analysis workbook opened in Excel",
          description:
            "An Excel window showing the Summary sheet Cowork created from an ATC export: a findings-by-priority table with red and yellow conditional formatting and a top-offenders list.",
        },
      ],
      video: {
        caption: "Cowork walkthrough: from ticket export to functional spec draft",
        description:
          "A screen recording that opens Cowork in Claude Desktop, selects a folder containing a ticket export and a spec template, sends a task brief, follows Cowork's plan execution, and reviews the generated Word document with assumption markers.",
        duration: "8:45",
      },
      sapExample: {
        title: "Beverage company: ATC baseline analysis during S/4HANA readiness",
        scenario:
          "A global beverage company is nine months from its S/4HANA go-live. The AMS team ran a full ATC check with the S/4HANA readiness variant over 4,200 custom objects and exported the 18,000 findings to Excel. Management wants a remediation plan by package and team by Friday - a task that previously took a senior developer three days of manual pivoting and classification.",
        prompt: `Analyze atc-s4-readiness-full.xlsx (18k rows: object, package,
check title, priority, message).

Produce s4-remediation-plan.xlsx:
1. "Executive Summary" sheet: total findings by priority; top 10 check
   titles by count; estimated effort using this mapping - priority 1
   finding = 0.5h, priority 2 = 0.25h, priority 3 = 0.
2. "By Team" sheet: our teams own packages by prefix - ZSD* = Team
   Order-to-Cash, ZMM* = Team Procure-to-Pay, ZFI* = Team Finance,
   everything else = Team Core. Show findings and estimated hours per
   team.
3. "Quick Wins" sheet: check titles where one code pattern fixes many
   findings (e.g. field lists instead of SELECT *), sorted by findings
   per pattern.
Flag any package that does not match our prefixes on a "Review" sheet.`,
        explanation: [
          "Cowork reads the 18,000-row export, builds the aggregations, applies the team mapping rules, and writes a multi-sheet workbook - the same deliverable the senior developer produced manually, but in minutes instead of days. The effort model and team mapping come from the prompt, so the business logic stays under the team's control and is easy to adjust and re-run.",
          "The 'Review' sheet pattern is important: instead of silently forcing every package into a team bucket, Claude is instructed to surface anything that does not match the rules. Human reviewers then resolve only the exceptions, which is where their judgment is actually needed.",
        ],
      },
      bestPractices: [
        "Create a dedicated workspace folder per task and copy only the needed input files into it",
        "Write task briefs like work orders: goal, inputs by filename, output filename, and rules",
        "Ask Claude to mark assumptions and unknowns with [ASSUMPTION] or [TBD] instead of guessing",
        "Review generated documents and spreadsheets against source data before circulating them",
        "Iterate on the generated file with follow-up instructions rather than regenerating from scratch",
        "Save proven task briefs to a shared prompt library so the whole team benefits",
        "Anonymize or exclude sensitive data (customer names, pricing, HR data) before adding files to the workspace",
      ],
      commonMistakes: [
        {
          mistake:
            "Pointing Cowork at a huge shared drive folder with hundreds of unrelated files.",
          fix: "Create a small dedicated folder with only the task inputs. Claude works faster, and you avoid exposing unrelated or sensitive documents.",
        },
        {
          mistake:
            "Giving a vague instruction like 'clean up this ATC export' and expecting a specific deliverable.",
          fix: "Specify the exact output: sheet names, columns, grouping rules, and formatting. Cowork follows a precise brief far more reliably than it guesses your intent.",
        },
        {
          mistake:
            "Treating the generated functional spec as final and sending it to the business unreviewed.",
          fix: "Cowork drafts; humans approve. Review assumption markers, verify object names in the system, and have a functional consultant sign off.",
        },
        {
          mistake:
            "Expecting Cowork to read data directly from the SAP system or run transactions.",
          fix: "Cowork operates on local files. Export the data first (ATC results, ticket lists, transports), or use Claude Code with an SAP-connected MCP server when live system access is needed.",
        },
        {
          mistake: "Restarting the whole task whenever a reviewer requests a small change.",
          fix: "Tell Cowork exactly what to change in the existing output file. In-place edits preserve validated content and are much faster.",
        },
      ],
      tips: [
        "On Windows, pin your Cowork workspace folders to File Explorer Quick Access so you can drop exports in quickly",
        "Export ATC results via the SAP GUI spreadsheet export (or ADT) as .xlsx - Cowork handles Excel natively",
        "Keep a _templates subfolder with your FS template and checklist formats so every brief can reference them",
        "Use OneDrive/SharePoint-synced folders carefully: let sync finish before starting a session so Claude sees complete files",
        "Name output files with version suffixes (v0.1, v0.2) in your briefs so review rounds stay traceable",
      ],
      exercise: {
        title: "Draft a functional spec and analysis pack with Cowork",
        scenario:
          "You received ticket INC0042 asking for a new output condition check in billing, plus an ATC export (atc-billing.xlsx) for the affected package ZSD_BILLING. Your team lead wants a spec draft and a mini remediation summary in one folder by tomorrow morning.",
        tasks: [
          "Create a workspace folder C:\\SAP-Work\\cowork-sessions\\inc0042 and place the ticket export and ATC file in it",
          "Write a Cowork brief that produces FS_ZSD_OUTPUT_CHECK_v0.1.docx from the ticket, with [ASSUMPTION] markers",
          "Extend the brief (or send a second one) to create atc-billing-summary.xlsx with findings by priority and a top-10 offender list",
          "Review the outputs and note every assumption you would need to verify with the functional consultant",
          "Refine one section of the spec via a follow-up instruction instead of regenerating the document",
        ],
        hint: "Handle the two deliverables as two separate briefs in the same session - Cowork keeps the folder context, and smaller briefs are easier to verify step by step.",
        solution: {
          language: "text",
          filename: "solution-brief.txt",
          code: `Brief 1:
Read inc0042-export.txt. Draft a functional spec using
FS-Template.docx with sections Purpose, Business Background, Process
Description (as-is/to-be), Affected Objects, Authorization
Considerations, Test Cases. Mark assumptions [ASSUMPTION], unknown
transaction codes [TBD]. Save as FS_ZSD_OUTPUT_CHECK_v0.1.docx.

Brief 2:
Analyze atc-billing.xlsx. Create atc-billing-summary.xlsx with:
- Sheet "Summary": findings by priority and by check title
- Sheet "Top 10": the 10 objects with the most priority-1 findings
Red fill for priority-1 rows.

Follow-up refinement (example):
In FS_ZSD_OUTPUT_CHECK_v0.1.docx, expand the Test Cases section:
add one negative test per validation rule and a regression test for
standard billing output. Keep all other sections unchanged.`,
        },
      },
      quiz: [
        {
          question: "What is Claude Cowork?",
          options: [
            "A web-only chat interface for team conversations",
            "The agentic workspace mode in the Claude Desktop app that works on files in a folder you select",
            "An SAP GUI plugin that runs ATC checks automatically",
            "A code editor extension for ABAP development",
          ],
          correctIndex: 1,
          explanation:
            "Cowork is Claude Desktop's agentic workspace mode: you point it at a local folder and it reads, analyzes, and creates files there to complete multi-step office tasks.",
        },
        {
          question:
            "Your team needs a remediation summary from an 18,000-row ATC Excel export. What is the best first step?",
          options: [
            "Paste all 18,000 rows into a chat message",
            "Ask Cowork to log on to the SAP system and rerun the ATC check",
            "Copy the export into a dedicated workspace folder and give Cowork a precise brief describing the output workbook",
            "Split the file into 50 smaller files manually before involving Claude",
          ],
          correctIndex: 2,
          explanation:
            "Cowork reads large Excel files directly from the workspace folder. A precise brief describing sheets, groupings, and rules produces a reviewable deliverable in one pass.",
        },
        {
          question: "Which task is NOT a good fit for Cowork?",
          options: [
            "Drafting a functional spec from a ticket export",
            "Consolidating transport lists and manual activities into a cutover checklist",
            "Debugging a live ABAP program in the DEV system",
            "Summarizing meeting notes into an action list document",
          ],
          correctIndex: 2,
          explanation:
            "Cowork operates on local files and does not connect to SAP systems. Live debugging belongs in Eclipse ADT, optionally assisted by Claude Code with SAP tooling.",
        },
        {
          question: "Why should you ask Cowork to mark assumptions with [ASSUMPTION]?",
          options: [
            "It makes the document longer and more impressive",
            "It lets reviewers focus verification effort exactly where Claude had to fill gaps",
            "It is required by the Claude Desktop app",
            "It prevents Cowork from saving the file",
          ],
          correctIndex: 1,
          explanation:
            "Explicit assumption markers turn review from a full re-read into targeted verification of the points where the source material was incomplete.",
        },
      ],
      summary: [
        "Cowork is Claude Desktop's agentic mode: point it at a folder and it completes multi-step file tasks - reading, analyzing, and creating Excel and Word documents",
        "SAP sweet spots are functional spec drafting, ATC export analysis, and cutover checklist consolidation - work that surrounds the code, not the code itself",
        "Precise briefs (inputs by name, exact outputs, rules, assumption markers) are the key skill; review the output before it leaves your desk",
        "Cowork complements Claude Code: files and documents in Cowork, repository and code work in Claude Code",
      ],
      download: {
        name: "Cowork Task Brief Pack for SAP Teams",
        description:
          "Ready-to-adapt Cowork briefs for functional specs, ATC analysis, and cutover checklists, plus a workspace setup checklist.",
        filename: "cowork-sap-task-brief-pack.md",
        content: `# Cowork Task Brief Pack for SAP Teams

Reusable briefs for Claude Cowork (Claude Desktop, agentic workspace
mode). Copy a brief, replace the placeholders in angle brackets, and
send it as your first Cowork message.

## Workspace setup checklist

- [ ] Dedicated folder created (e.g. C:\\SAP-Work\\cowork-sessions\\<task>)
- [ ] Only required input files copied in
- [ ] Sensitive data removed or anonymized (customers, prices, HR)
- [ ] Templates available in a _templates subfolder
- [ ] Output filenames and versions defined before starting

## Brief 1: Functional spec from ticket

\`\`\`text
Read <ticket-file>. Draft a functional specification using
<template.docx> with sections: Purpose, Business Background, Process
Description (as-is / to-be), Affected Objects, Authorization
Considerations, Test Cases.
Rules:
- Mark every assumption [ASSUMPTION].
- Write [TBD] for unknown transaction codes or object names.
- Save as FS_<object>_v0.1.docx.
\`\`\`

## Brief 2: ATC export analysis

\`\`\`text
Analyze <atc-export.xlsx>. Create <atc-analysis.xlsx> with:
1. "Summary": findings by check title, priority, package.
2. "Top Offenders": top 20 objects by priority-1 findings.
3. "Remediation Plan": priority-1 findings grouped by check title with
   a recommended fix per group.
Red fill for priority 1, yellow for priority 2. Keep raw data intact.
\`\`\`

## Brief 3: Cutover checklist consolidation

\`\`\`text
Inputs: <transport-list.xlsx>, <manual-activities.docx>,
<interface-steps.md>, <lessons-learned.docx>.
Create <cutover-checklist.xlsx> with columns:
Seq | Phase | Activity | System | Owner | Depends on Seq | Planned
Duration | Status.
Rules:
- Every transport appears as an import activity.
- Unlinked manual activities are flagged [UNLINKED].
- Add a "Risks" sheet from the lessons-learned document.
\`\`\`

## Review checklist (before you share any output)

- [ ] All [ASSUMPTION] / [TBD] / [UNLINKED] markers resolved or assigned
- [ ] Object and transaction names spot-checked in the system
- [ ] Spreadsheet totals reconciled against the source export
- [ ] Version suffix bumped and previous version archived
`,
      },
      relatedSlugs: ["claude-desktop", "agent", "skills", "excel-extension"],
    },

    // =====================================================================
    // Lesson 2: Working with Claude Agents
    // =====================================================================
    {
      slug: "agent",
      title: "Working with Claude Agents",
      description:
        "Understand agentic workflows - the plan-act-observe loop, Claude Code as an agent, subagents, long-running tasks, and the guardrails SAP teams need before letting agents run.",
      duration: 30,
      level: "Advanced",
      keywords: [
        "agent",
        "agentic workflow",
        "agent loop",
        "subagents",
        "guardrails",
        "human in the loop",
        "claude code",
        "automation",
      ],
      overview: [
        "An agent is Claude operating in a loop: it plans an approach, acts through tools (reading files, running commands, calling APIs), observes the results, and iterates until the goal is reached or it needs your input. This is fundamentally different from single-shot chat: instead of you orchestrating every step, the model orchestrates itself and reports back. Claude Code is the agent SAP developers will use most - it explores a repository, edits code, runs checks, and fixes its own mistakes based on what it observes.",
        "Agentic workflows unlock tasks that are impractical in chat: migrating dozens of ABAP includes to clean-core patterns, remediating an ATC backlog file by file, or generating documentation for an entire package. Agents can also fan out work to subagents that operate in parallel - one subagent per package, for example - and run long tasks that span many minutes.",
        "With this power comes real risk. An agent that can act can also act wrongly, at machine speed. This lesson therefore spends as much time on guardrails - permission modes, human-in-the-loop checkpoints, sandboxing, and the hard rule of never letting an unattended agent touch production systems - as it does on capability. In an SAP landscape, where a wrong change can stop order entry or period close, disciplined agent usage is not optional.",
      ],
      objectives: [
        "Explain the agent loop (plan, act via tools, observe, iterate) and how it differs from single-shot prompting",
        "Run Claude Code as an agent on a realistic multi-file ABAP task",
        "Use subagents to parallelize independent work such as per-package analysis",
        "Design guardrails: permission boundaries, checkpoints, and verification steps for agent runs",
        "Identify tasks that must never run unattended - especially anything touching SAP production systems",
      ],
      steps: [
        {
          title: "Understand the agent loop",
          body: [
            "Every agent run follows the same cycle. Plan: Claude breaks the goal into steps. Act: it executes a step through a tool - reading a file, editing code, running a syntax check or a command. Observe: it inspects the tool output - did the edit apply, did the check pass, what did the search return? Iterate: it updates the plan based on what it observed and continues, until it finishes or hits something that needs a human decision.",
            "The observe step is what makes agents robust: an agent that runs your test suite after each change catches its own regressions. When you design agent tasks, always give the agent a way to verify its work - a check to run, a comparison to make, a definition of done it can test against.",
          ],
          code: {
            language: "text",
            filename: "agent-loop.txt",
            code: `Goal: "Remove all SELECT * from package ZSD_BILLING"

PLAN     -> list objects in package, find SELECT * occurrences,
            fix one object at a time, verify syntax after each fix
ACT      -> grep for "SELECT *" in the extracted sources
OBSERVE  -> 14 occurrences in 6 includes
ACT      -> edit include zsd_billing_f01: replace SELECT * with
            explicit field list derived from the following code
OBSERVE  -> edit applied; syntax check passed
ITERATE  -> next occurrence ... (repeat)
DONE     -> summary: 14 occurrences fixed, 6 objects touched,
            all syntax checks green, 2 places flagged for review
            because the field usage was dynamic`,
          },
        },
        {
          title: "Run Claude Code as an agent",
          body: [
            "Claude Code (the agentic CLI, also available as a VS Code extension) is a full agent harness: it has tools for file search, reading, editing, and running commands, and it manages the loop for you. You give it a goal in plain language; it explores the repository, proposes changes, applies them, and verifies.",
            "Start with tasks that have clear, checkable outcomes. 'Rename this data element everywhere and show me the diff' is agent-friendly; 'make the billing module better' is not. The more objective the definition of done, the better the agent performs.",
          ],
          code: {
            language: "text",
            filename: "claude-code-agent-task.txt",
            code: `Task for Claude Code (run inside the abapGit-synced repo):

Migrate zcl_sd_pricing_helper and its 3 local test classes from
call-method syntax and header lines to modern ABAP:
- functional method calls instead of CALL METHOD
- inline declarations where the type is obvious
- replace header-line tables with explicit work areas
Constraints:
- Do NOT change method signatures or public interfaces.
- After each file, run the abaplint check and fix any issue you
  introduced.
- Stop and ask me before touching anything outside these 4 files.
Definition of done: abaplint clean on all 4 files, behavior-equivalent
code, summary of every change as a bullet list.`,
          },
          callout: {
            type: "tip",
            title: "Work on a git branch, always",
            body: "Run agents on a dedicated branch of your abapGit repository. Every agent change is then a reviewable diff, and a bad run is one 'git checkout' away from gone. The branch is your cheapest and strongest guardrail.",
          },
        },
        {
          title: "Fan out with subagents",
          body: [
            "For large, divisible tasks, Claude Code can launch subagents - independent agent instances that work on separate slices in parallel and report back to the main agent. A classic SAP pattern: analyzing 12 packages for S/4HANA readiness, with one subagent per package, then a consolidated report from the main agent.",
            "Subagents work best when slices are truly independent (no shared files) and when each subagent gets the same precise instructions and output format, so the main agent can merge results mechanically. Keep write-access fan-out conservative: parallel analysis is low risk, parallel editing of overlapping code is asking for conflicts.",
          ],
          code: {
            language: "text",
            filename: "subagent-fanout.txt",
            code: `Main agent instruction:

For each of the packages ZSD_ORDERS, ZSD_BILLING, ZSD_OUTPUT,
launch a subagent with this task:

  "Scan all sources of package <package> for:
   1. Direct reads on tables replaced in S/4HANA (KONV, VBUK, VBUP)
   2. MOVE-CORRESPONDING to/from database structures
   3. Native SQL and EXEC SQL blocks
   Output: markdown table with object, line, finding type, snippet."

Then merge the three reports into s4-scan-sd.md, sorted by finding
type, with a totals row per package. Analysis only - no code changes.`,
          },
        },
        {
          title: "Handle long-running tasks",
          body: [
            "Agent runs on real backlogs (hundreds of ATC findings, large migrations) can take a long time and burn significant context. Structure them for resumability: have the agent maintain a progress file (e.g. progress.md with a checklist of objects done/pending), commit after each completed unit, and write down decisions it made so a fresh session can pick up where the last one stopped.",
            "Break mega-tasks into batches with a human checkpoint between batches. Reviewing 10 diffs at a time is sustainable; reviewing 300 at the end is not, and by then a systematic error has been repeated 300 times.",
          ],
          code: {
            language: "markdown",
            filename: "progress.md",
            code: `# ATC Remediation Run - ZSD_BILLING

## Rules applied
- SELECT *: replace with explicit field list from usage analysis
- Missing ORDER BY before BINARY SEARCH: add SORT + note in summary

## Done
- [x] zsd_billing_f01 (4 findings) - commit a1b2c3
- [x] zsd_billing_f02 (2 findings) - commit d4e5f6

## Pending
- [ ] zsd_billing_f03 (5 findings)
- [ ] zcl_sd_invoice_split (3 findings)

## Decisions / flagged for human review
- zsd_billing_f02 line 214: dynamic field access - NOT auto-fixed,
  needs developer decision`,
          },
        },
        {
          title: "Design guardrails and human-in-the-loop checkpoints",
          body: [
            "Guardrails are the constraints you set before the run: which folders and files the agent may touch, which commands it may run, what it must ask permission for, and what it must never do. Claude Code enforces permission prompts for commands and edits by default - resist the temptation to blanket-approve everything on risky tasks.",
            "Human-in-the-loop means placing yourself at the points of irreversibility: before commits are pushed, before anything is imported into a shared system, before a batch of changes is accepted as the template for the next hundred. The agent drafts and verifies; you decide.",
          ],
          callout: {
            type: "danger",
            title: "Never let an agent run unattended against production",
            body: "No agent - however well prompted - should have unattended write access to SAP production or the transport route into it. Agents work on repository copies and sandboxes; humans review diffs, run the transport process, and own the release. A hallucinated 'fix' auto-imported into PRD is an outage, not an experiment.",
          },
        },
        {
          title: "Verify outcomes and build trust incrementally",
          body: [
            "Close every agent run with verification the agent cannot fake: run the ATC check again and compare finding counts, execute the unit test suite, diff the generated code against the old version, and sample-review changes manually. Trust in agents is earned per task type - after ten clean SELECT-star remediation runs you can loosen review sampling for that task, while a new task type starts at full review again.",
            "Capture what worked - the instructions, constraints, and verification steps - as a team skill (next lesson) so successful agent workflows become repeatable assets rather than personal folklore.",
          ],
        },
      ],
      screenshots: [
        {
          caption: "Claude Code executing an agent loop on an ABAP repository",
          description:
            "A terminal running Claude Code: the agent's plan is listed at the top, followed by tool calls (grep, file edit, lint run) and their observed results, with a permission prompt awaiting user approval for a command.",
        },
        {
          caption: "Reviewing an agent's changes as a git diff",
          description:
            "VS Code diff view showing an agent's modernization changes to an ABAP class side by side - CALL METHOD replaced with functional calls - with the git branch name visible in the status bar.",
        },
      ],
      video: {
        caption: "Agent guardrails in practice: a supervised ATC remediation run",
        description:
          "Demonstrates a full supervised agent run: setting up a branch, giving Claude Code a batched remediation task with a progress file, approving and rejecting individual actions, checkpointing between batches, and verifying with a re-run of the checks.",
        duration: "11:20",
      },
      sapExample: {
        title: "CPG company: batched ATC remediation with a supervised agent",
        scenario:
          "A consumer packaged goods company mid-S/4HANA migration has 340 priority-1 ATC findings in its order-to-cash custom code. The team syncs the packages to git via abapGit and assigns a developer to run Claude Code as a supervised agent, two hours per day, with a strict batch-and-review protocol instead of one giant unattended run.",
        prompt: `You are working on branch atc-remediation-otc. Read progress.md
first and continue from the pending list.

Process the next 10 objects:
1. Fix only these finding types: SELECT * (use explicit field lists),
   missing ORDER BY before BINARY SEARCH, obsolete MOVE syntax.
2. Anything else you find: do not fix - add it to the "flagged"
   section of progress.md.
3. After each object: run abaplint, then git commit with message
   "ATC fix: <object> (<n> findings)".
4. Update progress.md after every object.
Stop after 10 objects and print a review summary with all diffs
listed. Do not push.`,
        explanation: [
          "The batch protocol keeps the human in control at the right granularity: ten objects per run means every diff gets a real review, systematic errors are caught after ten objects instead of three hundred, and the progress file makes each session resumable by any team member - not just the person who started it.",
          "Note the explicit scope constraints: the agent fixes only whitelisted finding types and flags everything else. This separation of mechanical fixes (agent) from judgment calls (human) is what made the team comfortable scaling the approach - after two weeks they raised the batch size to 25 objects for the SELECT-star category while keeping full review for everything else.",
        ],
      },
      bestPractices: [
        "Give every agent task an objective definition of done that the agent can verify itself",
        "Run agents on dedicated git branches so every change is a reviewable, revertable diff",
        "Batch large tasks with human checkpoints between batches instead of one giant run",
        "Maintain a progress file for long-running tasks so runs are resumable and auditable",
        "Whitelist what the agent may change; have it flag - not fix - everything outside the whitelist",
        "Verify outcomes with tools the agent cannot fake: re-run ATC, execute unit tests, diff and sample-review",
        "Keep production systems and transport releases strictly human-operated",
      ],
      commonMistakes: [
        {
          mistake: "Giving an agent a vague goal like 'improve the code quality of our namespace'.",
          fix: "Scope to concrete, checkable outcomes: specific finding types, specific packages, a lint or test that must pass. Vague goals produce sprawling, unreviewable changes.",
        },
        {
          mistake: "Blanket-approving every permission prompt to make the run go faster.",
          fix: "Permission prompts are your checkpoint mechanism. Auto-approve only read-only operations; keep edits and commands under review on risky or unfamiliar task types.",
        },
        {
          mistake: "Letting one agent session run for hours across hundreds of objects without checkpoints.",
          fix: "Batch the work, review between batches, and use a progress file. Errors repeat at machine speed - catch them after 10 objects, not 300.",
        },
        {
          mistake: "Pointing an agent at a live SAP system connection with write access 'to save the abapGit round trip'.",
          fix: "Agents work on repository copies and sandboxes. Changes travel to SAP systems through the normal human-reviewed transport process, never through unattended agent writes.",
        },
        {
          mistake: "Trusting the agent's own summary ('all checks pass') as the final verification.",
          fix: "Independently re-run the checks and tests yourself or in CI. The agent's summary tells you what it believes; verification tells you what is true.",
        },
      ],
      tips: [
        "On Windows, run Claude Code in Windows Terminal with your repo folder as the start directory; the VS Code extension gives you the same agent with an integrated diff view",
        "Ask the agent to print its plan first and confirm before it starts editing - a one-minute plan review prevents most wasted runs",
        "Use 'analysis-only' agent runs (no edits allowed) as a safe way to build trust on a new task type",
        "Keep a killed-run playbook: git status, git diff, git checkout - practice recovering from a bad run once, on purpose",
        "Store your best agent task instructions in the team prompt library or as a skill - they are as valuable as code snippets",
      ],
      exercise: {
        title: "Design and run a supervised agent task",
        scenario:
          "Your team owns package ZFI_REPORTING (28 objects, synced to git via abapGit). The backlog contains 45 priority-1 ATC findings, mostly SELECT * and missing ORDER BY before BINARY SEARCH. You have been asked to pilot an agent-assisted remediation and present a protocol your lead can approve.",
        tasks: [
          "Write the agent task instruction: scope (finding types), constraints, batch size, verification, and stop conditions",
          "Define the guardrails: branch strategy, permission handling, and what the agent must flag instead of fix",
          "Design the progress.md structure the agent must maintain",
          "Run (or dry-run) the first batch and document the review protocol you applied to the diffs",
          "Write three sentences for your lead: what the agent does, what humans do, and why production is not at risk",
        ],
        hint: "Start from the definition of done and work backwards: what check proves a batch is correct? Everything else - batch size, flags, checkpoints - follows from making that check reviewable.",
        solution: {
          language: "text",
          filename: "agent-protocol-solution.txt",
          code: `Agent task (per batch):
"On branch atc-fix-zfi, read progress.md and process the next 8
pending objects. Fix ONLY: SELECT * (explicit field lists) and
missing ORDER BY before READ ... BINARY SEARCH. Flag all other
findings in progress.md without changing them. After each object run
abaplint and commit ('ATC fix: <object>'). Stop after 8 objects, do
not push, print all diffs."

Guardrails:
- Dedicated branch; push and transport remain human actions
- Edits/commands individually approved; reads auto-approved
- Whitelist of 2 finding types; everything else flag-only

progress.md sections: Rules applied / Done (with commits) /
Pending / Flagged for human review.

Verification per batch: abaplint in CI, unit tests for the 3 covered
classes, manual review of every diff, ATC re-run at pilot end
comparing finding counts.

For the lead: The agent performs mechanical, whitelisted fixes on a
git branch in reviewable batches of 8. Humans review every diff,
own commits to main, and run the transport process. Production is
untouched: the agent has no system access, only repository files.`,
        },
      },
      quiz: [
        {
          question: "What are the four phases of the agent loop?",
          options: [
            "Prompt, respond, copy, paste",
            "Plan, act via tools, observe results, iterate",
            "Compile, test, transport, release",
            "Read, summarize, translate, format",
          ],
          correctIndex: 1,
          explanation:
            "An agent plans an approach, acts through tools, observes the results of each action, and iterates until the goal is reached or human input is needed.",
        },
        {
          question: "When are subagents most appropriate?",
          options: [
            "When a task divides into independent slices, like analyzing separate packages in parallel",
            "When you want two agents to edit the same include simultaneously",
            "When a task is too risky for a single agent",
            "Whenever a task takes longer than five minutes",
          ],
          correctIndex: 0,
          explanation:
            "Subagents shine on independent, parallelizable slices with a uniform output format. Overlapping write access creates conflicts, and risk is managed by guardrails, not by agent count.",
        },
        {
          question:
            "Which statement about agents and SAP production systems is correct?",
          options: [
            "Agents may write to production if the prompt includes 'be careful'",
            "Unattended agent access to production is acceptable outside business hours",
            "Agents should never have unattended write access to production; changes go through human-reviewed transports",
            "Production access is fine as long as the agent maintains a progress file",
          ],
          correctIndex: 2,
          explanation:
            "The hard rule: agents work on repository copies and sandboxes. Humans review diffs and operate the transport process. No prompt wording substitutes for this boundary.",
        },
        {
          question: "Why batch a 300-object remediation into runs of 10 with review between batches?",
          options: [
            "Claude cannot process more than 10 files",
            "Systematic errors get caught after 10 objects instead of being repeated 300 times, and each review stays manageable",
            "Git cannot handle more than 10 commits per day",
            "Batching makes the agent run faster",
          ],
          correctIndex: 1,
          explanation:
            "Agents repeat mistakes at machine speed. Checkpoints bound the blast radius of a systematic error and keep human review effective.",
        },
      ],
      summary: [
        "Agents run a plan-act-observe-iterate loop through tools; Claude Code is the agent harness SAP developers use for repository work",
        "Subagents parallelize independent slices; long tasks need batching, progress files, and human checkpoints",
        "Guardrails - branches, permission prompts, whitelists, independent verification - are what make agent speed safe",
        "Production systems and transports stay human-operated: agents draft and verify, humans review and release",
      ],
      download: {
        name: "Agent Guardrails Checklist for SAP Teams",
        description:
          "A pre-flight checklist, task instruction template, and review protocol for running supervised Claude agents on SAP codebases.",
        filename: "sap-agent-guardrails-checklist.md",
        content: `# Agent Guardrails Checklist for SAP Teams

Use before, during, and after every Claude Code agent run on SAP code.

## Pre-flight

- [ ] Task has an objective definition of done (check/test that proves it)
- [ ] Dedicated git branch created; working tree clean
- [ ] Scope whitelisted: packages, objects, finding/change types
- [ ] Everything outside the whitelist is flag-only, never auto-fixed
- [ ] Batch size defined (start small: 5-10 objects)
- [ ] progress.md initialized (Rules / Done / Pending / Flagged)
- [ ] No credentials or production connections reachable by the agent

## Task instruction template

\`\`\`text
On branch <branch>, read progress.md and process the next <n> pending
objects.
Fix ONLY: <whitelisted change types>.
Flag everything else in progress.md without changing it.
After each object: run <check>, commit "<prefix>: <object>".
Stop after <n> objects. Do not push. Print all diffs and a summary.
\`\`\`

## During the run

- [ ] Plan reviewed and confirmed before first edit
- [ ] Edits and commands approved individually (reads may auto-approve)
- [ ] Run interrupted if the agent leaves the whitelist

## Per-batch review

- [ ] Every diff read by a human
- [ ] Lint/tests re-run independently (CI, not the agent's claim)
- [ ] Flagged items triaged and assigned
- [ ] progress.md matches reality (commits exist, counts add up)

## Hard rules

1. No unattended agent writes to any SAP system - ever.
2. Transports and releases are human actions.
3. Production data never enters the agent workspace.
4. A new task type starts at full review, regardless of past trust.

## Recovery drill (practice once)

\`\`\`text
git status          # what did the run touch?
git diff            # inspect
git checkout -- .   # discard uncommitted damage
git reset --hard <last-good-commit>   # roll back committed damage
\`\`\`
`,
      },
      relatedSlugs: ["claude-code", "cowork", "skills", "security-guidelines"],
    },

    // =====================================================================
    // Lesson 3: Claude Skills
    // =====================================================================
    {
      slug: "skills",
      title: "Claude Skills",
      description:
        "Package your team's ABAP guidelines and playbooks as Claude Skills - instruction folders with SKILL.md that Claude loads on demand - and share them across the team via git.",
      duration: 25,
      level: "Intermediate",
      keywords: [
        "skills",
        "SKILL.md",
        "slash commands",
        "abap guidelines",
        "playbook",
        "team knowledge",
        "claude code",
      ],
      overview: [
        "A Skill is a packaged folder of instructions that Claude loads when a task calls for it. At its core is a SKILL.md file containing the instructions, optionally accompanied by resource files - templates, reference tables, example code, checklists. Instead of pasting your ABAP naming conventions into every conversation, you write them once as a skill; Claude then discovers and applies them automatically whenever they are relevant, or when you invoke the skill explicitly.",
        "Skills solve the consistency problem every SAP team has with AI: ten developers prompting individually get ten flavors of output. With a shared 'our ABAP coding guidelines' skill and an 'ATC remediation playbook' skill, everyone's Claude follows the same rules - the same naming conventions, the same clean-core boundaries, the same fix patterns. Because skills are plain folders of text files, they live naturally in a git repository, get reviewed like code, and version like code.",
        "This lesson covers the anatomy of a skill, how triggering works (the description decides when Claude loads it), invoking skills as /slash commands in Claude Code, and the workflow for building and distributing team skills through git.",
      ],
      objectives: [
        "Describe the structure of a skill: folder, SKILL.md with frontmatter, and supporting resource files",
        "Write a trigger-effective description so Claude loads the skill exactly when it should",
        "Create a team skill encoding your ABAP coding guidelines",
        "Invoke skills explicitly via /slash commands in Claude Code",
        "Distribute and version team skills through a shared git repository",
      ],
      steps: [
        {
          title: "Understand the anatomy of a skill",
          body: [
            "A skill is a folder named after the skill, containing a SKILL.md file. SKILL.md starts with YAML frontmatter - at minimum a name and a description - followed by the instruction body in Markdown. The folder can hold additional resources (reference docs, templates, code examples) that the instructions point Claude to when needed.",
            "The description in the frontmatter is the skill's advertisement: Claude sees all skill descriptions all the time, but reads a skill's full body only when the description matches the task at hand. This 'progressive disclosure' keeps context lean - you can have dozens of skills installed, and only the relevant one loads.",
          ],
          code: {
            language: "markdown",
            filename: "abap-guidelines/SKILL.md",
            code: `---
name: abap-guidelines
description: Our team's ABAP coding guidelines. Use when writing,
  reviewing, or refactoring any ABAP code - classes, reports, CDS
  views, or RAP objects - so output follows company conventions.
---

# ABAP Coding Guidelines (Team Order-to-Cash)

## Naming
- Classes: zcl_<area>_<noun>, interfaces zif_<area>_<noun>
- Methods: verb_noun (get_open_items, not items_get)
- No Hungarian prefixes on local variables; importing params i_*,
  exporting e_*, changing c_*, returning r_*

## Modern ABAP (mandatory)
- Inline declarations where the type is clear
- Functional method calls; CALL METHOD is forbidden in new code
- String templates |...| instead of CONCATENATE
- Constructor expressions VALUE / CORRESPONDING over MOVE-CORRESPONDING

## Database access
- No SELECT * - always explicit field lists
- ORDER BY PRIMARY KEY when a sorted result is assumed
- All new data models: CDS views, not classic DDIC views

## Clean core
- No modifications to SAP objects; use released APIs and BAdIs
- New developments in the ZOTC_* package hierarchy only

For the full rationale and examples, read reference.md in this folder.`,
          },
        },
        {
          title: "Write descriptions that trigger correctly",
          body: [
            "Claude decides whether to load a skill by matching the task against the skill's description. A vague description ('helpful ABAP stuff') under-triggers; an overly broad one ('use for all programming') over-triggers and pollutes unrelated tasks. State what the skill contains and precisely when to use it, including the trigger words your team actually uses.",
            "Test triggering empirically: ask Claude to do a task that should load the skill and one that should not, and check whether the guidelines show up in the output. Tune the description, not the body, when triggering misbehaves.",
          ],
          code: {
            language: "text",
            filename: "description-patterns.txt",
            code: `Weak (under-triggers):
  description: ABAP help for the team.

Too broad (over-triggers):
  description: Use this for every development task.

Good (specific content + explicit trigger conditions):
  description: ATC remediation playbook with approved fix patterns
    for our top finding types (SELECT *, BINARY SEARCH without SORT,
    obsolete syntax). Use whenever fixing, explaining, or planning
    remediation of ATC findings or code inspector results.`,
          },
        },
        {
          title: "Create an ATC remediation playbook skill",
          body: [
            "Guideline skills tell Claude how code should look; playbook skills tell it how to execute a recurring procedure. An ATC remediation playbook encodes your team's approved fix pattern per finding type, the order of operations, and the escalation rules - exactly the knowledge that currently lives in one senior developer's head.",
            "Structure playbooks as decision-oriented steps: for each finding type, the approved fix, the conditions under which not to auto-fix, and what to do instead. This is what turns an agent run from 'plausible fixes' into 'our fixes'.",
          ],
          code: {
            language: "markdown",
            filename: "atc-remediation/SKILL.md",
            code: `---
name: atc-remediation
description: ATC remediation playbook with approved fix patterns per
  finding type. Use whenever fixing ATC findings, planning remediation
  batches, or reviewing remediation diffs.
---

# ATC Remediation Playbook

## General rules
1. One commit per object, message "ATC fix: <object> (<n> findings)".
2. Never change method signatures while fixing findings.
3. If a fix would alter behavior, flag it - do not fix.

## Fix patterns

### SELECT *
- Determine used fields from the subsequent code.
- Replace with explicit field list.
- If fields are accessed dynamically (ASSIGN COMPONENT, dynamic
  tokens): FLAG, do not fix.

### READ ... BINARY SEARCH without prior SORT
- Add SORT by the read key directly before the loop/read block.
- If the table is filled sorted by a SELECT ... ORDER BY: add a
  comment instead and mark finding as pseudo-comment candidate.

### Obsolete MOVE / header lines
- MOVE x TO y  ->  y = x.
- Header-line tables: introduce explicit work area <tab>_line.

## Escalation
Anything not covered here goes to the flagged list with a one-line
reason - never invent a new fix pattern mid-run.`,
          },
          callout: {
            type: "info",
            title: "Skills work across Claude surfaces",
            body: "Skills are supported in Claude Code and in the Claude apps (Web/Desktop, where your plan supports them). The same SKILL.md format applies - author once, use wherever your team works with Claude.",
          },
        },
        {
          title: "Install skills and invoke them with /slash commands",
          body: [
            "In Claude Code, skills live in the .claude/skills folder of a project (project-specific) or in your user profile's .claude/skills folder (personal, available in every project - on Windows that is C:\\Users\\<you>\\.claude\\skills). Each skill is one subfolder containing SKILL.md.",
            "Claude loads skills automatically when their description matches the task, and you can also invoke one explicitly by typing a slash command with the skill's name - for example /abap-guidelines or /atc-remediation - to force it into context for the current conversation. Explicit invocation is useful when you want a review pass to strictly apply the guidelines regardless of how the request is phrased.",
          ],
          code: {
            language: "text",
            filename: "skill-layout.txt",
            code: `Project layout (Claude Code):

C:\\SAP-Work\\otc-repo\\
  .claude\\
    skills\\
      abap-guidelines\\
        SKILL.md
        reference.md
        examples\\
          good_class_example.abap
      atc-remediation\\
        SKILL.md
      fs-spec-writer\\
        SKILL.md
        FS-Template.docx

Usage in Claude Code:
  > /abap-guidelines review zcl_sd_pricing_helper for violations
  > /atc-remediation plan the next batch from atc-export.xlsx`,
          },
        },
        {
          title: "Share skills across the team via git",
          body: [
            "Because skills are plain folders, the distribution mechanism is one your team already has: git. Keep a team-skills repository (or a skills folder inside your main repo), review changes to skills via pull requests exactly like code changes, and let each developer clone or pull it into their .claude/skills location.",
            "Treat skills as living documents with an owner. When the ATC playbook gains a new fix pattern or the guidelines adopt a new rule, the change is a PR: visible, reviewed, and versioned. Old prompt-pasting habits die quickly once the skill repo becomes the single source of truth.",
          ],
          code: {
            language: "text",
            filename: "team-skill-workflow.txt",
            code: `# One-time setup per developer (Windows, Git Bash or PowerShell)
git clone https://git.company.com/sap/team-claude-skills.git
# Link or copy into the project:
#   <repo>\\.claude\\skills\\  <- checked into the project repo, or
#   C:\\Users\\<you>\\.claude\\skills\\  <- personal, all projects

# Updating a skill (same flow as code)
git checkout -b skill/atc-playbook-add-cx-root-pattern
# edit atc-remediation/SKILL.md
git commit -am "ATC playbook: add pattern for empty CATCH cx_root"
git push; open pull request; team reviews; merge
# everyone: git pull -> updated playbook active immediately`,
          },
        },
      ],
      screenshots: [
        {
          caption: "A team skill folder open in VS Code",
          description:
            "VS Code Explorer showing the .claude/skills tree with abap-guidelines and atc-remediation folders, SKILL.md open in the editor displaying frontmatter and guideline sections.",
        },
        {
          caption: "Invoking a skill via slash command in Claude Code",
          description:
            "Claude Code terminal where the user typed /atc-remediation with a task; the response shows Claude applying the playbook's fix patterns and flagging an uncovered finding type per the escalation rule.",
        },
      ],
      video: {
        caption: "Building your first team skill from guidelines to git",
        description:
          "Walks through converting an existing coding-guidelines wiki page into a SKILL.md with effective frontmatter, testing triggering with positive and negative tasks, invoking it via slash command, and publishing it through a pull request to the team skills repo.",
        duration: "7:30",
      },
      sapExample: {
        title: "Beverage company: one review standard across three ABAP teams",
        scenario:
          "A beverage manufacturer runs three ABAP teams (Order-to-Cash, Procure-to-Pay, Finance) in the middle of an S/4HANA program. Code reviews were inconsistent: each team's Claude-assisted reviews reflected the prompt style of whoever ran them. The lead architect converted the dormant 40-page guideline document into two skills - abap-guidelines and review-checklist - in a shared git repo, and made /review-checklist the mandated entry point for AI-assisted reviews.",
        prompt: `/review-checklist Review the diff in changes.diff for our merge
request. Apply the guidelines strictly. Output:
1. Blocking violations (rule ID + line + fix suggestion)
2. Non-blocking recommendations
3. Clean-core assessment: any SAP-object modification or unreleased
   API usage?
Format as a markdown review comment I can paste into the merge request.`,
        explanation: [
          "With the skill in place, every developer's review pass applies the same ruleset - the skill body carries the rule IDs, severity classification, and clean-core criteria, so the prompt only needs to say what to review. New team members produce senior-grade review comments in their first week because the checklist knowledge is in the skill, not in tribal memory.",
          "The git workflow closed the loop with governance: when the architecture board added a rule banning direct BAPI calls in RAP behavior implementations, one merged PR to SKILL.md rolled the rule out to all three teams the same day - measurably faster than the previous approach of announcing guideline changes in a monthly meeting.",
        ],
      },
      bestPractices: [
        "One skill per concern: guidelines, remediation playbook, and spec writing are separate skills, not one mega-skill",
        "Invest in the description - it alone decides when the skill loads; state content and trigger conditions explicitly",
        "Keep SKILL.md concise and action-oriented; move long rationale and examples to resource files it references",
        "Test triggering with both positive and negative tasks before rolling a skill out",
        "Version team skills in git and change them via reviewed pull requests with a named owner",
        "Encode escalation rules in playbook skills so Claude flags uncovered cases instead of improvising",
        "Prefer skills over re-pasted prompt blocks whenever the same instructions are used more than twice",
      ],
      commonMistakes: [
        {
          mistake: "Dumping the entire 40-page guideline document into SKILL.md.",
          fix: "SKILL.md carries the operative rules in condensed form; the full document becomes a resource file the skill references for rationale. Lean skills apply reliably.",
        },
        {
          mistake: "Writing a description like 'team knowledge' and wondering why the skill never triggers.",
          fix: "Describe the content and the situations to use it, with concrete trigger vocabulary: 'Use when writing, reviewing, or refactoring ABAP code'.",
        },
        {
          mistake: "Emailing skill files around or keeping them on a personal drive.",
          fix: "Distribute through a git repository with pull-request review. Copies drift; a shared repo stays the single source of truth.",
        },
        {
          mistake: "Creating overlapping skills whose instructions contradict each other.",
          fix: "Give each skill a distinct concern and cross-reference instead of duplicating rules. When two skills state the same rule differently, one of them is wrong.",
        },
        {
          mistake: "Never updating skills after rollout, letting them drift from actual team practice.",
          fix: "Assign an owner, review skills each sprint or after each retro, and treat 'the skill is outdated' as a bug with a PR as the fix.",
        },
      ],
      tips: [
        "On Windows, your personal skills live at C:\\Users\\<you>\\.claude\\skills - project skills in <repo>\\.claude\\skills win for team consistency",
        "Start by converting your most-pasted prompt block into a skill - instant payoff, minimal writing",
        "Add a good/bad code example pair as resource files; examples steer Claude more strongly than prose rules",
        "Use slash invocation in review workflows to guarantee the checklist applies even to vaguely phrased requests",
        "Put the skill version and last-updated date in the SKILL.md body so outdated clones are easy to spot",
      ],
      exercise: {
        title: "Build and publish your team's first skill",
        scenario:
          "Your team has an ABAP guidelines wiki page nobody reads and a recurring problem: AI-generated code uses CALL METHOD, SELECT *, and wrong naming. You will convert the essentials into a skill, verify triggering, and prepare it for team distribution.",
        tasks: [
          "Create the folder abap-guidelines with a SKILL.md; write frontmatter with a trigger-specific description",
          "Condense your five most-violated rules into the skill body (naming, modern syntax, database access)",
          "Test triggering: one task that must load the skill (write an ABAP class) and one that must not (summarize a ticket)",
          "Invoke the skill explicitly with /abap-guidelines on an existing class and review the violations it reports",
          "Commit the skill to a git repository with a README explaining where to place it on Windows",
        ],
        hint: "Pick rules where violations are objectively checkable (SELECT *, CALL METHOD, prefix conventions) - your triggering test then has a clear pass/fail signal in the generated code.",
        solution: {
          language: "markdown",
          filename: "abap-guidelines/SKILL.md",
          code: `---
name: abap-guidelines
description: Team ABAP coding guidelines. Use when writing, reviewing,
  or refactoring ABAP code of any kind (classes, reports, CDS, RAP)
  so output follows team conventions.
---

# ABAP Guidelines - Top 5 Rules

1. Naming: classes zcl_<area>_<noun>; methods verb_noun;
   params i_/e_/c_/r_ prefixes.
2. No CALL METHOD in new code - functional calls only.
3. No SELECT * - explicit field lists, always.
4. Inline declarations and string templates over legacy syntax.
5. New code only in Z<AREA>_* packages; no SAP-object modifications.

When reviewing, report violations as: rule number, line, suggested
fix. When writing code, apply all rules silently.

See examples/good_class_example.abap for the reference style.`,
        },
      },
      quiz: [
        {
          question: "What is a Claude Skill, structurally?",
          options: [
            "A fine-tuned model variant for a specific domain",
            "A folder containing a SKILL.md instruction file plus optional resource files",
            "A browser extension that adds buttons to Claude Web",
            "A compiled plugin installed through an app store",
          ],
          correctIndex: 1,
          explanation:
            "A skill is a plain folder: SKILL.md (frontmatter + instructions) at its core, optionally with templates, references, and examples alongside - which is why git distributes skills so well.",
        },
        {
          question: "What determines whether Claude loads a skill automatically for a task?",
          options: [
            "The alphabetical order of skill folder names",
            "The size of the SKILL.md file",
            "The match between the task and the skill's frontmatter description",
            "Skills always load for every conversation",
          ],
          correctIndex: 2,
          explanation:
            "Claude sees all skill descriptions and reads a skill's full body only when the description matches the task - so the description is the triggering mechanism and deserves careful wording.",
        },
        {
          question: "How do you force a specific skill into the current Claude Code conversation?",
          options: [
            "Rename the folder to start with an underscore",
            "Invoke it as a slash command, e.g. /atc-remediation",
            "Restart Claude Code three times",
            "Paste the SKILL.md content into the chat",
          ],
          correctIndex: 1,
          explanation:
            "Typing the skill name as a slash command explicitly invokes it, guaranteeing the instructions apply regardless of how the request is phrased.",
        },
        {
          question: "What is the recommended way to share team skills?",
          options: [
            "Email SKILL.md files to colleagues when they change",
            "A shared network drive folder everyone edits directly",
            "A git repository with pull-request review, cloned into each developer's .claude/skills location",
            "Screenshots of the guidelines posted in the team chat",
          ],
          correctIndex: 2,
          explanation:
            "Skills are text files, so git gives you review, versioning, ownership, and instant team-wide rollout on merge - the same governance as code.",
        },
      ],
      summary: [
        "Skills package instructions as folders with SKILL.md; the frontmatter description controls when Claude loads them",
        "Guideline skills standardize how code should look; playbook skills standardize how procedures like ATC remediation run",
        "Invoke skills automatically by task match or explicitly via /slash commands in Claude Code",
        "Distribute skills through git with PR review - team knowledge becomes versioned, owned, and instantly rolled out",
      ],
      download: {
        name: "Claude Skills Starter Pack for SAP Teams",
        description:
          "SKILL.md templates for ABAP guidelines, ATC remediation, and spec writing, plus a skill authoring and rollout checklist.",
        filename: "claude-skills-starter-pack.md",
        content: `# Claude Skills Starter Pack for SAP Teams

Three SKILL.md templates and the checklists to author and roll them
out. Each skill is a folder containing a SKILL.md file.

## Template 1: abap-guidelines/SKILL.md

\`\`\`markdown
---
name: abap-guidelines
description: Team ABAP coding guidelines. Use when writing, reviewing,
  or refactoring ABAP code (classes, reports, CDS, RAP) so output
  follows team conventions.
---
# ABAP Guidelines
## Naming
<your conventions>
## Modern ABAP (mandatory)
<your rules: functional calls, inline declarations, string templates>
## Database access
<no SELECT *, ORDER BY rules, CDS-first>
## Clean core
<package hierarchy, released APIs only>
\`\`\`

## Template 2: atc-remediation/SKILL.md

\`\`\`markdown
---
name: atc-remediation
description: ATC remediation playbook with approved fix patterns per
  finding type. Use when fixing ATC findings or reviewing remediation
  diffs.
---
# ATC Remediation Playbook
## General rules
<commit granularity, no signature changes, flag-don't-guess>
## Fix patterns
### <finding type>
- Approved fix: <pattern>
- Do NOT fix when: <condition> -> flag instead
## Escalation
<where uncovered findings go>
\`\`\`

## Template 3: fs-spec-writer/SKILL.md

\`\`\`markdown
---
name: fs-spec-writer
description: Functional specification writing rules and template
  structure. Use when drafting or updating functional specs from
  tickets or requirements.
---
# FS Writing Rules
- Sections: Purpose, Business Background, Process (as-is/to-be),
  Affected Objects, Authorizations, Test Cases
- Mark assumptions [ASSUMPTION], unknowns [TBD]
- Template file: FS-Template.docx in this folder
\`\`\`

## Authoring checklist

- [ ] One concern per skill; no overlaps with existing skills
- [ ] Description states content AND trigger conditions
- [ ] Body condensed; rationale/examples moved to resource files
- [ ] Escalation rule included (playbooks)
- [ ] Positive and negative trigger test passed

## Rollout checklist

- [ ] Skill in the team git repo with named owner
- [ ] README documents install paths:
      project: <repo>\\.claude\\skills\\
      personal (Windows): C:\\Users\\<you>\\.claude\\skills\\
- [ ] Announced with one example slash invocation
- [ ] Review cadence agreed (e.g. every sprint retro)
`,
      },
      relatedSlugs: ["claude-code", "prompt-library", "agent", "github-integration"],
    },

    // =====================================================================
    // Lesson 4: Connectors & Integrations
    // =====================================================================
    {
      slug: "connectors",
      title: "Connectors & Integrations",
      description:
        "Connect Claude Web and Desktop to SharePoint/Microsoft 365, Google Drive, Slack, and GitHub via MCP-based Connectors - safely, with admin approval and corporate data rules.",
      duration: 25,
      level: "Intermediate",
      keywords: [
        "connectors",
        "mcp",
        "sharepoint",
        "microsoft 365",
        "google drive",
        "slack",
        "github",
        "enterprise security",
      ],
      overview: [
        "Connectors let Claude Web (claude.ai) and Claude Desktop reach into the tools where your project information actually lives: SharePoint and Microsoft 365, Google Drive, Slack, GitHub, and more. Instead of downloading a functional spec from SharePoint and re-uploading it to a chat, you enable the connector once, authenticate, and then simply ask Claude to find and use the document. Under the hood, connectors are built on MCP - the Model Context Protocol, an open standard that defines how AI applications talk to external tools and data sources.",
        "For SAP teams the payoff is context: specifications, interface contracts, ticket threads, and design decisions are scattered across SharePoint sites, mail, chat channels, and repositories. A Claude that can search those sources answers questions like 'what did we agree about the pricing interface?' with the actual documents - including citations of where the answer came from.",
        "In a corporate SAP landscape, connectors are also a governance topic. This lesson covers how enabling and authenticating works, what your admin controls on Team/Enterprise plans, and the data-handling rules your team should follow: least privilege, no production credentials, and awareness that whatever a connector can read, your Claude conversation can contain.",
      ],
      objectives: [
        "Explain what Connectors are and how they relate to MCP (Model Context Protocol)",
        "Enable and authenticate a connector such as SharePoint/Microsoft 365 or GitHub in Claude Web or Desktop",
        "Retrieve SAP project documents and ticket context through connectors with source citations",
        "Apply corporate security rules: admin approval, least-privilege scopes, and data classification awareness",
        "Recognize when a custom MCP server is the right step beyond standard connectors",
      ],
      steps: [
        {
          title: "Understand connectors and their MCP foundation",
          body: [
            "A connector is a packaged integration between Claude and an external service, built on MCP. MCP standardizes how a tool describes its capabilities (search files, read a page, list issues) so any MCP-capable client - Claude Web, Claude Desktop, Claude Code - can use it. Connectors are the productized, one-click form of this: Anthropic and partners maintain them, you enable and authenticate them in settings.",
            "The important mental model: a connector gives Claude tools, not a data dump. When you ask a question, Claude decides to call the connector's search or fetch tools, retrieves only the relevant items, and cites them. Your permissions still apply - Claude can only see what the authenticated account can see.",
          ],
        },
        {
          title: "Enable and authenticate a connector",
          body: [
            "In Claude Web or Claude Desktop, open Settings and go to Connectors. You will see the catalog of available connectors (Google Drive, Microsoft 365/SharePoint, Slack, GitHub, and others) plus any custom connectors your organization has added. Click Connect on the one you need and complete the OAuth sign-in with your corporate account - for Microsoft 365 that is your normal Entra ID login, often including your company's MFA.",
            "On Team and Enterprise plans, admins control which connectors are available at all, so the catalog you see is already the approved list. After connecting, individual chats let you toggle which connected tools Claude may use, which is good practice: enable only what the current task needs.",
          ],
          callout: {
            type: "warning",
            title: "Get admin approval before connecting corporate sources",
            body: "In most SAP customer organizations, connecting company SharePoint, mail, or repositories to any external AI service requires IT security approval. On managed plans, admins whitelist connectors centrally - if a connector is missing from your catalog, that is a governance decision, not a bug. Never work around it with personal accounts.",
          },
        },
        {
          title: "Pull SAP project documents from SharePoint",
          body: [
            "With the Microsoft 365 connector enabled, Claude can search your SharePoint sites and OneDrive for documents you have access to. This is where scattered project documentation becomes usable: ask for the current functional spec of an interface and Claude finds the document, reads it, and answers with citations - or drafts the technical design skeleton based on it.",
            "Be specific in your requests: name the project, document type, and what to extract. That keeps searches sharp and results verifiable.",
          ],
          code: {
            language: "text",
            filename: "sharepoint-prompts.txt",
            code: `Find the latest functional specification for the customer pricing
interface (project "Phoenix") in SharePoint. Then:
1. Summarize the interface trigger, direction, and payload fields.
2. List all validation rules as a numbered list.
3. Extract every open point or [TBD] with the section it appears in.
Cite the document and section for each answer.

---

Search SharePoint for the interface contract documents of project
Phoenix updated in the last 30 days and list them with owner and
last-modified date. I need to know which contracts changed since
our design freeze.`,
          },
        },
        {
          title: "Search tickets and team knowledge",
          body: [
            "Connectors to Slack (and to ticket systems available in your organization's catalog) let Claude search discussion history and ticket threads: what was decided, who raised the issue, which workaround was applied last time. For recurring incident patterns this is a genuine time-saver - the answer to 'have we seen this dump before?' is usually somewhere in a channel or an old ticket.",
            "Combine sources in one question and let Claude correlate: the design decision from SharePoint, the exception discussion from Slack, and the code from GitHub.",
          ],
          code: {
            language: "text",
            filename: "ticket-search-prompts.txt",
            code: `Search our Slack workspace for discussions about the
CX_SY_OPEN_SQL_DB dump in the billing job (ZSD_BILLING_RUN) over the
last 6 months. Summarize:
- how often it came up and in which channels
- root causes that were identified
- the workaround or fix applied each time, with links

Then check the GitHub repository sap-otc-billing for commits or pull
requests referencing this dump or the ZSD_BILLING_RUN job, and tell
me whether a permanent fix was merged.`,
          },
        },
        {
          title: "Apply corporate security and data rules",
          body: [
            "Connectors inherit your permissions, but that is only the first layer. Apply least privilege: connect only the sources a task genuinely needs, and prefer read-only scopes where the connector offers them. Remember that retrieved content becomes part of the conversation - so data classification rules follow the data: if a document is confidential, the conversation containing it is too.",
            "Hard lines for SAP landscapes: no production system credentials in any connector configuration, no connecting sources containing regulated personal data without an approved data-protection review, and custom MCP servers only from sources your organization vetted - a malicious server can feed Claude misleading tool results.",
          ],
          code: {
            language: "json",
            filename: "connector-governance-example.json",
            code: `{
  "organization": "Beverage Corp - SAP CoE",
  "plan": "enterprise",
  "connector_policy": {
    "approved": [
      { "name": "microsoft-365", "scope": "read-only", "note": "Project sites PHX-* only" },
      { "name": "github", "scope": "repo:read", "note": "sap-* repositories" },
      { "name": "slack", "scope": "search:read", "note": "excludes #hr-* and #finance-*" }
    ],
    "blocked": ["personal-cloud-storage"],
    "custom_mcp_servers": {
      "allowed": false,
      "exception_process": "Security review via ticket to IT-SEC, TISAX checklist"
    },
    "rules": [
      "No production SAP credentials in any connector or MCP config",
      "Confidential documents: retrieval allowed, external sharing of chats prohibited",
      "Connector list reviewed quarterly by IT security"
    ]
  }
}`,
          },
          callout: {
            type: "danger",
            title: "Whatever a connector reads, the chat contains",
            body: "Retrieved document content lives in the conversation. Do not pull confidential material into chats you plan to share, and follow your organization's retention and sharing policies for AI conversations exactly as you would for the documents themselves.",
          },
        },
        {
          title: "Know when you need a custom MCP server instead",
          body: [
            "Standard connectors cover mainstream services. When your team needs Claude to reach something SAP-specific - reading ATC results live from a system, querying a custom ticket database, or browsing repository metadata from your internal tools - that is the territory of custom MCP servers, which your organization can build and register as custom connectors.",
            "The evaluation question is simple: is the data already in a connected mainstream tool (use the connector), or is it locked in a system only you can expose (consider an MCP server, with security review)? The MCP lessons later in this academy cover building and running such servers, including an SAP ABAP MCP server.",
          ],
        },
      ],
      screenshots: [
        {
          caption: "Connector catalog in Claude settings",
          description:
            "The Connectors settings page in Claude Web showing tiles for Google Drive, Microsoft 365, Slack, and GitHub, with Connect buttons and an admin-approved badge on the organization's whitelisted entries.",
        },
        {
          caption: "Claude answering from SharePoint with citations",
          description:
            "A Claude conversation where a question about a pricing interface spec is answered with a summary and footnote-style citations linking to the SharePoint document sections that were retrieved.",
        },
      ],
      video: {
        caption: "Connecting Claude to SharePoint and GitHub for an SAP project",
        description:
          "Shows enabling the Microsoft 365 and GitHub connectors, the OAuth sign-in flow with a corporate account, retrieving a functional spec with citations, cross-referencing a Slack incident thread, and the per-chat tool toggles for least-privilege usage.",
        duration: "9:10",
      },
      sapExample: {
        title: "CPG company: interface development with connected project context",
        scenario:
          "A CPG company's SAP integration team is building 40 interfaces for their S/4HANA program. Specs live in SharePoint, decisions in Slack, code in GitHub via abapGit. Before connectors, developers spent the first hour of every interface task hunting for the current spec version and the latest decision thread. IT security approved read-only Microsoft 365, Slack, and GitHub connectors for the project sites, channels, and repos.",
        prompt: `I am starting development of interface IF-023 (customer master
distribution to the trade promotion tool).

1. Find the current functional spec for IF-023 in SharePoint
   (project site "S4-Phoenix") and summarize scope, trigger,
   and field mapping. Cite the document version.
2. Search Slack #s4-integration for decisions about IF-023 made
   after the spec's last modified date - list anything that
   changed or contradicts the spec.
3. Check GitHub repo sap-integration for an existing branch or
   class for IF-023.
Output a development kickoff summary: confirmed scope, deltas
between spec and later decisions, existing artifacts, and open
questions I must clarify before coding.`,
        explanation: [
          "One prompt replaces the manual first hour: Claude retrieves the spec, detects that two Slack decisions postdate the document (a field added to the payload, a changed error-handling agreement), and finds a stub class from an earlier sprint in GitHub. The developer starts with a kickoff summary that already reconciles the sources - and the citations make every claim checkable.",
          "The governance framing mattered as much as the capability: read-only scopes limited to project sites, channels, and sap-* repositories got the setup through security review quickly, and the per-chat tool toggles let developers keep unrelated connectors off. The deltas Claude surfaces still get confirmed with the functional consultant - the connector removes the searching, not the accountability.",
        ],
      },
      bestPractices: [
        "Route all connector enablement through your admin/IT security process; use only the approved catalog",
        "Apply least privilege: read-only scopes where available, and per-chat tool toggles limited to the task",
        "Always ask for citations so retrieved facts can be verified against the source documents",
        "Name projects, sites, and document types in prompts to keep connector searches precise",
        "Treat conversations containing confidential retrieved content under the same classification as the source",
        "Keep production SAP credentials out of every connector and MCP configuration",
        "Review connected sources periodically and disconnect what a project no longer needs",
      ],
      commonMistakes: [
        {
          mistake: "Connecting a personal cloud account because the corporate connector is not whitelisted yet.",
          fix: "Missing connectors are a governance decision. Request approval through IT security; bypassing it with personal accounts violates most corporate AI policies.",
        },
        {
          mistake: "Assuming Claude sees all company documents once a connector is enabled.",
          fix: "Connectors inherit the authenticated user's permissions. Claude can only retrieve what your account can access - missing results often mean missing permissions, not a broken connector.",
        },
        {
          mistake: "Accepting connector-retrieved answers without checking citations.",
          fix: "Ask for citations and spot-check them. Retrieval can surface an outdated spec version; the citation shows you which document and section the answer came from.",
        },
        {
          mistake: "Leaving every connector active in every conversation.",
          fix: "Use per-chat tool toggles. A code review chat does not need mail and drive access; smaller tool surface means tighter answers and less accidental data pull-in.",
        },
        {
          mistake: "Adding an unvetted third-party MCP server as a custom connector.",
          fix: "Custom servers run tool logic outside your control and can inject misleading results. Only use servers your organization has security-reviewed and approved.",
        },
      ],
      tips: [
        "In Claude Desktop on Windows, connector authentication opens your default browser for corporate SSO - finish MFA there and return to the app",
        "If SharePoint search misses a document, check that the project site is included in the connector's site scope your admin configured",
        "Ask 'list what you found before using it' on broad searches - you confirm the right spec version before Claude builds on it",
        "Combine connectors deliberately: spec from SharePoint, decisions from Slack, code from GitHub in one correlated question",
        "Bookmark your organization's AI usage policy next to the connector settings - classification questions come up mid-task",
      ],
      exercise: {
        title: "Plan and run a governed connector workflow",
        scenario:
          "Your integration team wants Claude to answer 'what is the current agreed design of interface IF-017?' using SharePoint specs and Slack decision threads. IT security requires a proposal covering scopes and data rules before enabling anything.",
        tasks: [
          "Draft the connector request: which connectors, which scopes (read-only?), which sites/channels, and why",
          "Write the data-handling rules for the team: classification, citation checking, and per-chat toggle usage",
          "After (simulated) approval, write the prompt that retrieves the IF-017 spec and post-spec Slack decisions with citations",
          "Define how the developer verifies the answer before using it in development",
          "List one scenario from your landscape where a standard connector is insufficient and a custom MCP server would be needed",
        ],
        hint: "Structure the security proposal the way IT thinks: data sources, access scope, who can query, where retrieved data ends up, and how it is reviewed. Least privilege in the request speeds up approval more than any technical argument.",
        solution: {
          language: "text",
          filename: "connector-proposal-solution.txt",
          code: `Connector request (to IT security):
- Microsoft 365 connector, read-only, limited to SharePoint site
  "S4-Phoenix" - source of functional specs
- Slack connector, search-only, channels #s4-integration and
  #s4-defects - source of design decisions
- Users: integration team (8 developers), Enterprise plan, SSO+MFA
- Retrieved data remains in Claude conversations governed by the
  existing AI usage policy; confidential docs -> no shared chats

Team rules:
1. Citations mandatory; spot-check before reuse.
2. Per-chat toggles: enable only the connectors the task needs.
3. Conversations with confidential content are not shared externally.

Retrieval prompt:
"Find the current IF-017 functional spec in SharePoint site
S4-Phoenix; summarize scope, trigger, field mapping with document
version cited. Then search #s4-integration for IF-017 decisions
after the spec's last-modified date and list deltas vs. the spec."

Verification: open cited spec version, confirm deltas with the
functional consultant, record confirmed design in the kickoff note.

Custom MCP server case: live ATC results from the DEV system -
no standard connector reaches SAP; needs the SAP ABAP MCP server
plus its own security review.`,
        },
      },
      quiz: [
        {
          question: "What technology are Claude Connectors built on?",
          options: [
            "SAP RFC calls",
            "MCP - the Model Context Protocol, an open standard for connecting AI apps to tools and data",
            "Screen scraping of web applications",
            "Direct database links to each service",
          ],
          correctIndex: 1,
          explanation:
            "Connectors are productized MCP integrations: MCP standardizes how external services expose search/read tools that Claude can call, and connectors package that with one-click setup and OAuth.",
        },
        {
          question: "A document exists in SharePoint but Claude cannot find it via the connector. Most likely cause?",
          options: [
            "The connector deletes documents after reading them",
            "Claude only reads PDF files",
            "Your account lacks permission for that site, or the site is outside the configured connector scope",
            "SharePoint blocks all AI tools by default",
          ],
          correctIndex: 2,
          explanation:
            "Connectors inherit the authenticated user's permissions and the admin-configured scope. Access issues, not retrieval bugs, explain most missing results.",
        },
        {
          question: "Which rule belongs in every SAP team's connector governance?",
          options: [
            "Connect as many sources as possible to maximize context",
            "No production SAP credentials in any connector or MCP configuration",
            "Share all conversations publicly for transparency",
            "Disable citations to keep answers short",
          ],
          correctIndex: 1,
          explanation:
            "Production credentials in connector configs create an unattended path into your most critical systems. Least privilege, read-only scopes, and citation checking are the governance basics.",
        },
        {
          question: "When is a custom MCP server the right choice over a standard connector?",
          options: [
            "Whenever you want faster answers",
            "When the data lives in a system no standard connector reaches, such as live ATC results in your SAP system",
            "When the admin has not approved any connectors yet",
            "Custom servers should always replace standard connectors",
          ],
          correctIndex: 1,
          explanation:
            "Standard connectors cover mainstream services. SAP-internal data sources require a custom MCP server - built or vetted by your organization and passed through security review.",
        },
      ],
      summary: [
        "Connectors give Claude Web/Desktop MCP-based access to SharePoint/Microsoft 365, Google Drive, Slack, GitHub, and more - with your permissions and with citations",
        "Enablement is a governance act: admin-approved catalog, OAuth with corporate SSO, least-privilege scopes, per-chat tool toggles",
        "SAP teams gain the most from correlated retrieval: specs, decision threads, and code answered in one cited kickoff summary",
        "Data rules travel with the data - confidential retrievals make confidential chats - and SAP-internal sources need custom MCP servers with security review",
      ],
      download: {
        name: "Connector Governance Kit for SAP Teams",
        description:
          "A connector approval request template, team data-handling rules, and retrieval prompt patterns for SAP project sources.",
        filename: "connector-governance-kit.md",
        content: `# Connector Governance Kit for SAP Teams

Templates for getting connectors approved and using them safely in a
corporate SAP landscape.

## 1. Connector approval request template

\`\`\`text
Requested connector(s): <e.g. Microsoft 365, Slack, GitHub>
Scope: <read-only? which sites/channels/repos exactly?>
Users: <team, count, plan (Team/Enterprise), SSO/MFA status>
Purpose: <e.g. retrieve functional specs and decision threads for
  S/4HANA interface development>
Data classification touched: <internal / confidential / regulated?>
Retention & sharing: retrieved content stays in Claude conversations
  under policy <ref>; sharing rules: <...>
Review cadence: <e.g. quarterly scope review with IT-SEC>
\`\`\`

## 2. Team data-handling rules (post in your team channel)

1. Use only admin-approved connectors - never personal accounts.
2. Read-only scopes wherever offered; request write scopes separately.
3. Per-chat toggles: enable only what the current task needs.
4. Citations mandatory; spot-check the cited document/section.
5. Confidential retrieved content = confidential conversation.
6. No production SAP credentials in any connector or MCP config.
7. Custom MCP servers only after security review.

## 3. Retrieval prompt patterns

Spec retrieval:
\`\`\`text
Find the current functional spec for <interface/object> in SharePoint
site <site>. Summarize scope, trigger, and field mapping. Cite the
document and version.
\`\`\`

Decision delta check:
\`\`\`text
Search <channel> for decisions about <topic> after <spec date>.
List anything that changes or contradicts the spec, with links.
\`\`\`

Cross-source kickoff:
\`\`\`text
1. Spec for <ID> from SharePoint (cite version).
2. Post-spec decisions from Slack (list deltas).
3. Existing branches/classes in GitHub repo <repo>.
Output: kickoff summary with confirmed scope, deltas, artifacts,
open questions.
\`\`\`

## 4. Verification checklist before building on retrieved answers

- [ ] Cited document opened; version confirmed as current
- [ ] Deltas confirmed with the document owner / functional consultant
- [ ] Contradictions between sources resolved and recorded
- [ ] Kickoff note saved to the project site
`,
      },
      relatedSlugs: ["mcp-servers", "claude-web", "claude-desktop", "security-guidelines"],
    },
  ],
};
