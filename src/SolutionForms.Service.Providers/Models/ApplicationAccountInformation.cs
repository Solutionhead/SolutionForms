namespace SolutionForms.Service.Providers.Models
{
    public class ApplicationAccountInformation
    {
        public ApplicationAccountInformation(string relativeLoginUrl, string relativeConfirmChangeEmailUrl, string relativeCancelVerificationUrl, string relativeConfirmPasswordResetUrl)
        {
            RelativeLoginUrl = relativeLoginUrl;
            RelativeConfirmChangeEmailUrl = relativeConfirmChangeEmailUrl;
            RelativeCancelVerificationUrl = relativeCancelVerificationUrl;
            RelativeConfirmPasswordResetUrl = relativeConfirmPasswordResetUrl;
        }

        public string ConfirmChangeEmailUrl { get; set; }
        public string CancelVerificationUrl { get; set; }
        public string LoginUrl { get; set; }
        public string RelativeCancelVerificationUrl { get; set; }
        public string RelativeConfirmChangeEmailUrl { get; set; }
        public string RelativeConfirmPasswordResetUrl { get; set; }
        public string RelativeLoginUrl { get; set; }
    }
}