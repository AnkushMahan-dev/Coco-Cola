import type { ReactElement } from "react";

/**
 * Generated SVG illustrations for lesson "screenshots".
 * These are stylized UI mockups (not real product screenshots) that pick a
 * scene based on the screenshot's caption/description keywords, so lesson
 * data never has to reference a variant explicitly. Swap any frame for a
 * real PNG later by replacing ScreenshotFrame's body with an <img>.
 */

export type IllustrationVariant =
  | "chat"
  | "desktop"
  | "terminal"
  | "vscode"
  | "eclipse"
  | "sapgui"
  | "config"
  | "spreadsheet"
  | "browser";

export function inferVariant(text: string): IllustrationVariant {
  const t = text.toLowerCase();
  if (/(terminal|powershell|cli|claude code session|command palette|slash)/.test(t))
    return "terminal";
  if (/(vs code|vscode|visual studio code)/.test(t)) return "vscode";
  if (/(eclipse|adt|abap development tools)/.test(t)) return "eclipse";
  if (/(sap gui|se80|se38|st22|sm37|se16|st05|dump|logon pad)/.test(t))
    return "sapgui";
  if (/(excel|spreadsheet|xlsx|workbook|pivot)/.test(t)) return "spreadsheet";
  if (/(json|config|claude_desktop_config|\.mcp|settings file|claude\.md|commands folder|\.claude)/.test(t))
    return "config";
  if (/(chrome|browser|extension|fiori|web page|claude\.ai|artifact|project)/.test(t))
    return "browser";
  if (/(desktop app|system tray|installer|settings dialog|shortcut)/.test(t))
    return "desktop";
  return "chat";
}

/* ---- shared primitives (all colors via currentColor/theme vars) ---- */

const stroke = "hsl(var(--border))";
const soft = "hsl(var(--muted))";
const softFg = "hsl(var(--muted-foreground) / 0.45)";
const accent = "hsl(var(--primary))";
const accentSoft = "hsl(var(--primary) / 0.25)";
const card = "hsl(var(--card))";
const good = "hsl(var(--success) / 0.7)";

function WindowChrome({ title, width = 640 }: { title: string; width?: number }) {
  return (
    <>
      <rect x="0.5" y="0.5" width={width - 1} height="35" fill={soft} stroke={stroke} />
      <circle cx="18" cy="18" r="4.5" fill={softFg} />
      <circle cx="34" cy="18" r="4.5" fill={softFg} opacity="0.6" />
      <circle cx="50" cy="18" r="4.5" fill={softFg} opacity="0.35" />
      <text x={width / 2} y="22.5" textAnchor="middle" fontSize="11" fill={softFg} fontFamily="ui-sans-serif, system-ui">
        {title}
      </text>
    </>
  );
}

function Lines({
  x,
  y,
  widths,
  gap = 14,
  color = softFg,
  h = 6,
}: {
  x: number;
  y: number;
  widths: number[];
  gap?: number;
  color?: string;
  h?: number;
}) {
  return (
    <>
      {widths.map((w, i) => (
        <rect key={i} x={x} y={y + i * gap} width={w} height={h} rx={h / 2} fill={color} opacity={0.55} />
      ))}
    </>
  );
}

/* ---- scenes ---- */

function ChatScene() {
  return (
    <svg viewBox="0 0 640 360" role="presentation" className="h-full w-full">
      <rect width="640" height="360" fill={card} />
      <WindowChrome title="Claude — New chat" />
      {/* sidebar */}
      <rect x="0.5" y="36" width="150" height="323" fill={soft} stroke={stroke} />
      <rect x="14" y="52" width="122" height="24" rx="6" fill={accentSoft} />
      <Lines x={14} y={94} widths={[110, 96, 118, 88, 104]} gap={22} />
      {/* user bubble */}
      <rect x="330" y="60" width="280" height="58" rx="10" fill={accentSoft} />
      <Lines x={346} y={78} widths={[240, 180]} gap={16} color={accent} />
      {/* claude bubble with code */}
      <rect x="170" y="140" width="330" height="150" rx="10" fill={soft} />
      <Lines x={188} y={158} widths={[280, 250]} gap={15} />
      <rect x="188" y="196" width="294" height="74" rx="6" fill="hsl(240 6% 12%)" />
      <Lines x={202} y={210} widths={[180, 220, 140, 200]} gap={15} color="hsl(18 80% 65%)" h={5} />
      {/* input */}
      <rect x="170" y="312" width="440" height="34" rx="10" fill={card} stroke={stroke} />
      <rect x="184" y="325" width="150" height="7" rx="3.5" fill={softFg} opacity="0.4" />
      <circle cx="592" cy="329" r="11" fill={accent} />
    </svg>
  );
}

