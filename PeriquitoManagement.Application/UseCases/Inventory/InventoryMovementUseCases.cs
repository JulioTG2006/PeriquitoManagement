using MediatR;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.Exceptions;
using PeriquitoManagement.Domain.Constants;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;

namespace PeriquitoManagement.Application.UseCases.Inventory;

public sealed record GetInventoryMovementsQuery(
    long? IngredientId,
    string? MovementType,
    DateTimeOffset? FromUtc,
    DateTimeOffset? ToUtc) : IRequest<IReadOnlyList<InventoryMovementDto>>;

public sealed record RegisterInventoryMovementCommand(
    long IngredientId,
    string? MovementType,
    decimal Quantity,
    string? Reason,
    long? UserId) : IRequest<InventoryMovementResultDto>;

public sealed class GetInventoryMovementsHandler(IInventoryMovementRepository movements)
    : IRequestHandler<GetInventoryMovementsQuery, IReadOnlyList<InventoryMovementDto>>
{
    public async Task<IReadOnlyList<InventoryMovementDto>> Handle(
        GetInventoryMovementsQuery request,
        CancellationToken cancellationToken)
    {
        if (request.FromUtc.HasValue && request.ToUtc.HasValue
            && request.FromUtc.Value > request.ToUtc.Value)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["dateRange"] = ["FromUtc must be earlier than or equal to ToUtc."]
            });

        if (request.MovementType is not null
            && !InventoryMovementTypes.All.Contains(request.MovementType, StringComparer.Ordinal))
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["movementType"] = ["Movement type must be Entrada or Salida."]
            });

        var records = await movements.GetHistoryAsync(
            request.IngredientId,
            request.MovementType,
            request.FromUtc?.UtcDateTime,
            request.ToUtc?.UtcDateTime,
            cancellationToken);
        return records.Select(InventoryMovementMapping.ToDto).ToArray();
    }
}

public sealed class RegisterInventoryMovementHandler(
    IIngredientRepository ingredients,
    IInventoryMovementRepository movements,
    IUnitOfWork unitOfWork)
    : IRequestHandler<RegisterInventoryMovementCommand, InventoryMovementResultDto>
{
    private const decimal MaximumNumeric12Scale3 = 999_999_999.999m;

    public async Task<InventoryMovementResultDto> Handle(
        RegisterInventoryMovementCommand request,
        CancellationToken cancellationToken)
    {
        Validate(request);
        var reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();

        await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var ingredient = await ingredients.GetByIdForUpdateAsync(
                    request.IngredientId, cancellationToken)
                ?? throw new NotFoundException($"Ingredient {request.IngredientId} was not found.");
            if (!ingredient.IsActive)
                throw new ConflictException("Inventory movements cannot be registered for an inactive ingredient.");

            if (request.MovementType == InventoryMovementTypes.Exit
                && request.Quantity > ingredient.CurrentStock)
                throw new ConflictException("The exit quantity exceeds the available stock.");
            if (request.MovementType == InventoryMovementTypes.Entry
                && ingredient.CurrentStock + request.Quantity > MaximumNumeric12Scale3)
                throw new ConflictException("The resulting stock exceeds the database numeric limit.");

            var movement = new InventoryMovement
            {
                IngredientId = ingredient.Id,
                MovementType = request.MovementType!,
                Quantity = request.Quantity,
                Reason = reason,
                UserId = request.UserId
            };
            await movements.AddAsync(movement, cancellationToken);

            // The PostgreSQL AFTER INSERT trigger is the only code that changes current_stock.
            await unitOfWork.SaveChangesAsync(cancellationToken);
            var updatedIngredient = await ingredients.GetByIdNoTrackingAsync(
                    ingredient.Id, cancellationToken)
                ?? throw new NotFoundException($"Ingredient {ingredient.Id} was not found after movement.");
            await unitOfWork.CommitTransactionAsync(cancellationToken);

            var movementDto = new InventoryMovementDto(
                movement.Id,
                movement.IngredientId,
                ingredient.Name,
                ingredient.UnitOfMeasure,
                movement.MovementType,
                movement.Quantity,
                movement.OccurredAt,
                movement.Reason,
                movement.UserId,
                null);
            return new InventoryMovementResultDto(movementDto, updatedIngredient.CurrentStock);
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(CancellationToken.None);
            throw;
        }
    }

    private static void Validate(RegisterInventoryMovementCommand request)
    {
        var errors = new Dictionary<string, string[]>();
        if (request.MovementType is null
            || !InventoryMovementTypes.All.Contains(request.MovementType, StringComparer.Ordinal))
            errors["movementType"] = ["Movement type must be Entrada or Salida."];
        if (request.Quantity <= 0m || request.Quantity > MaximumNumeric12Scale3
            || decimal.Round(request.Quantity, 3) != request.Quantity)
            errors["quantity"] = ["Quantity must be positive and fit NUMERIC(12,3)."];
        if (request.Reason?.Trim().Length > 250)
            errors["reason"] = ["Reason cannot exceed 250 characters."];
        if (errors.Count > 0)
            throw new ValidationException(errors);
    }
}

internal static class InventoryMovementMapping
{
    public static InventoryMovementDto ToDto(InventoryMovement movement) => new(
        movement.Id,
        movement.IngredientId,
        movement.Ingredient.Name,
        movement.Ingredient.UnitOfMeasure,
        movement.MovementType,
        movement.Quantity,
        movement.OccurredAt,
        movement.Reason,
        movement.UserId,
        movement.User?.Username);
}
