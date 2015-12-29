using System;
using System.Configuration;
using Raven.Client;
using Raven.Client.Document;
using Raven.Client.Embedded;

namespace SolutionForms.Client.Mvc.Entities
{
    public class RavenContext : IDisposable
    {
        internal const int EmbeddableStorePortNumber = 8088;
        public static IDocumentStore DocumentStore { get; private set; }
        public static string DatabaseName { get; } = ConfigurationManager.AppSettings["databaseName"] ?? "SolutionForms";

        public static IDocumentStore Init()
        {
            DocumentStore = CreateEmbeddableStore();
            //DocumentStore = CreateStoreFromConnectionString(DATABASE_NAME);
            DocumentStore.Initialize();
            DocumentStore.DatabaseCommands.GlobalAdmin.EnsureDatabaseExists(DatabaseName);
            return DocumentStore;
        }

        public void Dispose()
        {
            DocumentStore.Dispose();
            DocumentStore = null;
        }

        private static IDocumentStore CreateStoreFromConnectionString(string connectionStringName)
        {
            return new DocumentStore
            {
                ConnectionStringName = connectionStringName,
                Conventions = BuildDocumentConvention(),
            };
        }
        private static IDocumentStore CreateEmbeddableStore()
        {
            Raven.Database.Server.NonAdminHttp.EnsureCanListenToWhenInNonAdminContext(EmbeddableStorePortNumber);
            return new EmbeddableDocumentStore
            {
                DataDirectory = "App_Data/RavenDB",
                DefaultDatabase = DatabaseName,
                UseEmbeddedHttpServer = true,
                Conventions = BuildDocumentConvention(),
                Configuration = {
                    Port = EmbeddableStorePortNumber
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
    }
}