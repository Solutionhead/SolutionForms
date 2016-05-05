using Microsoft.AspNet.Http;

namespace SolutionForms.Client.Mvc.Helpers
{
    public static class HttpContextExtensions
    {
        public static T GetApplicationService<T>(this HttpContext context)
            where T : class
        {
            return context.ApplicationServices.GetService(typeof(T)) as T;
        }
    }
}