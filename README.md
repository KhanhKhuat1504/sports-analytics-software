# csds395-sports-analytics-software
universal email account:
sportsanalyticscsds@gmail.com <br />
thispsswordisshared <br />


Root User email:
sportsanalyticscsds@gmail.com <br />
Password: SportsAnalytics25! <br />

IAM User:

alias number: 205991466141
Ren : Username : Ren, Password: SportsAnalytics25!  
Will : Username : Will, Password: SportsAnalytics25!  
Long: Username: Long, Password: SportsAnalytics25!  
Quan: Username: Quan, Password: SportsAnalytics25!  
Jessie: Username: Jessie, Password: SportsAnalytics25!  

Database Information: <br />
Database instance identifier: sportsdatabase <br />
Master username: posgres <br />
Master password: sportsanalyticspssword <br />
Host link: sportsdatabase.c9wy48s2kma9.us-east-2.rds.amazonaws.com <br />
Db_port: 5432 <br />

Figma Link: https://www.figma.com/make/sHthJ4aYbfWQ0wRKPw8irh/Sports-Analytics-Dashboard-Design?node-id=0-1&t=7oJmcFIcxTiiJqeR-1




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
        database=db_name,
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
