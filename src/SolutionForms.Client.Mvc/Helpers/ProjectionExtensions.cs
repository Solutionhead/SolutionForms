using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SolutionForms.Client.Mvc.Helpers
{
    public static class ProjectionExtensions
    {
        public static IMappingExpression Map<TSource>(this TSource source)
        {
            return new AutoMapperMappingExpression<TSource>(source);
        }

        public static IEnumerableProjectionExpression Map<TSource>(this IQueryable<TSource> source)
        {
            return new AutoMappingEnumerableProjectionExpression<TSource>(source);
        }
    }

    public class AutoMappingEnumerableProjectionExpression<TSource> : IEnumerableProjectionExpression
    {
        private readonly IEnumerable<TSource> _source;

        public AutoMappingEnumerableProjectionExpression(IEnumerable<TSource> source)
        {
            if(source == null) throw new ArgumentNullException("source");
            _source = source;
        }

        public IEnumerable<TResult> To<TResult>()
        {
            return Mapper.Map<IEnumerable<TSource>, IEnumerable<TResult>>(_source);
        }
    }

    public class AutoMapperMappingExpression<TSource> : IMappingExpression
    {
        private readonly TSource _source;

        public AutoMapperMappingExpression(TSource source)
        {
            _source = source;
        }

        public TResult To<TResult>()
        {
            return Mapper.Map<TSource, TResult>(_source);
        }
    }

    public class AutoMappingEnumeratedQueryableProjectionExpression<TSource> : IEnumerableProjectionExpression
    {
        private readonly IQueryable<TSource> _source;

        public AutoMappingEnumeratedQueryableProjectionExpression(IQueryable<TSource> source)
        {
            if(source == null) throw new ArgumentNullException("source");
            _source = source;
        }

        public IEnumerable<TResult> To<TResult>()
        {
            return Mapper.Map<IQueryable<TSource>, IEnumerable<TResult>>(_source);
        }
    }

    public interface IMappingExpression
    {
        TResult To<TResult>();
    }

    public interface IEnumerableProjectionExpression
    {
        IEnumerable<TResult> To<TResult>();
    }
}
