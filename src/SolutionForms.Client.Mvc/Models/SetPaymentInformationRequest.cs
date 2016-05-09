namespace SolutionForms.Client.Mvc.Models
{
    public class SetPaymentInformationRequest
    {
        public string PaymentToken { get; set; }
        public string EmailAddress { get; set; }
    }
}