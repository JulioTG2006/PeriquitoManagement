namespace PeriquitoManagement.Application.Exceptions;

public sealed class ValidationException(
    IReadOnlyDictionary<string, string[]> errors,
    string message = "One or more validation errors occurred.")
    : Exception(message)
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;
}
