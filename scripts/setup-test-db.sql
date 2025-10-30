-- Test Database Setup Script
-- This script sets up the necessary database schema and test data for automated testing

-- Create test database if it doesn't exist
CREATE DATABASE IF NOT EXISTS test_db;

-- Connect to test database
\c test_db;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create test schemas
CREATE SCHEMA IF NOT EXISTS test_schema;
CREATE SCHEMA IF NOT EXISTS test_audit;

-- Create test users and roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'test_user') THEN
        CREATE ROLE test_user WITH LOGIN PASSWORD 'test_password';
    END IF;
END
$$;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE test_db TO test_user;
GRANT ALL ON SCHEMA public TO test_user;
GRANT ALL ON SCHEMA test_schema TO test_user;
GRANT ALL ON SCHEMA test_audit TO test_user;

-- Create test tables with simplified structure for faster testing

-- Test Users table
CREATE TABLE IF NOT EXISTS test_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'customer',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Services table
CREATE TABLE IF NOT EXISTS test_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('beauty', 'fitness', 'lifestyle')),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    duration INTEGER NOT NULL CHECK (duration > 0), -- in minutes
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Availability Slots table
CREATE TABLE IF NOT EXISTS test_availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES test_services(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL CHECK (end_time > start_time),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
    max_bookings INTEGER DEFAULT 1 CHECK (max_bookings > 0),
    current_bookings INTEGER DEFAULT 0 CHECK (current_bookings >= 0),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_bookings_not_exceed_max CHECK (current_bookings <= max_bookings)
);

-- Test Bookings table
CREATE TABLE IF NOT EXISTS test_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES test_services(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES test_users(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES test_availability_slots(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL CHECK (end_time > start_time),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no-show')),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Payment Intent table
CREATE TABLE IF NOT EXISTS test_payment_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES test_bookings(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'PLN',
    status VARCHAR(50) DEFAULT 'pending',
    client_secret VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Audit Log table
CREATE TABLE IF NOT EXISTS test_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES test_users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_users_email ON test_users(email);
CREATE INDEX IF NOT EXISTS idx_test_users_role ON test_users(role);
CREATE INDEX IF NOT EXISTS idx_test_services_category ON test_services(category);
CREATE INDEX IF NOT EXISTS idx_test_services_status ON test_services(status);
CREATE INDEX IF NOT EXISTS idx_test_availability_slots_service_id ON test_availability_slots(service_id);
CREATE INDEX IF NOT EXISTS idx_test_availability_slots_time_range ON test_availability_slots(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_test_availability_slots_status ON test_availability_slots(status);
CREATE INDEX IF NOT EXISTS idx_test_bookings_user_id ON test_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_test_bookings_service_id ON test_bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_test_bookings_status ON test_bookings(status);
CREATE INDEX IF NOT EXISTS idx_test_bookings_start_time ON test_bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_test_payment_intents_booking_id ON test_payment_intents(booking_id);
CREATE INDEX IF NOT EXISTS idx_test_payment_intents_status ON test_payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_test_audit_log_table_record ON test_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_test_audit_log_timestamp ON test_audit_log(timestamp);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_test_users_updated_at BEFORE UPDATE ON test_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_services_updated_at BEFORE UPDATE ON test_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_availability_slots_updated_at BEFORE UPDATE ON test_availability_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_bookings_updated_at BEFORE UPDATE ON test_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_payment_intents_updated_at BEFORE UPDATE ON test_payment_intents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO test_audit_log (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), NULL);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO test_audit_log (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), NULL);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO test_audit_log (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), NULL);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_test_users AFTER INSERT OR UPDATE OR DELETE ON test_users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_test_services AFTER INSERT OR UPDATE OR DELETE ON test_services
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_test_bookings AFTER INSERT OR UPDATE OR DELETE ON test_bookings
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Insert test data
INSERT INTO test_users (id, email, full_name, phone, role) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'test.customer@example.com', 'Test Customer', '+1234567890', 'customer'),
    ('550e8400-e29b-41d4-a716-446655440002', 'test.provider@example.com', 'Test Provider', '+0987654321', 'provider'),
    ('550e8400-e29b-41d4-a716-446655440003', 'test.admin@example.com', 'Test Admin', '+1122334455', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO test_services (id, title, description, category, price, duration, status) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'Test Lip Enhancement', 'Professional lip enhancement service for testing', 'beauty', 250.00, 60, 'active'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Test Brow Shaping', 'Professional brow shaping service for testing', 'beauty', 80.00, 30, 'active'),
    ('660e8400-e29b-41d4-a716-446655440003', 'Test Personal Training', 'One-on-one personal training session for testing', 'fitness', 150.00, 45, 'active'),
    ('660e8400-e29b-41d4-a716-446655440004', 'Test Yoga Class', 'Group yoga class for testing', 'fitness', 50.00, 60, 'inactive')
ON CONFLICT (id) DO NOTHING;

-- Insert test availability slots
INSERT INTO test_availability_slots (id, service_id, start_time, end_time, status, max_bookings, current_bookings) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', 'available', 1, 0),
    ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 'available', 1, 0),
    ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '30 minutes', 'available', 2, 0),
    ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '45 minutes', 'booked', 3, 3)
