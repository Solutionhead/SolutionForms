﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using SolutionForms.Client.Mvc.Middleware.Multitenancy;

namespace SolutionForms.Client.Mvc.Controllers
{
    public class HomeController : Controller
    {
        public string Tenant => HttpContext.Features.Get<ITenantFeature>().Tenant.Id;

        public IActionResult Index()
        {
            return string.IsNullOrWhiteSpace(Tenant) 
                ? RedirectToAction("Login", "Account")
                : RedirectToAction("Index", "DataForms");
        }

        public IActionResult About()
        {
            ViewData["Message"] = "Your application description page.";

            return View();
        }

        public IActionResult Contact()
        {
            ViewData["Message"] = "Your contact page.";

            return View();
        }

        [AllowAnonymous]
        public IActionResult Error()
        {
            return View();
        }
    }
}
