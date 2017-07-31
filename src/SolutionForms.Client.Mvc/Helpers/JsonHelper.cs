using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using ServiceStack;
using System.IO;

namespace SolutionForms.Client.Mvc.Helpers
{
    public static class JsonHelper
    {
        public static string JsonToCSV(string jsonValue, bool limitStringSize = false)
        {
            var jsonData = LoadJTokens(jsonValue);
            var flattenedData = FlattenToObjectDictionary(jsonData);
            return ConvertToCSV(flattenedData, limitStringSize);
        }

        /// <summary>
        /// Loads a json file, converts to CSV, and outputs to the specified special fodler.
        /// </summary>
        /// <returns>The path of the output file created.</returns>
        public static string JsonToCSV(string jsonValue, bool limitStringSize = false, Environment.SpecialFolder destinationFolder = Environment.SpecialFolder.ApplicationData)
        {
            var jsonData = LoadJTokens(jsonValue);
            var flattenedData = FlattenToObjectDictionary(jsonData);
            var destinationPath = Path.GetFullPath(Environment.GetFolderPath(destinationFolder).CombineWith($"{Path.GetRandomFileName()}.csv"));
            using (var writer = new StreamWriter(destinationPath, false))
            {
                writer.Write(ConvertToCSV(flattenedData, limitStringSize));
            }
            return destinationPath;
        }

        /// <summary>
        /// Loads a json file into a list of JContainer objects.
        /// </summary>
        private static List<JContainer> LoadJTokens(string jsonString)
        {
            JContainer container = JsonConvert.DeserializeObject<JContainer>(jsonString);

            if (container.Type == JTokenType.Array)
            {
                return ((JArray)container).OfType<JContainer>().ToList();
            }

            return new List<JContainer> { container };
        }

        /// <summary>
        /// Flattens JContainer object into dictionaries keyed by property paths.
        /// Note that the path itself flattens indexed components into object access-like syntax but with space(s) such that "parent['Some Child']" becomes "parent.Some Child".
        /// </summary>
        private static List<Dictionary<string, object>> FlattenToObjectDictionary(List<JContainer> jContainers)
        {
            return jContainers.Select(t =>
            {
                var properties = GetFlattenedProperties(t).ToList();
                return properties.ToDictionary(p => p.Key, p => p.Value);
            }).ToList();
        }

        /// <summary>
        /// Converts a list of dictionary objects into a CSV file, with null values for columns that don't exist in a particular record.
        /// </summary>
        private static string ConvertToCSV(List<Dictionary<string, object>> data, bool limitStringSize = false)
        {
            var columns = data.SelectMany(r => r.Keys).Distinct().ToList();

            return data.Select(j =>
            {
                return columns.ToDictionary(c => c, c =>
                {
                    if (j.TryGetValue(c, out object value))
                    {
                        if (limitStringSize)
                        {
                            var stringValue = value as string;
                            if (stringValue == null)
                            {
                                if (value is JValue jValue)
                                {
                                    stringValue = jValue.Value as string;
                                }

                            }
                            if (stringValue != null)
                            {
                                return new string(stringValue.Take(short.MaxValue - 9).ToArray());
                            }
                        }

                        return value;
                    }

                    return null;
                });
            }).ToCsv();
        }

        private static IEnumerable<KeyValuePair<string, object>> GetFlattenedProperties(JContainer container, JContainer parent = null)
        {
            parent = parent ?? container;
            foreach (var property in container.Children<JProperty>())
            {
                if (property.Value is JObject jObject)
                {
                    foreach (var childProperty in GetFlattenedProperties(jObject, parent))
                    {
                        yield return childProperty;
                    }
                }
                else
                {
                    yield return new KeyValuePair<string, object>(GetPathToParent(property, parent), property.Value);
                }
            }
        }

        private static string GetPathToParent(JProperty property, JContainer parent)
        {
            return property.Path.Remove(0, parent.Path.Length).Replace($"['{property.Name}']", $".{property.Name}").TrimStart('.');
        }
    }
}
