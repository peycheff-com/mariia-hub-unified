-- Fix comprehensive_reviews view for service_type compatibility
-- This fixes the issue where service_type is compared incorrectly

-- Drop the existing view
DROP VIEW IF EXISTS comprehensive_reviews;

-- Recreate the view with proper service_type casting
CREATE OR REPLACE VIEW comprehensive_reviews AS
SELECT
  r.*,
  p.full_name as reviewer_name,
  p.avatar_url as reviewer_avatar,
  s.title as service_title,
  s.service_type::text as service_type,
  COALESCE(rp.photos, '{}') as photos,
  r.response_content,
  r.response_date,
  resp.full_name as responder_name,
  COALESCE(h.helpful_votes, 0) as helpful_votes,
  COALESCE(rep.report_count, 0) as report_count,
  ra.views,
  ra.engagement_score,
  rv_template.template_content as suggested_response
FROM reviews r
LEFT JOIN profiles p ON r.user_id = p.id
LEFT JOIN services s ON r.service_id = s.id
LEFT JOIN (
  SELECT
    review_id,
    array_agg(photo_url ORDER BY order_index) as photos
  FROM review_photos
  GROUP BY review_id
) rp ON r.id = rp.review_id
LEFT JOIN profiles resp ON r.response_by = resp.id
LEFT JOIN (
  SELECT
    review_id,
    COUNT(*) FILTER (WHERE is_helpful = true) as helpful_votes
  FROM review_helpful_votes
  GROUP BY review_id
) h ON r.id = h.review_id
LEFT JOIN (
  SELECT
    review_id,
    COUNT(*) as report_count
  FROM review_reports
  WHERE status != 'dismissed'
  GROUP BY review_id
) rep ON r.id = rep.review_id
LEFT JOIN review_analytics ra ON r.id = ra.review_id
LEFT JOIN review_response_templates rv_template ON
  rv_template.rating_range_start <= r.rating
  AND rv_template.rating_range_end >= r.rating
  AND (rv_template.service_type = s.service_type::text OR rv_template.service_type IS NULL);

-- Grant permissions
GRANT SELECT ON comprehensive_reviews TO authenticated;
GRANT SELECT ON comprehensive_reviews TO service_role;