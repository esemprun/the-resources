const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const path = require('path');
const cp = require('child_process');
const resourceTemplate = require('./resource-template');
const getSiteContent = require('./get-site-content');
const airtableTools = require('../airtable/airtable-tools');

module.exports = async function (options){
  const markdownFolder = process.env.MY_RESOURCE_DRAFTS ? process.env.MY_RESOURCE_DRAFTS : `${ROOT_DIR}/temp`
  if (options.url) {
    const siteContent = await getSiteContent(options.url);
    console.log(`received formatted data from getSiteContent:\n\n${JSON.stringify(siteContent)}`);
    const markdownString = await resourceTemplate(siteContent);
    console.log(`markdownString:\n\n${markdownString}`);
    const fileName = `${moment().format('YYYYMMDD-HHmmss.SSS')}-${siteContent.title.split(' ').slice(0,3).join('-').replace(/[^\w\s,\-]/gi, '')}.md`
    const filePath = `${markdownFolder}/${fileName}`
    fs.writeFileSync(filePath, markdownString, 'utf8');
    if (process.env.AIRTABLE_API_KEY) {
      airtableTools.addRecord({
        base: process.env.AIRTABLE_RESOURCE_BASE,
        table: 'NotQuitePinterestBut',
        record: {
            "name": siteContent.title.split(' ').slice(0,4).join('-').replace(/[^\w\s,\-]/gi, ''),
            "resourceId": siteContent.resourceId,
            // "tags": siteContent.keywords,
            "creatorId": process.env.MY_AUTHOR_ID ? process.env.MY_AUTHOR_ID : "",
            "ogDescription": siteContent.description,
            "ogTitle": siteContent.title,
            "ogImage": siteContent.previewImage,
            // "type": [
            //   "youtube"
            // ],
            "draftMarkdown": markdownString,
            "notes": "",
            // "TOOLS_AND_MEDIA": [
            //   "recHyFj7LsRmsGVQM",
            //   "recMWhgnjgsJC6Tk2"
            // ],
            "JSON": JSON.stringify(siteContent),
            "ogUrl": siteContent.url,
            "urlSubmitted": siteContent.originalUrl,
            // "creatorAtId": "",
            "initialMarkdownFileUrl": filePath
        }
      })
    }
    if (process.env.MARKDOWN_EDITOR) {
      cp.spawn('open', [filePath, '-a', process.env.MARKDOWN_EDITOR]);
    }
    if (process.env.MARKDOWN_PREVIEW_APP) {
      cp.spawn('open', [filePath, '-a', process.env.MARKDOWN_PREVIEW_APP]);
    }
    return(`done, file is at ${filePath}`)
  } else {
    console.log("you need to supply a url");
    return("done")
  }
}
