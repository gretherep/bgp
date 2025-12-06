# Supabase Database Schema

## Profiles Table
Stores user information and roles.

```sql
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('user', 'admin')) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## Media Table
Stores multimedia items.

```sql
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    synopsis TEXT NOT NULL,
    poster_url TEXT,
    genre TEXT NOT NULL,
    year INT NOT NULL,
    category TEXT CHECK (category IN (
        'Películas', 'Series', 'Novelas', 'Reality Shows', 'MiniSeries',
        'Series Animadas', 'Películas Animadas', 'Anime', 'Películas Anime'
    )) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## Ratings Table
User ratings for media.

```sql
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, media_id) -- One rating per user per media
);
```

## Comments Table
User comments on media.

```sql
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## Trigger to Update Updated_at on Media Changes

```sql
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_update_media_updated_at
BEFORE UPDATE ON media
FOR EACH ROW EXECUTE FUNCTION update_media_updated_at();
```

This schema enforces referential integrity, enumerated values for roles and categories, and uniqueness for user ratings.
