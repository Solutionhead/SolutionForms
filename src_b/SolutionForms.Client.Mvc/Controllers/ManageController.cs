using System.Collections.Generic;
using BrockAllen.MembershipReboot;
using Microsoft.AspNetCore.Mvc;
using SolutionForms.Client.Mvc.Models;
using SolutionForms.Client.Mvc.Services;
using SolutionForms.Client.Mvc.ViewModels.Manage;
using SolutionForms.Service.Providers.Models;

namespace SolutionForms.Client.Mvc.Controllers
{
    public class ManageController : Controller
    {
        private readonly IEmailSender _emailSender;
        private readonly ISmsSender _smsSender;
        //private readonly ILogger _logger;

        private readonly UserAccountService<ApplicationUser> _userAccountService;
        private readonly AuthenticationService<ApplicationUser> _authenticationService;

        public ManageController(AuthenticationService<ApplicationUser> authenticationService, ISmsSender smsSender, IEmailSender emailSender)
        {
            _userAccountService = authenticationService.UserAccountService;
            _authenticationService = authenticationService;
            _smsSender = smsSender;
            _emailSender = emailSender;
        }
        
        //
        // GET: /Manage/Index
        [HttpGet]
        public IActionResult Index(ManageMessageId? message = null)
        {
            ViewData["StatusMessage"] =
                message == ManageMessageId.ChangePasswordSuccess ? "Your password has been changed."
                : message == ManageMessageId.SetPasswordSuccess ? "Your password has been set."
                : message == ManageMessageId.SetTwoFactorSuccess ? "Your two-factor authentication provider has been set."
                : message == ManageMessageId.Error ? "An error has occurred."
                : message == ManageMessageId.AddPhoneSuccess ? "Your phone number was added."
                : message == ManageMessageId.RemovePhoneSuccess ? "Your phone number was removed."
                : "";

            var user = GetCurrentUser();
            var model = new IndexViewModel
            {
                HasPassword = user.HasPassword(),
                PhoneNumber = user.MobilePhoneNumber,
                TwoFactor = user.RequiresTwoFactorAuthToSignIn(),
                Logins = new List<UserLoginInfo>(),
                BrowserRemembered = false,
            };
            return View(model);
        }

        #region Two Factor Authentication account management (commented out)

        ////
        //// POST: /Manage/RemoveLogin
        //[HttpPost]
        //[ValidateAntiForgeryToken]
        //public async Task<IActionResult> RemoveLogin(RemoveLoginViewModel account)
        //{
        //    ManageMessageId? message = ManageMessageId.Error;
        //    var user = GetCurrentUser();
        //    if (user != null)
        //    {
        //        var result = await _userManager.RemoveLoginAsync(user.Id, new UserLoginInfo(account.LoginProvider, account.ProviderKey));
        //        if (result.Succeeded)
        //        {
        //            //await _signInManager.SignInAsync(user, isPersistent: false);
        //            await SignInAsync(user, isPersistent: false);
        //            message = ManageMessageId.RemoveLoginSuccess;
        //        }
        //    }
        //    return RedirectToAction(nameof(ManageLogins), new { Message = message });
        //}

        ////
        //// GET: /Manage/AddPhoneNumber
        //public IActionResult AddPhoneNumber()
        //{
        //    return View();
        //}

        ////
        //// POST: /Manage/AddPhoneNumber
        //[HttpPost]
        //[ValidateAntiForgeryToken]
        //public async Task<IActionResult> AddPhoneNumber(AddPhoneNumberViewModel model)
        //{
        //    if (!ModelState.IsValid)
        //    {
        //        return View(model);
        //    }
        //    // Generate the token and send it
        //    var user = GetCurrentUser();
        //    var code = await _userManager.GenerateChangePhoneNumberTokenAsync(user.Id, model.PhoneNumber);
        //    await _smsSender.SendSmsAsync(model.PhoneNumber, "Your security code is: " + code);
        //    return RedirectToAction(nameof(VerifyPhoneNumber), new { PhoneNumber = model.PhoneNumber });
        //}