function DesktopScene() {
  return (
    <svg viewBox="0 0 640 360" role="presentation" className="h-full w-full">
      <rect width="640" height="360" fill={soft} />
      {/* desktop with app window + tray */}
      <rect x="70" y="40" width="500" height="250" rx="8" fill={card} stroke={stroke} />
      <WindowChrome title="" width={0} />
      <rect x="70" y="40" width="500" height="32" rx="8" fill={soft} stroke={stroke} />
      <circle cx="88" cy="56" r="4" fill={softFg} />
      <circle cx="102" cy="56" r="4" fill={softFg} opacity="0.6" />
      <text x="320" y="60" textAnchor="middle" fontSize="11" fill={softFg}>Claude Desktop — Settings</text>
      {/* settings list */}
      <Lines x={100} y={100} widths={[160, 140, 170, 150]} gap={34} />
      {/* toggles */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="470" y={92 + i * 34} width="44" height="18" rx="9" fill={i < 2 ? accent : softFg} opacity={i < 2 ? 1 : 0.35} />
          <circle cx={i < 2 ? 504 : 480} cy={101 + i * 34} r="7" fill={card} />
        </g>
      ))}
      <rect x="100" y="240" width="200" height="26" rx="6" fill={accentSoft} />
      <rect x="112" y="250" width="120" height="6" rx="3" fill={accent} />
      {/* taskbar */}
      <rect x="0" y="320" width="640" height="40" fill={card} stroke={stroke} />
      <rect x="270" y="332" width="16" height="16" rx="4" fill={softFg} opacity="0.5" />
      <rect x="298" y="332" width="16" height="16" rx="4" fill={accent} />
      <rect x="326" y="332" width="16" height="16" rx="4" fill={softFg} opacity="0.5" />
      <circle cx="600" cy="340" r="8" fill={accentSoft} stroke={accent} />
    </svg>
  );
}

function TerminalScene() {
  return (
    <svg viewBox="0 0 640 360" role="presentation" className="h-full w-full">
      <rect width="640" height="360" fill="hsl(240 8% 9%)" rx="0" />
      <rect x="0.5" y="0.5" width="639" height="35" fill="hsl(240 6% 14%)" stroke="hsl(240 6% 20%)" />
      <circle cx="18" cy="18" r="4.5" fill="hsl(0 60% 55%)" />
      <circle cx="34" cy="18" r="4.5" fill="hsl(45 80% 55%)" />
      <circle cx="50" cy="18" r="4.5" fill="hsl(140 50% 45%)" />
      <text x="320" y="22.5" textAnchor="middle" fontSize="11" fill="hsl(240 5% 60%)">Windows Terminal — claude</text>
      <text x="24" y="66" fontSize="12" fill="hsl(140 50% 55%)" fontFamily="Consolas, monospace">PS C:\dev\zcc_pricing&gt; claude</text>
      <Lines x={24} y={84} widths={[300, 420, 380, 240]} gap={18} color="hsl(240 5% 55%)" h={5} />
      {/* diff block */}
      <rect x="24" y="164" width="560" height="110" rx="6" fill="hsl(240 6% 13%)" />
      <rect x="36" y="178" width="240" height="6" rx="3" fill="hsl(240 5% 50%)" />
      <rect x="36" y="198" width="380" height="6" rx="3" fill="hsl(0 55% 55%)" opacity="0.8" />
      <rect x="36" y="216" width="360" height="6" rx="3" fill="hsl(140 45% 50%)" opacity="0.9" />
      <rect x="36" y="234" width="400" height="6" rx="3" fill="hsl(140 45% 50%)" opacity="0.9" />
      <rect x="36" y="252" width="200" height="6" rx="3" fill="hsl(240 5% 50%)" />
      <text x="24" y="308" fontSize="12" fill="hsl(18 80% 65%)" fontFamily="Consolas, monospace">? Apply this edit  ›  Yes / No / Always</text>
      <rect x="24" y="326" width="10" height="14" fill="hsl(18 80% 65%)">
        <animate attributeName="opacity" values="1;0;1" dur="1.4s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

function VsCodeScene() {
  return (
    <svg viewBox="0 0 640 360" role="presentation" className="h-full w-full">
      <rect width="640" height="360" fill={card} />
      <WindowChrome title="Visual Studio Code — zcc_le (abapGit)" />
      {/* activity bar */}
      <rect x="0.5" y="36" width="40" height="323" fill={soft} stroke={stroke} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="10" y={52 + i * 36} width="20" height="20" rx="5" fill={i === 3 ? accent : softFg} opacity={i === 3 ? 1 : 0.5} />
      ))}
      {/* explorer */}
      <rect x="40.5" y="36" width="140" height="323" fill={soft} opacity="0.6" stroke={stroke} />
      <Lines x={54} y={58} widths={[100, 112, 96, 108, 90, 104, 86]} gap={24} />
      {/* editor with code */}
      <Lines x={200} y={62} widths={[260, 330, 300, 220, 350, 280, 180, 320, 240]} gap={22} color={softFg} />
      <rect x="196" y="128" width="360" height="6" rx="3" fill={accentSoft} />
      {/* Claude panel */}
      <rect x="470.5" y="36" width="169" height="323" fill={card} stroke={stroke} />
      <rect x="484" y="52" width="80" height="8" rx="4" fill={accent} />
      <rect x="484" y="74" width="140" height="52" rx="8" fill={accentSoft} />
      <rect x="484" y="138" width="140" height="90" rx="8" fill={soft} />
      <Lines x={494} y={152} widths={[118, 100, 110, 90]} gap={17} />
      <rect x="484" y="316" width="140" height="26" rx="8" fill={card} stroke={stroke} />
    </svg>
  );
}

