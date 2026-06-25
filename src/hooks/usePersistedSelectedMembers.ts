import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'synoptic-selected-members-persist';

/**
 * Persists the member filter across reloads. The pre-existing
 * `synoptic-selected-members-init` key only seeds the initial value,
 * so a user who toggled a filter then refreshed the page would have
 * their selection silently reset. This hook fixes that.
 */
export function usePersistedSelectedMembers() {
  const [selectedMembers, setSelectedMembers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as string[];
      const seeded = localStorage.getItem('synoptic-selected-members-init');
      if (seeded) return JSON.parse(seeded) as string[];
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedMembers));
    } catch {}
  }, [selectedMembers]);

  const toggleMember = useCallback((id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }, []);

  return { selectedMembers, setSelectedMembers, toggleMember };
}