namespace PeriquitoManagement.Infrastructure.Services;

public sealed class BootstrapUserOptions
{
    public const string SectionName = "BootstrapUsers";

    public bool Enabled { get; set; }
    public BootstrapUserAccount Administrator { get; set; } = new();
    public BootstrapUserAccount Waiter { get; set; } = new();
}

public sealed class BootstrapUserAccount
{
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
