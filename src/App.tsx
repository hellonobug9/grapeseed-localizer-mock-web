import { GlobalLoading } from "@/components/global_loading";
import { AppLayout } from "@/components/layout/app_layout";
import { Toaster } from "@/components/ui/sonner";
import { TEMPLATE_PROJECT_ID } from "@/data/mock_data";
import { queryClient } from "@/lib/query_client";
import { LockProvider } from "@/state/lock_provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ActivityPage } from "./pages/activity_page";
import { DashboardPage } from "./pages/dashboard/dashboard_page";
import { KeyFormPage } from "./pages/keys/key_form_page";
import { UploadPage } from "./pages/keys/upload_page";
import { LanguagesPage } from "./pages/languages/languages_page";
import { ProjectDetailsPage } from "./pages/project_details/project_details_page";
import { ProjectsPage } from "./pages/projects/projects_page";
import { SearchPage } from "./pages/search_page";
import { UsersPage } from "./pages/users/users_page";

// Demo build: no sign-in, every request is served by the in-memory mock API.
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LockProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailsPage />} />
              <Route path="languages" element={<LanguagesPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route
                path="templates/notification"
                element={<Navigate to={`/projects/${TEMPLATE_PROJECT_ID}`} replace />}
              />
              <Route
                path="templates/*"
                element={<Navigate to={`/projects/${TEMPLATE_PROJECT_ID}`} replace />}
              />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="keys/new" element={<KeyFormPage />} />
              <Route path="keys/:id/edit" element={<KeyFormPage />} />
              <Route path="keys/upload" element={<UploadPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <GlobalLoading />
        <Toaster />
      </LockProvider>
    </QueryClientProvider>
  );
}

export default App;
