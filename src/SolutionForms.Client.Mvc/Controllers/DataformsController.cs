using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNet.Http.Features;
using Microsoft.AspNet.Mvc;
using Raven.Database.Linq.PrivateExtensions;
using SolutionForms.Client.Mvc.Attributes;
using SolutionForms.Client.Mvc.Middleware.Multitenancy;
using SolutionForms.Client.Mvc.ViewModels.DataForms;
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
        public string Tenant => HttpContext.Features.Get<ITenantFeature>().Tenant.Id;

        public DataFormsController(DataFormsProvider dataFormsProvider)
        {
            if(dataFormsProvider == null) {  throw new ArgumentNullException(nameof(dataFormsProvider));}
            _dataFormsProvider = dataFormsProvider;
        }

        #region API actions

        [ApiRoute]
        public async Task<IEnumerable<DataFormReturn>> Get()
        {
            return await _dataFormsProvider.GetDataForms(Tenant);
        }

        [ApiRoute("{id}")]
        public async Task<IActionResult> Get(string id)
        {
            var dataForm = await _dataFormsProvider.GetDataFormAsync(Tenant, id);
            if (dataForm == null)
            {
                return HttpNotFound();
            }

            return Json(dataForm);
        }

        [ApiRoute("{id}"), HttpPut]
        public async Task<IActionResult> Put(string id, [FromBody] UpdateDataformRequest dataform)
        {
            if (!ModelState.IsValid)
            {
                return HttpBadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(dataform.DataSourceId) &&
                string.IsNullOrWhiteSpace(dataform.NewDataSourceName))
            {
                return HttpBadRequest("Expected dataSourceId value or newDataSourceName.");
            }

            await _dataFormsProvider.UpdateDataFormAsync(Tenant, id, dataform);

            return new NoContentResult();
        }

        [ApiRoute, HttpPost]
        public async Task<IActionResult> Post([FromBody] CreateDataformRequest dataform)
        {
            if (!ModelState.IsValid)
            {
                return HttpBadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(dataform.DataSourceId) &&
                string.IsNullOrWhiteSpace(dataform.NewDataSourceName))
            {
                return HttpBadRequest("Expected entityName value or newDataSourceName.");
            }

            var entity = await _dataFormsProvider.CreateDataFormAsync(Tenant, dataform);

            return CreatedAtRoute("DataFormDesigner", new {id = entity.Id}, entity);
        }

        [ApiRoute, HttpDelete]
        public async void Delete(int id)
        {
            await _dataFormsProvider.DeleteDataFormAsync(Tenant, id);
        }

        #endregion

        #region MVC actions

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

        [Route("~/forms")]
        public async Task<ViewResult> Index()
        {
            var vm = new DataFormsIndexViewModel
            {
                Forms = (await _dataFormsProvider.GetDataForms(Tenant)).Select(f => new DataFormSummaryViewModel
                {
                    Url = Url.Action("Live", new { formId = f.Id }),
                    AuthorizationClaims = f.AuthorizedClaims,
                    Description = f.Description,
                    KeyValue = f.Id,
                    Title = f.Title
                })
            };
            return View(vm);
        }

        #endregion

        
    }
}