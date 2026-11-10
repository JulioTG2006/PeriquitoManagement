using System;
using System.Collections.Generic;

namespace PeriquitoManagement.Domain.Entities;

public partial class Sale
{
    public long Id { get; set; }

    public long OrderId { get; set; }

    public DateTime SoldAt { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal GrossProfit { get; set; }

    public virtual Order Order { get; set; } = null!;
}
