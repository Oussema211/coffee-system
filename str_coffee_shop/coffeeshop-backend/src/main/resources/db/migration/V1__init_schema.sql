-- Base schema matching what Hibernate's ddl-auto=update previously generated.
-- On the existing production (Supabase) database this migration is NOT run:
-- Flyway baselines that schema as version 1 via baseline-on-migrate.

CREATE TABLE IF NOT EXISTS users (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255),
    username   VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    CONSTRAINT uk_categories_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS menu_items (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    category   VARCHAR(255) NOT NULL,
    price      NUMERIC(10, 2) NOT NULL,
    available  BOOLEAN NOT NULL DEFAULT TRUE,
    image_url  VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
    id         BIGSERIAL PRIMARY KEY,
    number     INTEGER NOT NULL,
    seats      INTEGER NOT NULL,
    status     VARCHAR(255) NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP,
    CONSTRAINT uk_restaurant_tables_number UNIQUE (number)
);

CREATE TABLE IF NOT EXISTS orders (
    id           BIGSERIAL PRIMARY KEY,
    order_type   VARCHAR(255) NOT NULL,
    table_number INTEGER,
    status       VARCHAR(255) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    created_at   TIMESTAMP NOT NULL,
    worker_name  VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS order_items (
    id           BIGSERIAL PRIMARY KEY,
    order_id     BIGINT NOT NULL,
    menu_item_id BIGINT,
    name         VARCHAR(255) NOT NULL,
    unit_price   NUMERIC(10, 2) NOT NULL,
    quantity     INTEGER NOT NULL,
    paid         BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE TABLE IF NOT EXISTS worker_shifts (
    id           BIGSERIAL PRIMARY KEY,
    worker_id    BIGINT NOT NULL,
    check_in_at  TIMESTAMP NOT NULL,
    check_out_at TIMESTAMP,
    CONSTRAINT fk_worker_shifts_worker FOREIGN KEY (worker_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);
CREATE INDEX IF NOT EXISTS idx_worker_shifts_worker_id ON worker_shifts (worker_id);
