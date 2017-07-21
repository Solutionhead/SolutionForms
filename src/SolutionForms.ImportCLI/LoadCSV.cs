using System.Collections.Generic;
using System.IO;
using ServiceStack;

namespace SolutionForms.ImportCLI
{
    public static class LoadCSV
    {
        public static bool FromFile(FileInfo file, out List<Dictionary<string, string>> csvData)
        {
            csvData = null;
            if (!file.Exists)
            {
                return false;
            }

            csvData = file.ReadAllText().FromCsv<List<Dictionary<string, string>>>();
            return true;
        }
    }
}
