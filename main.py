import json
import re
import argparse

import requests


def get_videos(yt_api_key: str) -> list:
    '''
    get all videos from youtube api and save as "youtube.json"
    '''

    print("requesting videos from youtube...")
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

    print("writing youtube.json ...")
    with open("data/youtube.json", "w", encoding="utf-8") as f:
        json.dump(videos, f, indent=4)

    return videos


def create_matches(videos: list) -> None:
    '''
    scans video description for youtube urls and writes them into "matches.json"
    '''

    print("finding matches ...")
    matches = {}
    for video in videos:
        if not re.search(r"(?i)react", video["snippet"]["title"]):
            continue
        r = re.search(
            r"(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})", video["snippet"]["description"])
        if r:
            org_video_id = r.groups()[0]
            matches[org_video_id] = {
                "reaction_id": video["snippet"]["resourceId"]["videoId"],
                "title": video["snippet"]["title"],
                "published_at": video["snippet"]["publishedAt"]
            }

    print("writing matches.min.json ...")
    with open("data/matches.min.json", "w", encoding="utf-8") as f:
        json.dump(matches, f)

    print("writing matches.json ...")
    with open("data/matches.json", "w", encoding="utf-8") as f:
        json.dump(matches, f, indent=4)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-a", "--api", help="youtube api key",
                        type=str, required=True)
    args = parser.parse_args()

    # videos = get_videos(args.api)
    with open("data/youtube.json", "r", encoding="utf-8") as f:
        videos = json.load(f)
    create_matches(videos)


if __name__ == "__main__":
    main()
