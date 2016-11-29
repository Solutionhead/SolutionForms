using System.Linq;
using Raven.Client.Indexes;
using SolutionForms.Data.Models;

namespace SolutionForms.Data.Indexes
{
    public class DataForms_Menu : AbstractIndexCreationTask<DataForm>
    {
        public DataForms_Menu()
        {
            Map = forms => from form in forms
                select new { form.Id, form.Title, form.LinkOnHomePage };
        }
    }
}