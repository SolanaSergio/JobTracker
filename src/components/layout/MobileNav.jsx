import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Plus, Search as SearchIcon, Briefcase } from 'lucide-react';
import { NAV_ITEMS, MOBILE_NAV_ITEMS } from '../../utils/constants';
import { useApp } from '../../lib/app-context';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '../ui/sheet';
import Sidebar from './Sidebar';
import { cn } from '../../lib/cn';

export function MobileTopBar() {
  const [open, setOpen] = useState(false);
  const { page, setCommandOpen } = useApp();
  const current = NAV_ITEMS.find((n) => n.key === page);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 flex items-center gap-2 px-4 h-14 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl safe-top">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Menu">
          <Menu />
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[var(--primary)] to-[color-mix(in_oklab,var(--primary)_60%,#000)]">
            <Briefcase className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold tracking-tight truncate">{current?.label || 'JobTracker'}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setCommandOpen(true)} aria-label="Search">
          <SearchIcon />
        </Button>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[80vw] max-w-xs p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Switch sections of the app.</SheetDescription>
          <Sidebar onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function MobileBottomNav() {
  const { page, navigate, setQuickAddOpen } = useApp();
  const items = MOBILE_NAV_ITEMS.map((k) => NAV_ITEMS.find((n) => n.key === k)).filter(Boolean);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 surface border-t border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-xl safe-bottom">
      <div className="relative grid grid-cols-5 h-16">
        {items.slice(0, 2).map((item) => (
          <NavTab key={item.key} item={item} active={page === item.key} onClick={() => navigate(item.key)} />
        ))}

        {/* Center FAB */}
        <div className="flex items-center justify-center">
          <button
            aria-label="Quick add"
            onClick={() => setQuickAddOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xl shadow-[color-mix(in_oklab,var(--primary)_45%,transparent)] -translate-y-3 active:scale-95 transition-transform"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        {items.slice(2, 4).map((item) => (
          <NavTab key={item.key} item={item} active={page === item.key} onClick={() => navigate(item.key)} />
        ))}
      </div>
    </nav>
  );
}

function NavTab({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center gap-0.5 transition-colors',
        active ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
      )}
    >
      <AnimatePresence>
        {active && (
          <motion.span
            layoutId="mobile-active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1 h-0.5 w-8 rounded-full bg-[var(--primary)]"
          />
        )}
      </AnimatePresence>
      <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
    </button>
  );
}
