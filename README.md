# Webscraper using puppeteer

This is a project to scrape the paginated table of the website of registered marriage celebrants in Australia filtered by those in NSW. There were issues with scraping the table and having an appropriate exit condition to successfully stop the loop, so I just hard coded a fixed number of loops to scrape the table and paginate to the next table page.

The website it scrapes is 'https://marriage.ag.gov.au/statecelebrants/state'.
However, the HTML structure of the table isn't so straightforward to scrape as it has a series of table row headers inside the table and different columns that have no data.

The resulting scrape outputs **7000+** rows of data. :)

# Installation
*Clone repo*
```bash
git clone git@github.com:daveanthonyc/Webscraper-Test.git
```

*Install dependencies*
```bash
npm install
```

# Run the script
```bash
node scrape.js
```

You should expect a browser instance to run, move to the 'NSW' filter, then it proceeds to paginate to the end of the results.
You should be able to find an output.xlsx file in your project directory after running the script.
