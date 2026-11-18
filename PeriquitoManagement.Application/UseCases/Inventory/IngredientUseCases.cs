using MediatR;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.Exceptions;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;

namespace PeriquitoManagement.Application.UseCases.Inventory;

public sealed record GetIngredientsQuery : IRequest<IReadOnlyList<IngredientDto>>;
public sealed record GetLowStockIngredientsQuery : IRequest<IReadOnlyList<IngredientDto>>;
public sealed record GetIngredientByIdQuery(long Id) : IRequest<IngredientDto>;
public sealed record CreateIngredientCommand(string? Name, string? UnitOfMeasure, decimal MinimumStock)
    : IRequest<IngredientDto>;
public sealed record UpdateIngredientCommand(
    long Id,
    string? Name,
    string? UnitOfMeasure,
    decimal MinimumStock,
    bool IsActive) : IRequest<IngredientDto>;
public sealed record DeleteIngredientCommand(long Id) : IRequest;

public sealed class GetIngredientsHandler(IIngredientRepository ingredients)
    : IRequestHandler<GetIngredientsQuery, IReadOnlyList<IngredientDto>>
{
    public async Task<IReadOnlyList<IngredientDto>> Handle(
        GetIngredientsQuery request,
        CancellationToken cancellationToken)
    {
        var records = await ingredients.GetAllAsync(cancellationToken);
        return records.OrderBy(ingredient => ingredient.Name)
            .Select(IngredientMapping.ToDto)
            .ToArray();
    }
}

public sealed class GetLowStockIngredientsHandler(IIngredientRepository ingredients)
    : IRequestHandler<GetLowStockIngredientsQuery, IReadOnlyList<IngredientDto>>
{
    public async Task<IReadOnlyList<IngredientDto>> Handle(
        GetLowStockIngredientsQuery request,
        CancellationToken cancellationToken)
    {
        var records = await ingredients.GetLowStockAsync(cancellationToken);
        return records.Select(IngredientMapping.ToDto).ToArray();
    }
}

public sealed class GetIngredientByIdHandler(IIngredientRepository ingredients)
    : IRequestHandler<GetIngredientByIdQuery, IngredientDto>
{
    public async Task<IngredientDto> Handle(
        GetIngredientByIdQuery request,
        CancellationToken cancellationToken)
    {
        var ingredient = await ingredients.GetByIdNoTrackingAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Ingredient {request.Id} was not found.");
        return IngredientMapping.ToDto(ingredient);
    }
}

public sealed class CreateIngredientHandler(
    IIngredientRepository ingredients,
    IUnitOfWork unitOfWork)
    : IRequestHandler<CreateIngredientCommand, IngredientDto>
{
    public async Task<IngredientDto> Handle(
        CreateIngredientCommand request,
        CancellationToken cancellationToken)
    {
        var values = IngredientValidation.Validate(request.Name, request.UnitOfMeasure, request.MinimumStock);
        await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            await ingredients.LockNameAsync(values.Name, cancellationToken);
            if (await ingredients.NameExistsAsync(values.Name, cancellationToken: cancellationToken))
                throw new ConflictException("An ingredient with this name already exists.");

            var ingredient = new Ingredient
            {
                Name = values.Name,
                UnitOfMeasure = values.UnitOfMeasure,
                CurrentStock = 0m,
                MinimumStock = values.MinimumStock,
                IsActive = true
            };
            await ingredients.AddAsync(ingredient, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await unitOfWork.CommitTransactionAsync(cancellationToken);
            return IngredientMapping.ToDto(ingredient);
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(CancellationToken.None);
            throw;
        }
    }
}

public sealed class UpdateIngredientHandler(
    IIngredientRepository ingredients,
    IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateIngredientCommand, IngredientDto>
{
    public async Task<IngredientDto> Handle(
        UpdateIngredientCommand request,
        CancellationToken cancellationToken)
    {
        var values = IngredientValidation.Validate(request.Name, request.UnitOfMeasure, request.MinimumStock);
        await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var ingredient = await ingredients.GetByIdForUpdateAsync(request.Id, cancellationToken)
                ?? throw new NotFoundException($"Ingredient {request.Id} was not found.");
            await ingredients.LockNameAsync(values.Name, cancellationToken);
            if (await ingredients.NameExistsAsync(
                    values.Name, request.Id, cancellationToken))
                throw new ConflictException("An ingredient with this name already exists.");

            ingredient.Name = values.Name;
            ingredient.UnitOfMeasure = values.UnitOfMeasure;
            ingredient.MinimumStock = values.MinimumStock;
            ingredient.IsActive = request.IsActive;
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await unitOfWork.CommitTransactionAsync(cancellationToken);
            return IngredientMapping.ToDto(ingredient);
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(CancellationToken.None);
            throw;
        }
    }
}

public sealed class DeleteIngredientHandler(
    IIngredientRepository ingredients,
    IUnitOfWork unitOfWork)
    : IRequestHandler<DeleteIngredientCommand>
{
    public async Task Handle(DeleteIngredientCommand request, CancellationToken cancellationToken)
    {
        await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var ingredient = await ingredients.GetByIdForUpdateAsync(request.Id, cancellationToken)
                ?? throw new NotFoundException($"Ingredient {request.Id} was not found.");
            if (await ingredients.HasMovementsAsync(request.Id, cancellationToken))
                throw new ConflictException("An ingredient with movement history cannot be deleted.");

            ingredients.Delete(ingredient);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(CancellationToken.None);
            throw;
        }
    }
}

internal static class IngredientValidation
{
    private const decimal MaximumNumeric12Scale3 = 999_999_999.999m;

    public static (string Name, string UnitOfMeasure, decimal MinimumStock) Validate(
        string? name,
        string? unitOfMeasure,
        decimal minimumStock)
    {
        var errors = new Dictionary<string, string[]>();
        var normalizedName = name?.Trim();
        var normalizedUnit = unitOfMeasure?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName))
            errors["name"] = ["Name is required."];
        else if (normalizedName.Length > 120)
            errors["name"] = ["Name cannot exceed 120 characters."];
        if (string.IsNullOrWhiteSpace(normalizedUnit))
            errors["unitOfMeasure"] = ["Unit of measure is required."];
        else if (normalizedUnit.Length > 20)
            errors["unitOfMeasure"] = ["Unit of measure cannot exceed 20 characters."];
        if (minimumStock < 0m || minimumStock > MaximumNumeric12Scale3
            || decimal.Round(minimumStock, 3) != minimumStock)
            errors["minimumStock"] = ["Minimum stock must be nonnegative and fit NUMERIC(12,3)."];
        if (errors.Count > 0)
            throw new ValidationException(errors);

        return (normalizedName!, normalizedUnit!, minimumStock);
    }
}

internal static class IngredientMapping
{
    public static IngredientDto ToDto(Ingredient ingredient) => new(
        ingredient.Id,
        ingredient.Name,
        ingredient.UnitOfMeasure,
        ingredient.CurrentStock,
        ingredient.MinimumStock,
        ingredient.IsActive,
        ingredient.CurrentStock <= ingredient.MinimumStock);
}
