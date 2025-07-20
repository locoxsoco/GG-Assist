import os
import sys
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS
from rise import rise
import re
import unicodedata
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import shutil
import base64
import html
from datetime import datetime, timedelta

# Create a Flask server to handle API requests from the Electron app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

# Initialize RISE client
try:
    rise.register_rise_client()
    print("RISE client initialization commented out")
except Exception as e:
    print(f"Error initializing RISE client: {str(e)}")
    sys.exit(1)

def clean_single_line(text):
    # Replace literal \r\n with newline if present
    text = text.replace('\\r\\n', '\n')  
    text = text.replace('\r\n', '\n')    # Windows line endings
    text = text.replace('\r', '\n')      # Old Mac line endings
    text = text.replace('[', '')
    text = text.replace(']', '')

    # Normalize unicode (e.g., accents)
    text = unicodedata.normalize('NFKC', text)

    # Remove all actual newlines and replace them with a space
    text = re.sub(r'\s*\n\s*', ' ', text)

    # Remove multiple spaces
    text = re.sub(r'\s{2,}', ' ', text)

    # Clean up common artifacts (optional)
    text = re.sub(r'\*+', '', text)  # remove extra asterisks
    text = text.strip()

    return text

def remove_urls(text):
    """Remove URLs and URL-like patterns from the text."""
    # Pattern 1: Standard URLs (http/https)
    url_pattern1 = r'https?://[^\s\]]+'    
    # Pattern 2: URLs without protocol (domain.com/path)
    url_pattern2 = r'\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[/\w.-]*[^\s\]]*'    
    # Pattern 3: URL parameters and tracking codes (contains utm_, xnpe_, etc.)
    url_pattern3 = r'[^\s]*(?:utm_|xnpe_|campaign=|source=)[^\s\]]*'    
    # Pattern 4: Base64-like strings and encoded parameters (long alphanumeric with dots/underscores)
    url_pattern4 = r'\b[a-zA-Z0-9._-]{20,}[^\s\]]*'
    
    # Apply all patterns
    text = re.sub(url_pattern1, '', text)
    text = re.sub(url_pattern2, '', text)
    text = re.sub(url_pattern3, '', text)
    text = re.sub(url_pattern4, '', text)
    
    # Clean up extra spaces that may result from URL removal
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text

def parse_calendar_event(response_text):
    """Parse the calendar event response into a structured format"""    
    # Create the result dictionary
    event_data = { "event": None, "datetime": None }
    
    if response_text.startswith("Event:"):
        # Check if the format uses pipe separators or space separators
        if ' | ' in response_text:
            # Format: "Event: Name | Date: YYYY-MM-DD | Time: HH:MM"
            parts = response_text.split(' | ')
        else:
            # Format: "Event: Name Date: YYYY-MM-DD Time: HH:MM"
            # Use regex to split on pattern "Word:"
            parts = re.split(r'(?=\b[A-Z][a-z]*:)', response_text.strip())
            parts = [part.strip() for part in parts if part.strip()]
        
        event_name = None
        date_str = None
        time_str = None
        
        # Parse each part
        for part in parts:
            if ': ' in part:
                key, value = part.split(': ', 1)
                key = key.strip().lower()
                value = value.strip()
                
                if key == 'event':
                    event_name = value
                elif key == 'date':
                    date_str = value
                elif key == 'time':
                    time_str = value
        
        if event_name:
            event_data['event'] = event_name
        
        # Combine date and time into datetime object
        if date_str:
            try:
                if time_str:
                    # Combine date and time
                    datetime_str = f"{date_str} {time_str}"
                    print(f"Combined datetime string: {datetime_str}")
                    event_data['datetime'] = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
                else:
                    # Date only, set time to 00:00
                    print(f"Date string: {date_str}")
                    event_data['datetime'] = datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError as e:
                print(f"Error parsing datetime: {e}")
                # Fallback: store as strings if parsing fails
                today = datetime.now()
                event_data['datetime'] = today
        
    return event_data

