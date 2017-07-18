using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using BrockAllen.MembershipReboot;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http.Features;
using SolutionForms.Client.Mvc.Helpers;
using SolutionForms.Client.Mvc.ViewModels.Account;
using SolutionForms.Client.Mvc.Middleware.Multitenancy;
using SolutionForms.Service.Providers.Providers;
using SolutionForms.Service.Providers.Enums;
using SolutionForms.Service.Providers.Parameters;
using SolutionForms.Service.Providers.Models;
using Microsoft.Extensions.Logging;

namespace SolutionForms.Client.Mvc.Controllers
{
    [AllowAnonymous]
    public class AccountController : Controller
    {
        private readonly BetaAccessHelper _betaAccessHelper;
        private readonly TenantRedirectHelper _tenantRedirectHelper;

        public AccountController(AuthenticationService<ApplicationUser> authService, BetaAccessHelper betaAccessHelper, ILogger<AccountController> logger)
        {
            if (authService == null)
            {
                throw new ArgumentNullException(nameof(authService));
            }

            UserManager = authService.UserAccountService;
            SignInManager = authService;
            _betaAccessHelper = betaAccessHelper;

            _logger = logger;
            _tenantRedirectHelper = TenantRedirectHelper.WithLogging(_logger);
        }

        public string Tenant => HttpContext.Features.Get<ITenantFeature>().Tenant.Id;

        public AuthenticationService<ApplicationUser> SignInManager { get; }

        public UserAccountService<ApplicationUser> UserManager { get; }

        private readonly ILogger _logger;

        [HttpGet, AllowAnonymous]
        public IActionResult RegisterTenant()
        {
            if (!string.IsNullOrWhiteSpace(Tenant))
            {
                return _tenantRedirectHelper
                    .RedirectToRootDomain(RouteData.Values, Request, Url);
            }
            
            return View();
        }

        [HttpPost, AllowAnonymous]
        public async Task<IActionResult> RegisterTenant(RegisterTenantViewModel model)
        {
            if (!ModelState.IsValid) { return View(); }
            if(model.BetaAccessKey != _betaAccessHelper.BetaAccessKey)
            {
                return UnsuccessfulTenantCreation(CreateTenantResult.InvalidBetaAccessKey);
            }

            var tenantProvider = HttpContext.GetService<TenantProvider>();
            var result = await tenantProvider.CreateTenantAsync(new CreateTenantParameters
            {
                OrganizationName = model.OrganizationName,
                OrganizationDomain = model.OrganizationDomain
            });

            if (result != CreateTenantResult.TenantCreated)
            {
                return UnsuccessfulTenantCreation(result);
            }
            UserManager.CreateAccount(model.OrganizationDomain, model.Email, model.Password, model.Email, null, null, null, new List<Claim>
            {
                new Claim(AuthorizationPolicies.AppOwner, "true")
            });
            
            return _tenantRedirectHelper.RedirectToTenantDomain(model.OrganizationDomain, "Login", HttpContext.Request, Url);
        }

        private IActionResult UnsuccessfulTenantCreation(CreateTenantResult result)
        {
            switch (result)
            {
                case CreateTenantResult.DuplicateTenantDomainExists:
                    ModelState.AddModelError("", "Sorry, this URL is not available.");
                    break;

                case CreateTenantResult.InvalidBetaAccessKey:
                    ModelState.AddModelError("", "The supplied Beta Access Key was invalid.");
                    break;

                default:
                    ModelState.AddModelError("",
                        "An error has occurred while attempting to create your organization. Please try again later.");
                    break;
            }
            return View();
        }

        //private ViewResult Login(LoginViewModel model = null)
        //{
        //    return string.IsNullOrWhiteSpace(Tenant)
        //        ? View("LoginTenant")
        //        : View("Login", model);
        //}

