using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using BrockAllen.MembershipReboot;
using Microsoft.AspNet.Http.Features;
using Microsoft.AspNet.Mvc;
using SolutionForms.Client.Mvc.Middleware.Multitenancy;
using SolutionForms.Client.Mvc.ViewModels.Account;
using SolutionForms.Service.Providers.Models;

// For more information on enabling MVC for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace SolutionForms.Client.Mvc.Controllers
{
    //todo: restrict access (is owner or has claims)

    public class AdminController : Controller
    {
        private readonly UserAccountService<ApplicationUser> _userAccountService;
        public string Tenant => HttpContext.Features.Get<ITenantFeature>().Tenant.Id;

        public AdminController(UserAccountService<ApplicationUser> userAccountService)
        {
            if(userAccountService == null) throw new ArgumentNullException(nameof(userAccountService));
            _userAccountService = userAccountService;
        }
        
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult ManageUsers()
        {
            return View();
        }

        [Route("/admin/invite")]
        public IActionResult InviteUsers()
        {
            return View();
        }

        [Route("/admin/invite"), HttpPost]
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
                Message = $"We've sent your invitation for {values.FirstName} to join the {Tenant} team! Tell {values.FirstName} to be on the look out for the email."
            });
        }
    }
}
