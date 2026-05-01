import { useState } from 'react';
import { ToastProvider } from './components/ui/UI';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import JobSearch from './components/search/JobSearch';
import ApplicationBoard from './components/applications/ApplicationBoard';
import ContactsList from './components/contacts/ContactsList';
import ResumeManager from './components/resumes/ResumeManager';
import Settings from './components/settings/Settings';

export default function App() {
  const [page, setPage] = useState('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={setPage} />;
      case 'search': return <JobSearch onNavigate={setPage} />;
      case 'applications': return <ApplicationBoard onNavigate={setPage} />;
      case 'contacts': return <ContactsList onNavigate={setPage} />;
      case 'resumes': return <ResumeManager onNavigate={setPage} />;
      case 'settings': return <Settings />;
      default: return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <ToastProvider>
      <div className="app-layout">
        <Sidebar currentPage={page} onNavigate={setPage} />
        <main className="main-area">
          {renderPage()}
        </main>
      </div>
    </ToastProvider>
  );
}
