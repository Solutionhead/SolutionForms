using System.ComponentModel.DataAnnotations;

namespace SolutionForms.Data.Models
{
    public class Organization
    {
        [Required]
        public string OrganizationName { get; set; }
        public string OrganizationDomain { get; set; }
        public string CustomerId { get; set; }
        public PaymentStatus PaymentStatus { get; set; }
    }
}