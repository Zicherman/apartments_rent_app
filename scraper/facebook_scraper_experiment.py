import sqlite3
import time
import re
from fb_scraper import scrape_facebook_groups
from datetime import datetime, timedelta
import pandas as pd
import os
import requests

DB_DIR = r"C:\Users\97252\Desktop\apartments_scraper_project\apartments_rent_app\scraper"
DB_NAME = "apartments.db"

IMG_STORAGE_DIR = r"C:\Users\97252\Desktop\apartments_scraper_project\apartments_rent_app\client\public\apartment_images"

groups = [
        "https://www.facebook.com/groups/682901001910318",
        "https://www.facebook.com/groups/716258928467864",
        "https://www.facebook.com/groups/216105212485630",
        "https://www.facebook.com/groups/683985451631971",
        "https://www.facebook.com/groups/248835652321875",
        "https://www.facebook.com/groups/389882678416255"
    ]

Apartment_Max_Price = 25000
Apartment_Min_Price = 2100 

Scraper_Cooldown_In_Seconds = 1200

def extract_price(text):
    text = text.replace(",", "").replace(".", "")
    if not re.search('(?<!\d)([1-9]\d?,?\d{3})(?!\d)', text):
        return "ללא מחיר במודעה"
    price = int(re.search('(?<!\d)([1-9]\d?,?\d{3})(?!\d)', text).group().replace(",", "").strip())
    
    if price > Apartment_Min_Price and price< Apartment_Max_Price:
        return str(price)
    else:
        return "ללא מחיר במודעה"

def extract_rooms(text):
    # Mapping the variations to a single float value
    room_map = {
        2: ["2 חדרים", "שני חדרים", "שתי חדרים", '2 חד"', "2 חד'"],
        2.5: ["2.5 חדרים", "2 וחצי חדרים", "שניים וחצי חדרים", "שתיים וחצי חדרים", "שני חדרים וחצי"],
        3: ["3 חדרים", "שלושה חדרים", "שלוש חדרים", '3 חד"', "3 חד'"],
        3.5: ["3.5 חדרים", "שלושה וחצי חדרים", "שלוש וחצי חדרים", "3 וחצי חדרים", "שלושה חדרים וחצי"],
        4: ["4 חדרים", "ארבעה חדרים", "ארבע חדרים", '4 חד"', "4 חד'"],
        4.5: ["4.5 חדרים", "4 וחצי חדרים", "ארבע וחצי חדרים", "ארבעה וחצי חדרים", "ארבעה חדרים וחצי"],
        5: ["5 חדרים", "חמישה חדרים", "חמש חדרים", '5 חד"', "5 חד'"],
        5.5: ["5.5 חדרים", "חמש וחצי חדרים", "חמישה וחצי חדרים", "5 וחצי חדרים", "חמישה חדרים וחצי"],
        6: ["6 חדרים", "שישה חדרים", "ששה חדרים", "שש חדרים"]
    }

    # Iterate through the map to find a match in the text
    for room_count, variations in room_map.items():
        for variant in variations:
            if variant in text:
                return room_count
    
    # Fallback: Use Regex to find patterns like "X חדרים" if not in the map
    # This catches "7 חדרים" or "1.5 חדרים" automatically
    match = re.search(r'(\d\.?5?)\s*(?:חדרים|חדר|חד"|חד\')', text)
    if match:
        return float(match.group(1))

    return None # Return None if no room count is found

def extract_time(time_str):
    time_str = str(time_str).replace("לפני", "").replace('\u200f', "").strip()
    
    # Check if it contains relevant time units
    units = ["ימים", "יום", "שעות", "שעה", "דקות", "דקה", "שבוע", "שבועות"]
    if not any(unit in time_str for unit in units):
        return None
    
    now = datetime.now()
    
    # 2. Use Regex to find the first number in the string
    # This ignores hidden characters and finds the digit automatically
    match = re.search(r'(\d+)', time_str)
    if not match:
        return None
    
    amount = int(match.group(1))

    # 3. Determine the time unit
    if "יום" in time_str or "ימים" in time_str:
        delta = timedelta(days=amount)
    elif "שעה" in time_str or "שעות" in time_str:
        delta = timedelta(hours=amount)
    elif "דקה" in time_str or "דקות" in time_str:
        delta = timedelta(minutes=amount)
    elif "שבוע" in time_str or "שבועות" in time_str:
        delta = timedelta(weeks=amount)
    else:
        return None
    
    past_time = now - delta
    return past_time.strftime("%Y-%m-%d %H:%M:%S")

def extract_group_name(url):
    group_dict = {"https://www.facebook.com/groups/682901001910318":"דירות להשכרה בפתח תקווה",
            "https://www.facebook.com/groups/716258928467864":"דירות בשושו פתח תקווה והסביבה -אין כניסה ⛔ למתווכים!!",
            "https://www.facebook.com/groups/216105212485630":"דירות להשכרה בפתח תקווה ללא תיווך",
            "https://www.facebook.com/groups/683985451631971":"דירות להשכרה בפתח תקווה",
            "https://www.facebook.com/groups/248835652321875": "דירות להשכרה בפתח תקווה והסביבה",
            "https://www.facebook.com/groups/389882678416255":"דירות למכירה ולהשכרה בפתח תקווה והסביבה"
            }
    
    return group_dict[url]

