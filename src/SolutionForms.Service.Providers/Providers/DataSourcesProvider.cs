using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Raven.Client;
using SolutionForms.Data.Models;
using SolutionForms.Service.Providers.Helpers;
using SolutionForms.Service.Providers.Returns;

namespace SolutionForms.Service.Providers.Providers
{
    public class DataSourcesProvider
    {
        private readonly IDocumentStore _documentStore;

        public DataSourcesProvider(IDocumentStore documentStore)
        {
            if(documentStore == null) { throw new ArgumentNullException(nameof(documentStore)); }
            _documentStore = documentStore;
        }

        public async Task<IEnumerable<DataSourceReturn>> GetDataSources(string tenant)
        {
            using (var session = _documentStore.OpenAsyncSession(tenant))
            {
                return (await session.Query<DataSource>().ToListAsync())
                    .Project().To<DataSourceReturn>();
            }
        }

    }
}