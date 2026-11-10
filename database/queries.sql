-- Verificación de las diez tablas creadas.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('roles', 'users', 'categories', 'dishes', 'tables', 'orders', 'order_details', 'sales', 'ingredients', 'inventory_movements')
ORDER BY table_name;

-- Verificación de los datos semilla.
SELECT 'roles' AS entity, COUNT(*) AS record_count FROM roles
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'dishes', COUNT(*) FROM dishes
UNION ALL SELECT 'tables', COUNT(*) FROM "tables"
UNION ALL SELECT 'ingredients', COUNT(*) FROM ingredients
ORDER BY entity;

-- Ventas diarias para el dashboard.
SELECT sold_at::date AS sale_date,
       COUNT(*) AS total_sales,
       SUM(total_amount) AS revenue,
       SUM(gross_profit) AS gross_profit
FROM sales
GROUP BY sold_at::date
ORDER BY sale_date DESC;

-- Platos más vendidos para el dashboard.
SELECT d.name,
       SUM(od.quantity) AS units_sold,
       SUM(od.subtotal) AS revenue
FROM order_details od
JOIN orders o ON o.id = od.order_id AND o.status = 'Cerrado'
JOIN dishes d ON d.id = od.dish_id
GROUP BY d.id, d.name
ORDER BY units_sold DESC, revenue DESC;

-- Insumos que requieren reposición.
SELECT name, current_stock, minimum_stock, unit_of_measure
FROM ingredients
WHERE current_stock <= minimum_stock
ORDER BY name;

-- Relaciones y restricciones de claves foráneas.
SELECT tc.table_name,
       kcu.column_name,
       ccu.table_name AS referenced_table,
       ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
