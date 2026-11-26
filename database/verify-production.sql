SELECT 'roles' AS table_name, COUNT(*) AS row_count FROM roles
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'dishes', COUNT(*) FROM dishes
UNION ALL SELECT 'tables', COUNT(*) FROM "tables"
UNION ALL SELECT 'ingredients', COUNT(*) FROM ingredients
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_details', COUNT(*) FROM order_details
UNION ALL SELECT 'sales', COUNT(*) FROM sales
UNION ALL SELECT 'inventory_movements', COUNT(*) FROM inventory_movements
ORDER BY table_name;
