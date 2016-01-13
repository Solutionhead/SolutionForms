using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Http;
using Microsoft.AspNet.Http.Features;
using Microsoft.Extensions.Logging;

namespace SolutionForms.Client.Mvc.Middleware.Multitenancy
{
    public class TenantResolverMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger _logger;

        public TenantResolverMiddleware(RequestDelegate next, ILoggerFactory loggerFactory)
        {
            _next = next;
            _logger = loggerFactory.CreateLogger<TenantResolverMiddleware>();
        }

        public async Task Invoke(HttpContext context)
        {
            using (_logger.BeginScopeImpl("TenantResolverMiddleware"))
            {
                var tenant = new Tenant
                {
                    Id = GetTenantIdFromRequest(context)
                };

                _logger.LogInformation($"Resolved tenant. Current tenant: {tenant.Id}");

                var tenantFeature = new TenantFeature(tenant);
                context.Features.Set<ITenantFeature>(tenantFeature);

                await _next(context);
            }
        }

        private static string GetTenantIdFromRequest(HttpContext context)
        {
            var requestHost = context.Request.Host.Value;
            var index = requestHost.IndexOf(".", StringComparison.Ordinal);
            if (index < 0)
            {
                return null;
            }

            var subdomain = requestHost.Substring(0, index);
            string[] blacklist = { "www", "solutionforms" };

            return blacklist.Contains(subdomain) ? null : subdomain;
        }
    }
}