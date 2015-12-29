using AspNet.Identity.RavenDB.Entities;

namespace SolutionForms.Client.Mvc.Models
{
    // Add profile data for application users by adding properties to the ApplicationUser class
    public class ApplicationUser : RavenUser
    {
        public ApplicationUser(string userName, string email = null) : base(userName, email) { }
    }
}
