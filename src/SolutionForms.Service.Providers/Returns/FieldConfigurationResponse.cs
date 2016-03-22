using System.Collections.Generic;

namespace SolutionForms.Service.Providers.Returns
{
    public class FieldConfigurationResponse
    {
        public string DisplayName { get; set; }

        public string InputType { get; set; }

        public string ExportName { get; set; }

        public string HelpText { get; set; }

        public IDictionary<string, object> Settings { get; set; }
    }
}