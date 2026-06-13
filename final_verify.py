import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Homepage
        print("Checking Homepage...")
        await page.goto("http://localhost:5173")
        await page.wait_for_timeout(2000)

        # Close Celebrity Popup if it exists
        popup_close = page.locator("button:has(svg.lucide-x)")
        if await popup_close.is_visible():
            print("Closing Celebrity Popup...")
            await popup_close.click()
            await page.wait_for_timeout(500)

        await page.screenshot(path="final_home.png")

        # News Page
        print("Checking News...")
        await page.click("text=News")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="final_news.png")

        # Shorts Page
        print("Checking Shorts...")
        await page.click("text=Shorts")
        await page.wait_for_timeout(3000) # Wait for shorts to load
        await page.screenshot(path="final_shorts.png")

        # Profile Page
        print("Checking Profile...")
        await page.click("text=Profile")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="final_profile.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
