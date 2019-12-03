'use strict';
var http = require('http');
var port = process.env.PORT || 8080;

const server = http.createServer();
const chromium = require('chrome-aws-lambda');
var fs = require('fs');

server.on('request', async (req, res) => {

    const data = await someAsyncFunc();
    console.log(req.url);
    console.log(data);
    var result = JSON.stringify(data)
    res.setHeader('Content-Type', 'application/json');
    res.end(result);

});




async function someAsyncFunc() {
    
    let result = null;
    let browser = null;

    try {
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: false,
            // headless: chromium.headless,
        });

        let page = await browser.newPage();

        var contents = fs.readFileSync('cookie.txt', 'utf8');
        console.log(contents);

        var headers = {
            'cookie': contents
        }
        await page.setExtraHTTPHeaders(headers);
        await page.setCacheEnabled(true);
        await page.setRequestInterception(true);

        page.on('request', interceptedRequest => {

            if (interceptedRequest.resourceType() === 'image' || interceptedRequest.resourceType() === 'stylesheet') {
                interceptedRequest.abort();
            }
            else {
                interceptedRequest.continue();
            }
        })

        var pageUrls = [
            "company/profile?id=100369",
            "company/stock?id=100369"
            //"company/corporateStructure?Id=100369",
            //"company/capitalOfferings?ID=100369",
            //"company/rankingReport?ID=100369",
            //"company/detailedRatesReport?ID=100369",
            //"company/rateSpecials?ID=100369",
            //"company/branchCompetitors?ID=100369"
        ]

        var manifestList = {};

        for (const pageUrl of pageUrls) {
            try {
                await page.goto("about:blank");
                var url = "https://platform.marketintelligence.spglobal.com/web/client?auth=inherit&overridecdc=1&#" + pageUrl + "&rbExportType=Pdf&kss=&ReportBuilderQuery=1";
                console.log("url:goto  " + pageUrl);
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });
                console.log("url:waitForSelector");
                await page.waitForSelector('div[name=\'reportManifest\']');
                console.log("url:$eval");
                result = await page.$eval('div[name=\'reportManifest\']', e => e.innerHTML);
                console.log("url:$eval,done");
                manifestList[pageUrl] = result;
            } catch (e) {
                console.error(e);
            }

        }

    } catch (error) {
        return context.fail(error);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }


    return manifestList;

}

server.listen(8080);

//http.createServer(function (req, res) {


//    res.writeHead(200, { 'Content-Type': 'text/plain' });
//    res.end('Hello World\n');
//}).listen(port);
