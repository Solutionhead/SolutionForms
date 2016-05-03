using System;
using System.Net.Configuration;
using BrockAllen.MembershipReboot;
using BrockAllen.MembershipReboot.WebHost;
using Microsoft.AspNet.Authentication.Cookies;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.OptionsModel;
using SolutionForms.Data.Contexts;
using SolutionForms.Service.Providers.Configuration;
using SolutionForms.Service.Providers.MembershipRebootUtilities;
using SolutionForms.Service.Providers.Models;
using SolutionForms.Service.Providers.Providers;
using SmtpMessageDelivery = SolutionForms.Service.Providers.MembershipRebootUtilities.SmtpMessageDelivery;

namespace SolutionForms.Service.Providers.Middleware
{
    public class SolutionFormsProviderConfiguration
    {
        public string ConnectionString { get; set; }

        public CookieAuthenticationOptions CookieAuthenticationOptions { get; set; }
    }

    public static class ApplicationBuilderExtensions
    {
        public static void UseSolutionFormsProviders(this IApplicationBuilder app, SolutionFormsProviderConfiguration configuration)
        {
            RavenContext.Init(configuration.ConnectionString);
            if (configuration.CookieAuthenticationOptions != null) app.UseCookieAuthentication(configuration.CookieAuthenticationOptions);
            app.UseCookieAuthentication(new CookieAuthenticationOptions
            {
                AutomaticAuthenticate = true,
                AutomaticChallenge = true,
                AuthenticationScheme = MembershipRebootApplicationConstants.AuthenticationType,
                CookieSecure = configuration?.CookieAuthenticationOptions?.CookieSecure ?? CookieSecureOption.SameAsRequest
            });
            AutoMapperConfiguration.ConfigureMappings();
        }
    }

    public static class ServiceConfigurationExtensions
    {
        public static void ConfigureSolutionFormsProviders(this IServiceCollection services, ApplicationAccountInformation appAccountInformation, StmpDeliveryConfig smtpConfig)
        {
            services.AddSingleton(p => RavenContext.DocumentStore);
            //services.AddSingleton(p => new MembershipRebootConfiguration<ApplicationUser>(p.GetService<IOptions<SecuritySettings>>().Value));
            services.AddSingleton(p =>
            {
                var contextAccessor = p.GetService<IHttpContextAccessor>();
                var appInfo = new NewAspNetApplicationInformation(contextAccessor, "Solution Forms", "Solution Forms Team", appAccountInformation.RelativeLoginUrl, appAccountInformation.RelativeConfirmChangeEmailUrl, appAccountInformation.RelativeCancelVerificationUrl, appAccountInformation.RelativeConfirmPasswordResetUrl)
                {
                    CancelVerificationUrl = appAccountInformation.CancelVerificationUrl,
                    ConfirmChangeEmailUrl = appAccountInformation.ConfirmChangeEmailUrl,
                    ConfirmPasswordResetUrl = appAccountInformation.ConfirmChangeEmailUrl,
                };
                var config = new MembershipRebootConfiguration<ApplicationUser>(p.GetService<IOptions<SecuritySettings>>().Value);
                //todo: get application URL builder from services and pass into appInfo constructor.
                config.AddEventHandler(new EmailAccountEventsHandler<ApplicationUser>(new EmailMessageFormatter<ApplicationUser>(appInfo), new SmtpMessageDelivery(smtpConfig)));
                return config;
            });
            services.AddScoped<UserAccountService<ApplicationUser>>();
            services.AddScoped<DataFormsProvider>();
            services.AddScoped<DataSourcesProvider>();
            services.AddScoped<IUserAccountRepository<ApplicationUser>, MembershipProvider>();
            services.AddScoped<AuthenticationService<ApplicationUser>>(provider =>
                new AspNetAuthenticationService(
                    provider.GetService<UserAccountService<ApplicationUser>>(),
                    provider.GetService<IHttpContextAccessor>().HttpContext));

            services.AddScoped<TenantProvider>();
        }
    }

    [MembershipRebootReplacementNote(typeof(AspNetApplicationInformation), "GetApplicationUrl depends on HttpContext.Current")]
    public class NewAspNetApplicationInformation : RelativePathApplicationInformation
    {
        private readonly IHttpContextAccessor _contextAccessor;

        public NewAspNetApplicationInformation(IHttpContextAccessor contextAccessor, string appName, string emailSig, string relativeLoginUrl, string relativeConfirmChangeEmailUrl, string relativeCancelVerificationUrl, string relativeConfirmPasswordResetUrl)
        {
            _contextAccessor = contextAccessor;
            this.ApplicationName = appName;
            this.EmailSignature = emailSig;
            this.RelativeLoginUrl = relativeLoginUrl;
            this.RelativeConfirmChangeEmailUrl = relativeConfirmChangeEmailUrl;
            this.RelativeCancelVerificationUrl = relativeCancelVerificationUrl;
            this.RelativeConfirmPasswordResetUrl = relativeConfirmPasswordResetUrl;           
        }

        protected override string GetApplicationBaseUrl()
        {
            return GetApplicationUrl(_contextAccessor.HttpContext.Request);
        }
        public static string GetApplicationUrl(HttpRequest request)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            
            var baseUrl = $"{request.Scheme}://{request.Host}";
            if (!baseUrl.EndsWith("/")) baseUrl += "/";

            return baseUrl;
        }
    }

}