using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace SolutionForms.Client.Mvc.Helpers
{
    public class TenantRedirectHelper
    {
        private readonly ILogger _logger;

        private TenantRedirectHelper(ILogger logger) { _logger = logger; }
        private static readonly Regex regex = new Regex(@"^(solutionforms\.(com|local:\d+))", RegexOptions.IgnoreCase);

        public static TenantRedirectHelper WithLogging(ILogger logger)
        {
            return new TenantRedirectHelper(logger);
        }

        public IActionResult RedirectToTenantDomain(string tenant, HttpRequest request, IUrlHelper urlHelper)
        {
            return RedirectToTenantDomain(tenant, null, null, null, request, urlHelper);
        }
        public IActionResult RedirectToTenantDomain(string tenant, object routeValues, HttpRequest request, IUrlHelper urlHelper)
        {
            return RedirectToTenantDomain(tenant, null, null, routeValues, request, urlHelper);
        }
        public IActionResult RedirectToTenantDomain(string tenant, string actionName, HttpRequest request, IUrlHelper urlHelper)
        {
            return RedirectToTenantDomain(tenant, actionName, null, null, request, urlHelper);
        }
        public IActionResult RedirectToTenantDomain(string tenant, string actionName, object routeValues, HttpRequest request, IUrlHelper urlHelper)
        {
            return RedirectToTenantDomain(tenant, actionName, null, routeValues, request, urlHelper);
        }
        public IActionResult RedirectToTenantDomain(string tenant, string actionName, string controllerName, HttpRequest request, IUrlHelper urlHelper)
        {
            return RedirectToTenantDomain(tenant, actionName, controllerName, null, request, urlHelper);
        }
        public IActionResult RedirectToTenantDomain(string tenant, string actionName, string controllerName, object routeValues, HttpRequest request, IUrlHelper urlHelper)
        {
            var url = urlHelper.Action(actionName, controllerName, routeValues);
            _logger.LogInformation("RedirectToTenantDomain URL: {url}", url);
            return CreateRedirectToTenantDomainAction(tenant, request, url);
        }

        private IActionResult CreateRedirectToTenantDomainAction(string tenant, HttpRequest request, string pathAndQuery)
        {

            string formatted = $"{request.Scheme}://{tenant}.$0{pathAndQuery}";
            var url = regex.Replace(request.Host.Value, formatted);
            _logger.LogInformation("Redirect to Tenant Domain: {host}, {pathAndQuery}", request.Host.Value, pathAndQuery);
            return new RedirectResult(url);
        }
        

        public IActionResult RedirectToRootDomain(HttpRequest request)
        {
            return CreateRedirectToRootDomainAction(request, null);
        }
        public IActionResult RedirectToRootDomain(object routeValues, HttpRequest request, IUrlHelper urlHelper)
        {
            return RedirectToRootDomain(null, routeValues, request, urlHelper);
        }
        public IActionResult RedirectToRootDomain(RouteData routeValues, HttpRequest request, IUrlHelper urlHelper)
        {
            return RedirectToRootDomain(null, routeValues, request, urlHelper);
        }
        public IActionResult RedirectToRootDomain(string routeName, object routeValues, HttpRequest request, IUrlHelper urlHelper)
        {
            var url = urlHelper.Link(routeName, routeValues);
            return CreateRedirectToRootDomainAction(request, new Uri(url, UriKind.Absolute).PathAndQuery);
        }

        private IActionResult CreateRedirectToRootDomainAction(HttpRequest request, string pathAndQuery)
        {
            _logger.LogInformation("Redirect to root domain: {host}, {pathAndQuery}", request.Host.Value, pathAndQuery);
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