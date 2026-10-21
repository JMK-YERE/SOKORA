-- SOKORA initial marketplace schema.
-- Review and apply only after confirming the intended Neon project and branch.
BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'CUSTOMER'
    CHECK (role IN ('CUSTOMER', 'SELLER', 'MODERATOR', 'ADMIN')),
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS seller_profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  description TEXT,
  region TEXT,
  district TEXT,
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED'
    CHECK (verification_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 180),
  description TEXT,
  price_tzs NUMERIC(14,2) NOT NULL CHECK (price_tzs >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'TZS' CHECK (currency = 'TZS'),
  category TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'HIDDEN', 'SOLD', 'REMOVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS videos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  caption TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds BETWEEN 1 AND 600),
  status TEXT NOT NULL DEFAULT 'PROCESSING'
    CHECK (status IN ('PROCESSING', 'PUBLISHED', 'HIDDEN', 'REJECTED', 'REMOVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_likes (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id BIGINT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  video_id BIGINT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 2000),
  status TEXT NOT NULL DEFAULT 'VISIBLE'
    CHECK (status IN ('VISIBLE', 'HIDDEN', 'REMOVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, seller_id),
  CHECK (follower_id <> seller_id)
);

CREATE TABLE IF NOT EXISTS saved_videos (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id BIGINT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS live_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  provider TEXT,
  provider_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED'
    CHECK (status IN ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_public_feed
  ON videos (created_at DESC, id DESC) WHERE status = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS idx_products_seller_status
  ON products (seller_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_video_created
  ON comments (video_id, created_at DESC) WHERE status = 'VISIBLE';
CREATE INDEX IF NOT EXISTS idx_live_sessions_active
  ON live_sessions (status, started_at DESC);

COMMIT;
