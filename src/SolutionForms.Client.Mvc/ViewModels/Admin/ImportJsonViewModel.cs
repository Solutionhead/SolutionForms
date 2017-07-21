using System.ComponentModel.DataAnnotations;

namespace SolutionForms.Client.Mvc.ViewModels.Account
{
    public class ImportJsonViewModel
    {
        [Required, Display(Name = "Json Data")]
        public string JsonData { get; set; }

        [Required, Display(Name = "Collection Name")]
        public string EntityName { get; set; }
    }
}