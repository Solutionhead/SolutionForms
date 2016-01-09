using System;
using System.Threading.Tasks;
using Raven.Client;
using SolutionForms.Data.Models;
using SolutionForms.Service.Providers.Enums;
using SolutionForms.Service.Providers.Parameters;

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
            using (var session = _documentStore.OpenAsyncSession())
            {
                try
                {
                    if (await LookupTenantByDomainAsync(values.OrganizationDomain, session))
                    {
                        return CreateTenantResult.DuplicateTenantDomainExists;
                    }

                    await session.StoreAsync(new Organization
                    {
                        OrganizationDomain = values.OrganizationDomain.ToLowerInvariant(),
                        OrganizationName = values.OrganizationName
                    });
                    await session.SaveChangesAsync();
                    return CreateTenantResult.TenantCreated;
                }
                catch (Exception) { 
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