function EclipseScene() {
  return (
    <svg viewBox="0 0 640 360" role="presentation" className="h-full w-full">
      <rect width="640" height="360" fill={card} />
      <WindowChrome title="Eclipse — ABAP Development Tools (ADT)" />
      {/* toolbar */}
      <rect x="0.5" y="36" width="639" height="24" fill={soft} stroke={stroke} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={12 + i * 26} y="42" width="14" height="12" rx="3" fill={softFg} opacity="0.5" />
      ))}
      {/* project explorer */}
      <rect x="0.5" y="60" width="170" height="299" fill={soft} opacity="0.5" stroke={stroke} />
      <Lines x={14} y={80} widths={[130, 110, 140, 100, 124, 96]} gap={26} />
      <rect x="14" y="180" width="140" height="18" rx="4" fill={accentSoft} />
      {/* editor: ABAP */}
      <text x="190" y="86" fontSize="11" fill={accent} fontFamily="Consolas, monospace">CLASS zcl_cc_order DEFINITION.</text>
      <Lines x={206} y={100} widths={[240, 300, 200, 280, 180]} gap={20} />
      <text x="190" y="216" fontSize="11" fill={accent} fontFamily="Consolas, monospace">ENDCLASS.</text>
      {/* problems view */}
      <rect x="170.5" y="250" width="469" height="109" fill={soft} opacity="0.5" stroke={stroke} />
      <rect x="184" y="264" width="90" height="8" rx="4" fill={softFg} />
      <circle cx="192" cy="292" r="5" fill="hsl(45 85% 50%)" />
      <rect x="206" y="288" width="300" height="7" rx="3.5" fill={softFg} opacity="0.5" />
      <circle cx="192" cy="316" r="5" fill={good} />
      <rect x="206" y="312" width="260" height="7" rx="3.5" fill={softFg} opacity="0.5" />
    </svg>
  );
}