ON CONFLICT (id) DO NOTHING;

-- Create functions for test scenarios

-- Function to create a test booking
CREATE OR REPLACE FUNCTION create_test_booking(
    p_service_id UUID,
    p_user_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_total_price DECIMAL(10,2)
) RETURNS UUID AS $$
DECLARE
    v_booking_id UUID;
    v_end_time TIMESTAMP WITH TIME ZONE;
BEGIN
    v_end_time := p_start_time + (SELECT duration FROM test_services WHERE id = p_service_id) * INTERVAL '1 minute';

    INSERT INTO test_bookings (service_id, user_id, start_time, end_time, total_price, status)
    VALUES (p_service_id, p_user_id, p_start_time, v_end_time, p_total_price, 'pending')
    RETURNING id INTO v_booking_id;

    RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get available slots for a service
CREATE OR REPLACE FUNCTION get_available_slots(
    p_service_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE (
    slot_id UUID,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    max_bookings INTEGER,
    current_bookings INTEGER,
    available_spots INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.start_time,
        s.end_time,
        s.max_bookings,
        s.current_bookings,
        (s.max_bookings - s.current_bookings) as available_spots
    FROM test_availability_slots s
    WHERE s.service_id = p_service_id
        AND s.status = 'available'
        AND DATE(s.start_time) BETWEEN p_start_date AND p_end_date
        AND s.current_bookings < s.max_bookings
    ORDER BY s.start_time;
END;
$$ LANGUAGE plpgsql;

-- Function to simulate slot booking
CREATE OR REPLACE FUNCTION book_slot(
    p_slot_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_bookings INTEGER;
    v_max_bookings INTEGER;
BEGIN
    -- Get current slot state
    SELECT current_bookings, max_bookings INTO v_current_bookings, v_max_bookings
    FROM test_availability_slots
    WHERE id = p_slot_id AND status = 'available'
    FOR UPDATE;

    -- Check if slot is available
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_current_bookings >= v_max_bookings THEN
        RETURN FALSE;
    END IF;

    -- Update slot
    UPDATE test_availability_slots
    SET current_bookings = current_bookings + 1,
        status = CASE
            WHEN current_bookings + 1 >= max_bookings THEN 'booked'
            ELSE 'available'
        END,
        updated_at = NOW()
    WHERE id = p_slot_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up test data
CREATE OR REPLACE FUNCTION cleanup_test_data() RETURNS VOID AS $$
BEGIN
    -- Clean up in correct order respecting foreign key constraints
    DELETE FROM test_payment_intents;
    DELETE FROM test_bookings;
    DELETE FROM test_availability_slots;
    DELETE FROM test_services WHERE title LIKE 'Test%';
    DELETE FROM test_users WHERE email LIKE 'test%';
    DELETE FROM test_audit_log WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create view for test reporting
CREATE OR REPLACE VIEW test_report_view AS
SELECT
    s.title as service_title,
    s.category,
    COUNT(b.id) as total_bookings,
    COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
    AVG(b.total_price) as average_booking_value,
    SUM(b.total_price) as total_revenue
FROM test_services s
LEFT JOIN test_bookings b ON s.id = b.service_id
GROUP BY s.id, s.title, s.category
ORDER BY total_revenue DESC;

-- Grant permissions to test user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA test_schema TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO test_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA test_schema TO test_user;

-- Vacuum analyze for better performance
VACUUM ANALYZE;

-- Log setup completion
INSERT INTO test_audit_log (table_name, record_id, action, new_values)
VALUES ('database_setup', uuid_generate_v4(), 'INSERT', json_build_object('message', 'Test database setup completed', 'timestamp', NOW()));

-- Setup completed successfully
SELECT 'Test database setup completed successfully' as status;