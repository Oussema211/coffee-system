-- Add TVA (VAT) rates and the worker FK on orders.

ALTER TABLE menu_items ADD COLUMN vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 19.00;

ALTER TABLE order_items ADD COLUMN vat_rate NUMERIC(5, 2);
UPDATE order_items SET vat_rate = 19.00 WHERE vat_rate IS NULL;
ALTER TABLE order_items ALTER COLUMN vat_rate SET NOT NULL;

-- Track which worker created/served each order via a real FK.
ALTER TABLE orders ADD COLUMN worker_id BIGINT;

-- Best-effort backfill from the legacy worker_name text column.
UPDATE orders o
SET worker_id = u.id
FROM users u
WHERE o.worker_id IS NULL
  AND o.worker_name IS NOT NULL
  AND (u.name = o.worker_name OR u.username = o.worker_name);

ALTER TABLE orders
    ADD CONSTRAINT fk_orders_worker FOREIGN KEY (worker_id) REFERENCES users (id);

CREATE INDEX IF NOT EXISTS idx_orders_worker_id ON orders (worker_id);
