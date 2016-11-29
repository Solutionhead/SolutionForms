using System;
using SolutionForms.Service.Providers.Models;
using Stripe;

namespace SolutionForms.Service.Providers.Helpers
{
    public static class SetPaymentInformatonParametersExtensions
    {
        public static StripeCustomerUpdateOptions ToStripeCustomerUpdateOptions(this SetPaymentInformationParameters parameters)
        {
            return new StripeCustomerUpdateOptions
            {
                SourceToken = parameters.PaymentToken,
                Email = parameters.EmailAddress
            };
        }

    }
}