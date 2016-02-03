using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Raven.Client;
using SolutionForms.Data.Models;
using SolutionForms.Service.Providers.Helpers;
using SolutionForms.Service.Providers.Parameters;
using SolutionForms.Service.Providers.Returns;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Raven.Abstractions.Data;
using Raven.Client.Connection;
using Raven.Json.Linq;
using SolutionForms.Service.Providers.Models;

namespace SolutionForms.Service.Providers.Providers
{
    public class DataFormsProvider
    {
        private readonly IDocumentStore _documentStore;

        public DataFormsProvider(IDocumentStore documentStore)
        {
            if (documentStore == null) throw new ArgumentNullException(nameof(documentStore));
            _documentStore = documentStore;
        }

        public async Task<IEnumerable<DataFormReturn>> GetDataForms(string tenant)
        {
            using (var session = _documentStore.OpenAsyncSession(tenant))
            {
                return (await session.Query<DataForm>().ToListAsync())
                    .Project().To<DataFormReturn>();
            }
        }

        public async Task<DataFormReturn> GetDataFormAsync(string tenant, string id)
        {
            using (var session = _documentStore.OpenAsyncSession(tenant))
            {
                var dataform = await session
                    .Include<DataSource>(m => m.Id)
                    .LoadAsync<DataForm>(id);

                var response = dataform.Map().To<DataFormReturn>();
                response.DataSource = (await session.LoadAsync<DataSource>(dataform.DataSourceId))
                    .Map().To<DataSourceReturn>();

                return response;
            }
        }

        public async Task UpdateDataFormAsync(string tenant, string id, UpdateDataformRequest dataform)
        {
            using (var session = _documentStore.OpenAsyncSession(tenant))
            {
                var doc = await session.LoadAsync<DataForm>(id);
                if (doc == null) return;
                
                doc.Description = dataform.Description;
                doc.Title = dataform.Title;
                doc.Fields = new List<FieldConfiguration>(dataform.Fields.Project().To<FieldConfiguration>());
                doc.Plugins = dataform.Plugins;
                doc.AuthorizedClaims = dataform.AuthorizedClaims?.ToArray() ?? new string[0];
                doc.DataSourceId = dataform.DataSourceId;
                doc.RestrictDataAccessByOwner = dataform.RestrictDataAccessByOwner;

                if (!string.IsNullOrWhiteSpace(dataform.NewDataSourceName))
                {
                    var factory = new DataSourceFactory(session);
                    doc.DataSourceId = (await factory.CreateDataSourceAsync(dataform.NewDataSourceName)).Id;
                }

                await session.SaveChangesAsync();
            }
        }

        public async Task<CreateDataFormReturn> CreateDataFormAsync(string tenant, CreateDataformRequest dataform)
        {
            var entity = new DataForm
            {
                Description = dataform.Description,
                Title = dataform.Title,
                Fields = dataform.Fields.Project().To<FieldConfiguration>().ToList(),
                Plugins = dataform.Plugins,
                AuthorizedClaims = dataform.AuthorizedClaims as string[],
                DataSourceId = dataform.DataSourceId,
                RestrictDataAccessByOwner = dataform.RestrictDataAccessByOwner
            };

            using (var session = _documentStore.OpenAsyncSession(tenant))
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

                    return entity.Map().To<CreateDataFormReturn>();
                }
                catch (Exception)
                {
                    session.Dispose();
                    throw;
                }
            }
        }

        public async Task DeleteDataFormAsync(string tenant, int id)
        {
            using (var session = _documentStore.OpenAsyncSession(tenant))
            {
                var dataform = await session.LoadAsync<DataForm>(id);
                if (dataform == null)
                {
                    return;
                }

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

        public async Task<IEnumerable<JObject>> GetDataEntriesByEntityName(string tenant, string entityName, IEnumerable<KeyValuePair<string, string>> queryParams)
        {
            using (var session = _documentStore.OpenAsyncSession(tenant))
            {
                var query = session.Advanced.AsyncDocumentQuery<dynamic>()
                    .WhereEquals("@metadata.Raven-Entity-Name", entityName)
                    .UsingDefaultOperator(QueryOperator.And);

                queryParams
                    .Where(param => string.Equals(param.Key, "$filter", StringComparison.OrdinalIgnoreCase))
                        .ToList()
                        .ForEach(filterParam => { query.Where(filterParam.Value); });

                var queryResult = await query.QueryResultAsync();
                return queryResult.Results.Select(r => JObject.Parse(r.ToJsonDocument().DataAsJson.ToString()));
            }
        }

        public async Task<DataEntryCreatedReturn> CreateDataEntryAsync(string tenant, string entityName, object values, ApplicationUser ownerUser)
        {
            var jobject = JObject.FromObject(values);
            var id = $"{entityName}{_documentStore.Conventions.IdentityPartsSeparator}{_documentStore.DatabaseCommands.NextIdentityFor(entityName)}";
            jobject.Add(DatabaseConstants.IdPropertyName, id);
            await SaveEntryAsync(tenant, entityName, ownerUser, jobject, id);

            return new DataEntryCreatedReturn
            {
                Key = id,
                Entity = jobject
            };
        }

        private async Task SaveEntryAsync(string tenant, string entityName, ApplicationUser ownerUser, JObject jobject, string id)
        {
            UserIdentityHelper.SetUserIdentity(jobject, ownerUser);

            var dataEntry = JsonConvert.SerializeObject(jobject);
            var commands = _documentStore.AsyncDatabaseCommands.ForDatabase(tenant);

            // NOTE: The PutAsync database command allows us to set the `Raven-Entity-Name` metadata which tells RavenDB to put this entity in it's own entity collection.
            //  Using the `session.Store` or `asyncSession.StoreAsync` methods will cause RavenDB to reflect on the parameter object causing all entites to be stored in
            //  a single entity collection of `JObject` which is not what we want.
            await commands.PutAsync(
                id,
                null,
                RavenJObject.Parse(dataEntry),
                new RavenJObject
                {
                    {"Raven-Entity-Name", entityName},
                });
        }

        public async Task<JObject> GetDataEntryByKeyAsync(string tenant, string id)
        {
            var commands = _documentStore.AsyncDatabaseCommands.ForDatabase(tenant);
            var result = await commands.GetAsync(id);
            return result == null
                ? null
                : JObject.Parse(result.DataAsJson.ToString());
        }

        public async Task<JObject> UpdateDataEntryAsync(string tenant, string entityName, string id, object values, ApplicationUser userAccount)
        {
            if (await GetDataEntryByKeyAsync(tenant, id) == null)
            {
                return null;
            }
            var jobject = JObject.FromObject(values);
            await SaveEntryAsync(tenant, entityName, userAccount, jobject, id);
            return jobject;
        }
    }
    
    public class DataEntryCreatedReturn
    {
        public string Key { get; set; }
        public object Entity { get; set; }
    }
    public static class DatabaseConstants
    {
        public const string GetByIdRouteName = "GetDynamicEntityByIdRoute";
        public const string GetQueryRouteName = "GetDynamicEntityQueryRoute";
        public const string PostRouteName = "PostDynamicEntityQueryRoute";
        public const string PutRouteName = "PutDynamicEntityQueryRoute";
        public const string IdPropertyName = "Id";
        public const string UserNamePropertyName = "Last-Modified-By";
    }
    public static class UserIdentityHelper
    {
        public static void SetUserIdentity(JObject target, ApplicationUser user)
        {
            target.Add(DatabaseConstants.UserNamePropertyName, user.ID);
        }
    }

}