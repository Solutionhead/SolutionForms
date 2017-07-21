using System;

namespace SolutionForms.ImportCLI
{
    internal static class ExceptionHelper
    {
        internal static Exception GetInnerMostException(this Exception ex)
        {
            Exception innerMost = ex;
            while(ex.InnerException != null)
            {
                innerMost = ex.InnerException;
            }

            return innerMost;
        }
    }
}
