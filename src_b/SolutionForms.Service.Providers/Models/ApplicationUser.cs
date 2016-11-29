using System.Collections.Generic;
using BrockAllen.MembershipReboot;
using BrockAllen.MembershipReboot.Hierarchical;
using Raven.Imports.Newtonsoft.Json;

namespace SolutionForms.Service.Providers.Models
{
    public sealed class ApplicationUser : HierarchicalUserAccount
    {
        /// <summary>
        /// RavenDb generated identity value.
        /// </summary>
        public string Id { get; set; }

        [JsonIgnore]
        public override IEnumerable<UserClaim> Claims => base.Claims;
        [JsonIgnore]
        public override IEnumerable<LinkedAccount> LinkedAccounts => base.LinkedAccounts;
        [JsonIgnore]
        public override IEnumerable<LinkedAccountClaim> LinkedAccountClaims => base.LinkedAccountClaims;
        [JsonIgnore]
        public override IEnumerable<UserCertificate> Certificates => base.Certificates;
        [JsonIgnore]
        public override IEnumerable<TwoFactorAuthToken> TwoFactorAuthTokens => base.TwoFactorAuthTokens;
        [JsonIgnore]
        public override IEnumerable<PasswordResetSecret> PasswordResetSecrets => base.PasswordResetSecrets;
    }
}