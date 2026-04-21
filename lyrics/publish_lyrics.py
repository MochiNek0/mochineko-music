import json
import hashlib
import urllib.request
import urllib.error
import time

def solve_challenge(prefix, target):
    print(f"Solving challenge: prefix={prefix}, target={target}")
    nonce = 0
    while True:
        s = prefix + str(nonce)
        h = hashlib.sha256(s.encode()).hexdigest()
        if h < target:
            print(f"Found nonce: {nonce}")
            return str(nonce)
        nonce += 1
        if nonce % 100000 == 0:
            print(f"Searching... current nonce: {nonce}")

def publish_lyrics():
    # Get the directory where the script is located
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # 1. Read lyrics_publish.json
    json_path = os.path.join(base_dir, 'lyrics_publish.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        lyrics_data = json.load(f)

    # 1.1 Ensure keys exist for the API
    lyrics_data.setdefault('plainLyrics', "")
    lyrics_data.setdefault('syncedLyrics', "")

    # 1.2 Read from .lrc files if they exist
    plain_lrc_path = os.path.join(base_dir, 'plain_lyrics.lrc')
    if os.path.exists(plain_lrc_path):
        with open(plain_lrc_path, 'r', encoding='utf-8') as f:
            lyrics_data['plainLyrics'] = f.read().strip()
    
    synced_lrc_path = os.path.join(base_dir, 'synced_lyrics.lrc')
    if os.path.exists(synced_lrc_path):
        with open(synced_lrc_path, 'r', encoding='utf-8') as f:
            lyrics_data['syncedLyrics'] = f.read().strip()

    # 2. Request challenge
    print("Requesting challenge...")
    req = urllib.request.Request('https://lrclib.net/api/request-challenge', method='POST')
    with urllib.request.urlopen(req) as response:
        challenge = json.loads(response.read().decode())
    
    prefix = challenge['prefix']
    target = challenge['target']

    # 3. Solve challenge
    nonce = solve_challenge(prefix, target)
    token = f"{prefix}:{nonce}"

    # 4. Publish lyrics
    print(f"Publishing lyrics for {lyrics_data['trackName']} ({lyrics_data['duration']}s)...")
    headers = {
        'Content-Type': 'application/json',
        'X-Publish-Token': token,
        'User-Agent': 'MochiNek0-Music/1.0.0 (https://github.com/MochiNek0/mochineko-music)'
    }
    
    req = urllib.request.Request(
        'https://lrclib.net/api/publish',
        data=json.dumps(lyrics_data).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = response.read().decode()
            print("Successfully published!")
            print(f"Response: {result}")
    except urllib.error.HTTPError as e:
        print(f"Error publishing: {e.code} {e.reason}")
        print(e.read().decode())

if __name__ == "__main__":
    publish_lyrics()
