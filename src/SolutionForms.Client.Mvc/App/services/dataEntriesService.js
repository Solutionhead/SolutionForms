export function getAllRecordsFromDataSourceAsync(entityName, options) {
  if (typeof options === 'number') {
      options = {
          queryPageSize: options
      };
  }

  const queryOptions = $.extend({}, defaultOptions, options);

  const queryFn = function fetchPage(skip, take) {
    return fetchDataAsync(buildApiRouteForEntityName(entityName, options), skip, take);
  }

  return fetchAllDataPagesAsync(queryFn, queryOptions.queryPageSize);
}

export function getDataByDataSourceName(dataSourceName, options) {
  options = $.extend({}, defaultOptions, options);

  //todo: enable retrieval from local cached data
  return fetchDataAsync(buildApiRouteForEntityName(dataSourceName, options));
}

export function createAsync(entityName, values, awaitIndexing) {
  const opts = {};
  if ( awaitIndexing === true ) {
    opts.awaitIndexing = true;
  }
  const url = buildApiRouteForEntityName( entityName, opts );

  return $.ajax( url, {
    data: typeof values === "object" ? ko.toJSON(values) : values,
    dataType: 'json',
    type: 'POST',
    contentType: 'application/json'
  });
}

export function deleteAsync(entityName, awaitIndexing) {
  const opts = {};
  if ( awaitIndexing === true ) {
    opts.awaitIndexing = true;
  }
  const url = buildApiRouteForEntityName( entityName );

  return $.ajax( url, {
    dataType: 'json',
    type: 'DELETE',
    contentType: 'application/json'
  });
}

function buildApiRouteForEntityName(entityName, options) {
  return `/api/d/${ entityName }${ buildQueryStringOptions( options ) }`;
}

function buildQueryStringOptions(options) {
  if (options == null) return '';

  var qs = '';
  if ( options.filter ) {
    qs = appendQueryStringParam(qs, '$filter', options.filter);
  }
  if ( options.skipCount ) {
    qs = appendQueryStringParam(qs, '$skip', options.skipCount);
  }
  if ( options.queryPageSize ) {
    qs = appendQueryStringParam(qs, '$top', options.queryPageSize);
  }
  if ( options.transformWith ) {
    qs = appendQueryStringParam(qs, '$transformWith', options.transformWith);
  }
  if ( options.awaitIndexing ) {
    qs = appendQueryStringParam( qs, 'awaitIndexing', options.awaitIndexing );
  }

  return qs.length ? `?${ qs }` : '';
}

function appendQueryStringParam(qs, key, val) {
  qs = qs || '';
  if (qs.length) {
    qs += '&';
  }
  qs += `${ key }=${ val }`;
  return qs;
}

function fetchDataAsync(apiRoute, skip, take) {
  skip = skip || defaultOptions.skipCount;
  take = take || defaultOptions.queryPageSize;
  return $.ajax(`${ apiRoute }${ apiRoute.indexOf('?') === -1 ? '?' : '&' }$skip=${ skip }&$top=${ take }`, {
      cache: false
  });
}

function fetchAllDataPagesAsync(queryFn, pageSize, skipCount, dfd, resultContainer) {
  pageSize = pageSize || defaultOptions.queryPageSize;
  dfd = dfd || $.Deferred();
  skipCount = skipCount || 0;
  resultContainer = resultContainer || [];

  queryFn(skipCount, pageSize)
    .done((data) => {
      ko.utils.arrayPushAll(resultContainer, data);
      if (data.length < pageSize) {
        dfd.resolve(resultContainer);
        return;
      }

      fetchAllDataPagesAsync(queryFn, pageSize, skipCount + data.length, dfd, resultContainer);
    })
  .fail(() => { dfd.reject.apply(this, arguments); });
  
  return dfd;
}

var defaultOptions = {
  skipCount: 0,
  queryPageSize: 100
}