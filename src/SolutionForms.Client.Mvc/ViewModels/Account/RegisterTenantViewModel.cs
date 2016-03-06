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
        [Display(Name = "Display Name")]
        public string UserName { get; set; }

        [Required]
        [StringLength(100, ErrorMessage = "The {0} must be at least {2} characters long.", MinimumLength = 6)]
        [DataType(DataType.Password)]
        [Display(Name = "Password")]
        public string Password { get; set; }

        [DataType(DataType.Password)]
        [Display(Name = "Confirm password")]
        [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
        public string ConfirmPassword { get; set; }
    }
}