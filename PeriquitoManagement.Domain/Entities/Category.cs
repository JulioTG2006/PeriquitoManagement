using System;
using System.Collections.Generic;

namespace PeriquitoManagement.Domain.Entities;

public partial class Category
{
    public long Id { get; set; }

    public string Name { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual ICollection<Dish> Dishes { get; set; } = new List<Dish>();
}
