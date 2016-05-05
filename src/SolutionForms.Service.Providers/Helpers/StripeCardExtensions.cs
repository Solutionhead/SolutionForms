using SolutionForms.Service.Providers.Models;
using Stripe;

namespace SolutionForms.Service.Providers.Helpers
{
    public static class StripeCardExtensions
    {
        public static PaymentInformationReturn ToPaymentInformationReturn(this StripeCard card, StripeCustomer customer)
        {
            return new PaymentInformationReturn
                {
                    Email = customer?.Email,

                    Name = card?.Name,
                    Brand = card?.Brand,
                    Last4 = card?.Last4,

                    ExpirationMonth = card?.ExpirationMonth,
                    ExpirationYear = card?.ExpirationYear,
                    Country = card?.Country,
                    CvcCheck = card?.CvcCheck,

                    AddressCity = card?.AddressCity,
                    AddressCountry = card?.AddressCountry,
                    AddressLine1 = card?.AddressLine1,
                    AddressLine1Check = card?.AddressLine1Check,
                    AddressLine2 = card?.AddressLine2,
                    AddressState = card?.AddressState,
                    AddressZip = card?.AddressZip,
                    AddressZipCheck = card?.AddressZipCheck
                };
        }
    }
}