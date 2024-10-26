CREATE TABLE books(
	id SERIAL PRIMARY KEY NOT NULL,
	name VARCHAR(200) UNIQUE NOT NULL,
	rattings REAL NOT NUll,
    event_date date,
    cover_url text,
    average_ratting real,
    author VARCHAR(200),
    description text
);