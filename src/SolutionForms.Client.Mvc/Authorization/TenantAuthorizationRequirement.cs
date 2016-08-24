using System.Linq;
using System.Threading.Tasks;
using BrockAllen.MembershipReboot;
using Microsoft.AspNetCore.Authorization;
using SolutionForms.Client.Mvc.Helpers;

namespace SolutionForms.Client.Mvc.Authorization
{
    public class TenantAuthorizationRequirement : AuthorizationHandler<TenantAuthorizationRequirement>, IAuthorizationRequirement
    {
        private readonly string[] _allowedRoles;

        public TenantAuthorizationRequirement(params string[] allowedRoles)
        {
            _allowedRoles = allowedRoles;
        }
        
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, TenantAuthorizationRequirement requirement)
        {
            if (context.User.HasClaim(AuthorizationPolicies.AppOwner) || context.User.IsInRole("admin"))
            {
                context.Succeed(requirement);
            }

            else if (_allowedRoles.Any(context.User.HasClaim))
            {
                context.Succeed(requirement);
            }

            return Task.FromResult(false);
        }
    }
}