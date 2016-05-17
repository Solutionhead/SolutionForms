using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using BrockAllen.MembershipReboot;
using Microsoft.AspNet.Authorization;
using Microsoft.AspNet.Http.Features;
using Microsoft.AspNet.Mvc;
using SolutionForms.Client.Mvc.Attributes;
using SolutionForms.Client.Mvc.Middleware.Multitenancy;
using SolutionForms.Client.Mvc.Models;
using SolutionForms.Client.Mvc.ViewModels.Account;
using SolutionForms.Service.Providers.Providers;
using SolutionForms.Service.Providers.Models;
using SolutionForms.Client.Mvc.Helpers;
using Stripe;

// For more information on enabling MVC for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace SolutionForms.Client.Mvc.Controllers
{
    [Authorize(Policy = AuthorizationPolicies.AppAdmin)]
    public class AdminController : Controller
    {
        private readonly UserAccountService<ApplicationUser> _userAccountService;
        public string Tenant => HttpContext.Features.Get<ITenantFeature>().Tenant.Id;
        private readonly StripeHelper _stripeHelper;

        public AdminController(UserAccountService<ApplicationUser> userAccountService, StripeHelper stripeHelper)
        {
            if(userAccountService == null) throw new ArgumentNullException(nameof(userAccountService));
            _userAccountService = userAccountService;

            _stripeHelper = stripeHelper;
        }
        
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult ManageUsers()
        {
            return View();
        }

        #region MVC routes

        [Route("/admin/invite"), Authorize(Policy = "InviteUsers")]
        public IActionResult InviteUsers()
        {
            return View();
        }

        [Route("/admin/invite"), HttpPost, Authorize(Policy = "InviteUsers")]
        public IActionResult InviteUsers(InviteUsersViewModel values)
        {
            if (string.IsNullOrWhiteSpace(Tenant))
            {
                return View("Error");
            }

            if (!ModelState.IsValid)
            {
                ModelState.AddModelError("", "Please correct validation errors");
                return View(values);
            }

            try
            {
                _userAccountService.CreateAccount(Tenant, values.Email, null, values.Email);
            }
            catch (ValidationException ex)
            {
                ModelState.AddModelError("", ex.Message);
                return View();
            }

            return View(new InviteUsersViewModel
            {
                Message =
                    $"We've sent your invitation for {values.FirstName} to join the {Tenant} team! Tell {values.FirstName} to be on the look out for the email."
            });
        }

        [Route("/admin/payment")]
        public IActionResult ManagePayment()
        {
            return View(new ManagePaymentViewModel
            {
                ApiKey = _stripeHelper.PublishableApiKey
            });
        }

        #endregion

        #region API Actions

        [ApiRoute(controllerNameOverride:"payments")]
        public async Task<IActionResult> GetPaymentInformation()
        {
            var tenant = Tenant;
            if(string.IsNullOrWhiteSpace(tenant))
            {
                return View("Error");
            }

            var paymentProvider = HttpContext.GetApplicationService<PaymentProvider>();
            var result = await paymentProvider.GetPaymentInformationAsync(tenant);
            var response = result.Map().To<PaymentInformationResponse>();
            return Json(response);            
        }

        [ApiRoute(controllerNameOverride:"payments"), HttpPost]
        public async Task<IActionResult> SetPaymentInformation([FromBody] SetPaymentInformationRequest request)
        {
            var tenant = Tenant;
            if(string.IsNullOrWhiteSpace(tenant))
            {
                return View("Error");
            }

            var paymentProvider = HttpContext.GetApplicationService<PaymentProvider>();
            var parameters = request.Map().To<SetPaymentInformationParameters>();
            var result = await paymentProvider.SetPaymentInformationAsync(tenant, parameters);
            return Ok(result);
        }

        #endregion
    }
}
