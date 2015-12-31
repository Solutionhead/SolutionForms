namespace SolutionForms.Client.Mvc.Middleware.Multitenancy
{
    public class TenantFeature : ITenantFeature
    {
        public Tenant Tenant { get; }

        public TenantFeature(Tenant tenant)
        {
            Tenant = tenant;
        }
    }
}