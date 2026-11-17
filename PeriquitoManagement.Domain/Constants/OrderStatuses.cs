namespace PeriquitoManagement.Domain.Constants;

public static class OrderStatuses
{
    public const string Open = "Abierto";
    public const string Preparing = "EnPreparacion";
    public const string Ready = "Listo";
    public const string Delivered = "Entregado";
    public const string Closed = "Cerrado";
    public const string Cancelled = "Cancelado";

    public static readonly string[] Active = [Open, Preparing, Ready, Delivered];
}
