using System.Collections.Generic;
namespace SolutionForms.Client.Mvc.ViewModels.DataForms
{
    public class DataFormsIndexViewModel
    {
        public IEnumerable<DataFormSummaryViewModel> Forms { get; set; }
        public string OrganizationName { get; set; }
    }
}