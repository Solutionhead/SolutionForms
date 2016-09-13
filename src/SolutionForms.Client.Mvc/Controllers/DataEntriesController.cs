using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BrockAllen.MembershipReboot;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using SolutionForms.Client.Mvc.Attributes;
using SolutionForms.Client.Mvc.Helpers;
using SolutionForms.Client.Mvc.Middleware.Multitenancy;
using SolutionForms.Core;
using SolutionForms.Service.Providers.Models;
using SolutionForms.Service.Providers.Parameters;
using SolutionForms.Service.Providers.Providers;

namespace SolutionForms.Client.Mvc.Controllers
{
    [ApiRoute(controllerNameOverride: "d")]
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
        
        [HttpGet("index/{indexName?}", Order = 0)]
        public async Task<ActionResult> GetByIndex(string id = null)
        {
            var queryParams = HttpContext.Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString());
            return Json(await _dataFormsProvider.GetDataEntriesByIndexName(Tenant, id, queryParams));
        }

        [HttpGet("{entityName}", Order = 1)]
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
        [HttpGet("{entityName}/{id}")]
        public async Task<IActionResult> Get(string entityName, string id)
        {
            var result = await _dataFormsProvider.GetDataEntryByKeyAsync(Tenant, id);
            return result == null 
                ? NotFound() as IActionResult 
                : Ok(result);
        }

        [HttpPost("{entityName}")]
        public async Task<IActionResult> Post(string entityName, [FromBody]object values, bool? awaitIndexing = false)
        {
            var userAccount = _userAccountService.GetByUsername(Tenant, User.Identity.Name);
            //todo: ensure that the current user is authorized to creation of the current entity type -- note: it's possible that the call is creating a record for a new entity type for which there is no pre-existing document collection or authorization rule.
            var response = await _dataFormsProvider.CreateDataEntryAsync(Tenant, entityName, values, userAccount, awaitIndexing ?? false);
            return CreatedAtRoute(new { controller=  "DataForms", action = "Live", formId = entityName, recordKey = response.Key }, response.Entity);
        }

        [HttpPut("{entityName}/{id}")]
        public async Task<IActionResult> Put(string entityName, string id, [FromBody]object values, bool? awaitIndexing = false)
        {
            var userAccount = _userAccountService.GetByUsername(Tenant, User.Identity.Name);
            //todo: ensure that the current user is authorized to creation of the current entity type
            var response = await _dataFormsProvider.UpdateDataEntryAsync(Tenant, entityName, id, values, userAccount, awaitIndexing ?? false);
            if (response == null)
            {
                return NotFound();
            }
            return Ok(new {});
        }

        [HttpPatch("{entityName}/{id}")]
        public async Task<IActionResult> Patch(string entityName, string id, [FromBody]ScriptedPatchRequestParameters values)
        {
            var userAccount = _userAccountService.GetByUsername(Tenant, User.Identity.Name);
            await _dataFormsProvider.PatchDataEntryAsync(Tenant, id, values, userAccount);
            return Ok(new {});
        }

        [HttpDelete("{entityName}/{id}")]
        public async Task<IActionResult> Delete(string entityName, string id, bool? awaitIndexing = false)
        {
            await _dataFormsProvider.DeleteDataEntryAsync(Tenant, id, awaitIndexing ?? false);
            return new NoContentResult();
        }

        [HttpPost("{entityName}/seed-identity/{nextId}"), Authorize(Policy = AuthorizationPolicies.AppAdmin)]
        public async Task<IActionResult> SeedIdentity(string entityName, long nextId)
        {
            await _dataFormsProvider.SeedIdentityForTable(entityName, nextId);
            return Ok(new
            {
                CollectionName = entityName,
                NextId = nextId
            });
        }
    }
}