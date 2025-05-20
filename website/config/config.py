import os

class Config:
    DB_HOST = os.getenv('MYSQLHOST')
    DB_NAME = os.getenv('MYSQLDATABASE')
    DB_USER = os.getenv('MYSQLUSER')
    DB_PASSWORD = os.getenv('MYSQLPASSWORD')
    DB_PORT = os.getenv('MYSQLPORT', '3306') 
