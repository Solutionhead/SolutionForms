using System.Collections.Generic;

namespace SolutionForms.Service.Providers.Returns
{
    public class CreateDataFormResponse
    {
        public string Id { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public string PlaceholderText { get; set; }

        public IEnumerable<string> Plugins { get; set; }

        public IEnumerable<FieldConfigurationResponse> Fields { get; set; }
        
        public string DataSourceId { get; set; }

        public DataSourceResponse DataSource { get; set; }

        public string[] AuthorizedClaims { get; set; }
    }
}