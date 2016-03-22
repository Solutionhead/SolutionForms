using System.ComponentModel.DataAnnotations;
using SolutionForms.Core;

namespace SolutionForms.Data.Models
{
    [MigrateToOss]
    public class FieldConfiguration
    {
        public string DisplayName { get; set; }

        [Required]
        public string InputType { get; set; }

        [Required]
        public string ExportName { get; set; }

        public string HelpText { get; set; }

        public string Settings { get; set; }
    }
}