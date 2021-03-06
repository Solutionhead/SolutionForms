using System.ComponentModel.DataAnnotations;

namespace SolutionForms.Service.Providers.Returns
{
    public class DataSourceReturn
    {
        public string Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string DocumentName { get; set; }
    }
}