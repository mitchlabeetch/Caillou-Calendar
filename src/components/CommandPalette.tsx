import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { searchEvents, type SearchHit } from '../lib/eventSearch';
import type { CalendarEvent } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  onPickEvent: (eventId: string) => void;
}

export function CommandPalette({ isOpen, onClose, events, onPickEvent }: CommandPaletteProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setActiveIdx(0);
    // Focus the input as soon as the palette opens.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen]);

  const hits = useMemo<SearchHit[]>(() => searchEvents(events, query), [events, query]);
  const top = hits.slice(0, 8);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, top.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && top[activeIdx]) {
        e.preventDefault();
        onPickEvent(top[activeIdx].event.id);
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, onPickEvent, top, activeIdx]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={t('app.search', 'Search')}
        >
          <motion.div
            ref={containerRef}
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 240 }}
            className="w-full max-w-xl bg-surface border-[3px] border-ink rounded-3xl shadow-neo-xl overflow-hidden outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b-[2px] border-ink/10">
              <Search className="w-5 h-5 opacity-50" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIdx(0);
                }}
                placeholder={t('app.searchPlaceholder', 'Search events, tags, locations…')}
                aria-label={t('app.search', 'Search')}
                className="flex-1 bg-transparent text-base font-bold outline-none placeholder:text-ink/40"
              />
              <kbd className="text-[10px] uppercase tracking-widest opacity-50 border-[2px] border-ink/20 rounded px-1.5 py-0.5">esc</kbd>
            </div>
            <ul className="max-h-[55vh] overflow-y-auto py-1">
              {top.length === 0 ? (
                <li className="px-4 py-6 text-sm opacity-50 text-center font-bold">{t('app.noResults', 'No results')}</li>
              ) : (
                top.map((hit, idx) => (
                  <li key={hit.event.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => {
                        onPickEvent(hit.event.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left ${idx === activeIdx ? 'bg-primary/15' : 'hover:bg-ink/5'}`}
                    >
                      <span className="text-lg shrink-0">{emojiForCategory(hit.event.category)}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold truncate">{hit.event.title}</span>
                        <span className="block text-[10px] uppercase tracking-widest opacity-50">
                          {hit.event.date}
                          {hit.event.startTime ? ` · ${hit.event.startTime}` : ''}
                          {hit.event.location ? ` · ${hit.event.location}` : ''}
                        </span>
                      </span>
                      <span className="text-[10px] uppercase tracking-widest opacity-50">{hit.matchedField}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function emojiForCategory(cat: string | undefined): string {
  switch (cat) {
    case 'school': return '🏫';
    case 'medical': return '🩺';
    case 'sports': return '⚽';
    case 'work': return '💼';
    case 'family': return '🏠';
    case 'holiday': return '🌴';
    case 'social': return '🎉';
    default: return '📅';
  }
}