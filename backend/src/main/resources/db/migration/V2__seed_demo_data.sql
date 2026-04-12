INSERT INTO users (email, password_hash, display_name)
VALUES ('demo@nmiva.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOHiW4qvQ8XfWf9eKJeNEqXWiwxupCSvW', 'Demo User')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_settings (user_id, currency, push_enabled)
SELECT id, 'EUR', TRUE
FROM users
WHERE email = 'demo@nmiva.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO vehicles (user_id, brand, model, year, fuel_type, odometer_start)
SELECT u.id, 'Toyota', 'Corolla', 2018, 'petrol', 120500
FROM users u
WHERE u.email = 'demo@nmiva.local'
  AND NOT EXISTS (
    SELECT 1 FROM vehicles v WHERE v.user_id = u.id AND v.brand = 'Toyota' AND v.model = 'Corolla'
);

INSERT INTO vehicles (user_id, brand, model, year, fuel_type, odometer_start)
SELECT u.id, 'Volkswagen', 'Golf', 2016, 'diesel', 184000
FROM users u
WHERE u.email = 'demo@nmiva.local'
  AND NOT EXISTS (
    SELECT 1 FROM vehicles v WHERE v.user_id = u.id AND v.brand = 'Volkswagen' AND v.model = 'Golf'
);

INSERT INTO entries (
    vehicle_id,
    user_id,
    type,
    date,
    title,
    notes,
    odometer,
    cost,
    liters,
    price_per_liter,
    is_full_tank,
    service_category,
    expense_category,
    due_date,
    repeat_yearly,
    completed
)
SELECT
    v.id,
    u.id,
    data.type,
    data.event_date,
    data.title,
    data.notes,
    data.odometer,
    data.cost,
    data.liters,
    data.price_per_liter,
    data.is_full_tank,
    data.service_category,
    data.expense_category,
    data.due_date,
    data.repeat_yearly,
    data.completed
FROM users u
JOIN vehicles v ON v.user_id = u.id AND v.brand = 'Toyota' AND v.model = 'Corolla'
JOIN (
    VALUES
      ('refuel', CURRENT_DATE - INTERVAL '20 days', 'Refuel station A', 'Daily commute refill', 120900::NUMERIC, 45.20::NUMERIC, 31.10::NUMERIC, 1.453::NUMERIC, TRUE, NULL, NULL, NULL, FALSE, FALSE),
      ('refuel', CURRENT_DATE - INTERVAL '10 days', 'Refuel station B', 'Weekend trip', 121320::NUMERIC, 48.95::NUMERIC, 33.40::NUMERIC, 1.466::NUMERIC, TRUE, NULL, NULL, NULL, FALSE, FALSE),
      ('service', CURRENT_DATE - INTERVAL '45 days', 'Oil and filter change', 'Annual maintenance', 120700::NUMERIC, 120.00::NUMERIC, NULL, NULL, TRUE, 'oil', NULL, NULL, FALSE, FALSE),
      ('expense', CURRENT_DATE - INTERVAL '5 days', 'Parking downtown', 'Work meeting parking', NULL, 9.50::NUMERIC, NULL, NULL, TRUE, NULL, 'parking', NULL, FALSE, FALSE),
      ('reminder', CURRENT_DATE - INTERVAL '2 days', 'Registration renewal', 'Renew before fine period', NULL, NULL, NULL, NULL, TRUE, NULL, NULL, CURRENT_DATE - INTERVAL '1 day', TRUE, FALSE),
      ('reminder', CURRENT_DATE, 'Insurance payment', 'Pay annual insurance', NULL, NULL, NULL, NULL, TRUE, NULL, NULL, CURRENT_DATE + INTERVAL '7 days', FALSE, FALSE)
) AS data(
    type,
    event_date,
    title,
    notes,
    odometer,
    cost,
    liters,
    price_per_liter,
    is_full_tank,
    service_category,
    expense_category,
    due_date,
    repeat_yearly,
    completed
) ON TRUE
WHERE u.email = 'demo@nmiva.local'
  AND NOT EXISTS (
    SELECT 1
    FROM entries e
    WHERE e.user_id = u.id
      AND e.vehicle_id = v.id
      AND e.title = data.title
      AND e.type = data.type
);
