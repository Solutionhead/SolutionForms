using System;
using System.Collections.Generic;
using System.Linq;
using BrockAllen.MembershipReboot;
using Raven.Client;
using Raven.Client.Linq;
using SolutionForms.Service.Providers.Models;

namespace SolutionForms.Service.Providers.Providers
{
    //NOTE: note all methods can be executed as async due to dependency on MembershipReboot interface contracts: IUserAccountRepository, and IUserAccountQuery
    public class MembershipProvider : IUserAccountRepository<ApplicationUser>, IUserAccountQuery
    {
        public bool UseEqualsOrdinalIgnoreCaseForQueries { get; set; }

        public Func<IRavenQueryable<ApplicationUser>, string, IRavenQueryable<ApplicationUser>> QueryFilter { get; set; }
        public Func<IRavenQueryable<ApplicationUser>, IRavenQueryable<ApplicationUser>> QuerySort { get; set; }

        private readonly IDocumentStore _documentStore;

        public MembershipProvider(IDocumentStore documentStore)
        {
            _documentStore = documentStore;
        }

        #region IUserAccountRepository<ApplicationUser> implementation

        public ApplicationUser Create()
        {
            return new ApplicationUser();
        }

        public async void Add(ApplicationUser item)
        {
            using (var session = _documentStore.OpenAsyncSession())
            {
                await session.StoreAsync(item);
                await session.SaveChangesAsync();
            }
        }

        public async void Remove(ApplicationUser item)
        {
            using (var session = _documentStore.OpenAsyncSession())
            {
                session.Delete(item);
                await session.SaveChangesAsync();
            }
        }

        public async void Update(ApplicationUser item)
        {
            using (var session = _documentStore.OpenAsyncSession())
            {
                await session.StoreAsync(item);
                await session.SaveChangesAsync();
            }
        }

        public ApplicationUser GetByID(Guid id)
        {
            using (var session = _documentStore.OpenSession())
            {
                return GetUserAccountsQuery(session)
                    .SingleOrDefault(x => x.ID == id);
            }
        }

        public ApplicationUser GetByUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username)) { return null; }

            using (var session = _documentStore.OpenSession())
            {
                return GetUserAccountsQuery(session)
                    .Customize(x => x.WaitForNonStaleResultsAsOfNow())
                    .SingleOrDefault(i => username == i.Username);
            }
        }

        public ApplicationUser GetByUsername(string tenant, string username)
        {
            if (string.IsNullOrWhiteSpace(tenant) || string.IsNullOrWhiteSpace(username)) { return null; }

            using (var session = _documentStore.OpenSession())
            {
                return GetUserAccountsQuery(session)
                    .SingleOrDefault(i => tenant == i.Tenant && username == i.Username);
            }
        }

        public ApplicationUser GetByEmail(string tenant, string email)
        {
            if (string.IsNullOrWhiteSpace(tenant) || string.IsNullOrWhiteSpace(email))
            {
                return null;
            }

            using (var session = _documentStore.OpenSession())
            {
                return GetUserAccountsQuery(session)
                .SingleOrDefault(x => tenant == x.Tenant && email == x.Email);
            }
        }

        public ApplicationUser GetByMobilePhone(string tenant, string phone)
        {
            using (var session = _documentStore.OpenSession())
            {
                return GetUserAccountsQuery(session)
                    .SingleOrDefault(i => tenant == i.Tenant && phone == i.MobilePhoneNumber);
            }
        }

        public ApplicationUser GetByVerificationKey(string key)
        {
            using (var session = _documentStore.OpenSession())
            {
                return GetUserAccountsQuery(session)
                    .SingleOrDefault(i => i.VerificationKey == key);
            }
        }

        public ApplicationUser GetByLinkedAccount(string tenant, string provider, string id)
        {
            using (var session = _documentStore.OpenSession())
            {
                return GetUserAccountsQuery(session)
                    .SingleOrDefault(x =>
                        x.Tenant == tenant 
                        && x.LinkedAccountClaimCollection.Any(acct => 
                            acct.ProviderName == provider && acct.ProviderAccountID == id));
            }
        }

        public ApplicationUser GetByCertificate(string tenant, string thumbprint)
        {
            throw new NotImplementedException();
        }

        #endregion

        #region IUserAccountQuery implementation

        public IEnumerable<string> GetAllTenants()
        {
            using (var session = _documentStore.OpenSession())
            {
                return GetUserAccountsQuery(session).Select(x => x.Tenant).Distinct();
            }
        }

        public IEnumerable<UserAccountQueryResult> Query(string filter)
        {
            return QueryCommon(null, filter);
        }

        public IEnumerable<UserAccountQueryResult> Query(string tenant, string filter)
        {
            return QueryCommon(tenant, filter);
        }

        public IEnumerable<UserAccountQueryResult> Query(string filter, int skip, int count, out int totalCount)
        {
            return Query(null, filter, skip, count, out totalCount);
        }

        public IEnumerable<UserAccountQueryResult> Query(string tenant, string filter, int skip, int count,
            out int totalCount)
        {
            var query = QueryCommon(tenant, filter)
                .Skip(skip).Take(count);

            totalCount = query.Count();
            return query;
        }

        #endregion

        protected IQueryable<UserAccountQueryResult> QueryCommon(string tenant, string filter)
        {
            var skipTenantFilter = string.IsNullOrWhiteSpace(tenant);

            using (var session = _documentStore.OpenSession())
            {
                var query = GetUserAccountsQuery(session)
                    .Where(i => skipTenantFilter || tenant == i.Tenant)
                    .Select(i => i);

                if (!string.IsNullOrWhiteSpace(filter) && QueryFilter != null)
                {
                    query = QueryFilter(query, filter);
                }
                if (QuerySort != null)
                {
                    query = QuerySort(query);
                }

                return query.Select(a => new UserAccountQueryResult
                {
                    ID = a.ID,
                    Tenant = a.Tenant,
                    Username = a.Username,
                    Email = a.Email
                });
            }
        }

        protected StringComparison QueryComparison => UseEqualsOrdinalIgnoreCaseForQueries
            ? StringComparison.OrdinalIgnoreCase
            : StringComparison.Ordinal;

        protected IRavenQueryable<ApplicationUser> GetUserAccountsQuery(IAsyncDocumentSession session)
        {
            return session.Query<ApplicationUser>()
                .Customize(x => x.WaitForNonStaleResultsAsOfNow());
        }
        protected IRavenQueryable<ApplicationUser> GetUserAccountsQuery(IDocumentSession session)
        {
            return session.Query<ApplicationUser>()
                .Customize(x => x.WaitForNonStaleResultsAsOfNow());
        }
    }
}
