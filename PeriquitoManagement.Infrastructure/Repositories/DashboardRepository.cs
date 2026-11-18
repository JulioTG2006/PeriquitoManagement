using Microsoft.EntityFrameworkCore;
using PeriquitoManagement.Domain.Constants;
using PeriquitoManagement.Domain.Interfaces;
using PeriquitoManagement.Domain.ReadModels;
using PeriquitoManagement.Infrastructure.Persistence;

namespace PeriquitoManagement.Infrastructure.Repositories;

public sealed class DashboardRepository(PeriquitoDbContext context) : IDashboardRepository
{
    public async Task<DashboardFinancialReadModel> GetFinancialSummaryAsync(
        DateTime? fromUtc,
        DateTime? toExclusiveUtc,
        CancellationToken cancellationToken = default)
    {
        var result = await context.Database.SqlQuery<DashboardFinancialReadModel>($"""
            WITH sale_costs AS (
                SELECT s.id,
                       s.total_amount,
                       s.gross_profit,
                       COALESCE(SUM(detail.unit_cost * detail.quantity), 0)::numeric(12,2) AS "Cost"
                FROM sales AS s
                LEFT JOIN order_details AS detail ON detail.order_id = s.order_id
                WHERE s.sold_at >= COALESCE({fromUtc}, '-infinity'::timestamptz)
                  AND s.sold_at < COALESCE({toExclusiveUtc}, 'infinity'::timestamptz)
                GROUP BY s.id
            )
            SELECT COUNT(*)::bigint AS "SalesCount",
                   COALESCE(SUM(total_amount), 0)::numeric(12,2) AS "Revenue",
                   COALESCE(SUM(gross_profit), 0)::numeric(12,2) AS "GrossProfit",
                   COALESCE(SUM("Cost"), 0)::numeric(12,2) AS "Cost"
            FROM sale_costs
            """).FirstAsync(cancellationToken);

        return result;
    }

    public async Task<IReadOnlyList<DashboardDailyReadModel>> GetDailySalesAsync(
        DateTime? fromUtc,
        DateTime? toExclusiveUtc,
        CancellationToken cancellationToken = default)
    {
        return await context.Database.SqlQuery<DashboardDailyReadModel>($"""
            WITH sale_costs AS (
                SELECT s.id,
                       s.sold_at,
                       s.total_amount,
                       s.gross_profit,
                       COALESCE(SUM(detail.unit_cost * detail.quantity), 0)::numeric(12,2) AS "Cost"
                FROM sales AS s
                LEFT JOIN order_details AS detail ON detail.order_id = s.order_id
                WHERE s.sold_at >= COALESCE({fromUtc}, '-infinity'::timestamptz)
                  AND s.sold_at < COALESCE({toExclusiveUtc}, 'infinity'::timestamptz)
                GROUP BY s.id
            )
            SELECT (sold_at AT TIME ZONE 'America/Lima')::date AS "LocalDate",
                   COALESCE(SUM(total_amount), 0)::numeric(12,2) AS "Revenue",
                   COALESCE(SUM(gross_profit), 0)::numeric(12,2) AS "GrossProfit",
                   COALESCE(SUM("Cost"), 0)::numeric(12,2) AS "Cost",
                   COUNT(*)::bigint AS "SalesCount"
            FROM sale_costs
            GROUP BY (sold_at AT TIME ZONE 'America/Lima')::date
            ORDER BY "LocalDate"
            """).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DashboardProductReadModel>> GetProductSalesAsync(
        DateTime? fromUtc,
        DateTime? toExclusiveUtc,
        CancellationToken cancellationToken = default)
    {
        var details = context.OrderDetails.AsNoTracking()
            .Where(detail => detail.Order.Sale != null);
        if (fromUtc.HasValue)
            details = details.Where(detail => detail.Order.Sale!.SoldAt >= fromUtc.Value);
        if (toExclusiveUtc.HasValue)
            details = details.Where(detail => detail.Order.Sale!.SoldAt < toExclusiveUtc.Value);

        return await details
            .GroupBy(detail => new { detail.DishId, detail.Dish.Name })
            .Select(group => new DashboardProductReadModel
            {
                DishId = group.Key.DishId,
                DishName = group.Key.Name,
                QuantitySold = group.Sum(detail => (long)detail.Quantity),
                Revenue = group.Sum(detail => detail.UnitPrice * detail.Quantity),
                Cost = group.Sum(detail => detail.UnitCost * detail.Quantity)
            })
            .OrderByDescending(product => product.QuantitySold)
            .ThenByDescending(product => product.Revenue)
            .ThenBy(product => product.DishName)
            .ToListAsync(cancellationToken);
    }

    public async Task<DashboardCurrentReadModel> GetCurrentMetricsAsync(
        CancellationToken cancellationToken = default)
    {
        var availableTables = await context.Tables.AsNoTracking()
            .LongCountAsync(table => table.Status == TableStatuses.Available, cancellationToken);
        var occupiedTables = await context.Tables.AsNoTracking()
            .LongCountAsync(table => table.Status == TableStatuses.Occupied, cancellationToken);
        var activeOrders = await context.Orders.AsNoTracking()
            .LongCountAsync(order => OrderStatuses.Active.Contains(order.Status), cancellationToken);
        var lowStockIngredients = await context.Ingredients.AsNoTracking()
            .LongCountAsync(ingredient => ingredient.CurrentStock <= ingredient.MinimumStock, cancellationToken);

        return new DashboardCurrentReadModel
        {
            AvailableTables = availableTables,
            OccupiedTables = occupiedTables,
            ActiveOrders = activeOrders,
            LowStockIngredients = lowStockIngredients
        };
    }

    public async Task<IReadOnlyList<DashboardSaleReadModel>> GetSalesForReportAsync(
        DateTime? fromUtc,
        DateTime? toExclusiveUtc,
        CancellationToken cancellationToken = default)
    {
        var sales = context.Sales.AsNoTracking().AsQueryable();
        if (fromUtc.HasValue)
            sales = sales.Where(sale => sale.SoldAt >= fromUtc.Value);
        if (toExclusiveUtc.HasValue)
            sales = sales.Where(sale => sale.SoldAt < toExclusiveUtc.Value);

        return await sales
            .OrderBy(sale => sale.SoldAt)
            .ThenBy(sale => sale.Id)
            .Select(sale => new DashboardSaleReadModel
            {
                SaleId = sale.Id,
                OrderId = sale.OrderId,
                SoldAt = sale.SoldAt,
                TableNumber = sale.Order.Table == null ? null : sale.Order.Table.TableNumber,
                WaiterUsername = sale.Order.Waiter.Username,
                Revenue = sale.TotalAmount,
                Cost = sale.Order.OrderDetails.Sum(detail => detail.UnitCost * detail.Quantity),
                GrossProfit = sale.GrossProfit
            })
            .ToListAsync(cancellationToken);
    }
}
