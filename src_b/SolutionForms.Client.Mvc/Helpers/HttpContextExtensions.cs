using Microsoft.AspNetCore.Http;

namespace SolutionForms.Client.Mvc.Helpers
{
    public static class HttpContextExtensions
    {
        public static T GetService<T>(this HttpContext context)
            where T: class
        {
            return context.RequestServices.GetService(typeof(T)) as T;
        }
    }
}