using Microsoft.AspNet.Mvc;

namespace SolutionForms.Client.Mvc.Attributes
{
    public class ApiRouteAttribute : RouteAttribute
    {
        public ApiRouteAttribute()
            : base("~/api/[controller]")
        { }

        public ApiRouteAttribute(string route) : base($"~/api/[controller]/{route}")
        {
        }

        public ApiRouteAttribute(string controllerNameOverride = null, string route = null) 
            : base($"~/api/{controllerNameOverride ?? "[controller]"}/{route}")
        {
        }
    }
}