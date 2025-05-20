import os

class Config:
    DB_HOST = os.getenv('MYSQLHOST')
    DB_NAME = os.getenv('MYSQL_DATABASE')
    DB_USER = os.getenv('MYSQLUSER')
    DB_PASSWORD = os.getenv('MYSQLPASSWORD')
