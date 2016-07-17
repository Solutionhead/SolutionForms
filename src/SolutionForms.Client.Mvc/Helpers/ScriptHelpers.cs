using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SolutionForms.Client.Mvc.Helpers
{
    public static class ScriptHelpers
    {
        public static string VersionQueryStringParam => $"v={Microsoft.Extensions.PlatformAbstractions.PlatformServices.Default.Application.ApplicationVersion}";
    }
}
