using Microsoft.AspNet.Http;
using Microsoft.AspNet.Mvc;

namespace SolutionForms.Client.Mvc.Helpers
{
    public class TenantRedirectHelper
    {
        public static IActionResult RedirectToTenantDomain(string tenant, HttpRequest request)
        {
            return new RedirectResult($"{tenant}.{request.Host}");
        }
    }
}