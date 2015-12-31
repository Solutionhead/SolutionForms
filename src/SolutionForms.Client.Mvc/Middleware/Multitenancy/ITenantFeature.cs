namespace SolutionForms.Client.Mvc.Middleware.Multitenancy
{
    public interface ITenantFeature
    {
        Tenant Tenant { get; }
    }
}