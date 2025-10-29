-- Translation Memory System
-- Stores translated segments for reuse and consistency

-- Translation Memory Table
CREATE TABLE IF NOT EXISTS translation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT NOT NULL,
  target_text TEXT NOT NULL,
  source_lang VARCHAR(10) NOT NULL,
  target_lang VARCHAR(10) NOT NULL,
  context TEXT,
  category VARCHAR(100),
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 5),
  usage_count INTEGER DEFAULT 0 NOT NULL,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  approved BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- Translation Projects Table
CREATE TABLE IF NOT EXISTS translation_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  source_lang VARCHAR(10) NOT NULL,
  target_langs TEXT[] NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'review', 'completed')),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100)
);

-- Translation Tasks Table
CREATE TABLE IF NOT EXISTS translation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES translation_projects(id) ON DELETE CASCADE,
  source_text TEXT NOT NULL,
  context TEXT,
  category VARCHAR(100) DEFAULT 'general',
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'rejected')),
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  notes TEXT,
  word_count INTEGER GENERATED ALWAYS AS (array_length(string_to_array(source_text, ' '), 1)) STORED,
  character_count INTEGER GENERATED ALWAYS AS (length(source_text)) STORED
);

-- Translations Table
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES translation_tasks(id) ON DELETE CASCADE,
  translator_id UUID REFERENCES auth.users(id) NOT NULL,
  target_text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 5),
  notes TEXT,
  tm_matches INTEGER DEFAULT 0,
  time_spent INTEGER, -- in minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translation Comments Table
