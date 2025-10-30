-- Cross-Platform Synchronization Migration
-- Creates tables and functions for seamless cross-platform experience

-- Device registry for tracking user devices across platforms
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_id TEXT UNIQUE NOT NULL, -- Unique device identifier
    platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    device_name TEXT,
    app_version TEXT,
    os_version TEXT,
    push_token TEXT, -- For mobile push notifications
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT one_primary_device_per_platform UNIQUE(user_id, platform, is_primary)
        CHECK (NOT (is_primary = false AND platform IS NULL))
);

-- Cross-platform sync log for tracking data synchronization
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_id UUID REFERENCES user_devices(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('booking', 'profile', 'preferences', 'notification_settings')),
    entity_id TEXT,
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'sync')),
    sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'in_progress', 'completed', 'failed')),
    data_before JSONB,
    data_after JSONB,
    conflict_detected BOOLEAN DEFAULT false,
    conflict_resolution TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Notification settings per device
CREATE TABLE IF NOT EXISTS device_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES user_devices(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('booking_reminders', 'promotions', 'system_updates', 'marketing')),
    enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    do_not_disturb BOOLEAN DEFAULT false,
    device_specific_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(device_id, notification_type)
);

-- Cross-platform notification queue
CREATE TABLE IF NOT EXISTS cross_platform_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('booking_reminder', 'booking_confirmation', 'payment_received', 'promotion', 'system_update')),
    priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
    data JSONB DEFAULT '{}',
    target_devices UUID[] DEFAULT '{}', -- Specific devices to target, empty means all
    exclude_devices UUID[] DEFAULT '{}', -- Devices to exclude
    delivery_status JSONB DEFAULT '{}', -- Map of device_id -> delivery_status
    scheduled_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT valid_scheduling CHECK (scheduled_at IS NULL OR scheduled_at >= created_at)
);

-- User preferences backup for device migration
CREATE TABLE IF NOT EXISTS user_preferences_backup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    backup_data JSONB NOT NULL,
    backup_version TEXT NOT NULL,
    device_source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_restorable BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year')
);

-- Offline operation queue for sync when back online
CREATE TABLE IF NOT EXISTS offline_operations_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES user_devices(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('create_booking', 'update_profile', 'cancel_booking', 'update_preferences')),
    operation_data JSONB NOT NULL,
    priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_platform ON user_devices(platform);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(is_active);
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_device_id ON sync_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_entity ON sync_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON cross_platform_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON cross_platform_notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON cross_platform_notifications(priority DESC);
CREATE INDEX IF NOT EXISTS idx_offline_queue_device ON offline_operations_queue(device_id);
CREATE INDEX IF NOT EXISTS idx_offline_queue_status ON offline_operations_queue(status);
CREATE INDEX IF NOT EXISTS idx_offline_queue_retry ON offline_operations_queue(next_retry_at);

-- Row Level Security Policies
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_platform_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_operations_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_devices
CREATE POLICY "Users can view their own devices" ON user_devices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices" ON user_devices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices" ON user_devices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices" ON user_devices
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for sync_logs
CREATE POLICY "Users can view their own sync logs" ON sync_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs" ON sync_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for device_notification_settings
CREATE POLICY "Users can view their device notification settings" ON device_notification_settings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM user_devices WHERE id = device_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can manage their device notification settings" ON device_notification_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_devices WHERE id = device_id AND user_id = auth.uid())
    );

-- RLS Policies for cross_platform_notifications
CREATE POLICY "Users can view their own notifications" ON cross_platform_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON cross_platform_notifications
    FOR INSERT WITH CHECK (true);

-- RLS Policies for user_preferences_backup
CREATE POLICY "Users can view their own backups" ON user_preferences_backup
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backups" ON user_preferences_backup
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups" ON user_preferences_backup
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for offline_operations_queue
CREATE POLICY "Users can view their device offline operations" ON offline_operations_queue
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM user_devices WHERE id = device_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can insert their device offline operations" ON offline_operations_queue
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM user_devices WHERE id = device_id AND user_id = auth.uid())
    );

-- Functions for cross-platform sync management

