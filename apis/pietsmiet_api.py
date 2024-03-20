import base64
import json
import re

import requests

from .vars import YOUTUBE_URL_PATTERN


class Pietsmiet:
    def __init__(self) -> None:
        self.integrity = ""

    def get_integrity(self) -> str:
        """
        Get custom integrity header value for api requests
        """

        html_text = requests.get(
            "https://www.pietsmiet.de/community/suggestions").text
        r = re.findall(r"(?:window._i.*)({.*})", html_text)
        if r:
            integrity = json.loads(r[0])
            decoded = base64.b64decode(integrity["v"]).decode()
            return decoded

    def api_request(self, url: str):
        """
        Make api request and return json response
        """

        if not self.integrity:
            self.integrity = self.get_integrity()
        header = {
            "Accept": "application/json",
            "X-Origin-Integrity": self.integrity
        }
        req = requests.get(url, headers=header)
        if not req.ok:
            print("-"*10 ," REQUEST NOT OK ", "-"*10)
            print("url:", req.url)
            print("integrity:", self.integrity)
            print("status code:", req.status_code)
            print("response text:", req.text)
            print("-"*38)
            exit(1)
        return req.json()

    def get_suggestions(self) -> list:
        """
        build final dict for suggestions
        """

        suggestions = {}
        url = "https://www.pietsmiet.de/api/v1/community/suggestions?limit=100&order=latest&statuses[]=open&statuses[]=evaluation&page="
        page = 1
        while True:
            res = self.api_request(url + str(page))
            for suggestion in res["data"]:
                if not suggestion["url"]:
                    continue

                r = re.match(YOUTUBE_URL_PATTERN, suggestion["url"])
                if r:
                    youtube_id = r.groups()[0]
                    if not suggestions.get(youtube_id):
                        suggestions[youtube_id] = {
                            "count": 0,
                            "likes": 0,
                            "dislikes": 0
                        }
                    suggestions[youtube_id]["count"] += 1
                    suggestions[youtube_id]["likes"] += suggestion["likes_count"]
                    suggestions[youtube_id]["dislikes"] += suggestion["dislikes_count"]

            page += 1
            if page > res["meta"]["last_page"]:
                break

        return suggestions
