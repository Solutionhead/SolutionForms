using System.ComponentModel.DataAnnotations;

namespace SolutionForms.Client.Mvc.ViewModels.Account
{
    public class ActivateAccountViewModel
    {
        private string _password;
        
        [Required]
        public string VerificationCode { get; set; }

        [Required]
        [DataType(DataType.Password)]
        [Display(Name = "Password")]
        public string Password
        {
            get { return _password; }
            set
            {
                _password = value;
                if (DisplayPasswordConfirmation)
                {
                    ConfirmPassword = value;
                }
            }
        }

        [Required]
        [DataType(DataType.Password)]
        [Display(Name = "Confirm Password")]
        public string ConfirmPassword { get; set; }

        public bool DisplayPasswordConfirmation { get; set; }
    }
}