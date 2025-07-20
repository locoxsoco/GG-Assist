# SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import logging
import os
from ctypes import byref, windll, wintypes
from typing import Optional

# Data Types
type Response = dict[bool,Optional[str]]

LOG_FILE = os.path.join(os.environ.get("USERPROFILE", "."), 'python_plugin.log')
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def main():
    TOOL_CALLS_PROPERTY = 'tool_calls'
    CONTEXT_PROPERTY = 'messages'
    SYSTEM_INFO_PROPERTY = 'system_info'
    FUNCTION_PROPERTY = 'func'
    PARAMS_PROPERTY = 'properties'
    INITIALIZE_COMMAND = 'initialize'
    SHUTDOWN_COMMAND = 'shutdown'

    ERROR_MESSAGE = 'Plugin Error!'

    commands = {
        'initialize': execute_initialize_command,
        'shutdown': execute_shutdown_command,
        'detect_calendar_events_request': detect_calendar_events_request,
        'summarize_emails_request': summarize_emails_request,
        'generate_labels_request': generate_labels_request,
    }
    cmd = ''

    logging.info('Plugin started')
    while cmd != SHUTDOWN_COMMAND:
        response = None
        input = read_command()
        if input is None:
            logging.error('Error reading command')
            continue

        logging.info(f'Received input: {input}')

        if TOOL_CALLS_PROPERTY in input:
            tool_calls = input[TOOL_CALLS_PROPERTY]
            for tool_call in tool_calls:
                if FUNCTION_PROPERTY in tool_call:
                    cmd = tool_call[FUNCTION_PROPERTY]
                    logging.info(f'Processing command: {cmd}')
                    if cmd in commands:
                        if(cmd == INITIALIZE_COMMAND or cmd == SHUTDOWN_COMMAND):
                            response = commands[cmd]()
                        else:
                            response = execute_initialize_command()
                            response = commands[cmd](
                                input[PARAMS_PROPERTY] if PARAMS_PROPERTY in input else None,
                                input[CONTEXT_PROPERTY] if CONTEXT_PROPERTY in input else None,
                                input[SYSTEM_INFO_PROPERTY] if SYSTEM_INFO_PROPERTY in input else None
                            )
                    else:
                        logging.warning(f'Unknown command: {cmd}')
                        response = generate_failure_response(f'{ERROR_MESSAGE} Unknown command: {cmd}')
                else:
                    logging.warning('Malformed input: missing function property')
                    response = generate_failure_response(f'{ERROR_MESSAGE} Malformed input.')
        else:
            logging.warning('Malformed input: missing tool_calls property')
            response = generate_failure_response(f'{ERROR_MESSAGE} Malformed input.')

        logging.info(f'Sending response: {response}')
        write_response(response)

        if cmd == SHUTDOWN_COMMAND:
            logging.info('Shutdown command received, terminating plugin')
            break

    logging.info('G-Assist Plugin stopped.')
    return 0

def read_command() -> dict | None:
    try:
        STD_INPUT_HANDLE = -10
        pipe = windll.kernel32.GetStdHandle(STD_INPUT_HANDLE)
        chunks = []

        while True:
            BUFFER_SIZE = 4096
            message_bytes = wintypes.DWORD()
            buffer = bytes(BUFFER_SIZE)
            success = windll.kernel32.ReadFile(pipe, buffer, BUFFER_SIZE, byref(message_bytes), None)

            if not success:
                logging.error('Error reading from command pipe')
                return None

            chunk = buffer.decode('utf-8')[:message_bytes.value]
            chunks.append(chunk)

            if message_bytes.value < BUFFER_SIZE:
                break

        retval = ''.join(chunks)
        logging.info(f'Raw Input: {retval}')
        clean_text = retval.encode('utf-8').decode('raw_unicode_escape')
        clean_text = ''.join(ch for ch in clean_text if ch.isprintable() or ch in ['\n', '\t', '\r'])
        return json.loads(clean_text)

    except json.JSONDecodeError:
        logging.error('Failed to decode JSON input')
        return None
    except Exception as e:
        logging.error(f'Unexpected error in read_command: {str(e)}')
        return None

def write_response(response: Response) -> None:
    try:
        STD_OUTPUT_HANDLE = -11
        pipe = windll.kernel32.GetStdHandle(STD_OUTPUT_HANDLE)
        json_message = json.dumps(response) + '<<END>>'
        message_bytes = json_message.encode('utf-8')
        message_len = len(message_bytes)

        bytes_written = wintypes.DWORD()
        windll.kernel32.WriteFile(
            pipe,
            message_bytes,
            message_len,
            bytes_written,
            None
        )
    except Exception as e:
        logging.error(f'Failed to write response: {str(e)}')


def generate_failure_response(message: str = None) -> Response:
    response = {'success': False}
    if message:
        response['message'] = message
    return response


def generate_success_response(message: str = None, type: str = "message") -> Response:
    response = {'success': True}
    if message:
        response['message'] = message
        response['type'] = type
    return response


def execute_initialize_command() -> dict:
    logging.info('Initializing plugin')
    return generate_success_response('initialize success.')


def execute_shutdown_command() -> dict:
    logging.info('Shutting down plugin')
    return generate_success_response('shutdown success.')


def detect_calendar_events_request(params: dict = None, context: dict = None, system_info: dict = None) -> dict:
    try:
        logging.info('Detecting calendar events request')
        return generate_success_response(f"Detecting calendar events from date:", "calendar_event")
    except Exception as e:
        logging.error(f'Error detecting calendar event request: {e}')
        return generate_failure_response(str(e))

def summarize_emails_request(params: dict = None, context: dict = None, system_info: dict = None) -> dict:
    try:
        logging.info('Detecting summarize emails request')
        return generate_success_response(f"Summarize emails from date:", "summarize_email")
    except Exception as e:
        logging.error(f'Error detecting summarize emails request: {e}')
        return generate_failure_response(str(e))

def generate_labels_request(params: dict = None, context: dict = None, system_info: dict = None) -> dict:
    try:
        logging.info('Detecting generate labels request')
        return generate_success_response(f"Generate labels from date:", "generate_labels")
    except Exception as e:
        logging.error(f'Error detecting generate labels request: {e}')
        return generate_failure_response(str(e))


if __name__ == '__main__':
    main()
