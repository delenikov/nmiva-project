CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand VARCHAR(80) NOT NULL,
    model VARCHAR(80) NOT NULL,
    year INT NOT NULL,
    fuel_type VARCHAR(40) NOT NULL,
    odometer_start NUMERIC(10, 1) NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE entries (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    odometer NUMERIC(10, 1),
    cost NUMERIC(12, 2),
    sync_status VARCHAR(32) NOT NULL DEFAULT 'synced',
    last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    liters NUMERIC(10, 3),
    price_per_liter NUMERIC(10, 3),
    is_full_tank BOOLEAN NOT NULL DEFAULT TRUE,
    service_category VARCHAR(30),
    expense_category VARCHAR(30),
    due_date DATE,
    repeat_yearly BOOLEAN NOT NULL DEFAULT FALSE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_last_modified_at ON vehicles(last_modified_at);
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_vehicle_id ON entries(vehicle_id);
CREATE INDEX idx_entries_type ON entries(type);
CREATE INDEX idx_entries_due_date ON entries(due_date);
CREATE INDEX idx_entries_created_at ON entries(created_at);
CREATE INDEX idx_entries_last_modified_at ON entries(last_modified_at);
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
