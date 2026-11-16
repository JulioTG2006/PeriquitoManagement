namespace PeriquitoManagement.Application.DTOs;

public sealed record TableDto(long Id, short TableNumber, short Capacity, string Status);

public sealed record SaveTableRequest(short TableNumber, short Capacity);
