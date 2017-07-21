using Newtonsoft.Json;
using SolutionForms.Service.Providers.Providers;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SolutionForms.ImportCLI
{
    internal class Program
    {
        private static DirectoryInfo _directory;
        private static string _fileNameWithoutExtension;

        private static void Main(string[] args)
        {
            var loop = true;
            while (loop)
            {
                try
                {
                    var data = LoadFile();
                    data = MapProperties(data);
                    //todo: export to data file
                    //InsertJsonData(JsonConvert.SerializeObject(data));
                    WriteJsonToOutputFile(JsonConvert.SerializeObject(data));
                    loop = false;
                    Console.ReadLine();
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.GetInnerMostException().Message);
                }
            }
        }

        private static List<Dictionary<string, string>> LoadFile()
        {
            List<Dictionary<string, string>> data = null;
            var result = false;
            while (!result)
            {
                Console.Write("Enter CSV file path: ");
                var path = Console.ReadLine();
                File.Exists(path);
                var fi = new FileInfo(path);
                _directory = fi.Directory;
                _fileNameWithoutExtension = fi.Name;
                result = LoadCSV.FromFile(fi, out data);
                if (!result)
                {
                    Console.WriteLine("File not found.");
                }
            }

            return data;
        }

        private static List<Dictionary<string, string>> MapProperties(List<Dictionary<string, string>> data)
        {
            Console.Write("Do you wish to manually define property mapping? (y/n)");
            var response = Console.ReadKey();

            bool promptUser = false;
            if(response.Key.ToString().ToLower() == "y")
            {
                promptUser = true;
            }
            Console.WriteLine();

            var map = data.SelectMany(r => r.Keys).Distinct().ToDictionary(r => r, r => "");

            foreach (var property in map.ToList())
            {
                MapProperty(map, property.Key, promptUser);
            }

            bool duplicateFound;
            do
            {
                duplicateFound = false;
                foreach (var duplicates in map.GroupBy(p => p.Value).Where(g => g.Count() > 1).ToList())
                {
                    duplicateFound = true;
                    Console.WriteLine($"\nDuplicate property [{duplicates.Key}]!");
                    foreach (var duplicate in duplicates)
                    {
                        MapProperty(map, duplicate.Key, true);
                    }
                }
            } while (duplicateFound);

            return data.Select(r => r.ToDictionary(p => map[p.Key], p => p.Value)).ToList();
        }

        private static void MapProperty(Dictionary<string, string> map, string key, bool promptForName)
        {
            string destination = null;
            if (promptForName)
            {
                Console.Write($"Enter property name for [{key}] or enter blank to leave as is: ");
                destination = Console.ReadLine().Trim();
            }
            map[key] = string.IsNullOrWhiteSpace(destination) ? key : destination;
        }

        private static void InsertJsonData(string jsonData)
        {
            var loop = true;
            while (loop)
            {
                try
                {
                    //Console.Write("Enter RavenDB Url:");
                    //var url = Console.ReadLine();

                    //Console.Write("Enter RavenDB default database:");
                    //var defaultDatabase = Console.ReadLine();

                    //Console.Write("Enter tenant: ");
                    //var tenant = Console.ReadLine();

                    //Console.Write("Enter entity name: ");
                    //var entityName = Console.ReadLine();

                    //Console.Write("Enter user id: ");
                    //var userId = Console.ReadLine();

                    //var provider = new DataFormsProvider(new DocumentStore
                    //{
                    //    Url = url,
                    //    DefaultDatabase = defaultDatabase
                    //});
                    //var user = new ApplicationUser
                    //{
                    //    Id = userId
                    //};
                    //var results = provider.LoadDataEntriesFromJson(tenant, entityName, jsonData, user);

                    //Console.WriteLine($"Inserted {results.Count()} records.");
                    loop = false;
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.GetInnerMostException().Message);
                }
            }
        }

        private static void WriteJsonToOutputFile(string jsonData)
        {
            string fileName = $"{_fileNameWithoutExtension}.json";
            string filePath = _directory.FullName;
            try
            {
                var ostrm = new FileStream(string.Format("{0}/{1}", filePath, fileName), FileMode.OpenOrCreate, FileAccess.Write);
                var writer = new StreamWriter(ostrm);
                writer.Write(jsonData);
                writer.Close();
                ostrm.Close();
            }
            catch(Exception ex)
            {
                Console.WriteLine("Error encountered while attempting to write to file.");
                Console.WriteLine(ex.GetInnerMostException().Message);
                return;
            }
            
            Console.WriteLine("Finished writing data to output file.");
            Console.WriteLine($"{filePath}/{fileName}");
        }
    }
}
