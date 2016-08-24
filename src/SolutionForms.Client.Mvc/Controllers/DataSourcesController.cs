using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using SolutionForms.Client.Mvc.Attributes;
using SolutionForms.Client.Mvc.Middleware.Multitenancy;
using SolutionForms.Service.Providers.Providers;
using SolutionForms.Service.Providers.Returns;

// For more information on enabling Web API for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace SolutionForms.Client.Mvc.Controllers
{
    [ApiRoute]
    public class DataSourcesController : Controller
    {
        private readonly DataSourcesProvider _dataSourcesProvider;
        public string Tenant => HttpContext.Features.Get<ITenantFeature>().Tenant.Id;

        public DataSourcesController(DataSourcesProvider dataSourcesProvider)
        {
            if(dataSourcesProvider == null) {  throw new ArgumentNullException(nameof(dataSourcesProvider)); }
            _dataSourcesProvider = dataSourcesProvider;
        }

        // GET: api/values
        [HttpGet]
        public async Task<IEnumerable<DataSourceReturn>> Get()
        {
            return await _dataSourcesProvider.GetDataSources(Tenant);
        }
    }
}
