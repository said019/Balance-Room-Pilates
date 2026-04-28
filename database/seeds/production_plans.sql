-- ============================================
-- PRODUCTION PLANS SEED
-- ============================================
-- These are the plans currently active for Balance Room Pilates

-- Disable existing plans first to avoid duplicates/confusion if re-seeding
UPDATE plans SET is_active = false;

INSERT INTO plans (name, price, duration_days, class_limit, description, features, is_active, sort_order) VALUES
('Clase suelta', 200.00, 30, 1, '1 clase con vigencia mensual', '["1 clase", "Vigencia de 1 mes"]'::jsonb, true, 1),
('Paquete 4 clases', 750.00, 30, 4, '4 clases con vigencia mensual', '["4 clases", "Vigencia de 1 mes"]'::jsonb, true, 2),
('Paquete 8 clases', 1450.00, 30, 8, '8 clases con vigencia mensual', '["8 clases", "Vigencia de 1 mes", "Paquete recomendado"]'::jsonb, true, 3),
('Paquete 12 clases', 2100.00, 30, 12, '12 clases con vigencia mensual', '["12 clases", "Vigencia de 1 mes"]'::jsonb, true, 4),
('Paquete 24 clases', 2900.00, 30, 24, '24 clases con vigencia mensual', '["24 clases", "Vigencia de 1 mes", "Mejor costo por clase"]'::jsonb, true, 5);
