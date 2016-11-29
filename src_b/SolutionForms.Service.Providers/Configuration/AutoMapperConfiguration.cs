using System.Collections.Generic;
using AutoMapper;
using Newtonsoft.Json;
using SolutionForms.Data.Models;
using SolutionForms.Service.Providers.Parameters;
using SolutionForms.Service.Providers.Returns;

namespace SolutionForms.Service.Providers.Configuration
{
    internal static class AutoMapperConfiguration
    {
        internal static void ConfigureMappings()
        {
            Mapper.CreateMap<DataSource, DataSourceReturn>();
            Mapper.CreateMap<DataForm, CreateDataFormReturn>()
                .ForMember(m => m.DataSource, opt => opt.Ignore());
            Mapper.CreateMap<DataForm, DataFormReturn>()
                .ForMember(m => m.DataSource, opt => opt.Ignore());

            Mapper.CreateMap<FieldConfiguration, FieldConfigurationResponse>()
                .ForMember(m => m.Settings,
                    opt => opt.ResolveUsing(m => JsonConvert.DeserializeObject<IDictionary<string, object>>(m.Settings)));
            
            Mapper.CreateMap<SetFieldConfigurationRequest, FieldConfiguration>()
                .ForMember(m => m.Settings,
                    opt => opt.ResolveUsing(m => JsonConvert.SerializeObject(m.Settings)));

            Mapper.AssertConfigurationIsValid();
        }
    }
}
