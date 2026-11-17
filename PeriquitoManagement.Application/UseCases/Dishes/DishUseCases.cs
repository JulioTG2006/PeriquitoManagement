using MediatR;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.Exceptions;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;

namespace PeriquitoManagement.Application.UseCases.Dishes;

public sealed record GetDishesQuery(long? CategoryId = null, bool? IsAvailable = null)
    : IRequest<IReadOnlyList<DishDto>>;
public sealed record GetAdminDishesQuery(long? CategoryId = null, bool? IsAvailable = null)
    : IRequest<IReadOnlyList<AdminDishDto>>;
public sealed record GetDishByIdQuery(long Id) : IRequest<DishDto>;
public sealed record GetAdminDishByIdQuery(long Id) : IRequest<AdminDishDto>;
public sealed record CreateDishCommand(long CategoryId, string? Name, string? Description, decimal Price, decimal Cost, bool IsAvailable)
    : IRequest<AdminDishDto>;
public sealed record UpdateDishCommand(long Id, long CategoryId, string? Name, string? Description, decimal Price, decimal Cost, bool IsAvailable)
    : IRequest<AdminDishDto>;
public sealed record ChangeDishAvailabilityCommand(long Id, bool IsAvailable) : IRequest<AdminDishDto>;
public sealed record DeleteDishCommand(long Id) : IRequest;

public sealed class GetDishesHandler(IDishRepository dishes)
    : IRequestHandler<GetDishesQuery, IReadOnlyList<DishDto>>
{
    public async Task<IReadOnlyList<DishDto>> Handle(GetDishesQuery request, CancellationToken cancellationToken)
    {
        var entities = await dishes.GetWithCategoryAsync(request.CategoryId, request.IsAvailable, cancellationToken);
        return entities.Select(DishMapping.ToPublicDto).ToArray();
    }
}

public sealed class GetAdminDishesHandler(IDishRepository dishes)
    : IRequestHandler<GetAdminDishesQuery, IReadOnlyList<AdminDishDto>>
{
    public async Task<IReadOnlyList<AdminDishDto>> Handle(GetAdminDishesQuery request, CancellationToken cancellationToken)
    {
        var entities = await dishes.GetWithCategoryAsync(request.CategoryId, request.IsAvailable, cancellationToken);
        return entities.Select(DishMapping.ToAdminDto).ToArray();
    }
}

public sealed class GetDishByIdHandler(IDishRepository dishes)
    : IRequestHandler<GetDishByIdQuery, DishDto>
{
    public async Task<DishDto> Handle(GetDishByIdQuery request, CancellationToken cancellationToken)
    {
        var dish = await dishes.GetByIdWithCategoryAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Dish {request.Id} was not found.");
        return DishMapping.ToPublicDto(dish);
    }
}

public sealed class GetAdminDishByIdHandler(IDishRepository dishes)
    : IRequestHandler<GetAdminDishByIdQuery, AdminDishDto>
{
    public async Task<AdminDishDto> Handle(GetAdminDishByIdQuery request, CancellationToken cancellationToken)
    {
        var dish = await dishes.GetByIdWithCategoryAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Dish {request.Id} was not found.");
        return DishMapping.ToAdminDto(dish);
    }
}