function SapGuiScene() {
  return (
    <svg viewBox="0 0 640 360" role="presentation" className="h-full w-full">
      <rect width="640" height="360" fill={card} />
      <WindowChrome title="SAP GUI — SE80 Object Navigator" />
      {/* SAP blue band */}
      <rect x="0.5" y="36" width="639" height="28" fill="hsl(213 70% 45%)" opacity="0.85" />
      <rect x="12" y="44" width="110" height="12" rx="3" fill="hsl(0 0% 100%)" opacity="0.85" />
      <rect x="140" y="44" width="60" height="12" rx="3" fill="hsl(0 0% 100%)" opacity="0.5" />
      {/* command field */}
      <rect x="12" y="72" width="150" height="20" rx="3" fill={card} stroke={stroke} />
      <text x="20" y="86" fontSize="11" fill={softFg} fontFamily="Consolas, monospace">/nSE80</text>
      {/* tree */}
      <rect x="0.5" y="100" width="200" height="259" fill={soft} opacity="0.5" stroke={stroke} />
      <Lines x={16} y={120} widths={[150, 130, 160, 120, 140, 110, 150]} gap={28} />
      {/* code pane */}
      <text x="220" y="128" fontSize="11" fill="hsl(213 70% 50%)" fontFamily="Consolas, monospace">REPORT zcc_stock_aging.</text>
      <Lines x={236} y={144} widths={[280, 340, 220, 300, 260, 180, 320]} gap={22} />
      {/* status bar */}
      <rect x="0.5" y="336" width="639" height="23" fill={soft} stroke={stroke} />
      <circle cx="16" cy="347" r="5" fill={good} />
      <rect x="30" y="343" width="180" height="8" rx="4" fill={softFg} opacity="0.5" />
    </svg>
  );
}

function ConfigScene() {
  return (
    <svg viewBox="0 0 640 360" role="presentation" className="h-full w-full">
      <rect width="640" height="360" fill="hsl(240 8% 10%)" />
      <rect x="0.5" y="0.5" width="639" height="35" fill="hsl(240 6% 14%)" stroke="hsl(240 6% 20%)" />
      <text x="320" y="22.5" textAnchor="middle" fontSize="11" fill="hsl(240 5% 60%)">claude_desktop_config.json — %APPDATA%\Claude</text>
      <text x="28" y="70" fontSize="13" fill="hsl(240 5% 60%)" fontFamily="Consolas, monospace">{"{"}</text>
      <text x="52" y="94" fontSize="13" fill="hsl(200 70% 65%)" fontFamily="Consolas, monospace">"mcpServers"</text>
      <text x="150" y="94" fontSize="13" fill="hsl(240 5% 60%)" fontFamily="Consolas, monospace">: {"{"}</text>
      <text x="76" y="118" fontSize="13" fill="hsl(200 70% 65%)" fontFamily="Consolas, monospace">"abap-adt"</text>
      <text x="156" y="118" fontSize="13" fill="hsl(240 5% 60%)" fontFamily="Consolas, monospace">: {"{"}</text>
      <text x="100" y="142" fontSize="13" fill="hsl(200 70% 65%)" fontFamily="Consolas, monospace">"command"</text>
      <text x="180" y="142" fontSize="13" fill="hsl(18 80% 65%)" fontFamily="Consolas, monospace">: "npx"</text>
      <text x="100" y="166" fontSize="13" fill="hsl(200 70% 65%)" fontFamily="Consolas, monospace">"args"</text>
      <text x="148" y="166" fontSize="13" fill="hsl(18 80% 65%)" fontFamily="Consolas, monospace">: [ "-y", "mcp-abap-adt" ]</text>
      <text x="76" y="190" fontSize="13" fill="hsl(240 5% 60%)" fontFamily="Consolas, monospace">{"}"}</text>
      <text x="52" y="214" fontSize="13" fill="hsl(240 5% 60%)" fontFamily="Consolas, monospace">{"}"}</text>
      <text x="28" y="238" fontSize="13" fill="hsl(240 5% 60%)" fontFamily="Consolas, monospace">{"}"}</text>
      <rect x="24" y="264" width="592" height="1" fill="hsl(240 6% 20%)" />
      <circle cx="34" cy="292" r="6" fill={good} />
      <text x="50" y="296" fontSize="12" fill="hsl(240 5% 60%)">JSON valid — restart Claude Desktop from the system tray to apply</text>
    </svg>
  );
}

