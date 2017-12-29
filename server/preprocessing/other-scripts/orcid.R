library(rorcid)

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

  (res_raw <- works(orcid_id(query)))
  
  res <- res_raw$data
  
  res_length = length(res$`put-code`)

  metadata = data.frame(matrix(nrow=res_length))

  metadata$id = res$`put-code`
  metadata$title = check_metadata(res$`work-title.title.value`)
  #                     check_metadata(res$`work-title.subtitle.value`), sep=": ")
  metadata$paper_abstract = check_metadata(res$`short-description`)
  metadata$published_in = check_metadata(res$`journal-title.value`)
  metadata$year = check_metadata(res$`publication-date.year.value`)

  metadata$subject = rep("", res_length) 

  metadata$authors = rep("", res_length)

  metadata$link = check_metadata(res$url.value)
  metadata$oa_state = rep("0", res_length)
  metadata$url = res$url.value
  metadata$relevance = c(nrow(metadata):1)

  text = data.frame(matrix(nrow=res_length))
  text$id = metadata$id
  # Add all keywords, including classification to text
  text$content = paste(metadata$title, metadata$paper_abstract, metadata$published_in, metadata$authors, sep=" ")

  ret_val=list("metadata" = metadata, "text"=text)
  return(ret_val)

}

check_metadata <- function (field) {
  if(!is.null(field)) {
    return (ifelse(is.na(field), '', field))
  } else {
    return ('')
  }
}
