using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Mappers.Booking;

namespace Cinema.Application.UseCases.Booking;

public class GetBookingCustomerByEmailUseCase
{
    private readonly IBookingOrderRepository _repository;

    public GetBookingCustomerByEmailUseCase(IBookingOrderRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<ResBookingCustomerLookupDto?>> ExecuteAsync(string email)
    {
        var normalizedEmail = email.Trim();
        var user = string.IsNullOrWhiteSpace(normalizedEmail)
            ? null
            : await _repository.FindUserByEmailAsync(normalizedEmail);

        return new BaseResponse<ResBookingCustomerLookupDto?>
        {
            IsSuccess = true,
            Data = user == null ? null : BookingMapper.ToResBookingCustomerLookupDto(user),
            Message = user == null ? "Customer not found." : "Customer found."
        };
    }
}
