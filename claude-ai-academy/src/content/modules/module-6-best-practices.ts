import type { Module } from "../types";

export const module6: Module = {
  slug: "best-practices",
  title: "Best Practices & Governance",
  shortTitle: "Governance",
  description:
    "Learn how to use Claude safely, effectively, and compliantly in SAP development — from reviewing AI-generated ABAP to protecting data and troubleshooting on Windows.",
  icon: "shield",
  lessons: [
    {
      slug: "ai-coding-best-practices",
      title: "AI Coding Best Practices",
      description:
        "Treat Claude as a pair programmer, not an oracle: review every line, keep changes small, verify against ATC, and version everything with abapGit.",
      duration: 30,
      level: "Intermediate",
      keywords: [
        "code review",
        "pair programming",
        "ATC",
        "abapGit",
        "hallucination",
        "verification",
        "coding guidelines",
        "version control",
      ],
      overview: [
        "Claude can write remarkably good ABAP, but it is a pair programmer — not an oracle. The single most important habit for AI-assisted SAP development is this: you own every line that goes into the system. Claude accelerates your work; it does not replace your judgment, your knowledge of the customer's landscape, or your responsibility for what runs in production. Developers who treat AI output as finished code create technical debt and defects; developers who treat it as a strong first draft ship faster and cleaner than ever.",
        "This lesson establishes a working discipline for AI-assisted ABAP development: review everything, keep changes small and testable, feed Claude your team's coding guidelines as context, and verify generated code against the syntax check and ABAP Test Cockpit (ATC) before it goes anywhere near a transport. You will also learn about the model's known failure modes — the most dangerous being hallucinated function modules and BAPIs that look completely plausible but do not exist in your system.",
        "Finally, we cover the team dimension: using abapGit for version control so AI-assisted changes are diffable and reversible, testing generated code in the development system before promoting it, and documenting AI usage according to your team's policy so audits and code reviews stay transparent.",
      ],
      objectives: [
        "Adopt a review-first workflow where every piece of AI-generated ABAP is read, understood, and verified before use",
        "Keep AI-assisted changes small and testable, iterating with feedback instead of accepting large code dumps",
        "Provide team coding guidelines and system context to Claude so output matches your standards on the first pass",
        "Verify generated code with syntax check, ATC, and SE37 lookups to catch hallucinated function modules and BAPIs",
        "Use abapGit and dev-system testing to keep AI-assisted work versioned, reversible, and auditable",
      ],
      steps: [
        {
          title: "Treat Claude as a pair programmer, not an oracle",
          body: [
            "Shift your mental model. A pair programmer suggests approaches, writes drafts, and catches your mistakes — but you both review each other's work. Claude is exactly that: fast, knowledgeable, tireless, and occasionally confidently wrong. It has never logged into your system, does not know your Z-namespace conventions unless you tell it, and cannot run the code it writes. You are the one with system access, business context, and accountability.",
            "In practice this means you never paste generated code into SE80 or ADT and activate it without reading it. Read the code as if a new team member wrote it: check the logic, check the naming, check the error handling, and ask Claude to explain anything you do not fully understand. 'Explain why you used a sorted table here' is a perfectly good follow-up prompt — and if the explanation does not hold up, you have caught a problem before it cost anything.",
          ],
          callout: {
            type: "warning",
            title: "You own the code, not the AI",
            body: "When AI-generated ABAP causes a production incident, the transport has your name on it — not Claude's. Review depth should match risk: a throwaway test report needs a quick skim; a change to pricing logic or a posting interface needs the same scrutiny you would give a junior developer's first transport.",
          },
        },
        {
          title: "Keep changes small, testable, and iterative",
          body: [
            "Resist the temptation to ask Claude for an entire program in one prompt. Large generated blocks are hard to review, hard to test, and hide subtle errors in the volume. Instead, work the way good pair programmers do: one method, one routine, one CDS view at a time. Generate, review, test, then move to the next piece. If the output is not right, do not silently fix it yourself and move on — tell Claude what was wrong ('the SELECT is missing the client handling for the RFC case', 'we use exception classes, not sy-subrc') so the next iteration improves.",
            "Small changes also mean testable changes. Ask Claude to generate the ABAP Unit test class alongside the method, run the tests in the dev system, and only then integrate. This iterate-with-feedback loop typically converges on correct code in two or three rounds, which is still dramatically faster than writing everything by hand.",
          ],
          code: {
            language: "text",
            filename: "iterative-prompt-pattern.txt",
            code: `ROUND 1 — Generate one focused unit:
"Write ONE method for class ZCL_INVOICE_CHECK:
 check_duplicate( iv_bukrs, iv_lifnr, iv_xblnr ) RETURNING rv_exists.
 It must SELECT from BSIP, raise ZCX_INVOICE_ERROR on DB issues,
 and follow clean ABAP (no forms, no global data)."

ROUND 2 — Feed back review findings:
"Good, but two issues:
 1. BSIP lookup must also compare WAERS and WRBTR.
 2. Our guideline: use COND #( ) instead of IF for the return flag.
 Please revise just this method."

ROUND 3 — Ask for the test:
"Now write the ABAP Unit test class for check_duplicate with
 a test double for the DB access (use CL_OSQL_TEST_ENVIRONMENT)."`,
          },
        },
        {
          title: "Give Claude your coding guidelines as context",
          body: [
            "Claude follows instructions extremely well — but only the instructions it has. If your team requires exception classes instead of classic exceptions, prefixes like ZCL_/ZIF_, English-only comments, no SELECT * ever, and clean-ABAP-style method lengths, say so. The most efficient way is a reusable 'guidelines block' that you paste at the start of coding sessions, keep in a Claude Project's instructions, or store in a CLAUDE.md file when using Claude Code against an abapGit repository.",
            "Include your system context too: NetWeaver or S/4HANA release (this decides whether Claude can use newer syntax like FINAL(), string templates, or entity manipulation language), your namespace, and whether the code must stay cloud-ready (ABAP for Cloud Development restrictions). Ten lines of context saves you thirty minutes of rework per task.",
          ],
          code: {
            language: "text",
            filename: "team-guidelines-context.txt",
            code: `Use this context for all ABAP you generate for me:

SYSTEM
- S/4HANA 2023 on-premise, ABAP 7.58 syntax allowed
- Namespace: Z* only; classes ZCL_*, interfaces ZIF_*, CDS ZI_/ZC_*

STYLE (Clean ABAP)
- Methods max ~30 lines, one purpose each
- Class-based exceptions only (ZCX_*), never sy-subrc checks across calls
- No SELECT *; always explicit field lists and WHERE on indexed fields
- Inline declarations (DATA(...), FINAL(...)) preferred
- English comments; explain WHY, not WHAT

QUALITY
- Every new class needs an ABAP Unit test class (FOR TESTING)
- Code must pass ATC check variant Z_DEFAULT with zero priority-1/2 findings
- No hardcoded values: use constants or TVARVC/customizing`,
          },
        },
        {
          title: "Verify: syntax check, ATC, and the SE37 reality test",
          body: [
            "Every piece of generated code goes through the same gate as human-written code: syntax check (Ctrl+F2), extended checks, and an ATC run against your team's check variant. ATC catches what reading alone misses — performance antipatterns, missing authority checks, robust programming violations. Treat an ATC-clean result as the minimum bar, not proof of correctness: ATC cannot judge whether the business logic is right.",
            "The special AI risk is hallucination: Claude may invent a function module, BAPI, class, or table field that looks completely plausible — 'BAPI_VENDOR_INVOICE_CHECK' or a field 'BSEG-ZTERM_TEXT' — but does not exist. This happens because the model generalizes from patterns in real SAP names. The countermeasure is mechanical: before using any function module or BAPI you did not already know, open SE37 (or the ADT search) and confirm it exists, is released, and has the signature Claude claimed. Same for classes in SE24 and table fields in SE11.",
          ],
          code: {
            language: "abap",
            filename: "verify-before-trust.abap",
            code: `" Claude suggested this call — VERIFY BEFORE USE:
"  1. SE37: does BAPI_INCOMINGINVOICE_CREATE exist?      -> YES (real)
"  2. Check signature: HEADERDATA, ITEMDATA, TAXDATA...   -> matches
"  3. Is it released for customer use? Check documentation.
"  4. SE11: do the structure fields Claude used exist?
CALL FUNCTION 'BAPI_INCOMINGINVOICE_CREATE'
  EXPORTING
    headerdata       = ls_header
  IMPORTING
    invoicedocnumber = lv_belnr
    fiscalyear       = lv_gjahr
  TABLES
    itemdata         = lt_items
    return           = lt_return.

" Counter-example: Claude once suggested 'BAPI_INVOICE_VALIDATE'
" for the same task. It sounds right. It DOES NOT EXIST.
" SE37 lookup took 10 seconds and prevented a dead end.`,
          },
          callout: {
            type: "danger",
            title: "Hallucinated APIs are the #1 AI-specific defect in ABAP",
            body: "Plausible-but-nonexistent function modules, BAPIs, and table fields are the most common failure mode when Claude generates SAP code. Never call an unfamiliar API without confirming it in SE37/SE24/SE11 first. If it does not exist, tell Claude — it will propose a real alternative.",
          },
        },
        {
          title: "Version control with abapGit and test in dev first",
          body: [
            "AI accelerates code production, which makes version control more important, not less. Put AI-assisted development objects under abapGit: every generated change becomes a reviewable diff, a revertible commit, and — if you use GitHub or GitLab — a pull request a colleague can review. This is also what unlocks Claude Code and the GitHub integration for ABAP work, since Claude can then read and propose changes against the repository directly.",
            "And the oldest rule still applies: all generated code is tested in the development system before it moves. Run the ABAP Unit tests, execute the report with realistic dev data, check SU53 for missing authorizations, and step through anything critical in the debugger once. The transport and approval process is unchanged — AI-generated code follows exactly the same DEV to QAS to PRD path with the same sign-offs.",
          ],
          code: {
            language: "text",
            filename: "abapgit-commit-convention.txt",
            code: `# Example team convention: mark AI-assisted commits transparently

git commit -m "feat(invoice): add duplicate check ZCL_INVOICE_CHECK

- New method CHECK_DUPLICATE with BSIP lookup
- ABAP Unit tests with OSQL test double
- ATC clean against Z_DEFAULT

AI-assisted: Claude (generation + tests), human-reviewed by A. Mahajan"`,
          },
        },
        {
          title: "Document AI usage and know the model's limits",
          body: [
            "Most teams now have (or are writing) a policy on documenting AI assistance — in commit messages, code review notes, or the transport documentation. Follow it. Transparency costs nothing and protects you: reviewers know where to look harder, auditors get a clear record, and the team builds a shared picture of where AI helps and where it struggles.",
            "Know the limits so you can predict them. Claude has a knowledge cutoff, so very recent SAP notes, release features, or API changes may be unknown to it. It cannot see your system, so anything landscape-specific (customizing, user exits already implemented, existing Z-objects) must be provided by you. It is weakest on obscure or version-specific behavior and strongest on standard patterns, refactoring, explanation, and test generation. Route your work accordingly: let Claude draft and explain, and keep the system-specific verification and the final decision with yourself.",
          ],
        },
      ],
      screenshots: [
        {
          caption: "ATC results in ADT for a Claude-generated class before and after remediation",
          description:
            "Eclipse ABAP Development Tools showing the ATC Problems view: the first run on generated code lists two priority-2 findings (missing WHERE-clause index support, missing authority check), the second run after one feedback iteration with Claude is clean.",
        },
        {
          caption: "SE37 lookup verifying a BAPI suggested by Claude actually exists",
          description:
            "SAP GUI transaction SE37 with the function module name BAPI_INCOMINGINVOICE_CREATE entered and the display screen showing its real parameter interface, side by side with the Claude chat suggesting the call.",
        },
      ],
      video: {
        caption: "The review-verify-iterate loop for AI-generated ABAP",
        description:
          "Screen recording of a full working loop: prompting Claude with team guidelines, reviewing the generated method in ADT, catching a hallucinated function module via SE37, feeding the finding back to Claude, and committing the corrected version with abapGit.",
        duration: "9:30",
      },
      sapExample: {
        title: "Catching a hallucinated BAPI in a vendor invoice automation project",
        scenario:
          "A developer at an automotive supplier asks Claude to generate posting logic for a vendor invoice automation report. Claude produces clean, well-structured code — built around a call to 'BAPI_INVOICE_POST_CHECK', which sounds exactly like something SAP would ship. The developer follows the team rule: every unfamiliar API gets an SE37 lookup before use.",
        prompt:
          "Write an ABAP method that posts a vendor invoice from structure zs_invoice_data using the appropriate standard BAPI, with full error handling of the RETURN table and a COMMIT via BAPI_TRANSACTION_COMMIT.",
        code: {
          language: "abap",
          filename: "hallucination-caught.abap",
          code: `" CLAUDE'S FIRST DRAFT (looks plausible):
CALL FUNCTION 'BAPI_INVOICE_POST_CHECK'   " <-- SE37: DOES NOT EXIST
  EXPORTING iv_simulate = abap_false ...

" DEVELOPER FEEDBACK TO CLAUDE:
" "BAPI_INVOICE_POST_CHECK does not exist in SE37.
"  Use a real released BAPI for MM logistics invoice verification."

" CLAUDE'S CORRECTED DRAFT (verified in SE37 - real):
CALL FUNCTION 'BAPI_INCOMINGINVOICE_CREATE'
  EXPORTING
    headerdata       = ls_headerdata
  IMPORTING
    invoicedocnumber = rv_belnr
    fiscalyear       = lv_gjahr
  TABLES
    itemdata         = lt_itemdata
    return           = lt_return.

LOOP AT lt_return INTO DATA(ls_return) WHERE type CA 'EAX'.
  RAISE EXCEPTION TYPE zcx_invoice_error
    EXPORTING bapi_return = ls_return.
ENDLOOP.

CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
  EXPORTING wait = abap_true.`,
        },
        explanation: [
          "The ten-second SE37 lookup is the entire safety net here. The hallucinated name followed SAP's naming pattern perfectly, the parameter interface Claude invented was internally consistent, and the surrounding error handling was correct — nothing about the code looked wrong. Only the reality test against the system caught it.",
          "Equally important is what happened next: the developer fed the finding back to Claude instead of silently fixing it. Claude immediately proposed the correct released BAPI (BAPI_INCOMINGINVOICE_CREATE) with the real signature, and the rest of the draft — RETURN table handling, exception raising, explicit commit — carried over unchanged. The iteration cost two minutes; writing the whole thing manually would have cost an hour.",
        ],
      },
      bestPractices: [
        "Read and understand every line of generated code before activating it — review depth proportional to business risk",
        "Work in small units (one method, one view) and iterate with concrete feedback rather than accepting large code dumps",
        "Maintain a reusable guidelines-and-system-context block and give it to Claude at the start of every coding session",
        "Run syntax check and ATC on all generated code, and treat a clean ATC as the minimum bar — not proof of correct logic",
        "Verify every unfamiliar function module, BAPI, class, and table field in SE37/SE24/SE11 before calling it",
        "Keep AI-assisted objects in abapGit so every change is a diffable, revertible, reviewable commit",
        "Follow your team's AI documentation policy in commits, reviews, and transport texts — transparency protects you",
      ],
      commonMistakes: [
        {
          mistake: "Pasting a large generated program into the system and activating it after a quick skim.",
          fix: "Generate in small units, read each one fully, and ask Claude to explain any construct you do not understand before you activate it.",
        },
        {
          mistake: "Calling a function module or BAPI from generated code without checking that it exists.",
          fix: "Make the SE37/SE24/SE11 lookup a reflex for every unfamiliar API. If it does not exist, tell Claude and ask for a real released alternative.",
        },
        {
          mistake: "Prompting without any system or style context, then spending time reworking output to team standards.",
          fix: "Front-load a guidelines block with release level, namespace, exception strategy, and ATC variant. Ten lines of context saves a full rework cycle.",
        },
        {
          mistake: "Silently fixing Claude's mistakes and moving on, so the same error recurs in the next generation.",
          fix: "Feed corrections back into the conversation ('we use ZCX exceptions, not sy-subrc'). Claude applies the correction for the rest of the session.",
        },
        {
          mistake: "Skipping ABAP Unit tests because 'the AI wrote it and it looks right'.",
          fix: "Ask Claude to generate the test class alongside the code and actually run it in dev. Generated tests catch generated bugs remarkably often.",
        },
      ],
      tips: [
        "In the Claude Desktop app on Windows, create a Project with your team guidelines as project instructions so every chat starts with the right context automatically.",
        "Keep your guidelines block in a file like C:\\Users\\<you>\\Documents\\claude\\abap-guidelines.txt and paste it with a Notepad++ or PowerToys shortcut when working outside Projects.",
        "When using Claude Code in Git Bash or WSL against an abapGit repo, put the guidelines in CLAUDE.md at the repo root — Claude Code reads it automatically.",
        "Use Windows Snipping Tool (Win+Shift+S) to screenshot ATC findings and paste them straight into Claude — it reads the screenshot and proposes fixes per finding.",
        "Pin SE37, SE24, and SE11 in your SAP GUI favorites as a 'verification bar' — the reality test should take seconds, not minutes.",
      ],
      exercise: {
        title: "Run the full review loop on a generated method",
        scenario:
          "Your team lead has approved a pilot: use Claude to build a small utility class ZCL_MATERIAL_CHECK with a method that verifies whether a material exists and is not flagged for deletion. You must follow the full best-practice loop — context first, small unit, verification, tests, and a documented abapGit commit.",
        tasks: [
          "Write a prompt that includes your system context (S/4HANA release, namespace, clean-ABAP rules) and requests exactly one method: material_exists( iv_matnr ) returning abap_bool.",
          "Review the generated code and identify every database table and API it uses; verify each one in SE11/SE37 and note any that do not exist.",
          "Give Claude at least one concrete piece of review feedback (real or simulated, e.g. 'use MARA-LVORM for the deletion flag check') and get a revised version.",
          "Ask Claude for an ABAP Unit test class for the method and run it in the dev system.",
          "Write the abapGit commit message following the team convention, including the AI-assisted note.",
        ],
        hint: "For task 2, the correct check needs MARA (fields MATNR and LVORM). If Claude used a function module like 'MATERIAL_CHECK_EXISTENCE', look it up in SE37 — some material-check FMs are real, others are not, which is exactly the point of the exercise.",
        solution: {
          language: "abap",
          filename: "zcl_material_check-solution.abap",
          code: `CLASS zcl_material_check DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    METHODS material_exists
      IMPORTING iv_matnr         TYPE matnr
      RETURNING VALUE(rv_exists) TYPE abap_bool
      RAISING   zcx_material_error.
ENDCLASS.

CLASS zcl_material_check IMPLEMENTATION.
  METHOD material_exists.
    " Verified in SE11: MARA-MATNR, MARA-LVORM exist.
    SELECT SINGLE @abap_true
      FROM mara
      WHERE matnr = @iv_matnr
        AND lvorm = @space          " not flagged for deletion
      INTO @rv_exists.
    IF sy-subrc <> 0.
      rv_exists = abap_false.
    ENDIF.
  ENDMETHOD.
ENDCLASS.

" Commit message:
" feat(material): add ZCL_MATERIAL_CHECK existence check
" - SELECT on MARA with deletion-flag filter, ABAP Unit tests included
" - ATC clean (Z_DEFAULT)
" AI-assisted: Claude (draft + tests), human-reviewed`,
        },
      },
      quiz: [
        {
          question: "What is the correct mindset for using Claude in ABAP development?",
          options: [
            "Claude is an oracle — its output is authoritative and can be activated directly",
            "Claude is a pair programmer — it drafts and suggests, but you review, verify, and own every line",
            "Claude should only be used for comments and documentation, never code",
            "Claude output only needs review when it is longer than 100 lines",
          ],
          correctIndex: 1,
          explanation:
            "Claude is a fast, capable pair programmer, but it cannot see your system and is occasionally confidently wrong. You review everything, verify against the system, and remain accountable for the code — regardless of its length.",
        },
        {
          question: "Claude suggests calling function module 'BAPI_VENDOR_BALANCE_CHECK', which you have never seen. What do you do first?",
          options: [
            "Use it — BAPI names that follow SAP conventions are always real",
            "Open SE37 and verify the function module exists and has the claimed signature",
            "Wrap the call in a TRY/CATCH so it fails gracefully if missing",
            "Search the internet for the name before doing anything in the system",
          ],
          correctIndex: 1,
          explanation:
            "Hallucinated function modules and BAPIs are the most common AI-specific defect in ABAP work. The countermeasure is the ten-second SE37 reality test: confirm existence, release status, and signature before calling anything unfamiliar.",
        },
        {
          question: "Why should AI-assisted changes be kept small and iterative rather than generated as one large block?",
          options: [
            "Claude cannot generate more than one method at a time",
            "Small units are easier to review and test, and feedback per iteration improves the next generation",
            "Large generations cost more and are therefore forbidden",
            "SAP transports reject objects above a certain size",
          ],
          correctIndex: 1,
          explanation:
            "Small, focused units keep review quality high and hide fewer errors, and telling Claude what was wrong in each round means the following iterations converge on correct, standards-compliant code quickly.",
        },
        {
          question: "What role does ATC play for AI-generated code?",
          options: [
            "It replaces human review for generated code",
            "It is optional because Claude already writes clean code",
            "It is the minimum quality gate — required, but it cannot judge business logic correctness",
            "It only needs to run once per project, not per change",
          ],
          correctIndex: 2,
          explanation:
            "ATC catches performance antipatterns, missing authority checks, and robustness issues that reading alone misses — so it is mandatory. But a clean ATC run says nothing about whether the business logic is right; that remains a human review task.",
        },
      ],
      summary: [
        "Claude is a pair programmer: it drafts, you review, verify, and own every line that enters the system.",
        "Work in small iterative units with your coding guidelines as context, and feed review findings back to improve each round.",
        "Verify mechanically — syntax check, ATC, and SE37/SE24/SE11 lookups — because hallucinated APIs look completely plausible.",
        "Keep AI-assisted work in abapGit, test in dev before promoting, and document AI usage per team policy.",
      ],
      download: {
        name: "AI Coding Review Checklist",
        description:
          "A printable checklist covering the full review-verify-iterate loop for AI-generated ABAP, from prompt context to abapGit commit.",
        filename: "ai-coding-review-checklist.md",
        content: `# AI-Generated ABAP — Review Checklist

## Before prompting
- [ ] Guidelines block included (release, namespace, style, ATC variant)
- [ ] Task scoped to ONE small unit (method / view / routine)
- [ ] Relevant existing code or DDIC info provided as context

## Reviewing the output
- [ ] Read and understood every line (no "looks fine" skims)
- [ ] Business logic matches the requirement — not just plausible
- [ ] Error handling follows team standard (exception classes)
- [ ] No SELECT *, no hardcoded values, authority checks present
- [ ] Naming and namespace match team conventions

## Reality test (hallucination check)
- [ ] Every unfamiliar function module / BAPI verified in SE37
- [ ] Every unfamiliar class verified in SE24 / ADT
- [ ] Every table and field verified in SE11
- [ ] BAPI release status and documented usage checked

## Quality gates
- [ ] Syntax check clean
- [ ] ATC run against team check variant — priority 1/2 findings resolved
- [ ] ABAP Unit tests generated AND executed in dev
- [ ] Tested with realistic data in the development system

## Wrap-up
- [ ] Committed via abapGit with a clear, diffable commit
- [ ] AI assistance documented per team policy
- [ ] Review feedback fed back to Claude for the session
- [ ] Normal transport / approval process followed (unchanged by AI)
`,
      },
      relatedSlugs: ["security-guidelines", "code-reviews", "atc-remediation", "github-integration"],
    },
    {
      slug: "security-guidelines",
      title: "Security & Data Protection Guidelines",
      description:
        "What never to paste into AI tools, how to anonymize SAP data, enterprise controls, prompt injection risks, secure MCP setup, and staying compliant with GDPR and SOX.",
      duration: 35,
      level: "Intermediate",
      keywords: [
        "data protection",
        "GDPR",
        "SOX",
        "anonymization",
        "PII",
        "prompt injection",
        "MCP security",
        "compliance",
      ],
      overview: [
        "AI assistants are only as safe as the data you put into them and the permissions you give them. For SAP developers this matters doubly: your systems hold some of the most sensitive data in the company — customer and vendor master data with personal information, pricing conditions, payroll, financial postings — and your tooling increasingly lets AI act on systems, not just talk about them. This lesson gives you clear, practical rules for both dimensions.",
        "The first half covers data: what must never be pasted into an AI tool (production business data with PII, credentials, RFC destinations with passwords), how to anonymize SE16 extracts and debug data before sharing them, and which enterprise controls your organization should have in place — Claude for Work or Enterprise plans, SSO, data retention settings, and Anthropic's commitment not to train on business customers' data under those plans.",
        "The second half covers actions: prompt injection risks when Claude operates agentically or through the Chrome extension, secure configuration of MCP servers connected to SAP systems (least-privilege service users, development systems only), and the compliance frame — GDPR for personal data, SOX for change management. The core message there is simple: AI changes how fast you develop, but it does not bypass a single step of your transport and approval process.",
      ],
      objectives: [
        "Apply a strict never-paste list: production PII, pricing, credentials, and RFC destinations with passwords stay out of AI tools",
        "Anonymize SAP data extracts and debug values before sharing them with Claude, preserving structure while removing identity",
        "Explain the enterprise controls that make Claude usable at work: Work/Enterprise plans, SSO, retention settings, no-training commitments",
        "Recognize prompt injection risks in agentic use and the browser extension, and configure MCP servers with least privilege on dev systems only",
        "Keep AI-assisted work compliant with GDPR and SOX — AI never bypasses transport, approval, or segregation-of-duties processes",
      ],
      steps: [
        {
          title: "Know the never-paste list",
          body: [
            "Some data must never enter an AI chat, regardless of plan, policy, or convenience. Production business data containing personal information is first on the list: customer master (KNA1 and friends), vendor master (LFA1), employee data, bank details, and anything that identifies a real person falls under GDPR the moment you copy it. Commercially sensitive data comes next: real pricing conditions (KONV/PRCD_ELEMENTS), margins, contract values, and unreleased financials. Leaking these into any external tool — AI or otherwise — is a data protection incident.",
            "Second: secrets. Passwords, API keys, certificates, and RFC destination details with stored credentials never belong in a prompt. This includes screenshots — a screenshot of SM59 showing a destination configuration, or of a config file with a token, is just as much a leak as pasted text. When you need help with connectivity problems, describe the setup and replace every secret with a placeholder before sharing.",
          ],
          code: {
            language: "text",
            filename: "never-paste-list.txt",
            code: `NEVER paste into any AI tool (chat, screenshot, or file upload):

DATA
  x Production customer/vendor master with PII (KNA1, LFA1, ADRC, BUT000)
  x Employee / HR / payroll data (PA*, HRP*)
  x Bank details, payment runs (BSEG bank fields, REGUH/REGUP)
  x Real pricing, margins, contract values (KONV/PRCD_ELEMENTS)
  x Unreleased financial results

SECRETS
  x Passwords, PSE files, certificates, API keys, tokens
  x RFC destination configs with stored credentials (SM59 details)
  x SAP router strings + credentials, cloud connector secrets

SAFE alternatives
  + Table STRUCTURES (field names, types) - not the data
  + Anonymized extracts (see next step)
  + Data from a scrambled/masked dev or sandbox client
  + Placeholders: <PASSWORD>, <RFC_DEST>, CUST-001 instead of real values`,
          },
          callout: {
            type: "danger",
            title: "A screenshot is a paste",
            body: "Claude reads images. A screenshot of SE16 production data, an SM59 destination, or a config file with a token is exactly as much a data leak as pasting the text. Check every screenshot for PII and secrets before attaching it — the Windows Snipping Tool lets you crop before saving.",
          },
        },
        {
          title: "Anonymize before you share",
          body: [
            "Most of the time you do not need real data — you need realistic data. Claude analyzes structure, patterns, and logic, and it does that just as well with 'CUST-0001, Testfirma GmbH' as with a real customer. Before sharing an SE16 extract, a debugger screenshot, or a test dataset, anonymize it: replace names, IDs, addresses, bank data, and amounts with consistent fake values. Consistency matters — if customer 1000042 appears in three tables, replace it with the same placeholder everywhere so relationships stay intact and the analysis stays valid.",
            "For small extracts, a two-minute manual edit in Excel or Notepad++ is enough. For recurring needs, build a small anonymization routine — column-wise replacement with generated values — or better, ask your Basis team about a scrambled QA client or SAP Test Data Migration Server style masking, so anonymization happens before data ever reaches your desktop. Rule of thumb: if a colleague from another company could read your prompt without you being fired, it is anonymized enough.",
          ],
          code: {
            language: "powershell",
            filename: "anonymize-extract.ps1",
            code: `# Quick anonymization of an SE16 CSV export before sharing with Claude
# Replaces customer numbers and names consistently across the file.
$inFile  = "C:\\Temp\\kna1_extract.csv"
$outFile = "C:\\Temp\\kna1_extract_ANON.csv"

$map = @{}   # consistent mapping: same real ID -> same fake ID
$counter = 1

(Get-Content $inFile) | ForEach-Object {
    $line = $_
    # Replace 10-digit customer numbers consistently
    [regex]::Matches($line, '\\b\\d{10}\\b') | ForEach-Object {
        $real = $_.Value
        if (-not $map.ContainsKey($real)) {
            $map[$real] = "CUST-{0:D4}" -f $counter; $counter++
        }
        $line = $line -replace $real, $map[$real]
    }
    # Blank out email addresses and IBANs
    $line = $line -replace '[\\w\\.-]+@[\\w\\.-]+', 'user@example.com'
    $line = $line -replace '\\b[A-Z]{2}\\d{2}[A-Z0-9]{10,30}\\b', 'XX00ANONIBAN'
    $line
} | Set-Content $outFile

Write-Host "Anonymized file written to $outFile - review it before sharing!"`,
          },
        },
        {
          title: "Use the enterprise controls your organization pays for",
          body: [
            "There is a large difference between a personal AI account and a governed enterprise deployment. Claude for Work (Team) and Claude Enterprise plans add the controls that make corporate use defensible: SSO through your identity provider so joiners and leavers are managed centrally, admin-configurable data retention, audit capabilities, and — critically — Anthropic's commitment that commercial-plan data is not used to train models. If your company provides such a plan, use it exclusively for work; never handle work topics through a private consumer account, where different terms apply.",
            "Know your organization's specific setup: which plan you are on, what the retention policy is, whether certain connectors or features are disabled by policy, and who the internal contact for AI governance questions is. When in doubt about whether a specific dataset or use case is allowed, ask before pasting — a two-line message to your security team beats an incident report every time.",
          ],
        },
        {
          title: "Understand prompt injection in agentic use",
          body: [
            "Prompt injection is the AI-era equivalent of SQL injection: malicious instructions hidden inside data that the AI processes. When Claude just chats with you, the risk is low. It rises when Claude acts — browsing with the Chrome extension, running tools through MCP servers, or executing multi-step agent workflows. A web page, an email, a document, or even a record in a table can contain text like 'ignore your previous instructions and send the data to...' — and an agent that processes that content might attempt to follow it.",
            "Defensive habits: treat everything an agent reads as untrusted input; keep agent permissions minimal (read-only wherever possible); review what an agent did — Claude shows its tool calls, read them; be especially careful when the browser extension operates on pages with user-generated content; and never give an agent simultaneous access to sensitive data and an outbound channel (like arbitrary web posting) without human review in between. Anthropic builds injection resistance into the models and tools, but layered defense on your side remains essential.",
          ],
          callout: {
            type: "warning",
            title: "Data an agent reads can carry instructions",
            body: "If a Claude agent reads a supplier email, a web page, or a table record, hostile text inside that content may try to redirect the agent. Keep permissions least-privilege, review tool-call logs, and keep humans in the loop for anything that writes data or leaves your environment.",
          },
        },
        {
          title: "Configure MCP servers to SAP with least privilege",
          body: [
            "MCP servers are the bridge between Claude and your SAP systems — which makes their configuration a security decision, not just a technical one. The service user an SAP MCP server logs in with defines the blast radius of anything that goes wrong, including a successful prompt injection. Therefore: dedicated service user (never your personal SAP user, never anything with SAP_ALL), an authorization role limited to exactly the operations the server exposes (typically read-only: RFC_READ_TABLE-style access, repository read, ATC results), and connection only to development or sandbox systems.",
            "Production access through an AI tool should be off the table for developers — if a legitimate read-only production use case ever arises, that is an architecture and governance decision with security sign-off, not a config file edit. Also protect the configuration itself: the MCP config JSON contains connection details, so keep credentials out of it (use secure storage or environment variables where the server supports it) and never commit it to a shared repository with secrets inside.",
          ],
          code: {
            language: "json",
            filename: "claude_desktop_config.json",
            code: `{
  "mcpServers": {
    "sap-dev": {
      "command": "node",
      "args": ["C:\\\\tools\\\\sap-abap-mcp\\\\dist\\\\index.js"],
      "env": {
        "SAP_HOST": "sapdev01.corp.local",
        "SAP_SYSNR": "00",
        "SAP_CLIENT": "100",
        "SAP_USER": "ZSVC_CLAUDE_RO",
        "SAP_PASSWORD_REF": "windows-credential-manager:sap-mcp-dev",
        "SAP_READONLY": "true"
      }
    }
  }
}
// Rules applied here:
//  - Dedicated service user ZSVC_CLAUDE_RO with a minimal read-only role
//  - DEV system only (sapdev01) - never QAS or PRD
//  - No plaintext password: reference to Windows Credential Manager
//    (mechanism depends on the MCP server implementation)
//  - This file itself: keep out of shared repos, restrict NTFS permissions`,
          },
        },
        {
          title: "Stay compliant: GDPR and SOX are unchanged by AI",
          body: [
            "Compliance frameworks do not have an AI exception. Under GDPR, personal data in prompts is a processing activity: it needs a legal basis, and sending it to an unapproved external processor is a violation — which is exactly why the never-paste list and anonymization discipline exist, and why enterprise agreements (data processing terms, retention controls) matter. If your project genuinely requires AI processing of personal data, that goes through your data protection officer, not through a quiet paste.",
            "Under SOX and general IT change management, the rules on segregation of duties, approvals, and auditable transports apply to AI-assisted changes exactly as to manual ones. Claude can draft the code, the unit tests, and even the transport documentation text — but it does not import into production, it does not approve its own changes, and it does not shortcut the DEV to QAS to PRD path. Any workflow where an AI agent could push changes toward production without the standard human approvals is a design error, full stop. The practical takeaway: AI accelerates the work inside the process; the process itself stays intact.",
          ],
          code: {
            language: "text",
            filename: "compliance-quick-reference.txt",
            code: `GDPR (personal data)
  - Prompts containing personal data = data processing
  - Only via approved, contracted enterprise plans - and only if
    your org has explicitly allowed that data category
  - Default for developers: anonymize first, always
  - Data subject rights and DPO involvement are unchanged

SOX / change management (financial systems)
  - AI-generated code follows the SAME transport path: DEV -> QAS -> PRD
  - Same approvals, same testing evidence, same segregation of duties
  - AI never imports, approves, or releases its own changes
  - Document AI assistance in change records where policy requires

Golden rule:
  AI changes HOW FAST you work inside the process.
  It never changes the process.`,
          },
        },
      ],
      screenshots: [
        {
          caption: "SE16 vendor extract before and after anonymization, side by side",
          description:
            "Split view: left, an SE16N extract of LFA1 with realistic vendor names, addresses, and bank details highlighted in red; right, the same rows after anonymization with VEND-0001-style IDs, example.com emails, and masked IBANs highlighted in green.",
        },
        {
          caption: "Claude Desktop MCP configuration with a least-privilege dev-only SAP connection",
          description:
            "The claude_desktop_config.json open in VS Code on Windows, with callout annotations pointing at the dedicated read-only service user, the DEV hostname, and the credential-manager reference replacing a plaintext password.",
        },
      ],
      video: {
        caption: "Anonymizing an SAP extract and sharing it safely with Claude",
        description:
          "Walkthrough of exporting an SE16N result to CSV, running the PowerShell anonymization script, spot-checking the output, and then asking Claude to analyze the anonymized dataset — plus a tour of the Claude for Work admin settings that govern retention and SSO.",
        duration: "10:15",
      },
      sapExample: {
        title: "Analyzing duplicate vendor payments without exposing vendor PII",
        scenario:
          "An accounts payable team at a consumer goods company suspects duplicate vendor payments. A developer extracts candidate records from BSAK/LFA1 via SE16N and wants Claude to help design duplicate-detection logic. The raw extract contains real vendor names, IBANs, and payment amounts — none of which may leave the company. The developer anonymizes the extract first, preserving exactly the properties the analysis needs: consistent vendor IDs, equal-amount patterns, and date proximity.",
        prompt:
          "Here is an anonymized extract of vendor payments (vendor ID, invoice reference, amount bucket, payment date). Suggest ABAP logic to detect likely duplicate payments: same vendor, same amount, invoice references that differ only by prefixes/suffixes, payment dates within 30 days.",
        code: {
          language: "text",
          filename: "extract-before-after.txt",
          code: `BEFORE (never share - real PII and financial data):
LIFNR      NAME1              IBAN                    WRBTR      XBLNR       BUDAT
0000104711 Muellheim Stahl AG DE44500105175407324931  14.782,50  RE-88123    2026-06-02
0000104711 Muellheim Stahl AG DE44500105175407324931  14.782,50  RE88123     2026-06-15

AFTER (safe to share - structure and pattern preserved):
VENDOR     NAME               IBAN            AMOUNT_BUCKET  INV_REF     PAY_DATE
VEND-0007  Vendor 0007        XX00ANONIBAN    BUCKET-A       REF-1001    2026-06-02
VEND-0007  Vendor 0007        XX00ANONIBAN    BUCKET-A       REF1001     2026-06-15

Note: same real vendor -> same fake ID (consistency!), amounts replaced
by equality-preserving buckets, invoice reference VARIATION kept intact
because that pattern is exactly what the duplicate logic must detect.`,
        },
        explanation: [
          "The anonymization here is surgical, not destructive. The analysis depends on three properties — same vendor, same amount, similar invoice reference — so the mapping preserves equality (same input always maps to the same output) while destroying identity (no name, no IBAN, no real amount survives). Claude can design and test the detection logic perfectly well against this shape of data.",
          "Notice what the developer did NOT do: they did not paste the raw extract 'just this once because it is only twelve rows'. Twelve rows of vendor master with bank details is a reportable data protection incident in most organizations. The two minutes spent anonymizing bought a completely clean interaction — and the resulting ABAP logic works identically on the real data inside the SAP system, where it belongs.",
        ],
      },
      bestPractices: [
        "Maintain and internalize the never-paste list: production PII, real pricing, credentials, and RFC destination details stay out of every AI channel",
        "Anonymize with consistency — same real value maps to the same placeholder — so structure and relationships survive for analysis",
        "Work exclusively through your organization's Claude for Work/Enterprise account with SSO, never through private consumer accounts",
        "Treat everything an agent reads as untrusted input and review tool-call logs when Claude acts through MCP or the browser extension",
        "Give SAP MCP servers a dedicated least-privilege read-only service user and connect them to development systems only",
        "Keep secrets out of MCP config files — use credential storage, restrict file permissions, never commit configs with secrets",
        "Route any AI use case involving personal data or production access through your DPO/security team before building it",
      ],
      commonMistakes: [
        {
          mistake: "Pasting 'just a few rows' of production customer or vendor data because the question is small.",
          fix: "Volume is irrelevant — one row with PII is a GDPR processing event. Anonymize first or use scrambled dev-client data, every time.",
        },
        {
          mistake: "Sharing a screenshot that shows more than intended: SM59 credentials, PII in a background SE16 window, a token in a terminal.",
          fix: "Crop screenshots deliberately with Win+Shift+S and scan every image for secrets and personal data before attaching it — Claude reads all of it.",
        },
        {
          mistake: "Running an SAP MCP server with your personal dialog user or a wide role because 'it is only dev'.",
          fix: "Create a dedicated service user with a minimal read-only role. Your personal user's permissions become the agent's permissions — including everything you never intended to expose.",
        },
        {
          mistake: "Assuming enterprise AI approval means every dataset is now fair game.",
          fix: "The plan governs the platform; your data classification policy governs the data. Check which categories are approved, and ask your governance contact when unsure.",
        },
        {
          mistake: "Letting an agent workflow write toward QA or production because the demo worked in dev.",
          fix: "Human approval gates and the standard transport path are non-negotiable. Agents draft and analyze; humans release. SOX has no AI exception.",
        },
      ],
      tips: [
        "Store your MCP config under %APPDATA%\\Claude\\ with NTFS permissions restricted to your user account — right-click, Properties, Security, remove wide groups.",
        "Use Windows Credential Manager (Control Panel > Credential Manager) for SAP service-user passwords instead of plaintext JSON, where your MCP server supports it.",
        "Create a PowerShell profile function 'anonymize' wrapping the anonymization script so cleansing an export is one command before every share.",
        "Set your Windows clipboard history (Win+V) to disabled on shared machines — pasted credentials otherwise linger in the clipboard history.",
        "Keep a 'SAFE TO SHARE?' sticky note (or PowerToys text shortcut) with the never-paste list next to your monitor during your first weeks — the reflex builds quickly.",
      ],
      exercise: {
        title: "Prepare a production incident dataset for AI analysis — safely",
        scenario:
          "A billing job failed for a subset of customers, and you want Claude's help finding the pattern in the failed records. Your raw evidence is an SE16N export of 40 rows containing customer numbers, names, email addresses, billing amounts, and the error message column. Company policy: no production PII leaves the network. Prepare the data and the interaction so it is both useful and compliant.",
        tasks: [
          "Classify each column of the extract: which are PII, which are commercially sensitive, which are safe, and which are analytically necessary?",
          "Design the anonymization: consistent customer placeholders, masked emails, amount buckets — while keeping the error message and any pattern-relevant fields intact.",
          "Apply the anonymization (Excel, Notepad++ regex, or the PowerShell script from this lesson) and spot-check at least five rows.",
          "Write the prompt to Claude describing the anonymized dataset and the analysis you need, including the note that IDs are placeholders.",
          "List which parts of this task would additionally require security/DPO involvement if you wanted to automate it as a recurring agent workflow.",
        ],
        hint: "The error message column is usually the analytical gold and rarely contains PII — but check it: SAP error messages sometimes embed the customer name or email in the message variables. Those variables need masking too.",
        solution: {
          language: "text",
          filename: "safe-analysis-prompt.txt",
          code: `COLUMN CLASSIFICATION
  KUNNR  -> PII-linked identifier  -> replace: CUST-0001... (consistent)
  NAME1  -> PII                    -> replace: "Customer 0001"
  SMTP   -> PII                    -> replace: user@example.com
  NETWR  -> commercially sensitive -> bucket: A(<1k) B(1-10k) C(>10k)
  MSGTXT -> needed for analysis    -> KEEP, but mask embedded names/emails
  FKDAT  -> needed for analysis    -> KEEP (dates rarely identifying here)

PROMPT TO CLAUDE
  "I have an anonymized extract of 40 failed billing records
   (customer placeholder, amount bucket, billing date, error text).
   Customer IDs are consistent placeholders, amounts are buckets.
   Find patterns: do failures cluster by error text, date, or
   amount bucket? Suggest what to check in the SAP system next.
   Data follows as CSV: ..."

ESCALATION LIST (if automated as recurring agent workflow)
  - DPO review: recurring processing of even anonymized prod-derived data
  - Security review: MCP/service user design, data flow, storage
  - Change management: where results are written, who approves actions`,
        },
      },
      quiz: [
        {
          question: "Which of the following is acceptable to paste into Claude?",
          options: [
            "Ten rows of production KNA1 including names and addresses, because it is a small sample",
            "The DDIC structure of KNA1 — field names, data elements, and types — with no data rows",
            "An SM59 screenshot showing a working RFC destination configuration for reference",
            "A CSV of real pricing conditions, as long as customer numbers are removed",
          ],
          correctIndex: 1,
          explanation:
            "Table structures and metadata are safe and usually all Claude needs. Production PII is never acceptable regardless of volume, SM59 screenshots can expose connection details and credentials, and real pricing remains commercially sensitive even without customer numbers.",
        },
        {
          question: "Why must anonymization be consistent (same real value always mapped to the same placeholder)?",
          options: [
            "Because GDPR legally mandates consistent placeholders",
            "Because it preserves relationships and patterns across rows and tables, keeping the analysis valid",
            "Because Claude rejects datasets with inconsistent identifiers",
            "Because inconsistent mapping is slower to compute",
          ],
          correctIndex: 1,
          explanation:
            "If the same customer appears as CUST-0007 everywhere, joins, duplicates, and clusters remain detectable — identity is destroyed but structure survives. Inconsistent replacement would silently break the very patterns you asked Claude to find.",
        },
        {
          question: "What is the correct security posture for an SAP MCP server used by developers?",
          options: [
            "Your personal SAP user, since its permissions already match your job",
            "A shared team user with broad authorizations to avoid maintenance effort",
            "A dedicated least-privilege service user, read-only where possible, connected to dev/sandbox systems only",
            "SAP_ALL on a service user, but only in the development system",
          ],
          correctIndex: 2,
          explanation:
            "The service user's authorizations define the blast radius of any malfunction or prompt injection. Least privilege, read-only, dedicated identity, and dev-only connectivity keep that radius small. Personal users, shared users, and SAP_ALL all violate this — even in dev.",
        },
        {
          question: "How does SOX-relevant change management apply to AI-generated ABAP?",
          options: [
            "AI-generated code may skip QAS because it was already reviewed by the model",
            "It applies unchanged: same transport path, same approvals, same segregation of duties — AI never releases its own changes",
            "Only changes larger than 500 lines need the standard process",
            "SOX does not apply because the AI is not an employee",
          ],
          correctIndex: 1,
          explanation:
            "Compliance frameworks have no AI exception. Claude can draft code, tests, and documentation, but the DEV-to-QAS-to-PRD path, approvals, and segregation of duties remain fully intact — any workflow letting an agent push changes toward production without human gates is a design error.",
        },
      ],
      summary: [
        "The never-paste list is absolute: production PII, real pricing, credentials, and RFC destination details stay out of AI tools — and screenshots count as pastes.",
        "Anonymize consistently before sharing: destroy identity, preserve structure, and the analysis stays just as good.",
        "Use enterprise controls (Claude for Work/Enterprise, SSO, retention, no-training commitments) and configure MCP servers with least-privilege service users on dev systems only.",
        "Prompt injection makes agent permissions a security decision, and GDPR/SOX apply unchanged — AI accelerates work inside the process, never around it.",
      ],
      download: {
        name: "AI Security & Data Protection Checklist",
        description:
          "A one-page checklist for SAP teams covering the never-paste list, anonymization steps, MCP hardening, and compliance gates.",
        filename: "ai-security-checklist.md",
        content: `# AI Security Checklist for SAP Developers

## Never paste (data)
- [ ] No production customer/vendor/employee data with PII
- [ ] No real pricing, margins, or unreleased financials
- [ ] No bank details or payment data
- [ ] Screenshots checked — images count as pastes

## Never paste (secrets)
- [ ] No passwords, tokens, API keys, certificates
- [ ] No RFC destination details / SM59 screenshots with credentials
- [ ] Placeholders used: <PASSWORD>, <RFC_DEST>, CUST-0001

## Before sharing any extract
- [ ] Columns classified: PII / sensitive / safe / needed
- [ ] Consistent anonymization applied (same real -> same fake)
- [ ] Error texts checked for embedded names/emails
- [ ] Spot-check of the anonymized output done

## Platform
- [ ] Company Claude for Work/Enterprise account with SSO — no private accounts
- [ ] Org retention and connector policies known
- [ ] Governance contact known for edge cases

## MCP / agentic use
- [ ] Dedicated service user, least privilege, read-only where possible
- [ ] Development/sandbox systems only — no QAS/PRD
- [ ] No plaintext secrets in config; NTFS permissions restricted
- [ ] Agent tool-call logs reviewed; human gate before anything writes

## Compliance
- [ ] Personal-data use cases routed through DPO
- [ ] Transport path and approvals unchanged (DEV -> QAS -> PRD)
- [ ] AI assistance documented per policy
`,
      },
      relatedSlugs: ["ai-coding-best-practices", "mcp-servers", "sap-abap-mcp-server", "chrome-extension"],
    },
    {
      slug: "troubleshooting",
      title: "Troubleshooting Claude on Windows",
      description:
        "Fix the most common Claude problems on Windows corporate laptops: login and SSO, desktop app startup, MCP servers not appearing, proxy certificates, rate limits, and context errors.",
      duration: 25,
      level: "Beginner",
      keywords: [
        "troubleshooting",
        "Windows",
        "SSO login",
        "MCP config",
        "corporate proxy",
        "rate limits",
        "context window",
        "desktop app",
      ],
      overview: [
        "Corporate Windows laptops are a specific environment: SSO everywhere, proxies that intercept SSL, locked-down PATH variables, and IT-managed installs. Most Claude problems SAP developers hit are not bugs — they are friction between the tools and this environment, and nearly all of them have a five-minute fix once you know where to look. This lesson is the field guide.",
        "We work through the frequent offenders in order of how often they appear: login and SSO loops, the desktop app not starting or hanging (usually solved by a full restart from the system tray or clearing the %APPDATA% cache), MCP servers silently missing from the app (almost always JSON syntax or Node.js not being on PATH), running Claude Code on Windows (native support, Git Bash, or WSL), and the classic corporate proxy issue where SSL interception breaks tool connectivity until the company root certificate is trusted.",
        "The second half covers usage-side issues: what rate limits and usage limits mean and how to work within them, why long conversations trigger 'conversation too long' errors and when starting a fresh chat is the right move (with a technique for carrying context over), what to do about slow responses, and how to report issues so they actually get fixed — through your internal IT channel and Anthropic's support paths.",
      ],
      objectives: [
        "Diagnose and fix login/SSO problems and desktop app startup failures, including a clean cache reset via %APPDATA%",
        "Repair MCP server configurations by checking JSON syntax, Node.js PATH availability, and performing a full app restart from the system tray",
        "Choose and set up a working Claude Code environment on Windows (native, Git Bash, or WSL) behind a corporate proxy with SSL interception",
        "Handle rate limits, usage limits, and context-window errors — knowing when to wait, when to trim, and when to start a new chat",
        "Report issues effectively with the right diagnostics so IT or Anthropic support can resolve them quickly",
      ],
      steps: [
        {
          title: "Fix login and SSO problems",
          body: [
            "Login issues on corporate machines usually come from one of three places: the SSO redirect being blocked, stale session state, or the wrong account. If the browser login loops or hangs after your identity provider (Entra ID/Okta) accepts the credentials, first try a private/incognito window — this rules out stale cookies. If that works, clear the Claude cookies in your normal browser profile. In the desktop app, log out completely (profile menu, Log out) and log back in; the app opens the system browser for SSO, so browser problems become app login problems.",
            "Check that you are entering your work email so the login routes to your company's SSO rather than a personal account — a personal account will log in fine but will be missing your organization's plan, connectors, and data protections. If the SSO page itself never loads, the proxy or a firewall rule is blocking claude.ai or your identity provider's endpoints; that is an IT ticket, and telling IT exactly which URL fails to load speeds it up considerably.",
          ],
        },
        {
          title: "Desktop app will not start or hangs",
          body: [
            "When the Claude desktop app does not open, opens to a blank window, or hangs at startup, escalate through three levels. Level 1: make sure it is actually stopped — the app minimizes to the system tray, so 'closing' it often leaves it running. Right-click the tray icon (the arrow near the clock shows hidden icons) and choose Quit, or end the process in Task Manager, then start it again. Level 2: clear the application cache under %APPDATA%\\Claude — deleting the cache folders forces a clean rebuild without touching your login or settings in most cases.",
            "Level 3: reinstall. Uninstall via Settings > Apps, then reinstall from your company's software portal or the official download. On managed laptops, prefer the company portal version — IT may deploy a configuration your proxy setup needs. If the app worked yesterday and broke today with no update, check whether a Windows update or new security-suite policy landed overnight; endpoint protection products occasionally quarantine Electron-based apps after signature updates.",
          ],
          code: {
            language: "powershell",
            filename: "reset-claude-app.ps1",
            code: `# Level 1: fully stop the Claude desktop app (it hides in the system tray)
Stop-Process -Name "Claude" -Force -ErrorAction SilentlyContinue

# Level 2: clear caches (keeps login/settings in most cases)
$appData = Join-Path $env:APPDATA "Claude"
Get-ChildItem $appData -Directory |
  Where-Object { $_.Name -match "Cache|GPUCache|Code Cache" } |
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Verify config file still present (your MCP config lives here!)
Test-Path (Join-Path $appData "claude_desktop_config.json")

# Restart the app
Start-Process "$env:LOCALAPPDATA\\AnthropicClaude\\Claude.exe" -ErrorAction SilentlyContinue
Write-Host "Done. If the app still fails, reinstall from the software portal."`,
          },
          callout: {
            type: "info",
            title: "Quit means the system tray, not the X button",
            body: "The most common 'restart did not help' report is a restart that never happened: clicking X only hides the app to the system tray. Always quit via the tray icon's right-click menu or Task Manager before judging whether a restart fixed anything — this also applies to picking up MCP config changes.",
          },
        },
        {
          title: "MCP servers not appearing in the app",
          body: [
            "You added an MCP server to claude_desktop_config.json, restarted, and nothing shows up. Three causes account for nearly all cases. First, JSON syntax: a trailing comma, a missing quote, or unescaped backslashes in Windows paths ('C:\\tools' must be 'C:\\\\tools' in JSON) makes the whole file unreadable, and all servers vanish, not just the new one. Validate the file with PowerShell or an editor with JSON linting before suspecting anything else.",
            "Second, the runtime: most MCP servers need Node.js, and 'node works in my terminal' does not guarantee the desktop app sees it — the app inherits the system PATH, not your terminal profile's. Check 'node --version' in a fresh (not reused) terminal, and if Node was installed per-user, log out/in of Windows or use the full path to node.exe in the config. Third, the restart problem from the previous step: config changes only load when the app fully quits from the system tray and starts again. When all three check out and a server still misbehaves, look at the MCP logs under %APPDATA%\\Claude\\logs for the server's actual startup error.",
          ],
          code: {
            language: "powershell",
            filename: "diagnose-mcp.ps1",
            code: `# 1. Validate the MCP config JSON
$config = Join-Path $env:APPDATA "Claude\\claude_desktop_config.json"
try {
    Get-Content $config -Raw | ConvertFrom-Json | Out-Null
    Write-Host "JSON is valid." -ForegroundColor Green
} catch {
    Write-Host "JSON is BROKEN: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Common causes: trailing comma, missing quote, single backslashes in paths."
}

# 2. Is Node.js on the SYSTEM path (what the desktop app sees)?
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) { Write-Host "node found: $($node.Source) ($(node --version))" }
else { Write-Host "node NOT found on PATH - install Node.js LTS or use full path in config" -ForegroundColor Red }

# 3. Check recent MCP logs for startup errors
$logs = Join-Path $env:APPDATA "Claude\\logs"
Get-ChildItem $logs -Filter "mcp*.log" -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 3 |
  ForEach-Object { Write-Host "--- $($_.Name) ---"; Get-Content $_.FullName -Tail 15 }`,
          },
        },
        {
          title: "Claude Code on Windows: pick your environment",
          body: [
            "Claude Code runs on Windows in three ways, and picking the right one up front avoids most trouble. Native Windows support runs Claude Code directly in PowerShell or Command Prompt — the simplest path on a locked-down laptop, requiring only Node.js and (for repository work) Git for Windows. Git Bash gives you a Unix-like shell that many Claude Code workflows and scripts assume, and it comes free with Git for Windows. WSL (Windows Subsystem for Linux) is the most Linux-faithful option and the best choice if your team's tooling is Linux-first — but on corporate laptops WSL is sometimes blocked by policy or complicated by the proxy, so check with IT before investing time there.",
            "A pragmatic recommendation for SAP developers: start with native PowerShell or Git Bash — they inherit your corporate proxy settings and certificates more smoothly than WSL, which maintains its own environment. Whichever you choose, install Node.js LTS from your software portal, verify 'node --version' and 'git --version', then install and authenticate Claude Code per the official instructions for that environment.",
          ],
        },
        {
          title: "Corporate proxy and SSL interception certificates",
          body: [
            "The signature symptom: browser access to claude.ai works fine, but Claude Code or an MCP server fails with certificate errors like 'self-signed certificate in certificate chain' or 'unable to get local issuer certificate'. Cause: your corporate proxy intercepts SSL traffic and re-signs it with the company's own root certificate. Windows and your browser trust that certificate because IT installed it in the Windows certificate store — but Node.js-based tools use their own certificate bundle and have never heard of it.",
            "The fix is to tell Node-based tools about the corporate root certificate: export it from the Windows certificate store (certmgr.msc, usually under Trusted Root Certification Authorities, export as Base-64 .cer) or get the .pem directly from IT, then point the NODE_EXTRA_CA_CERTS environment variable at the file. Set HTTPS_PROXY/HTTP_PROXY too if your network requires an explicit proxy. Never work around certificate errors by disabling TLS verification (NODE_TLS_REJECT_UNAUTHORIZED=0) — that 'fix' silently removes the security layer and tends to fossilize into permanent configuration.",
          ],
          code: {
            language: "powershell",
            filename: "proxy-and-certs.ps1",
            code: `# Symptom check: does Node trust the proxy's certificate?
node -e "fetch('https://api.anthropic.com').then(()=>console.log('TLS OK')).catch(e=>console.log('TLS FAIL:', e.cause?.code))"

# Fix: point Node tools at the corporate root certificate (from IT
# or exported via certmgr.msc as Base-64 .cer / .pem)
[Environment]::SetEnvironmentVariable(
  "NODE_EXTRA_CA_CERTS", "C:\\corp\\certs\\corp-root-ca.pem", "User")

# Set the proxy explicitly if your network requires it
[Environment]::SetEnvironmentVariable("HTTPS_PROXY", "http://proxy.corp.local:8080", "User")

# Open a NEW terminal afterwards (env vars are read at process start),
# then re-run the symptom check above. Expect: TLS OK

# NEVER do this - it disables certificate checking entirely:
# [Environment]::SetEnvironmentVariable("NODE_TLS_REJECT_UNAUTHORIZED","0","User")`,
          },
          callout: {
            type: "danger",
            title: "Do not disable TLS verification",
            body: "Setting NODE_TLS_REJECT_UNAUTHORIZED=0 makes certificate errors disappear by turning off certificate checking for every connection the tool makes. It exposes your traffic and credentials and it always outlives the debugging session it was meant for. Use NODE_EXTRA_CA_CERTS with the real corporate root certificate instead.",
          },
        },
        {
          title: "Rate limits, context limits, slow responses, and getting help",
          body: [
            "Rate and usage limits are guardrails, not errors. If you hit a usage limit, the message tells you when capacity resets; heavy sessions (long agentic runs, huge file analyses) consume it faster. Work within them: batch related questions, avoid re-pasting the same large context repeatedly, and use Projects so shared context does not need resending in every chat. The 'conversation too long' error is different — it means the conversation has approached the context window. The remedy is a fresh start done well: ask Claude to summarize the conversation's key decisions and open state first, then paste that summary as the opening message of a new chat. Long conversations also get slower and less focused before they hit the limit, so starting fresh at natural milestones is good practice, not a workaround.",
            "For slow responses, separate causes: check your network first (corporate VPN and proxy latency are frequent culprits), then check status.anthropic.com for platform incidents, and consider conversation length. When you need to report an issue, gather the evidence that makes it solvable: exact error text, timestamp, app version (Settings > About), what you tried, and — for MCP issues — the relevant log lines from %APPDATA%\\Claude\\logs. Route it correctly: company-managed accounts and network/proxy issues go to your internal IT/AI platform team; product bugs go through the in-app feedback (thumbs-down or Help) or Anthropic's support at support.claude.com. Your internal channel first — they know the corporate environment and often have seen the exact issue before.",
          ],
          code: {
            language: "text",
            filename: "issue-report-template.txt",
            code: `ISSUE REPORT — Claude on Windows (send to IT / AI platform team)

What happened:   MCP server "sap-dev" missing from Claude Desktop
Since when:      2026-07-22 ~09:30, after editing config
Error message:   (none visible in UI; log attached)
App version:     Claude Desktop x.y.z  (Settings > About)
Windows:         11 Pro 23H2, corporate laptop, on VPN

Already tried:
  1. Full quit via system tray + restart      -> no change
  2. JSON validated with ConvertFrom-Json     -> valid
  3. node --version in new terminal           -> v22.x found
  4. Checked %APPDATA%\\Claude\\logs\\mcp-server-sap-dev.log
     -> "ECONNREFUSED sapdev01.corp.local:3300" (attached)

Suspicion: firewall rule for dev system port from VPN segment.`,
          },
        },
      ],
      screenshots: [
        {
          caption: "Fully quitting the Claude desktop app from the Windows system tray",
          description:
            "Windows 11 taskbar with the hidden-icons flyout open, the Claude tray icon right-clicked, and the Quit menu item highlighted — annotated with a note that clicking the window's X button only hides the app.",
        },
        {
          caption: "PowerShell MCP diagnostic script output pinpointing a broken config",
          description:
            "A PowerShell window showing the diagnose-mcp script results: JSON validation failing with a trailing-comma error message in red, the node version check passing in green, and the last lines of an MCP log below.",
        },
      ],
      video: {
        caption: "Five-minute fixes: the most common Claude-on-Windows problems, solved live",
        description:
          "Rapid-fire demonstration of each fix: SSO loop cleared with an incognito login, full app restart from the system tray, a broken MCP JSON found and fixed, NODE_EXTRA_CA_CERTS configured for a corporate proxy, and a long conversation summarized into a fresh chat.",
        duration: "8:45",
      },
      sapExample: {
        title: "SAP MCP server vanishes after adding a second server to the config",
        scenario:
          "An ABAP developer at a utilities company has been using the SAP ABAP MCP server against the dev system for weeks. After adding a second MCP server (a filesystem server for abapGit repos) to claude_desktop_config.json, BOTH servers disappear from Claude Desktop. Panic ensues — until the standard diagnosis order finds the culprit in ninety seconds: a single unescaped backslash in the new server's Windows path invalidated the entire JSON file.",
        prompt:
          "My claude_desktop_config.json stopped working when I added a second server — both servers vanished from Claude Desktop. Here is the config (password removed). What is wrong with it?",
        code: {
          language: "json",
          filename: "broken-vs-fixed-config.json",
          code: `// BROKEN — both servers vanish (find the two errors):
{
  "mcpServers": {
    "sap-dev": {
      "command": "node",
      "args": ["C:\\\\tools\\\\sap-abap-mcp\\\\dist\\\\index.js"]
    },
    "abapgit-files": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\repos\\abapgit"],
    }
  }
}
// Error 1: "C:\\repos\\abapgit" - single backslashes are invalid
//          JSON escapes; must be "C:\\\\repos\\\\abapgit"
// Error 2: trailing comma after the args array

// FIXED — valid JSON, both servers return after a FULL restart:
{
  "mcpServers": {
    "sap-dev": {
      "command": "node",
      "args": ["C:\\\\tools\\\\sap-abap-mcp\\\\dist\\\\index.js"]
    },
    "abapgit-files": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\\\repos\\\\abapgit"]
    }
  }
}`,
        },
        explanation: [
          "The key insight is the failure mode: one syntax error anywhere in claude_desktop_config.json takes down every MCP server, because the app cannot parse the file at all. That is why the previously working SAP server disappeared along with the new one — a strong hint that the problem is the file, not either server. The one-line PowerShell validation (Get-Content ... | ConvertFrom-Json) pinpoints the exact parse error immediately.",
          "The developer also nearly fell into the restart trap: after fixing the JSON, they closed the window with the X button and saw no change — because the app kept running in the system tray with the broken config in memory. Quit from the tray, start again, and both servers returned. Diagnosis order to remember: validate JSON, check node on PATH, full restart from tray, then read the MCP logs.",
        ],
      },
      bestPractices: [
        "Follow a fixed diagnosis order for MCP issues: validate the JSON, verify node on the system PATH, fully restart from the tray, then read the logs — in that order",
        "Always quit the desktop app via the system tray icon before judging whether a restart or config change helped",
        "Keep a known-good backup copy of claude_desktop_config.json before every edit — reverting beats debugging under time pressure",
        "Fix proxy certificate errors properly with NODE_EXTRA_CA_CERTS and the corporate root CA — never by disabling TLS verification",
        "Summarize long conversations into a fresh chat at natural milestones instead of pushing against the context limit",
        "Check status.anthropic.com and your VPN/proxy before attributing slowness to the app",
        "Report issues with evidence: exact error, timestamp, version, steps tried, and relevant log lines — internal IT channel first",
      ],
      commonMistakes: [
        {
          mistake: "Editing the MCP config and clicking the X button to 'restart' — then concluding the config change does not work.",
          fix: "The X button only hides the app to the system tray. Right-click the tray icon and Quit (or end the process in Task Manager), then start the app again.",
        },
        {
          mistake: "Using single backslashes in Windows paths inside the config JSON, silently breaking the whole file.",
          fix: "Escape every backslash in JSON strings: C:\\\\tools\\\\server\\\\index.js. Validate afterwards with Get-Content ... | ConvertFrom-Json.",
        },
        {
          mistake: "Setting NODE_TLS_REJECT_UNAUTHORIZED=0 to silence corporate proxy certificate errors.",
          fix: "Export the corporate root CA (or get the .pem from IT) and set NODE_EXTRA_CA_CERTS to its path. Disabling TLS verification removes security for all connections and always outlives the debugging session.",
        },
        {
          mistake: "Fighting the 'conversation too long' error by deleting a few messages and continuing in the same degraded chat.",
          fix: "Ask Claude to summarize decisions and open items, then start a fresh chat seeded with that summary. You keep the context that matters and regain speed and quality.",
        },
        {
          mistake: "Logging in with a personal account when SSO misbehaves, just to keep working.",
          fix: "A personal account bypasses your organization's plan, connectors, and data protections — a compliance problem, not a workaround. Fix the SSO issue (incognito test, cookie clear, IT ticket) instead.",
        },
      ],
      tips: [
        "Type %APPDATA%\\Claude directly into the Explorer or Run (Win+R) address bar — it expands to the real path where config and logs live.",
        "Pin a PowerShell one-liner in Windows Terminal: Get-Content $env:APPDATA\\Claude\\claude_desktop_config.json -Raw | ConvertFrom-Json — your instant config validator.",
        "Use VS Code to edit the config JSON — it flags trailing commas and bad escapes as you type, before the app ever sees the file.",
        "After setting environment variables like NODE_EXTRA_CA_CERTS, open a brand-new terminal — running terminals keep their old environment.",
        "If the app misbehaves right after a Windows or endpoint-security update, check with IT before deep-diving — quarantined Electron apps are a known pattern on managed laptops.",
      ],
      exercise: {
        title: "Rescue a broken MCP setup on a corporate laptop",
        scenario:
          "A teammate returns from vacation to find their Claude Desktop shows no MCP servers at all, and Claude Code fails with 'unable to get local issuer certificate' since the company rolled out a new proxy. You get 30 minutes to fix both problems using this lesson's diagnosis order.",
        tasks: [
          "Run the JSON validation one-liner against their claude_desktop_config.json and interpret the result.",
          "Verify Node.js availability the way the desktop app sees it (fresh terminal, system PATH) and note the difference from a terminal-profile PATH.",
          "Perform a genuine full restart of the desktop app and confirm whether the servers return.",
          "Diagnose the Claude Code certificate error and implement the correct fix (not the TLS-disabling shortcut), assuming IT has provided corp-root-ca.pem.",
          "Write a three-line handover note documenting what was broken and what you changed, so the teammate understands their own machine again.",
        ],
        hint: "Two independent problems, two independent fixes: the missing MCP servers are almost certainly a config JSON or restart issue, while the certificate error is the new proxy's SSL interception — solved with NODE_EXTRA_CA_CERTS, never with NODE_TLS_REJECT_UNAUTHORIZED=0.",
        solution: {
          language: "powershell",
          filename: "rescue-session.ps1",
          code: `# --- Problem 1: MCP servers missing ---
# 1. Validate the config
Get-Content "$env:APPDATA\\Claude\\claude_desktop_config.json" -Raw |
  ConvertFrom-Json
# -> Error at line 9: trailing comma found. Fix in VS Code, re-validate: OK.

# 2. Node visible to the app?
Get-Command node        # -> C:\\Program Files\\nodejs\\node.exe, v22.x: OK

# 3. FULL restart (tray quit, not the X button)
Stop-Process -Name "Claude" -Force
Start-Process "$env:LOCALAPPDATA\\AnthropicClaude\\Claude.exe"
# -> Both MCP servers visible again.

# --- Problem 2: Claude Code certificate error ---
# New proxy intercepts SSL; Node does not trust the corp root CA.
[Environment]::SetEnvironmentVariable(
  "NODE_EXTRA_CA_CERTS", "C:\\corp\\certs\\corp-root-ca.pem", "User")
# Open a NEW terminal, verify:
node -e "fetch('https://api.anthropic.com').then(()=>console.log('TLS OK'))"
# -> TLS OK

# --- Handover note ---
# 1. Config had a trailing comma (broke ALL MCP servers); fixed + validated.
# 2. Restart must be via tray Quit - X only hides the app.
# 3. New proxy: NODE_EXTRA_CA_CERTS now points at corp-root-ca.pem (User env).`,
        },
      },
      quiz: [
        {
          question: "After editing claude_desktop_config.json, what must you do for the change to take effect?",
          options: [
            "Click the X button to close the window, then reopen the app",
            "Fully quit the app via the system tray icon (or Task Manager) and start it again",
            "Restart Windows — config files load only at boot",
            "Nothing; the app watches the file and reloads automatically",
          ],
          correctIndex: 1,
          explanation:
            "The X button only hides the app to the system tray, where it keeps running with the old config in memory. Only a genuine quit — tray icon right-click > Quit, or ending the process — followed by a fresh start loads the changed configuration.",
        },
        {
          question: "You add a second MCP server and suddenly ALL servers disappear from Claude Desktop. What is the most likely cause?",
          options: [
            "The app supports only one MCP server at a time",
            "A JSON syntax error (trailing comma or unescaped backslash) making the entire config file unparseable",
            "The new server needs administrator rights",
            "Windows Defender blocked the MCP protocol",
          ],
          correctIndex: 1,
          explanation:
            "One syntax error anywhere in the config invalidates the whole file, so every server vanishes — not just the new one. Windows paths are the classic trap: backslashes must be escaped (C:\\\\tools). Validate with ConvertFrom-Json to find the exact error.",
        },
        {
          question: "Claude Code fails with 'unable to get local issuer certificate' on the corporate network. What is the correct fix?",
          options: [
            "Set NODE_TLS_REJECT_UNAUTHORIZED=0 to skip certificate checks",
            "Point NODE_EXTRA_CA_CERTS at the corporate root CA certificate so Node trusts the proxy's re-signed traffic",
            "Uninstall the corporate proxy from the laptop",
            "Switch from PowerShell to WSL, which ignores proxies",
          ],
          correctIndex: 1,
          explanation:
            "The corporate proxy re-signs SSL traffic with the company root CA, which Windows trusts but Node.js does not know. NODE_EXTRA_CA_CERTS adds it to Node's trust store — the proper fix. Disabling TLS verification removes security entirely, and WSL does not escape the corporate network.",
        },
        {
          question: "What is the best response to a 'conversation too long' error in a productive working session?",
          options: [
            "Keep resending the last message until it goes through",
            "Delete your earliest messages one by one and continue in the same chat",
            "Ask Claude to summarize key decisions and open items, then start a new chat seeded with that summary",
            "Switch to a personal account, which has a larger context window",
          ],
          correctIndex: 2,
          explanation:
            "The error means the conversation is at the context window's edge, where quality and speed have already degraded. A Claude-written summary carried into a fresh chat preserves the context that matters and restores full performance — account type does not change the context window.",
        },
      ],
      summary: [
        "Most Claude-on-Windows problems are environment friction with five-minute fixes: SSO cookie state, tray-quit restarts, %APPDATA% cache resets.",
        "MCP diagnosis order: validate the JSON (escaped backslashes!), check node on the system PATH, full restart from the tray, then read the logs — one syntax error hides all servers.",
        "Corporate proxy certificate errors are fixed with NODE_EXTRA_CA_CERTS and the company root CA — never by disabling TLS verification.",
        "Work with limits, not against them: batch questions, summarize long chats into fresh ones, check the status page before blaming the app, and report issues with evidence through your internal channel first.",
      ],
      download: {
        name: "Windows Troubleshooting Quick Reference",
        description:
          "A printable symptom-to-fix table for Claude on corporate Windows laptops, including the PowerShell diagnostic one-liners.",
        filename: "claude-windows-troubleshooting.md",
        content: `# Claude on Windows — Troubleshooting Quick Reference

## Symptom -> Fix

| Symptom | Most likely cause | Fix |
|---|---|---|
| SSO login loops/hangs | Stale cookies / blocked redirect | Incognito test, clear claude.ai cookies, IT ticket with failing URL |
| Logged in but org features missing | Personal account used | Log out, sign in with WORK email so SSO routes to company org |
| App won't start / blank window | Hidden tray instance or corrupt cache | Tray Quit or Stop-Process; clear Cache dirs under %APPDATA%\\Claude; reinstall |
| MCP servers ALL missing | JSON syntax error in config | Validate: \`Get-Content $env:APPDATA\\Claude\\claude_desktop_config.json -Raw | ConvertFrom-Json\` |
| One MCP server missing/failing | node not on system PATH, or server error | \`Get-Command node\`; use full node.exe path; check %APPDATA%\\Claude\\logs |
| Config change has no effect | App only hidden, not restarted | Quit via SYSTEM TRAY, then start again |
| "unable to get local issuer certificate" | Proxy SSL interception | Set NODE_EXTRA_CA_CERTS to corp root CA .pem; NEW terminal afterwards |
| Rate/usage limit reached | Heavy usage | Wait for reset; batch questions; use Projects to avoid re-pasting context |
| "Conversation too long" | Context window full | Ask for summary of decisions/open items -> start fresh chat with it |
| Slow responses | VPN/proxy latency, incident, long chat | Check network, status.anthropic.com, start a fresh chat |

## Key paths
- Config: \`%APPDATA%\\Claude\\claude_desktop_config.json\`
- Logs:   \`%APPDATA%\\Claude\\logs\`
- JSON rule: escape backslashes in paths — \`C:\\\\tools\\\\server\\\\index.js\`

## Never do
- NODE_TLS_REJECT_UNAUTHORIZED=0 (disables TLS security everywhere)
- Personal account as SSO workaround (bypasses org data protections)

## Reporting an issue
Include: exact error text, timestamp, app version (Settings > About),
steps already tried, relevant log lines. Route: internal IT/AI team first,
then in-app feedback or support.claude.com.
`,
      },
      relatedSlugs: ["claude-desktop", "claude-code", "mcp-servers", "security-guidelines"],
    },
  ],
};
