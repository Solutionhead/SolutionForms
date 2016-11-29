using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SolutionForms.Service.Providers.Parameters
{
    public class CreateDataformRequest
    {
        [Required]
        public string Title { get; set; }

        public string Description { get; set; }

        public string PlaceholderText { get; set; }

        /// <summary>
        /// Identifies the data source bound to the form. Required unless a new data source is being created, in which case, the 
        /// <see cref="NewDataSourceName"/> NewDataSourceName property is required.
        /// </summary>
        public string DataSourceId { get; set; }

        /// <summary>
        /// If <see cref="DataSourceId"/> DataSourceId is null or empty, a new DataSource will be created with the supplied name.
        /// </summary>
        public string NewDataSourceName { get; set; }

        public bool RestrictDataAccessByOwner { get; set; }

        public ICollection<SetFieldConfigurationRequest> Fields { get; set; }

        public ICollection<string> AuthorizedClaims { get; set; }

        public ICollection<string> Plugins { get; set; }

        public ICollection<string> Components { get; set; }

        public bool LinkOnHomePage { get; set; }

        /// <summary>
        /// The name of the container component used to display the form in live mode.
        /// </summary>
        public string FormType { get; set; }
    }
}