def extract_size(text):
    size_pattern = r'(\d{2,3})\s*(?:מ"ר|מטר|מטרים רבועים|מר|מטר רבוע|מ\'|מ(?:\s|$))'
    
    match = re.search(size_pattern, text)
    
    if match:
        digit = "".join(filter(str.isdigit, match.group(1)))
        
        # Convert the captured digits to an integer
        return digit
    
    return None    

def cleaning_text(text):
    if not text:
        return ""
    
    text = str(text)
    start_pattern = r'.*?·\s*'
    text = re.sub(start_pattern, '', text, count=1, flags=re.DOTALL)

    end_markers = [
        "כל הרגשות", 
        "לייק\nתגובה", 
        "לייק תגובה", 
        "שיתוף", 
        "כתיבת תגובה"
    ]
    
    for marker in end_markers:
        index = text.find(marker)
        if index != -1:
            text = text[:index]
            break # Stop at the first marker we find

    text = re.sub(r'\+\d+\s*$', '', text.strip())
    return text.strip()


def get_and_process_df():
    df = scrape_facebook_groups(groups)
    df["text"] = df["text"].apply(lambda x: cleaning_text(x))
    df["price"] = df["text"].apply(lambda x: extract_price(x))
    df["rooms"] = df["text"].apply(lambda x: extract_rooms(x))
    df["date"] = df["date_time"].apply(lambda x: extract_time(x))
    df["size"] = df["text"].apply(lambda x: extract_size(x))
    df["group_name"] = df["group_url"].apply(lambda x: extract_group_name(x))
    
    df["valid"] = (df["price"] != "ללא מחיר במודעה") | \
                  (df["rooms"].notnull()) | \
                  (df["size"].notnull())
    
    df = df[df["valid"] == True].drop(columns=["valid"])
    
    return df
        
def download_apartment_images(urls_string, post_id):
    # Check if there's anything to download
    if not urls_string or pd.isna(urls_string) or urls_string == "":
        return ""
    
    img_dir = r"C:\Users\97252\Desktop\apartments_scraper_project\apartments_rent_app\client\public\apartment_images"
    
    if not os.path.exists(img_dir):
        os.makedirs(img_dir)
        
    # Split the long string into individual URLs
    urls = [u.strip() for u in urls_string.split("|") if "scontent" in u]
    local_paths = []
    
    for i, url in enumerate(urls):
        try:
            # Add a small delay to avoid Facebook blocking you for rapid requests
            time.sleep(0.5) 
            response = requests.get(url, timeout=15)
            
            if response.status_code == 200:
                filename = f"{post_id}_{i}.jpg"
                file_path = os.path.join(img_dir, filename)
                
                with open(file_path, 'wb') as f:
                    f.write(response.content)
                
                # We store the relative path for React
                local_paths.append(f"/apartment_images/{filename}")
                # print(f"Successfully downloaded: {filename}")
        except Exception as e:
            print(f"Failed image {i} for post {post_id}: {e}")
            
    # Join the LOCAL paths back into a string for the DB
    return " | ".join(local_paths)

def main():
    while True:
        df = get_and_process_df()
        if not df.empty:
            # Construct full path to avoid Drive sync issues
            db_file = os.path.join(DB_DIR, DB_NAME)
            
            try:
                # 'with' ensures the connection closes even if an error occurs
                # timeout=30 helps wait for Google Drive to finish syncing
                with sqlite3.connect(db_file, timeout=30) as connection:
                    cursor = connection.cursor()
                    new_rows = 0
                    
                    for index, row in df.iterrows():
                        
                        #check if this text already exists in our DB from another group
                        cursor.execute("SELECT 1 FROM apartments WHERE text = ?", (row['text'],))
                        if cursor.fetchone():
                            continue # Skip if we already have this exact text
                        
                        #check if the word "למכירה" or "מחפש" in the text - not a rental apartment
                        if "למכירה" in row["text"] or "מחפש" in row["text"]:
                            continue
                        
                        #check if the text isnt too short
                        if len(row["text"]) < 70:
                            continue
                        
                        local_img_string = download_apartment_images(row['pictures'], row['post_id'])

                        try:
                            cursor.execute("""
                                    INSERT OR IGNORE INTO apartments (
                                        post_id, group_url, text, price, rooms, date_published, 
                                        group_name_or_website, pictures_url, size
                                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                                """, (
                                    str(row['post_id']), 
                                    row['group_url'], 
                                    row['text'], 
                                    row['price'], 
                                    row['rooms'], 
                                    row['date'],
                                    row['group_name'],
                                    local_img_string,
                                    row['size']
                                ))
                            if cursor.rowcount > 0:
                                new_rows += 1
                        except Exception as e:
                            print(f"Row error for {row.get('post_id')}: {e}")
                    
                    print(f"Added {new_rows} new rows.")
                    # connection.commit() is called automatically here by the context manager
                    
            except sqlite3.OperationalError as e:
                print(f"Database access error (likely locked): {e}")
                
       
        print("finish a loop in: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        time.sleep(Scraper_Cooldown_In_Seconds)

if __name__ == "__main__":
    main()
    

