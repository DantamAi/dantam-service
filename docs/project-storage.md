# Project database structure

The live project read model uses relational D1 tables:

- `projects`: project identity, name, description, version and audit metadata.
- `project_scope_items`: one row per current scope item, with separate description, acceptance, exclusions, product, module, owner, start, finish, estimate, status and revision columns. The key is `(project_id, id)`.
- `project_scope_dependencies`: one row per dependency, constrained to the same project.
- `project_members`: original project memberships; central workspace/product/project-role policy still determines effective access.
- `project_history`: one row per audit/discussion event, linked to its project and scope ID where applicable.
- `project_scope_revisions`: one row per preserved historical scope revision. Historical dependency arrays are stored with the immutable snapshot.
- `project_proposals`, `project_required_approvals`, `project_approval_decisions`: separate proposal, required-role and decision records.
- `project_attachments`: attachment metadata and existing R2 object keys. File bytes remain in R2.

Indexes support project/status, product/module, finish-date/status and owner lookups. Current scope records and dependencies have foreign-key constraints. Original record IDs and ordering are retained. Missing ownership and dates remain blank; migration does not infer delivery status or approval.

## Cutover and compatibility

Migration `0005_jittery_penance.sql` creates schema only. The idempotent `migrateLegacyProjects` service backfills existing project snapshots into individual records outside the schema migration. Each project's backfill is atomic. Source snapshots remain intact during backfill.

`planning_projects` is retained as a compatibility snapshot for old Worker requests during deployment; it is not the live read model. Validated project and attachment writes atomically update the relational records and the compatibility snapshot together. No user-facing request creates or alters tables.

Parent version checks and a unique write token guard all child changes. A stale writer cannot delete or replace another writer's rows. Transactions also check the compatibility version so an old Worker write during cutover is detected, migrated on retry, and cannot be overwritten by a stale new Worker edit. Failed child writes roll back the whole project write.

The API response shape remains unchanged so dashboards, scope editing, attachments, independent lead approvals, audit views and MCP tools continue to work. Database normalization does not change records into approved or completed work, create new scope, or imply native ticket links where only text references were recorded.
