CREATE TABLE IF NOT EXISTS plants (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    interval INTEGER NOT NULL,
    location TEXT,
    last_watered DATE
);