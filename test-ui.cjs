const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Wait for the dev server to be ready
  await new Promise(r => setTimeout(r, 3000));
  
  // Go to origin first to establish host context for localStorage
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  
  // Inject mock authentication state
  await page.evaluate(() => {
    const mockUser = {
      id: 'mock-user-id',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'demo@huntlo.app',
      email_confirmed_at: '2026-06-10T00:00:00Z',
      phone: '',
      confirmed_at: '2026-06-10T00:00:00Z',
      last_sign_in_at: '2026-06-10T00:00:00Z',
      app_metadata: {
        provider: 'email',
        providers: ['email']
      },
      user_metadata: {
        full_name: 'Demo User'
      },
      created_at: '2026-06-10T00:00:00Z',
      updated_at: '2026-06-10T00:00:00Z'
    };

    const mockSession = {
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: mockUser,
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    localStorage.setItem('huntlo-auth-token', JSON.stringify(mockSession));

    const mockAuth = {
      state: {
        user: mockUser,
        session: mockSession
      },
      version: 0
    };
    localStorage.setItem('huntlo-auth', JSON.stringify(mockAuth));
  });

  // Navigate to contacts page
  await page.goto('http://localhost:3000/contacts', { waitUntil: 'networkidle2' });
  
  console.log('Page loaded. Current URL:', page.url());
  
  // Wait for React to finish auth check and render the contacts page
  await page.waitForSelector('.contacts-page', { timeout: 5000 });
  
  // Try to find the "Import" button and click it
  const importClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.trim() === 'Import');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (importClicked) {
    console.log('Found and clicked Import button.');
    await new Promise(r => setTimeout(r, 1000));
    
    const modal = await page.$('.csv-modal-overlay');
    if (modal) {
      console.log('Modal opened successfully!');
      
      // Try to find the template button inside the modal and click it
      const templateClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent.includes('Template'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });

      if (templateClicked) {
        console.log('Found and clicked Template button inside modal.');
        await new Promise(r => setTimeout(r, 1000));
      } else {
        console.log('Template button not found inside modal.');
      }
    } else {
      console.log('Modal did not open.');
    }
  } else {
    console.log('Import button not found.');
  }
  
  await browser.close();
  console.log('Test finished.');
})();
