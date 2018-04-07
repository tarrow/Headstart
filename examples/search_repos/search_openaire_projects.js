$("#search-projects-form").validate({
  debug: true,
  submitHandler: function (form, event) {
    event.preventDefault()
    var urlEncKW = encodeURIComponent($('#ipt-keywords').val())
    setupPaginator(urlEncKW)
  }
})

function simpleTemplating (data) {
  var html = $('<ul>')
  $.each(data, function (index, item) {
    html.append($('<li>'))
    .html($('<a>')
    .attr('class', 'project-title')
    .attr('href', '#')
    .text('Title is: ' + item.title).on('click', function () {
      doSubmit($.param(item))
    }))
    .append('<div class="project-code">Code is: ' + item.project_id +
      '</div><div class="project-funders">Funder Tree is: ' + item.funding_tree.join(', ') +
      '</div><div class="project-dates">Date range is: ' + item.start_date + item.end_date +
      '</div><div class="project-organisations">Orgs is: ' + item.organisations.slice(0,2) + '</div>')
  })
  return html
}

var setupPaginator = function (searchTerm) {
  var paginator = $('#viper-search-pager')
  paginator.pagination({
    dataSource: 'http://api.openaire.eu/search/projects?format=json&hasECFunding=true&keywords=' + searchTerm,
    callback: function (data, pagination) {
      console.log(pagination)
      var header = '<div id="project_count">Projects: ' + pagination.totalNumber + ' results</div>'
      var html = simpleTemplating(data)
      $('#viper-search-results').html(header)
      .append(html)
    },
    formatAjaxError: function (jqXHR, textStatus, errorThrown) { console.log(errorThrown) },
    alias: {
      pageSize: 'size',
      pageNumber: 'page'
    },
    ajaxDataType: 'get',
    ajax: {
      cache: true, //required or JQuery's cache busting causes OpenAire API to throw a stacktrace
      beforeSend: function () {
        var html = '<div>Loading Results from OpenAire...</div>' +
        '<div class="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>'
        $('#viper-search-results').html(html)
      }
    },
    locator: 'response.results.result',
    className: 'paginationjs-theme-blue',
    formatResult: handleResponse,
    totalNumberLocator: function (response) {
      return response.response.header.total.$
    },
  })
}

var handleResponse = function (response) {
  return response.map(rawResponseMapper)
}

var rawResponseMapper = function (result) {
  var projectMetadata = deepGet(result, ['metadata', 'oaf:entity', 'oaf:project'])
  return {
    project_id: deepGet(projectMetadata, ['code', '$'], ''),
    acronym: deepGet(projectMetadata, ['acronym', '$'], ''),
    title: deepGet(projectMetadata, ['title', '$'], ''),
    start_date: deepGet(projectMetadata, ['startdate', '$'], ''),
    end_date: deepGet(projectMetadata, ['enddate', '$'], ''),
    call_id: deepGet(projectMetadata, ['callidentifier', '$'], ''),
    special_clause: deepGet(projectMetadata, ['ecsc39', '$'], ''),
    funding_stream: getFundingLevels(result).slice(-1)[0],
    funder: deepGet(projectMetadata, ['fundingtree', 'funder', 'shortname', '$'], ''),
    oa_mandate: deepGet(projectMetadata, ['oamandatepublications', '$'], ''),
    organisations: getOrganisations(projectMetadata),
    funding_tree: getFundingLevels(result),
    openaire_link: deepGet(projectMetadata, ['websiteurl', '$'], ''),
    obj_id: deepGet(result, ['header', 'dri:objIdentifier', '$'])
  }
}

$(document).ready(function () {
  $('#tbl-project-search-results').hide()
  $('#oa-searching').hide()
  $('#okm-making').hide()
  $('.lds-spinner').hide()
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

function getOrganisations(project) {
  var rel = deepGet(project, ['rels', 'rel'], [])
  if (Array.isArray(rel)) {
    return rel.map(function (entry) {
      return {
        name: deepGet(entry, ['legalshortname', '$']),
        url: deepGet(entry, ['websiteurl', '$'])
      }
    })
  } else {
    return [{
      name: deepGet(rel, ['legalshortname', '$']),
      url: deepGet(rel, ['websiteurl', '$'])
    }]
  }
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
  if (nestedTree === 'funding_level_0') {
    return fundingNames
  } else {
    try {
      return digFundingTree(rootTree[nestedTree]['parent'], fundingNames)
    }
    catch (e) {
      console.log(rootTree)
    }
  }
}