CREATE TABLE IF NOT EXISTS translation_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_id UUID REFERENCES translations(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translation History Table
CREATE TABLE IF NOT EXISTS translation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_id UUID REFERENCES translations(id) ON DELETE CASCADE,
  old_value TEXT,
  new_value TEXT NOT NULL,
  field VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES auth.users(id) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_translation_memory_lang_pair ON translation_memory(source_lang, target_lang);
CREATE INDEX idx_translation_memory_source ON translation_memory USING gin(to_tsvector('english', source_text));
CREATE INDEX idx_translation_memory_target ON translation_memory USING gin(to_tsvector('english', target_text));
CREATE INDEX idx_translation_memory_category ON translation_memory(category);
CREATE INDEX idx_translation_memory_approved ON translation_memory(approved);
CREATE INDEX idx_translation_memory_usage ON translation_memory(usage_count DESC);

CREATE INDEX idx_translation_tasks_project ON translation_tasks(project_id);
CREATE INDEX idx_translation_tasks_status ON translation_tasks(status);
CREATE INDEX idx_translation_tasks_assigned ON translation_tasks(assigned_to);
CREATE INDEX idx_translation_tasks_priority ON translation_tasks(priority);

CREATE INDEX idx_translations_task ON translations(task_id);
CREATE INDEX idx_translations_translator ON translations(translator_id);
CREATE INDEX idx_translations_status ON translations(status);

-- RLS Policies
ALTER TABLE translation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_history ENABLE ROW LEVEL SECURITY;

-- Translation Memory Policies
CREATE POLICY "Anyone can view approved translations" ON translation_memory
  FOR SELECT USING (approved = true);

CREATE POLICY "Translators can view all translations" ON translation_memory
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles
      WHERE role IN ('translator', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Translators can insert translations" ON translation_memory
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles
      WHERE role IN ('translator', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Translators can update translations" ON translation_memory
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles
      WHERE role IN ('translator', 'admin', 'super_admin')
    )
  );

-- Translation Projects Policies
CREATE POLICY "Users can view their projects" ON translation_projects
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Admins can view all projects" ON translation_projects
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles
      WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can create projects" ON translation_projects
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their projects" ON translation_projects
  FOR UPDATE USING (created_by = auth.uid());

-- Translation Tasks Policies
CREATE POLICY "Translators can view available tasks" ON translation_tasks
  FOR SELECT USING (
    status = 'pending' OR
    assigned_to = auth.uid() OR
    auth.uid() IN (
      SELECT user_id FROM user_roles
      WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Translators can claim tasks" ON translation_tasks
  FOR UPDATE USING (
    status = 'pending' AND
    assigned_to IS NULL AND
    auth.uid() IN (
      SELECT user_id FROM user_roles
      WHERE role IN ('translator', 'admin', 'super_admin')
    )
  );

-- Translations Policies
CREATE POLICY "Translators can view their translations" ON translations
  FOR SELECT USING (
    translator_id = auth.uid() OR
    auth.uid() IN (
      SELECT user_id FROM user_roles
      WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Translators can create translations" ON translations
  FOR INSERT WITH CHECK (
    translator_id = auth.uid()
  );

CREATE POLICY "Translators can update their translations" ON translations
  FOR UPDATE USING (
    translator_id = auth.uid() OR
    auth.uid() IN (
      SELECT user_id FROM user_roles
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Functions

-- Function to increment translation usage
CREATE OR REPLACE FUNCTION increment_translation_usage(translation_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE translation_memory
  SET usage_count = usage_count + 1,
      last_used = NOW()
  WHERE id = translation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update project progress
CREATE OR REPLACE FUNCTION update_project_progress(project_id UUID)
RETURNS VOID AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  progress INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_tasks
  FROM translation_tasks
  WHERE project_id = update_project_progress.project_id;

  SELECT COUNT(*) INTO completed_tasks
  FROM translation_tasks
  WHERE project_id = update_project_progress.project_id
    AND status = 'completed';

  IF total_tasks > 0 THEN
    progress := ROUND((completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100);
  ELSE
    progress := 0;
  END IF;

  UPDATE translation_projects
  SET progress = progress,
      status = CASE
        WHEN progress = 100 THEN 'completed'
        WHEN progress > 0 THEN 'active'
        ELSE 'draft'
      END,
      updated_at = NOW()
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update project progress when task status changes
CREATE OR REPLACE FUNCTION trigger_update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM update_project_progress(NEW.project_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_progress_trigger
  AFTER UPDATE ON translation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_project_progress();

-- Function to find best TM matches
CREATE OR REPLACE FUNCTION find_tm_matches(
  source_text TEXT,
  source_lang VARCHAR(10),
  target_lang VARCHAR(10),
  min_score DECIMAL DEFAULT 0.7,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  target_text TEXT,
  score DECIMAL,
  usage_count INTEGER,
  approved BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tm.id,
    tm.target_text,
    CASE
      WHEN tm.source_text = source_text THEN 1.0
      ELSE similarity(tm.source_text, source_text)
    END as score,
    tm.usage_count,
    tm.approved
  FROM translation_memory tm
  WHERE tm.source_lang = find_tm_matches.source_lang
    AND tm.target_lang = find_tm_matches.target_lang
    AND (
      tm.source_text = source_text OR
      similarity(tm.source_text, source_text) >= min_score
    )
  ORDER BY
    CASE
      WHEN tm.source_text = source_text THEN 1
      ELSE 2
    END,
    score DESC,
    tm.usage_count DESC,
    tm.approved DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Enable pg_trgm extension for similarity function
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Initialize with some common translations
INSERT INTO translation_memory (source_text, target_text, source_lang, target_lang, category, approved, created_by) VALUES
  ('Book Now', 'Zarezerwuj teraz', 'en', 'pl', 'general', true, null),
  ('Beauty Services', 'Usługi piękności', 'en', 'pl', 'general', true, null),
  ('Fitness Programs', 'Programy fitness', 'en', 'pl', 'general', true, null),
  ('About Us', 'O nas', 'en', 'pl', 'general', true, null),
  ('Contact', 'Kontakt', 'en', 'pl', 'general', true, null),
  ('Privacy Policy', 'Polityka prywatności', 'en', 'pl', 'legal', true, null),
  ('Terms of Service', 'Regulamin', 'en', 'pl', 'legal', true, null),
  ('Price', 'Cena', 'en', 'pl', 'general', true, null),
  ('Duration', 'Czas trwania', 'en', 'pl', 'general', true, null),
  ('Book an Appointment', 'Umów wizytę', 'en', 'pl', 'booking', true, null)
ON CONFLICT DO NOTHING;