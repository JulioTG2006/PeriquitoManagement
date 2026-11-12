using MediatR;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.Exceptions;
using PeriquitoManagement.Domain.Entities;
using PeriquitoManagement.Domain.Interfaces;

namespace PeriquitoManagement.Application.UseCases.Categories;

public sealed record GetCategoriesQuery : IRequest<IReadOnlyList<CategoryDto>>;
public sealed record GetCategoryByIdQuery(long Id) : IRequest<CategoryDto>;
public sealed record CreateCategoryCommand(string? Name, bool IsActive = true) : IRequest<CategoryDto>;
public sealed record UpdateCategoryCommand(long Id, string? Name, bool IsActive) : IRequest<CategoryDto>;
public sealed record DeleteCategoryCommand(long Id) : IRequest;

public sealed class GetCategoriesHandler(IRepository<Category> categories)
    : IRequestHandler<GetCategoriesQuery, IReadOnlyList<CategoryDto>>
{
    public async Task<IReadOnlyList<CategoryDto>> Handle(
        GetCategoriesQuery request,
        CancellationToken cancellationToken)
    {
        var entities = await categories.GetAllAsync(cancellationToken);
        return entities.Select(category =>
            new CategoryDto(category.Id, category.Name, category.IsActive)).ToArray();
    }
}

public sealed class GetCategoryByIdHandler(IRepository<Category> categories)
    : IRequestHandler<GetCategoryByIdQuery, CategoryDto>
{
    public async Task<CategoryDto> Handle(
        GetCategoryByIdQuery request,
        CancellationToken cancellationToken)
    {
        var category = await categories.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Category {request.Id} was not found.");

        return new CategoryDto(category.Id, category.Name, category.IsActive);
    }
}

public sealed class CreateCategoryHandler(
    IRepository<Category> categories,
    ICategoryRepository categoryQueries,
    IUnitOfWork unitOfWork)
    : IRequestHandler<CreateCategoryCommand, CategoryDto>
{
    public async Task<CategoryDto> Handle(
        CreateCategoryCommand request,
        CancellationToken cancellationToken)
    {
        var name = CategoryName.Validate(request.Name);
        if (await categoryQueries.NameExistsAsync(name, cancellationToken: cancellationToken))
            throw new ConflictException("A category with this name already exists.");

        var category = new Category { Name = name, IsActive = request.IsActive };
        await categories.AddAsync(category, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new CategoryDto(category.Id, category.Name, category.IsActive);
    }
}

public sealed class UpdateCategoryHandler(
    IRepository<Category> categories,
    ICategoryRepository categoryQueries,
    IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateCategoryCommand, CategoryDto>
{
    public async Task<CategoryDto> Handle(
        UpdateCategoryCommand request,
        CancellationToken cancellationToken)
    {
        var category = await categories.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Category {request.Id} was not found.");
        var name = CategoryName.Validate(request.Name);

        if (await categoryQueries.NameExistsAsync(name, request.Id, cancellationToken))
            throw new ConflictException("A category with this name already exists.");

        category.Name = name;
        category.IsActive = request.IsActive;
        categories.Update(category);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new CategoryDto(category.Id, category.Name, category.IsActive);
    }
}

public sealed class DeleteCategoryHandler(
    IRepository<Category> categories,
    ICategoryRepository categoryQueries,
    IUnitOfWork unitOfWork)
    : IRequestHandler<DeleteCategoryCommand>
{
    public async Task Handle(
        DeleteCategoryCommand request,
        CancellationToken cancellationToken)
    {
        var category = await categories.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Category {request.Id} was not found.");

        if (await categoryQueries.HasDishesAsync(request.Id, cancellationToken))
            throw new ConflictException("A category with related dishes cannot be deleted.");

        categories.Delete(category);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

internal static class CategoryName
{
    private const int MaximumLength = 80;

    public static string Validate(string? name)
    {
        var normalized = name?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["name"] = ["Name is required."]
            });
        }

        if (normalized.Length > MaximumLength)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["name"] = [$"Name must not exceed {MaximumLength} characters."]
            });
        }

        return normalized;
    }
}
