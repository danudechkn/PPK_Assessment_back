# Assessment schema migrations

Run `npm run migration:run` against the intended database after checking `.env` and taking a backup. The application does not run migrations on startup. `npm test` uses mocks and does not connect to MySQL.

- `20260907000000-create-assessment-schema.ts` creates the eight current assessment tables in dependency order. New tables use InnoDB and foreign keys; deleting an order cascades to its competency and KPI scores. Existing tables are retained and checked for missing columns. Existing column types and foreign keys are not altered automatically; reconcile any legacy schema differences before deployment. KPI names in the new schema are VARCHAR(255) so MySQL can enforce uniqueness.
- `20260907000100-add-assessment-unique-indexes.ts` adds unique pairs for competency scores `(value_order_id, quest)`, KPI assessments `(value_order_id, kpi_indicator_id)`, and KPI levels `(kpi_indicator_id, score)`. It checks for duplicates before adding indexes and stops without deleting or merging records. Resolve duplicates deliberately and retry. These indexes must be applied for database-level concurrency protection.
- MySQL DDL is not transactionally reversible. Both migrations support retry after partial execution. The schema baseline deliberately refuses automatic `down` because tables may predate this migration; use a backup or a reviewed forward migration. The index migration supports `down`.
- Older migrations that were removed from the working tree are not restored. Databases containing the previous evaluation schema may require a separate data migration; this baseline does not convert historical records.

## Score API behavior

- KPI submit: `PUT /api/user/kpi-assessments/:id/submit` with `{ "submit_value": 4 }`.
- Competency scores must be integers from 0 to 127 (the existing signed TINYINT column limit); KPI scores must be integers from 0 to 255. These are storage bounds, not a new business scoring scale. Nullable draft scores accept null or an empty string; final submission requires an explicit score. Booleans, arrays, whitespace and fractional scores are rejected.
- Confirmed competency scores cannot be edited or submitted again. Score writes and submission acquire row locks in transactions.
- `weighted_score` is server-calculated; administrator create/update requests must omit it. Changing a KPI weight or final score recalculates it. Weights are normalized to two decimal places before calculation, matching their database storage precision.
- Administrators may correct submitted KPI records. To reopen one, explicitly send `{ "submit_value": null, "status": "DRAFT" }`; this clears its derived score. A final score requires both evaluator scores and sets status to SUBMITTED.

Authentication and validation of required order fields were outside fixes 2?8 and remain separate work.
