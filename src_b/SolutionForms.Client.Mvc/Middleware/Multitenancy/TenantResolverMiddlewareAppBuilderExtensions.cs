using Microsoft.AspNetCore.Builder;

namespace SolutionForms.Client.Mvc.Middleware.Multitenancy
{
    public static class TenantResolverMiddlewareAppBuilderExtensions
    {
        public static void UseTenantResolver(this IApplicationBuilder builder)
        {
            builder.UseMiddleware<TenantResolverMiddleware>();
        }
    }
}