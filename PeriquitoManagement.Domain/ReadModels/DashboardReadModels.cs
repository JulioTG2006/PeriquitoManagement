namespace PeriquitoManagement.Domain.ReadModels;

public sealed class DashboardFinancialReadModel
{
    public long SalesCount { get; set; }
    public decimal Revenue { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal Cost { get; set; }
}

public sealed class DashboardDailyReadModel
{
    public DateOnly LocalDate { get; set; }
    public decimal Revenue { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal Cost { get; set; }
    public long SalesCount { get; set; }
}

public sealed class DashboardProductReadModel
{
    public long DishId { get; set; }
    public string DishName { get; set; } = string.Empty;
    public long QuantitySold { get; set; }
    public decimal Revenue { get; set; }
    public decimal Cost { get; set; }
}

public sealed class DashboardCurrentReadModel
{
    public long AvailableTables { get; set; }
    public long OccupiedTables { get; set; }
    public long ActiveOrders { get; set; }
    public long LowStockIngredients { get; set; }
}

public sealed class DashboardSaleReadModel
{
    public long SaleId { get; set; }
    public long OrderId { get; set; }
    public DateTime SoldAt { get; set; }
    public short? TableNumber { get; set; }
    public string WaiterUsername { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public decimal Cost { get; set; }
    public decimal GrossProfit { get; set; }
}
