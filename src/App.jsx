import { lazy, Suspense } from 'react';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster, PageLoader } from './components/ui/feedback';
import { ThemeProvider } from './lib/theme';
import { AppProvider, useApp } from './lib/app-context';
import Sidebar from './components/layout/Sidebar';
import { MobileTopBar, MobileBottomNav } from './components/layout/MobileNav';
import CommandPalette from './components/layout/CommandPalette';
import QuickAdd from './components/layout/QuickAdd';

const Dashboard          = lazy(() => import('./components/dashboard/Dashboard'));
const JobSearch          = lazy(() => import('./components/search/JobSearch'));
const ApplicationBoard   = lazy(() => import('./components/applications/ApplicationBoard'));
const ContactsList       = lazy(() => import('./components/contacts/ContactsList'));
const ResumeManager      = lazy(() => import('./components/resumes/ResumeManager'));
const Settings           = lazy(() => import('./components/settings/Settings'));
const CalendarView       = lazy(() => import('./components/calendar/CalendarView'));
const TasksView          = lazy(() => import('./components/tasks/TasksView'));
const Analytics          = lazy(() => import('./components/analytics/Insights'));

const PAGES = {
  dashboard:    Dashboard,
  search:       JobSearch,
  applications: ApplicationBoard,
  contacts:     ContactsList,
  resumes:      ResumeManager,
  settings:     Settings,
  calendar:     CalendarView,
  tasks:        TasksView,
  analytics:    Analytics,
};

function PageOutlet() {
  const { page } = useApp();
  const Page = PAGES[page] || Dashboard;
  return (
    <Suspense fallback={<PageLoader />}>
      <Page />
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={150}>
        <AppProvider>
          <div className="flex h-dvh overflow-hidden">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex lg:w-72 shrink-0">
              <Sidebar />
            </aside>

            <div className="flex flex-col flex-1 min-w-0">
              <MobileTopBar />
              <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
                <PageOutlet />
              </main>
            </div>

            <MobileBottomNav />
            <CommandPalette />
            <QuickAdd />
          </div>
          <Toaster />
        </AppProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
