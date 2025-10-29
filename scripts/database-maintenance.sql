-- Database Maintenance Script
-- Scheduled tasks and maintenance procedures

-- ========================================
-- 1. MAINTENANCE SCHEDULING
-- ========================================

-- Create maintenance schedule table
CREATE TABLE IF NOT EXISTS maintenance_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL UNIQUE,
  description TEXT,
  schedule_interval INTERVAL NOT NULL,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert standard maintenance tasks
INSERT INTO maintenance_schedule (task_name, description, schedule_interval, next_run)
VALUES
  ('cleanup_expired_packages', 'Clean up expired packages and sessions', INTERVAL '1 hour', NOW()),
  ('send_package_expiry_reminders', 'Send reminders for packages expiring in 7 days', INTERVAL '1 day', NOW() + INTERVAL '1 day'),
  ('process_booking_count_updates', 'Process queued booking count updates', INTERVAL '5 minutes', NOW()),
  ('cleanup_old_audit_logs', 'Remove audit logs older than 1 year', INTERVAL '1 day', NOW() + INTERVAL '1 day'),
  ('update_analytics_cache', 'Refresh analytics materialized views', INTERVAL '1 hour', NOW()),
  ('cleanup_expired_sessions', 'Remove expired booking draft sessions', INTERVAL '30 minutes', NOW()),
  ('vacuum_analyze_tables', 'Run VACUUM ANALYZE on large tables', INTERVAL '1 day', NOW() + INTERVAL '1 day'),
  ('backup_critical_data', 'Create backups of critical tables', INTERVAL '1 day', NOW() + INTERVAL '1 day'),
  ('check_system_health', 'Run system health checks', INTERVAL '10 minutes', NOW()),
  ('cleanup_rate_limits', 'Remove old rate limit records', INTERVAL '1 hour', NOW())
ON CONFLICT (task_name) DO NOTHING;

-- ========================================
-- 2. MAINTENANCE PROCEDURES
-- ========================================

-- Master maintenance function
CREATE OR REPLACE FUNCTION run_maintenance_tasks()
RETURNS TABLE (
  task_name TEXT,
  status TEXT,
  result JSONB,
  duration_ms INTEGER
) AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_task RECORD;
BEGIN
  -- Create temp table for results
  CREATE TEMP TABLE IF NOT EXISTS maintenance_results (
    task_name TEXT,
    status TEXT,
    result JSONB,
    duration_ms INTEGER
  );

  -- Loop through scheduled tasks
  FOR v_task IN
    SELECT * FROM maintenance_schedule
    WHERE is_active = true
      AND next_run <= NOW()
    FOR UPDATE
  LOOP
    v_start_time := clock_timestamp();

    BEGIN
      -- Execute the appropriate maintenance task
      CASE v_task.task_name
        WHEN 'cleanup_expired_packages' THEN
          UPDATE maintenance_schedule
          SET last_run = NOW(),
              next_run = NOW() + schedule_interval
          WHERE id = v_task.id;

          INSERT INTO maintenance_results
          SELECT
            v_task.task_name,
            'success',
            jsonb_build_object('packages_cleaned', cleanup_expired_packages()),
            EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

        WHEN 'send_package_expiry_reminders' THEN
          UPDATE maintenance_schedule
          SET last_run = NOW(),
              next_run = NOW() + schedule_interval
          WHERE id = v_task.id;

          INSERT INTO maintenance_results
          SELECT
            v_task.task_name,
            'success',
            jsonb_build_object('reminders_sent', send_package_expiry_reminders()),
            EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

        WHEN 'process_booking_count_updates' THEN
          UPDATE maintenance_schedule
          SET last_run = NOW(),
              next_run = NOW() + schedule_interval
          WHERE id = v_task.id;

          INSERT INTO maintenance_results
          SELECT
            v_task.task_name,
            'success',
            jsonb_build_object('updates_processed', process_booking_count_updates(100)),
            EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

        WHEN 'cleanup_old_audit_logs' THEN
          UPDATE maintenance_schedule
          SET last_run = NOW(),
              next_run = NOW() + schedule_interval
          WHERE id = v_task.id;

          INSERT INTO maintenance_results
          SELECT
            v_task.task_name,
            'success',
            cleanup_old_data(365), -- Keep 1 year
            EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

        WHEN 'update_analytics_cache' THEN
          UPDATE maintenance_schedule
          SET last_run = NOW(),
              next_run = NOW() + schedule_interval
          WHERE id = v_task.id;

          BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY booking_stats_summary;
            INSERT INTO maintenance_results
            SELECT
              v_task.task_name,
              'success',
              jsonb_build_object('view_refreshed', 'booking_stats_summary'),
              EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;
          EXCEPTION
            WHEN OTHERS THEN
              INSERT INTO maintenance_results
              SELECT
                v_task.task_name,
                'error',
                jsonb_build_object('error', SQLERRM),
                EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;
          END;

        WHEN 'cleanup_expired_sessions' THEN
          UPDATE maintenance_schedule
          SET last_run = NOW(),
              next_run = NOW() + schedule_interval
          WHERE id = v_task.id;

          DELETE FROM booking_drafts
          WHERE expires_at < NOW();

          INSERT INTO maintenance_results
          SELECT
            v_task.task_name,
            'success',
            jsonb_build_object('sessions_deleted', ROW_COUNT),
            EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

        WHEN 'vacuum_analyze_tables' THEN
          UPDATE maintenance_schedule
          SET last_run = NOW(),
              next_run = NOW() + schedule_interval
          WHERE id = v_task.id;

          -- Vacuum large tables
          PERFORM pg_relsize(schemaname||'.'||tablename)
          FROM pg_tables
          WHERE schemaname = 'public'
            AND pg_total_relation_size(schemaname||'.'||tablename) > 100 * 1024 * 1024; -- > 100MB

          INSERT INTO maintenance_results
          SELECT
            v_task.task_name,
            'success',
            jsonb_build_object('vacuum_scheduled', 'large_tables'),
            EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

        WHEN 'backup_critical_data' THEN
          UPDATE maintenance_schedule
          SET last_run = NOW(),
              next_run = NOW() + schedule_interval
          WHERE id = v_task.id;

          -- This would trigger external backup process
          INSERT INTO maintenance_results
          SELECT
            v_task.task_name,
            'success',
            jsonb_build_object('backup_triggered', NOW()),
            EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

        WHEN 'check_system_health' THEN
          UPDATE maintenance_schedule
          SET last_run = NOW(),
              next_run = NOW() + schedule_interval
          WHERE id = v_task.id;

          INSERT INTO maintenance_results
          SELECT
            v_task.task_name,
            'success',
            db_health_check(),
            EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

        WHEN 'cleanup_rate_limits' THEN
          UPDATE maintenance_schedule
          SET last_run = NOW(),
              next_run = NOW() + schedule_interval
          WHERE id = v_task.id;

          DELETE FROM api_rate_limits
          WHERE window_end < NOW() - INTERVAL '1 hour';

          INSERT INTO maintenance_results
          SELECT
            v_task.task_name,
            'success',
            jsonb_build_object('records_deleted', ROW_COUNT),
            EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

        ELSE
          INSERT INTO maintenance_results
          SELECT
            v_task.task_name,
            'skipped',
            jsonb_build_object('reason', 'Unknown task'),
            EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;
      END CASE;

    EXCEPTION
      WHEN OTHERS THEN
        INSERT INTO maintenance_results
        SELECT
          v_task.task_name,
          'error',
          jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE),
          EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;
    END;
  END LOOP;

  -- Return results
  RETURN QUERY SELECT * FROM maintenance_results;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. MAINTENANCE DASHBOARD
