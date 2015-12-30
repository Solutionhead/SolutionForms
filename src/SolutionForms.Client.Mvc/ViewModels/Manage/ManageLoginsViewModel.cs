using System.Collections.Generic;
using Microsoft.AspNet.Http.Authentication;
using SolutionForms.Client.Mvc.Models;

namespace SolutionForms.Client.Mvc.ViewModels.Manage
{
    public class ManageLoginsViewModel
    {
        public IList<UserLoginInfo> CurrentLogins { get; set; }

        public IList<AuthenticationDescription> OtherLogins { get; set; }
    }
}
