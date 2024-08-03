import puppeteer from 'puppeteer';
import fs from 'fs'
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // Set headless to false to see the browser actions
  const page = await browser.newPage();

  // Navigate to the provided URL
  await page.goto('https://marriage.ag.gov.au/statecelebrants/state');

  // Click the NSW element based on its text content
  await page.waitForSelector('a.rmLink.rmRootLink');
  const links = await page.$$('a.rmLink.rmRootLink');
  
  for (const link of links) {
    const text = await page.evaluate(el => el.textContent.trim(), link);
    if (text === 'NSW') {
      await link.click();
      break;
    }
  }

  const data = [];

  // Function to parse the current page
  async function parseCurrentPage() {
    await page.waitForSelector('.rgMasterTable');
    
    const pageData = await page.evaluate(() => {
      const rows = document.querySelectorAll('.rgMasterTable tr.rgRow, .rgMasterTable tr.rgAltRow');
      return Array.from(rows).map(row => {
        const surname = row.querySelector('span[id$="lblCelebrant"] b').innerText.trim();
        const fullNameAndTitle = row.querySelector('span[id$="lblCelebrant"]').innerText.trim().replace(surname, '').trim();
        const [firstName, title] = fullNameAndTitle.split(',').map(s => s.trim());

        const addressSpan = row.querySelector('td:nth-child(4) span:first-child');
        let address = '';
        let suburb = '';
        let postcode = '';

        if (addressSpan) {
          const addressParts = addressSpan.innerHTML.split('<br>');
          address = addressParts[0];//.replace(/,/g, ''); // Escape commas
          const suburbPostcode = addressParts[1] ? addressParts[1].trim() : '';
          const postcodeMatch = suburbPostcode.match(/, (\d{4})$/);

          if (postcodeMatch) {
            postcode = postcodeMatch[1];
            suburb = suburbPostcode.replace(`, ${postcode}`, '').replace('NSW', '').trim();
          } else {
            suburb = suburbPostcode.replace('NSW', '').trim();
          }
        }

        const organizationSpan = row.querySelector('td:nth-child(4) span[id$="lblreligiousorganisation"]');
        const organization = organizationSpan ? organizationSpan.innerText : '';//.replace(/,/g, '') : '';
        
        return { surname, firstName, title, address, suburb, postcode, organization };
      });
    });

    data.push(...pageData);
  }

  // Parse the first page
  await parseCurrentPage();
  console.log('Page URL:', page.url());

  // Loop to click the "Next" button until it is no longer available
  let hasNextPage = true;
  let cnt = 0;
  while (hasNextPage && cnt < 10) {
    try {
      // Wait for the next button to be available
      await page.waitForSelector('input[type="button"].rgPageNext', { timeout: 5000 });
      
      // Click the "Next" button
      await page.click('input[type="button"].rgPageNext');

      // Wait for a delay to ensure the table updates
      await new Promise(resolve => setTimeout(resolve, 2000)); // Delay of 2 seconds

      // Ensure the table updates
      await page.waitForSelector('.rgMasterTable');

      console.log('Page URL:', page.url());
      await parseCurrentPage();
      cnt++;
    } catch (error) {
      // If the next button is not found or times out, exit the loop
      hasNextPage = false;
    }
  }

  // Close the browser
  await browser.close();

  // Convert data to CSV format
  const csvData = [
    ['Surname', 'First Name', 'Title', 'Address', 'Suburb', 'Postcode', 'Organization'],
    ...data.map(row => [row.surname, row.firstName, row.title, row.address, row.suburb, row.postcode, row.organization])
  ]
    .map(row => row.join('|'))
    .join('\n');

  // Write the CSV file
  const filePath = path.join(__dirname, 'celebrants_data_state.csv');
  fs.writeFileSync(filePath, csvData);

  console.log(`Data saved to ${filePath}`);
})();

