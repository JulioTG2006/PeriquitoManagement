using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using PeriquitoManagement.Application.Exceptions;

namespace PeriquitoManagement.Api.Middleware;

public sealed class ExceptionMiddleware(
    RequestDelegate next,
    ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
        }
        catch (Exception exception)
        {
            if (context.Response.HasStarted)
            {
                logger.LogError(
                    "Request failed after the response started with {ExceptionType}.",
                    exception.GetType().Name);
                throw;
            }

            var (status, title, detail) = exception switch
            {
                ValidationException => (StatusCodes.Status400BadRequest,
                    "Validation failed", exception.Message),
                BadHttpRequestException => (StatusCodes.Status400BadRequest,
                    "Bad request", "The request could not be processed."),
                NotFoundException => (StatusCodes.Status404NotFound,
                    "Resource not found", exception.Message),
                ConflictException => (StatusCodes.Status409Conflict,
                    "Conflict", exception.Message),
                _ => (StatusCodes.Status500InternalServerError,
                    "Internal server error", "An unexpected error occurred.")
            };

            if (status == StatusCodes.Status500InternalServerError)
            {
                logger.LogError(
                    "Unhandled request exception of type {ExceptionType}.",
                    exception.GetType().Name);
            }
            else
            {
                logger.LogWarning(
                    "Request rejected with status {StatusCode} ({ExceptionType}).",
                    status,
                    exception.GetType().Name);
            }

            context.Response.Clear();
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/problem+json";

            ProblemDetails problem = exception is ValidationException validation
                ? new ValidationProblemDetails(
                    validation.Errors.ToDictionary(
                        entry => entry.Key,
                        entry => entry.Value))
                : new ProblemDetails();

            problem.Status = status;
            problem.Title = title;
            problem.Detail = detail;
            problem.Type = $"https://httpstatuses.com/{status}";

            await JsonSerializer.SerializeAsync(context.Response.Body, problem, cancellationToken: context.RequestAborted);
        }
    }
}



