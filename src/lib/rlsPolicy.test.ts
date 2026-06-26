import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(process.cwd(), 'supabase', 'rls.sql'),
  'utf8',
);

describe('supabase rls policies', () => {
  it('derives the current role from trusted backend data', () => {
    expect(sql).toMatch(/create or replace function public\.current_user_role/i);
    expect(sql).toMatch(/auth\.jwt\(\).*user_metadata.*role/is);
  });

  it('restricts event writes to admin and member roles', () => {
    expect(sql).toMatch(/events_insert_authorized/i);
    expect(sql).toMatch(/events_update_authorized/i);
    expect(sql).toMatch(/events_delete_authorized/i);
    expect(sql).toMatch(/current_user_role\(\)\s+in\s+\('admin',\s*'member'\)/i);
  });

  it('restricts family and settings writes to admin roles', () => {
    expect(sql).toMatch(/family_members_insert_authorized/i);
    expect(sql).toMatch(/settings_update_authorized/i);
    expect(sql).toMatch(/current_user_role\(\)\s*=\s*'admin'/i);
  });
});
