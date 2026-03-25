import sqlite3

def initialize_database():
    connection = sqlite3.connect("apaetments.db")
    cursor = connection.cursor()

    #creating db command
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS listings (
            post_id TEXT PRIMARY KEY,
            group_url TEXT,
            raw_text TEXT,
            price INTEGER,
            rooms REAL,
            date_published TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    connection.commit() #save the changes
    connection.close() #close the cursor
    
    print("succes!")

if __name__ == "__main__":
    initialize_database()