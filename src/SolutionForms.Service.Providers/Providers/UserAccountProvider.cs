using System;
using System.Collections.Generic;
using System.Linq;
using BrockAllen.MembershipReboot;
using Raven.Client;
using Raven.Client.Linq;
using SolutionForms.Service.Providers.Models;

namespace SolutionForms.Service.Providers.Providers
{
    public class UserAccountProvider : IUserAccountRepository<ApplicationUser>, IUserAccountQuery, IDisposable
    {
        public bool UseEqualsOrdinalIgnoreCaseForQueries { get; set; }

        public Func<IRavenQueryable<ApplicationUser>, string, IRavenQueryable<ApplicationUser>> QueryFilter { get; set; }
        public Func<IRavenQueryable<ApplicationUser>, IRavenQueryable<ApplicationUser>> QuerySort { get; set; }

        private readonly IDocumentStore _documentStore;
        private readonly IDocumentSession _documentSession;
        private readonly IRavenQueryable<ApplicationUser> _items;

        public UserAccountProvider(IDocumentStore documentStore)
        {
            _documentStore = documentStore;
            _documentSession = documentStore.OpenSession();
            _items = _documentSession.Query<ApplicationUser>();
        }

        #region IUserAccountRepository<ApplicationUser> implementation

        public ApplicationUser Create()
        {
            return new ApplicationUser();
        }

        public void Add(ApplicationUser item)
        {
            CheckDisposed();
            _documentSession.Store(item);
            _documentSession.SaveChanges();
        }

        public void Remove(ApplicationUser item)
        {
            CheckDisposed();
            _documentSession.Delete(item);
            _documentSession.SaveChanges();
        }

        public void Update(ApplicationUser item)
        {
            CheckDisposed();
            _documentSession.Store(item);
            _documentSession.SaveChanges();
        }

        public ApplicationUser GetByID(Guid id)
        {
            return _items.Customize(x => x.WaitForNonStaleResultsAsOfNow())
                .SingleOrDefault(x => x.ID == id);
        }

        public ApplicationUser GetByUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username)) { return null; }

            return _items.Customize(x => x.WaitForNonStaleResultsAsOfNow())
                    .SingleOrDefault(i =>
                        username == i.Username);
            //username.Equals(i.Username,  UseEqualsOrdinalIgnoreCaseForQueries ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal));
        }

        public ApplicationUser GetByUsername(string tenant, string username)
        {
            if (String.IsNullOrWhiteSpace(tenant) || String.IsNullOrWhiteSpace(username)) { return null; }

            return GetUserAccountsQuery()
                .SingleOrDefault(i => tenant == i.Tenant && username == i.Username);
            //.SingleOrDefault(i => tenant.Equals(i.Tenant, QueryComparison) && username.Equals(i.Username, QueryComparison));
        }

        public ApplicationUser GetByEmail(string tenant, string email)
        {
            if (String.IsNullOrWhiteSpace(tenant) || string.IsNullOrWhiteSpace(email))
            {
                return null;
            }

            return GetUserAccountsQuery()
                .SingleOrDefault(x => tenant == x.Tenant && email == x.Email);
            //.SingleOrDefault(i => tenant.Equals(i.Tenant, QueryComparison) && email == i.Username);
        }

        public ApplicationUser GetByMobilePhone(string tenant, string phone)
        {
            return GetUserAccountsQuery()
                .SingleOrDefault(i => tenant == i.Tenant && phone == i.MobilePhoneNumber);
            //.SingleOrDefault(i => tenant.Equals(i.Tenant, QueryComparison) && phone.Equals(i.MobilePhoneNumber, StringComparison.OrdinalIgnoreCase));
        }

        public ApplicationUser GetByVerificationKey(string key)
        {
            return GetUserAccountsQuery()
                .SingleOrDefault(i => i.VerificationKey == key);
        }

        public ApplicationUser GetByLinkedAccount(string tenant, string provider, string id)
        {
            return _items.SingleOrDefault(x =>
                x.Tenant == tenant
                && x.LinkedAccountClaimCollection.Any(acct => acct.ProviderName == provider && acct.ProviderAccountID == id));

        }

        public ApplicationUser GetByCertificate(string tenant, string thumbprint)
        {
            throw new NotImplementedException();
        }

        #endregion

        #region IUserAccountQuery implementation

        public IEnumerable<string> GetAllTenants()
        {
            return _items.Select(x => x.Tenant).Distinct();
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

            var query = _items
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

            var result = query.Select(a => new UserAccountQueryResult
            {
                ID = a.ID,
                Tenant = a.Tenant,
                Username = a.Username,
                Email = a.Email
            });

            return result;
        }

        protected StringComparison QueryComparison => UseEqualsOrdinalIgnoreCaseForQueries
            ? StringComparison.OrdinalIgnoreCase
            : StringComparison.Ordinal;

        protected IRavenQueryable<ApplicationUser> GetUserAccountsQuery()
        {
            return _items.Customize(x => x.WaitForNonStaleResultsAsOfNow());
        }

        protected void CheckDisposed()
        {
            if (_documentStore == null || _documentSession == null)
            {
                throw new ObjectDisposedException("RavenDbRepository<T>");
            }
        }

        public void Dispose()
        {
            _documentSession.TryDispose();
        }
    }
}
