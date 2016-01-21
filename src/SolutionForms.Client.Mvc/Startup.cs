using BrockAllen.MembershipReboot;
using Microsoft.AspNet.Authentication.Cookies;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Hosting;
using Microsoft.AspNet.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SolutionForms.Client.Mvc.Authorization;
using SolutionForms.Client.Mvc.Middleware.Multitenancy;
using SolutionForms.Client.Mvc.Services;
using SolutionForms.Service.Providers.Middleware;
using SolutionForms.Service.Providers.Models;

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
                builder.AddUserSecrets();
            }

            builder.AddEnvironmentVariables();
            Configuration = builder.Build();
        }

        public IConfigurationRoot Configuration { get; set; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // Add framework services.
            services.AddAuthentication();
            services.AddAuthorization();

            services.AddMvc();

            services.AddAuthorization(options =>
            {
                options.AddPolicy("AppOwner", policy => policy.RequireClaim("AppOwner"));
                options.AddTenantPolicy("AppAdmin");
                options.AddTenantPolicy("InviteUsers", "InviteUsers");
            });

            // Add application services.

            #region RavenDB and RavenUserStore

            ConfigureMembershipReboot(services);

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

            app.UseSolutionFormsProviders(new CookieAuthenticationOptions
            {

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
            
            services.ConfigureSolutionFormsProviders(new ApplicationAccountInformation(
                new PathString("/Account/Login/"),
                new PathString("/Account/Activate/"),
                new PathString("/Account/CancelAccountVerification/"),
                new PathString("/Account/ResetPassword/")
                ), new StmpDeliveryConfig
                {
                    Host = Configuration["smtp-host"],
                    Port = int.Parse(Configuration["smtp-port"]),
                    EnableSsl = bool.Parse(Configuration["smtp-enableSsl"]),
                    UserName = Configuration["smtp-username"],
                    Password = Configuration["smtp-password"],
                    FromEmailAddress = Configuration["smtp-fromEmail"]
                });
        }
    }
}
