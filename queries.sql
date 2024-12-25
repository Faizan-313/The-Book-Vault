CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    book_name VARCHAR(200) UNIQUE NOT NULL,
    cover_url TEXT,
    average_rating REAL,
    author VARCHAR(200)
);

CREATE TABLE user_saved (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    user_rating real not null,
    book_description text,
    event_date date,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);
