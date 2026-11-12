using PeriquitoManagement.Api.Configuration;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDatabase(builder.Configuration);
builder.Services.AddProjectDependencies();
builder.Services.AddSwaggerConfiguration();

var app = builder.Build();

app.UseMiddlewareConfiguration();
app.UseSwaggerConfiguration();
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
