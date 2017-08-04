using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SolutionForms.Client.Mvc.Helpers;
using Microsoft.AspNetCore.Mvc.Formatters;
using System.Text;
using System.IO;
using Microsoft.Net.Http.Headers;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json.Linq;
using System.Collections;
using System;
using ServiceStack;

namespace SolutionForms.Client.Mvc.Formatters
{
    public class CsvFileStreamOutputFormatter : IOutputFormatter
    {
        const string MEDIA_TYPE = "application/csv";

        public bool CanWriteResult(OutputFormatterCanWriteContext context)
        {
            return context?.ContentType.ToString().Equals(MEDIA_TYPE) ?? false;
        }

        public async Task WriteAsync(OutputFormatterWriteContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException(nameof(context));
            }

            var response = context.HttpContext.Response;
            response.ContentType = MEDIA_TYPE;

            using (var writer = context.WriterFactory(response.Body, Encoding.UTF8))
            {
                await writer.WriteAsync(CsvOutputFormatterHelper.ConvertContentToCsv(context));
            }
        }
    }

    public class CsvTextOutputFormatter : TextOutputFormatter
    {
        const string MEDIA_TYPE = "text/csv";

        public CsvTextOutputFormatter()
        {
            SupportedMediaTypes.Add(MediaTypeHeaderValue.Parse(MEDIA_TYPE));
            SupportedEncodings.Add(Encoding.UTF8);
            SupportedEncodings.Add(Encoding.Unicode);
        }

        public override async Task WriteResponseBodyAsync(OutputFormatterWriteContext context, Encoding selectedEncoding)
        {
            try
            {
                context.HttpContext.Response.ContentType = MEDIA_TYPE;
                await context.HttpContext.Response.WriteAsync(CsvOutputFormatterHelper.ConvertContentToCsv(context));
            }
            catch (Exception ex)
            {
                throw;
            }
        }
    }

    public static class CsvOutputFormatterHelper
    {
        public static string ConvertContentToCsv(OutputFormatterWriteContext context, bool limitStringSize = true)
        {
            string jsonString;

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
            return JsonHelper.JsonToCSV(jsonString, limitStringSize);
        }
    }
}