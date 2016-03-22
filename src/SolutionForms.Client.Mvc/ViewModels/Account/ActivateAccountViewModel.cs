using System.ComponentModel.DataAnnotations;

namespace SolutionForms.Client.Mvc.ViewModels.Account
{
    public class ActivateAccountViewModel
    {
        [Required]
        public string VerificationCode { get; set; }

        [Required]
        [DataType(DataType.Password)]
        [Display(Name = "Password")]
        public string Password { get; set; }
    }
}