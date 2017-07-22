using System.Collections.Generic;
using SolutionForms.Service.Providers.Providers;

namespace SolutionForms.Client.Mvc.ViewModels.DataForms
{
    public class DataFormsIndexViewModel
    {
        public IEnumerable<DataFormSummaryViewModel> Forms { get; set; }
        public string OrganizationName { get; internal set; }
    }
}