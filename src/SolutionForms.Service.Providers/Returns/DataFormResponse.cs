using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SolutionForms.Service.Providers.Returns
{
    public class DataFormResponse
    {
        public string Id { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public string PlaceholderText { get; set; }

        public IEnumerable<string> Plugins { get; set; }

        public IEnumerable<FieldConfigurationResponse> Fields { get; set; }

        /// <summary>
        /// Indicates the associated data source from which to retrieve records.
        /// </summary>
        [Required]
        public string DataSourceId { get; set; }

        public DataSourceResponse DataSource { get; set; }

        public string[] AuthorizedClaims { get; set; }
    }
}