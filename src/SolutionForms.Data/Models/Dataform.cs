using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using SolutionForms.Core;

namespace SolutionForms.Data.Models
{
    [MigrateToOss]
    public class DataForm
    {
        public string Id { get; set; }

        [StringLength(150)]
        public string Title { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        public string PlaceholderText { get; set; }

        public bool RestrictDataAccessByOwner { get; set; }

        public ICollection<string> Plugins { get; set; }

        public ICollection<string> Components { get; set; }

        public ICollection<FieldConfiguration> Fields { get; set; }

        /// <summary>
        /// Indicates the associated data source from which to retrieve records.
        /// </summary>
        [Required]
        public string DataSourceId { get; set; }

        public string[] AuthorizedClaims { get; set; }

        public string FormType { get; set; }

        public bool LinkOnHomePage { get; set; }
    }
}