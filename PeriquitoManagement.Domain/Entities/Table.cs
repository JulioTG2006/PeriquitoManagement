using System;
using System.Collections.Generic;

namespace PeriquitoManagement.Domain.Entities;

public partial class Table
{
    public long Id { get; set; }

    public short TableNumber { get; set; }

    public short Capacity { get; set; }

    public string Status { get; set; } = null!;

    public virtual Order? Order { get; set; }
}
