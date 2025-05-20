# sms_service.py
import requests
import urllib.parse

SEMAPHORE_API_KEY = '3293961280d7b9ac6adc47fb60c62e25'
SEMAPHORE_API_URL = 'https://api.semaphore.co/api/v4/messages'

def send_verification_sms(phone_number, message, sender_name=None):
    
    params = (
		('apikey', SEMAPHORE_API_KEY),
		('sendername', sender_name),
		('message', message),
		('number', phone_number)
	)

    try:
        print("TRYING TO SEND SMS")
        print("THIS IS THE PAYLOAD: ", params)
        response = requests.post(SEMAPHORE_API_URL, urllib.parse.urlencode(params))
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error sending SMS: {e}")
        return None
