using System;
using System.Collections.Generic;

namespace PeriquitoManagement.Domain.Entities;

public partial class Dish
{
    public long Id { get; set; }

    public long CategoryId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public decimal Cost { get; set; }

    public bool IsAvailable { get; set; }

    public virtual Category Category { get; set; } = null!;

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
}