        ////
        //// POST: /Manage/EnableTwoFactorAuthentication
        //[HttpPost]
        //[ValidateAntiForgeryToken]
        //public async Task<IActionResult> EnableTwoFactorAuthentication()
        //{
        //    var user = GetCurrentUser();
        //    if (user != null)
        //    {
        //        await _userManager.SetTwoFactorEnabledAsync(user.Id, true);
        //        await SignInAsync(user, false);
        //        //await _signInManager.SignInAsync(user, isPersistent: false);
        //        _logger.LogInformation(1, "User enabled two-factor authentication.");
        //    }
        //    return RedirectToAction(nameof(Index), "Manage");
        //}

        ////
        //// POST: /Manage/DisableTwoFactorAuthentication
        //[HttpPost]
        //[ValidateAntiForgeryToken]
        //public async Task<IActionResult> DisableTwoFactorAuthentication()
        //{
        //    var user = GetCurrentUser();
        //    if (user != null)
        //    {
        //        await _userManager.SetTwoFactorEnabledAsync(user.Id, false);
        //        await SignInAsync(user, isPersistent: false);
        //        //await _signInManager.SignInAsync(user, isPersistent: false);
        //        _logger.LogInformation(2, "User disabled two-factor authentication.");
        //    }
        //    return RedirectToAction(nameof(Index), "Manage");
        //}

        ////
        //// GET: /Manage/VerifyPhoneNumber
        //[HttpGet]
        //public async Task<IActionResult> VerifyPhoneNumber(string phoneNumber)
        //{
        //    var code = await _userManager.GenerateChangePhoneNumberTokenAsync((GetCurrentUser()).Id, phoneNumber);
        //    // Send an SMS to verify the phone number
        //    return phoneNumber == null ? View("Error") : View(new VerifyPhoneNumberViewModel { PhoneNumber = phoneNumber });
        //}

        ////
        //// POST: /Manage/VerifyPhoneNumber
        //[HttpPost]
        //[ValidateAntiForgeryToken]
        //public async Task<IActionResult> VerifyPhoneNumber(VerifyPhoneNumberViewModel model)
        //{
        //    if (!ModelState.IsValid)
        //    {
        //        return View(model);
        //    }
        //    var user = GetCurrentUser();
        //    if (user != null)
        //    {
        //        var result = await _userManager.ChangePhoneNumberAsync(user.Id, model.PhoneNumber, model.Code);
        //        if (result.Succeeded)
        //        {
        //            await SignInAsync(user, isPersistent: false);
        //            //await _signInManager.SignInAsync(user, isPersistent: false);
        //            return RedirectToAction(nameof(Index), new { Message = ManageMessageId.AddPhoneSuccess });
        //        }
        //    }
        //    // If we got this far, something failed, redisplay the form
        //    ModelState.AddModelError(string.Empty, "Failed to verify phone number");
        //    return View(model);
        //}

        ////
        //// GET: /Manage/RemovePhoneNumber
        //[HttpGet]
        //public async Task<IActionResult> RemovePhoneNumber()
        //{
        //    var user = GetCurrentUser();
        //    if (user != null)
        //    {
        //        var result = await _userManager.SetPhoneNumberAsync(user.Id, null);
        //        if (result.Succeeded)
        //        {
        //            await SignInAsync(user, isPersistent: false);
        //            //await _signInManager.SignInAsync(user, isPersistent: false);
        //            return RedirectToAction(nameof(Index), new { Message = ManageMessageId.RemovePhoneSuccess });
        //        }
        //    }
        //    return RedirectToAction(nameof(Index), new { Message = ManageMessageId.Error });
        //}

        #endregion

        //
        // GET: /Manage/ChangePassword
        [HttpGet]
        public IActionResult ChangePassword()
        {
            return View();
        }

