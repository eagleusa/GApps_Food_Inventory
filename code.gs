const MIN_ITEM_ID = 101;
const ResponseTypes = {
  OK: "OK",
  ERROR: "ERROR"
};
function doGet() {
  const htmlService = HtmlService.createTemplateFromFile('index');
  const html = htmlService.evaluate().addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  return html;
}
function getDataSheet_(sheetName) {
  return SpreadsheetApp
    .openById("<Your sheet Id>")      // example is "1d3xA456ccWnNP6Z4i_..."
    .getSheetByName(sheetName);
}
function getSheetNames() {
  var out = new Array()
  var sheets = SpreadsheetApp
    .openById("<Your sheet Id>")      // example is "1d3xA456ccWnNP6Z4i_..."
    .getSheets();
  for (var i = 0; i < sheets.length; i++) out.push([sheets[i].getName()])
  return out
}
function addItem(itemToSave) {
  let responseMsg = "";
  let inventorySheet = getDataSheet_(itemToSave.location);

  // get today's date
  //let formattedDate = Utilities.formatDate(new Date(), "GMT-5", "M/d/yyyy");

  // calculate a new ID
  let newID = getFirstAvailableID();

  if (newID < MIN_ITEM_ID) {
    console.log('something went wrong');
    return null;
  }
  responseMsg = "Item " + newID + " added";

  let date1 = Utilities.formatDate(new Date(itemToSave.addedDate), "GMT-5", "M/d/yyyy");
  let date2 = Utilities.formatDate(new Date(itemToSave.expireDate), "GMT-5", "M/d/yyyy");
  inventorySheet.appendRow([newID, itemToSave.desc, itemToSave.qty, date1, date2]);

  // find that last row so we can add the age formula
  let lastRow = inventorySheet.getLastRow();
  let lastColumn = inventorySheet.getLastColumn();
  let lastCell = inventorySheet.getRange(lastRow, lastColumn);

  lastCell.setValue("=R[0]C[-1]-TODAY()");

  console.log(responseMsg);
  return responseMsg;
}
function getFirstAvailableID() {
  let minId = MIN_ITEM_ID;

  let allSheets = getSheetNames();
  for (let sh = 0; sh < allSheets.length; sh++) {
    console.log(allSheets[sh]);
    let inventorySheet = getDataSheet_(allSheets[sh]);
    let allIds = inventorySheet.getRange(2, 1, inventorySheet.getLastRow()).getValues().flat();
    allIds.sort(function(a, b){return a - b});
    let lowest = allIds[1];
    let hightest = allIds[allIds.length-1]
    let available = false;
    for (let ids = lowest; ids < hightest + 1 || !available; ids++) {
      available = !allIds.includes(ids);
      if (available == true) {
        minId = ids;
      }
    }
  }
  return minId;
}
function confirmRemoval(itemToRemove) {
  let responseMsg = "ID Not found for removal";
  let inventorySheet = getDataSheet_(itemToRemove.removeLocation);
  let lastRow = inventorySheet.getLastRow();

  for (let i = lastRow; i > 0; i--) {
    let itemId = inventorySheet.getRange(i, 1);
    let itemIdValue = itemId.getValue();
    if (itemIdValue == itemToRemove.removeItemNo) {
      let descVal = inventorySheet.getRange(i, 2);
      let descValue = descVal.getValue();
      let addedVal = inventorySheet.getRange(i, 4);
      let addedValue = addedVal.getValue();
      let expVal = inventorySheet.getRange(i, 5);
      let expValue = expVal.getValue();
      let ageVal = inventorySheet.getRange(i, 6);
      let ageValue = ageVal.getValue();
      responseMsg = 'Confirm deleteion of Item #' + itemIdValue + ': ' + descValue + ' Added on: ' + addedValue + ' Expires on: ' + expValue + ' Age (days): ' + ageValue;
    }
  }
  return responseMsg;
}
function removeItem(itemToRemove) {
  let responseMsg = "";
  let inventorySheet = getDataSheet_(itemToRemove.removeLocation);
  let lastRow = inventorySheet.getLastRow();
  let deleted = false;

  for (let i = lastRow; i > 0; i--) {
    let range = inventorySheet.getRange(i, 1);
    let data = range.getValue();
    if (data == itemToRemove.removeItemNo) {
      inventorySheet.deleteRow(i);
      deleted = true;
    }
  }

  if (deleted) {
    responseMsg = "Item " + itemToRemove.removeItemNo + " successfully removed";
  } else
    [
      responseMsg = "Item " + itemToRemove.removeItemNo + " NOT FOUND"
    ]
  return responseMsg;
}
