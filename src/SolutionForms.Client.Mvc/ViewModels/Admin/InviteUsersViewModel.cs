using System.ComponentModel.DataAnnotations;

namespace SolutionForms.Client.Mvc.ViewModels.Account
{
    public class InviteUsersViewModel
    {
        [Required]
        [EmailAddress]
        [Display(Name = "Email")]
        public string Email { get; set; }

        [MaxLength(50), Display(Name="First Name")]
        public string FirstName { get; set; }

        [MaxLength(50), Display(Name = "Last Name")]
        public string LastName { get; set; }

        public string Message { get; internal set; }
    }
}