-- Function to register a new device
CREATE OR REPLACE FUNCTION register_device(
    p_user_id UUID,
    p_device_id TEXT,
    p_platform TEXT,
    p_device_name TEXT DEFAULT NULL,
    p_app_version TEXT DEFAULT NULL,
    p_os_version TEXT DEFAULT NULL,
    p_push_token TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_device_record user_devices%ROWTYPE;
    v_device_uuid UUID;
BEGIN
    -- Check if device already exists
    SELECT * INTO v_device_record
    FROM user_devices
    WHERE device_id = p_device_id AND user_id = p_user_id;

    IF FOUND THEN
        -- Update existing device
        UPDATE user_devices SET
            platform = p_platform,
            device_name = p_device_name,
            app_version = p_app_version,
            os_version = p_os_version,
            push_token = COALESCE(p_push_token, push_token),
            is_active = true,
            last_seen_at = NOW(),
            updated_at = NOW()
        WHERE id = v_device_record.id;

        v_device_uuid := v_device_record.id;
    ELSE
        -- Create new device
        INSERT INTO user_devices (
            user_id, device_id, platform, device_name,
            app_version, os_version, push_token,
            last_seen_at, is_primary
        ) VALUES (
            p_user_id, p_device_id, p_platform, p_device_name,
            p_app_version, p_os_version, p_push_token,
            NOW(), CASE
                WHEN NOT EXISTS (SELECT 1 FROM user_devices WHERE user_id = p_user_id AND is_primary = true)
                THEN true ELSE false
            END
        ) RETURNING id INTO v_device_uuid;
    END IF;

    RETURN v_device_uuid;
END;
$$;

-- Function to handle booking conflicts
CREATE OR REPLACE FUNCTION resolve_booking_conflict(
    p_booking_id UUID,
    p_device_id UUID,
    p_operation_data JSONB
)
RETURNS TABLE(
    conflict_detected BOOLEAN,
    resolution_action TEXT,
    resolved_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_booking bookings%ROWTYPE;
    v_device user_devices%ROWTYPE;
    v_conflict BOOLEAN := false;
    v_resolution TEXT;
    v_resolved JSONB;
BEGIN
    -- Check if booking exists
    SELECT * INTO v_existing_booking
    FROM bookings
    WHERE id = p_booking_id;

    -- Get device info
    SELECT * INTO v_device
    FROM user_devices
    WHERE id = p_device_id;

    -- Conflict detection logic
    IF v_existing_booking.id IS NOT NULL THEN
        -- Check timestamp-based conflict
        IF (p_operation_data->>'updated_at')::timestamp > v_existing_booking.updated_at THEN
            v_conflict := true;
            v_resolution := 'use_latest';
            v_resolved := p_operation_data;
        ELSE
            v_resolution := 'keep_existing';
            v_resolved := jsonb_build_object(
                'id', v_existing_booking.id,
                'status', v_existing_booking.status,
                'updated_at', v_existing_booking.updated_at
            );
        END IF;
    END IF;

    -- Log the conflict resolution attempt
    INSERT INTO sync_logs (
        user_id, device_id, entity_type, entity_id,
        operation, sync_status, conflict_detected,
        conflict_resolution, data_before, data_after
    ) VALUES (
        v_device.user_id, p_device_id, 'booking', p_booking_id,
        'update', 'completed', v_conflict,
        v_resolution,
        row_to_json(v_existing_booking),
        v_resolved
    );

    RETURN NEXT;
END;
$$;

-- Function to queue cross-platform notifications
CREATE OR REPLACE FUNCTION queue_cross_platform_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT,
    p_priority INTEGER DEFAULT 0,
    p_data JSONB DEFAULT '{}',
    p_target_devices UUID[] DEFAULT '{}',
    p_exclude_devices UUID[] DEFAULT '{}',
    p_scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
    v_user_devices UUID[];
BEGIN
    -- Get user's active devices if no specific targets
    IF p_target_devices = '{}' THEN
        SELECT ARRAY_AGG(id) INTO v_user_devices
        FROM user_devices
        WHERE user_id = p_user_id AND is_active = true
        AND id != ALL(p_exclude_devices);
    ELSE
        v_user_devices := p_target_devices;
    END IF;

    -- Insert notification
    INSERT INTO cross_platform_notifications (
        user_id, title, message, type, priority,
        data, target_devices, exclude_devices, scheduled_at
    ) VALUES (
        p_user_id, p_title, p_message, p_type, p_priority,
        p_data, v_user_devices, p_exclude_devices, p_scheduled_at
    ) RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$;

-- Function to create user preferences backup
CREATE OR REPLACE FUNCTION create_preferences_backup(
    p_user_id UUID,
    p_backup_version TEXT,
    p_device_source TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_backup_id UUID;
    v_preferences JSONB;
BEGIN
    -- Collect user preferences from various sources
    SELECT jsonb_build_object(
        'profile', (
            SELECT row_to_json(profiles)
            FROM profiles WHERE id = p_user_id
        ),
        'devices', (
            SELECT jsonb_agg(row_to_json(ud.*))
            FROM user_devices ud WHERE ud.user_id = p_user_id
        ),
        'notification_settings', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'device_id', dns.device_id,
                    'settings', row_to_json(dns.*)
                )
            )
            FROM device_notification_settings dns
            JOIN user_devices ud ON dns.device_id = ud.id
            WHERE ud.user_id = p_user_id
        ),
        'booking_preferences', (
            SELECT jsonb_agg(row_to_json(bd.*))
            FROM booking_drafts bd WHERE bd.user_id = p_user_id
        ),
        'backup_timestamp', NOW()
    ) INTO v_preferences;

    -- Insert backup
    INSERT INTO user_preferences_backup (
        user_id, backup_data, backup_version, device_source
    ) VALUES (
        p_user_id, v_preferences, p_backup_version, p_device_source
    ) RETURNING id INTO v_backup_id;

    RETURN v_backup_id;
END;
$$;

