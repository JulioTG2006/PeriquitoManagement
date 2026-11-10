using System;
using System.Collections.Generic;

namespace PeriquitoManagement.Domain.Entities;

public partial class Order
{
    public long Id { get; set; }

    public long? TableId { get; set; }

    public long WaiterId { get; set; }

    public DateTime OrderedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    public string Status { get; set; } = null!;

    public decimal Total { get; set; }

    public string? Notes { get; set; }

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    public virtual Sale? Sale { get; set; }

    public virtual Table? Table { get; set; }

    public virtual User Waiter { get; set; } = null!;
}
