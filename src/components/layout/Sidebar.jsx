import { motion } from 'framer-motion';
import { Briefcase, Sparkles, Plus, Search } from 'lucide-react';
import { NAV_ITEMS } from '../../utils/constants';
import { useApp } from '../../lib/app-context';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/cn';

const groups = [
  { id: 'main', label: 'Workspace' },
  { id: 'crm', label: 'Network' },
  { id: 'system', label: 'System' },
];

export default function Sidebar({ onClose }) {
  const { page, navigate, setCommandOpen, setQuickAddOpen } = useApp();

  const handleNav = (key) => {
    navigate(key);
    onClose?.();
  };

  return (
    <aside className="flex h-full w-full flex-col bg-[var(--card)]/70 border-r border-[var(--border)] backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[var(--border)]">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[color-mix(in_oklab,var(--primary)_70%,black)] shadow-md shadow-[color-mix(in_oklab,var(--primary)_25%,transparent)]">
          <Briefcase className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">JobTracker</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Career OS</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-3 flex flex-col gap-2 border-b border-[var(--border)]">
        <Button
          variant="default"
          className="w-full justify-start gap-2 shadow-md shadow-[color-mix(in_oklab,var(--primary)_25%,transparent)]"
          onClick={() => { setQuickAddOpen(true); onClose?.(); }}
        >
          <Plus className="h-4 w-4" />
          Quick add
          <span className="ml-auto text-[10px] tracking-widest opacity-60">C</span>
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2 text-[var(--muted-foreground)]" onClick={() => { setCommandOpen(true); onClose?.(); }}>
          <Search className="h-4 w-4" />
          Search…
          <span className="ml-auto text-[10px] tracking-widest opacity-60">⌘K</span>
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((g) => {
          const items = NAV_ITEMS.filter((n) => n.group === g.id);
          if (!items.length) return null;
          return (
            <div key={g.id} className="mb-4">
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                {g.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = page === item.key;
                  return (
                    <Tooltip key={item.key}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleNav(item.key)}
                          className={cn(
                            'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
                            isActive ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                          )}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active"
                              transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                              className="absolute inset-0 rounded-lg bg-[var(--accent)] border border-[var(--border)] shadow-sm"
                            />
                          )}
                          <Icon className={cn('relative h-4 w-4', isActive && 'text-[var(--primary)]')} strokeWidth={isActive ? 2.4 : 2} />
                          <span className="relative">{item.label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={12}>
                        {item.label} <span className="opacity-50 ml-1.5 tracking-wider">{item.shortcut}</span>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)] flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[color-mix(in_oklab,var(--primary)_70%,black)] text-white text-xs">
            <Sparkles className="h-3.5 w-3.5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="text-[13px] font-semibold truncate">You</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">Local workspace</div>
        </div>
      </div>
    </aside>
  );
}
