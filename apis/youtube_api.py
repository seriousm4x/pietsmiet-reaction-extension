import re

import requests

from .vars import YOUTUBE_URL_PATTERN


class YouTube:
    def __init__(self) -> None:
        # long ass list of reaction id's where there is a wrong link in the description
        self.false_positives = ["Cs6y1HLlEao", "cczIodA0y_k", "JETRkivjO7w", "xkxfIAVbrEo", "oLYe3rhmy_s", "MPvMQjm_7Fg",
                                "yBFB_WBIZzk", "csTjmSeGvpo", "b8KluqBegq4", "6ThAoI3j538", "ktz_NG-3Tw4", "20pWDSl0Mn4",
                                "TVRUcWU526w", "wo_WIRGq6P4", "O4tIxaOz1UI", "DLb9CgbYnCQ", "j4pMQAV_R7w", "KPCvKRT8qeA",
                                "YvOEQ3_d6Gs", "lJskR-8CP_w", "tPvTWR4utFk", "hR69OZhZc08", "-f5hto59ofs", "WrgOmucr6iU",
                                "Sr8X87HCSjg", "4F8d8WfD_P4", "qXpTKfroO6s", "hNypQSMwMVk", "-7SaKC-lC-k", "Kg5elzybcWU",
                                "7qVqOrBe-yk", "S_bz4Mtf7yI", "cSJQHbP9hQc", "RTNQSp7X-Xo", "QHLjyIm_lsI", "bdMQhTaX2rM",
                                "pfeUrQ-nERw", "U9Ad35I_3dk", "mbS7a3rUtGM", "tPvTWR4utFk", "3zJpiz3a1I4", "m7l8PfKlADw",
                                "miPQ2Wiyinc", "LFetr2967nI", "_mKmjkdwJ2o", "GG4oWHEgMks", "K5xClCcyP50", "SPEK5hiCgzo",
                                "2gs99pHeZUc", "elG7eiz9jUA", "WGMjtXJ5dIU", "ZFOglix3mXs", "FJqnezGQ4-g", "2UY6A0ECcCM",
                                "pwZmE0d1FAw", "sp8sHf0SDIo", "6Lb5y9v0NW0", "lOoFHxexPWs", "yPXHWhAiVgM", "b-AeI_Lzfyg",
                                "P_bXjZglrAA", "xMkNpe9rrno", "0DnRysYV7QE", "qXfJEU0d21E", "a6bq-8PHKuI", "wTp_-dPcGsE",
                                "wHGRh1Pkhr0", "FxOEfuRyZr4", "5xrV6h9RmQ0", "ClmU_17H02A", "6Xm7XEmo_ao", "iDW2SwIm1II",
                                "MU2i4_pA9Nc", "x6sZKLxN304", "N_mPDxab344", "jq_SYeOfu2c", "Upr6riE8H94", "m0r7NKyhjC0",
                                "a-bGWVGFl4s", "VgbzP9NeckY", "KKATnAMDXpw", "Wl0WwlKMOFs", "hopv0Q7CNk8", "H5dV8YcQIRs",
                                "ty67kjRq-x4", "ULJJvn4b2ss", "kev7baQgajM", "zgn1GEURM_8"]

    def get_videos(self, yt_api_key: str) -> list:
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

    def create_matches(self, videos: list) -> None:
        '''
        scans video description for youtube urls and writes them into "matches.json"
        '''

        matches = {}
        for video in videos:
            # wrong link in description
            if video["snippet"]["resourceId"]["videoId"] in self.false_positives:
                continue

            if not re.search(r"(?i)react", video["snippet"]["title"]) and not re.search(r"(?i)original-?video", video["snippet"]["description"]):
                continue
            r = re.findall(YOUTUBE_URL_PATTERN,
                           video["snippet"]["description"])
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
