from utils.db import get_db_connection

conn, engine = get_db_connection()

print("Connected to:", engine)

conn.close()