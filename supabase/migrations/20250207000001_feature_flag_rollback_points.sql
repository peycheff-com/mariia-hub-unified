-- Add rollback points table for feature flag audit service

CREATE TABLE IF NOT EXISTS feature_flag_rollback_points (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  flag_snapshot JSONB NOT NULL,
  changes JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_id CHECK (id ~ '^rollback_[0-9]+_[a-z0-9]+$')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_flag_rollback_points_created_at ON feature_flag_rollback_points(created_at);
CREATE INDEX IF NOT EXISTS idx_feature_flag_rollback_points_created_by ON feature_flag_rollback_points(created_by);

-- Row Level Security
ALTER TABLE feature_flag_rollback_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all rollback points" ON feature_flag_rollback_points
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can create rollback points" ON feature_flag_rollback_points
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete rollback points" ON feature_flag_rollback_points
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON feature_flag_rollback_points TO authenticated;