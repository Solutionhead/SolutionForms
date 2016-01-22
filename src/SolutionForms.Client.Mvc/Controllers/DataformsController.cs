using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BrockAllen.MembershipReboot;
using BrockAllen.MembershipReboot.Hierarchical;
using Microsoft.AspNet.Mvc;
using SolutionForms.Client.Mvc.Helpers;
using SolutionForms.Core;
using SolutionForms.Service.Providers.Parameters;
using SolutionForms.Service.Providers.Providers;
using SolutionForms.Service.Providers.Returns;

namespace SolutionForms.Client.Mvc.Controllers
{
    [MigrateToOss]
    public class DataFormsController : Controller
    {
        private readonly UserAccountService<HierarchicalUserAccount> _userAccountService;
        private readonly DataFormsProvider _dataFormsProvider;

        public DataFormsController(AuthenticationService<HierarchicalUserAccount> authService, DataFormsProvider dataFormsProvider)
        {
            if (authService == null) { throw new ArgumentNullException(nameof(authService)); }
            _userAccountService = authService.UserAccountService;

            if(dataFormsProvider == null) {  throw new ArgumentNullException(nameof(dataFormsProvider));}
            _dataFormsProvider = dataFormsProvider;
        }

        // GET: api/Dataforms
        public IEnumerable<DataFormResponse> Get()
        {
            return _dataFormsProvider.GetDataForms();
        }

        // GET: api/Dataforms/5
        public async Task<IActionResult> Get(string id)
        {
            var dataForm = await _dataFormsProvider.GetDataFormAsync(id);
            if (dataForm == null) { return HttpNotFound(); }

            return Ok(dataForm);
        }

        // PUT: api/Dataforms/5
        public async Task<IActionResult> Put(string id, UpdateDataformRequest dataform)
        {
            if (!ModelState.IsValid)
            {
                return HttpBadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(dataform.DataSourceId) && string.IsNullOrWhiteSpace(dataform.NewDataSourceName))
            {
                return HttpBadRequest("Expected dataSourceId value or newDataSourceName.");
            }

            await _dataFormsProvider.UpdateDataFormAsync(id, dataform);
            
            return new NoContentResult();
        }

        // POST: api/Dataforms
        public async Task<IActionResult> PostDataform([FromBody]CreateDataformRequest dataform)
        {
            if (!ModelState.IsValid)
            {
                return HttpBadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(dataform.DataSourceId) && string.IsNullOrWhiteSpace(dataform.NewDataSourceName))
            {
                return HttpBadRequest("Expected entityName value or newDataSourceName.");
            }

            var entity = await _dataFormsProvider.CreateDataFormAsync(dataform);

            return CreatedAtRoute("DefaultApi", new { id = entity.Id }, entity);
        }

        // DELETE: api/Dataforms/5
        public async void Delete(int id)
        {
            await _dataFormsProvider.DeleteDataFormAsync(id);
        }
    }
}