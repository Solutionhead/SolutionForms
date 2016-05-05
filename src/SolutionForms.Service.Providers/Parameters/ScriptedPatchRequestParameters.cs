using System.Collections.Generic;
using Raven.Abstractions.Data;

namespace SolutionForms.Service.Providers.Parameters
{
    public class ScriptedPatchRequestParameters
    {
        public string Script { get; set; }
        
        public Dictionary<string, object> Values { get; set; }

        internal ScriptedPatchRequest ToScriptedPatchRequest()
        {
            return new ScriptedPatchRequest
            {
                Script = Script,
                Values = Values ?? new Dictionary<string,object>()
            };
        } 
    }
}