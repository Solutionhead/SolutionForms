using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using BrockAllen.MembershipReboot;
using Microsoft.AspNet.Http;
using Microsoft.AspNet.Http.Authentication;
using SolutionForms.Client.Mvc.Models;

namespace SolutionForms.Client.Mvc.Entities
{
    public class AspNetAuthenticationService : AuthenticationService<ApplicationUser>
    {
        private HttpContext _context;
        private readonly string _authenticationScheme;

        public AspNetAuthenticationService(UserAccountService<ApplicationUser> userService, HttpContext context) 
            : this(userService, null, context)
        {
        }

        public AspNetAuthenticationService(UserAccountService<ApplicationUser> userService, ClaimsAuthenticationManager claimsAuthenticationManager, HttpContext context) 
            : this(MembershipRebootApplicationConstants.AuthenticationType, userService, claimsAuthenticationManager, context)
        {
        }

        public AspNetAuthenticationService(string authenticationScheme, UserAccountService<ApplicationUser> userService, ClaimsAuthenticationManager claimsAuthenticationManager, HttpContext context) : base(userService, claimsAuthenticationManager)
        {
            _authenticationScheme = authenticationScheme;
            _context = context;
        }

        protected override ClaimsPrincipal GetCurentPrincipal()
        {
            var user = _context.User;
            if (user != null && user.Identity.AuthenticationType == _authenticationScheme)
            {
                return _context.User ?? new ClaimsPrincipal(_context.User);
            }
            return null;
        }

        protected override void RevokeToken()
        {
            _context.Authentication.SignOutAsync(_authenticationScheme).Wait();
        }

        protected override void IssueToken(ClaimsPrincipal principal, TimeSpan? tokenLifetime = null, bool? persistentCookie = null)
        {
            if (principal == null) throw new ArgumentNullException(nameof(principal));
            IssueCookieAsync(principal.Claims,
                principal.Identity.IsAuthenticated
                    ? _authenticationScheme
                    : MembershipRebootApplicationConstants.AuthenticationTwoFactorType, tokenLifetime, persistentCookie).Wait();
        }

        private Task IssueCookieAsync(IEnumerable<Claim> enumerable, string authType, TimeSpan? tokenLifetime, bool? persistentCookie)
        {
            SignOut();

            var props = new AuthenticationProperties();
            if (tokenLifetime.HasValue) props.ExpiresUtc = DateTime.UtcNow.Add(tokenLifetime.Value);
            if (persistentCookie.HasValue) props.IsPersistent = persistentCookie.Value;

            var id = new ClaimsIdentity(enumerable, authType);

            return _context.Authentication.SignInAsync(_authenticationScheme, new ClaimsPrincipal(id));
        } 
    }
}