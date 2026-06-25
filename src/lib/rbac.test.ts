import { describe, it, expect } from 'vitest';
import { RBAC_MIGRATION_SQL } from './rbac';

describe('rbac migration', () => {
  it('creates a users table with id, display_name, role', () => {
    expect(RBAC_MIGRATION_SQL).toMatch(/create table if not exists public\.users/i);
    expect(RBAC_MIGRATION_SQL).toMatch(/role text not null default 'member'/i);
    expect(RBAC_MIGRATION_SQL).toMatch(/check \(role in \('admin', 'member', 'child'\)\)/i);
  });

  it('enables RLS', () => {
    expect(RBAC_MIGRATION_SQL).toMatch(/alter table public\.users enable row level security/i);
  });

  it('defines self + admin read policies', () => {
    expect(RBAC_MIGRATION_SQL).toMatch(/create policy users_self_read/i);
    expect(RBAC_MIGRATION_SQL).toMatch(/create policy users_admin_read/i);
  });

  it('defines self + admin update policies', () => {
    expect(RBAC_MIGRATION_SQL).toMatch(/create policy users_self_update/i);
    expect(RBAC_MIGRATION_SQL).toMatch(/create policy users_admin_update/i);
  });

  it('restricts role changes', () => {
    // The self update policy must forbid changing one's own role.
    expect(RBAC_MIGRATION_SQL).toMatch(/role = \(select role from public\.users/i);
  });
});