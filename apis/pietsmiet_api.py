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

        req = requests.get(
            "https://www.pietsmiet.de/api/v1/config/i",
            headers={"Accept": "application/json"},
        )
        if not req.ok:
            self.exit_req_not_ok(req)

        integrity = req.json().get("v")
        decoded = base64.b64decode(integrity).decode()
        return decoded

    def api_request(self, url: str):
        """
        Make api request and return json response
        """

        if not self.integrity:
            self.integrity = self.get_integrity()
        header = {"Accept": "application/json", "X-Origin-Integrity": self.integrity}
        req = requests.get(url, headers=header)
        if not req.ok:
            self.exit_req_not_ok(req)
        return req.json()

    def get_suggestions(self) -> dict:
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
                            "dislikes": 0,
                        }
                    suggestions[youtube_id]["count"] += 1
                    suggestions[youtube_id]["likes"] += suggestion["likes_count"]
                    suggestions[youtube_id]["dislikes"] += suggestion["dislikes_count"]

            page += 1
            if page > res["meta"]["last_page"]:
                break

        return suggestions

    def exit_req_not_ok(self, req):
        print("-" * 10, " REQUEST NOT OK ", "-" * 10)
        print("url:", req.url)
        print("integrity:", self.integrity)
        print("status code:", req.status_code)
        print("response text:", req.text)
        print("-" * 38)
        exit(1)
