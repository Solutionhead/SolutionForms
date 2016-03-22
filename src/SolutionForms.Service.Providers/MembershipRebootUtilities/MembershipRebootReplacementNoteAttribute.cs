using System;

namespace SolutionForms.Service.Providers.MembershipRebootUtilities
{
    public class MembershipRebootReplacementNoteAttribute : MembershipRebootNoteAttribute
    {
        public MembershipRebootReplacementNoteAttribute(Type typeReplaced, string comments = null)
            : base(BuildNote(typeReplaced, comments)) { }

        private static string BuildNote(Type typeReplaced, string comments)
        {
            return $"Replacement type for MembershipReboot library class: {typeReplaced.Name} ({typeReplaced.FullName}). {comments}";
        }
    }
}