using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Raven.Client;
using SolutionForms.Data.Models;
using SolutionForms.Service.Providers.Helpers;
using SolutionForms.Service.Providers.Parameters;
using SolutionForms.Service.Providers.Returns;
using System.Linq;

namespace SolutionForms.Service.Providers.Providers
{
    public class DataFormsProvider
    {
        private readonly IDocumentStore _documentStore;

        public DataFormsProvider(IDocumentStore documentStore)
        {
            if(documentStore == null) throw new ArgumentNullException(nameof(documentStore));
            _documentStore = documentStore;
        }

        public IEnumerable<DataFormResponse> GetDataForms()
        {
            using (var session = _documentStore.OpenAsyncSession())
            {
                return session.Query<DataForm>()
                    .Project().To<DataFormResponse>();
            }
        }

        public async Task<DataFormResponse> GetDataFormAsync(string id)
        {
            using (var session = _documentStore.OpenAsyncSession())
            {
                var dataform = await session
                    .Include<DataSource>(m => m.Id)
                    .LoadAsync<DataForm>(id);

                var response = dataform.Map().To<DataFormResponse>();
                response.DataSource = (await session.LoadAsync<DataSource>(dataform.DataSourceId))
                    .Map().To<DataSourceResponse>();

                return response;
            }
        }

        public async Task UpdateDataFormAsync(string id, UpdateDataformRequest dataform)
        {
            using (var session = _documentStore.OpenAsyncSession())
            {
                var doc = await session.LoadAsync<DataForm>(id);
                if (doc == null) return;

                //var user = _userAccountService.GetByUsername(User.Identity.Name);
                //AuthorizationHelper.EnsureUserIsAuthorized(doc, user);

                doc.Description = dataform.Description;
                doc.Title = dataform.Title;
                doc.Fields = new List<FieldConfiguration>(dataform.Fields.Project().To<FieldConfiguration>());
                doc.Plugins = dataform.Plugins;
                doc.AuthorizedClaims = dataform.AuthorizedClaims?.ToArray() ?? new string[0];
                doc.DataSourceId = dataform.DataSourceId;

                if (!string.IsNullOrWhiteSpace(dataform.NewDataSourceName))
                {
                    var factory = new DataSourceFactory(session);
                    doc.DataSourceId = (await factory.CreateDataSourceAsync(dataform.NewDataSourceName)).Id;
                }

                await session.SaveChangesAsync();
            }
        }

        public async Task<CreateDataFormResponse> CreateDataFormAsync(CreateDataformRequest dataform)
        {
            var entity = new DataForm
            {
                Description = dataform.Description,
                Title = dataform.Title,
                Fields = dataform.Fields.Project().To<FieldConfiguration>().ToList(),
                Plugins = dataform.Plugins,
                AuthorizedClaims = dataform.AuthorizedClaims as string[],
                DataSourceId = dataform.DataSourceId,
            };

            using (var session = _documentStore.OpenAsyncSession())
            {
                try
                {
                    if (!string.IsNullOrWhiteSpace(dataform.NewDataSourceName))
                    {
                        var factory = new DataSourceFactory(session);
                        entity.DataSourceId = (await factory.CreateDataSourceAsync(dataform.NewDataSourceName)).Id;
                    }

                    await session.StoreAsync(entity);
                    await session.SaveChangesAsync();

                    return entity.Map().To<CreateDataFormResponse>();
                }
                catch (Exception)
                {
                    session.Dispose();
                    throw;
                }
            }
        }

        public async Task DeleteDataFormAsync(int id)
        {
            using (var session = _documentStore.OpenAsyncSession())
            {
                var dataform = await session.LoadAsync<DataForm>(id);
                if (dataform == null) { return; }

                try
                {
                    session.Delete(dataform);
                    await session.SaveChangesAsync();
                }
                catch
                {
                    session.Dispose();
                    throw;
                }
            }
        }
    }
}