using System;
using System.Threading.Tasks;
using Raven.Client;
using Raven.Client.Linq;
using SolutionForms.Data.Models;
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

        public async Task<bool> LookupTenantByDomain(string tenantDomain)
        {
            var search = tenantDomain.ToLowerInvariant();
            using (var session = _documentStore.OpenAsyncSession())
            {
                try
                {
                    return await session.Query<Organization>()
                        .AnyAsync(org => org.OrganizationDomain == search);
                }
                catch (Exception)
                {
                    session.Dispose();
                    throw;
                }
            }
        }

        public async Task CreateTenantAsync(CreateTenantParameters values)
        {
            using (var session = _documentStore.OpenAsyncSession())
            {
                try
                {
//todo: prevent duplication of organization domain
                    //await session.Query<Organization>()
                    //    .FirstOrDefaultAsync(org => org.O)

                    await session.StoreAsync(new Organization
                    {
                        OrganizationDomain = values.OrganizationDomain.ToLowerInvariant(),
                        OrganizationName = values.OrganizationName
                    });
                    await session.SaveChangesAsync();
                }
                catch (Exception) { 
                    session.Dispose();
                    throw;
                }
            }
        }
    }
}