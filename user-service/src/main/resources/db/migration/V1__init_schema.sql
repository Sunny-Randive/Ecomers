CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone_number VARCHAR(20)
);

CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY,
    preferred_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en'
);

CREATE TABLE addresses (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    street VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);
