using System;
using BrockAllen.MembershipReboot.Hierarchical;

namespace SolutionForms.Service.Providers.Models
{
    public sealed class ApplicationUser : HierarchicalUserAccount
    {
        /// <summary>
        /// RavenDb generated identity value.
        /// </summary>
        public string Id { get; set; }
    }
}