-- Refresh PostgREST schema cache to recognize new foreign key relationships
NOTIFY pgrst, 'reload schema';