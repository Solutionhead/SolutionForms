using System.ComponentModel.DataAnnotations;

namespace SolutionForms.Client.Mvc.ViewModels.Account
{
    public class RegisterTenantViewModel
    {
        [Required]
        [EmailAddress]
        [Display(Name = "Email")]
        public string Email { get; set; }

        [Required]
        [Display(Name = "Organization Name")]
        public string OrganizationName { get; set; }

        [Required, RegularExpression("([A-Za-z]|[0-9]|-)+", ErrorMessage = "URLs can only have letters, numbers, and spaces."), UIHint("")]
        [Display(Name = "Your Solution Forms URL")]
        [UIHint("(Letters, numbers, and dashes only)")]
        public string OrganizationDomain { get; set; }

        [Required]
        [Display(Name = "Username")]
        public string UserName { get; set; }
    }
}