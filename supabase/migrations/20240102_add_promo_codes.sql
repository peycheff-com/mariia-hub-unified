-- Add promo codes table for discounts

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount_amount DECIMAL(10, 2),
  min_order_amount DECIMAL(10, 2),
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  valid_from DATE DEFAULT CURRENT_DATE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  applicable_services TEXT[] DEFAULT NULL,
  applicable_locations UUID[] DEFAULT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active, valid_from, expires_at);
CREATE INDEX idx_promo_codes_services ON promo_codes USING GIN(applicable_services);
CREATE INDEX idx_promo_codes_locations ON promo_codes USING GIN(applicable_locations);

-- Add trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
    BEFORE UPDATE ON promo_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample promo codes
INSERT INTO promo_codes (code, discount_type, discount_value, max_discount_amount, max_uses, expires_at) VALUES
('WELCOME10', 'percentage', 10, 50, 100, NOW() + INTERVAL '3 months'),
('SUMMER20', 'percentage', 20, 100, 50, NOW() + INTERVAL '2 months'),
('FIRST50', 'fixed', 50, NULL, 200, NOW() + INTERVAL '6 months'),
('HOLIDAY15', 'percentage', 15, 75, 150, NOW() + INTERVAL '1 month')
ON CONFLICT (code) DO NOTHING;