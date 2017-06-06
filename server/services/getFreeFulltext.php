<?php

header('Content-type: application/json');

require_once dirname(__FILE__) . '/../classes/headstart/library/CommUtils.php';
require_once dirname(__FILE__) . '/../classes/headstart/library/toolkit.php';

require 'helper.php';

use headstart\library;

$INI_DIR = dirname(__FILE__) . "/../preprocessing/conf/";

$ini_array = library\Toolkit::loadIni($INI_DIR);

$service = library\CommUtils::getParameter($_GET, "service");
$urls = library\CommUtils::getParameter($_GET, "urls");

$link_list = preg_split("/;/", $urls);
$matches_pdf = array_filter($link_list, function($item) {
    return substr($item, -strlen(".pdf")) === ".pdf";
});
if (count($matches_pdf) != 0) {
    library\CommUtils::echoOrCallback(json_encode(array("status" => "success", "link" => array_values($matches_pdf)[0])), $_GET);
}

$doi = findDOIInURLs($link_list);
if (doi != false) {
    $link = getFulltextLinkFromDOI($doi);
    if ($link != false) {
        library\CommUtils::echoOrCallback(json_encode(array("status" => "success", "link" => $link)), $_GET);
        return $link;
    }
}

library\CommUtils::echoOrCallback(json_encode(array("status" => "error")), $_GET);

function findDOIInURLs($link_list) {

    $matches_doi = array_filter($link_list, function($item) {
        return strpos($item, "dx.doi.org");
    });
    if (count($matches_doi) != 0) {
        return array_values($matches_doi)[0];
    }

    $matches_doaj = array_filter($link_list, function($item) {
        return strpos($item, "doaj.org");
    });
    if (count($matches_doaj) != 0) {
        $doi = getDOIFromDOAJ(array_values($matches_doaj)[0]);
        if ($doi != false) {
            return $doi;
        } else {
            //Remove all DOAJ entries and all entries that are not URLs
            $link_list = array_filter($link_list, function($item) {
                return !strpos($item, "doaj.org");
            });
            $link_list = array_filter($link_list, function($item) {
                return filter_var($item, FILTER_VALIDATE_URL);
            });
        }
    }
    
    getFulltext(array_values($link_list)[0]);
}

//Example:
//https://doaj.org/api/v1/search/articles/id%3A90764de0bd144959b1d2727c91285eb3
function getDOIFromDOAJ($doaj_url) {
    $id = substr(strrchr($doaj_url, '/'), 1);
    $url = "https://doaj.org/api/v1/search/articles/id%3A" . $id;

    $response = file_get_contents($url);

    $array = json_decode($response, true);
    $doi = null;
    if ($array["total"] > 0) {
        $ids = $array["results"][0]["bibjson"]["identifier"];
        foreach ($ids as $link) {
            if ($link["type"] === "doi") {
                $doi = $link["id"];
            }
        }
    }
    return ($doi === null) ? (false) : ($doi);
}

function getFulltextLinkFromDOI($doi) {
    $url = " https://api.oadoi.org/" . $doi;

    $response = file_get_contents($url);

    $array = json_decode($response, true);
    $pdf_link = $array[0]["free_fulltext_url"];
    return ($pdf_link === "") ? (false) : ($pdf_link);
}

function getContentFromURL($link) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $link);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
    $response = curl_exec($ch);
    $redir = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    curl_close($ch);

    return array($response, $redir);
}

function getFulltext($link) {
    $response = getContentFromURL($link);
    
    $pdf_link = parsePDFLink($response[0], $response[1]);
    if($pdf_link !== false) {
        return $pdf_link;
    } else {
        return parseDOIAndGetFulltext($response[0]);
    }
}

function parseDOIAndGetFulltext($source) {
    $has_match = preg_match_all('/^10.\d{4,9}/[-._;()/:A-Z0-9]+$/i', $source, $matches);
    if ($has_match) {
        $fulltext_link = getFulltextLinkFromDOI($matches[0][1]);
        if($fulltext_link !== false) {
            return $fulltext_link;
        } 
    }
    
    return false;
}

function parsePDFLink($source, $url) {
    $has_match = preg_match_all('/meta[\s]+content=["\']+([^"\']+)["\']+[\s]+name[\s]*=[\s]*["\']+citation_pdf_url["\']+/i', $source, $matches);
    if (!$has_match) {
        $has_match = preg_match_all('/meta[\s]+name[\s]*=[\s]*["\']+citation_pdf_url["\']+[\s]+content=["\']+([^"\']+)["\']+/i', $source, $matches);

        if (!$has_match) {
            $has_match = preg_match_all('/["\']?([^"\'\s>]+(?:\.pdf))["\']?/i', $source, $matches);
        }
    }

    if ($has_match) {
        $best_match = $matches[1][0];
        if (!startsWith($best_match, "http://") && !startsWith($best_match, "https://") && !startsWith($best_match, "ftp://")) {
            return substr($url, 0, strrpos($url, '/')) . $best_match;
        } else {
            return $best_match;
        }
    } else {
        return false;
    }
}

function startsWith($haystack, $needle) {
    $length = strlen($needle);
    return (substr($haystack, 0, $length) === $needle);
}
