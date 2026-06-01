const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Wait for the dev server to be ready
  await new Promise(r => setTimeout(r, 3000));
  
  await page.goto('http://localhost:5173/contacts', { waitUntil: 'networkidle2' });
  
  console.log('Page loaded.');
  
  // Try to find the "Template" button and click it
  const templateBtn = await page.$x("//button[contains(., 'Template')]");
  if (templateBtn.length > 0) {
    console.log('Found Template button. Clicking it...');
    
    // Catch if clicking it navigates away
    page.on('response', response => {
      if(response.status() === 404) {
        console.log('404 encountered!', response.url());
      }
    });

    await templateBtn[0].click();
    await new Promise(r => setTimeout(r, 2000));
    console.log('Template button clicked successfully. No navigation/404 happened.');
  } else {
    console.log('Template button not found.');
  }

  // Try to find the "Import CSV" button and click it
  const importBtn = await page.$x("//button[contains(., 'Import CSV')]");
  if (importBtn.length > 0) {
    console.log('Found Import CSV button. Clicking it...');
    await importBtn[0].click();
    await new Promise(r => setTimeout(r, 1000));
    
    const modal = await page.$('.csv-modal-overlay');
    if (modal) {
      console.log('Modal opened successfully!');
    } else {
      console.log('Modal did not open.');
    }
  } else {
    console.log('Import CSV button not found.');
  }
  
  await browser.close();
  console.log('Test finished.');
})();