public sealed class CreateDishHandler(IDishRepository dishes, IUnitOfWork unitOfWork)
    : IRequestHandler<CreateDishCommand, AdminDishDto>
{
    public async Task<AdminDishDto> Handle(CreateDishCommand request, CancellationToken cancellationToken)
    {
        var values = await DishValidation.ValidateAsync(dishes, request.CategoryId, request.Name,
            request.Description, request.Price, request.Cost, null, cancellationToken);
        var dish = new Dish
        {
            CategoryId = request.CategoryId,
            Category = null!,
            Name = values.Name,
            Description = values.Description,
            Price = request.Price,
            Cost = request.Cost,
            IsAvailable = request.IsAvailable
        };
        await dishes.AddAsync(dish, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        var saved = await dishes.GetByIdWithCategoryAsync(dish.Id, cancellationToken) ?? dish;
        return DishMapping.ToAdminDto(saved);
    }
}

public sealed class UpdateDishHandler(IDishRepository dishes, IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateDishCommand, AdminDishDto>
{
    public async Task<AdminDishDto> Handle(UpdateDishCommand request, CancellationToken cancellationToken)
    {
        var dish = await dishes.GetByIdWithCategoryAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Dish {request.Id} was not found.");
        var values = await DishValidation.ValidateAsync(dishes, request.CategoryId, request.Name,
            request.Description, request.Price, request.Cost, request.Id, cancellationToken);
        var category = await dishes.GetCategoryByIdAsync(request.CategoryId, cancellationToken)
            ?? throw new NotFoundException($"Category {request.CategoryId} was not found.");
        dish.CategoryId = request.CategoryId;
        dish.Name = values.Name;
        dish.Description = values.Description;
        dish.Price = request.Price;
        dish.Cost = request.Cost;
        dish.IsAvailable = request.IsAvailable;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return new AdminDishDto(
            dish.Id, dish.CategoryId, category.Name, dish.Name, dish.Description,
            dish.Price, dish.Cost, dish.IsAvailable);
    }
}

public sealed class ChangeDishAvailabilityHandler(IDishRepository dishes, IUnitOfWork unitOfWork)
    : IRequestHandler<ChangeDishAvailabilityCommand, AdminDishDto>
{
    public async Task<AdminDishDto> Handle(ChangeDishAvailabilityCommand request, CancellationToken cancellationToken)
    {
        var dish = await dishes.GetByIdWithCategoryAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Dish {request.Id} was not found.");
        dish.IsAvailable = request.IsAvailable;
        dishes.Update(dish);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return DishMapping.ToAdminDto(dish);
    }
}

public sealed class DeleteDishHandler(IDishRepository dishes, IUnitOfWork unitOfWork)
    : IRequestHandler<DeleteDishCommand>
{
    public async Task Handle(DeleteDishCommand request, CancellationToken cancellationToken)
    {
        var dish = await dishes.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Dish {request.Id} was not found.");
        if (await dishes.HasOrderHistoryAsync(request.Id, cancellationToken))
            throw new ConflictException("A dish with order history cannot be deleted; mark it unavailable instead.");
        dishes.Delete(dish);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

internal static class DishMapping
{
    public static DishDto ToPublicDto(Dish dish) => new(
        dish.Id, dish.CategoryId, dish.Category.Name, dish.Name, dish.Description, dish.Price, dish.IsAvailable);

    public static AdminDishDto ToAdminDto(Dish dish) => new(
        dish.Id, dish.CategoryId, dish.Category.Name, dish.Name, dish.Description,
        dish.Price, dish.Cost, dish.IsAvailable);
}

internal static class DishValidation
{
    private const decimal MaximumNumericValue = 9_999_999_999.99m;

    public static async Task<(string Name, string? Description)> ValidateAsync(
        IDishRepository dishes,
        long categoryId,
        string? name,
        string? description,
        decimal price,
        decimal cost,
        long? excludedId,
        CancellationToken cancellationToken)
    {
        var normalizedName = name?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > 140)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["name"] = ["Name is required and cannot exceed 140 characters."]
            });
        var normalizedDescription = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        if (normalizedDescription?.Length > 500)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["description"] = ["Description cannot exceed 500 characters."]
            });
        if (price <= 0 || price > MaximumNumericValue || decimal.Round(price, 2) != price)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["price"] = ["Price must be positive and fit NUMERIC(12,2)."]
            });
        if (cost < 0 || cost > MaximumNumericValue || decimal.Round(cost, 2) != cost)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["cost"] = ["Cost must be nonnegative and fit NUMERIC(12,2)."]
            });
        if (!await dishes.CategoryExistsAsync(categoryId, cancellationToken))
            throw new NotFoundException($"Category {categoryId} was not found.");
        if (await dishes.NameExistsAsync(normalizedName, excludedId, cancellationToken))
            throw new ConflictException("A dish with this name already exists.");
        return (normalizedName, normalizedDescription);
    }
}
