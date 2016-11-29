using BrockAllen.MembershipReboot;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Serialization;
using SolutionForms.Client.Mvc.Authorization;
using SolutionForms.Client.Mvc.Helpers;
using SolutionForms.Client.Mvc.Middleware.Multitenancy;
using SolutionForms.Client.Mvc.Services;
using SolutionForms.Service.Providers.Middleware;
using SolutionForms.Service.Providers.Models;
using Stripe;

namespace SolutionForms.Client.Mvc
{
    public class Startup
    {
        public Startup(IHostingEnvironment env)
        {
            // Set up configuration sources.
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json")
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true);

            if (env.IsDevelopment())
            {
                builder.AddUserSecrets();
            }

            builder.AddEnvironmentVariables();
            Configuration = builder.Build();

            AutoMapperConfig.Configure();
            StripeConfiguration.SetApiKey(Configuration["stripe:private_key"]);
        }

        public IConfigurationRoot Configuration { get; set; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // Add framework services.
            services.AddAuthentication(); 
            services.AddAuthorization();

            services.AddMvc(config =>
            {
                var policy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();
                config.Filters.Add(new AuthorizeFilter(policy));

#if RELEASE
                // this causes issues when running the app locally, currently there appears to be an isse VS 2015 debugging a website with SSL
                config.Filters.Add(new Microsoft.AspNetCore.Mvc.RequireHttpsAttribute());
#endif
            }).AddJsonOptions(opt => opt.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver());
            
            services.AddAuthorization(options =>
            {
                options.AddPolicy(AuthorizationPolicies.AppOwner, policy => policy.RequireClaim(AuthorizationPolicies.AppOwner));
                options.AddTenantPolicy(AuthorizationPolicies.AppAdmin);
                options.AddTenantPolicy(AuthorizationPolicies.InviteUsers, AuthorizationPolicies.InviteUsers);
            });

            services.AddSingleton(p =>
            {
                var pubKey = Configuration["stripe:pub_key"];
                return new StripeHelper
                {
                    PublishableApiKey = pubKey
                };
            });

            services.AddSingleton(p =>
            {
                var accessKey = Configuration["beta:accessKey"];
                return new BetaAccessHelper
                {
                    BetaAccessKey = accessKey
                };
            });

            ConfigureMembershipReboot(services);
            
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
                app.UseDeveloperExceptionPage();
                app.UseBrowserLink();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseStaticFiles();

            app.UseSolutionFormsProviders(new SolutionFormsProviderConfiguration
            {
                CookieAuthenticationOptions = new CookieAuthenticationOptions
                {
                    LoginPath = new PathString("/Account/Login"),
                    AutomaticAuthenticate = true,
                    AutomaticChallenge = true,
                },
                //ConnectionString = "Url=http://solutionforms.southcentralus.cloudapp.azure.com:8080;domain=solutionforms;user=solutionhead;password=XBf%hxTmr,6eX,Pt%tF6D"
                ConnectionString = Configuration["Data:Raven:ConnectionString"]
            });

            app.UseTenantResolver();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });
        }
        
        
        public void ConfigureMembershipReboot(IServiceCollection services)
        {
            var confg = Configuration.GetSection("membershipReboot");
            var smtp = Configuration.GetSection("smtp");
            services.Configure<SecuritySettings>(confg);

            var appConfig = new ApplicationAccountInformation(
                new PathString("/Account/Login/"),
                new PathString("/Account/Activate/"),
                new PathString("/Account/CancelAccountVerification/"),
                new PathString("/Account/ResetPassword/")
                );

            var smtpConfig = new StmpDeliveryConfig
            {
                Host = smtp["host"],
                Port = int.Parse(smtp["port"]),
                EnableSsl = bool.Parse(smtp["enableSsl"]),
                UserName = Configuration["smtp-username"],
                Password = Configuration["smtp-password"],
                FromEmailAddress = smtp["fromEmail"]
            };

            services.ConfigureSolutionFormsProviders(appConfig, smtpConfig);
        }
    }

    public class StripeHelper
    {
        public string PublishableApiKey { get; set; }
    }

    public class BetaAccessHelper
    {
        public string BetaAccessKey { get; set; }
    }
}
