-- Replace the free-text menu_items.category column with a real FK to categories.

-- Create a Category row for every distinct legacy category name.
INSERT INTO categories (name, description, created_at, updated_at)
SELECT DISTINCT mi.category, NULL, now(), now()
FROM menu_items mi
WHERE mi.category IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM categories c WHERE LOWER(c.name) = LOWER(mi.category)
  );

ALTER TABLE menu_items ADD COLUMN category_id BIGINT;

UPDATE menu_items mi
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) = LOWER(mi.category);

ALTER TABLE menu_items ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE menu_items
    ADD CONSTRAINT fk_menu_items_category FOREIGN KEY (category_id) REFERENCES categories (id);

CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items (category_id);

ALTER TABLE menu_items DROP COLUMN category;
