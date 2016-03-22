using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using BrockAllen.MembershipReboot;
using Microsoft.AspNet.Http.Features;
using Microsoft.AspNet.Mvc;
using Newtonsoft.Json.Linq;
using Raven.Json.Linq;
using SolutionForms.Client.Mvc.Attributes;
using SolutionForms.Client.Mvc.Middleware.Multitenancy;
using SolutionForms.Core;
using SolutionForms.Service.Providers.Models;
using SolutionForms.Service.Providers.Providers;

namespace SolutionForms.Client.Mvc.Controllers
{
    [ApiRoute(controllerNameOverride: "d", route: "{entityName}")]
    [MigrateToOss]
    public class DataEntriesController : Controller
    {
        protected const string UserNamePropertyName = "Last-Modified-By";
        private readonly DataFormsProvider _dataFormsProvider;
        public string Tenant => HttpContext.Features.Get<ITenantFeature>().Tenant.Id;
        private readonly UserAccountService<ApplicationUser> _userAccountService;

        public DataEntriesController(DataFormsProvider dataFormsProvider, UserAccountService<ApplicationUser> userAccountService)
        {
            if(dataFormsProvider == null) {  throw new ArgumentNullException(nameof(dataFormsProvider)); }
            _dataFormsProvider = dataFormsProvider;

            if(userAccountService == null) { throw new ArgumentNullException(nameof(userAccountService)); }
            _userAccountService = userAccountService;
        }

        public async Task<ActionResult> Get(string entityName)
        {
            var queryParams = HttpContext.Request.Query.Select(q => new KeyValuePair<string, string>(q.Key, q.Value));
            return Json(await _dataFormsProvider.GetDataEntriesByEntityName(Tenant, entityName, queryParams));
        }

        /// <summary>
        /// Retrieves data entry by id.
        /// </summary>
        /// <param name="entityName">Not currently used but kept in for consistency with REST-style API calls.</param>
        /// <param name="id">The id of the entity to be retrieved</param>
        /// <returns></returns>
        [Route("{id}")]
        public async Task<IActionResult> Get(string entityName, string id)
        {
            var result = await _dataFormsProvider.GetDataEntryByKeyAsync(Tenant, id);
            //var result = DataformsRavenContext.DocumentStore.DatabaseCommands.Get(id);
            //if (result == null) return NotFound();
            return result == null 
                ? HttpNotFound() as IActionResult 
                : Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Post(string entityName, [FromBody]object values)
        {
            var userAccount = _userAccountService.GetByUsername(Tenant, User.Identity.Name);
            //todo: ensure that the current user is authorized to creation of the current entity type
            var response = await _dataFormsProvider.CreateDataEntryAsync(Tenant, entityName, values, userAccount);
            return CreatedAtRoute(new { controller=  "DataForms", action = "Live", formId = entityName, recordKey = response.Key }, response.Entity);
        }

        [HttpPut, Route("{id}")]
        public async Task<IActionResult> Put(string entityName, string id, [FromBody]object values)
        {
            var userAccount = _userAccountService.GetByUsername(Tenant, User.Identity.Name);
            //todo: ensure that the current user is authorized to creation of the current entity type
            var response = await _dataFormsProvider.UpdateDataEntryAsync(Tenant, entityName, id, values, userAccount);
            if (response == null)
            {
                return HttpNotFound();
            }
            return Ok(new {});
        }
    }
}