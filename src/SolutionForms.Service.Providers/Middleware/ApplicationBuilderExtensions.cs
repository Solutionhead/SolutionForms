using BrockAllen.MembershipReboot;
using Microsoft.AspNet.Authentication.Cookies;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.OptionsModel;
using SolutionForms.Data.Contexts;
using SolutionForms.Service.Providers.Models;
using SolutionForms.Service.Providers.Providers;

namespace SolutionForms.Service.Providers.Middleware
{
    public static class ApplicationBuilderExtensions
    {
        public static void UseSolutionFormsProviders(this IApplicationBuilder app, CookieAuthenticationOptions cookieOptions = null)
        {
            RavenContext.Init();
            if (cookieOptions != null) app.UseCookieAuthentication(cookieOptions);
            app.UseCookieAuthentication(new CookieAuthenticationOptions
            {
                AutomaticAuthenticate = true,
                AutomaticChallenge = true,
                AuthenticationScheme = MembershipRebootApplicationConstants.AuthenticationType,
                CookieSecure = cookieOptions?.CookieSecure ?? CookieSecureOption.SameAsRequest
            });
        }
    }

    public static class ServiceConfigurationExtensions
    {
        public static void ConfigureSolutionFormsProviders(this IServiceCollection services)
        {
            services.AddSingleton(p => RavenContext.DocumentStore);
            services.AddSingleton(p => new MembershipRebootConfiguration<ApplicationUser>(p.GetService<IOptions<SecuritySettings>>().Value));
            services.AddScoped<UserAccountService<ApplicationUser>>();
            services.AddScoped<IUserAccountRepository<ApplicationUser>, UserAccountProvider>();
            services.AddScoped<AuthenticationService<ApplicationUser>>(provider =>
                new AspNetAuthenticationService(
                    provider.GetService<UserAccountService<ApplicationUser>>(),
                    provider.GetService<IHttpContextAccessor>().HttpContext));

            services.AddScoped<TenantProvider>();
        }
    }
}