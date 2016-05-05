namespace SolutionForms.Service.Providers.Models
{
    public class SetPaymentInformationParameters
    {
        public string Number { get; set; }
        public string ExpirationYear { get; set; }
        public string ExpirationMonth { get; set; }
        public string AddressCountry { get; set; }
        public string AddressLine1 { get; set; }
        public string AddressLine2 { get; set; }
        public string AddressCity { get; set; }
        public string AddressState { get; set; }
        public string AddressZip { get; set; }
        public string Name { get; set; }
        public string Cvc { get; set; }
    }
}