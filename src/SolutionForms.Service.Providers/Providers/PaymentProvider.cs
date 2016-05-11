using System;
using System.Threading.Tasks;
using Raven.Client;
using SolutionForms.Data.Models;
using SolutionForms.Service.Providers.Helpers;
using SolutionForms.Service.Providers.Models;
using Stripe;

namespace SolutionForms.Service.Providers.Providers
{
    public class PaymentProvider
    {
        private readonly IDocumentStore _documentStore;

        public PaymentProvider(IDocumentStore documentStore)
        {
            if(documentStore == null) { throw new ArgumentNullException(nameof(documentStore)); }
            _documentStore = documentStore;
        }

        public async Task<PaymentInformationReturn> GetPaymentInformationAsync(string tenantDomain)
        {
            using(var session = _documentStore.OpenAsyncSession())
            {
                try
                {
                    var organization = await session.Query<Organization>().FirstOrDefaultAsync(o => o.OrganizationDomain == tenantDomain);
                    if(organization == null)
                    {
                        throw new Exception(string.Format("Could not find Organization for Domain '{0}'.", tenantDomain));
                    }

                    var customer = await new StripeCustomerService().GetAsync(organization.CustomerId);
                    if(customer == null)
                    {
                        throw new Exception("Could not load customer data.");
                    }

                    return customer.DefaultSource.ToPaymentInformationReturn(customer);
                }
                catch(Exception)
                {
                    session.Dispose();
                    throw;
                }
            }
        }

        public async Task<StripeCustomer> SetPaymentInformationAsync(string tenantDomain, SetPaymentInformationParameters parameters)
        {
            using(var session = _documentStore.OpenAsyncSession())
            {
                try
                {
                    var organization = await session.Query<Organization>().FirstOrDefaultAsync(o => o.OrganizationDomain == tenantDomain);
                    if(organization == null)
                    {
                        throw new Exception(string.Format("Could not find Organization for Domain '{0}'.", tenantDomain));
                    }
                    if (organization.CustomerId == null)
                    {
                        throw new Exception($"The customer {tenantDomain} does not have an associated Stripe customer ID.");
                    }

                    var stripeCustomerService = new StripeCustomerService();
                    var customer = await stripeCustomerService.GetAsync(organization.CustomerId);
                    if(customer == null)
                    {
                        throw new Exception("Could not load customer data.");
                    }

                    var cardService = new StripeCardService();
                    if(customer.DefaultSourceId != null)
                    {
                        await cardService.DeleteAsync(customer.Id, customer.DefaultSourceId);
                    }

                    return await stripeCustomerService.UpdateAsync(customer.Id, parameters.ToStripeCustomerUpdateOptions());
                }
                catch(Exception)
                {
                    session.Dispose();
                    throw;
                }
            }
        }
    }
}