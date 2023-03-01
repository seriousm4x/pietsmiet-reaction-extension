import argparse
import json

from apis.pietsmiet_api import Pietsmiet
from apis.youtube_api import YouTube


def main():
    parser = argparse.ArgumentParser()
    group_data_source = parser.add_mutually_exclusive_group(required=True)
    group_data_source.add_argument(
        "-a", "--api", help="youtube api key", type=str)
    args = parser.parse_args()

    # create youtube matches
    print("creating youtube matches ...")
    yt = YouTube()
    videos = yt.get_videos(args.api)
    matches = yt.create_matches(videos)
    with open("data/matches.min.json", "w", encoding="utf-8") as f:
        json.dump(matches, f)
    with open("data/matches.json", "w", encoding="utf-8") as f:
        json.dump(matches, f, indent=4)
    print(f"found {len(matches)} matches ...")

    # create pietsmiet suggestions
    print("creating pietsmiet suggestions ...")
    ps = Pietsmiet()
    suggestions = ps.get_suggestions()
    with open("data/suggestions.json", "w", encoding="utf-8") as f:
        json.dump(suggestions, f, indent=4)
    with open("data/suggestions.min.json", "w", encoding="utf-8") as f:
        json.dump(suggestions, f)
    print(f"found {len(suggestions)} suggestions ...")


if __name__ == "__main__":
    main()
