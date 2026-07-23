import { HashRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import { AppShell } from "@/components/layout/AppShell";
import { HomePage } from "@/pages/HomePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ModulePage } from "@/pages/ModulePage";
import { LessonPage } from "@/pages/LessonPage";
import { DownloadsPage } from "@/pages/DownloadsPage";
import { ReelsPage } from "@/pages/ReelsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/**
 * HashRouter so the built site works when opened from a file share or any
 * static host without URL-rewrite configuration — the common case for an
 * internal enablement portal.
 */
export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/modules/:slug" element={<ModulePage />} />
            <Route path="/lessons/:slug" element={<LessonPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/reels" element={<ReelsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
