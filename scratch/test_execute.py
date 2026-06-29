import requests
import json

url = "http://127.0.0.1:8000/api/execute"
payload = {
    "command": "echo 'Hello from CommandHub'",
    "shell_type": "powershell"
}

headers = {
    'Content-Type': 'application/json'
}

response = requests.post(url, headers=headers, data=json.dumps(payload), stream=True)

print("Status Code:", response.status_code)
for chunk in response.iter_content(chunk_size=1024):
    if chunk:
        print(chunk.decode('utf-8'), end='')