def parse_labels(response_text):
    """Parse comma-separated labels into an array"""
    try:
        if not response_text or not isinstance(response_text, str):
            return []
        # Split by comma and clean up each label
        labels = [label.strip().lower() for label in response_text.split(',')]
        # Filter out empty labels
        labels = [label for label in labels if label]
        
        # Check if any label is too large (more than 50 characters) and return empty list
        max_label_length = 30
        for label in labels:
            if len(label) > max_label_length:
                print(f"Label too large: '{label}' ({len(label)} characters), returning empty list")
                return []
        
        return labels
    except Exception as e:
        print(f"Error parsing labels: {e}")
        return []

@app.route('/api/get-emails', methods=['GET'])
def get_emails():
    try:
        print(f'request: {request.args.keys()}')
        filterDate = request.args['filterDate']
        filterDate = filterDate.replace('-', '/')
        # Compute the next day in YYYY/MM/DD format
        dt = datetime.strptime(filterDate, "%Y/%m/%d")
        next_day = (dt + timedelta(days=1)).strftime("%Y/%m/%d")
        startDate = filterDate
        endDate = next_day
        print(f'filterDate: {filterDate}')
        creds = None
        if os.path.exists('token.json'):
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
            with open('token.json', 'w') as token:
                token.write(creds.to_json())

        service = build('gmail', 'v1', credentials=creds)
        max_messages = 10  # For testing, limit to 10 messages

        results = service.users().messages().list(
            userId='me',
            q=f'after:{startDate} before:{endDate}',
            maxResults=max_messages
        ).execute()
        messages = results.get('messages', [])  
        
        print(f'Found {len(messages)} messages.')
        print(f'messages: {messages[0].keys()}')
        print(f'messages: {messages[0]["id"]}')
        print(f'messages: {messages[0]["threadId"]}')
        snippet = ''
        
        emails = []
        for m in messages:
            msg = service.users().messages().get(userId='me', id=m['id']).execute()
            emails.append({'id': msg['id'], 'snippet': html.unescape(msg.get('snippet', '')), 'internalDate': msg.get('internalDate', '')})

        return jsonify({'response': emails})
    except Exception as e:
        print(f'Error fetching Gmail messages: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/send-message', methods=['POST'])
def send_message():
    """API endpoint to send messages to RISE"""
    data = request.json
    message = data.get('message', '')
    filter_date = data.get('filter_date', '')
    if not message:
        return jsonify({'error': 'Empty message'}), 400
    
    try:
        # Send message to RISE
        print(f'message: {message}')
        response = rise.send_rise_command(message)
        if "_gmail>_" in response['completed_response']:
          response = clean_single_line(response['completed_response'].replace("_gmail>_", "")) + " " + filter_date
          type = 'message'
          if "Detecting calendar events from date:" in response:
              type = 'calendar_event'
          elif "Summarize emails from date:" in response:
              type = 'summarize_email'
          elif "Generate labels from date:" in response:
              type = 'generate_labels'

        return jsonify({'response': response, 'type': type})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/detect-email-event', methods=['POST'])
