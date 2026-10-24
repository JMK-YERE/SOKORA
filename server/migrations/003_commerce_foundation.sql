-- SOKORA commerce foundation (additive, non-destructive).
-- Apply manually to the verified SOKORA Neon project/branch after reviewing.
BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED','DISPUTED','REFUND_REQUESTED','REFUNDED')),
  subtotal_tzs NUMERIC(14,2) NOT NULL CHECK (subtotal_tzs >= 0),
  delivery_fee_tzs NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (delivery_fee_tzs >= 0),
  total_tzs NUMERIC(14,2) NOT NULL CHECK (total_tzs >= 0),
  delivery_name TEXT,
  delivery_phone TEXT,
  delivery_address TEXT,
  buyer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  unit_price_tzs NUMERIC(14,2) NOT NULL CHECK (unit_price_tzs >= 0),
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  line_total_tzs NUMERIC(14,2) NOT NULL CHECK (line_total_tzs >= 0)
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_created ON orders (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller_created ON orders (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (buyer_id <> seller_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_participants_product
  ON conversations (buyer_id, seller_id, COALESCE(product_id, 0));
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 4000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages (conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS saved_products (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);
CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT CHECK (body IS NULL OR length(body) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_product_created ON product_reviews (product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  target_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS live_session_products (
  live_session_id BIGINT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  pinned_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (live_session_id, product_id)
);

CREATE TABLE IF NOT EXISTS affiliate_attributions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  creator_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (commission_rate BETWEEN 0 AND 100),
  commission_tzs NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (commission_tzs >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','PAID','VOID')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
