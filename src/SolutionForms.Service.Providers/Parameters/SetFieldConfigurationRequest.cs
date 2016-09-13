using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SolutionForms.Service.Providers.Parameters
{
    public class SetFieldConfigurationRequest
    {
        public string DisplayName { get; set; }

        [Required]
        public string InputType { get; set; }

        [Required]
        public string ExportName { get; set; }

        public string HelpText { get; set; }
        
        public IDictionary<string, object> Settings { get; set; }

        public string FieldType { get; set; }

        public string FieldContainerType { get; set; }
    }
}