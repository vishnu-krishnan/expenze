CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(255),
    role VARCHAR(255) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    otp_code VARCHAR(255),
    otp_expiry TIMESTAMP,
    is_verified INTEGER DEFAULT 0,
    default_budget NUMERIC(38, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    name VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    icon VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS month_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    monthkey VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_month_plans_user_month UNIQUE (user_id, monthkey)
);

CREATE TABLE IF NOT EXISTS payment_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    category_id BIGINT,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(38, 2) NOT NULL,
    type VARCHAR(255) NOT NULL,
    is_planned INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_date DATE
);

CREATE TABLE IF NOT EXISTS regular_payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    category_id BIGINT,
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(38, 2) NOT NULL,
    type VARCHAR(255) NOT NULL,
    next_payment_date DATE,
    frequency VARCHAR(255),
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salaries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    monthkey VARCHAR(255) NOT NULL,
    amount NUMERIC(38, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_salaries_user_month UNIQUE (user_id, monthkey)
);

CREATE TABLE IF NOT EXISTS system_settings (
    id BIGSERIAL PRIMARY KEY,
    key_name VARCHAR(255) UNIQUE,
    key_value VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_verifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    token VARCHAR(255),
    expiry_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_change_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    new_email VARCHAR(255),
    otp_code VARCHAR(10),
    expiry_date TIMESTAMP,
    verified BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
