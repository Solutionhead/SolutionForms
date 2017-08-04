export function getAllRecordsFromDataSourceAsync(entityName, options) {
  if (typeof options === 'number') {
      options = {
          queryPageSize: options
      };
  }

  const queryOptions = $.extend({}, defaultOptions, options);

  const queryFn = function fetchPage(skip, take) {
    return fetchDataAsync(
      buildApiRouteForEntityName(entityName, options),
      {
        skip: skip,
        take: take
      });
  }

  return fetchAllDataPagesAsync(queryFn, queryOptions.queryPageSize);
}


export function getDataByDataSourceName(dataSourceName, id, options) {
  if (arguments.length === 2) {
    options = id;
    id = null;
  }

  options = $.extend({}, defaultOptions, options);
  return fetchDataAsync(buildApiRouteForEntityName(dataSourceName, id, options), options);
}
export function getDataByIndexName(indexName, options) {
  options = $.extend({}, defaultOptions, options);
  return fetchDataAsync(buildApiRouteForIndexName(indexName, options), options);
}

export function createAsync(entityName, values, awaitIndexing) {
  const opts = {};
  if ( awaitIndexing === true ) {
    opts.awaitIndexing = true;
  }
  const url = buildApiRouteForEntityName( entityName, null, opts );

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

function buildApiRouteForEntityName(entityName, id, options) {
  return `/api/d/${ entityName }/${ id || '' }${ buildQueryStringOptions( options ) }`;
}
function buildApiRouteForIndexName(indexName, options) {
  return `/api/d/index${buildQueryStringOptions(options, `indexName=${indexName}`)}`;
}


function buildQueryStringOptions(options, initialQS) {
  if (options == null) return '';

  var qs = initialQS || '';
  appendQueryStringParamIfExists('filter', '$filter');
  appendQueryStringParamIfExists('$filter', '$filter');

  appendQueryStringParamIfExists('skip', '$skip');
  appendQueryStringParamIfExists('$skip', '$skip');

  appendQueryStringParamIfExists('top', '$top');
  appendQueryStringParamIfExists('$top', '$top');

  appendQueryStringParamIfExists('awaitIndexing', 'awaitIndexing');

  appendQueryStringParamIfExists('transformWith', '$transformWith');
  appendQueryStringParamIfExists('$transformWith', '$transformWith');

  return qs.length ? `?${qs}` : '';

  function appendQueryStringParamIfExists(memberName, paramName) {
    if (options[memberName] != null) {
      qs = appendQueryStringParam(qs, paramName, options[memberName]);
    }
  }
}

function appendQueryStringParam(qs, key, val) {
  qs = qs || '';
  if (qs.length) {
    qs += '&';
  }
  qs += `${ key }=${ val }`;
  return qs;
}

function fetchDataAsync(apiRoute, options) {
  var opts = $.extend({}, defaultOptions, options);
  return $.ajax(`${ apiRoute }`, opts);
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
  queryPageSize: 100,
  cache: false
}