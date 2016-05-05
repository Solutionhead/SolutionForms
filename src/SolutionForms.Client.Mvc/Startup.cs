﻿using System;
using System.Security.Permissions;
using BrockAllen.MembershipReboot;
using Microsoft.AspNet.Authentication.Cookies;
using Microsoft.AspNet.Authorization;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Hosting;
using Microsoft.AspNet.Http;
using Microsoft.AspNet.Mvc;
using Microsoft.AspNet.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Serialization;
using SolutionForms.Client.Mvc.Authorization;
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
                .AddJsonFile("appsettings.json")
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true);

            if (env.IsDevelopment())
            {
                builder.AddUserSecrets();
            }

            builder.AddEnvironmentVariables();
            Configuration = builder.Build();

            if(AutoMapperConfig.Configuration == null)
            {
                throw new Exception("AutoMapper not configured.");
            }
            StripeConfiguration.SetApiKey(Configuration["stripe-api-key"]);
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
                config.Filters.Add(new RequireHttpsAttribute());
#endif
            }).AddJsonOptions(opt => opt.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver());
            
            
            services.AddAuthorization(options =>
            {
                options.AddPolicy("AppOwner", policy => policy.RequireClaim("AppOwner"));
                options.AddTenantPolicy("AppAdmin");
                options.AddTenantPolicy("InviteUsers", "InviteUsers");
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

            app.UseSolutionFormsProviders(new SolutionFormsProviderConfiguration
            {
                CookieAuthenticationOptions = new CookieAuthenticationOptions
                {

                    LoginPath = new PathString("/Account/Login"),
                    AutomaticAuthenticate = true,
                    AutomaticChallenge = true,
                },
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

        // Entry point for the application.
        public static void Main(string[] args) => WebApplication.Run<Startup>(args);
        
        public void ConfigureMembershipReboot(IServiceCollection services)
        {
            var confg = Configuration.GetSection("membershipReboot");
            var smtp = Configuration.GetSection("smtp");
            services.Configure<SecuritySettings>(confg);
            
            services.ConfigureSolutionFormsProviders(new ApplicationAccountInformation(
                new PathString("/Account/Login/"),
                new PathString("/Account/Activate/"),
                new PathString("/Account/CancelAccountVerification/"),
                new PathString("/Account/ResetPassword/")
                ), new StmpDeliveryConfig
                {
                    Host = smtp["host"],
                    Port = int.Parse(smtp["port"]),
                    EnableSsl = bool.Parse(smtp["enableSsl"]),
                    UserName = Configuration["smtp-username"],
                    Password = Configuration["smtp-password"],
                    FromEmailAddress = smtp["fromEmail"]
                });
        }
    }
}
