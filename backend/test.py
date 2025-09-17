import psycopg2
import boto3

# RDS settings
db_host = 'sportsdatabase.c9wy48s2kma9.us-east-2.rds.amazonaws.com'
db_name = 'sportsdatabase'
db_user = 'postgres'
db_password = 'sportsanalyticspssword'
db_port = 5432  # Default PostgreSQL port

# Initialize connection variable
connection = None

# Connect to the PostgreSQL database
try:
    connection = psycopg2.connect(
        host=db_host,
        user=db_user,
        password=db_password,
        port=db_port
    )
    print("Connection to PostgreSQL DB successful")
except Exception as e:
    print(f"Error connecting to PostgreSQL DB: {e}")
finally:
    if connection:
        connection.close()