using AspNet.Identity.RavenDB.Stores;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Hosting;
using Microsoft.AspNet.Http;
using Microsoft.AspNet.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Raven.Client;
using SolutionForms.Client.Mvc.Entities;
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
            //services.AddIdentity<ApplicationUser, IdentityRole>()
            //    .AddEntityFrameworkStores<ApplicationDbContext>()
            //    .AddDefaultTokenProviders();

            services.AddMvc();

            // Add application services.

            #region RavenDB and RavenUserStore
            
            services.AddSingleton(provider => RavenContext.DocumentStore);
            services.AddScoped<UserManager<ApplicationUser>>();
            services.AddScoped(provider => provider.GetService<IDocumentStore>().OpenAsyncSession());
            services.AddScoped<IUserStore<ApplicationUser>>(provider =>
            {
                var documentSession = provider.GetService<IAsyncDocumentSession>();
                documentSession.Advanced.UseOptimisticConcurrency = true;
                return new RavenUserStore<ApplicationUser>(documentSession, false);
            });

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

            app.UseCookieAuthentication(c =>
            {
                c.LoginPath = new PathString("/Account/Login");
                c.AuthenticationScheme = DefaultAuthenticationTypes.ApplicationCookie;
                c.AutomaticAuthenticate = true;
                c.AutomaticChallenge = true;
            });
            
            // To configure external authentication please see http://go.microsoft.com/fwlink/?LinkID=532715

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });
        }

        // Entry point for the application.
        public static void Main(string[] args) => WebApplication.Run<Startup>(args);
    }
}
