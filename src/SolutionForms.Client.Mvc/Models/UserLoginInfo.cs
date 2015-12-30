namespace SolutionForms.Client.Mvc.Models
{
    public class UserLoginInfo
    {
        /// <summary>
        /// Provider for the linked login, i.e. Facebook, Google, etc.
        /// </summary>
        public string LoginProvider { get; set; }

        /// <summary>
        /// User specific key for the login provider
        /// </summary>
        public string ProviderKey { get; set; }

        public UserLoginInfo(string loginProvider, string providerKey)
        {
            this.LoginProvider = loginProvider;
            this.ProviderKey = providerKey;
        }
    }
}