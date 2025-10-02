<<<<<<< HEAD
# database.py
import psycopg2
from psycopg2.extras import RealDictCursor

db_host = 'sportsdatabase.c9wy48s2kma9.us-east-2.rds.amazonaws.com'
db_name = 'sportsdatabase'
db_user = 'postgres'
db_password = 'sportsanalyticspssword'
db_port = 5432

def get_connection():
    return psycopg2.connect(
        host=db_host,
        user=db_user,
        password=db_password,
        port=db_port,
        cursor_factory=RealDictCursor
=======
# database.py
import psycopg2
from psycopg2.extras import RealDictCursor

db_host = 'sportsdatabase.c9wy48s2kma9.us-east-2.rds.amazonaws.com'
db_name = 'sportsdatabase'
db_user = 'postgres'
db_password = 'sportsanalyticspssword'
db_port = 5432

def get_connection():
    return psycopg2.connect(
        host=db_host,
        user=db_user,
        password=db_password,
        port=db_port,
        cursor_factory=RealDictCursor
>>>>>>> 305e8bb (Barebone gradio chatbot page - Embedded as Iframe)
    )