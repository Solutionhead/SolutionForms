using BrockAllen.MembershipReboot;
using Microsoft.AspNet.Authentication.Cookies;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Hosting;
using Microsoft.AspNet.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.OptionsModel;
using SolutionForms.Client.Mvc.Entities;
using SolutionForms.Client.Mvc.Middleware.Multitenancy;
using SolutionForms.Client.Mvc.Models;
using SolutionForms.Client.Mvc.Services;

namespace SolutionForms.Client.Mvc
{
    public class Startup
    {
        public Startup(IHostingEnvironment env)
        {
            // Set up configuration sources.
            var builder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true);

            if (env.IsDevelopment())
            {
                // For more details on using the user secret store see http://go.microsoft.com/fwlink/?LinkID=532709
                builder.AddUserSecrets();
            }

            builder.AddEnvironmentVariables();
            Configuration = builder.Build();

            RavenContext.Init();
        }

        public IConfigurationRoot Configuration { get; set; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // Add framework services.
            services.AddAuthentication();
            services.AddAuthorization();

            services.AddMvc();

            // Add application services.

            #region RavenDB and RavenUserStore

            ConfigureMembershipReboot(services);
            services.AddSingleton(p => RavenContext.DocumentStore);
            
            #endregion

            services.AddTransient<IEmailSender, AuthMessageSender>();
            services.AddTransient<ISmsSender, AuthMessageSender>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddDebug();

            if (env.IsDevelopment())
            {
                app.UseBrowserLink();
                app.UseDeveloperExceptionPage();
                app.UseDatabaseErrorPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseIISPlatformHandler(options => options.AuthenticationDescriptions.Clear());

            app.UseStaticFiles();

            app.UseMembershipReboot(new CookieAuthenticationOptions {

                LoginPath = new PathString("/Account/Login"),
                AutomaticAuthenticate = true,
                AutomaticChallenge = true,
            });
            
            app.UseTenantResolver();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });
        }

        // Entry point for the application.
        public static void Main(string[] args) => WebApplication.Run<Startup>(args);
        
        public void ConfigureMembershipReboot(IServiceCollection services)
        {
            var confg = Configuration.GetSection("membershipReboot");
            services.Configure<SecuritySettings>(confg);
            services.AddSingleton(p => new MembershipRebootConfiguration<ApplicationUser>(p.GetService<IOptions<SecuritySettings>>().Value));
            services.AddScoped<UserAccountService<ApplicationUser>>();
            services.AddScoped<IUserAccountRepository<ApplicationUser>, RavenUserAccountRepository>();
            services.AddScoped<AuthenticationService<ApplicationUser>>(provider => 
                new AspNetAuthenticationService(
                    provider.GetService<UserAccountService<ApplicationUser>>(),
                    provider.GetService<IHttpContextAccessor>().HttpContext));
        }
    }

    public static class MembershipRebootAppBuilderExtensions
    {
        public static void UseMembershipReboot(this IApplicationBuilder app, CookieAuthenticationOptions cookieOptions)
        {
            app.UseCookieAuthentication(cookieOptions);
            app.UseCookieAuthentication(new CookieAuthenticationOptions
            {
                AutomaticAuthenticate = true,
                AutomaticChallenge = true,               
                AuthenticationScheme = MembershipRebootApplicationConstants.AuthenticationType,
                CookieSecure = cookieOptions.CookieSecure
            });
        }
    }

    /// <summary>
    /// Replacement for the MembershipRebootOwinConstants (BrockAllen.MembershipReboot.Owin)
    /// </summary>
    public class MembershipRebootApplicationConstants
    {
        internal const string OwinAuthenticationService = "MembershipReboot.AuthenticationService";

        public const string AuthenticationType = "MembershipReboot";
        public const string AuthenticationTwoFactorType = AuthenticationType + ".2fa";
    }    
}
