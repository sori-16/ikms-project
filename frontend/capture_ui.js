import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to login
  await page.goto('http://localhost:5173/login');
  
  // Fill in credentials for a known unverified user (Soreti) - assuming the password is still the same test one
  await page.fill('input[type="email"]', 's.getinet@ikms.edu.et');
  await page.fill('input[type="password"]', 'pass123');
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForTimeout(2000);
  
  // Take screenshot of the reader mode dashboard
  await page.screenshot({ path: 'C:/Users/Soreti/.gemini/antigravity/brain/e4fb2864-9d02-4e74-b5cf-4286d2f5cbf9/reader_mode_dashboard.png' });
  
  // Click the Request Publishing Access button (the one in the header or main card)
  await page.click('text=Request to Publish');
  
  // Wait for modal to animate in
  await page.waitForTimeout(1000);
  
  // Take screenshot of the modal
  await page.screenshot({ path: 'C:/Users/Soreti/.gemini/antigravity/brain/e4fb2864-9d02-4e74-b5cf-4286d2f5cbf9/publish_request_modal.png' });

  await browser.close();
  console.log("Screenshots captured successfully.");
})();
