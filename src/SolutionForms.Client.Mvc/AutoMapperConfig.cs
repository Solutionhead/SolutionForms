using AutoMapper;
using SolutionForms.Client.Mvc.Models;
using SolutionForms.Service.Providers.Models;

namespace SolutionForms.Client.Mvc
{
    public static class AutoMapperConfig
    {
        public static MapperConfiguration Configuration
        {
            get
            {
                if(_configuration == null)
                {
                    _configuration = new MapperConfiguration(Configure);
                }
                return _configuration;
            }
        }
        private static MapperConfiguration _configuration;

        private static void Configure(IMapperConfiguration configuration)
        {
            configuration.CreateMap<PaymentInformationReturn, PaymentInformationResponse>();
            configuration.CreateMap<SetPaymentInformationRequest, SetPaymentInformationParameters>();
        }
    }
}