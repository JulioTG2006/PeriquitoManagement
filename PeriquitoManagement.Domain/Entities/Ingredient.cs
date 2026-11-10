using System;
using System.Collections.Generic;

namespace PeriquitoManagement.Domain.Entities;

public partial class Ingredient
{
    public long Id { get; set; }

    public string Name { get; set; } = null!;

    public string UnitOfMeasure { get; set; } = null!;

    public decimal CurrentStock { get; set; }

    public decimal MinimumStock { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<InventoryMovement> InventoryMovements { get; set; } = new List<InventoryMovement>();
}
