library(XML)
library(RCurl)

# get_papers
#
# Params:
#
# * query: search query
# * params: parameters for the search in JSON format
# * limit: number of search results to return
#
# It is expected that get_papers returns a list containing two data frames named "text" and "metadata"
#
# "text" contains the text for similarity analysis; it is expected to have two columns "id" and "content"
#
# "metadata" contains all metadata; its columns are expected to be named as follows:
# * "id": a unique ID, preferably the DOI
# * "title": the title
# * "authors": authors, preferably in the format "LASTNAME1, FIRSTNAME1;LASTNAME2, FIRSTNAME2"
# * "paper_abstract": the abstract
# * "published_in": name of the journal or venue
# * "year": publication date
# * "url": URL to the landing page
# * "readers": an indicator of the paper's popularity, e.g. number of readers, views, downloads etc.
# * "subject": keywords or classification, split by ;

get_papers <- function(query, params, limit=100, fields="title,id,counter_total_month,abstract,journal,publication_date,author,subject,article_type") {
  
  xml.url<-paste0("https://news.google.com/news?q=",URLencode(query),"&output=rss&num=100")
  rssdoc <- xmlParse(getURL(xml.url)) 
  rsstitle <- xpathSApply(rssdoc, '//item/title', xmlValue) 
  rssdesc <- xpathSApply(rssdoc, '//item/description', xmlValue) 
  rssdate <- xpathSApply(rssdoc, '//item/pubDate', xmlValue)
  
  metadata = data.frame(1, 1:length(rsstitle))
  metadata$title = rsstitle
  metadata$paper_abstract = rssdesc
  metadata$year = rssdate
  metadata$published_in = "Der Standard"
  metadata$subject = ""
  metadata$authors = ""
  metadata$url = xpathSApply(rssdoc, '//item/link', xmlValue)
  metadata$id = xpathSApply(rssdoc, '//item/guid', xmlValue)
  

  metadata$relevance = c(nrow(metadata):1)
  
  text = data.frame("id" = metadata$id)
  text$content = paste(metadata$title, metadata$paper_abstract, sep=" ")
  
  ret_val=list("metadata" = metadata, "text"=text)
  return(ret_val)
  
}