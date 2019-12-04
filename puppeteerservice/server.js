'use strict';
var http = require('http');
var port = process.env.PORT || 8080;

const server = http.createServer();
//const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

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
        browser = await puppeteer.launch({
            headless: true,
            executablePath: '/usr/bin/google-chrome',
            //args: ['--headless','--no-sandbox'],
            args: ['--no-sandbox'],
        });
        

        let page = await browser.newPage();
        const version = await page.browser().version();
        console.log(version);
        var filename=process.cwd()+'/cookie.txt';
        var contents = fs.readFileSync(filename, 'utf8');
        
        console.log(contents);

        var headers = {
            'cookie': contents
        }

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
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
                await page.goto(url, { waitUntil: 'networkidle2' , timeout: 60000 });
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
        return console.error(error);
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
