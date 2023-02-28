import re

import requests

from .vars import YOUTUBE_URL_PATTERN


def get_videos(yt_api_key: str) -> list:
    '''
    get all videos from youtube api
    '''

    url = f"https://www.googleapis.com/youtube/v3/playlistItems?playlist_id=UU3wla9xMoxDu7MIZImad1kQ&part=snippet&key={yt_api_key}&maxResults=50"
    videos = []
    nextPageToken = ""
    while True:
        if nextPageToken != "":
            req = requests.get(url + f"&pageToken={nextPageToken}")
        else:
            req = requests.get(url)
        if req.status_code != 200:
            print(req.text)
            exit(1)

        data = req.json()
        videos += data["items"]
        if data.get("nextPageToken"):
            nextPageToken = data["nextPageToken"]
        else:
            break

    return videos


def create_matches(videos: list) -> None:
    '''
    scans video description for youtube urls and writes them into "matches.json"
    '''

    matches = {}
    for video in videos:
        if not re.search(r"(?i)react", video["snippet"]["title"]) and not re.search(r"(?i)original-?video", video["snippet"]["description"]):
            continue
        r = re.findall(YOUTUBE_URL_PATTERN, video["snippet"]["description"])
        if not r:
            continue

        for match in r:
            org_video_id = match[0]
            d = {
                "reaction_id": video["snippet"]["resourceId"]["videoId"],
                "title": video["snippet"]["title"],
                "published_at": video["snippet"]["publishedAt"]
            }

            if not matches.get(org_video_id):
                matches[org_video_id] = []
            matches[org_video_id].append(d)

    return matches