function SpreadsheetScene() {
  const cols = [40, 150, 260, 370, 480, 590];
  return (
    <svg viewBox="0 0 640 360" role="presentation" className="h-full w-full">
      <rect width="640" height="360" fill={card} />
      <WindowChrome title="Excel — ATC_Findings_Export.xlsx" />
      {/* ribbon */}
      <rect x="0.5" y="36" width="639" height="30" fill="hsl(150 45% 35%)" opacity="0.85" />
      <rect x="14" y="45" width="70" height="12" rx="3" fill="hsl(0 0% 100%)" opacity="0.8" />
      <rect x="100" y="45" width="50" height="12" rx="3" fill="hsl(0 0% 100%)" opacity="0.45" />
      {/* header row */}
      <rect x="0.5" y="66" width="639" height="26" fill={soft} stroke={stroke} />
      {["Check", "Object", "Prio", "Finding", "Fix"].map((h, i) => (
        <text key={h} x={cols[i] + 12} y="83" fontSize="11" fontWeight="600" fill={softFg}>{h}</text>
      ))}
      {/* rows */}
      {[0, 1, 2, 3, 4, 5, 6].map((r) => (
        <g key={r}>
          <rect x="0.5" y={92 + r * 30} width="639" height="30" fill={r % 2 ? soft : card} opacity={r % 2 ? 0.4 : 1} stroke={stroke} strokeWidth="0.5" />
          <Lines x={cols[0] + 12} y={103 + r * 30} widths={[70]} color={softFg} h={7} />
          <Lines x={cols[1] + 12} y={103 + r * 30} widths={[86]} color={softFg} h={7} />
          <rect x={cols[2] + 12} y={100 + r * 30} width="26" height="13" rx="6.5" fill={r < 3 ? "hsl(0 60% 55%)" : "hsl(45 85% 50%)"} opacity="0.75" />
          <Lines x={cols[3] + 12} y={103 + r * 30} widths={[90]} color={softFg} h={7} />
          <Lines x={cols[4] + 12} y={103 + r * 30} widths={[40]} color={good} h={7} />
        </g>
      ))}
      {/* column letters */}
      <rect x="0.5" y="330" width="639" height="29" fill={soft} stroke={stroke} />
      <rect x="14" y="339" width="90" height="10" rx="3" fill={accentSoft} />
      <rect x="118" y="339" width="90" height="10" rx="3" fill={softFg} opacity="0.3" />
    </svg>
  );
}

function BrowserScene() {
  return (
    <svg viewBox="0 0 640 360" role="presentation" className="h-full w-full">
      <rect width="640" height="360" fill={card} />
      <WindowChrome title="" />
      {/* address bar */}
      <rect x="70" y="8" width="420" height="20" rx="10" fill={card} stroke={stroke} />
      <circle cx="84" cy="18" r="5" fill={good} />
      <text x="98" y="22" fontSize="11" fill={softFg} fontFamily="Consolas, monospace">claude.ai</text>
      <rect x="500" y="8" width="20" height="20" rx="6" fill={accent} />
      {/* page: chat + artifact split */}
      <rect x="0.5" y="36" width="300" height="323" fill={card} stroke={stroke} />
      <rect x="20" y="56" width="220" height="44" rx="9" fill={accentSoft} />
      <rect x="20" y="112" width="260" height="120" rx="9" fill={soft} />
      <Lines x={34} y={128} widths={[220, 190, 210, 160]} gap={18} />
      <rect x="20" y="316" width="260" height="28" rx="9" fill={card} stroke={stroke} />
      {/* artifact panel */}
      <rect x="300.5" y="36" width="339" height="323" fill={soft} opacity="0.5" stroke={stroke} />
      <rect x="318" y="52" width="130" height="9" rx="4.5" fill={accent} />
      <rect x="318" y="74" width="303" height="240" rx="8" fill="hsl(240 6% 12%)" />
      <Lines x={334} y={92} widths={[200, 260, 230, 180, 250, 210, 150, 240, 190, 220]} gap={22} color="hsl(18 80% 65%)" h={5} />
      <rect x="318" y="326" width="90" height="20" rx="6" fill={accentSoft} />
    </svg>
  );
}

const scenes: Record<IllustrationVariant, () => ReactElement> = {
  chat: ChatScene,
  desktop: DesktopScene,
  terminal: TerminalScene,
  vscode: VsCodeScene,
  eclipse: EclipseScene,
  sapgui: SapGuiScene,
  config: ConfigScene,
  spreadsheet: SpreadsheetScene,
  browser: BrowserScene,
};

export function Illustration({ variant }: { variant: IllustrationVariant }) {
  const Scene = scenes[variant];
  return <Scene />;
}