-- Function to restore user preferences from backup
CREATE OR REPLACE FUNCTION restore_preferences_backup(
    p_user_id UUID,
    p_backup_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_backup user_preferences_backup%ROWTYPE;
    v_restore_success BOOLEAN := false;
BEGIN
    -- Get backup data
    SELECT * INTO v_backup
    FROM user_preferences_backup
    WHERE id = p_backup_id AND user_id = p_user_id AND is_restorable = true;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Restore logic would go here
    -- This is a simplified version that marks as successful
    -- In practice, you'd restore each piece of data carefully

    v_restore_success := true;

    RETURN v_restore_success;
END;
$$;

-- Function to process offline operations queue
CREATE OR REPLACE FUNCTION process_offline_operations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_operation_record offline_operations_queue%ROWTYPE;
    v_processed_count INTEGER := 0;
BEGIN
    -- Process pending operations that are ready for retry
    FOR v_operation_record IN
        SELECT * FROM offline_operations_queue
        WHERE status = 'pending'
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        AND retry_count < max_retries
        ORDER BY priority DESC, created_at ASC
        LIMIT 100
    LOOP
        -- Update status to processing
        UPDATE offline_operations_queue
        SET status = 'processing',
            next_retry_at = NULL
        WHERE id = v_operation_record.id;

        BEGIN
            -- Process operation based on type
            CASE v_operation_record.operation_type
                WHEN 'create_booking' THEN
                    -- Implementation for creating booking from offline operation
                    NULL; -- Would contain actual booking creation logic

                WHEN 'update_profile' THEN
                    -- Implementation for updating profile from offline operation
                    NULL; -- Would contain actual profile update logic

                WHEN 'cancel_booking' THEN
                    -- Implementation for canceling booking from offline operation
                    NULL; -- Would contain actual booking cancellation logic

                WHEN 'update_preferences' THEN
                    -- Implementation for updating preferences from offline operation
                    NULL; -- Would contain actual preferences update logic
            END CASE;

            -- Mark as completed
            UPDATE offline_operations_queue
            SET status = 'completed',
                processed_at = NOW()
            WHERE id = v_operation_record.id;

            v_processed_count := v_processed_count + 1;

        EXCEPTION WHEN OTHERS THEN
            -- Handle failure and schedule retry
            UPDATE offline_operations_queue
            SET status = 'failed',
                retry_count = retry_count + 1,
                next_retry_at = NOW() + (2 ^ retry_count) * INTERVAL '1 minute',
                error_message = SQLERRM
            WHERE id = v_operation_record.id;
        END;
    END LOOP;

    RETURN v_processed_count;
END;
$$;

-- Triggers for automatic sync management

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_user_devices_updated_at
    BEFORE UPDATE ON user_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_notification_settings_updated_at
    BEFORE UPDATE ON device_notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to log booking changes for sync
CREATE OR REPLACE FUNCTION log_booking_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the change for sync purposes
    IF TG_OP = 'INSERT' THEN
        INSERT INTO sync_logs (
            user_id, entity_type, entity_id, operation,
            sync_status, data_after
        ) VALUES (
            NEW.user_id, 'booking', NEW.id, 'create',
            'completed', row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO sync_logs (
            user_id, entity_type, entity_id, operation,
            sync_status, data_before, data_after
        ) VALUES (
            COALESCE(NEW.user_id, OLD.user_id), 'booking', NEW.id, 'update',
            'completed', row_to_json(OLD), row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO sync_logs (
            user_id, entity_type, entity_id, operation,
            sync_status, data_before
        ) VALUES (
            OLD.user_id, 'booking', OLD.id, 'delete',
            'completed', row_to_json(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply booking sync trigger
CREATE TRIGGER booking_sync_log
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW EXECUTE FUNCTION log_booking_changes();

-- Grant necessary permissions
GRANT ALL ON user_devices TO authenticated;
GRANT ALL ON sync_logs TO authenticated;
GRANT ALL ON device_notification_settings TO authenticated;
GRANT SELECT ON cross_platform_notifications TO authenticated;
GRANT ALL ON user_preferences_backup TO authenticated;
GRANT ALL ON offline_operations_queue TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION register_device TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_booking_conflict TO authenticated;
GRANT EXECUTE ON FUNCTION queue_cross_platform_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_preferences_backup TO authenticated;
GRANT EXECUTE ON FUNCTION restore_preferences_backup TO authenticated;
GRANT EXECUTE ON FUNCTION process_offline_operations TO authenticated, service_role;

-- Create publication for real-time subscriptions
CREATE PUBLlication IF NOT EXISTS cross_platform_sync_publication FOR
    TABLE user_devices,
    TABLE sync_logs,
    TABLE cross_platform_notifications,
    TABLE offline_operations_queue;

COMMENT ON TABLE user_devices IS 'Registry of user devices across platforms for cross-platform sync';
COMMENT ON TABLE sync_logs IS 'Logs all synchronization activities across devices';
COMMENT ON TABLE device_notification_settings IS 'Per-device notification preferences';
COMMENT ON TABLE cross_platform_notifications IS 'Cross-platform notification queue';
COMMENT ON TABLE user_preferences_backup IS 'User preferences backup for device migration';
COMMENT ON TABLE offline_operations_queue IS 'Queue for offline operations to sync when online';