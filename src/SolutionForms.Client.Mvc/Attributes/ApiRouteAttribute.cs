using Microsoft.AspNet.Mvc;

namespace SolutionForms.Client.Mvc.Attributes
{
    public class ApiRouteAttribute : RouteAttribute
    {
        public ApiRouteAttribute()
            : base("~/api/[controller]")
        { }

        public ApiRouteAttribute(string controllerNameOverride) : base($"~/api/{controllerNameOverride}")
        {
        }
    }
}