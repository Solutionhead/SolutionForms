using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;
using ServiceStack;

namespace DataLoad
{
    public static class LoadCSV
    {
        public static bool FromFile(string filePath, out List<Dictionary<string, string>> csvData)
        {
            csvData = null;
            if(!File.Exists(filePath))
            {
                return false;
            }

            csvData = File.ReadAllText(filePath).FromCsv<List<Dictionary<string, string>>>();
            return true;
        }
    }
}