import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Search, 
  Briefcase, 
  Users, 
  FileText, 
  Settings,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { NAV_ITEMS } from '../../utils/constants';

const ICON_MAP = {
  dashboard: LayoutDashboard,
  search: Search,
  applications: Briefcase,
  contacts: Users,
  resumes: FileText,
  settings: Settings
};

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Briefcase size={18} color="#000" strokeWidth={2.5} />
        </div>
        <span>JobTracker<span style={{ color: 'var(--accent)' }}>.</span></span>
      </div>
      
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, index) => {
          const Icon = ICON_MAP[item.key] || Briefcase;
          const isActive = currentPage === item.key;
          
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="nav-item-active-indicator"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <Icon 
                size={18} 
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? 'var(--accent)' : 'currentColor'} 
              />
              
              <span className="flex-1">{item.label}</span>
              
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <ChevronRight size={14} className="text-muted" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="flex items-center gap-10 mb-12">
          <div className="p-8 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-[12px] font-bold text-primary">Pro Version</div>
            <div className="text-[10px] text-muted">Precision Analytics</div>
          </div>
        </div>
        <button className="btn btn-primary w-full text-[12px] py-6">
          Upgrade Hub
        </button>
      </div>
    </aside>
  );
}


