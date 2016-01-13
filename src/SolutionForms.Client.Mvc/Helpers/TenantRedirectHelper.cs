using System;
using Microsoft.AspNet.Http;
using Microsoft.AspNet.Mvc;

namespace SolutionForms.Client.Mvc.Helpers
{
    public class TenantRedirectHelper
    {
        public static IActionResult RedirectToTenantDomain(string tenant, HttpRequest request)
        {
            return CreateRedirectToTenantDomainAction(tenant, request, null);
        }
        public static IActionResult RedirectToTenantDomain(string tenant, string routeName, object routeValues, HttpRequest request, IUrlHelper urlHelper)
        {
            var url = urlHelper.Link(routeName, routeValues);
            var uri = new Uri(url, UriKind.Absolute);
            return CreateRedirectToTenantDomainAction(tenant, request, uri.PathAndQuery);
        }

        private static IActionResult CreateRedirectToTenantDomainAction(string tenant, HttpRequest request, string pathAndQuery)
        {
            var url = $"{request.Scheme}://{tenant}.{request.Host}{pathAndQuery}";
            return new RedirectResult(url);
        }
    }
}