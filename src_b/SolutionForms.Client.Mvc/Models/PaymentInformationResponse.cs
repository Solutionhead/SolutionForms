namespace SolutionForms.Client.Mvc.Models
{
    public class PaymentInformationResponse
    {
        public string Email { get; set; }

        public string Name { get; set; }
        public string Brand { get; set; }
        public string Last4 { get; set; }

        public string ExpirationMonth { get; set; }
        public string ExpirationYear { get; set; }
        public string Country { get; set; }
        public string CvcCheck { get; set; }

        public string AddressCity { get; set; }
        public string AddressCountry { get; set; }
        public string AddressLine1 { get; set; }
        public string AddressLine1Check { get; set; }
        public string AddressLine2 { get; set; }
        public string AddressState { get; set; }
        public string AddressZip { get; set; }
        public string AddressZipCheck { get; set; }
    }
}