        //
        // POST: /Manage/ChangePassword
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult ChangePassword(ChangePasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }
            var user = GetCurrentUser();
            if (user != null)
            {
                _userAccountService.ChangePassword(user.ID, model.OldPassword, model.NewPassword);
                _authenticationService.SignIn(user, false);
                //_logger.LogInformation(3, "User changed their password successfully.");
                return RedirectToAction(nameof(Index), new { Message = ManageMessageId.ChangePasswordSuccess });
            }
            return RedirectToAction(nameof(Index), new { Message = ManageMessageId.Error });
        }

        //
        // GET: /Manage/SetPassword
        [HttpGet]
        public IActionResult SetPassword()
        {
            return View();
        }

        //
        // POST: /Manage/SetPassword
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult SetPassword(SetPasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var user = GetCurrentUser();
            if (user == null) return RedirectToAction(nameof(Index), new {Message = ManageMessageId.Error});

            _userAccountService.SetPassword(user.ID, model.NewPassword);
            _authenticationService.SignIn(user, false);
            return RedirectToAction(nameof(Index), new { Message = ManageMessageId.SetPasswordSuccess });
        }

        #region External Login (commented out)

        ////GET: /Manage/ManageLogins
        //[HttpGet]
        //public async Task<IActionResult> ManageLogins(ManageMessageId? message = null)
        //{
        //    ViewData["StatusMessage"] =
        //        message == ManageMessageId.RemoveLoginSuccess ? "The external login was removed."
        //        : message == ManageMessageId.AddLoginSuccess ? "The external login was added."
        //        : message == ManageMessageId.Error ? "An error has occurred."
        //        : "";
        //    var user = GetCurrentUser();
        //    if (user == null)
        //    {
        //        return View("Error");
        //    }
        //    var userLogins = await _userManager.GetLoginsAsync(user.Id);
        //    var otherLogins = _signInManager.GetExternalAuthenticationSchemes().Where(auth => userLogins.All(ul => auth.AuthenticationScheme != ul.LoginProvider)).ToList();
        //    ViewData["ShowRemoveButton"] = user.PasswordHash != null || userLogins.Count > 1;
        //    return View(new ManageLoginsViewModel
        //    {
        //        CurrentLogins = userLogins,
        //        OtherLogins = otherLogins
        //    });
        //}

        ////
        //// POST: /Manage/LinkLogin
        //[HttpPost]
        //[ValidateAntiForgeryToken]
        //public IActionResult LinkLogin(string provider)
        //{
        //    // Request a redirect to the external login provider to link a login for the current user
        //    var redirectUrl = Url.Action("LinkLoginCallback", "Manage");
        //    var properties = _signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUrl, User.GetUserId());
        //    return new ChallengeResult(provider, properties);
        //}

        ////
        //// GET: /Manage/LinkLoginCallback
        //[HttpGet]
        //public async Task<ActionResult> LinkLoginCallback()
        //{
        //    var user = GetCurrentUser();
        //    if (user == null)
        //    {
        //        return View("Error");
        //    }
        //    var info = await _signInManager.GetExternalLoginInfoAsync(User.GetUserId());
        //    if (info == null)
        //    {
        //        return RedirectToAction(nameof(ManageLogins), new { Message = ManageMessageId.Error });
        //    }
        //    var result = await _userManager.AddLoginAsync(user, info);
        //    var message = result.Succeeded ? ManageMessageId.AddLoginSuccess : ManageMessageId.Error;
        //    return RedirectToAction(nameof(ManageLogins), new { Message = message });
        //}

        #endregion

        #region Helpers
            
        public enum ManageMessageId
        {
            AddPhoneSuccess,
            AddLoginSuccess,
            ChangePasswordSuccess,
            SetTwoFactorSuccess,
            SetPasswordSuccess,
            RemoveLoginSuccess,
            RemovePhoneSuccess,
            Error
        }

        private ApplicationUser GetCurrentUser()
        {
            return _userAccountService.GetByID(HttpContext.User.GetUserID());
        }

        #endregion
    }
}
