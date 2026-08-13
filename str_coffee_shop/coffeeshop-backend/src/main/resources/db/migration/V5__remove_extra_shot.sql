-- Remove the extra-shot modifier entirely (kept sizes + sugar).

ALTER TABLE menu_items DROP COLUMN IF EXISTS has_extra_shot;
ALTER TABLE menu_items DROP COLUMN IF EXISTS extra_shot_price;

ALTER TABLE order_items DROP COLUMN IF EXISTS extra_shots;
ALTER TABLE order_items DROP COLUMN IF EXISTS extra_shot_price;