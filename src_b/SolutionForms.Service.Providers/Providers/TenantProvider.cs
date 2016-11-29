using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Raven.Client;
using SolutionForms.Data.Models;
using SolutionForms.Service.Providers.Enums;
using SolutionForms.Service.Providers.Parameters;
using Stripe;

namespace SolutionForms.Service.Providers.Providers
{
    public class TenantProvider
    {
        private readonly IDocumentStore _documentStore;

        public TenantProvider(IDocumentStore documentStore)
        {
            if(documentStore == null) {  throw new ArgumentNullException(nameof(documentStore)); }
            _documentStore = documentStore;
        }

        public async Task<bool> LookupTenantByDomainAsync(string tenantDomain)
        {
            using (var session = _documentStore.OpenAsyncSession())
            {
                try
                {
                    return await LookupTenantByDomainAsync(tenantDomain, session);
                }
                catch (Exception)
                {
                    session.Dispose();
                    throw;
                }
            }
        }
        
        public async Task<CreateTenantResult> CreateTenantAsync(CreateTenantParameters values)
        {
            var tenant = values.OrganizationDomain.ToLowerInvariant();
            _documentStore.DatabaseCommands.GlobalAdmin.EnsureDatabaseExists(tenant);

            //Note: Organization records are stored in the main db
            using (var session = _documentStore.OpenAsyncSession())
            {
                try
                {
                    if(await LookupTenantByDomainAsync(tenant, session))
                    {
                        return CreateTenantResult.DuplicateTenantDomainExists;
                    }

                    var customerService = new StripeCustomerService();
                    var customer = await customerService.CreateAsync(new StripeCustomerCreateOptions
                        {
                            Description = values.OrganizationName,
                            Metadata = new Dictionary<string, string>
                                {
                                    { "Domain", tenant }
                                }
                        });

                    await session.StoreAsync(new Organization
                        {
                            OrganizationDomain = tenant,
                            OrganizationName = values.OrganizationName,
                            CustomerId = customer.Id,
                            PaymentStatus = PaymentStatus.NotRequired
                        });

                    await session.SaveChangesAsync();

                    return CreateTenantResult.TenantCreated;
                }
                catch(Exception)
                { 
                    session.Dispose();
                    throw;
                }
            }
        }

        #region private helpers

        private static async Task<bool> LookupTenantByDomainAsync(string tenantDomain, IAsyncDocumentSession session)
        {
            var search = tenantDomain.ToLowerInvariant();
            return await session.Query<Organization>().AnyAsync(org => org.OrganizationDomain == search);
        }

        #endregion

    }
}