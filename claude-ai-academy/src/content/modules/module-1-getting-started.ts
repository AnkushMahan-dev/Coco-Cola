import type { Module } from "../types";

export const module1: Module = {
  slug: "getting-started",
  title: "Getting Started with Claude",
  shortTitle: "Getting Started",
  icon: "rocket",
  description:
    "Install and master the Claude apps on your Windows laptop — Desktop, Web, Chat and Claude Code — and learn the command vocabulary that powers them.",
  lessons: [
    {
      slug: "claude-desktop",
      title: "Claude Desktop on Windows",
      description:
        "Install the Claude Desktop app on your Windows laptop, sign in with your work account, and configure it as your daily AI companion for SAP work.",
      duration: 20,
      level: "Beginner",
      keywords: [
        "install",
        "windows",
        "desktop app",
        "setup",
        "sign in",
        "keyboard shortcut",
        "system tray",
      ],
      overview: [
        "Claude Desktop is Anthropic's native Windows application for Claude. Compared to the browser, it gives you a global keyboard shortcut to summon Claude from anywhere (including while you are inside SAP GUI or Eclipse), support for MCP servers that connect Claude to local tools and files, and the Cowork workspace for agentic file tasks.",
        "For an SAP developer, the desktop app becomes the fastest path from 'I am staring at a dump in ST22' to 'Claude explained the root cause' — copy, summon, paste, answer. In this lesson you will install the app, sign in, tour the interface, and set the options that matter on a corporate Windows laptop.",
      ],
      objectives: [
        "Install Claude Desktop on Windows and sign in with your work account.",
        "Navigate the main interface: chats, projects, the sidebar and settings.",
        "Configure the global keyboard shortcut and startup behavior.",
        "Locate the configuration folder (%APPDATA%\\Claude) used later for MCP servers.",
        "Start your first SAP-related conversation from the desktop app.",
      ],
      steps: [
        {
          title: "Download and install the app",
          body: [
            "Go to claude.ai/download and choose the Windows installer. Run the downloaded .exe — installation takes under a minute and does not require admin rights on most corporate builds. If your company distributes software through a portal (e.g. Company Portal / Software Center), check there first: many IT departments package Claude Desktop centrally.",
          ],
          callout: {
            type: "info",
            title: "Corporate laptops",
            body: "If the installer is blocked by policy, raise a software request with IT rather than working around it. Your organization may have a Claude for Work agreement with SSO — that is the account you should use, not a personal one.",
          },
        },
        {
          title: "Sign in with your work account",
          body: [
            "Launch the app and sign in. If your company uses single sign-on you will be redirected to the familiar Microsoft/identity-provider login. A work account matters: enterprise plans carry commercial data-protection terms, whereas a private account may not be approved for company code and data.",
          ],
        },
        {
          title: "Tour the interface",
          body: [
            "The left sidebar shows recent chats and Projects (shared spaces with custom instructions and knowledge files). The center is the conversation. The model picker sits near the input box — for complex ABAP work choose the most capable model available to you; for quick lookups a faster model is fine.",
          ],
        },
        {
          title: "Set the global shortcut and startup options",
          body: [
            "Open Settings from your profile menu. Enable 'Launch on login' so Claude is always one keystroke away, and note the global shortcut (configurable, e.g. Ctrl+Alt+Space) that pops a Claude window over whatever you are doing — including SAP GUI or Eclipse ADT.",
          ],
          code: {
            language: "text",
            filename: "first-prompt.txt",
            code: "You are helping an SAP ABAP developer.\nExplain in simple terms what this ST22 short dump means and list the 3 most likely root causes:\n\nCategory: ABAP Programming Error\nRuntime Errors: ITAB_LINE_NOT_FOUND\nABAP Program: ZCC_SALES_ORDER_PROC\n\nError analysis: You wanted to read an entry in internal table LT_ORDERS, but the entry does not exist.",
          },
        },
        {
          title: "Find the configuration folder",
          body: [
            "Press Win+R, type %APPDATA%\\Claude and press Enter. This folder holds claude_desktop_config.json — the file where MCP servers are registered later in the course. You do not need to change anything yet; just remember where it lives.",
          ],
          code: {
            language: "powershell",
            filename: "PowerShell",
            code: "# Open the Claude Desktop config folder\nexplorer \"$env:APPDATA\\Claude\"\n\n# Show the config file (created after first launch)\nGet-Content \"$env:APPDATA\\Claude\\claude_desktop_config.json\"",
          },
        },
        {
          title: "Pin Claude for daily use",
          body: [
            "Right-click the taskbar icon and choose 'Pin to taskbar'. With Windows Snap (Win+Left/Right) you can dock Claude beside SAP GUI — a layout you will use constantly in the SAP GUI lesson.",
          ],
        },
      ],
      screenshots: [
        {
          caption: "Claude Desktop main window after sign-in",
          description:
            "The Claude Desktop app on Windows 11 showing the sidebar with recent chats and projects, the model picker, and an empty conversation ready for input.",
        },
        {
          caption: "Settings dialog with launch-on-login and shortcut options",
          description:
            "The desktop app settings pane highlighting the global keyboard shortcut field and the 'Launch at login' toggle.",
        },
      ],
      video: {
        caption: "Installing and configuring Claude Desktop on Windows 11",
        description:
          "Screen recording: downloading the installer, signing in via corporate SSO, touring the sidebar, setting the global shortcut, and docking Claude next to SAP GUI with Windows Snap.",
        duration: "6:30",
      },
      sapExample: {
        title: "Explaining a short dump during month-end close",
        scenario:
          "A batch job at a beverage bottling company fails during month-end close with an ITAB_LINE_NOT_FOUND dump in a custom pricing report. The on-call developer copies the dump text from ST22 into Claude Desktop.",
        prompt:
          "I'm an ABAP developer on call. This dump occurred in production during month-end close. Explain the root cause and suggest a defensive fix I can implement in the dev system.\n\n<dump>\nRuntime Errors: ITAB_LINE_NOT_FOUND\nABAP Program: ZCC_PRICING_REPORT\nLine: 214 READ TABLE lt_conditions INDEX lv_idx INTO ls_condition.\n</dump>",
        code: {
          language: "abap",
          filename: "zcc_pricing_report (fix)",
          code: "* Before: dumps when lv_idx exceeds the table size\nREAD TABLE lt_conditions INDEX lv_idx INTO ls_condition.\n\n* After: defensive read with explicit handling\nIF line_exists( lt_conditions[ lv_idx ] ).\n  ls_condition = lt_conditions[ lv_idx ].\nELSE.\n  \" Log and skip instead of dumping during close\n  MESSAGE i042(zcc_price) WITH lv_idx INTO DATA(lv_msg).\n  zcl_cc_log=>get_instance( )->add_warning( lv_msg ).\n  CONTINUE.\nENDIF.",
        },
        explanation: [
          "Claude identifies that the READ TABLE ... INDEX statement assumes the row exists and recommends the line_exists( ) predicate (ABAP 7.4+) with explicit error handling.",
          "Notice the workflow: the developer never left their desk setup — Alt-Tab to Claude Desktop, paste, get an explanation plus a fix proposal, then implement and test it properly in the dev system. Claude accelerates the analysis; the transport and testing process stays unchanged.",
        ],
      },
      bestPractices: [
        "Use your company work account, never a personal account, for anything involving company code or data.",
        "Keep Claude Desktop updated — new capabilities like MCP improvements ship frequently.",
        "Choose the most capable model for complex ABAP analysis; switch to a faster model for quick syntax questions.",
        "Dock Claude beside your SAP tools with Windows Snap instead of constantly Alt-Tabbing.",
        "Start a new chat per topic — one dump analysis per conversation keeps answers focused and context clean.",
        "Learn the global shortcut early; the friction difference decides whether you actually use AI daily.",
      ],
      commonMistakes: [
        {
          mistake:
            "Signing in with a personal account on a corporate laptop and pasting company code into it.",
          fix: "Always use the company-provided (SSO) account, which is covered by your organization's data-protection agreement with Anthropic.",
        },
        {
          mistake:
            "Treating the desktop app as just a browser wrapper and ignoring its extra capabilities.",
          fix: "The desktop app adds the global shortcut, MCP server support and Cowork — features the browser does not have. You will need it from Module 4 onward.",
        },
        {
          mistake:
            "Keeping one giant conversation running for weeks until responses degrade.",
          fix: "Start a fresh chat per task. Long conversations fill the context window and dilute answer quality.",
        },
        {
          mistake:
            "Editing claude_desktop_config.json while the app is running and wondering why nothing changed.",
          fix: "Fully quit Claude from the system tray (not just the X button) and restart it after any config change.",
        },
      ],
      tips: [
        "Win+Shift+S (Snipping Tool) captures any SAP screen region — paste the screenshot directly into Claude with Ctrl+V and ask about it.",
        "Enable Windows clipboard history (Win+V) — invaluable when juggling code snippets between SAP GUI, Eclipse and Claude.",
        "Rename important chats (e.g. 'ZCC_PRICING dump analysis') so you can find them again next month.",
        "Create a Project called 'ABAP Helper' with your team's coding guidelines as project knowledge — every chat in it automatically knows your standards.",
      ],
      exercise: {
        title: "Set up your daily driver",
        scenario:
          "Get your Windows laptop ready for the rest of this course by completing a real setup and a first SAP conversation.",
        tasks: [
          "Install Claude Desktop and sign in with your work account.",
          "Enable launch-on-login and note the global shortcut.",
          "Open %APPDATA%\\Claude in Explorer and confirm claude_desktop_config.json exists.",
          "Snap Claude to the right half of your screen and SAP GUI (or any editor) to the left.",
          "Paste an ABAP snippet from your system (or the pricing example above) and ask Claude to explain it line by line.",
        ],
        hint: "Win+R → %APPDATA%\\Claude opens the config folder directly. If the JSON file is missing, launch the app once and quit it from the system tray.",
        solution: {
          language: "text",
          filename: "verification-checklist.txt",
          code: "[ ] Claude Desktop launches via taskbar pin and global shortcut\n[ ] Signed in with work (SSO) account\n[ ] %APPDATA%\\Claude\\claude_desktop_config.json exists\n[ ] Claude + SAP GUI snapped side by side (Win+Left / Win+Right)\n[ ] First ABAP explanation received and sanity-checked",
        },
      },
      quiz: [
        {
          question:
            "Which capability does Claude Desktop have that the claude.ai website does not?",
          options: [
            "Access to newer Claude models",
            "MCP server support and a global keyboard shortcut",
            "Longer context windows",
            "Free unlimited usage",
          ],
          correctIndex: 1,
          explanation:
            "Models and context are identical across surfaces. The desktop app's differentiators are local integration: MCP servers, the system-wide shortcut, and Cowork.",
        },
        {
          question:
            "Where does Claude Desktop store its configuration file on Windows?",
          options: [
            "C:\\Program Files\\Claude\\config.json",
            "The Windows Registry",
            "%APPDATA%\\Claude\\claude_desktop_config.json",
            "C:\\Users\\Public\\Claude\\settings.ini",
          ],
          correctIndex: 2,
          explanation:
            "claude_desktop_config.json lives in %APPDATA%\\Claude — you will edit it when registering MCP servers in Module 4.",
        },
        {
          question:
            "After editing claude_desktop_config.json, the changes don't take effect. What is the most likely reason?",
          options: [
            "The file must also be copied to Program Files",
            "Claude was closed with the X button but still runs in the system tray",
            "Config changes require reinstalling the app",
            "The file must be saved as UTF-16",
          ],
          correctIndex: 1,
          explanation:
            "Closing the window leaves the app running in the tray. Fully quit from the tray icon and restart for config changes to load.",
        },
        {
          question:
            "Why should you use your company account rather than a personal one for SAP work?",
          options: [
            "Personal accounts cannot open ABAP code",
            "Company plans are always cheaper",
            "Enterprise agreements carry the data-protection terms that authorize company code and data",
            "Work accounts respond faster",
          ],
          correctIndex: 2,
          explanation:
            "The legal and data-protection coverage (retention, no-training commitments, SSO controls) is attached to the enterprise agreement — not to the model.",
        },
      ],
      summary: [
        "Claude Desktop is the Windows-native app with a global shortcut, MCP support and Cowork — install it with your work account.",
        "The config folder %APPDATA%\\Claude becomes important when you add MCP servers later in the course.",
        "Snap Claude beside SAP GUI/Eclipse and start one focused chat per task for best results.",
      ],
      download: {
        name: "Desktop setup checklist",
        description:
          "A printable checklist for rolling out Claude Desktop across an SAP team, including corporate-laptop considerations.",
        filename: "claude-desktop-setup-checklist.md",
        content:
          "# Claude Desktop — SAP Team Setup Checklist (Windows)\n\n## Install\n- [ ] Download from claude.ai/download (or company software portal)\n- [ ] Sign in with WORK account (SSO)\n- [ ] Update to latest version\n\n## Configure\n- [ ] Enable launch on login\n- [ ] Note/global keyboard shortcut configured\n- [ ] Pin to taskbar\n- [ ] Locate %APPDATA%\\Claude\\claude_desktop_config.json\n\n## Team standards\n- [ ] Create a shared Project with ABAP coding guidelines as knowledge\n- [ ] Agree on which data may be pasted (see Security lesson)\n- [ ] One chat per task convention\n\n## First-day prompts to try\n1. Explain this ABAP code line by line: <paste>\n2. Explain this ST22 dump and list likely root causes: <paste>\n3. Rewrite this SELECT for readability and performance: <paste>\n",
      },
      relatedSlugs: ["claude-web", "chat", "mcp-servers", "sap-gui"],
    },
    {
      slug: "claude-web",
      title: "Claude Web (claude.ai)",
      description:
        "Use Claude in the browser: chats, Projects with team knowledge, artifacts for larger outputs, and file uploads for specs and spreadsheets.",
      duration: 18,
      level: "Beginner",
      keywords: [
        "claude.ai",
        "browser",
        "projects",
        "artifacts",
        "file upload",
        "knowledge",
      ],
      overview: [
        "Claude Web at claude.ai is the zero-install way to use Claude — ideal when you are on a machine without the desktop app, or when you want features like Projects and artifacts in a familiar browser tab. Everything you learn here transfers 1:1 to the desktop app, which shares the same interface.",
        "For SAP teams, the standout feature is Projects: shared workspaces that hold custom instructions ('we are an SAP shop on S/4HANA 2023, namespace ZCC, follow clean ABAP') and knowledge files (coding guidelines, naming conventions, architecture decisions). Every conversation inside the project starts with that context pre-loaded.",
      ],
      objectives: [
        "Navigate claude.ai: chats, Projects, artifacts and file uploads.",
        "Create a Project with SAP-specific custom instructions and knowledge files.",
        "Upload documents (functional specs, ATC exports) and query them.",
        "Use artifacts to work with generated code and documents side by side.",
        "Decide when to use Web vs Desktop vs Claude Code.",
      ],
      steps: [
        {
          title: "Sign in and orient yourself",
          body: [
            "Open claude.ai in Edge or Chrome and sign in with your work account. The layout mirrors the desktop app: sidebar for chats and Projects, conversation in the center, model picker at the input box. Bookmark it and consider pinning the tab.",
          ],
        },
        {
          title: "Create an SAP project",
          body: [
            "Click Projects → New Project, name it e.g. 'ABAP Development — Team Phoenix'. Open the project settings and add custom instructions that describe your landscape and standards. From now on, every chat inside this project silently carries that context.",
          ],
          code: {
            language: "text",
            filename: "project-instructions.txt",
            code: "You assist SAP ABAP developers at a beverage bottling company.\n\nLandscape: S/4HANA 2023 on-premise, ECC 6.0 legacy during migration.\nNamespace: ZCC_* (classes ZCL_CC_*, interfaces ZIF_CC_*).\nStandards: Clean ABAP, ABAP 7.5+ syntax, no obsolete statements,\nevery SELECT must have explicit field list, authority checks mandatory\nfor user-facing reports.\n\nWhen generating code: include ABAP Doc comments and a short test plan.\nWhen unsure whether a function module/BAPI exists, say so explicitly.",
          },
        },
        {
          title: "Add knowledge files",
          body: [
            "Upload your team's coding guideline PDF, naming-convention sheet, or key architecture documents to the project knowledge. Claude consults them automatically. Keep the set small and current — a handful of authoritative documents beats fifty stale ones.",
          ],
          callout: {
            type: "warning",
            title: "Check before you upload",
            body: "Project knowledge is visible to everyone in the project. Upload standards and templates — never customer data, credentials or unreleased financials. The Security lesson covers the full rules.",
          },
        },
        {
          title: "Upload and query working documents",
          body: [
            "In any chat, attach files with the paperclip: a functional spec (DOCX/PDF), an ATC export (XLSX), a CSV of table contents. Then ask questions against them — 'summarize the gaps between this spec and the current ZCC_ORDER flow' or 'group these ATC findings by check and priority'.",
          ],
          code: {
            language: "text",
            filename: "spec-analysis-prompt.txt",
            code: "Attached is the functional spec for change request CR-2214 (PDF)\nand the current source of ZCL_CC_ORDER_PROCESSOR (txt).\n\n1. List the requirements from the spec as numbered items.\n2. For each, state whether the current class already covers it.\n3. Produce a gap list with an implementation outline per gap.",
          },
        },
        {
          title: "Work with artifacts",
          body: [
            "When Claude produces substantial output — a class, a CDS view, a document — it opens in an artifact panel beside the chat. You can ask for revisions and watch the artifact update in place, then copy the final version to your IDE. This beats scrolling through chat history for the latest code version.",
          ],
        },
      ],
      screenshots: [
        {
          caption: "A Project configured with SAP custom instructions",
          description:
            "claude.ai project settings showing custom instructions describing an S/4HANA landscape and ZCC namespace, with three knowledge files attached.",
        },
        {
          caption: "Artifact panel with a generated ABAP class",
          description:
            "A conversation on the left and an artifact panel on the right containing a complete ZCL_CC class, with the copy button highlighted.",
        },
      ],
      video: {
        caption: "Projects, uploads and artifacts on claude.ai",
        description:
          "Walkthrough: creating an SAP team project, writing custom instructions, uploading a coding guideline, analyzing an attached functional spec, and iterating on code in an artifact.",
        duration: "7:45",
      },
      sapExample: {
        title: "Turning a functional spec into a technical design",
        scenario:
          "A functional consultant delivers a 12-page spec for a new rebate settlement report. The developer uploads it to a project chat and asks Claude for a technical design aligned with team standards.",
        prompt:
          "Based on the attached spec (rebate settlement report, CR-2231):\n\n1. Propose the technical design: report vs. CDS + Fiori Elements.\n2. List required DDIC objects with suggested ZCC_* names.\n3. Draft the selection screen / filter parameters.\n4. Identify open questions for the functional consultant.\nKeep it within our project standards (S/4HANA 2023, Clean ABAP).",
        explanation: [
          "Because the chat runs inside the team project, Claude already knows the namespace, release and standards — the developer does not repeat them.",
          "The output (design, object list, open questions) becomes the skeleton of the technical spec document, cutting hours from the design phase. The developer still validates each proposed object name and check against the real system.",
        ],
      },
      bestPractices: [
        "Create one project per team or product area, not per ticket — projects are for durable context.",
        "Keep custom instructions short, specific and current; review them each release.",
        "Upload authoritative documents only, and replace them when standards change.",
        "Use artifacts for anything longer than a few lines — iterate there instead of re-pasting code.",
        "Name chats after tickets (CR-2231 design) to build a searchable history.",
        "Prefer the same work account across Web and Desktop so chats stay in sync.",
      ],
      commonMistakes: [
        {
          mistake: "Re-typing the same context ('we use S/4HANA, namespace ZCC...') in every chat.",
          fix: "Put durable context into project custom instructions once — every project chat inherits it.",
        },
        {
          mistake: "Uploading an entire document archive as project knowledge.",
          fix: "Curate 3–7 authoritative files. Too much low-quality knowledge dilutes retrieval and answers.",
        },
        {
          mistake: "Copying intermediate code versions from chat history and losing track of the latest.",
          fix: "Iterate inside the artifact and copy only the final state to your IDE.",
        },
        {
          mistake: "Using a private browser profile where you're signed into a personal account.",
          fix: "Keep a dedicated work browser profile signed into your corporate Claude account.",
        },
      ],
      tips: [
        "Ctrl+Shift+V pastes without formatting — useful when copying from Word specs into the chat.",
        "Drag-and-drop files straight onto the chat instead of hunting for the paperclip.",
        "Edge's vertical tabs + a pinned claude.ai tab keeps Claude one click away all day.",
        "You can share a project with a new team member — instant onboarding to your standards.",
      ],
      exercise: {
        title: "Build your team project",
        scenario:
          "Set up a project that your whole team could adopt tomorrow.",
        tasks: [
          "Create a project named after your team.",
          "Write custom instructions covering: release, namespace, top 5 coding rules.",
          "Upload one guideline document as knowledge.",
          "Start a chat: ask Claude to generate a class skeleton and verify it follows your instructions.",
          "Ask for one revision inside the artifact and copy the final code.",
        ],
        hint: "If the generated code ignores one of your rules, tighten the wording of the custom instructions — concrete rules ('every SELECT needs an explicit field list') beat vague ones ('write good code').",
        solution: {
          language: "text",
          filename: "sample-instructions.txt",
          code: "Team: SAP Development — <your team>\nSystem: S/4HANA 2023, ABAP 7.5+\nNamespace: ZCC_* (ZCL_CC_/ZIF_CC_/ZCX_CC_)\nRules:\n1. Clean ABAP; no obsolete statements (no OCCURS, no header lines)\n2. SELECT: explicit field list, no SELECT *\n3. AUTHORITY-CHECK in every user-facing report\n4. All texts via message classes, never hardcoded\n5. New code = class-based; include ABAP Doc + ABAP Unit test stub",
        },
      },
      quiz: [
        {
          question: "What is the main purpose of a Project on claude.ai?",
          options: [
            "It gives access to bigger models",
            "It provides durable shared context: custom instructions and knowledge files for every chat inside it",
            "It is required to upload any file",
            "It bypasses usage limits",
          ],
          correctIndex: 1,
          explanation:
            "Projects carry custom instructions and curated knowledge, so every conversation starts pre-loaded with your team's context.",
        },
        {
          question: "When does an artifact appear?",
          options: [
            "Only when you upload a file",
            "When Claude produces substantial standalone content like code or documents",
            "Only in the desktop app",
            "When the chat exceeds 100 messages",
          ],
          correctIndex: 1,
          explanation:
            "Artifacts open beside the chat for substantial outputs, letting you iterate and copy the final version cleanly.",
        },
        {
          question: "Which of these belongs in project knowledge?",
          options: [
            "The team's ABAP coding guideline",
            "A customer master data extract",
            "RFC destination passwords",
            "Last quarter's unreleased financials",
          ],
          correctIndex: 0,
          explanation:
            "Standards and templates: yes. Business data, credentials and confidential financials: never — see the Security Guidelines lesson.",
        },
      ],
      summary: [
        "Claude Web mirrors the desktop app and adds zero-install access from any browser.",
        "Projects with custom instructions and curated knowledge eliminate repetitive context-setting for SAP teams.",
        "Artifacts are the right place to iterate on generated ABAP before copying it to your IDE.",
      ],
      download: {
        name: "Project instructions template",
        description:
          "A fill-in-the-blanks template for SAP team project custom instructions.",
        filename: "sap-project-instructions-template.md",
        content:
          "# Claude Project Instructions — SAP Team Template\n\nYou assist SAP ABAP developers at <COMPANY>.\n\n## Landscape\n- System: <S/4HANA release / ECC 6.0 EhP x>\n- Databases: <HANA / other>\n- Namespace: <Z*/Y*/registered namespace>\n\n## Coding standards\n1. <e.g. Clean ABAP, 7.5+ syntax only>\n2. <e.g. explicit field lists in SELECT>\n3. <e.g. mandatory AUTHORITY-CHECK in reports>\n4. <e.g. message classes for all texts>\n5. <e.g. class-based development, ABAP Doc>\n\n## Output expectations\n- Include ABAP Doc comments\n- Include a short test plan / ABAP Unit stub\n- Flag any function module or BAPI you are not certain exists\n\n## Never\n- Suggest changes to SAP standard objects without noting the modification/enhancement implications\n- Assume production data access\n",
      },
      relatedSlugs: ["claude-desktop", "chat", "prompt-engineering", "code"],
    },
    {
      slug: "chat",
      title: "Chat Fundamentals",
      description:
        "Get reliably good answers from Claude: context, follow-ups, formatting, model choice and managing long conversations.",
      duration: 22,
      level: "Beginner",
      keywords: [
        "conversation",
        "context window",
        "follow-up",
        "model selection",
        "markdown",
        "attachments",
      ],
      overview: [
        "Chat is the core interaction model of Claude, and using it well is a skill. The difference between a mediocre and an excellent answer is usually not the model — it is the context you provide, the precision of your question, and how you steer with follow-ups.",
        "This lesson teaches the conversational mechanics every SAP developer needs daily: structuring a first message, iterating instead of restarting, understanding the context window, and knowing when a conversation has outlived its usefulness.",
      ],
      objectives: [
        "Structure a first message with role, context, task and desired output format.",
        "Steer conversations with targeted follow-ups instead of restarting.",
        "Explain what the context window is and how it affects long chats.",
        "Paste ABAP code and screenshots effectively.",
        "Recognize when to branch a new chat and how to carry context over.",
      ],
      steps: [
        {
          title: "Front-load context in your first message",
          body: [
            "Claude cannot see your system. Tell it what you are working with: release, the object type, and what you tried. Compare 'why doesn't my select work' with the structured version below — the second earns a specific, actionable answer on the first attempt.",
          ],
          code: {
            language: "text",
            filename: "good-first-message.txt",
            code: "Context: S/4HANA 2022, ABAP 7.5. Report ZCC_STOCK_AGING.\nProblem: This SELECT returns no rows although MARD has data\nfor plant 1100:\n\nSELECT matnr, werks, lgort, labst\n  FROM mard\n  WHERE werks = @lv_werks\n    AND labst > 0\n  INTO TABLE @DATA(lt_stock).\n\nlv_werks contains '1100 ' (with trailing spaces from a file upload).\nQuestion: why no rows, and what's the robust fix?",
          },
        },
        {
          title: "Iterate with follow-ups",
          body: [
            "Claude remembers the whole conversation. Instead of writing a new mega-prompt, refine: 'now add error handling', 'make it a method instead', 'explain line 12'. Short, directed follow-ups are the fastest way to converge on what you need.",
          ],
        },
        {
          title: "Ask for the format you want",
          body: [
            "Specify output shape explicitly: 'as a table', 'as a numbered checklist', 'code only, no explanation', 'max 5 bullet points'. For code reviews, ask for findings as a table of severity / line / issue / suggestion — instantly pasteable into a ticket.",
          ],
          code: {
            language: "text",
            filename: "format-control.txt",
            code: "Review this method. Output ONLY a markdown table with columns:\nSeverity (High/Med/Low) | Line | Issue | Suggested fix.\nNo prose before or after the table.",
          },
        },
        {
          title: "Understand the context window",
          body: [
            "Everything in the conversation — your messages, Claude's replies, attached files — occupies the context window. It is large (hundreds of pages), but not infinite. In very long chats, early details fade in relevance and responses may slow down. That is the signal to start fresh.",
          ],
          callout: {
            type: "tip",
            title: "Branching a new chat",
            body: "Ask Claude: 'Summarize this conversation as context I can paste into a new chat.' Paste that summary into the fresh conversation and continue with a clean, fast context.",
          },
        },
        {
          title: "Use images and screenshots",
          body: [
            "Claude reads screenshots. Win+Shift+S a SAP GUI screen, an ST22 dump, a debugger state or a Fiori error popup, paste it with Ctrl+V and ask. This is often faster than transcribing, and it preserves details you might not think to mention.",
          ],
        },
      ],
      screenshots: [
        {
          caption: "A well-structured first message with code block",
          description:
            "A chat showing a message with context header, fenced ABAP code and a precise question, followed by Claude's specific answer.",
        },
        {
          caption: "Follow-up refinement sequence",
          description:
            "Three consecutive short follow-ups ('add error handling', 'as a method', 'add ABAP Doc') progressively improving a generated code block.",
        },
      ],
      video: {
        caption: "Chat mechanics: context, follow-ups and formatting",
        description:
          "Live session comparing a vague prompt with a structured one, steering with follow-ups, controlling output format, and branching a long conversation into a fresh chat with a summary.",
        duration: "8:20",
      },
      sapExample: {
        title: "Debugging a data inconsistency conversationally",
        scenario:
          "Deliveries for one plant intermittently miss batch numbers. The developer investigates with Claude across a multi-turn conversation instead of one giant question.",
        prompt:
          "Turn 1: Context: S/4HANA, custom badi implementation ZCC_BATCH_DETERM in LE delivery creation. Symptom: ~2% of deliveries for plant 1100 have empty CHARG. Here's the BAdI method: <code>. What failure modes would you investigate first?\n\nTurn 2: Option 2 fits — the lookup table read. Here's ZCC_BATCH_MAP and the read: <code>. Spot the race condition?\n\nTurn 3: Write the corrected read with a fallback and an application-log entry, Clean ABAP style.",
        explanation: [
          "Each turn narrows the hypothesis space, exactly like pairing with a senior colleague. The developer feeds new evidence as it is gathered.",
          "The final code arrives already shaped by the constraints established earlier in the conversation — no need to restate them.",
        ],
      },
      bestPractices: [
        "One task per conversation; name the chat after the task.",
        "Give context before the question: release, object, what you tried, what happened.",
        "Paste real code and real error messages instead of paraphrasing them.",
        "Steer with short follow-ups; you rarely need to restart.",
        "Explicitly request output format (table, checklist, code-only).",
        "Verify anything system-specific (does that BAPI exist? that customizing path?) in your actual system.",
      ],
      commonMistakes: [
        {
          mistake: "Asking vague questions like 'why is my report slow?' with no code or metrics.",
          fix: "Include the code, table sizes, and where time is spent (ST05/SAT observations). Specific input → specific output.",
        },
        {
          mistake: "Restating the entire problem in every message.",
          fix: "Claude retains the conversation. Reference earlier turns ('the second option you suggested') and keep follow-ups short.",
        },
        {
          mistake: "Accepting a confident answer about your system's configuration as fact.",
          fix: "Claude doesn't see your system. Treat system-specific claims as hypotheses to verify in SPRO/SE11/SE37.",
        },
        {
          mistake: "Continuing a degraded 200-message conversation out of inertia.",
          fix: "Ask for a context summary, start a new chat with it, and enjoy the speed and focus again.",
        },
      ],
      tips: [
        "Press Shift+Enter for a newline inside your message; Enter sends.",
        "Paste ABAP inside triple backticks to keep formatting and get syntax-aware treatment.",
        "Ask 'what additional information would help you answer better?' when stuck — Claude will tell you what to fetch from the system.",
        "Ask for two alternative solutions with trade-offs when the design choice matters.",
      ],
      exercise: {
        title: "The conversation drill",
        scenario:
          "Practice multi-turn refinement on a realistic task: a legacy include with 300 lines of procedural pricing logic needs to become a testable class.",
        tasks: [
          "Turn 1: paste (or imagine) the include and ask for a refactoring strategy — not code yet.",
          "Turn 2: pick one proposed step and ask for the class skeleton only.",
          "Turn 3: ask for one method's implementation with ABAP Doc.",
          "Turn 4: ask for an ABAP Unit test for that method.",
          "Turn 5: ask for a one-paragraph summary you could paste into the ticket.",
        ],
        hint: "Resist the urge to ask for everything at once. The staged approach produces reviewable, correct pieces — and mirrors how you'd actually commit the work.",
        solution: {
          language: "text",
          filename: "drill-prompts.txt",
          code: "1. Here's a 300-line pricing include (ZCC_PRICING_F01). Propose a\n   refactoring strategy to a testable class. Strategy only, no code.\n2. Generate ONLY the class definition for step 1 (ZCL_CC_PRICING_ENGINE):\n   public interface, private attributes. No implementations.\n3. Implement method CALCULATE_BASE_PRICE with ABAP Doc. Assume the\n   customizing read is injected via ZIF_CC_PRICING_CONFIG.\n4. Write an ABAP Unit test class for CALCULATE_BASE_PRICE with a\n   test double for ZIF_CC_PRICING_CONFIG. Cover the zero-quantity edge case.\n5. Summarize this refactoring in 4 sentences for ticket CR-1888.",
        },
      },
      quiz: [
        {
          question: "What's the biggest lever for answer quality in chat?",
          options: [
            "Using polite language",
            "The context and specificity you provide",
            "Asking multiple questions at once",
            "Using ALL CAPS for important words",
          ],
          correctIndex: 1,
          explanation:
            "Context (system, code, error, what you tried) plus a precise question determines answer quality far more than any phrasing trick.",
        },
        {
          question: "Your 150-message chat is getting slow and unfocused. Best move?",
          options: [
            "Keep going — restarting loses everything",
            "Ask for a context summary and start a fresh chat with it",
            "Delete old messages one by one",
            "Switch to a smaller model",
          ],
          correctIndex: 1,
          explanation:
            "A summary hand-off gives you a clean context window while preserving the essential state of the investigation.",
        },
        {
          question: "Claude states that transaction ZMM_CUSTOM exists in your system. What should you do?",
          options: [
            "Trust it — Claude has SAP access",
            "Verify it yourself; Claude cannot see your system and may be pattern-matching",
            "Ask Claude to double-check",
            "Report it as a bug",
          ],
          correctIndex: 1,
          explanation:
            "Claude has no connection to your system (until you wire one up via MCP). System-specific facts must be verified — especially custom objects.",
        },
      ],
      summary: [
        "Front-load context, ask precisely, then steer with short follow-ups.",
        "Control the output format explicitly — tables and checklists paste straight into tickets.",
        "Long chats degrade; branch with a summary. Verify system-specific claims in the system.",
      ],
      download: {
        name: "Chat starter templates",
        description:
          "Copy-paste first-message templates for the most common SAP chat tasks.",
        filename: "sap-chat-starter-templates.md",
        content:
          "# SAP Chat Starter Templates\n\n## Explain code\nContext: <release>, object <name>.\nExplain this code line by line, then summarize its business purpose:\n```abap\n<code>\n```\n\n## Debug an error\nContext: <release>. Error/dump: <message or ST22 category>.\nCode at the failure point:\n```abap\n<code>\n```\nWhat are the most likely root causes, ranked? What should I check first?\n\n## Refactor\nContext: <release>, Clean ABAP standards.\nRefactor for readability and testability. Keep behavior identical.\nOutput the refactored code, then a bullet list of what changed.\n```abap\n<code>\n```\n\n## Review\nReview this code. Output a markdown table: Severity | Line | Issue | Fix.\n```abap\n<code>\n```\n\n## Test generation\nGenerate an ABAP Unit test class for this method. Cover: <edge cases>.\nUse test doubles for dependencies.\n```abap\n<code>\n```\n",
      },
      relatedSlugs: ["prompt-engineering", "claude-web", "claude-desktop"],
    },
    {
      slug: "claude-code",
      title: "Claude Code on Windows",
      description:
        "Install and run Claude Code — the agentic coding tool — on Windows, and point it at abapGit repositories for multi-file SAP work.",
      duration: 30,
      level: "Intermediate",
      keywords: [
        "claude code",
        "cli",
        "terminal",
        "agentic",
        "abapgit",
        "installation",
        "powershell",
      ],
      overview: [
        "Claude Code is Anthropic's agentic coding tool. Unlike chat, where you paste snippets, Claude Code works inside a project directory: it reads files, searches the codebase, edits multiple files, runs commands and iterates — asking permission along the way. It runs in a terminal (PowerShell, Windows Terminal) and as a VS Code extension.",
        "ABAP lives in the SAP system, not in files — so the bridge is abapGit: serialize your packages to a git repository, work on them with Claude Code at scale (mass refactorings, ATC remediation, documentation), and bring changes back through your normal transport process. This lesson gets Claude Code running on Windows and walks that loop.",
      ],
      objectives: [
        "Install Claude Code on Windows and authenticate.",
        "Understand the agentic loop: read → plan → edit → verify, with permissions.",
        "Run core workflows: explain a codebase, targeted edits, multi-file changes.",
        "Set up a CLAUDE.md with ABAP-specific project instructions.",
        "Connect the abapGit round-trip: system → git → Claude Code → system.",
      ],
      steps: [
        {
          title: "Install Claude Code",
          body: [
            "Claude Code supports Windows natively. Install it in PowerShell, then verify. If your machine routes traffic through a corporate proxy, set HTTPS_PROXY first (ask IT for the value).",
          ],
          code: {
            language: "powershell",
            filename: "PowerShell",
            code: "# Native installer (PowerShell)\nirm https://claude.ai/install.ps1 | iex\n\n# Or via npm if you have Node.js 18+\nnpm install -g @anthropic-ai/claude-code\n\n# Verify\nclaude --version",
          },
        },
        {
          title: "Authenticate and start your first session",
          body: [
            "In a project folder, run 'claude'. On first start it opens a browser to sign in with your work account. You land in an interactive session: type instructions in plain language; Claude proposes actions and asks before editing files or running commands.",
          ],
          code: {
            language: "powershell",
            filename: "PowerShell",
            code: "cd C:\\dev\\zcc_sd_pricing   # an abapGit-serialized package\nclaude\n\n# First things to try inside the session:\n# > give me an overview of this codebase\n# > which classes handle condition record lookups?",
          },
        },
        {
          title: "Understand the permission model",
          body: [
            "Claude Code shows you every proposed file edit as a diff and every command before running it. You approve once, per session, or configure allowed actions. Start conservative: review each diff like a pull request. Speed comes later; trust is earned per project.",
          ],
          callout: {
            type: "warning",
            title: "Agent ≠ autopilot",
            body: "Never point an agentic tool at anything production-connected. Claude Code works on files in a git repo — keep it that way. Changes reach SAP only via abapGit pull + your transport and review process.",
          },
        },
        {
          title: "Create a CLAUDE.md for ABAP projects",
          body: [
            "CLAUDE.md in the repo root is loaded automatically every session — it is your project briefing. Encode the things Claude cannot guess: your system context, conventions and verification steps.",
          ],
          code: {
            language: "markdown",
            filename: "CLAUDE.md",
            code: "# ZCC SD Pricing — abapGit repo\n\nSerialized from S/4HANA 2023 DEV (client 100) via abapGit.\nABAP 7.5+ syntax. Clean ABAP. Namespace ZCC_*.\n\n## Rules\n- .abap files use abapGit layout; do not rename files\n- No obsolete statements (OCCURS, header lines, SELECT *)\n- Every new method needs ABAP Doc + an ABAP Unit test\n- Texts via message class ZCC_SD, never literals\n\n## Verification\n- There is no local compiler: syntax is verified on pull into the\n  SAP system. Flag any statement you are unsure about.",
          },
        },
        {
          title: "The abapGit round-trip",
          body: [
            "Serialize the package with abapGit into a git repository (see the Eclipse ADT and GitHub lessons for setup). Clone it locally, let Claude Code do the heavy lifting — e.g. 'replace all SELECT * in this package with explicit field lists and add ORDER BY where results feed READ TABLE BINARY SEARCH' — review the diffs, commit, then pull into the dev system with abapGit and run ATC.",
          ],
          code: {
            language: "text",
            filename: "example-instruction.txt",
            code: "Across this repo:\n1. Find every SELECT * — list file, line and target structure first.\n2. For each, replace with an explicit field list based on the fields\n   actually used downstream.\n3. Where results are read with BINARY SEARCH, ensure matching SORT\n   or ORDER BY.\nShow me the full diff before applying. Do not touch generated files\n(*.xml).",
          },
        },
        {
          title: "Use slash commands to steer the session",
          body: [
            "Inside a session, slash commands control the tool itself: /help lists them, /clear resets context between tasks, /compact summarizes and frees context, /model switches models, /review reviews changes. The Claude Commands lesson covers the full vocabulary.",
          ],
        },
      ],
      screenshots: [
        {
          caption: "Claude Code session in Windows Terminal",
          description:
            "A PowerShell window running Claude Code inside an abapGit repo, showing a proposed multi-file diff awaiting approval.",
        },
        {
          caption: "CLAUDE.md briefing file in the repo root",
          description:
            "VS Code showing the abapGit repo structure with CLAUDE.md open, containing ABAP conventions and verification notes.",
        },
      ],
      video: {
        caption: "Claude Code + abapGit: a full round-trip",
        description:
          "End-to-end demo: serializing a package with abapGit, cloning it on Windows, running Claude Code for a mass SELECT * cleanup, reviewing diffs, committing, pulling into the dev system and re-running ATC.",
        duration: "11:40",
      },
      sapExample: {
        title: "Package-wide obsolete-statement cleanup before an upgrade",
        scenario:
          "Before an S/4HANA upgrade, package ZCC_LE (48 objects) still contains header-line internal tables and OCCURS declarations flagged by ATC. Fixing them by hand is a week of tedium; with Claude Code on the abapGit repo it is an afternoon including review.",
        prompt:
          "This repo contains abapGit-serialized ABAP (package ZCC_LE).\nTask: eliminate obsolete constructs, lowest-risk first.\n1. Inventory: list every OCCURS, header-line table (DATA ... WITH HEADER LINE), and TABLES statement with file/line.\n2. Group by refactoring pattern and risk (mechanical vs. behavior-relevant).\n3. Apply the mechanical group across all files; show consolidated diff.\n4. For the risky group, propose fixes one object at a time and wait for my approval.",
        explanation: [
          "The inventory-first approach makes the agent's plan reviewable before any edit happens — the same discipline you would demand from a junior developer.",
          "Splitting mechanical from behavior-relevant changes keeps the review effort proportional to risk. After the pull into DEV, ATC and the existing ABAP Unit suite confirm the result, and the change travels in a normal transport.",
        ],
      },
      bestPractices: [
        "Always work on a branch; commit before letting Claude Code make large changes so rollback is trivial.",
        "Write and maintain CLAUDE.md — it is the single highest-leverage file in the repo.",
        "Ask for an inventory/plan before mass edits; approve the plan, then the diffs.",
        "Keep tasks scoped: one package, one refactoring pattern per session; use /clear between tasks.",
        "Verify in the SAP system after every pull: syntax check, ATC, unit tests — Claude cannot compile ABAP locally.",
        "Never store SAP credentials in the repo; abapGit connection settings stay in the system.",
      ],
      commonMistakes: [
        {
          mistake: "Expecting Claude Code to talk to the SAP system directly out of the box.",
          fix: "Claude Code edits files. The SAP connection is your job: abapGit for the code round-trip, or an ABAP MCP server (Module 5) for direct reads.",
        },
        {
          mistake: "Letting the agent run a huge refactoring with auto-approve on the first day.",
          fix: "Review every diff until you've calibrated trust for this codebase. Auto-approve is for mature, well-tested workflows.",
        },
        {
          mistake: "Renaming abapGit files or breaking its folder layout during refactoring.",
          fix: "Tell Claude (in CLAUDE.md) that file names and *.xml metadata are abapGit-managed and off-limits.",
        },
        {
          mistake: "Running Claude Code in an ancient cmd.exe window and fighting rendering issues.",
          fix: "Use Windows Terminal with PowerShell 7 — better Unicode, colors and copy/paste.",
        },
        {
          mistake: "One endless session for five unrelated tasks.",
          fix: "/clear between tasks. Fresh context = sharper, cheaper, faster.",
        },
      ],
      tips: [
        "Shift+Tab cycles permission modes (including plan mode — Claude plans without editing until you approve).",
        "Press Esc to interrupt Claude mid-action if it heads the wrong way; your files are untouched until diffs are approved.",
        "Add 'think hard' to complex refactoring requests for deeper planning before action.",
        "git diff after a session is your friend — review Claude's work exactly like a colleague's PR.",
        "The VS Code extension shows Claude Code's diffs in the editor's native diff viewer — great for ABAP file review.",
      ],
      exercise: {
        title: "First agentic session on an ABAP repo",
        scenario:
          "Use any abapGit-serialized package (or create a practice repo with two .abap files containing a report with SELECT * and a class without ABAP Doc).",
        tasks: [
          "Install Claude Code and verify with claude --version.",
          "Create CLAUDE.md from the template in this lesson, adapted to your conventions.",
          "Start a session and ask for a codebase overview.",
          "Instruct: 'Replace SELECT * with explicit field lists; show the diff first.' Review and approve.",
          "Commit, and (if you have a sandbox) pull via abapGit and run a syntax check + ATC.",
        ],
        hint: "No SAP sandbox handy? The exercise still works: any folder of .abap text files teaches you the agentic loop. The abapGit pull step can wait until Module 5.",
        solution: {
          language: "powershell",
          filename: "session-transcript.ps1",
          code: "cd C:\\dev\\practice-abap\ngit init; git add .; git commit -m \"baseline\"\nclaude\n# > give me an overview of this codebase\n# > replace all SELECT * with explicit field lists based on used fields;\n#   show me the diff before applying\n# (review diff, approve)\n# > /review\n# exit, then:\ngit diff HEAD~1   # inspect what changed",
        },
      },
      quiz: [
        {
          question: "What fundamentally distinguishes Claude Code from chat?",
          options: [
            "It uses a different AI model",
            "It operates agentically on a project directory: reading, searching, editing files and running commands with permission",
            "It only works with Python",
            "It requires no authentication",
          ],
          correctIndex: 1,
          explanation:
            "Same models — different interaction: Claude Code executes multi-step work directly in your codebase under a permission model.",
        },
        {
          question: "How does ABAP code get into a form Claude Code can work on?",
          options: [
            "Claude Code logs into SAP GUI",
            "Via abapGit serialization of packages into a git repository",
            "By exporting transports as ZIP files",
            "It cannot work with ABAP at all",
          ],
          correctIndex: 1,
          explanation:
            "abapGit turns packages into files in git. Claude Code works on the files; changes return to SAP via abapGit pull and normal transports.",
        },
        {
          question: "What is CLAUDE.md for?",
          options: [
            "License information",
            "A per-repo briefing automatically loaded each session: conventions, constraints, verification steps",
            "Claude's chat history",
            "A list of files Claude may not read",
          ],
          correctIndex: 1,
          explanation:
            "CLAUDE.md is standing instructions for the repo — the agent equivalent of project custom instructions.",
        },
        {
          question: "Why must changes still be verified inside the SAP system?",
          options: [
            "Because git might corrupt files",
            "Claude Code cannot compile ABAP or run ATC locally — syntax check, ATC and unit tests happen after the abapGit pull",
            "Because abapGit re-formats all code",
            "No verification is needed if diffs were reviewed",
          ],
          correctIndex: 1,
          explanation:
            "There is no local ABAP toolchain. The system remains the source of truth for syntax, ATC and tests — always verify after pull.",
        },
      ],
      summary: [
        "Claude Code is an agentic tool that works on files with your permission — terminal or VS Code, natively on Windows.",
        "abapGit is the bridge: system → git → Claude Code → git → system, with transports and ATC unchanged.",
        "CLAUDE.md, scoped sessions, plan-first mass edits and diff review are the habits that make it safe and fast.",
      ],
      download: {
        name: "CLAUDE.md ABAP template",
        description:
          "A ready-to-adapt CLAUDE.md for abapGit repositories, plus a session checklist.",
        filename: "claude-md-abap-template.md",
        content:
          "# CLAUDE.md Template for abapGit Repositories\n\n```markdown\n# <Package> — abapGit repo\n\nSerialized from <system/release> via abapGit.\nABAP <version>+ syntax. <Standards, e.g. Clean ABAP>. Namespace <Z...>.\n\n## Rules\n- abapGit layout: never rename files or touch *.xml metadata\n- <obsolete statements policy>\n- <SELECT policy>\n- <test policy>\n- <message class policy>\n\n## Verification\n- No local compiler: syntax/ATC/tests run in the SAP system after pull\n- Flag any statement you are unsure exists in this release\n```\n\n## Session checklist\n- [ ] On a branch, committed baseline\n- [ ] Task scoped (one pattern / one package)\n- [ ] Inventory & plan requested before mass edits\n- [ ] Diffs reviewed like a PR\n- [ ] After pull: syntax check, ATC, ABAP Unit\n",
      },
      relatedSlugs: ["claude-commands", "github-integration", "vscode-integration", "sap-abap-mcp-server"],
    },
    {
      slug: "claude-commands",
      title: "Claude Commands & Shortcuts",
      description:
        "Master the slash commands, keyboard shortcuts and CLI flags that make Claude Code and the Claude apps fast in daily use.",
      duration: 18,
      level: "Beginner",
      keywords: [
        "slash commands",
        "shortcuts",
        "cli",
        "/clear",
        "/compact",
        "custom commands",
        "hotkeys",
      ],
      overview: [
        "Every serious tool has a command vocabulary, and fluency in it separates occasional users from power users. Claude Code exposes slash commands for session control (/clear, /compact, /model, /review), supports custom commands you define per project, and the desktop/web apps have their own shortcut set.",
        "This lesson is a guided tour of the commands you will actually use daily as an SAP developer, plus how to build custom slash commands that encode your team's repetitive workflows — like an ATC-fix routine or a transport documentation template.",
      ],
      objectives: [
        "Use the essential Claude Code slash commands: /help, /clear, /compact, /model, /review, /init.",
        "Control sessions from the command line with flags and one-shot prompts.",
        "Create a custom slash command in .claude/commands for a recurring SAP task.",
        "Apply the key keyboard shortcuts in Claude Desktop and Claude Code.",
        "Decide when /clear vs /compact is the right context move.",
      ],
      steps: [
        {
          title: "The survival kit: /help, /clear, /compact",
          body: [
            "/help lists all commands. /clear wipes the conversation context — use it between unrelated tasks. /compact summarizes the conversation and continues with the summary, freeing context while keeping the thread — use it mid-task when a long session gets sluggish.",
          ],
          code: {
            language: "text",
            filename: "session-hygiene.txt",
            code: "# Finished the SELECT * cleanup, next task is unrelated docs:\n/clear\n\n# Deep in a long refactoring, context filling up, want to continue:\n/compact\n\n# See everything available:\n/help",
          },
        },
        {
          title: "Session setup: /init, /model, /review",
          body: [
            "/init analyzes a repo and generates a starter CLAUDE.md — run it once in every new abapGit repo, then edit the result. /model switches the model mid-session (bigger model for a gnarly refactoring plan, faster one for mechanical edits). /review asks Claude to review recent changes before you commit.",
          ],
        },
        {
          title: "One-shot mode and CLI flags",
          body: [
            "You can run Claude Code non-interactively — useful for scripted checks. The -p flag sends a single prompt and prints the result; combine with git and PowerShell for quick pipelines.",
          ],
          code: {
            language: "powershell",
            filename: "PowerShell",
            code: "# One-shot: summarize uncommitted changes\nclaude -p \"Summarize the changes in git diff for a transport text\"\n\n# Continue the most recent session\nclaude --continue\n\n# Pick an older session to resume\nclaude --resume",
          },
        },
        {
          title: "Custom slash commands for SAP routines",
          body: [
            "Any markdown file in .claude/commands/ becomes a slash command. The file content is the prompt; $ARGUMENTS is replaced by what you type after the command. Encode your team's routines once, use them forever — and commit them so the whole team gets them via git.",
          ],
          code: {
            language: "markdown",
            filename: ".claude/commands/atc-fix.md",
            code: "Fix the following ATC finding in this repository: $ARGUMENTS\n\nProcedure:\n1. Locate the affected code and show it to me.\n2. Explain the finding and the SAP-recommended remediation.\n3. Propose the fix as a diff — Clean ABAP, no behavior change.\n4. If a pseudo-comment/pragma exemption would be more appropriate\n   than a code change, say so and explain why.\n5. List what to re-test after the fix.",
          },
        },
        {
          title: "Keyboard shortcuts worth learning",
          body: [
            "Claude Code: Shift+Tab cycles permission/plan modes, Esc interrupts, Ctrl+C exits. Desktop app: the global summon shortcut, Ctrl+K for search in supported views, Shift+Enter for newlines. Windows side: Win+Shift+S (snip), Win+V (clipboard history), Win+Left/Right (snap) — the trio that makes side-by-side SAP work smooth.",
          ],
          callout: {
            type: "tip",
            title: "Muscle memory beats menus",
            body: "Pick three shortcuts and force yourself to use them for a week: the global summon key, /clear, and Win+Shift+S. They cover 80% of daily friction.",
          },
        },
      ],
      screenshots: [
        {
          caption: "Slash command autocomplete in Claude Code",
          description:
            "A Claude Code session showing the command palette after typing '/', with /clear, /compact, /model, /review and a custom /atc-fix visible.",
        },
        {
          caption: "Custom command file in .claude/commands",
          description:
            "VS Code showing the .claude/commands folder of an abapGit repo with atc-fix.md and transport-doc.md files.",
        },
      ],
      video: {
        caption: "Command fluency in 10 minutes",
        description:
          "Rapid-fire demo of every essential slash command, one-shot CLI usage from PowerShell, and building a custom /transport-doc command for change documentation.",
        duration: "9:50",
      },
      sapExample: {
        title: "A /transport-doc command for change documentation",
        scenario:
          "Every transport at the company needs a change document: purpose, objects, risk, test evidence. Developers hate writing them; reviewers hate inconsistent ones. A shared custom command standardizes the chore.",
        prompt: "/transport-doc CR-2244 fix batch determination race condition",
        code: {
          language: "markdown",
          filename: ".claude/commands/transport-doc.md",
          code: "Create a transport change document for: $ARGUMENTS\n\nUse git diff against main to determine actual changes.\nOutput markdown with exactly these sections:\n## Purpose (2-3 sentences, business language)\n## Changed objects (table: Object | Type | Change summary)\n## Risk assessment (Low/Medium/High + justification)\n## Test evidence required (bullet list of concrete test cases)\n## Rollback plan (1-2 sentences)\nKeep it under 300 words. German and English section headers.",
        },
        explanation: [
          "The command reads the actual git diff, so the object list is real rather than hand-typed from memory.",
          "Because the command file is committed to the repo, every developer produces identically structured documents — the reviewer's parsing effort drops to zero.",
        ],
      },
      bestPractices: [
        "Run /init in every new repo, then curate the generated CLAUDE.md by hand.",
        "/clear between unrelated tasks; /compact only when you need continuity.",
        "Commit .claude/commands to git — team-shared commands are a force multiplier.",
        "Name custom commands by outcome (/atc-fix, /transport-doc), not by tool trivia.",
        "Keep custom command prompts explicit about output format — that's what makes them consistent.",
        "Review /help occasionally after updates; new commands ship regularly.",
      ],
      commonMistakes: [
        {
          mistake: "Never clearing context and wondering why afternoon sessions feel dumb and slow.",
          fix: "/clear is free. Use it at every task boundary.",
        },
        {
          mistake: "Using /compact when the next task is unrelated to the current one.",
          fix: "/compact preserves a summary of the old task — pointless baggage for a new topic. That's /clear's job.",
        },
        {
          mistake: "Rebuilding the same elaborate prompt every week instead of saving it.",
          fix: "If you've typed a prompt twice, it's a custom command. Two minutes of setup, saved forever.",
        },
        {
          mistake: "Hoarding personal commands locally while the team reinvents them individually.",
          fix: "Commands in .claude/commands are project files — commit and share them like code.",
        },
      ],
      tips: [
        "Type '/' and pause — the autocomplete menu doubles as a reminder of what exists.",
        "Custom commands can reference files: 'follow the checklist in docs/review-checklist.md'.",
        "claude -p works in CI pipelines too — e.g. a nightly job that drafts release notes from commits.",
        "Windows Terminal lets you set a profile that starts PowerShell directly in your repo folder — one click to a ready session.",
      ],
      exercise: {
        title: "Build your team's first two commands",
        scenario:
          "Codify two recurring routines from your real workday as custom slash commands in an abapGit repo.",
        tasks: [
          "Create .claude/commands/explain-object.md — takes an object name and produces a structured explanation (purpose, key methods, dependencies, risks).",
          "Create a second command for a routine you personally repeat (review prep, test plan, naming check).",
          "Test both with real arguments in a Claude Code session.",
          "Commit them and write a two-line announcement for your team chat.",
        ],
        hint: "Structure every command prompt as: task, procedure steps, exact output format. The output-format section is what makes results consistent across users.",
        solution: {
          language: "markdown",
          filename: ".claude/commands/explain-object.md",
          code: "Explain the ABAP object: $ARGUMENTS\n\n1. Locate its source in this repository.\n2. Output markdown with sections:\n## Purpose (business language, 3 sentences max)\n## Key methods/routines (table: Name | Responsibility)\n## Dependencies (objects it reads/calls)\n## Risk notes (anything fragile, missing tests, obsolete syntax)\nIf the object is not in this repo, say so and stop.",
        },
      },
      quiz: [
        {
          question: "When is /compact the right choice over /clear?",
          options: [
            "Never — they are identical",
            "When continuing the same long task and you need context freed but the thread preserved",
            "When starting a completely new task",
            "Only in the VS Code extension",
          ],
          correctIndex: 1,
          explanation:
            "/compact summarizes and continues; /clear starts empty. Same task → compact, new task → clear.",
        },
        {
          question: "How do you create a custom slash command?",
          options: [
            "Email a request to Anthropic",
            "Put a markdown file in .claude/commands/ — its content becomes the prompt, $ARGUMENTS the parameter",
            "Recompile Claude Code",
            "Custom commands require an enterprise license",
          ],
          correctIndex: 1,
          explanation:
            "A markdown file per command; the filename becomes the command name. Commit the folder to share with the team.",
        },
        {
          question: "What does claude -p \"...\" do?",
          options: [
            "Opens a persistent chat window",
            "Runs one prompt non-interactively and prints the result — scriptable from PowerShell/CI",
            "Prints the changelog",
            "Enables plan mode permanently",
          ],
          correctIndex: 1,
          explanation:
            "One-shot mode makes Claude Code scriptable: pipelines, scheduled jobs, quick git-diff summaries.",
        },
      ],
      summary: [
        "Session hygiene (/clear, /compact) and setup commands (/init, /model, /review) are daily essentials.",
        "Custom commands in .claude/commands turn team routines into one-liners — commit and share them.",
        "A handful of Windows + Claude shortcuts (summon key, Win+Shift+S, Win+V) removes most daily friction.",
      ],
      download: {
        name: "Command cheat sheet",
        description:
          "Printable one-pager: slash commands, CLI flags and Windows shortcuts for SAP developers.",
        filename: "claude-commands-cheatsheet.md",
        content:
          "# Claude Commands Cheat Sheet (SAP / Windows)\n\n## Claude Code slash commands\n| Command | Use |\n|---|---|\n| /help | List all commands |\n| /clear | Wipe context — new unrelated task |\n| /compact | Summarize & continue — same task, long session |\n| /init | Generate starter CLAUDE.md for a repo |\n| /model | Switch model mid-session |\n| /review | Review recent changes before commit |\n\n## CLI\n| Command | Use |\n|---|---|\n| claude | Interactive session |\n| claude -p \"prompt\" | One-shot, scriptable |\n| claude --continue | Resume last session |\n| claude --resume | Pick a session to resume |\n\n## Keys\n| Shortcut | Effect |\n|---|---|\n| Shift+Tab | Cycle permission/plan modes |\n| Esc | Interrupt current action |\n| Shift+Enter | Newline in message |\n\n## Windows companions\n| Shortcut | Effect |\n|---|---|\n| Win+Shift+S | Snip a SAP screen to paste into Claude |\n| Win+V | Clipboard history |\n| Win+Left/Right | Snap Claude beside SAP GUI |\n\n## Custom commands\nFile: .claude/commands/<name>.md → use as /<name> <args>\nPrompt receives your text via $ARGUMENTS. Commit to share.\n",
      },
      relatedSlugs: ["claude-code", "skills", "prompt-library"],
    },
  ],
};