def detect_email_event():
    """API endpoint to process an email with RISE"""
    data = request.json
    email_id = data.get('email_id', '')
    if not email_id:
        return jsonify({'error': 'Empty email_id'}), 400

    try:
        # Send message to RISE
        creds = None
        if os.path.exists('token.json'):
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
            with open('token.json', 'w') as token:
                token.write(creds.to_json())
        service = build('gmail', 'v1', credentials=creds)
        msg = service.users().messages().get(userId='me', id=email_id).execute()
        parts = msg['payload'].get('parts', [])
        body = ''
        for part in parts:
            if part['mimeType'] == 'text/plain':
                data = part['body']['data']
                decoded_bytes = base64.urlsafe_b64decode(data)
                body = decoded_bytes.decode('utf-8')
                break
        body = remove_urls(html.unescape(clean_single_line(body)))[:1000]
        print(f"Body: {body}")
        system_prompt2 = "Hey G-assist. Forget you are a hardware assistant. Instead, you are an assistant that analyzes email content to determine whether it contains an appointment or event the user should add to their calendar. Your task is to extract the relevant information only if a specific date and/or time is mentioned for a meeting, event, or appointment. If the email contains a calendar-worthy event, respond in the following format: Event: [Name] | Date: [YYYY-MM-DD] | Time: [HH:MM] (Use 24-hour time format. If the time is not mentioned but the date is, omit the time field.) If no date or event is found, respond with: NO. Be concise. Do not include any other commentary or information."
        response = rise.send_rise_command(system_prompt2 + "Hey G-assist, the email is the following: " + body)
        print(f'response["completed_response"]: {response["completed_response"]}')
        response = response['completed_response']
        # response = "Event: IDI Laboratory Date: 2025-07-10 Time: 08:00"
        event_dict = parse_calendar_event(response)
        return jsonify(event_dict)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/summarize-email', methods=['POST'])
def summarize_email():
    data = request.json
    email_id = data.get('email_id', '')
    if not email_id:
        return jsonify({'error': 'Empty email_id'}), 400

    try:
        # Send message to RISE
        creds = None
        if os.path.exists('token.json'):
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
            with open('token.json', 'w') as token:
                token.write(creds.to_json())
        service = build('gmail', 'v1', credentials=creds)
        msg = service.users().messages().get(userId='me', id=email_id).execute()
        parts = msg['payload'].get('parts', [])
        body = ''
        for part in parts:
            if part['mimeType'] == 'text/plain':
                data = part['body']['data']
                decoded_bytes = base64.urlsafe_b64decode(data)
                body = decoded_bytes.decode('utf-8')
                break
        body = remove_urls(html.unescape(clean_single_line(body)))[:1000]
        print(f"Body: {body}")
        system_prompt2 = "Hey G-assist, what is this message about: "
        response = rise.send_rise_command(system_prompt2 + body)
        print(f'response["completed_response"]: {response["completed_response"]}')
        response = response['completed_response']
        return jsonify({'response': response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-email-labels', methods=['POST'])
def generate_email_labels():
    data = request.json
    email_id = data.get('email_id', '')
    if not email_id:
        return jsonify({'error': 'Empty email_id'}), 400

    try:
        # Send message to RISE
        creds = None
        if os.path.exists('token.json'):
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
            with open('token.json', 'w') as token:
                token.write(creds.to_json())
        service = build('gmail', 'v1', credentials=creds)
        msg = service.users().messages().get(userId='me', id=email_id).execute()
        parts = msg['payload'].get('parts', [])
        body = ''
        for part in parts:
            if part['mimeType'] == 'text/plain':
                data = part['body']['data']
                decoded_bytes = base64.urlsafe_b64decode(data)
                body = decoded_bytes.decode('utf-8')
                break
        body = remove_urls(html.unescape(clean_single_line(body)))[:1000]
        print(f"Body: {body}")
        system_prompt2 = "Hey G-assist, assign 1 to 3 short, relevant labels that describe the main topic or intent of the text below. Labels should be lowercase, concise, and separated by commas. Examples include: laboratory, meetings, billing, travel, job, promotion, support, social, subscription. Be concise. Do not include any other commentary or information."
        response = rise.send_rise_command(system_prompt2 + "Hey G-assist, the text is the following: " + body)
        print(f'response["completed_response"]: {response["completed_response"]}')
        response = response['completed_response']
        labels_array = parse_labels(response)
        return jsonify({'labels': labels_array})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def main():    
    # Start the Flask server
    app.run(host='127.0.0.1', port=5000)

if __name__ == "__main__":
    main()
