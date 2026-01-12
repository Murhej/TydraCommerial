import sqlite3

# Connect to the database
conn = sqlite3.connect("data.db")
c = conn.cursor()

# Show all rows
c.execute("SELECT * FROM submissions")
rows = c.fetchall()

for row in rows:
    print(row)

conn.close()
