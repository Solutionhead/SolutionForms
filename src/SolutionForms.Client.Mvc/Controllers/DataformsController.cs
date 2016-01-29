using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNet.Mvc;
using SolutionForms.Client.Mvc.Attributes;
using SolutionForms.Core;
using SolutionForms.Service.Providers.Parameters;
using SolutionForms.Service.Providers.Providers;
using SolutionForms.Service.Providers.Returns;

namespace SolutionForms.Client.Mvc.Controllers
{
    [MigrateToOss]
    public class DataFormsController : Controller
    {
        private readonly DataFormsProvider _dataFormsProvider;

        public DataFormsController(DataFormsProvider dataFormsProvider)
        {
            if(dataFormsProvider == null) {  throw new ArgumentNullException(nameof(dataFormsProvider));}
            _dataFormsProvider = dataFormsProvider;
        }

        // GET: api/Dataforms
        [ApiRoute]
        public IEnumerable<DataFormReturn> Get()
        {
            return _dataFormsProvider.GetDataForms();
        }

        // GET: api/Dataforms/5
        [ApiRoute("{id}")]
        //[Route("~/api/dataforms/{id}")]
        public async Task<IActionResult> Get(string id)
        {
            var dataForm = await _dataFormsProvider.GetDataFormAsync(id);
            if (dataForm == null) { return HttpNotFound(); }

            return Json(dataForm);
        }

        // PUT: api/Dataforms/5
        [ApiRoute, HttpPut]
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
        [ApiRoute, HttpPost]
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

            return CreatedAtRoute("default", new { id = entity.Id }, entity);
        }

        // DELETE: api/Dataforms/5
        [ApiRoute, HttpDelete]
        public async void Delete(int id)
        {
            await _dataFormsProvider.DeleteDataFormAsync(id);
        }

        // GET: Dataforms
        [Route("~/forms/New")]
        public ActionResult New()
        {
            return View("Designer");
        }

        [Route("~/forms/{id}/Designer", Name = "DataFormDesigner")]
        public ActionResult Designer(string id)
        {
            return View("Designer");
        }

        [Route("~/forms/{formId}/{recordKey?}", Name = "DataFormLive")]
        public ActionResult Live(string formId, string recordKey)
        {
            return View();
        }
    }
}