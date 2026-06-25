import { describe, it, expect, beforeEach } from 'vitest';
import { BUILTIN_TEMPLATES, listTemplates, saveCustomTemplate, deleteCustomTemplate } from './recurrenceTemplates';

describe('recurrenceTemplates', () => {
  beforeEach(() => localStorage.clear());

  it('exposes a starter set of templates', () => {
    expect(BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    for (const t of BUILTIN_TEMPLATES) {
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.event.title.length).toBeGreaterThan(0);
    }
  });

  it('listTemplates merges builtins with custom templates from localStorage', () => {
    saveCustomTemplate({
      id: 'tpl-custom',
      label: 'My custom',
      emoji: '⭐',
      event: { title: 'Custom', memberIds: [] },
    });
    const all = listTemplates();
    expect(all.length).toBe(BUILTIN_TEMPLATES.length + 1);
    expect(all.find(t => t.id === 'tpl-custom')).toBeDefined();
  });

  it('does not duplicate a template id on repeated saves', () => {
    saveCustomTemplate({ id: 'tpl-x', label: 'X', emoji: '🅧', event: { title: 'X', memberIds: [] } });
    saveCustomTemplate({ id: 'tpl-x', label: 'X2', emoji: '🅧', event: { title: 'X2', memberIds: [] } });
    expect(listTemplates().filter(t => t.id === 'tpl-x')).toHaveLength(1);
  });

  it('deleteCustomTemplate removes by id', () => {
    saveCustomTemplate({ id: 'tpl-y', label: 'Y', emoji: '🅨', event: { title: 'Y', memberIds: [] } });
    deleteCustomTemplate('tpl-y');
    expect(listTemplates().find(t => t.id === 'tpl-y')).toBeUndefined();
  });

  it('returns a stable list when localStorage is empty', () => {
    expect(listTemplates().length).toBe(BUILTIN_TEMPLATES.length);
  });
});