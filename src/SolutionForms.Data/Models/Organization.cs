using System.ComponentModel.DataAnnotations;

namespace SolutionForms.Data.Models
{
    public class Organization
    {
        [Required]
        public string OrganizationName { get; set; }

        public string OrganizationDomain { get; set; }
    }
}