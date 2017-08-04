import { getDataByDataSourceName as fetchByEntity } from 'App/services/dataEntriesService';

export function fetch(args) {
  args = args || {};
  var entityName = ko.unwrap(args.entityName);
  return fetchByEntity(entityName, args.id, args);
}