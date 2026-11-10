using System;
using System.Collections.Generic;

namespace PeriquitoManagement.Domain.Entities;

public partial class OrderDetail
{
    public long Id { get; set; }

    public long OrderId { get; set; }

    public long DishId { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal UnitCost { get; set; }

    public decimal? Subtotal { get; set; }

    public virtual Dish Dish { get; set; } = null!;

    public virtual Order Order { get; set; } = null!;
}