        //
        // GET: /Account/Login
        [HttpGet]
        [AllowAnonymous]
        public IActionResult Login(string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            return string.IsNullOrWhiteSpace(Tenant)
                ? View("LoginTenant")
                : View("Login");
        }

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> LoginTenant(TenantLoginViewModel model, string returnUrl = null)
        {
            if (!ModelState.IsValid)
            {
                ViewData["ReturnUrl"] = returnUrl;
                return View("LoginTenant");
            }

            var tenantProvider = HttpContext.GetService<TenantProvider>();
            var tenantExists = await tenantProvider.LookupTenantByDomainAsync(model.TenantDomain);
            if (!tenantExists)
            {
                ModelState.AddModelError("", "We couldn't find your organization.");
                return Login();
            }
            
            return _tenantRedirectHelper.RedirectToTenantDomain(model.TenantDomain, "Login", HttpContext.Request, Url);
        }
        
        //
        // POST: /Account/Login
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public IActionResult Login(LoginViewModel model, string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            if (ModelState.IsValid)
            {
                SignInManager.SignOut();
                ApplicationUser user;
                UserManager.AuthenticateWithEmail(Tenant, model.Email, model.Password, out user);
                if (user == null)
                {
                    ModelState.AddModelError("", "Invalid login attempt");
                }
                //else if (user.RequiresTwoFactorAuthToSignIn())
                //{
                //    return RedirectToAction(nameof(SendCode), new {ReturnUrl = returnUrl, RememberMe = model.RememberMe});
                //}
                else if (!user.IsLoginAllowed)
                {
                    //    _logger.LogWarning(2, "User account locked out.");
                    return View("Lockout");
                }
                else
                {
                    SignInManager.SignIn(user, model.RememberMe);
                    //    _logger.LogInformation(1, "User logged in.");

                    return Url.IsLocalUrl(returnUrl)
                        ? RedirectToLocal(returnUrl)
                        : RedirectToAction(nameof(HomeController.Index), "Home");
                }
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        //
        // POST: /Account/LogOff
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult LogOff()
        {
            SignInManager.SignOut();
            //_logger.LogInformation(4, "User logged out.");
            return RedirectToAction(nameof(HomeController.Index), "Home");
        }

        [HttpGet]
        [AllowAnonymous]
        [Route("account/activate/{code}")]
        public IActionResult ActivateAccount(string code)
        {
            var user = UserManager.GetByVerificationKey(code);
            if (user.IsAccountVerified)
            {
                return User.Identity.IsAuthenticated
                    ? _tenantRedirectHelper.RedirectToTenantDomain(user.Tenant, "Index", "Home", Request, Url)
                    : _tenantRedirectHelper.RedirectToTenantDomain(user.Tenant, "Login", Request, Url);
            }

            return View(new ActivateAccountViewModel
            {
                VerificationCode = code,
                DisplayPasswordConfirmation = !user.HasPassword(),
            });
        }

        [HttpPost]
        [AllowAnonymous]
        [Route("account/activate/{code}")]
        public IActionResult ActivateAccount(ActivateAccountViewModel model)
        {
            var user = UserManager.GetByVerificationKey(model.VerificationCode);
            if (user == null)
            {
                return View("Error");
            }

            if (user.IsAccountVerified)
            {
                return User.Identity.IsAuthenticated
                    ? _tenantRedirectHelper.RedirectToTenantDomain(user.Tenant, "Index", "Home", Request, Url)
                    : _tenantRedirectHelper.RedirectToTenantDomain(user.Tenant, "Login", Request, Url);
            }

            if(user.HasPassword())
            {
                ModelState.Remove(nameof(model.ConfirmPassword));
            }

            if (!ModelState.IsValid)
            {
                return string.IsNullOrWhiteSpace(model.VerificationCode) 
                    ? View("Error") 
                    : View(model);
            }

            UserManager.VerifyEmailFromKey(model.VerificationCode, model.Password, out user);
            SignInManager.SignIn(user);

            return _tenantRedirectHelper.RedirectToTenantDomain(user.Tenant, "Index", "Home", Request, Url);
        }

        //
        // GET: /Account/ForgotPassword
        [HttpGet]
        [AllowAnonymous]
        public IActionResult ForgotPassword()
        {
            return View();
        }

        //
        // POST: /Account/ForgotPassword
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public IActionResult ForgotPassword(ForgotPasswordViewModel model)
        {
            if (ModelState.IsValid)
            {
                var user = UserManager.GetByEmail(Tenant, model.Email);
                if (user == null || !user.IsAccountVerified)
                {
                    // Don't reveal that the user does not exist or is not confirmed
                    return View("ForgotPasswordConfirmation");
                }

                UserManager.ResetPassword(user.ID);
                return RedirectToAction("ForgotPasswordConfirmation", "Account");

                //// For more information on how to enable account confirmation and password reset please visit http://go.microsoft.com/fwlink/?LinkID=532713
                //// Send an email with this link
                //var code = await UserManager.GeneratePasswordResetTokenAsync(user.Id);
                //var callbackUrl = Url.Action("ResetPassword", "Account", new { userId = user.Id, code = code }, protocol: HttpContext.Request.Scheme);
                //await _emailSender.SendEmailAsync(model.Email, "Reset Password",
                //   "Please reset your password by clicking here: <a href=\"" + callbackUrl + "\">link</a>");
                //return View("ForgotPasswordConfirmation");
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        //
        // GET: /Account/ForgotPasswordConfirmation
        [HttpGet]
        [AllowAnonymous]
        public IActionResult ForgotPasswordConfirmation()
        {
            return View();
        }

        //
        // GET: /Account/ResetPassword
        [HttpGet, Route("/account/resetpassword/{code}")]
        [AllowAnonymous]
        public IActionResult ResetPassword(string code = null)
        {
            if (code == null) return View("Error");

            var model = new ResetPasswordViewModel
            {
                Code = code
            };
            return View(model);
        }

        //
        // POST: /Account/ResetPassword
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public IActionResult ResetPassword(ResetPasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            UserManager.ChangePasswordFromResetKey(model.Code, model.Password);
            return RedirectToAction("ResetPasswordConfirmation", "Account");
        }

        //
        // GET: /Account/ResetPasswordConfirmation
        [HttpGet]
        [AllowAnonymous]
        public IActionResult ResetPasswordConfirmation()
        {
            return View();
        }

        [HttpGet, AllowAnonymous]
        public IActionResult CancelAccountVerification(string verificationKey)
        {
            UserManager.CancelVerification(verificationKey);
            return RedirectToAction("Index", "Home");
        }

        [AllowAnonymous]
        public IActionResult AccessDenied()
        {
            return View();
        }

        #region External Login (commented out)

        //// Used for XSRF protection when adding external logins
        //private const string XsrfKey = "XsrfId";

        //private class ChallengeResult : HttpUnauthorizedResult
        //{
        //    public ChallengeResult(string provider, string redirectUri, string userId = null)
        //    {
        //        LoginProvider = provider;
        //        RedirectUri = redirectUri;
        //        UserId = userId;
        //    }

        //    private string LoginProvider { get; }
        //    private string RedirectUri { get; }
        //    private string UserId { get; }

        //    public override Task ExecuteResultAsync(ActionContext context)
        //    {
        //        var properties = new AuthenticationProperties
        //        {
        //            RedirectUri = RedirectUri
        //        };
        //        if (UserId != null)
        //        {
        //            properties.Items[XsrfKey] = UserId;
        //        }
        //        context.HttpContext.Authentication.ChallengeAsync(LoginProvider, properties);
        //        return base.ExecuteResultAsync(context);
        //    }
        //}


        ////
        //// POST: /Account/ExternalLogin
        //[HttpPost]
        //[AllowAnonymous]
        //[ValidateAntiForgeryToken]
        //public IActionResult ExternalLogin(string provider, string returnUrl = null)
        //{
        //    // Request a redirect to the external login provider.
        //    return new ChallengeResult(provider, Url.Action("ExternalLoginCallback", "Account", new { ReturnUrl = returnUrl }));
        //}

        ////
        //// GET: /Account/ExternalLoginCallback
        //[HttpGet]
        //[AllowAnonymous]
        //public async Task<IActionResult> ExternalLoginCallback(string returnUrl = null)
        //{
        //    var loginInfo = await AuthenticationManager.GetExternalLoginInfoAsync();
        //    if (loginInfo == null)
        //    {
        //        return RedirectToAction("Login");
        //    }

        //    // Sign in the user with this external login provider if the user already has a login
        //    var user = await UserManager.FindAsync(loginInfo.Login);
        //    if (user != null)
        //    {
        //        await SignInAsync(user, isPersistent: false);
        //        return RedirectToLocal(returnUrl);
        //    }
        //    else
        //    {
        //        // If the user does not have an account, then prompt the user to create an account
        //        ViewBag.ReturnUrl = returnUrl;
        //        ViewBag.LoginProvider = loginInfo.Login.LoginProvider;
        //        return View("ExternalLoginConfirmation", new ExternalLoginConfirmationViewModel { UserName = loginInfo.DefaultUserName });
        //    }

        //    var info = await _signInManager.GetExternalLoginInfoAsync();
        //    if (info == null)
        //    {
        //        return RedirectToAction(nameof(Login));
        //    }

        //    // Sign in the user with this external login provider if the user already has a login.
        //    var result = await _signInManager.ExternalLoginSignInAsync(info.LoginProvider, info.ProviderKey, isPersistent: false);
        //    if (result.Succeeded)
        //    {
        //        _logger.LogInformation(5, "User logged in with {Name} provider.", info.LoginProvider);
        //        return RedirectToLocal(returnUrl);
        //    }
        //    if (result.RequiresTwoFactor)
        //    {
        //        return RedirectToAction(nameof(SendCode), new { ReturnUrl = returnUrl });
        //    }
        //    if (result.IsLockedOut)
        //    {
        //        return View("Lockout");
        //    }
        //    else
        //    {
        //        // If the user does not have an account, then ask the user to create an account.
        //        ViewData["ReturnUrl"] = returnUrl;
        //        ViewData["LoginProvider"] = info.LoginProvider;
        //        var email = info.ExternalPrincipal.FindFirstValue(ClaimTypes.Email);
        //        return View("ExternalLoginConfirmation", new ExternalLoginConfirmationViewModel { Email = email });
        //    }
        //}

        ////
        //// POST: /Account/ExternalLoginConfirmation
        //[HttpPost]
        //[AllowAnonymous]
        //[ValidateAntiForgeryToken]
        //public async Task<IActionResult> ExternalLoginConfirmation(ExternalLoginConfirmationViewModel model, string returnUrl = null)
        //{
        //    if (User.IsSignedIn())
        //    {
        //        return RedirectToAction(nameof(ManageController.Index), "Manage");
        //    }

        //    if (ModelState.IsValid)
        //    {
        //        // Get the information about the user from the external login provider
        //        var info = await _signInManager.GetExternalLoginInfoAsync();
        //        if (info == null)
        //        {
        //            return View("ExternalLoginFailure");
        //        }
        //        var user = new ApplicationUser { UserName = model.Email, Email = model.Email };
        //        var result = await _userManager.CreateAsync(user);
        //        if (result.Succeeded)
        //        {
        //            result = await _userManager.AddLoginAsync(user, info);
        //            if (result.Succeeded)
        //            {
        //                await _signInManager.SignInAsync(user, isPersistent: false);
        //                _logger.LogInformation(6, "User created an account using {Name} provider.", info.LoginProvider);
        //                return RedirectToLocal(returnUrl);
        //            }
        //        }
        //        AddErrors(result);
        //    }

        //    ViewData["ReturnUrl"] = returnUrl;
        //    return View(model);
        //}

        #endregion

        #region TwoFactor Authentication (commented out)

        ////
        //// GET: /Account/SendCode
        //[HttpGet]
        //[AllowAnonymous]
        //public async Task<ActionResult> SendCode(string returnUrl = null, bool rememberMe = false)
        //{
        //    var user = await _signInManager.GetTwoFactorAuthenticationUserAsync();
        //    if (user == null)
        //    {
        //        return View("Error");
        //    }
        //    var userFactors = await UserManager.GetValidTwoFactorProvidersAsync(user.Id);
        //    var factorOptions = userFactors.Select(purpose => new SelectListItem { Text = purpose, Value = purpose }).ToList();
        //    return View(new SendCodeViewModel { Providers = factorOptions, ReturnUrl = returnUrl, RememberMe = rememberMe });
        //}

        ////
        //// POST: /Account/SendCode
        //[HttpPost]
        //[AllowAnonymous]
        //[ValidateAntiForgeryToken]
        //public async Task<IActionResult> SendCode(SendCodeViewModel model)
        //{
        //    if (!ModelState.IsValid)
        //    {
        //        return View();
        //    }

        //    var user = await _signInManager.GetTwoFactorAuthenticationUserAsync();
        //    if (user == null)
        //    {
        //        return View("Error");
        //    }

        //    // Generate the token and send it
        //    var code = await UserManager.GenerateTwoFactorTokenAsync(user.Id, model.SelectedProvider);
        //    if (string.IsNullOrWhiteSpace(code))
        //    {
        //        return View("Error");
        //    }

        //    var message = "Your security code is: " + code;
        //    if (model.SelectedProvider == "Email")
        //    {
        //        await _emailSender.SendEmailAsync(await UserManager.GetEmailAsync(user.Id), "Security Code", message);
        //    }
        //    else if (model.SelectedProvider == "Phone")
        //    {
        //        await _smsSender.SendSmsAsync(await UserManager.GetPhoneNumberAsync(user.Id), message);
        //    }

        //    return RedirectToAction(nameof(VerifyCode), new { Provider = model.SelectedProvider, ReturnUrl = model.ReturnUrl, RememberMe = model.RememberMe });
        //}

        ////
        //// GET: /Account/VerifyCode
        //[HttpGet]
        //[AllowAnonymous]
        //public async Task<IActionResult> VerifyCode(string provider, bool rememberMe, string returnUrl = null)
        //{
        //    // Require that the user has already logged in via username/password or external login
        //    var user = await _signInManager.GetTwoFactorAuthenticationUserAsync();
        //    if (user == null)
        //    {
        //        return View("Error");
        //    }
        //    return View(new VerifyCodeViewModel { Provider = provider, ReturnUrl = returnUrl, RememberMe = rememberMe });
        //}

        ////
        //// POST: /Account/VerifyCode
        //[HttpPost]
        //[AllowAnonymous]
        //[ValidateAntiForgeryToken]
        //public async Task<IActionResult> VerifyCode(VerifyCodeViewModel model)
        //{
        //    if (!ModelState.IsValid)
        //    {
        //        return View(model);
        //    }

        //    // The following code protects for brute force attacks against the two factor codes.
        //    // If a user enters incorrect codes for a specified amount of time then the user account
        //    // will be locked out for a specified amount of time.
        //    var result = await _signInManager.TwoFactorSignInAsync(model.Provider, model.Code, model.RememberMe, model.RememberBrowser);
        //    if (result.Succeeded)
        //    {
        //        return RedirectToLocal(model.ReturnUrl);
        //    }
        //    if (result.IsLockedOut)
        //    {
        //        _logger.LogWarning(7, "User account locked out.");
        //        return View("Lockout");
        //    }
        //    else
        //    {
        //        ModelState.AddModelError("", "Invalid code.");
        //        return View(model);
        //    }
        //}

        #endregion

        #region Helpers

        private IActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            else
            {
                return RedirectToAction(nameof(HomeController.Index), "Home");
            }
        }

        #endregion
    }
}