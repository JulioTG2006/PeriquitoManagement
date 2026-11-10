using System;
using System.Collections.Generic;

namespace PeriquitoManagement.Domain.Entities;

public partial class InventoryMovement
{
    public long Id { get; set; }

    public long IngredientId { get; set; }

    public string MovementType { get; set; } = null!;

    public decimal Quantity { get; set; }

    public DateTime OccurredAt { get; set; }

    public string? Reason { get; set; }

    public long? UserId { get; set; }

    public virtual Ingredient Ingredient { get; set; } = null!;

    public virtual User? User { get; set; }
}
