const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    try {
        await page.goto('http://localhost:5174/login');
        await page.fill('input[type="email"]', 'admin@ikms.edu.et');
        await page.fill('input[type="password"]', 'password');
        await page.click('button[type="submit"]');

        await page.waitForURL('**/admin/sysadmin', { timeout: 10000 }).catch(e => console.log('redirect failed'));
        // Wait for dashboard to fully load
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'src/pages/admin/admin_layout_success.png' });
        console.log('Screenshot saved to src/pages/admin/admin_layout_success.png');
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
