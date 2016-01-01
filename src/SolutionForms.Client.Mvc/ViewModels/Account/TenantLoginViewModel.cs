using System.ComponentModel.DataAnnotations;

namespace SolutionForms.Client.Mvc.ViewModels.Account
{
    public class TenantLoginViewModel
    {
        [Required]
        public string TenantDomain { get; set; }
    }
}