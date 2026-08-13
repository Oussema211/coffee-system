-- Item modifiers: size options, sugar level and extra shot (Tunisian coffee workflow).

ALTER TABLE menu_items
    ADD COLUMN has_sizes BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN has_sugar BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN has_extra_shot BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN extra_shot_price NUMERIC(10, 2) NOT NULL DEFAULT 0.50;

CREATE TABLE menu_item_sizes (
    id           BIGSERIAL PRIMARY KEY,
    menu_item_id BIGINT NOT NULL,
    name         VARCHAR(100) NOT NULL,
    price_delta  NUMERIC(10, 2) NOT NULL DEFAULT 0,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_menu_item_sizes_item FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
);

CREATE INDEX IF NOT EXISTS idx_menu_item_sizes_item ON menu_item_sizes (menu_item_id);

-- Order line snapshots of the chosen modifiers (price stays TVA-inclusive in unit_price).
ALTER TABLE order_items
    ADD COLUMN size VARCHAR(50),
    ADD COLUMN sugar VARCHAR(50),
    ADD COLUMN extra_shots INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN size_delta NUMERIC(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN extra_shot_price NUMERIC(10, 2) NOT NULL DEFAULT 0;
