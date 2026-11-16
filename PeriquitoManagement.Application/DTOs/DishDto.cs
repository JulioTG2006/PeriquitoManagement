namespace PeriquitoManagement.Application.DTOs;

public sealed record DishDto(
    long Id,
    long CategoryId,
    string CategoryName,
    string Name,
    string? Description,
    decimal Price,
    bool IsAvailable);

public sealed record AdminDishDto(
    long Id,
    long CategoryId,
    string CategoryName,
    string Name,
    string? Description,
    decimal Price,
    decimal Cost,
    bool IsAvailable);

public sealed record SaveDishRequest(
    long CategoryId,
    string? Name,
    string? Description,
    decimal Price,
    decimal Cost,
    bool IsAvailable = true);
