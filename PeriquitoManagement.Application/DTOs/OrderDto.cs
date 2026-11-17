namespace PeriquitoManagement.Application.DTOs;

public sealed record OrderDto(
    long Id,
    long? TableId,
    short? TableNumber,
    long WaiterId,
    string WaiterUsername,
    DateTime OrderedAt,
    DateTime? ClosedAt,
    string Status,
    decimal Total,
    IReadOnlyList<OrderDetailDto> Details);

public sealed record AdminOrderDto(
    long Id,
    long? TableId,
    short? TableNumber,
    long WaiterId,
    string WaiterUsername,
    DateTime OrderedAt,
    DateTime? ClosedAt,
    string Status,
    decimal Total,
    decimal TotalCost,
    IReadOnlyList<AdminOrderDetailDto> Details);

public sealed record CreateOrderRequest(long TableId);

public sealed record AddOrderItemRequest(long DishId, int Quantity);

public sealed record SetOrderItemQuantityRequest(int Quantity);
