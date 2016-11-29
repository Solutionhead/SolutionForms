using System;
using System.Threading.Tasks;
using Raven.Client;
using SolutionForms.Data.Models;

namespace SolutionForms.Service.Providers.Helpers
{
    public class DataSourceFactory
    {
        private readonly IAsyncDocumentSession _session;

        public DataSourceFactory(IAsyncDocumentSession session)
        {
            if (session == null) throw new ArgumentNullException(nameof(session));
            _session = session;
        }

        public async Task<DataSource> CreateDataSourceAsync(string dataSourceName)
        {
            var documentName = CreateDocumentName(dataSourceName);
            if (await _session.Query<DataSource>().AnyAsync(d => d.Name == documentName))
            {
                throw new ApplicationException("Cannot create data source. A data source with this name already exists");
                //throw new HttpResponseException(new HttpResponseMessage(HttpStatusCode.BadRequest)
                //{
                //    Content = new StringContent("Cannot create data source. A data source with this name already exists")
                //});
            }

            var dataSource = new DataSource
            {
                DocumentName = documentName,
                Name = dataSourceName,
            };
            await _session.StoreAsync(dataSource);
            return dataSource;
        }

        private static string CreateDocumentName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                throw new ArgumentException("Invalid data source name.");
                //throw new HttpResponseException(new HttpResponseMessage(HttpStatusCode.BadRequest)
                //{
                //    Content = new StringContent("Invalid data source name.")
                //});
            }

            //todo: clean symbols and invalid chars
            return name
                .Replace(" ", "-")
                .ToLower();
        }
    }
}