using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SolutionForms.Service.Providers.Returns
{
    public class DataFormReturn
    {
        public string Id { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public string PlaceholderText { get; set; }

        public IEnumerable<string> Plugins { get; set; }

        public IEnumerable<string> Components { get; set; }

        public IEnumerable<FieldConfigurationResponse> Fields { get; set; }

        /// <summary>
        /// Indicates the associated data source from which to retrieve records.
        /// </summary>
        [Required]
        public string DataSourceId { get; set; }

        public DataSourceReturn DataSource { get; set; }

        public string[] AuthorizedClaims { get; set; }

        public string FormType { get; set; }

        public bool LinkOnHomePage { get; set; }
    }
}