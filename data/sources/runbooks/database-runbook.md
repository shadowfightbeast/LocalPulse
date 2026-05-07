# Runbook: Database Issues

## Connection Pool Exhausted
- Symptom: `Connection refused` or `pool exhausted` errors
- Check active connections: `SELECT count(*) FROM pg_stat_activity;`
- Kill long-running queries: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE duration > interval '30s';`
- Increase pool size in `application.yml`: `spring.datasource.hikari.maximum-pool-size: 50`
- Add query timeout: `spring.datasource.hikari.connection-timeout: 5000`

## Slow Queries
- Enable slow query log: `log_min_duration_statement = 1000` in `postgresql.conf`
- Run `EXPLAIN ANALYZE` on the offending query
- Add missing index: check `pg_stat_user_tables` for high `seq_scan` counts
- Common fix: `CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);`

## Disk Space
- Check: `df -h /var/lib/postgresql`
- Archive old partitions: move data older than 90 days to cold storage
- Vacuum: `VACUUMDB --analyze --all`

## Escalation
- On-call: dba-team@company.com
- PagerDuty: database-critical policy
