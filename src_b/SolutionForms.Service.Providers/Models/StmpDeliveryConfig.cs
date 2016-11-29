namespace SolutionForms.Service.Providers.Models
{
    public class StmpDeliveryConfig
    {
        public string Host { get; set; }
        public int Port { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
        public bool EnableSsl { get; set; }
        public string FromEmailAddress { get; set; }
    }
}