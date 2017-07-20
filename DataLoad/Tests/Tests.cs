using System;
using System.Collections.Generic;
using DataLoad;
using Newtonsoft.Json;
using NUnit.Framework;

namespace Tests
{
    [TestFixture]
    public class Tests
    {
        [Test]
        public void Test()
        {
            List<Dictionary<string, string>> data = null;
            LoadCSV.FromFile(@"E:\Repos\SolutionForms\DataLoad\Tests\testdata.csv", out data);
            var d = JsonConvert.SerializeObject(data, Formatting.None);

            Console.WriteLine(d);
        }
    }
}
