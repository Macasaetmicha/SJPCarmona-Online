# sms_service.py
import requests

SEMAPHORE_API_KEY = '3293961280d7b9ac6adc47fb60c62e25'
SEMAPHORE_API_URL = 'https://api.semaphore.co/api/v4/messages'

def send_verification_sms(phone_number, message, sender_name=None):
    payload = {
        'apikey': SEMAPHORE_API_KEY,
        'number': phone_number,
        'message': message
    }

    if sender_name:
        payload['sendername'] = sender_name

    try:
        print("TRYING TO SEND SMS")
        print("PAYLOAD:", payload)
        response = requests.post(SEMAPHORE_API_URL, data=payload)  
        response.raise_for_status()
        print("RESPONSE:", response.json())
        return response.json()
    except requests.RequestException as e:
        print(f"Error sending SMS: {e}")
        return None
