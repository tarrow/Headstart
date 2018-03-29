$("#search-projects-form").validate({
  debug: true,
  submitHandler: function (form, event) {
    event.preventDefault()
    var urlEncKW = encodeURIComponent($("#ipt-keywords").val())
    $.get('http://api.openaire.eu/search/projects?hasECFunding=true&format=json&size=50&keywords=' + urlEncKW, handleResponse)
  }
})

var handleResponse = function (response) {
  var dataSet = response.response.results.result.map(rawResponseMapper)
  $('#tbl-project-search-results').show()
  var table = $('#tbl-project-search-results').DataTable({
    data: dataSet,
    searching: false,
    lengthChange: false,
    ordering: false,
    "columnDefs": [ {
      "targets": -1,
      "data": null,
      "defaultContent": "<button>Make Map</button>"
    },
    {
      targets: 10,
      visible: false
    } ]
  })
  $('#tbl-project-search-results tbody').on( 'click', 'button', function () {
    var data = table.row( $(this).parents('tr') ).data();
    var submitObj = {
      'project_id': data[0],
      'funder': data[8],
      'acronym': data[1],
      'title': data[2],
      "funding_tree": data[11],
      "call_id": data[5],
      "start_date": data[3],
      "end_date": data[4],
      "oa_mandate": data[9],
      "special_clause": data[6],
      "organisations": data[10],
      "openaire_link": data[12]
    }
    doSubmit($.param(submitObj))
} )
  // TODO: Handle repeated searches
}

var rawResponseMapper = function (result) {
  var projectMetadata = deepGet(result, ['metadata', 'oaf:entity', 'oaf:project'])
  return [
    deepGet(projectMetadata, ['code', '$'], ''),
    deepGet(projectMetadata, ['acronym', '$'], ''),
    deepGet(projectMetadata, ['title', '$'], ''),
    deepGet(projectMetadata, ['startdate', '$'], ''),
    deepGet(projectMetadata, ['enddate', '$'], ''),
    deepGet(projectMetadata, ['callidentifier', '$'], ''),
    deepGet(projectMetadata, ['ecsc39', '$'], ''),
    getFundingLevels(result).slice(-1)[0],
    deepGet(projectMetadata, ['fundingtree', 'funder', 'shortname', '$'], ''),
    deepGet(projectMetadata, ['oamandatepublications', '$'], ''),
    getOrganisations(projectMetadata),
    getFundingLevels(result),
    deepGet(projectMetadata, ['websiteurl', '$'], ''),
    '' // Blank column for button
  ]
}

$(document).ready(function () {
  $('#tbl-project-search-results').hide()
})

// Standard deep get function adapted from https://github.com/joshuacc/drabs
function deepGet (obj, props, defaultValue) {
  if (obj === undefined || obj === null) {
      return defaultValue;
  }
  if (props.length === 0) {
      return obj;
  }
  var foundSoFar = obj[props[0]];
  var remainingProps = props.slice(1);
  return deepGet(foundSoFar, remainingProps, defaultValue);
}

function getFunding(foo) {
  return 'TODO'
}

function getOrganisations(project) {
  return deepGet(project, ['rels', 'rel']).map(function (entry) {
    return {
      name: deepGet(entry, ['legalshortname', '$']),
      url: deepGet(entry, ['websiteurl', '$'])
    }
  })
}

function getFundingLevels (result) {
  var funding_tree = deepGet(result, ['metadata', 'oaf:entity', 'oaf:project', 'fundingtree'], [])
  return digFundingTree(funding_tree, [])
}

// call this recursively until we work our way down to funding_level_0
function digFundingTree (rootTree, fundingNames) {
  var keys = (Object.getOwnPropertyNames(rootTree))
  var r = /^funding_level_[0-9]+$/
  var nestedTree = keys.find(r.test.bind(r))
  fundingNames.push(deepGet(rootTree, [nestedTree, 'name', '$']))
  console.log(fundingNames)
  console.log(nestedTree)
  if (nestedTree === 'funding_level_0') {
    return fundingNames
  } else {
    return digFundingTree(rootTree[nestedTree]['parent'], fundingNames)
  }
}