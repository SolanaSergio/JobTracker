import { useEffect, useState } from 'react';
import {
  ArrowRight, Plus, Settings as SettingsIcon, Sun, Moon, Monitor,
} from 'lucide-react';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from '../ui/command';
import { NAV_ITEMS, STATUS_MAP } from '../../utils/constants';
import { useApp } from '../../lib/app-context';
import { useTheme } from '../../lib/theme';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function CommandPalette() {
  const { commandOpen, setCommandOpen, navigate, setQuickAddOpen } = useApp();
  const { setTheme } = useTheme();
  const configured = isSupabaseConfigured();
  const { data: apps } = useSupabaseQuery('applications');
  const { data: contacts } = useSupabaseQuery('contacts');
  const [query, setQuery] = useState('');

  useEffect(() => { if (!commandOpen) setQuery(''); }, [commandOpen]);

  const run = (fn) => {
    setCommandOpen(false);
    setTimeout(fn, 60);
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search applications, contacts, or run a command…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(() => setQuickAddOpen(true))}>
            <Plus />
            Quick add application
            <CommandShortcut>C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate('search'))}>
            <ArrowRight />
            Search jobs online
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate('settings'))}>
            <SettingsIcon />
            Open settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem key={item.key} onSelect={() => run(() => navigate(item.key))} value={`nav-${item.label}`}>
                <Icon />
                {item.label}
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {configured && apps?.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Applications">
              {apps.slice(0, 8).map((app) => {
                const status = STATUS_MAP[app.status];
                return (
                  <CommandItem key={app.id} onSelect={() => run(() => navigate('applications'))} value={`app-${app.job_title}-${app.company}`}>
                    <span className={`h-2 w-2 rounded-full status-${app.status} status-bar`} />
                    <span className="truncate">{app.job_title}</span>
                    <span className="text-[var(--muted-foreground)] truncate">— {app.company}</span>
                    <CommandShortcut>{status?.shortLabel}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {configured && contacts?.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Contacts">
              {contacts.slice(0, 6).map((c) => (
                <CommandItem key={c.id} onSelect={() => run(() => navigate('contacts'))} value={`contact-${c.name}-${c.company}`}>
                  <ArrowRight />
                  <span className="truncate">{c.name}</span>
                  {c.company && <span className="text-[var(--muted-foreground)] truncate">— {c.company}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => run(() => setTheme('light'))}>
            <Sun /> Light theme
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme('dark'))}>
            <Moon /> Dark theme
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme('system'))}>
            <Monitor /> System
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