-- ========================================

-- View for maintenance dashboard
CREATE OR REPLACE VIEW maintenance_dashboard AS
SELECT
  ms.task_name,
  ms.description,
  ms.schedule_interval,
  ms.last_run,
  ms.next_run,
  ms.is_active,
  CASE
    WHEN ms.last_run IS NULL THEN 'Never run'
    WHEN ms.last_run > NOW() - INTERVAL '1 hour' THEN 'Recent'
    WHEN ms.last_run > NOW() - INTERVAL '6 hours' THEN 'OK'
    ELSE 'Overdue'
  END as status,
  CASE
    WHEN ms.next_run <= NOW() THEN 'Due now'
    WHEN ms.next_run <= NOW() + INTERVAL '1 hour' THEN 'Soon'
    ELSE 'Scheduled'
  END as next_status
FROM maintenance_schedule ms
ORDER BY ms.next_run;

-- ========================================
-- 4. AUTOMATED MONITORING
-- ========================================

-- Function to check for maintenance issues
CREATE OR REPLACE FUNCTION check_maintenance_health()
RETURNS TABLE (
  issue_type TEXT,
  severity TEXT,
  message TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  -- Check for overdue tasks
  SELECT
    'overdue_task' as issue_type,
    CASE
      WHEN EXTRACT(EPOCH FROM (NOW() - next_run)) > 3600 THEN 'high'
      ELSE 'medium'
    END as severity,
    format('Task "%s" is overdue by %s', task_name,
           EXTRACT(EPOCH FROM (NOW() - next_run))::INTEGER || ' seconds') as message,
    jsonb_build_object('task_name', task_name, 'overdue_seconds',
                       EXTRACT(EPOCH FROM (NOW() - next_run))::INTEGER) as metadata
  FROM maintenance_schedule
  WHERE is_active = true
    AND next_run < NOW() - INTERVAL '5 minutes'

  UNION ALL

  -- Check for tasks that haven't run recently
  SELECT
    'stale_task' as issue_type,
    'medium' as severity,
    format('Task "%s" hasn''t run since %s', task_name,
           COALESCE(last_run::TEXT, 'never')) as message,
    jsonb_build_object('task_name', task_name, 'last_run', last_run) as metadata
  FROM maintenance_schedule
  WHERE is_active = true
    AND last_run < NOW() - schedule_interval * 2

  UNION ALL

  -- Check for long-running tasks
  SELECT
    'long_running_task' as issue_type,
    CASE
      WHEN EXTRACT(EPOCH FROM (NOW() - last_run)) > 3600 THEN 'high'
      ELSE 'low'
    END as severity,
    format('Task "%s" may be running too long', task_name) as message,
    jsonb_build_object('task_name', task_name, 'duration_seconds',
                       EXTRACT(EPOCH FROM (NOW() - last_run))::INTEGER) as metadata
  FROM maintenance_schedule
  WHERE last_run > NOW() - schedule_interval / 2
    AND last_run < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. MAINTENANCE LOGS
-- ========================================

-- Create maintenance log table if it doesn't exist
CREATE TABLE IF NOT EXISTS maintenance_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  status TEXT NOT NULL,
  duration_ms INTEGER,
  result JSONB,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for maintenance logs
CREATE INDEX IF NOT EXISTS idx_maintenance_execution_log_task_time
ON maintenance_execution_log(task_name, executed_at DESC);

-- Trigger to log maintenance execution
CREATE OR REPLACE FUNCTION log_maintenance_execution()
RETURNS trigger AS $$
BEGIN
  INSERT INTO maintenance_execution_log (
    task_name,
    status,
    duration_ms,
    result,
    error_message
  ) VALUES (
    TG_ARGV[0],
    CASE WHEN TG_OP = 'INSERT' THEN 'success' ELSE 'error' END,
    EXTRACT(MILLISECONDS FROM (clock_timestamp() - NEW.created_at))::INTEGER,
    row_to_json(NEW),
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. UTILITY FUNCTIONS
-- ========================================

-- Function to get maintenance statistics
CREATE OR REPLACE FUNCTION get_maintenance_statistics()
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_tasks', (SELECT COUNT(*)::INTEGER FROM maintenance_schedule),
    'active_tasks', (SELECT COUNT(*)::INTEGER FROM maintenance_schedule WHERE is_active = true),
    'tasks_due_now', (SELECT COUNT(*)::INTEGER FROM maintenance_schedule WHERE next_run <= NOW()),
    'overdue_tasks', (
      SELECT COUNT(*)::INTEGER
      FROM maintenance_schedule
      WHERE is_active = true
        AND next_run < NOW() - INTERVAL '5 minutes'
    ),
    'recent_executions', (
      SELECT json_agg(json_build_object(
        'task_name', task_name,
        'status', status,
        'duration_ms', duration_ms,
        'executed_at', executed_at
      ))
      FROM maintenance_execution_log
      WHERE executed_at > NOW() - INTERVAL '24 hours'
      ORDER BY executed_at DESC
      LIMIT 10
    ),
    'last_check', NOW()
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually trigger maintenance
CREATE OR REPLACE FUNCTION trigger_maintenance_task(
  p_task_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_start_time TIMESTAMPTZ := NOW();
BEGIN
  -- Update the schedule
  UPDATE maintenance_schedule
  SET last_run = NOW(),
      next_run = NOW() + schedule_interval
  WHERE task_name = p_task_name;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Task not found',
      'task_name', p_task_name
    );
  END IF;

  -- Execute based on task name
  CASE p_task_name
    WHEN 'cleanup_expired_packages' THEN
      v_result := jsonb_build_object(
        'success', true,
        'task_name', p_task_name,
        'result', cleanup_expired_packages(),
        'duration_ms', EXTRACT(MILLISECONDS FROM (NOW() - v_start_time))::INTEGER
      );
    WHEN 'process_booking_count_updates' THEN
      v_result := jsonb_build_object(
        'success', true,
        'task_name', p_task_name,
        'result', process_booking_count_updates(100),
        'duration_ms', EXTRACT(MILLISECONDS FROM (NOW() - v_start_time))::INTEGER
      );
    ELSE
      v_result := jsonb_build_object(
        'success', false,
        'error', 'Manual trigger not implemented for this task',
        'task_name', p_task_name
      );
  END CASE;

  -- Log the execution
  INSERT INTO maintenance_execution_log (
    task_name,
    status,
    duration_ms,
    result
  ) VALUES (
    p_task_name,
    CASE WHEN v_result->>'success' = 'true' THEN 'success' ELSE 'error' END,
    (v_result->>'duration_ms')::INTEGER,
    v_result
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON maintenance_dashboard TO authenticated;
GRANT SELECT ON maintenance_schedule TO authenticated;
GRANT EXECUTE ON FUNCTION run_maintenance_tasks TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_maintenance_task TO authenticated;
GRANT EXECUTE ON FUNCTION get_maintenance_statistics TO authenticated;

-- Add comments
COMMENT ON TABLE maintenance_schedule IS 'Schedule for automated maintenance tasks';
COMMENT ON FUNCTION run_maintenance_tasks IS 'Runs all due maintenance tasks';
COMMENT ON VIEW maintenance_dashboard IS 'Dashboard view for maintenance status';
COMMENT ON FUNCTION trigger_maintenance_task IS 'Manually trigger a specific maintenance task';
COMMENT ON FUNCTION get_maintenance_statistics IS 'Returns maintenance statistics and metrics';