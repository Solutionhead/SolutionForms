export function getAllRecordsFromDataSourceAsync(entityName, pageSize) {
  pageSize = pageSize || defaultOptions.queryPageSize;

  const queryFn = function fetchPage(skip, take) {
    return fetchDataAsync(buildApiRouteForEntityName(entityName), skip, take);
  }

  return fetchAllDataPagesAsync(queryFn, pageSize);
}

export function getDataByDataSourceName(dataSourceName, options) {
  options = $.extend({}, defaultOptions, options);

  //todo: enable retrieval from local cached data
  return fetchDataAsync(buildApiRouteForEntityName(dataSourceName), options.skipCount, options.queryPageSize);
}

function buildApiRouteForEntityName(entityName) {
  return `/api/d/${ entityName }`;
}

function fetchDataAsync(apiRoute, skip, take) {
  skip = skip || defaultOptions.skipCount;
  take = take || defaultOptions.queryPageSize;
  return $.ajax(`${ apiRoute }${ apiRoute.indexOf('?') === -1 ? '?' : '&' }$skip=${ skip }&$top=${ take }`);
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