-- SOKORA Cloudflare D1 foundation.
-- This schema was applied to Cloudflare D1 database sokora-main-db.
-- Additive schema only; does not delete or migrate Neon data.
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, phone TEXT UNIQUE,
 username TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, avatar_url TEXT, password_hash TEXT,
 role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK(role IN ('CUSTOMER','SELLER','MODERATOR','ADMIN')),
 status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','SUSPENDED','DELETED')),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 CHECK(email IS NOT NULL OR phone IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS seller_profiles (
 user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, business_name TEXT NOT NULL,
 description TEXT, region TEXT, district TEXT,
 verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK(verification_status IN ('UNVERIFIED','PENDING','VERIFIED','REJECTED')),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS products (
 id INTEGER PRIMARY KEY AUTOINCREMENT, seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 180), description TEXT,
 price_tzs NUMERIC NOT NULL CHECK(price_tzs>=0), currency TEXT NOT NULL DEFAULT 'TZS' CHECK(currency='TZS'),
 category TEXT, location TEXT, image_url TEXT,
 status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','HIDDEN','SOLD','REMOVED')),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS videos (
 id INTEGER PRIMARY KEY AUTOINCREMENT, seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT, caption TEXT NOT NULL DEFAULT '',
 video_url TEXT NOT NULL, thumbnail_url TEXT, duration_seconds INTEGER CHECK(duration_seconds IS NULL OR duration_seconds BETWEEN 1 AND 600),
 status TEXT NOT NULL DEFAULT 'PROCESSING' CHECK(status IN ('PROCESSING','PUBLISHED','HIDDEN','REJECTED','REMOVED')),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS video_likes (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), PRIMARY KEY(user_id,video_id)
);
CREATE TABLE IF NOT EXISTS comments (
 id INTEGER PRIMARY KEY AUTOINCREMENT, video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 2000),
 status TEXT NOT NULL DEFAULT 'VISIBLE' CHECK(status IN ('VISIBLE','HIDDEN','REMOVED')),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS follows (
 follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 PRIMARY KEY(follower_id,seller_id), CHECK(follower_id<>seller_id)
);
CREATE TABLE IF NOT EXISTS saved_videos (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), PRIMARY KEY(user_id,video_id)
);
CREATE TABLE IF NOT EXISTS live_sessions (
 id INTEGER PRIMARY KEY AUTOINCREMENT, seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 title TEXT NOT NULL, provider TEXT, provider_session_id TEXT,
 status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK(status IN ('SCHEDULED','LIVE','ENDED','CANCELLED')),
 started_at TEXT, ended_at TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS orders (
 id INTEGER PRIMARY KEY AUTOINCREMENT, order_number TEXT NOT NULL UNIQUE,
 buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED','DISPUTED','REFUND_REQUESTED','REFUNDED')),
 subtotal_tzs NUMERIC NOT NULL CHECK(subtotal_tzs>=0), delivery_fee_tzs NUMERIC NOT NULL DEFAULT 0 CHECK(delivery_fee_tzs>=0),
 total_tzs NUMERIC NOT NULL CHECK(total_tzs>=0), delivery_name TEXT, delivery_phone TEXT, delivery_address TEXT, buyer_note TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS order_items (
 id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT, product_name TEXT NOT NULL,
 unit_price_tzs NUMERIC NOT NULL CHECK(unit_price_tzs>=0), quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 99),
 line_total_tzs NUMERIC NOT NULL CHECK(line_total_tzs>=0)
);
CREATE TABLE IF NOT EXISTS conversations (
 id INTEGER PRIMARY KEY AUTOINCREMENT, buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), CHECK(buyer_id<>seller_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_participants_product ON conversations(buyer_id,seller_id,COALESCE(product_id,0));
CREATE TABLE IF NOT EXISTS messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 4000),
 read_at TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS saved_products (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), PRIMARY KEY(user_id,product_id)
);
CREATE TABLE IF NOT EXISTS product_reviews (
 id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
 product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT, buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), body TEXT CHECK(body IS NULL OR length(body)<=2000),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), UNIQUE(order_id,product_id)
);
CREATE TABLE IF NOT EXISTS notifications (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 kind TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '', target_url TEXT, read_at TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS live_session_products (
 live_session_id INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
 product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 pinned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 pinned_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), PRIMARY KEY(live_session_id,product_id)
);
CREATE TABLE IF NOT EXISTS affiliate_attributions (
 id INTEGER PRIMARY KEY AUTOINCREMENT, creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
 referral_code TEXT NOT NULL UNIQUE, commission_rate NUMERIC NOT NULL DEFAULT 0 CHECK(commission_rate BETWEEN 0 AND 100),
 commission_tzs NUMERIC NOT NULL DEFAULT 0 CHECK(commission_tzs>=0),
 status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','PAID','VOID')),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_videos_public_feed ON videos(created_at DESC,id DESC) WHERE status='PUBLISHED';
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON products(seller_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_video_created ON comments(video_id,created_at DESC) WHERE status='VISIBLE';
CREATE INDEX IF NOT EXISTS idx_live_sessions_active ON live_sessions(status,started_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_created ON orders(buyer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller_created ON orders(seller_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_product_created ON product_reviews(product_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id,created_at DESC);
