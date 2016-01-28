using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNet.Mvc;
using Newtonsoft.Json.Linq;
using Raven.Json.Linq;
using SolutionForms.Client.Mvc.Attributes;
using SolutionForms.Core;
using SolutionForms.Service.Providers.Providers;

namespace SolutionForms.Client.Mvc.Controllers
{
    [ApiRoute("d")]
    [MigrateToOss]
    public class DataEntriesController : Controller
    {
        public const string GetByIdRouteName = "GetDynamicEntityByIdRoute";
        public const string GetQueryRouteName = "GetDynamicEntityQueryRoute";
        public const string PostRouteName = "PostDynamicEntityQueryRoute";
        public const string PutRouteName = "PutDynamicEntityQueryRoute";
        protected const string IdPropertyName = "Id";
        protected const string UserNamePropertyName = "Last-Modified-By";
        private readonly DataFormsProvider _dataFormsProvider;

        public DataEntriesController(DataFormsProvider dataFormsProvider)
        {
            if(dataFormsProvider == null) {  throw new ArgumentNullException(nameof(dataFormsProvider)); }
            _dataFormsProvider = dataFormsProvider;
        }

        [Route("{entityName}")]
        public async Task<ActionResult> GetDataEntries(string entityName)
        {
            var queryParams = HttpContext.Request.Query.Select(q => new KeyValuePair<string, string>(q.Key, q.Value));
            return Json(await _dataFormsProvider.GetDataEntriesByEntityName(entityName, queryParams));
        }
        
        ///// <summary>
        ///// Retrieves data entry by id.
        ///// </summary>
        ///// <param name="entityName">Not currently used but kept in for consistency with REST-style API calls.</param>
        ///// <returns></returns>
        //public IHttpActionResult GetDataEntry(string entityName, string id)
        //{
        //    var result = DataformsRavenContext.DocumentStore.DatabaseCommands.Get(id);
        //    if (result == null) return NotFound();
        //    return Ok(JObject.Parse(result.DataAsJson.ToString()));
        //}
        
        //public IHttpActionResult Post(string entityName, object values)
        //{
        //    //todo: ensure that the current user is authorized to creation of the current entity type

        //    var id = string.Format("{0}{1}{2}",
        //        entityName,
        //        DataformsRavenContext.DocumentStore.Conventions.IdentityPartsSeparator,
        //        DataformsRavenContext.DocumentStore.DatabaseCommands.NextIdentityFor(entityName));

        //    var jobject = JObject.FromObject(values);
        //    jobject.Add(IdPropertyName, id);
        //    UserIdentityProvider.SetUserIdentity(jobject, UserNamePropertyName, User);
        //    var dataEntry = JsonConvert.SerializeObject(jobject);

        //    DataformsRavenContext.DocumentStore.DatabaseCommands.Put(
        //        id,
        //        null,
        //        RavenJObject.Parse(dataEntry),
        //        new RavenJObject
        //        {
        //            {"Raven-Entity-Name", entityName},
        //        });

        //    return Created(Url.Route("", new { id }), dataEntry);
        //}

        //public IHttpActionResult PutDataEntry(string entityName, string id, object values)
        //{
        //    //todo: ensure that the current user is authorized to modify the current entity type

        //    var jobject = JObject.FromObject(values);
        //    jobject.Add(IdPropertyName, id);
        //    UserIdentityProvider.SetUserIdentity(jobject, UserNamePropertyName, User);

        //    var dataEntry = JsonConvert.SerializeObject(jobject);

        //    using (var session = DataformsRavenContext.DocumentStore.OpenSession())
        //    {

        //        DataformsRavenContext.DocumentStore.DatabaseCommands.Put(
        //            id,
        //            null,
        //            RavenJObject.Parse(dataEntry),
        //            new RavenJObject
        //            {
        //                {"Raven-Entity-Name", entityName}
        //            });
        //        session.SaveChanges();
        //    }

        //    return StatusCode(HttpStatusCode.NoContent);
        //}
    }
}