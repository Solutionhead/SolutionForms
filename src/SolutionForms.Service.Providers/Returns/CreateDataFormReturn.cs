using System.Collections.Generic;
using SolutionForms.Core;

namespace SolutionForms.Service.Providers.Returns
{
    [MigrateToOss]
    public class CreateDataFormReturn
    {
        public string Id { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public string PlaceholderText { get; set; }

        public IEnumerable<string> Plugins { get; set; }

        public IEnumerable<FieldConfigurationResponse> Fields { get; set; }
        
        public string DataSourceId { get; set; }

        public DataSourceReturn DataSource { get; set; }

        public string[] AuthorizedClaims { get; set; }

        public string FormType { get; set; }
    }
}