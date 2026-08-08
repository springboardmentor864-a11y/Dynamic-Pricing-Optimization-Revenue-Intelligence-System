from database import engine, Base
import models

print("Creating PostgreSQL tables...")

Base.metadata.create_all(bind=engine)

print("All tables created successfully!")