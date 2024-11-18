CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO Users (first_name, last_name, email, password)
VALUES
    ('Thorsten', 'Test', 'admin@schul-cloud.org', 'securepassword123'),
    ('Marla', 'Mathe', 'schueler@schul-cloud.org', 'anotherpassword456'),
    ('Cord', 'Carl', 'lehrer@schul-cloud.org', 'anotherpassword789');
