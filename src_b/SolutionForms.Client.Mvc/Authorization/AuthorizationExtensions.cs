using Microsoft.AspNetCore.Authorization;

namespace SolutionForms.Client.Mvc.Authorization
{
    public static class AuthorizationExtensions
    {
        public static AuthorizationOptions AddTenantPolicy(this AuthorizationOptions options, string policyName, params string[] requiredClaims)
        {
            options.AddPolicy(policyName, policy =>
            {
                policy.AddRequirements(new TenantAuthorizationRequirement(requiredClaims));
            });
            return options;
        }
    }
}