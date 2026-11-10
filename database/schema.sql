BEGIN;

CREATE TABLE roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    CONSTRAINT ck_roles_name CHECK (name IN ('Administrador', 'Mesero'))
);

CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    full_name VARCHAR(120) NOT NULL,
    username VARCHAR(60) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE dishes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    name VARCHAR(140) NOT NULL UNIQUE,
    description VARCHAR(500),
    price NUMERIC(12,2) NOT NULL,
    cost NUMERIC(12,2) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_dishes_price_nonnegative CHECK (price >= 0),
    CONSTRAINT ck_dishes_cost_nonnegative CHECK (cost >= 0)
);

CREATE TABLE "tables" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_number SMALLINT NOT NULL UNIQUE,
    capacity SMALLINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Disponible',
    CONSTRAINT ck_tables_number_positive CHECK (table_number > 0),
    CONSTRAINT ck_tables_capacity_positive CHECK (capacity > 0),
    CONSTRAINT ck_tables_status CHECK (status IN ('Disponible', 'Ocupada', 'Reservada', 'FueraDeServicio'))
);

CREATE TABLE orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_id BIGINT REFERENCES "tables"(id),
    waiter_id BIGINT NOT NULL REFERENCES users(id),
    ordered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'Abierto',
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes VARCHAR(1000),
    CONSTRAINT ck_orders_status CHECK (status IN ('Abierto', 'EnPreparacion', 'Listo', 'Entregado', 'Cerrado', 'Cancelado')),
    CONSTRAINT ck_orders_total_nonnegative CHECK (total >= 0),
    CONSTRAINT ck_orders_closed_at CHECK (
        (status IN ('Cerrado', 'Cancelado') AND closed_at IS NOT NULL)
        OR (status NOT IN ('Cerrado', 'Cancelado') AND closed_at IS NULL)
    )
);

CREATE UNIQUE INDEX ux_orders_one_active_order_per_table
    ON orders(table_id)
    WHERE table_id IS NOT NULL AND status IN ('Abierto', 'EnPreparacion', 'Listo', 'Entregado');

CREATE INDEX ix_orders_ordered_at ON orders(ordered_at);
CREATE INDEX ix_orders_waiter_id ON orders(waiter_id);

CREATE TABLE order_details (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    dish_id BIGINT NOT NULL REFERENCES dishes(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    unit_cost NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    CONSTRAINT ck_order_details_quantity_positive CHECK (quantity > 0),
    CONSTRAINT ck_order_details_unit_price_nonnegative CHECK (unit_price >= 0),
    CONSTRAINT ck_order_details_unit_cost_nonnegative CHECK (unit_cost >= 0)
);

CREATE INDEX ix_order_details_order_id ON order_details(order_id);
CREATE INDEX ix_order_details_dish_id ON order_details(dish_id);

CREATE TABLE sales (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id),
    sold_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(12,2) NOT NULL,
    gross_profit NUMERIC(12,2) NOT NULL,
    CONSTRAINT ck_sales_total_nonnegative CHECK (total_amount >= 0),
    CONSTRAINT ck_sales_gross_profit_nonnegative CHECK (gross_profit >= 0)
);

CREATE INDEX ix_sales_sold_at ON sales(sold_at);

CREATE TABLE ingredients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    unit_of_measure VARCHAR(20) NOT NULL,
    current_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
    minimum_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_ingredients_current_stock_nonnegative CHECK (current_stock >= 0),
    CONSTRAINT ck_ingredients_minimum_stock_nonnegative CHECK (minimum_stock >= 0)
);

CREATE TABLE inventory_movements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id),
    movement_type VARCHAR(10) NOT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(250),
    user_id BIGINT REFERENCES users(id),
    CONSTRAINT ck_inventory_movements_type CHECK (movement_type IN ('Entrada', 'Salida')),
    CONSTRAINT ck_inventory_movements_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX ix_inventory_movements_ingredient_occurred_at
    ON inventory_movements(ingredient_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION apply_inventory_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    stock_delta NUMERIC(12,3);
BEGIN
    stock_delta := CASE NEW.movement_type
        WHEN 'Entrada' THEN NEW.quantity
        WHEN 'Salida' THEN -NEW.quantity
    END;

    UPDATE ingredients
    SET current_stock = current_stock + stock_delta
    WHERE id = NEW.ingredient_id
      AND current_stock + stock_delta >= 0;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El movimiento dejaría el inventario con stock negativo para el insumo %', NEW.ingredient_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_apply_inventory_movement
AFTER INSERT ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION apply_inventory_movement();

COMMIT;
