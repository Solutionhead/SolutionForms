using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System.Linq;
using System.Text.RegularExpressions;

namespace SolutionForms.Client.Mvc.Helpers
{
    public class TenantRedirectHelper
    {
        public static IActionResult RedirectToTenantDomain(string tenant, HttpRequest request, IUrlHelper urlHelper)
        {
            return RedirectToTenantDomain(tenant, null, null, null, request, urlHelper);
        }
        public static IActionResult RedirectToTenantDomain(string tenant, object routeValues, HttpRequest request, IUrlHelper urlHelper)
        {
            return RedirectToTenantDomain(tenant, null, null, routeValues, request, urlHelper);
        }
        public static IActionResult RedirectToTenantDomain(string tenant, string actionName, HttpRequest request, IUrlHelper urlHelper)
        {
            return RedirectToTenantDomain(tenant, actionName, null, null, request, urlHelper);
        }
        public static IActionResult RedirectToTenantDomain(string tenant, string actionName, object routeValues, HttpRequest request, IUrlHelper urlHelper)
        {
            return RedirectToTenantDomain(tenant, actionName, null, routeValues, request, urlHelper);
        }
        public static IActionResult RedirectToTenantDomain(string tenant, string actionName, string controllerName, HttpRequest request, IUrlHelper urlHelper)
        {
            return RedirectToTenantDomain(tenant, actionName, controllerName, null, request, urlHelper);
        }
        public static IActionResult RedirectToTenantDomain(string tenant, string actionName, string controllerName, object routeValues, HttpRequest request, IUrlHelper urlHelper)
        {
            var url = urlHelper.Action(actionName, controllerName, routeValues);
            return CreateRedirectToTenantDomainAction(tenant, request, url);
        }

        private static readonly Regex regex = new Regex(@"^([\w-]*\.)?(solutionforms\.((com|local)(:\d*)?)(/.*)?)", RegexOptions.IgnoreCase);
        private static IActionResult CreateRedirectToTenantDomainAction(string tenant, HttpRequest request, string pathAndQuery)
        {
            string formatted = $"{request.Scheme}://{tenant}.$2{pathAndQuery}";
            var url = regex.Replace(request.Host.Value, formatted);
            return new RedirectResult(url);
        }
        

        public static IActionResult RedirectToRootDomain(HttpRequest request)
        {
            return CreateRedirectToRootDomainAction(request, null);
        }
        public static IActionResult RedirectToRootDomain(object routeValues, HttpRequest request, IUrlHelper urlHelper)
        {
            return RedirectToRootDomain(null, routeValues, request, urlHelper);
        }
        public static IActionResult RedirectToRootDomain(RouteData routeValues, HttpRequest request, IUrlHelper urlHelper)
        {
            return RedirectToRootDomain(null, routeValues, request, urlHelper);
        }
        public static IActionResult RedirectToRootDomain(string routeName, object routeValues, HttpRequest request, IUrlHelper urlHelper)
        {
            var url = urlHelper.Link(routeName, routeValues);
            return CreateRedirectToRootDomainAction(request, new Uri(url, UriKind.Absolute).PathAndQuery);
        }

        private static IActionResult CreateRedirectToRootDomainAction(HttpRequest request, string pathAndQuery)
        {
            var hostParts = request.Host.Value.Split('.');
            if (hostParts.Length > 2)
            {
                hostParts = hostParts.Skip(hostParts.Length - 2).ToArray();
            }
            var host = string.Join(".", hostParts);
            var url = $"{request.Scheme}://{host}{pathAndQuery}";
            return new RedirectResult(url);
        }
    }
}