using SolutionForms.Core;
using System.ComponentModel.DataAnnotations;

namespace SolutionForms.Data.Models
{
    [MigrateToOss]
    public class DataSource
    {
        public string Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string DocumentName { get; set; }
    }
}