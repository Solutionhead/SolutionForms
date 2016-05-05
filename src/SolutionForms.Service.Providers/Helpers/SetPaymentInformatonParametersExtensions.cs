using SolutionForms.Service.Providers.Models;
using Stripe;

namespace SolutionForms.Service.Providers.Helpers
{
    public static class SetPaymentInformatonParametersExtensions
    {
        public static StripeSourceOptions ToStripeSourceOptions(this SetPaymentInformationParameters creditCardInfo)
        {
            return new StripeSourceOptions
                {
                    Object = "card",
                    Number = creditCardInfo.Number,
                    ExpirationYear = creditCardInfo.ExpirationYear,
                    ExpirationMonth = creditCardInfo.ExpirationMonth,
                    AddressCountry = creditCardInfo.AddressCountry,
                    AddressLine1 = creditCardInfo.AddressLine1,
                    AddressLine2 = creditCardInfo.AddressLine2,
                    AddressCity = creditCardInfo.AddressCity,
                    AddressState = creditCardInfo.AddressState,
                    AddressZip = creditCardInfo.AddressZip,
                    Name = creditCardInfo.Name,
                    Cvc = creditCardInfo.Cvc
                };
        }
    }
}