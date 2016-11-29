using AutoMapper;
using SolutionForms.Client.Mvc.Models;
using SolutionForms.Service.Providers.Models;

namespace SolutionForms.Client.Mvc
{
    public static class AutoMapperConfig
    {
        public static void Configure()
        {
            Mapper.CreateMap<PaymentInformationReturn, PaymentInformationResponse>();
            Mapper.CreateMap<SetPaymentInformationRequest, SetPaymentInformationParameters>();
        }
    }
}