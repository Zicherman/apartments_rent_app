from playwright.sync_api import sync_playwright
import pandas as pd
import time
import random
import re

def scrape_facebook_groups(group_urls):
    all_posts = []
    
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir="./fb_session",
            headless=True,
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = context.new_page()

        for group_url in group_urls:
            print(f"Navigating to: {group_url}")
            page.goto(group_url)
            
            try:
                page.wait_for_selector('div[role="feed"]', timeout=30000)
            except:
                print(f"Skipping {group_url} - Feed not loaded.")
                continue

            seen_ids = set()
            for i in range(7): 
                
                # 1. Click "See More"
                page.evaluate("""
                    () => {
                        const seeMoreTexts = ["עוד", "עוד...", "See more"];
                        const buttons = Array.from(document.querySelectorAll('div[role="button"], span[dir="auto"]'))
                            .filter(b => seeMoreTexts.includes(b.innerText.trim()) || seeMoreTexts.includes(b.textContent.trim()));
                        
                        buttons.forEach(btn => {
                            try { btn.click(); } catch(e) {}
                        });
                    }
                """)
                
                page.wait_for_timeout(1500) 

                # 2. Extract Data (Visible Relative Time Logic)
                new_posts = page.evaluate("""
                    () => {
                        const results = [];
                        const items = document.querySelectorAll('div[role="feed"] > div');
                        
                        items.forEach(item => {
                            const text = item.innerText || "";
                            
                            let timestamp = "";
                            let href = "";
                            
                            // Find ALL links in the post
                            const links = Array.from(item.querySelectorAll('a'));
                            
                            for (let a of links) {
                                const currentHref = a.href || "";
                                
                                // STRICT FILTER: Only look at links that are post permalinks. 
                                if (currentHref.includes('/posts/') || currentHref.includes('/permalink/') || currentHref.includes('story_fbid=')) {
                                    
                                    if (!href) href = currentHref; // Save the URL
                                    
                                    // EXTRACT ONLY VISIBLE TEXT (e.g., "2 hours ago", "שעתיים")
                                    const inner = a.innerText.trim();
                                    
                                    // We ensure it's not completely empty and not a massive block of accidental text
                                    if (inner && inner.length > 0 && inner.length < 30) {
                                        timestamp = inner;
                                        break; // Stop looking once we find the time
                                    }
                                }
                            }

                            // 3. Image Extraction
                            const imgEls = Array.from(item.querySelectorAll('img'));
                            const imageUrls = imgEls
                                .filter(img => {
                                    const src = img.getAttribute('src') || "";
                                    const width = img.naturalWidth || img.width || 0;
                                    return src.includes('scontent') && !src.includes('emoji') && width > 75;
                                })
                                .map(img => img.getAttribute('src'))
                                .filter((val, index, self) => self.indexOf(val) === index);
                                
                            const pictures = imageUrls.join(" | ");
                            
                            if (text.length > 15) {
                                results.push({ text, timestamp, href, pictures });
                            }
                        });
                        return results;
                    }
                """)

                for post in new_posts:
                    if " מחפש " in post['text'] or " מחפשת " in post['text']:
                        continue
                        
                    id_match = re.search(r'/posts/(\d+)|story_fbid=(\d+)|permalink/(\d+)', post['href'])
                    post_id = next((g for g in id_match.groups() if g), hash(post['text'])) if id_match else hash(post['text'])

                    if post_id not in seen_ids:
                        all_posts.append({
                            "post_id": post_id,
                            "text": post['text'],
                            "date_time": post['timestamp'], 
                            "pictures": post['pictures'],   
                            "url": post['href'],
                            "group_url": group_url
                        })
                        seen_ids.add(post_id)

                page.mouse.wheel(0, 3000)
                page.wait_for_timeout(2000) 
        
        context.close()
    return pd.DataFrame(all_posts).drop_duplicates(subset=['text'], keep='first')