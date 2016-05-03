using System;
using Raven.Abstractions.Data;
using Raven.Client;
using Raven.Client.Document;
using Raven.Client.Embedded;
using SolutionForms.Data.Indexes;

namespace SolutionForms.Data.Contexts
{
    public class RavenContext : IDisposable
    {
        public static IDocumentStore DocumentStore { get; private set; }
        public static string DatabaseName { get; } = "SolutionForms";

        public static IDocumentStore Init(string connectionString)
        {
#if DEBUG
            //DocumentStore = CreateStoreFromConnectionString(connectionString);
            DocumentStore = CreateEmbeddableStore();
#else
            DocumentStore = CreateStoreFromConnectionString(connectionString);
#endif
            DocumentStore.Initialize();
            DocumentStore.DatabaseCommands.GlobalAdmin.EnsureDatabaseExists(DatabaseName);
            CreateIndexes(DocumentStore);
            return DocumentStore;
        }

        public void Dispose()
        {
            DocumentStore.Dispose();
            DocumentStore = null;
        }

        private static IDocumentStore CreateStoreFromConnectionString(string connectionString)
        {
            var parser = ConnectionStringParser<RavenConnectionStringOptions>.FromConnectionString(connectionString);
            parser.Parse();
            var options = parser.ConnectionStringOptions;
            return new DocumentStore
            {
                Url = options.Url,
                Credentials = options.Credentials,
                Conventions = BuildDocumentConvention(),
                DefaultDatabase = options.DefaultDatabase ?? DatabaseName,
            };
        }

        private static IDocumentStore CreateEmbeddableStore()
        {
            const int embeddableStorePortNumber = 8088;
            Raven.Database.Server.NonAdminHttp.EnsureCanListenToWhenInNonAdminContext(embeddableStorePortNumber);
            return new EmbeddableDocumentStore
            {
                DataDirectory = "App_Data/RavenDB",
                DefaultDatabase = DatabaseName,
                UseEmbeddedHttpServer = true,
                Conventions = BuildDocumentConvention(),
                Configuration = {
                    Port = embeddableStorePortNumber
                }
            };
        }
        private static DocumentConvention BuildDocumentConvention()
        {
            return new DocumentConvention
            {
                IdentityPartsSeparator = "-",
            };
        }

        private static void CreateIndexes(IDocumentStore store)
        {
            new DataForms_Menu().Execute(store);
        }
    }
}