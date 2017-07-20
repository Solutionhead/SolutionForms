export function parseCode(value) {
  value = value || '';
  var parts = value.split('+');
  if (parts.length != 3) { return; }

  var d = parts[0] + '';
  var year = Number(d.substring(0, 2));
  year = "20" + year;
  var dayOfYear = Number(d.substring(2));
  d = new Date(`${year}-01-01`);
  d.setDate(d.getDate() + dayOfYear);

  return {
    productionDate: d,
    fieldCode: parts[1],
    ticketNum: parts[2]
  };
}