import type { Module } from "../types";

export const module2: Module = {
  slug: "prompt-engineering",
  title: "Prompt Engineering for SAP",
  shortTitle: "Prompting",
  description:
    "Master the craft of writing precise, context-rich prompts so Claude delivers accurate, guideline-compliant ABAP and SAP artifacts on the first attempt.",
  icon: "message-square",
  lessons: [
    {
      slug: "prompt-engineering",
      title: "Prompt Engineering for ABAP Developers",
      description:
        "Learn the anatomy of an effective prompt — role, context, task, constraints, and output format — and apply it to real ABAP work with few-shot examples, chain-of-thought reasoning, and XML-tag structure.",
      duration: 30,
      level: "Beginner",
      keywords: [
        "prompt engineering",
        "ABAP prompts",
        "few-shot",
        "chain-of-thought",
        "XML tags",
        "prompt anatomy",
        "SAP context",
        "coding guidelines",
      ],
      overview: [
        "A prompt is the interface between your SAP expertise and Claude's capabilities. The difference between a vague one-liner and a well-structured prompt is often the difference between generic pseudo-code and production-ready ABAP that respects your system release, your Z-namespace, and your team's coding guidelines. In this lesson you will learn a repeatable prompt structure that works for everything from explaining a legacy include to designing a new class.",
        "We break every strong prompt into five parts: a role that tells Claude who to be, context that describes your SAP landscape, a clear task, explicit constraints, and a defined output format. You will also learn two power techniques — few-shot examples, where you show Claude one or two samples of the style you want, and chain-of-thought, where you ask Claude to reason step by step before answering, which dramatically improves results for complex pricing, authorization, or data-migration logic.",
        "Finally, you will learn to structure long prompts with XML tags such as <code>, <guidelines>, and <task>. Claude is specifically trained to respect XML-tag boundaries, which keeps a 300-line ABAP paste cleanly separated from your instructions. By the end of the lesson you will iterate on prompts deliberately instead of hoping the first attempt lands.",
      ],
      objectives: [
        "Structure any SAP prompt using the five-part anatomy: role, context, task, constraints, and output format.",
        "Provide Claude with the ABAP context it needs — system release, namespace conventions, and team coding guidelines — in under five lines.",
        "Apply few-shot prompting by supplying one or two worked examples to control style and output shape.",
        "Use chain-of-thought instructions to improve accuracy on complex logic such as pricing routines or authority checks.",
        "Separate instructions from pasted code using XML tags so long prompts stay unambiguous.",
      ],
      steps: [
        {
          title: "Start with the five-part anatomy",
          body: [
            "Every effective SAP prompt answers five questions: Who should Claude be? What is the environment? What exactly do you want? What rules must the answer obey? What should the output look like? Write these as short labelled sections rather than one long sentence. It takes thirty extra seconds and typically saves two or three correction rounds.",
            "Compare a weak prompt like 'write abap to read materials' with the structured version below. The structured prompt names the release (which decides whether Claude may use inline declarations and constructor expressions), the namespace, the task, the constraints, and the output format.",
          ],
          code: {
            language: "text",
            filename: "structured-prompt.txt",
            code: `You are a senior ABAP developer at a beverage company running SAP S/4HANA 2023 (ABAP 7.58).

Context:
- Custom code lives in the Z namespace; classes are named ZCL_*, interfaces ZIF_*.
- We follow clean ABAP: no obsolete statements, inline declarations preferred.

Task:
Write a method GET_MATERIALS_BY_PLANT for class ZCL_MM_MATERIAL_READER that returns
all materials of a given plant with description and base unit.

Constraints:
- Use a single SELECT with JOIN on MARA/MARC/MAKT, no SELECT inside LOOP.
- Handle the case where no materials exist by raising ZCX_MM_NOT_FOUND.
- Language key from SY-LANGU.

Output format:
Only the method definition and implementation, with a short comment header. No explanations.`,
          },
        },
        {
          title: "Give Claude your ABAP context block",
          body: [
            "Claude does not know your system release, your namespace, or your naming conventions unless you tell it. ABAP 7.40+ introduced inline declarations, constructor expressions like VALUE and CONV, and string templates — but if your target system is an older ECC 6.0 box on 7.31, code using those features will not even activate. Always state the release explicitly.",
            "Build a reusable three-to-five line context block and paste it at the top of every prompt (or store it once in a Claude Project's custom instructions so it applies automatically). Include: release and NetWeaver/ABAP version, namespace (ZCL_*/YCL_*), key guidelines (clean ABAP, no obsolete statements, exception classes vs. classic exceptions), and anything unusual such as an industry solution or heavy user-exit landscape.",
          ],
          code: {
            language: "text",
            filename: "context-block.txt",
            code: `## My SAP context (paste at the top of every prompt)
- System: SAP ECC 6.0 EHP8, ABAP 7.50 (target: S/4HANA 2023 next year)
- Namespace: Z for development, Y for sandbox prototypes (ZCL_*, ZIF_*, ZCX_*)
- Guidelines: clean ABAP, class-based exceptions only, no SELECT *, ATC check variant Z_DEFAULT
- Do NOT use statements flagged obsolete in 7.50 (e.g. MOVE, COMPUTE, header lines)`,
          },
          callout: {
            type: "tip",
            title: "Store the context block in a Claude Project",
            body: "In Claude Web or Claude Desktop, create a Project called 'ABAP Development' and paste your context block into the Project's custom instructions. Every chat inside that Project inherits it automatically — no more copy-pasting the same four lines all day.",
          },
        },
        {
          title: "Show, don't tell: few-shot examples",
          body: [
            "When you need Claude to match a specific style — your team's method-comment header, a particular ALV column layout, a documentation template — the fastest way is to show one or two examples of correct output inside the prompt. This is called few-shot prompting. Claude infers the pattern from the examples far more reliably than from a prose description of the pattern.",
            "Few-shot works especially well for repetitive transformation work: converting classic BAPI calls to released APIs, mapping SAPscript text elements to Adobe Forms fields, or rewriting SELECT statements to CDS view access. Give one 'before -> after' pair, then paste the next 'before' and ask Claude to continue the pattern.",
          ],
          code: {
            language: "text",
            filename: "few-shot-prompt.txt",
            code: `Convert classic ABAP SELECTs to modern 7.58 syntax following the example.

Example input:
  DATA lt_vbak TYPE TABLE OF vbak.
  SELECT * FROM vbak INTO TABLE lt_vbak WHERE erdat = sy-datum.

Example output:
  SELECT vbeln, erdat, auart, kunnr
    FROM vbak
    WHERE erdat = @sy-datum
    INTO TABLE @DATA(lt_vbak).

Now convert this one in exactly the same style:
  DATA lt_lips TYPE TABLE OF lips.
  SELECT * FROM lips INTO TABLE lt_lips WHERE vbeln = p_vbeln.`,
          },
        },
        {
          title: "Use chain-of-thought for complex logic",
          body: [
            "For anything with multi-step business logic — pricing condition analysis, authorization concept design, debugging a wrong-value chain through user exits — instruct Claude to reason step by step before giving its final answer. Phrases like 'Think through this step by step before answering' or 'First list your assumptions, then analyze, then conclude' measurably improve accuracy on hard problems.",
            "A practical pattern for debugging: ask Claude to (1) restate what the code does, (2) list candidate root causes ranked by likelihood, (3) explain how to verify each in the debugger or with a quick SE16 check, and only then (4) propose a fix. This mirrors how a senior developer works and prevents Claude from jumping to a plausible-but-wrong fix.",
          ],
          code: {
            language: "text",
            filename: "chain-of-thought-prompt.txt",
            code: `A billing document shows condition ZPR0 doubled for one customer only.

Think through this step by step before proposing any fix:
1. Restate how ZPR0 would normally be determined in pricing procedure ZVAA01.
2. List the possible root causes (condition records, requirement routine,
   user exit USEREXIT_PRICING_PREPARE_TKOMP, copy control), ranked by likelihood.
3. For each cause, tell me exactly what to check (transaction, table, breakpoint).
4. Only then recommend the most likely fix.

<code>
* relevant part of routine 901 in RV64A901
IF komp-kposn IS NOT INITIAL.
  ...
ENDIF.
</code>`,
          },
        },
        {
          title: "Structure long prompts with XML tags",
          body: [
            "Once a prompt contains pasted code, guidelines, and a task, plain text gets ambiguous — Claude may treat a comment inside your code as an instruction. XML tags fix this. Wrap each part in a named tag: <code> for ABAP, <guidelines> for rules, <task> for the request, <example> for few-shot samples. Claude is trained to treat tags as hard boundaries.",
            "Tag names are yours to choose; consistency matters more than the exact name. A useful team convention: <code> for the main object, <related_code> for dependencies, <ddic> for table/structure definitions, <task> and <output_format> for the request. This scales cleanly when you later paste three or four objects into one prompt.",
          ],
          code: {
            language: "text",
            filename: "xml-tag-prompt.txt",
            code: `<guidelines>
S/4HANA 2023, ABAP 7.58, clean ABAP, class-based exceptions, namespace ZCL_*.
</guidelines>

<ddic>
ZTB_ORDER_LOG: MANDT, GUID (RAW16), VBELN, STATUS (CHAR1), CREATED_AT (TIMESTAMPL)
</ddic>

<code>
CLASS zcl_sd_order_logger DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    METHODS log_status IMPORTING iv_vbeln TYPE vbeln_va iv_status TYPE char1.
ENDCLASS.
</code>

<task>
Implement LOG_STATUS: insert a row into ZTB_ORDER_LOG with a new GUID and the
current UTC timestamp. Raise ZCX_SD_LOG_ERROR if the insert fails.
</task>

<output_format>
Full class implementation only, no prose.
</output_format>`,
          },
          callout: {
            type: "info",
            title: "Why XML and not Markdown fences?",
            body: "Markdown code fences work too, but XML tags let you name each block (<code> vs. <related_code> vs. <ddic>) and refer to them by name in your task ('refactor the class in <code> using the types in <ddic>'). Anthropic's own documentation recommends XML tags for structuring Claude prompts.",
          },
        },
        {
          title: "Iterate deliberately instead of restarting",
          body: [
            "First outputs are drafts. When Claude's answer is 80% right, do not open a new chat and rewrite the whole prompt — reply in the same conversation with a targeted correction: 'Good, but replace the classic exception with ZCX_MM_NOT_FOUND and remove the TRY block around the SELECT.' Claude keeps the full context and applies surgical changes.",
            "Develop a habit of grading each response against your constraints before accepting it: Does it activate on my release? Does it follow the namespace? Would it pass ATC? If you find yourself making the same correction across many chats, that correction belongs permanently in your context block or Project instructions.",
          ],
        },
      ],
      screenshots: [
        {
          caption: "A five-part structured prompt in Claude Desktop with the response showing guideline-compliant ABAP",
          description: "Claude Desktop window on Windows 11 showing a prompt divided into Role, Context, Task, Constraints, and Output format sections in the message box, and Claude's response containing a syntax-highlighted ABAP method that uses inline declarations.",
        },
        {
          caption: "Claude Project custom instructions holding the reusable ABAP context block",
          description: "The Project settings panel in Claude Web with the custom instructions field filled with a four-line ABAP context block naming the system release, namespace, and coding guidelines, and a list of project chats on the left.",
        },
      ],
      video: {
        caption: "Building a production-quality ABAP prompt from scratch",
        description: "Screen recording that starts with a vague one-line prompt, shows the mediocre result, then rebuilds the prompt with the five-part anatomy, XML tags, and a few-shot example — comparing the outputs side by side at each stage.",
        duration: "9:15",
      },
      sapExample: {
        title: "Refactoring a pricing user exit at a beverage company",
        scenario: "A CPG beverage company is preparing its ECC 6.0 system for an S/4HANA conversion. A developer must document and modernize the logic in USEREXIT_PRICING_PREPARE_TKOMP, which contains 15-year-old code with header lines and hard-coded plant checks. Before touching it, the developer wants Claude to explain the logic and propose a clean-ABAP rewrite that will survive the migration.",
        prompt: `You are a senior SAP SD pricing consultant and ABAP architect.

Context: ECC 6.0 EHP8 on ABAP 7.50, converting to S/4HANA 2023 next year.
Namespace ZCL_*, clean ABAP guidelines, ATC variant Z_DEFAULT.

<code>
FORM userexit_pricing_prepare_tkomp.
  DATA: wa_zztab TYPE zpricing_plants.
  IF komp-werks = '1000' OR komp-werks = '1200'.
    SELECT SINGLE * FROM zpricing_plants INTO wa_zztab
      WHERE werks = komp-werks.
    IF sy-subrc = 0.
      tkomp-zzregio = wa_zztab-regio.
    ENDIF.
  ENDIF.
ENDFORM.
</code>

Task:
1. Explain step by step what this exit does and why hard-coded plants are a risk.
2. Propose a 7.50-compatible rewrite that reads eligible plants from ZPRICING_PLANTS
   instead of hard-coding them, keeps the KOMP->TKOMP mapping, and buffers the
   lookup so it is not executed per item unnecessarily.

Output: explanation first, then only the rewritten FORM.`,
        code: {
          language: "abap",
          filename: "userexit_pricing_prepare_tkomp.abap",
          code: `FORM userexit_pricing_prepare_tkomp.
  " Region determination for custom pricing field ZZREGIO.
  " Eligible plants are maintained in ZPRICING_PLANTS (no hard-coding).
  STATICS st_plants TYPE HASHED TABLE OF zpricing_plants
                    WITH UNIQUE KEY werks.

  IF st_plants IS INITIAL.
    SELECT werks, regio
      FROM zpricing_plants
      INTO CORRESPONDING FIELDS OF TABLE @st_plants.
  ENDIF.

  READ TABLE st_plants ASSIGNING FIELD-SYMBOL(<ls_plant>)
       WITH TABLE KEY werks = komp-werks.
  IF sy-subrc = 0.
    tkomp-zzregio = <ls_plant>-regio.
  ENDIF.
ENDFORM.`,
        },
        explanation: [
          "The prompt names a role (SD pricing consultant), states the release so Claude knows 7.50 syntax is allowed but RAP-era features are not, and wraps the legacy code in a <code> tag so instructions and code cannot be confused. The two-part task forces an explanation before the rewrite — a chain-of-thought pattern that catches misunderstandings before they turn into wrong code.",
          "Claude's rewrite removes the hard-coded plant list by reading ZPRICING_PLANTS directly, and the STATICS hashed table buffers the lookup across pricing items — a genuine performance win because user exits in pricing run once per item. The developer verified the result activated cleanly and passed the Z_DEFAULT ATC variant before transporting.",
        ],
      },
      bestPractices: [
        "Always state your ABAP release in the prompt — it determines which syntax Claude may use (7.40 inline declarations, 7.50 host expressions, 7.58 features).",
        "Keep a reusable context block and store it in a Claude Project's custom instructions rather than retyping it.",
        "Define the output format explicitly ('only the method implementation, no prose') to get paste-ready code.",
        "Use XML tags to separate code, DDIC definitions, guidelines, and the task in any prompt longer than a screen.",
        "Prefer one or two few-shot examples over long prose style descriptions when output shape matters.",
        "Ask for step-by-step reasoning on debugging and design questions; ask for code-only output on routine generation.",
        "Iterate in the same conversation with targeted corrections instead of restarting from scratch.",
      ],
      commonMistakes: [
        {
          mistake: "Omitting the system release, so Claude generates 7.58 syntax that will not activate on your 7.31 ECC box.",
          fix: "State release and ABAP version in every prompt, or bake it into Project custom instructions.",
        },
        {
          mistake: "Writing one giant paragraph mixing code, requirements, and questions.",
          fix: "Split the prompt into labelled sections or XML tags: <code>, <guidelines>, <task>, <output_format>.",
        },
        {
          mistake: "Describing a desired code style in prose instead of showing it.",
          fix: "Paste one small before/after example (few-shot) and ask Claude to continue the pattern.",
        },
        {
          mistake: "Accepting the first answer without checking it against your constraints.",
          fix: "Grade every response: does it activate, follow the namespace, and pass ATC? Reply with targeted corrections.",
        },
        {
          mistake: "Restarting a new chat for every correction and losing all context.",
          fix: "Stay in the conversation; Claude retains the code and constraints and applies incremental fixes.",
        },
      ],
      tips: [
        "Windows: press Win+V to open clipboard history — keep your context block, guidelines, and the current code snippet all on the clipboard at once.",
        "Save your five-part prompt skeleton as a text file on your desktop or in a OneNote page so you can fill in the blanks in seconds.",
        "Use Shift+Enter in Claude to add line breaks inside a prompt without sending it, so you can format sections cleanly.",
        "When pasting from SAP GUI's ABAP editor, use SE38/SE80's 'Download' or Ctrl+A/Ctrl+C in the new editor to preserve formatting.",
        "If a response drifts from your guidelines mid-conversation, re-paste the <guidelines> block — long chats benefit from a reminder.",
      ],
      exercise: {
        title: "Rebuild a weak prompt into a five-part prompt",
        scenario: "A colleague sends you the prompt: 'claude please make me abap code that checks if customer is blocked'. The target system is S/4HANA 2022 (ABAP 7.57), your namespace is ZCL_*, and your team requires class-based exceptions and clean ABAP.",
        tasks: [
          "Identify what is missing from the colleague's prompt using the five-part anatomy checklist.",
          "Rewrite the prompt with role, context, task, constraints, and output format sections.",
          "Wrap the technical context in XML tags and specify that only code should be returned.",
          "Add one constraint about which tables/fields define 'blocked' (e.g. KNA1-SPERR, KNB1-SPERR at company-code level).",
          "Run your prompt in Claude and grade the response: correct release syntax, correct namespace, exception class present?",
        ],
        hint: "Decide first what 'blocked' means functionally — central block (KNA1-SPERR), company-code block (KNB1-SPERR), or sales-area block (KNVV-AUFSD). A precise prompt resolves this ambiguity for Claude instead of leaving it to guess.",
        solution: {
          language: "text",
          filename: "solution-prompt.txt",
          code: `You are a senior ABAP developer on SAP S/4HANA 2022 (ABAP 7.57).

<context>
Namespace ZCL_*/ZCX_*. Clean ABAP. Class-based exceptions only. No SELECT *.
</context>

<task>
Create method IS_CUSTOMER_BLOCKED for class ZCL_SD_CUSTOMER_CHECK.
Importing: iv_kunnr TYPE kunnr, iv_bukrs TYPE bukrs OPTIONAL.
Returning: rv_blocked TYPE abap_bool.
A customer counts as blocked if KNA1-SPERR is set, or - when iv_bukrs is
supplied - if KNB1-SPERR is set for that company code.
Raise ZCX_SD_CUSTOMER_NOT_FOUND if the customer does not exist in KNA1.
</task>

<output_format>
Only the method implementation in modern 7.5x syntax. No explanations.
</output_format>`,
        },
      },
      quiz: [
        {
          question: "Which five elements make up the recommended prompt anatomy for SAP work?",
          options: [
            "Greeting, question, code, thanks, signature",
            "Role, context, task, constraints, output format",
            "Title, abstract, body, conclusion, references",
            "System, user, assistant, function, tool",
          ],
          correctIndex: 1,
          explanation: "The five-part anatomy — role, context, task, constraints, and output format — gives Claude everything it needs to produce release-correct, guideline-compliant ABAP in one pass.",
        },
        {
          question: "Why must you always state your ABAP release in a prompt?",
          options: [
            "Claude refuses to answer without a version number",
            "It determines licensing costs of the generated code",
            "It decides which syntax features (inline declarations, host expressions) the generated code may use",
            "SAP requires it for audit compliance",
          ],
          correctIndex: 2,
          explanation: "ABAP syntax evolved sharply from 7.31 to 7.40+ (inline declarations, VALUE, string templates). Code written for the wrong release simply will not activate on your system.",
        },
        {
          question: "What is few-shot prompting?",
          options: [
            "Sending several short prompts in rapid succession",
            "Including one or more worked examples in the prompt so Claude infers the desired pattern",
            "Limiting Claude to short answers",
            "Asking the same question in multiple chats and comparing answers",
          ],
          correctIndex: 1,
          explanation: "Few-shot prompting supplies example input/output pairs inside the prompt. Claude generalizes the pattern, which controls style and structure far better than prose descriptions.",
        },
        {
          question: "What is the main benefit of wrapping pasted ABAP in XML tags like <code>?",
          options: [
            "It makes the code execute faster in SAP",
            "It reduces token usage",
            "Claude treats the tags as hard boundaries, so code content is never confused with instructions",
            "It automatically formats the code with Pretty Printer",
          ],
          correctIndex: 2,
          explanation: "Claude is trained to respect XML-tag boundaries. Tags keep long code pastes, guidelines, and the task cleanly separated, and let you reference blocks by name.",
        },
      ],
      summary: [
        "Structure every SAP prompt with role, context, task, constraints, and output format — vague prompts produce vague ABAP.",
        "Always tell Claude your ABAP release, namespace, and guidelines; store this context block in a Claude Project so it applies automatically.",
        "Few-shot examples control output style; chain-of-thought instructions improve accuracy on complex pricing, debugging, and design questions.",
        "XML tags such as <code> and <task> keep long prompts unambiguous, and deliberate in-conversation iteration beats restarting from scratch.",
      ],
      download: {
        name: "SAP Prompt Anatomy Pack",
        description: "Eight ready-to-use prompt templates built on the five-part anatomy, covering explanation, generation, debugging, and review tasks.",
        filename: "sap-prompt-pack-prompting.md",
        content: `# SAP Prompt Anatomy Pack

Reusable prompts built on the five-part anatomy (role, context, task, constraints, output format).
Replace the placeholders in {CURLY_BRACES} before use. Keep your personal context block handy:

\`\`\`
System: {SYSTEM_RELEASE} (ABAP {ABAP_VERSION})
Namespace: {NAMESPACE} (e.g. ZCL_*/ZIF_*/ZCX_*)
Guidelines: clean ABAP, class-based exceptions, no SELECT *, ATC variant {ATC_VARIANT}
\`\`\`

---

## 1. Explain legacy code
\`\`\`
You are a senior ABAP developer. Explain the code in <code> step by step:
what it does functionally, which tables it touches, and any risks
(performance, obsolete statements, hard-coded values).
<code>
{PASTE_CODE}
</code>
\`\`\`

## 2. Generate a method
\`\`\`
You are a senior ABAP developer on {SYSTEM_RELEASE} (ABAP {ABAP_VERSION}).
Context: namespace {NAMESPACE}, clean ABAP, class-based exceptions.
Task: write method {METHOD_NAME} for class {CLASS_NAME}.
Signature: {SIGNATURE}. Behavior: {BEHAVIOR}.
Constraints: single SELECT where possible, raise {EXCEPTION_CLASS} on {ERROR_CASE}.
Output: method implementation only, no prose.
\`\`\`

## 3. Modernize a SELECT
\`\`\`
Convert the SELECT statements in <code> to modern ABAP {ABAP_VERSION} syntax
(comma-separated field lists, host variables with @, inline declarations).
Keep behavior identical. Output only the converted code.
<code>
{PASTE_CODE}
</code>
\`\`\`

## 4. Debug with chain-of-thought
\`\`\`
Symptom: {SYMPTOM}.
Think step by step: 1) restate what the code in <code> does,
2) list candidate root causes ranked by likelihood,
3) for each, name the exact check (transaction, table, breakpoint),
4) only then recommend a fix.
<code>
{PASTE_CODE}
</code>
\`\`\`

## 5. Design review before coding
\`\`\`
You are an SAP solution architect. I need to build: {REQUIREMENT}.
System: {SYSTEM_RELEASE}. Before any code, propose 2-3 design options
(e.g. BAdI vs. custom class vs. enhancement point), with pros/cons and
your recommendation for a system that will convert to S/4HANA.
\`\`\`

## 6. Few-shot style transfer
\`\`\`
Rewrite code following the example pair exactly.
Example input: {OLD_STYLE_SAMPLE}
Example output: {NEW_STYLE_SAMPLE}
Now rewrite this in the same style: {PASTE_CODE}
\`\`\`

## 7. Constraint-checked code generation
\`\`\`
Generate {ARTIFACT} for {PURPOSE} on {SYSTEM_RELEASE}.
Hard constraints (violating any = wrong answer):
- Namespace {NAMESPACE}
- No obsolete statements for ABAP {ABAP_VERSION}
- Must pass ATC variant {ATC_VARIANT}
After the code, list each constraint and confirm compliance in one line.
\`\`\`

## 8. Prompt self-critique
\`\`\`
Here is a prompt I plan to send you: <prompt>{DRAFT_PROMPT}</prompt>
Before answering it, critique it: what context is missing, what is ambiguous,
what constraints should I add for ABAP work? Then answer the improved version.
\`\`\`
`,
      },
      relatedSlugs: ["prompt-library", "code", "chat", "ai-coding-best-practices"],
    },
    {
      slug: "prompt-library",
      title: "SAP Prompt Library",
      description:
        "Build and maintain a curated, parameterized library of proven SAP prompts — from legacy-code explanation to CDS generation and ATC fixes — that your whole team can reuse.",
      duration: 25,
      level: "Beginner",
      keywords: [
        "prompt library",
        "prompt templates",
        "reusable prompts",
        "ATC fixes",
        "CDS view prompt",
        "ABAP Unit prompt",
        "team knowledge",
        "placeholders",
      ],
      overview: [
        "Once you have written a prompt that reliably produces a good test class or a clean CDS view, that prompt is an asset. Retyping it from memory wastes time and loses the refinements you made. A prompt library — a shared, versioned collection of proven prompts with placeholders — turns individual discoveries into team productivity. This lesson gives you ten battle-tested SAP prompt categories and a system for organizing them.",
        "The core categories every ABAP team needs: explaining legacy code, refactoring procedural code to OO, generating ABAP Unit test classes, writing CDS views, fixing ATC findings, code review, documentation generation, debugging help, performance analysis, and translating SAPscript/Smart Forms logic for form migrations. For each, you will see a template with placeholders like {TABLE_NAME} and {PASTE_CODE} that any teammate can fill in.",
        "You will also decide where the library lives. Options range from a shared OneNote notebook (zero setup, great for Windows-centric SAP teams) to a Markdown repository in Git (versioned, reviewable) to Claude Projects (prompts plus knowledge files live where you use them). Most teams combine two: a Git or OneNote master library, plus Claude Projects per topic with the relevant prompts and guidelines preloaded.",
      ],
      objectives: [
        "Name the ten core prompt categories an SAP ABAP team should maintain and when to use each.",
        "Parameterize a prompt with placeholders such as {TABLE_NAME} and {SYSTEM_RELEASE} so anyone can reuse it safely.",
        "Choose and set up a storage location for the team library: OneNote, a Markdown Git repository, or Claude Projects.",
        "Adapt a library prompt to a concrete task in under a minute using clipboard tooling on Windows.",
        "Establish a lightweight contribution process so improved prompts flow back into the library.",
      ],
      steps: [
        {
          title: "Define your ten core categories",
          body: [
            "Resist the urge to collect hundreds of prompts. A useful library is small and trustworthy: roughly ten categories, each with one polished template. The proven set for ABAP teams: (1) explain legacy code, (2) refactor to OO, (3) generate ABAP Unit tests, (4) write CDS views, (5) fix ATC findings, (6) code review, (7) generate documentation, (8) debugging help, (9) performance analysis, (10) SAPscript/Smart Forms translation.",
            "For each category, capture three things: the template itself, a one-line 'when to use', and a filled-in example of a good result. The example matters — it shows new teammates what quality looks like and doubles as a few-shot sample they can include in the prompt.",
          ],
        },
        {
          title: "Parameterize with placeholders",
          body: [
            "A template is only reusable if the variable parts are obvious. Use UPPER_SNAKE_CASE placeholders in curly braces: {TABLE_NAME}, {CLASS_NAME}, {SYSTEM_RELEASE}, {PASTE_CODE}, {ATC_FINDING}. Put a legend at the top of each template listing every placeholder and an example value, so nobody has to guess whether {TABLE_NAME} means the transparent table or the CDS entity.",
            "Keep placeholders coarse. {PASTE_CODE} beats separate placeholders for every method, and {GUIDELINES} referencing your standard context block beats restating rules per template. The test: a developer who joined last week should fill any template correctly on the first try.",
          ],
          code: {
            language: "text",
            filename: "template-test-class.txt",
            code: `## Generate ABAP Unit test class
## Placeholders: {SYSTEM_RELEASE}=S/4HANA 2023 | {CLASS_NAME}=ZCL_MM_MATERIAL_READER
##               {PASTE_CODE}=full class source | {FOCUS}=method(s) to prioritize

You are an ABAP test engineer on {SYSTEM_RELEASE}.
Write a local ABAP Unit test class for the class in <code>.

Requirements:
- Test class: LTC_{CLASS_NAME} with FOR TESTING RISK LEVEL HARMLESS DURATION SHORT.
- Use CL_ABAP_UNIT_ASSERT for all assertions.
- Isolate database access with a test double for the dependency interfaces.
- Cover: happy path, empty result, and the exception path for {FOCUS}.
- One test method per behavior, named after the behavior (e.g. raises_not_found_for_unknown_key).

<code>
{PASTE_CODE}
</code>

Output: only the test class code.`,
          },
          callout: {
            type: "tip",
            title: "One legend per template",
            body: "The two-line placeholder legend at the top costs nothing and eliminates the most common library failure: teammates filling placeholders with the wrong kind of value and blaming the template.",
          },
        },
        {
          title: "Pick a home: OneNote, Git Markdown, or Claude Projects",
          body: [
            "OneNote is the pragmatic choice for most Windows-based SAP teams: everyone already has it, prompts are one Ctrl+C away, and a notebook section per category maps naturally onto the ten categories. Its weakness is versioning — you cannot easily see who changed a template or why.",
            "A Markdown repository in Git (one .md file per category) gives you history, pull-request review of prompt changes, and easy diffing — ideal if your team already lives in Git for abapGit. Claude Projects complement either: create a Project per topic (e.g. 'ATC Remediation'), paste the relevant templates into its custom instructions or knowledge, and every chat in that Project starts pre-armed. Most teams run a Git or OneNote master plus a handful of Projects.",
          ],
          code: {
            language: "text",
            filename: "prompt-repo-structure.txt",
            code: `sap-prompt-library/
  README.md               <- how to use, contribution rules
  01-explain-legacy.md
  02-refactor-to-oo.md
  03-abap-unit-tests.md
  04-cds-views.md
  05-atc-fixes.md
  06-code-review.md
  07-documentation.md
  08-debugging.md
  09-performance.md
  10-forms-translation.md
  context-blocks/
    ecc6-ehp8.md
    s4hana-2023.md`,
          },
        },
        {
          title: "Build the high-value templates first",
          body: [
            "Start with the two templates your team will use daily: ATC fix suggestions and legacy-code explanation. The ATC template pastes the finding text plus the flagged code and asks for a corrected version with an explanation of why ATC complained — this alone can cut remediation time dramatically during an S/4HANA custom-code cleanup.",
            "The CDS view template deserves care because CDS syntax has annotations most developers do not memorize. Encode your annotation standards (authorization check, end-user texts, value helps) directly in the template so every generated view starts compliant.",
          ],
          code: {
            language: "text",
            filename: "template-atc-fix.txt",
            code: `## ATC fix suggestion
## Placeholders: {ATC_FINDING}=full ATC message text | {CHECK_ID}=e.g. CI_SELECT_STAR
##               {PASTE_CODE}=flagged code incl. 5 lines context | {SYSTEM_RELEASE}

You are an ABAP quality expert. ATC check {CHECK_ID} raised this finding
on {SYSTEM_RELEASE}:

<finding>
{ATC_FINDING}
</finding>

<code>
{PASTE_CODE}
</code>

Task:
1. Explain in 2-3 sentences why ATC flags this.
2. Provide the corrected code that resolves the finding without changing behavior.
3. If a pragma/pseudo-comment exemption would be more appropriate than a code
   change, say so and show the exact pragma - but only if genuinely justified.`,
          },
        },
        {
          title: "Make reuse frictionless on Windows",
          body: [
            "A library nobody opens is dead weight. Reduce reuse to seconds: pin the OneNote notebook or the repo's README to your taskbar, and lean on Win+V clipboard history so a template, your context block, and the pasted ABAP can all sit on the clipboard simultaneously. Some teams add AutoHotkey or PowerToys 'Text Extractor'/'Quick Accent' style snippets for the top three templates.",
            "For prompts you personally use many times per day, a Claude Project is the ultimate shortcut: the template lives in the Project instructions, so your 'prompt' shrinks to just the variable parts — paste the code, name the table, send.",
          ],
          callout: {
            type: "info",
            title: "Team hygiene: no secrets in the library",
            body: "Templates are shared artifacts. Never store real customer data, passwords, RFC destinations, or system host names in library examples — use neutral placeholders like {CUSTOMER_ID} and DEMO values. Align with your security guidelines lesson before publishing the library company-wide.",
          },
        },
        {
          title: "Establish a contribution loop",
          body: [
            "Prompts improve through use. Agree on a lightweight rule: whenever someone corrects a template's output twice for the same reason, that correction gets folded back into the template. In a Git-based library this is a small pull request; in OneNote, a dated 'changelog' line at the bottom of the page.",
            "Review the library quarterly: retire templates nobody used, promote frequently pasted ad-hoc prompts into templates, and update context blocks after system upgrades (a release change from ECC to S/4HANA invalidates version references in every template).",
          ],
        },
      ],
      screenshots: [
        {
          caption: "Team OneNote notebook with one section per prompt category",
          description: "OneNote for Windows showing a notebook named 'SAP Prompt Library' with sections 01 Explain Legacy through 10 Forms Translation, the ATC-fix template page open with its placeholder legend highlighted.",
        },
        {
          caption: "Claude Project preloaded with CDS view prompt templates and annotation guidelines",
          description: "Claude Web Project view titled 'CDS Development' showing custom instructions containing the CDS template, knowledge files with the team's annotation standards, and a chat generating a CDS view from just a table name.",
        },
      ],
      video: {
        caption: "From ad-hoc prompts to a team prompt library in 30 minutes",
        description: "Walkthrough of creating the ten-category structure in a Git Markdown repo, parameterizing two real prompts with placeholders, wiring the most-used templates into a Claude Project, and demonstrating the Win+V clipboard workflow.",
        duration: "7:45",
      },
      sapExample: {
        title: "ATC remediation sprint at a bottling company",
        scenario: "A beverage bottler running ECC 6.0 kicks off custom-code remediation ahead of an S/4HANA 2023 conversion. ATC (with the S/4HANA readiness variant) reports 4,800 findings across 900 Z-objects. The team builds a prompt library so that all six developers fix findings the same way, and tracks that the ATC-fix template resolves the bulk categories — SELECT *, missing ORDER BY after SELECT, and MATNR length conflicts — consistently.",
        prompt: `You are an ABAP quality expert. ATC check CI_SELECT_STAR raised this finding
on ECC 6.0 EHP8 (ABAP 7.50), target S/4HANA 2023:

<finding>
Do not use SELECT * - specify the required fields explicitly.
Object: ZSD_DELIVERY_MONITOR, line 214.
</finding>

<code>
SELECT * FROM likp INTO TABLE @DATA(lt_likp)
  WHERE erdat IN @s_erdat
    AND vstel = @p_vstel.
LOOP AT lt_likp ASSIGNING FIELD-SYMBOL(<ls_likp>).
  WRITE: / <ls_likp>-vbeln, <ls_likp>-lfdat, <ls_likp>-kunnr.
ENDLOOP.
</code>

Task: explain why ATC flags this, then provide corrected code that
selects only the fields actually used, without changing behavior.`,
        code: {
          language: "abap",
          filename: "zsd_delivery_monitor_fix.abap",
          code: `SELECT vbeln, lfdat, kunnr
  FROM likp
  WHERE erdat IN @s_erdat
    AND vstel  = @p_vstel
  INTO TABLE @DATA(lt_likp).

LOOP AT lt_likp ASSIGNING FIELD-SYMBOL(<ls_likp>).
  WRITE: / <ls_likp>-vbeln, <ls_likp>-lfdat, <ls_likp>-kunnr.
ENDLOOP.`,
        },
        explanation: [
          "Because every developer used the same template, fixes across the 900 objects were structurally identical, which made code review fast: reviewers checked the diff pattern once and could scan the rest. The template's rule 3 (only suggest a pragma when genuinely justified) prevented the classic remediation anti-pattern of silencing findings with pseudo-comments instead of fixing them.",
          "The team folded improvements back into the library twice during the sprint — adding the instruction to keep field order aligned with usage, and a reminder that S/4HANA no longer guarantees implicit sorting, so any code relying on ordered results needs an explicit SORT or ORDER BY. Those refinements immediately benefited all six developers.",
        ],
      },
      bestPractices: [
        "Keep the library small and curated — ten polished templates beat a hundred unvetted ones.",
        "Give every template a placeholder legend with example values so it is fillable on first read.",
        "Store the master library somewhere versionable (Git Markdown) or universally accessible (OneNote), and mirror the top templates into Claude Projects.",
        "Include a filled-in example of good output with each template as a quality benchmark and few-shot sample.",
        "Fold recurring corrections back into templates — the library must learn from use.",
        "Keep separate context blocks per system (ECC vs. S/4HANA) and reference them from templates instead of duplicating.",
        "Never put real business data, host names, or credentials into shared templates or examples.",
      ],
      commonMistakes: [
        {
          mistake: "Collecting every prompt anyone ever wrote, creating an unsearchable dump nobody trusts.",
          fix: "Curate: one polished template per category, with a 'when to use' line; archive the rest.",
        },
        {
          mistake: "Ambiguous placeholders like {NAME} that different developers fill differently.",
          fix: "Use specific UPPER_SNAKE_CASE placeholders ({CLASS_NAME}, {TABLE_NAME}) plus a legend with example values.",
        },
        {
          mistake: "Templates hard-code a system release that becomes wrong after the S/4HANA conversion.",
          fix: "Reference a shared {SYSTEM_RELEASE}/context block that is updated once, centrally, after upgrades.",
        },
        {
          mistake: "Storing the library on one developer's local drive.",
          fix: "Put it in a shared OneNote notebook or a Git repository the whole team can read and improve.",
        },
        {
          mistake: "Letting templates rot — outputs degrade but nobody updates the prompt.",
          fix: "Adopt the two-corrections rule: the second time you fix the same output issue, update the template.",
        },
      ],
      tips: [
        "Win+V clipboard history is the prompt-library power move: template, context block, and code paste can all be on the clipboard at once.",
        "Pin your OneNote library notebook to the Windows taskbar (right-click the OneNote icon, pin the notebook from Jump List) for one-click access.",
        "Name OneNote pages and Markdown files with numeric prefixes (01-, 02-) so the category order stays stable everywhere.",
        "Create one Claude Project per heavy-use category (e.g. 'ATC Remediation') and paste the template into its custom instructions — then you only send the variable parts.",
        "Use Snipping Tool (Win+Shift+S) to capture ATC finding popups or debugger states as images and paste them straight into Claude alongside the template.",
      ],
      exercise: {
        title: "Create and parameterize your first two library templates",
        scenario: "Your team of four ABAP developers at a CPG company has been using Claude individually for three months. Everyone has good prompts scattered in Notepad files. You have been asked to seed the official team library with the two highest-value templates: 'explain legacy code' and 'generate CDS view'.",
        tasks: [
          "Write the 'explain legacy code' template with placeholders {PASTE_CODE} and {SYSTEM_RELEASE}, asking for functionality, tables touched, and risks.",
          "Write the 'generate CDS view' template with placeholders {TABLE_NAME}, {VIEW_NAME}, and {PURPOSE}, encoding at least two annotation requirements.",
          "Add a placeholder legend with example values to both templates.",
          "Decide on a storage location (OneNote section vs. Git Markdown file) and write a three-line README rule for contributions.",
          "Test the CDS template by generating a view over MARA and grade the output against your annotation requirements.",
        ],
        hint: "For the CDS template, decide which annotations are mandatory in your shop — typically @AccessControl.authorizationCheck, @EndUserText.label, and @Metadata.ignorePropagatedAnnotations — and state them as hard constraints rather than suggestions.",
        solution: {
          language: "text",
          filename: "solution-cds-template.txt",
          code: `## Generate CDS view
## Placeholders: {TABLE_NAME}=mara | {VIEW_NAME}=ZI_Material | {PURPOSE}=basic material list for Fiori value help
##               {SYSTEM_RELEASE}=S/4HANA 2023

You are a CDS modeling expert on {SYSTEM_RELEASE}.
Create a CDS view entity {VIEW_NAME} on table {TABLE_NAME} for: {PURPOSE}.

Hard constraints:
- DEFINE VIEW ENTITY syntax (not the obsolete DDIC-based DEFINE VIEW).
- @AccessControl.authorizationCheck: #CHECK and a matching DCL stub.
- @EndUserText.label set to a meaningful English text (max 60 chars).
- CamelCase aliases for all fields; key fields first.
- Only fields needed for {PURPOSE} - no SELECT-all modeling.

Output: the CDS source, then the DCL stub, no prose.`,
        },
      },
      quiz: [
        {
          question: "What is the recommended size and shape of a team prompt library?",
          options: [
            "As many prompts as possible, one file per developer",
            "Roughly ten curated categories with one polished, parameterized template each",
            "A single mega-prompt covering all use cases",
            "No stored prompts — everyone should write fresh prompts each time",
          ],
          correctIndex: 1,
          explanation: "Small and curated wins: about ten categories, each with one trusted template, a 'when to use' line, and an example of good output. Large unvetted collections stop being used.",
        },
        {
          question: "Why should placeholders use a specific convention like {TABLE_NAME} with a legend?",
          options: [
            "Claude requires curly braces to parse prompts",
            "It makes the prompt shorter",
            "So any teammate fills the template correctly on first read, without guessing what a variable means",
            "Placeholders improve ABAP runtime performance",
          ],
          correctIndex: 2,
          explanation: "Explicit UPPER_SNAKE_CASE placeholders plus a legend with example values make templates self-explanatory — the main factor deciding whether a library actually gets reused.",
        },
        {
          question: "Which storage combination is recommended for most SAP teams?",
          options: [
            "Local Notepad files on each developer's laptop",
            "A master library in OneNote or Git Markdown, plus Claude Projects preloaded with the most-used templates",
            "Prompts stored inside SAP transport requests",
            "Printing the prompts and keeping them at each desk",
          ],
          correctIndex: 1,
          explanation: "A shared, versionable master (OneNote for accessibility or Git for history) combined with Claude Projects for frictionless daily use covers both governance and speed.",
        },
        {
          question: "According to the 'two-corrections rule', when should a template be updated?",
          options: [
            "Every Monday regardless of usage",
            "Only during system upgrades",
            "The second time you correct the template's output for the same reason",
            "Never — templates should stay frozen for consistency",
          ],
          correctIndex: 2,
          explanation: "If the same correction is needed twice, the template is missing a constraint. Folding the fix back in makes the improvement available to the whole team immediately.",
        },
      ],
      summary: [
        "A prompt library turns individual prompt discoveries into team assets: ten curated categories covering explanation, refactoring, tests, CDS, ATC, review, documentation, debugging, performance, and forms translation.",
        "Parameterize templates with explicit placeholders like {TABLE_NAME} and add a legend with example values so anyone can use them correctly.",
        "Store the master in OneNote or a Git Markdown repo, mirror heavy-use templates into Claude Projects, and keep secrets and real data out.",
        "Maintain the library with the two-corrections rule and quarterly reviews so templates keep pace with your system landscape.",
      ],
      download: {
        name: "SAP Team Prompt Library Starter",
        description: "Ten parameterized starter templates — one per core category — ready to drop into your team's OneNote notebook or Git repository.",
        filename: "sap-prompt-pack-library.md",
        content: `# SAP Team Prompt Library — Starter Pack

Ten parameterized templates. Fill {PLACEHOLDERS} before sending.
Maintain with the two-corrections rule: same fix needed twice = update the template.

---

## 01 Explain legacy code
\`\`\`
You are a senior ABAP developer on {SYSTEM_RELEASE}.
Explain the code in <code>: functionality step by step, tables touched,
and risks (performance, obsolete statements, hard-coding).
<code>
{PASTE_CODE}
</code>
\`\`\`

## 02 Refactor procedural to OO
\`\`\`
Refactor the report/FORM logic in <code> into a class ZCL_{AREA}_{NAME}
on {SYSTEM_RELEASE}: separate data access, business logic, and output.
Class-based exceptions, dependency-injectable database access via an interface.
Output the interface, class definition, and implementation.
<code>
{PASTE_CODE}
</code>
\`\`\`

## 03 Generate ABAP Unit test class
\`\`\`
Write a local ABAP Unit test class (FOR TESTING RISK LEVEL HARMLESS DURATION SHORT)
for the class in <code>. CL_ABAP_UNIT_ASSERT assertions, test doubles for DB access,
cover happy path, empty result, and exception path of {FOCUS_METHOD}.
<code>
{PASTE_CODE}
</code>
\`\`\`

## 04 Write CDS view
\`\`\`
Create CDS view entity {VIEW_NAME} on {TABLE_NAME} for: {PURPOSE}.
Constraints: DEFINE VIEW ENTITY syntax, @AccessControl.authorizationCheck: #CHECK
with DCL stub, @EndUserText.label, CamelCase aliases, only needed fields.
\`\`\`

## 05 ATC fix suggestion
\`\`\`
ATC check {CHECK_ID} on {SYSTEM_RELEASE} raised:
<finding>{ATC_FINDING}</finding>
<code>{PASTE_CODE}</code>
Explain the finding, provide corrected code with unchanged behavior,
and mention a pragma only if genuinely justified.
\`\`\`

## 06 Code review
\`\`\`
Review the code in <code> as a strict senior reviewer on {SYSTEM_RELEASE}.
Check: correctness, clean ABAP, performance (SELECTs in loops, missing keys),
security (AUTHORITY-CHECK, injection), naming vs. {NAMESPACE} conventions.
Output a numbered list of findings with severity and suggested fix each.
<code>{PASTE_CODE}</code>
\`\`\`

## 07 Generate documentation
\`\`\`
Write technical documentation for the object in <code>:
purpose, interfaces/signatures, tables read/written, error handling,
and a short 'how to extend' section. Audience: ABAP developers new to the object.
Format: Markdown with headings.
<code>{PASTE_CODE}</code>
\`\`\`

## 08 Debugging help
\`\`\`
Symptom: {SYMPTOM}. Expected: {EXPECTED}. Actual: {ACTUAL}.
Think step by step: restate the logic in <code>, rank candidate root causes,
name the exact debugger breakpoints/table checks for each, then recommend a fix.
<code>{PASTE_CODE}</code>
\`\`\`

## 09 Performance analysis
\`\`\`
Analyze the code in <code> for performance on {SYSTEM_RELEASE} with
~{DATA_VOLUME} rows in {TABLE_NAME}. Identify: SELECTs in loops, missing
index usage, nested LOOPs over standard tables, unnecessary SELECT fields.
Propose the optimized version and estimate the impact of each change.
<code>{PASTE_CODE}</code>
\`\`\`

## 10 SAPscript / Smart Forms translation
\`\`\`
We are migrating {FORM_NAME} ({FORM_TECH}: SAPscript or Smart Form) to
{TARGET_TECH} (e.g. Adobe Forms). The logic below comes from the form's
program lines / code nodes. Explain what it does, then map it to
{TARGET_TECH} concepts (interface fields, script/FormCalc where needed).
<code>{PASTE_LOGIC}</code>
\`\`\`
`,
      },
      relatedSlugs: ["prompt-engineering", "code", "atc-remediation", "cds-views"],
    },
    {
      slug: "code",
      title: "Working with Code in Claude",
      description:
        "Move real ABAP in and out of Claude effectively: paste code with the right context, respect context limits, generate and refactor classes, produce ABAP Unit tests, review diffs, and handle multi-file scenarios.",
      duration: 35,
      level: "Intermediate",
      keywords: [
        "paste ABAP",
        "context window",
        "refactoring",
        "ABAP Unit",
        "code generation",
        "diff review",
        "artifacts",
        "multi-file context",
      ],
      overview: [
        "Chatting about code and working with code are different disciplines. This lesson covers the mechanics of getting ABAP into Claude cleanly (from SE80, ADT in Eclipse, or abapGit exports), understanding what fits in the context window, and getting code back out in a form you can activate. You will practice the four everyday code workflows: generate, explain, refactor, and test.",
        "Refactoring gets special attention because it is where SAP teams see the biggest payoff: converting procedural reports with FORM routines into testable classes. You will learn to feed Claude the code plus its DDIC dependencies, ask for an interface-based design that isolates database access, and then immediately generate ABAP Unit tests against the new design — turning legacy code into tested code in one session.",
        "For larger objects, plain chat scrolls poorly. Claude's artifacts (in Claude Web and Claude Desktop) render generated files in a side panel you can iterate on without losing the conversation thread. And when a change spans multiple objects — a class, its interface, a CDS view, and a test class — you will learn multi-file strategies: tagging each file, pasting a dependency summary instead of full sources, and knowing when to graduate to Claude Code, which reads files from disk directly.",
      ],
      objectives: [
        "Paste ABAP from SE80/ADT into Claude with enough surrounding context (DDIC, signatures) for accurate answers.",
        "Estimate whether code fits the context window and apply summarize-and-reference strategies when it does not.",
        "Refactor a procedural report into a class design with isolated database access, then generate ABAP Unit tests for it.",
        "Review a Claude-proposed change as a diff and verify it before transporting.",
        "Manage multi-file scenarios with XML-tagged file blocks and decide when to switch to Claude Code.",
      ],
      steps: [
        {
          title: "Paste code with its dependencies",
          body: [
            "Claude can only reason about what it sees. ABAP is unusually dependency-heavy: a ten-line method may reference DDIC structures, constants interfaces, and macros defined elsewhere. Before asking anything non-trivial, paste the relevant type definitions alongside the code — the structure fields, the table keys, the interface signature. In ADT (Eclipse), F3-navigate to each dependency and copy what matters; from SE80, use the object list to grab includes.",
            "Wrap each piece in a labelled tag: <code> for the object in question, <ddic> for table and structure definitions, <interfaces> for referenced signatures. Two minutes of assembly prevents the most common failure mode: Claude inventing field names that do not exist in your structures.",
          ],
          code: {
            language: "text",
            filename: "paste-with-dependencies.txt",
            code: `<ddic>
ZTB_BATCH_QUEUE: MANDT, QUEUE_ID (NUMC10), MATNR (MATNR40), WERKS (WERKS_D),
                 STATUS (CHAR1: N=new P=processing D=done E=error), MSG (CHAR220)
</ddic>

<interfaces>
INTERFACE zif_batch_processor.
  METHODS process IMPORTING iv_queue_id TYPE numc10
                  RAISING   zcx_batch_error.
ENDINTERFACE.
</interfaces>

<code>
{the method you want analyzed}
</code>

<task>
Why can STATUS remain 'P' forever if PROCESS raises an exception? Propose a fix.
</task>`,
          },
        },
        {
          title: "Understand context limits and work within them",
          body: [
            "Claude's context window is large — hundreds of thousands of tokens, roughly hundreds of pages of text — so a single class or even a large report include fits comfortably. But an entire abapGit export of a 200-object package does not, and even when everything technically fits, burying the question under megabytes of irrelevant code degrades answer quality. The skill is relevance selection, not maximum stuffing.",
            "Practical rules of thumb: one line of ABAP is roughly 10-15 tokens, so a 3,000-line include is around 40,000 tokens — fine. For bigger scopes, paste the objects you are changing in full, and represent the rest as summaries: signatures only, or a one-line description per object. If Claude needs details of a summarized object mid-conversation, paste that object then.",          ],
          callout: {
            type: "warning",
            title: "Long chats degrade before they fail",
            body: "In very long conversations the earliest pasted code still counts, but attention gets diluted and outdated versions of code you have since revised may confuse the thread. When a conversation has accumulated several revisions, start a fresh chat with only the current version and a two-line recap.",
          },
        },
        {
          title: "Generate and explain code",
          body: [
            "For generation, combine the prompt-anatomy lesson with pasted dependencies: state release and guidelines, provide the DDIC types, describe the behavior, and demand code-only output. For explanation, ask for a specific depth — 'one paragraph summary' for triage, 'line-by-line for the LOOP block only' for deep dives. Unbounded 'explain this' requests on 500 lines produce essays nobody reads.",
            "A high-leverage explanation pattern for SAP: ask Claude to produce a call-flow summary — which methods call which, which tables are read versus written, where COMMIT WORK happens. This is the map you need before any refactoring, and Claude builds it in seconds from a paste that would take an hour to trace in the debugger.",
          ],
          code: {
            language: "text",
            filename: "call-flow-prompt.txt",
            code: `Analyze the report in <code> and produce:
1. A call-flow outline: START-OF-SELECTION -> forms/methods in call order.
2. A table access list: table | read/write | where in the code.
3. All COMMIT WORK / ROLLBACK WORK locations and what triggers them.
4. Any dynamic elements (field-symbols to dynamic components, dynamic SQL,
   PERFORM ... IN PROGRAM) that a refactoring must treat carefully.
Keep it under 40 lines - this is a refactoring map, not documentation.`,
          },
        },
        {
          title: "Refactor procedural ABAP to classes",
          body: [
            "The classic modernization: a 2,000-line report with 30 FORM routines becomes a class with clear responsibilities. Feed Claude the call-flow map from the previous step plus the full source, and ask for a design first — class breakdown, interface for database access, what stays in the report as a thin shell. Approve or adjust the design, then have Claude implement it class by class. Never ask for a 2,000-line rewrite in one response.",
            "Insist on an interface between logic and database (e.g. ZIF_*_DAO). This single design constraint is what makes the next step — unit tests with test doubles — possible, and it is the difference between refactoring for aesthetics and refactoring for testability.",
          ],
          code: {
            language: "abap",
            filename: "refactored-design-excerpt.abap",
            code: `INTERFACE zif_sd_backorder_dao PUBLIC.
  METHODS read_open_orders
    IMPORTING iv_werks         TYPE werks_d
    RETURNING VALUE(rt_orders) TYPE ztt_sd_open_orders
    RAISING   zcx_sd_dao_error.
ENDINTERFACE.

CLASS zcl_sd_backorder_engine DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    METHODS constructor
      IMPORTING io_dao TYPE REF TO zif_sd_backorder_dao.
    METHODS prioritize
      IMPORTING iv_werks          TYPE werks_d
      RETURNING VALUE(rt_ranked)  TYPE ztt_sd_ranked_orders
      RAISING   zcx_sd_backorder_error.
  PRIVATE SECTION.
    DATA mo_dao TYPE REF TO zif_sd_backorder_dao.
ENDCLASS.`,
          },
        },
        {
          title: "Generate ABAP Unit tests and review as a diff",
          body: [
            "With an interface-based design, test generation is mechanical: paste the class and interface, and use your library's test template (FOR TESTING RISK LEVEL HARMLESS DURATION SHORT, CL_ABAP_UNIT_ASSERT, a local test double implementing the DAO interface). Ask for behavior-named test methods and explicit given/when/then structure inside each. Run them in ADT with Ctrl+Shift+F10 and expect to fix a couple of assertions — generated tests are a strong draft, not a finished suite.",
            "When Claude proposes changes to existing code, do not eyeball two full listings. Ask for the change as a unified diff, or paste old and new into a diff tool (WinMerge is a solid free choice on Windows; ADT has compare built in). Review the diff hunk by hunk exactly as you would a colleague's transport — you own what you activate.",
          ],
          code: {
            language: "abap",
            filename: "ltc_backorder_engine.abap",
            code: `CLASS ltd_dao_stub DEFINITION FOR TESTING.
  PUBLIC SECTION.
    INTERFACES zif_sd_backorder_dao.
    DATA mt_orders TYPE ztt_sd_open_orders.
ENDCLASS.

CLASS ltd_dao_stub IMPLEMENTATION.
  METHOD zif_sd_backorder_dao~read_open_orders.
    rt_orders = mt_orders.
  ENDMETHOD.
ENDCLASS.

CLASS ltc_backorder_engine DEFINITION FOR TESTING
  RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    METHODS ranks_older_orders_first FOR TESTING RAISING cx_static_check.
ENDCLASS.

CLASS ltc_backorder_engine IMPLEMENTATION.
  METHOD ranks_older_orders_first.
    DATA(lo_stub) = NEW ltd_dao_stub( ).
    lo_stub->mt_orders = VALUE #( ( vbeln = '0000000001' erdat = '20240110' )
                                  ( vbeln = '0000000002' erdat = '20240105' ) ).
    DATA(lo_cut) = NEW zcl_sd_backorder_engine( lo_stub ).

    DATA(lt_ranked) = lo_cut->prioritize( iv_werks = 'DE01' ).

    cl_abap_unit_assert=>assert_equals(
      act = lt_ranked[ 1 ]-vbeln
      exp = '0000000002'
      msg = 'Oldest order must rank first' ).
  ENDMETHOD.
ENDCLASS.`,
          },
          callout: {
            type: "success",
            title: "The refactor-then-test loop",
            body: "Design with an interface, implement, generate tests, run in ADT, feed failures back to Claude verbatim ('assert_equals failed: expected 0000000002, actual 0000000001'). Two or three loops typically land a green test suite for a class that had zero tests an hour earlier.",
          },
        },
        {
          title: "Use artifacts for larger files and manage multi-file work",
          body: [
            "In Claude Web and Claude Desktop, larger generated files render as artifacts — a side panel separate from the chat. This matters for iteration: you can ask for five successive changes and the artifact updates in place, instead of scrolling through five near-identical listings. Copy the final version out once, when you are done.",
            "For changes spanning several objects, tag each file in your paste (<file name=\"zcl_x.clas.abap\">...</file>) and ask Claude to output changes per file, clearly separated. This works well up to a handful of objects. Beyond that — whole-package refactorings, abapGit repositories — the chat-paste workflow becomes the bottleneck, and Claude Code is the right tool: it reads and edits files on disk directly, so your abapGit working copy becomes the shared context instead of your clipboard.",
          ],
          code: {
            language: "text",
            filename: "multi-file-prompt.txt",
            code: `Rename the concept 'queue' to 'worklist' consistently across these files.
Output each changed file in full, in its own block, and list any file
you did NOT need to change.

<file name="zif_batch_processor.intf.abap">
{source}
</file>

<file name="zcl_batch_processor.clas.abap">
{source}
</file>

<file name="zcl_batch_monitor.clas.abap">
{source}
</file>`,
          },
        },
      ],
      screenshots: [
        {
          caption: "ABAP class rendered as an artifact in Claude Desktop with iterative edits",
          description: "Claude Desktop on Windows showing chat on the left and an artifact panel on the right containing a full ABAP class; the conversation shows three short follow-up requests that each updated the artifact in place.",
        },
        {
          caption: "Reviewing a Claude-proposed change in WinMerge before activation",
          description: "WinMerge window comparing the original ZSD_BACKORDER report against Claude's refactored version side by side, with changed SELECT statements highlighted, next to ADT open on the same object.",
        },
      ],
      video: {
        caption: "From legacy report to tested class in one Claude session",
        description: "End-to-end recording: pasting a procedural report with DDIC context, generating the call-flow map, agreeing a class design, implementing via artifacts, generating ABAP Unit tests, running them in ADT, and fixing one red test by pasting the failure message back to Claude.",
        duration: "12:40",
      },
      sapExample: {
        title: "Modernizing a backorder report during an S/4HANA conversion",
        scenario: "A soft-drinks producer converting from ECC to S/4HANA 2023 has a business-critical backorder prioritization report: 1,800 lines, 27 FORM routines, zero tests, original author long gone. The conversion project requires it to survive the MATNR extension and pass ATC. The developer uses Claude to map, refactor, and test it over two sessions instead of the two weeks estimated for a manual rewrite.",
        prompt: `You are an ABAP architect. Below is the call-flow map you produced earlier and
the full source of report ZSD_BACKORDER_PRIO (ECC 6.0, target S/4HANA 2023,
namespace ZCL_*, clean ABAP, class-based exceptions).

Propose a class design BEFORE writing any code:
- Which classes, with one-line responsibility each.
- A DAO interface isolating all database access (list its methods + signatures).
- What remains in the report as a thin shell (selection screen + ALV only).
- Which parts are risky to change during the S/4 conversion (MATNR length!).

<call_flow>
{map from previous step}
</call_flow>
<code>
{full report source}
</code>`,
        code: {
          language: "abap",
          filename: "zsd_backorder_prio_shell.abap",
          code: `REPORT zsd_backorder_prio.

PARAMETERS: p_werks TYPE werks_d OBLIGATORY.
SELECT-OPTIONS: s_matnr FOR zsd_backorder_screen-matnr.

START-OF-SELECTION.
  TRY.
      DATA(lo_engine) = NEW zcl_sd_backorder_engine(
        NEW zcl_sd_backorder_dao( ) ).

      DATA(lt_ranked) = lo_engine->prioritize( iv_werks = p_werks
                                               it_matnr = s_matnr[] ).

      NEW zcl_sd_backorder_alv( )->display( lt_ranked ).

    CATCH zcx_sd_backorder_error INTO DATA(lx_error).
      MESSAGE lx_error->get_text( ) TYPE 'E'.
  ENDTRY.`,
        },
        explanation: [
          "The developer deliberately split the work: first a design-only prompt (no code), reviewed with the team lead, then implementation class by class, each into its own artifact. The DAO interface meant the prioritization logic could be unit-tested with stubbed order data — the generated test suite caught a date-comparison bug in Claude's first implementation before it ever reached the system.",
          "Because the design isolated database access, the S/4HANA-specific risks (extended MATNR, removed index tables) were confined to one DAO class. The report shell shrank to under 30 lines. Every Claude-proposed change was reviewed as a diff in ADT's compare view before activation, and the final ATC run on the Z_DEFAULT variant came back clean.",
        ],
      },
      bestPractices: [
        "Always paste DDIC definitions and interface signatures alongside code — Claude cannot see your data dictionary.",
        "Select for relevance, not volume: full source for objects you change, signatures or one-line summaries for the rest.",
        "Ask for a design before an implementation on any refactoring larger than one method.",
        "Require an interface between business logic and database access so generated ABAP Unit tests can use test doubles.",
        "Review every proposed change as a diff (ADT compare or WinMerge) before activating — you own what you transport.",
        "Use artifacts for files longer than a screen and iterate in place instead of re-generating full listings in chat.",
        "Start a fresh chat with the current code version once a conversation accumulates multiple revisions.",
      ],
      commonMistakes: [
        {
          mistake: "Pasting a method that references Z-structures without their definitions, then trusting the invented field names in the answer.",
          fix: "Include a <ddic> block with the structure and table definitions the code touches.",
        },
        {
          mistake: "Asking for a 2,000-line report rewrite in a single response.",
          fix: "Design first, then implement class by class; large single-shot rewrites are hard to review and prone to drift.",
        },
        {
          mistake: "Activating Claude's refactored version after only skimming it in the chat window.",
          fix: "Diff old versus new in ADT compare or WinMerge and review hunk by hunk, as you would a colleague's change.",
        },
        {
          mistake: "Continuing a marathon chat where three outdated versions of the class confuse the context.",
          fix: "Open a fresh conversation containing only the current source and a two-line recap of decisions made.",
        },
        {
          mistake: "Treating generated ABAP Unit tests as finished and committing them unrun.",
          fix: "Run them in ADT (Ctrl+Shift+F10), fix failures by feeding the exact assertion messages back to Claude, and only then transport.",
        },
      ],
      tips: [
        "Copy from ADT in Eclipse rather than old SE38 list displays — ADT preserves clean line breaks and indentation for pasting.",
        "Win+V clipboard history lets you queue the DDIC block, the interface, and the class source as three pastes without re-copying.",
        "Install WinMerge (free) and pin it to the taskbar for fast old-vs-new diffs of Claude output outside of Eclipse.",
        "Use Snipping Tool (Win+Shift+S) to capture ST22 dumps or debugger variable views and paste the image directly into Claude with your question.",
        "In ADT, Ctrl+Shift+F10 runs unit tests of the current class — make it muscle memory for the refactor-then-test loop.",
      ],
      exercise: {
        title: "Refactor and test a procedural utility with Claude",
        scenario: "You inherit a function module Z_GET_OPEN_DELIVERIES (procedural, SELECT inside a LOOP, no error handling) used by three reports at your beverage client. Your task: use Claude to turn it into a testable class on S/4HANA 2022 without changing its observable behavior.",
        tasks: [
          "Paste the function module plus the definitions of the tables it reads into Claude with <code> and <ddic> tags, and request a call-flow and table-access map.",
          "Ask for a design: one engine class, one DAO interface, and a compatibility plan for the three existing callers.",
          "Have Claude implement the DAO interface and engine class, fixing the SELECT-in-LOOP with a single JOIN or FOR ALL ENTRIES with a proper emptiness check.",
          "Generate a local ABAP Unit test class with a DAO stub covering happy path and empty-input behavior, and run it in ADT.",
          "Request the final change as a per-file output, diff it against the original in WinMerge or ADT compare, and note two things you would still change manually.",
        ],
        hint: "For FOR ALL ENTRIES, the emptiness check is non-negotiable: an empty driver table selects ALL rows. If Claude's version lacks 'IF lt_keys IS NOT INITIAL.', that is your first correction to feed back.",
        solution: {
          language: "abap",
          filename: "zcl_sd_delivery_reader.abap",
          code: `CLASS zcl_sd_delivery_reader DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES zif_sd_delivery_dao.
ENDCLASS.

CLASS zcl_sd_delivery_reader IMPLEMENTATION.
  METHOD zif_sd_delivery_dao~get_open_deliveries.
    IF it_vbeln IS INITIAL.
      RETURN.
    ENDIF.

    SELECT likp~vbeln, likp~lfdat, lips~posnr, lips~matnr, lips~lfimg
      FROM likp
      INNER JOIN lips ON lips~vbeln = likp~vbeln
      FOR ALL ENTRIES IN @it_vbeln
      WHERE likp~vbeln = @it_vbeln-vbeln
        AND likp~wbstk <> 'C'
      INTO TABLE @rt_deliveries.

    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_sd_dao_error
        EXPORTING textid = zcx_sd_dao_error=>no_deliveries_found.
    ENDIF.
  ENDMETHOD.
ENDCLASS.`,
        },
      },
      quiz: [
        {
          question: "Why should DDIC definitions be pasted alongside ABAP code?",
          options: [
            "Claude charges less for prompts containing DDIC",
            "Claude cannot see your data dictionary, so without them it may invent plausible but nonexistent field names",
            "SAP requires DDIC export for licensing",
            "It makes the code compile inside Claude",
          ],
          correctIndex: 1,
          explanation: "Claude only knows what is in the conversation. Structure and table definitions ground its answers in your real fields instead of statistically likely guesses.",
        },
        {
          question: "What is the recommended approach for refactoring a 2,000-line procedural report?",
          options: [
            "Ask for the complete rewritten source in one response",
            "Refactor it manually and only use Claude for comments",
            "First request a call-flow map and a class design, approve it, then implement class by class",
            "Split the report into 50-line chunks and refactor each independently without context",
          ],
          correctIndex: 2,
          explanation: "Map, design, approve, then implement incrementally. Single-shot mega-rewrites are hard to review; context-free chunking loses the cross-cutting picture.",
        },
        {
          question: "What design constraint makes generated ABAP Unit tests genuinely useful?",
          options: [
            "Putting all logic into one large method for easier testing",
            "An interface isolating database access, so tests can inject a stub instead of hitting real tables",
            "Using only public attributes",
            "Generating tests before the class exists",
          ],
          correctIndex: 1,
          explanation: "A DAO-style interface lets the test class supply a local test double with controlled data, making tests fast, deterministic, and independent of system content.",
        },
        {
          question: "When should you move from chat-pasting to Claude Code for ABAP work?",
          options: [
            "Never — chat handles all scenarios equally well",
            "Whenever code exceeds 50 lines",
            "When changes span many files or a whole abapGit package, so tooling that reads files from disk beats clipboard round-trips",
            "Only when working on weekends",
          ],
          correctIndex: 2,
          explanation: "Tagged multi-file pastes work for a handful of objects. For package-scale refactorings on an abapGit working copy, Claude Code operates on the files directly and removes the clipboard bottleneck.",
        },
      ],
      summary: [
        "Paste ABAP together with its DDIC and interface dependencies in tagged blocks — relevance selection beats maximum stuffing of the context window.",
        "For refactoring: map the call flow, agree a design with a DAO interface, implement class by class, and never accept a mega-rewrite in one shot.",
        "Generate ABAP Unit tests against the interface, run them in ADT, and feed failures back verbatim; review every change as a diff before activating.",
        "Use artifacts to iterate on larger files in place, tag files for small multi-object changes, and switch to Claude Code for package-scale work.",
      ],
      download: {
        name: "Working-with-Code Prompt Pack",
        description: "Eight prompts covering the code lifecycle in Claude: dependency-aware pasting, call-flow mapping, design, refactoring, test generation, diff review, and multi-file changes.",
        filename: "sap-prompt-pack-code.md",
        content: `# Working with Code in Claude — Prompt Pack

Eight prompts for moving real ABAP through Claude. Fill {PLACEHOLDERS};
wrap pasted sources in the tags shown.

---

## 1. Dependency-aware analysis
\`\`\`
<ddic>{TABLE_AND_STRUCTURE_DEFINITIONS}</ddic>
<interfaces>{REFERENCED_SIGNATURES}</interfaces>
<code>{PASTE_CODE}</code>
<task>{QUESTION}</task>
Answer using ONLY fields and signatures defined above. If something you need
is not defined here, ask for it instead of guessing.
\`\`\`

## 2. Call-flow map (pre-refactoring)
\`\`\`
Analyze <code> and output: 1) call-flow outline from START-OF-SELECTION,
2) table access list (table | read/write | location), 3) all COMMIT/ROLLBACK
points, 4) dynamic constructs needing care. Max 40 lines.
<code>{PASTE_CODE}</code>
\`\`\`

## 3. Design before implementation
\`\`\`
Propose a class design for the report in <code> on {SYSTEM_RELEASE} - NO code yet:
classes with one-line responsibilities, a DAO interface (methods + signatures)
isolating all DB access, and what stays in the report shell.
<code>{PASTE_CODE}</code>
\`\`\`

## 4. Implement one class from the design
\`\`\`
Based on the agreed design, implement only {CLASS_NAME} now.
{SYSTEM_RELEASE}, clean ABAP, class-based exceptions ({EXCEPTION_CLASS}).
Output as a single complete source I can paste into ADT. No other classes.
\`\`\`

## 5. Generate ABAP Unit tests
\`\`\`
Write a local test class for <code>: FOR TESTING RISK LEVEL HARMLESS DURATION SHORT,
CL_ABAP_UNIT_ASSERT, a local stub implementing {DAO_INTERFACE}, behavior-named
test methods with given/when/then, covering happy path, empty input, and the
exception path.
<code>{PASTE_CLASS_AND_INTERFACE}</code>
\`\`\`

## 6. Fix a red test
\`\`\`
This ABAP Unit test failed:
<failure>{EXACT_ASSERTION_MESSAGE}</failure>
<test>{TEST_METHOD}</test>
<code>{METHOD_UNDER_TEST}</code>
Determine whether the test or the implementation is wrong, explain why,
and provide the corrected version of whichever is at fault.
\`\`\`

## 7. Change as reviewable diff
\`\`\`
Apply this change to <code>: {CHANGE_DESCRIPTION}.
Output ONLY a unified diff (---/+++/@@ format) against the pasted version,
followed by a 3-line summary of behavioral impact.
<code>{PASTE_CODE}</code>
\`\`\`

## 8. Multi-file consistent change
\`\`\`
Apply this change consistently: {CHANGE_DESCRIPTION}.
Output each modified file in full in its own block, keep unmodified files out,
and end with a checklist: file | changed? | one-line reason.
<file name="{FILENAME_1}">{SOURCE_1}</file>
<file name="{FILENAME_2}">{SOURCE_2}</file>
<file name="{FILENAME_3}">{SOURCE_3}</file>
\`\`\`
`,
      },
      relatedSlugs: ["prompt-engineering", "claude-code", "eclipse-adt", "code-reviews"],
    },
  ],
};
