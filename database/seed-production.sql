BEGIN;

INSERT INTO roles (name) VALUES
    ('Administrador'),
    ('Mesero')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name) VALUES
    ('Ceviches'),
    ('Arroces'),
    ('Combinados'),
    ('Otros platos'),
    ('Bebidas')
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, cost) VALUES
    ((SELECT id FROM categories WHERE name = 'Ceviches'), 'Ceviche tradicional', 'Pescado marinado con limón, cebolla y rocoto.', 22.00, 9.50),
    ((SELECT id FROM categories WHERE name = 'Ceviches'), 'Ceviche Periquito', 'Ceviche especial de la casa.', 28.00, 12.00),
    ((SELECT id FROM categories WHERE name = 'Ceviches'), 'Ceviche carretillero', 'Ceviche con chicharrón de calamar.', 26.00, 11.00),
    ((SELECT id FROM categories WHERE name = 'Arroces'), 'Arroz de mariscos', 'Arroz salteado con mariscos.', 25.00, 10.50),
    ((SELECT id FROM categories WHERE name = 'Combinados'), 'Combinado 3', 'Ceviche, arroz de mariscos y chicharrón.', 35.00, 15.00),
    ((SELECT id FROM categories WHERE name = 'Otros platos'), 'Filete frito', 'Filete de pescado frito con guarnición.', 24.00, 10.00),
    ((SELECT id FROM categories WHERE name = 'Bebidas'), 'Chilcano especial', 'Bebida de la casa.', 12.00, 4.00)
ON CONFLICT (name) DO NOTHING;

INSERT INTO "tables" (table_number, capacity, status)
SELECT table_number::SMALLINT, 4, 'Disponible'
FROM generate_series(1, 10) AS table_number
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO ingredients (name, unit_of_measure, current_stock, minimum_stock) VALUES
    ('Pescado', 'kg', 12.000, 3.000),
    ('Calamar', 'kg', 8.000, 2.000),
    ('Arroz', 'kg', 20.000, 5.000),
    ('Limón', 'kg', 15.000, 4.000),
    ('Cebolla', 'kg', 10.000, 3.000),
    ('Rocoto', 'kg', 3.000, 1.000),
    ('Papa', 'kg', 18.000, 5.000)
ON CONFLICT (name) DO NOTHING;

COMMIT;
