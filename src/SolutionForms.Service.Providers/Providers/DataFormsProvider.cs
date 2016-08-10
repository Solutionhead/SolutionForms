using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Raven.Client;
using SolutionForms.Data.Models;
using SolutionForms.Service.Providers.Helpers;
using SolutionForms.Service.Providers.Parameters;
using SolutionForms.Service.Providers.Returns;
using System.Linq;
using System.Threading;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Raven.Abstractions.Data;
using Raven.Abstractions.Extensions;
using Raven.Client.Connection;
using Raven.Json.Linq;
using SolutionForms.Data.Indexes;
using SolutionForms.Service.Providers.Models;

namespace SolutionForms.Service.Providers.Providers
{
    // ReSharper disable once InconsistentNaming

    public class DataFormsProvider
    {
        private readonly IDocumentStore _documentStore;

        public DataFormsProvider(IDocumentStore documentStore)
        {
            if (documentStore == null) throw new ArgumentNullException(nameof(documentStore));
            _documentStore = documentStore;
        }

        #region Data Form operations

        public async Task<IEnumerable<DataFormReturn>> GetDataForms(string tenant, bool onlyHomepageLinks)
        {
            new DataForms_Menu().Execute(_documentStore.DatabaseCommands.ForDatabase(tenant), _documentStore.Conventions);

            using (var session = _documentStore.OpenAsyncSession(tenant))
            {
                // Appparently, RavenDB can't handle inclusion of variable in filtering expression (!onlyHomepageLinks)
                //return (await session.Query<DataForm, DataForms_Menu>()
                //     .Where(f => !onlyHomepageLinks || f.LinkOnHomePage)
                //     .ToListAsync())
                //     .Project().To<DataFormReturn>();

                var q = onlyHomepageLinks
                    ? session.Query<DataForm, DataForms_Menu>()
                        .Where(f => f.LinkOnHomePage)
                    : session.Query<DataForm>();
                return (await q.ToListAsync()).Project().To<DataFormReturn>();
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
                doc.Components = dataform.Components;
                doc.AuthorizedClaims = dataform.AuthorizedClaims?.ToArray() ?? new string[0];
                doc.DataSourceId = dataform.DataSourceId;
                doc.RestrictDataAccessByOwner = dataform.RestrictDataAccessByOwner;
                doc.LinkOnHomePage = dataform.LinkOnHomePage;

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
                RestrictDataAccessByOwner = dataform.RestrictDataAccessByOwner,
                LinkOnHomePage = dataform.LinkOnHomePage
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

        #endregion

        #region Data Entry operations

        public async Task<IEnumerable<JObject>> GetDataEntriesByEntityName(string tenant, string entityName,
            IEnumerable<KeyValuePair<string, string>> queryParams)
        {
            using (var session = _documentStore.OpenAsyncSession(tenant))
            {
                var query = session.Advanced.AsyncDocumentQuery<dynamic>()
                    .WhereEquals("@metadata.Raven-Entity-Name", entityName)
                    .UsingDefaultOperator(QueryOperator.And);

                AppendQueryStringParams(query, queryParams);

                var queryResult = await query.QueryResultAsync();
                return queryResult.Results.Select(r => JObject.Parse(r.ToJsonDocument().DataAsJson.ToString()));
            }
        }

        private static void AppendQueryStringParams(IAsyncDocumentQuery<dynamic> query, IEnumerable<KeyValuePair<string, string>> queryParams)
        {
            queryParams.ForEach(q =>
            {
                switch (q.Key.ToLowerInvariant())
                {
                    case "$top":
                        int pageSize;
                        if (int.TryParse(q.Value, out pageSize))
                        {
                            query.Take(pageSize);
                        }
                        break;

                    case "$skip":
                        int skipCount;
                        if (int.TryParse(q.Value, out skipCount))
                        {
                            query.Skip(skipCount);
                        }
                        break;
                    case "$filter":
                        query.Where(q.Value);
                        break;
                }
            });
        }

        public async Task<IEnumerable<JObject>> GetDataEntriesByIndexName(string tenant, string indexName,
            IDictionary<string, string> queryParams)
        {
            var query = new IndexQuery
            {
                Query = queryParams.ContainsKey("$filter") ? queryParams["$filter"] : null
            };

            int pageSize;
            if (queryParams.ContainsKey("$top") && int.TryParse(queryParams["$top"], out pageSize))
            {
                query.PageSize = pageSize;
            }

            int skip;
            if (queryParams.ContainsKey("$skip") && int.TryParse(queryParams["$skip"], out skip))
            {
                query.Start = skip;
            }

            var includes = GetQueryStringIncludes(queryParams);

            var queryResult = await _documentStore.AsyncDatabaseCommands.ForDatabase(tenant)
                .QueryAsync(
                    indexName,
                    query, includes
                );

            var jsonResult = queryResult.Results;
            if (queryResult.Includes != null && queryResult.Includes.Count > 0)
            {
                jsonResult.ForEach(r =>
                {
                    includes.ForEach(i =>
                    {
                        r[i.Replace("Id", "")] = r.ContainsKey(i)
                            ? queryResult.Includes.FirstOrDefault(ri => r[i].Value<string>() == ri["Id"].Value<string>())
                            : null;
                    });
                });
            }

            return jsonResult.Select(r => JObject.Parse(r.ToJsonDocument().DataAsJson.ToString()));
            ;
        }

        public async Task<DataEntryCreatedReturn> CreateDataEntryAsync(string tenant, string entityName, object values,
            ApplicationUser ownerUser, bool awaitIndexing = false)
        {
            var jobject = JObject.FromObject(values);
            var id =
                $"{entityName}{_documentStore.Conventions.IdentityPartsSeparator}{_documentStore.DatabaseCommands.NextIdentityFor(entityName)}";
            jobject.Add(DatabaseConstants.IdPropertyName, id);
            await SaveEntryAsync(tenant, entityName, ownerUser, jobject, id);
            if (awaitIndexing)
            {
                await ClearIndexesAsync(tenant);
            }

            return new DataEntryCreatedReturn
            {
                Key = id,
                Entity = jobject
            };
        }

        public async Task<JObject> GetDataEntryByKeyAsync(string tenant, string id)
        {
            var commands = _documentStore.AsyncDatabaseCommands.ForDatabase(tenant);
            var result = await commands.GetAsync(id);
            return result == null
                ? null
                : JObject.Parse(result.DataAsJson.ToString());
        }

        public async Task<JObject> UpdateDataEntryAsync(string tenant, string entityName, string id, object values,
            ApplicationUser userAccount, bool awaitIndexing = false)
        {
            if (await GetDataEntryByKeyAsync(tenant, id) == null)
            {
                return null;
            }
            var jobject = JObject.FromObject(values);
            jobject.Add(DatabaseConstants.IdPropertyName, id);
            await SaveEntryAsync(tenant, entityName, userAccount, jobject, id);
            if (awaitIndexing)
            {
                await ClearIndexesAsync(tenant);
            }
            return jobject;
        }

        public async Task PatchDataEntryAsync(string tenant, string id, ScriptedPatchRequestParameters patchParams,
            ApplicationUser userAccount)
        {
            var commands = _documentStore.AsyncDatabaseCommands.ForDatabase(tenant);
            await commands.PatchAsync(id, patchParams.ToScriptedPatchRequest());
        }

        public async Task DeleteDataEntryAsync(string tenant, string id, bool awaitIndexing = false)
        {
            var commands = _documentStore.AsyncDatabaseCommands.ForDatabase(tenant);
            await commands.DeleteAsync(id, null);
            if (awaitIndexing)
            {
                await ClearIndexesAsync(tenant);
            }
        }

        public IEnumerable<DataEntryCreatedReturn> LoadDataEntriesFromJson(string tenant, string entityName,
            string jsonData, ApplicationUser ownerUser)
        {
            var jsonArray = JArray.Parse(jsonData);
            var maxId = 0;
            using (var bulkInsert = _documentStore.BulkInsert(tenant))
            {
                foreach (var d in jsonArray.Children<JObject>())
                {
                    UserIdentityHelper.SetUserIdentity(d, ownerUser);
                    var entity = RavenJObject.Parse(d.ToString());
                    var meta = new RavenJObject {{"Raven-Entity-Name", entityName}};
                    var id = (string) d["Id"];
                    var identity =
                        int.Parse(
                            id.Substring(
                                id.IndexOf(_documentStore.Conventions.IdentityPartsSeparator, StringComparison.Ordinal) +
                                1));
                    maxId = Math.Max(identity, maxId);
                    bulkInsert.Store(entity, meta, id);
                    yield return new DataEntryCreatedReturn
                    {
                        Key = id,
                        Entity = d
                    };
                }
            }

            _documentStore.DatabaseCommands.SeedIdentityFor(entityName, maxId);
        }

        public async Task SeedIdentityForTable(string entityname, long nextId)
        {
            await _documentStore.AsyncDatabaseCommands.SeedIdentityForAsync(entityname, nextId);
        }

        #endregion

        #region private members

        private static string[] GetQueryStringIncludes(IDictionary<string, string> queryStringParams)
        {
            return queryStringParams.ContainsKey("$includes")
                ? queryStringParams["$includes"].Split(',')
                : null;
        }

        private async Task<PutResult> SaveEntryAsync(string tenant, string entityName, ApplicationUser ownerUser,
            JObject jobject, string id)
        {
            UserIdentityHelper.SetUserIdentity(jobject, ownerUser);

            var dataEntry = JsonConvert.SerializeObject(jobject);
            var commands = _documentStore.AsyncDatabaseCommands.ForDatabase(tenant);

            // NOTE: The PutAsync database command allows us to set the `Raven-Entity-Name` metadata which tells RavenDB to put this entity in it's own entity collection.
            //  Using the `session.Store` or `asyncSession.StoreAsync` methods will cause RavenDB to reflect on the parameter object causing all entites to be stored in
            //  a single entity collection of `JObject` which is not what we want.
            var result = await commands.PutAsync(
                id,
                null,
                RavenJObject.Parse(dataEntry),
                new RavenJObject
                {
                    {"Raven-Entity-Name", entityName},
                });

            return result;
        }

        private async Task ClearIndexesAsync(string tenant)
        {
            await ClearIndexesAsync(_documentStore, tenant, staleIndexes => staleIndexes.Any());
        }

        private async Task ClearIndexAsync(string tenant, string indexName)
        {
            await ClearIndexesAsync(_documentStore, tenant, staleIndexes => staleIndexes.Any(i => i.Equals(indexName)));
        }

        private async Task ClearIndexAsync(string tenant, string[] indexNamees)
        {
            await ClearIndexesAsync(_documentStore, tenant, indexes => indexes.Any(indexNamees.Contains));
        }

        private static async Task ClearIndexesAsync(IDocumentStore documentStore, string tenant, Func<IEnumerable<string>, bool> waitExpression)
        {
            var stats = await documentStore.AsyncDatabaseCommands.ForDatabase(tenant)
                .GetStatisticsAsync();

            var staleIndexes = stats.StaleIndexes;
                Thread.Sleep(10);
            if(waitExpression.Invoke(staleIndexes))
            {
                await ClearIndexesAsync(documentStore, tenant, waitExpression);
            }
        }

        #endregion
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