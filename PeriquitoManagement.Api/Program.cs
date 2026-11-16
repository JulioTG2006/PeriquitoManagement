using PeriquitoManagement.Api.Configuration;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDatabase(builder.Configuration);
builder.Services.AddProjectDependencies();
builder.Services.AddSwaggerConfiguration();
builder.Services.AddAuthenticationConfiguration(builder.Configuration);

var app = builder.Build();

app.UseMiddlewareConfiguration();
app.UseSwaggerConfiguration();
app.UseAuthenticationConfiguration();
app.UseHttpsRedirection();
app.MapControllers();

await app.InitializeBootstrapUsersAsync();

app.Run();
