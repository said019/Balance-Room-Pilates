-- Balance Room Pilates setup
-- Removes the previous annual inscription model and seeds the requested
-- credit packages, class types and three small studios.

UPDATE plans SET is_active = false, updated_at = NOW();

INSERT INTO plans (name, description, price, currency, duration_days, class_limit, features, is_active, sort_order)
VALUES
  ('Clase suelta', '1 clase con vigencia mensual', 200.00, 'MXN', 30, 1, '["1 clase", "Vigencia de 1 mes"]'::jsonb, true, 1),
  ('Paquete 4 clases', '4 clases con vigencia mensual', 750.00, 'MXN', 30, 4, '["4 clases", "Vigencia de 1 mes"]'::jsonb, true, 2),
  ('Paquete 8 clases', '8 clases con vigencia mensual', 1450.00, 'MXN', 30, 8, '["8 clases", "Vigencia de 1 mes", "Paquete recomendado"]'::jsonb, true, 3),
  ('Paquete 12 clases', '12 clases con vigencia mensual', 2100.00, 'MXN', 30, 12, '["12 clases", "Vigencia de 1 mes"]'::jsonb, true, 4),
  ('Paquete 24 clases', '24 clases con vigencia mensual', 2900.00, 'MXN', 30, 24, '["24 clases", "Vigencia de 1 mes", "Mejor costo por clase"]'::jsonb, true, 5)
ON CONFLICT DO NOTHING;

UPDATE class_types SET is_active = false, updated_at = NOW();

INSERT INTO class_types (name, description, level, duration_minutes, max_capacity, icon, color, is_active, visible_public)
VALUES
  ('Yoga', 'Movimiento consciente, respiracion y movilidad.', 'all', 50, 6, 'leaf', '#81836F', true, true),
  ('Hot yoga', 'Secuencias fluidas en ambiente calido.', 'all', 50, 6, 'flame', '#9A8062', true, true),
  ('Pilates mat', 'Core, postura y control con progresiones.', 'all', 50, 6, 'target', '#A2A88B', true, true),
  ('Hot Pilates', 'Pilates con intensidad, calor y energia.', 'all', 50, 6, 'flame', '#A48550', true, true),
  ('Silla wunda', 'Equipo, resistencia y correcciones puntuales.', 'all', 50, 6, 'sparkles', '#6E725F', true, true),
  ('Sculpt', 'Tonificacion full body con fuerza funcional.', 'all', 50, 6, 'waves', '#B49A73', true, true),
  ('Barre', 'Ballet, pilates y pulsos finos para postura.', 'all', 50, 6, 'sparkles', '#8C8475', true, true)
ON CONFLICT DO NOTHING;

INSERT INTO facilities (name, description, capacity)
VALUES
  ('Studio 1', 'Sala boutique Balance Room', 6),
  ('Studio 2', 'Sala boutique Balance Room', 6),
  ('Studio 3', 'Sala boutique Balance Room', 6)
ON CONFLICT DO NOTHING;

INSERT INTO system_settings (key, value, description)
VALUES
  ('studio_info', '{"name":"Balance Room Pilates","address":"Hermenegildo Galeana Int. Local 4, Centro, 76803 San Juan del Rio, Qro.","phone":"+52 427 100 7347","email":"hola@balanceroom.mx","social_media":{"instagram":"@balanceroom.pilates"}}', 'Informacion del studio'),
  ('booking_policies', '{"cancellation_hours":5,"no_show_penalty":true,"max_advance_days":14,"credits_validity_days":30,"allow_reschedule":false}', 'Politicas de reservacion')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = NOW();
