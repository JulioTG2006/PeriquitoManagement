FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["PeriquitoManagement.Domain/PeriquitoManagement.Domain.csproj", "PeriquitoManagement.Domain/"]
COPY ["PeriquitoManagement.Application/PeriquitoManagement.Application.csproj", "PeriquitoManagement.Application/"]
COPY ["PeriquitoManagement.Infrastructure/PeriquitoManagement.Infrastructure.csproj", "PeriquitoManagement.Infrastructure/"]
COPY ["PeriquitoManagement.Api/PeriquitoManagement.Api.csproj", "PeriquitoManagement.Api/"]

RUN dotnet restore "PeriquitoManagement.Api/PeriquitoManagement.Api.csproj"

COPY PeriquitoManagement.Domain/ PeriquitoManagement.Domain/
COPY PeriquitoManagement.Application/ PeriquitoManagement.Application/
COPY PeriquitoManagement.Infrastructure/ PeriquitoManagement.Infrastructure/
COPY PeriquitoManagement.Api/ PeriquitoManagement.Api/

RUN dotnet publish "PeriquitoManagement.Api/PeriquitoManagement.Api.csproj" \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_HTTP_PORTS=10000
EXPOSE 10000
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["sh", "-c", "exec dotnet PeriquitoManagement.Api.dll --urls http://0.0.0.0:${PORT:-10000}"]
