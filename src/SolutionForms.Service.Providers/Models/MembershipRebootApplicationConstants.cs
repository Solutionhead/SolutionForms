namespace SolutionForms.Service.Providers.Models
{
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