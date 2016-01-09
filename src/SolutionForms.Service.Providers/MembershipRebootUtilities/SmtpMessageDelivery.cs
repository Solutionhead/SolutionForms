using System;
using System.Net;
using System.Net.Mail;
using BrockAllen.MembershipReboot;
using SolutionForms.Service.Providers.Models;

namespace SolutionForms.Service.Providers.MembershipRebootUtilities
{
    public class MembershipRebootNoteAttribute : Attribute
    {
        public MembershipRebootNoteAttribute(string note)
        {
            
        }
    }

    public class MembershipRebootReplacementNoteAttribute : MembershipRebootNoteAttribute
    {
        public MembershipRebootReplacementNoteAttribute(Type typeReplaced, string comments = null)
            : base(BuildNote(typeReplaced, comments)) { }

        private static string BuildNote(Type typeReplaced, string comments)
        {
            return $"Replacement type for MembershipReboot library class: {typeReplaced.Name} ({typeReplaced.FullName}). {comments}";
        }
    }

    [MembershipRebootReplacementNote(typeof(BrockAllen.MembershipReboot.SmtpMessageDelivery), "Dependency of ConfigurationManager for retrieval of SmtpSection values")]
    public class SmtpMessageDelivery : IMessageDelivery
    {
        private readonly StmpDeliveryConfig _config;
        private readonly bool _sendAsHtml;

        public SmtpMessageDelivery(StmpDeliveryConfig config, bool sendAsHtml = false)
        {
            _config = config;
            _sendAsHtml = sendAsHtml;
        }

        public void Send(Message msg)
        {
            Tracing.Information("[SmtpMessageDelivery.Send] sending mail to " + msg.To);
            if (string.IsNullOrWhiteSpace(msg.From))
            {
                msg.From = _config.FromEmailAddress;
            }
            using (var smtpClient = new SmtpClient())
            {
                smtpClient.Timeout = 5000;
                try
                {
                    var message = new MailMessage(msg.From, msg.To, msg.Subject, msg.Body)
                    {
                        IsBodyHtml = _sendAsHtml
                    };
                    smtpClient.UseDefaultCredentials = false;
                    smtpClient.Host = _config.Host;
                    smtpClient.Credentials = new NetworkCredential(_config.UserName, _config.Password);
                    smtpClient.Port = _config.Port;
                    smtpClient.EnableSsl = _config.EnableSsl;

                    smtpClient.Send(message);
                }
                catch (SmtpException ex)
                {
                    Tracing.Error("[SmtpMessageDelivery.Send] SmtpException: " + ex.Message);
                }
                catch (Exception ex)
                {
                    Tracing.Error("[SmtpMessageDelivery.Send] Exception: " + ex.Message);
                }
            }
        }
    }
}