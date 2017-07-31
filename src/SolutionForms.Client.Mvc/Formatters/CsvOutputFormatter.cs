using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SolutionForms.Client.Mvc.Helpers;
using Microsoft.AspNetCore.Mvc.Formatters;
using System.Text;
using Microsoft.Net.Http.Headers;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json.Linq;
using System.Collections;
using System;

namespace SolutionForms.Client.Mvc.Formatters
{
    public class CsvOutputFormatter : TextOutputFormatter
    {
        public CsvOutputFormatter()
        {
            SupportedMediaTypes.Add(MediaTypeHeaderValue.Parse("application/csv"));
            SupportedMediaTypes.Add(MediaTypeHeaderValue.Parse("text/csv"));
            SupportedEncodings.Add(Encoding.UTF8);
            SupportedEncodings.Add(Encoding.Unicode);
        }

        public override async Task WriteResponseBodyAsync(OutputFormatterWriteContext context, Encoding selectedEncoding)
        {
            var response = context.HttpContext.Response;
            string jsonString;

            try
            {
                if (context.Object is JsonResult)
                {
                    jsonString = (context.Object as JsonResult).ToString();
                }
                else if (context.Object as IEnumerable != null)
                {
                    jsonString = JArray.FromObject(context.Object).ToString();
                }
                else
                {
                    jsonString = JObject.FromObject(context.Object).ToString();
                }
                await response.WriteAsync(JsonHelper.JsonToCSV(jsonString, true));
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public override bool CanWriteResult(OutputFormatterCanWriteContext context)
        {
            return base.CanWriteResult(context);
        }
    }
}