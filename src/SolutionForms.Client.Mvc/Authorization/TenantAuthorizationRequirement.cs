using System.Linq;
using BrockAllen.MembershipReboot;
using Microsoft.AspNet.Authorization;

namespace SolutionForms.Client.Mvc.Authorization
{
    public class TenantAuthorizationRequirement : AuthorizationHandler<TenantAuthorizationRequirement>, IAuthorizationRequirement
    {
        private readonly string[] _allowedRoles;

        public TenantAuthorizationRequirement(params string[] allowedRoles)
        {
            _allowedRoles = allowedRoles;
        }

        protected override void Handle(AuthorizationContext context, TenantAuthorizationRequirement requirement)
        {
            if (context.User.HasClaim("AppOwner") || context.User.IsInRole("admin"))
            {
                context.Succeed(requirement);
                return;
            }

            if (_allowedRoles.Any(context.User.HasClaim))
            {
                context.Succeed(requirement);
            }
        }
    }
}