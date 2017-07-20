﻿using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Raven.Client.Document;
using ServiceStack;
using SolutionForms.Service.Providers.Models;
using SolutionForms.Service.Providers.Providers;

namespace DataLoad
{
    internal class Program
    {
        private static void Main(string[] args)
        {
            var loop = true;
            while(loop)
            {
                try
                {
                    var data = LoadFile();
                    data = MapProperties(data);
                    InsertJsonData(JsonConvert.SerializeObject(data));
                    loop = false;
                }
                catch(Exception ex)
                {
                    Console.WriteLine(ex.GetInnerMostException().Message);
                }
            }
        }

        private static List<Dictionary<string, string>> LoadFile()
        {
            List<Dictionary<string, string>> data = null;
            var result = false;
            while(!result)
            {
                Console.Write("Enter CSV file path: ");
                var path = Console.ReadLine();
                result = LoadCSV.FromFile(path, out data);
                if(!result)
                {
                    Console.WriteLine("File not found.");
                }
            }

            return data;
        }

        private static List<Dictionary<string, string>> MapProperties(List<Dictionary<string, string>> data)
        {
            var map = data.SelectMany(r => r.Keys).Distinct().ToDictionary(r => r, r => "");

            foreach(var property in map.ToList())
            {
                MapProperty(map, property.Key);
            }

            bool duplicateFound;
            do
            {
                duplicateFound = false;
                foreach(var duplicates in map.GroupBy(p => p.Value).Where(g => g.Count() > 1).ToList())
                {
                    duplicateFound = true;
                    Console.WriteLine($"\nDuplicate property [{duplicates.Key}]!");
                    foreach(var duplicate in duplicates)
                    {
                        MapProperty(map, duplicate.Key);
                    }
                }
            } while(duplicateFound);

            return data.Select(r => r.ToDictionary(p => map[p.Key], p => p.Value)).ToList();
        }

        private static void MapProperty(Dictionary<string, string> map, string key)
        {
            Console.Write($"Enter property name for [{key}] or enter blank to leave as is: ");
            var destination = Console.ReadLine().Trim();
            map[key] = string.IsNullOrWhiteSpace(destination) ? key : destination;
        }

        private static void InsertJsonData(string jsonData)
        {
            var loop = true;
            while(loop)
            {
                try
                {
                    Console.Write("Enter RavenDB Url:");
                    var url = Console.ReadLine();

                    Console.Write("Enter RavenDB default database:");
                    var defaultDatabase = Console.ReadLine();

                    Console.Write("Enter tenant: ");
                    var tenant = Console.ReadLine();

                    Console.Write("Enter entity name: ");
                    var entityName = Console.ReadLine();

                    Console.Write("Enter user id: ");
                    var userId = Console.ReadLine();

                    var provider = new DataFormsProvider(new DocumentStore
                    {
                        Url = url,
                        DefaultDatabase = defaultDatabase
                    });
                    var user = new ApplicationUser
                    {
                        Id = userId
                    };
                    var results = provider.LoadDataEntriesFromJson(tenant, entityName, jsonData, user);

                    Console.WriteLine($"Inserted {results.Count()} records.");
                    loop = false;
                }
                catch(Exception ex)
                {
                    Console.WriteLine(ex.GetInnerMostException().Message);
                }
            }
        }
    }
}
