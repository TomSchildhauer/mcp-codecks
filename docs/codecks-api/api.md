# Quick Guide to Codecks API

*Version: Aug 2023 (beta)*

Open the [API Reference](/api-reference/) for a full overview of the models, their fields and their relations.

The Codecks API is the source for powering the web app, so expect it to be fairly stable and expansive. We can’t yet make any guarantees regarding the stability of all schema definitions and endpoints at this point. So tread with care!

To get started you need to extract your access token. **This token will allow anyone who holds it to impersonate you**. This also means they have access to all the same Organizations and contents as you do via the web app. So be careful who you share it with. You might want to create an observer user and use their token if this helps your use case (and the observer limitations suit your use case) you might also create a new non-observer user but this will count towards your user quota.

To extract the token, check requests going to the codecks api ([https://api.codecks.io](https://api.codecks.io)). There you’ll find a cookie called `at` containing your token.

> Note: we’ve changed the token handling in January 2021, if your login session is older than that you need to logout and login again to find this cookie.

Visit our [Community Hub](https://www.codecks.io/community/) to see examples of how to integrate with Codecks.

## Reading Data

This token and the subdomain of your organization should be all you need to do our first request:

```
curl 'https://api.codecks.io/' \
  -H 'X-Account: [SUBDOMAIN]' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-Token: [TOKEN]' \
  --data-binary '{"query":{"_root":[{"account":["name"]}]}}'
```

(if your organization is on `team123.codecks.io` the `[SUBDOMAIN]` value should be `team123`)

This should return the name of your organization (= `account`). Note that there is only this single endpoint for getting information. Use the `"query"` portion to create a nested graphql-like request to get whatever data however deeply nested is required.

I won’t go into all details but here’s some helpful queries to give you an idea of whats possible:

**return all cards with their titles within your account (aka organization)**

```
{"_root": [{"account": [{"cards": ["title"]}]}]}
```

**return all cards with their title whose title contains `[SEARCHTERM]`**

```
{
  "_root": [
    {
      "account": [
        {"cards({\"title\":{\"op\":\"contains\",\"value\":\"[SEARCHTERM]\"}})": ["title"]}
      ]
    }
  ]
}
```

**return 10 cards from deck `123` ordered by creation date**

```
{"_root":[
  {"account":[{"cards({"deckId": 123, "$order": "createdAt", "$limit": 10})":["title"]}]}
]}
```

**equivalent to:**

```
{"deck(123)":{
  "cards({"$order": "createdAt", "$limit": 10})":["title"]
}}
```

**return all cards with an effort \> 5 or effort \<= 1**

```
{"_root":[
  {"account":[{"cards(
    {\"$or\": [
      {\"effort\": {\"op\": \"gt\", \"value\": 5}},
      {\"effort\": {\"op\": \"lte\", \"value\": 1}}
    ]}
  )":["title"]}]
}
```

to get more ideas of what’s doable, check the “network” tab in your browser dev tools and see which queries are triggered when opening a specific part of the app.

## Writing data

Again, I won’t provide a full reference of available actions. The most helpful thing would be to perform the desired action in the web app and use the network tab in your dev tools to check which `/dispatch/` endpoint was triggered.

Here’s an example for creating a card:

```
curl 'https://api.codecks.io/dispatch/cards/create' \
  -H 'X-Auth-Token: [TOKEN]' \
  -H 'X-Account: [SUBDOMAIN]' \
  -H 'Content-Type: application/json' \
  --data-binary '{"assigneeId":null,"content":"My card content","putOnHand":true,"deckId":null,"milestoneId":null,"masterTags":[],"attachments":[],"effort":12,"priority":"b","childCards":[],"userId":"[YOUR-USER-ID]"}'
```

This would create a card on your hand and return the id.

## Restrictions

A single IP may perform 40 requests every 5 seconds before being rate-limted.

## Example Snippets

Do you have a script or snippet you’d like to share? Feel free to get [in touch with us](mailto:hello@codecks.io)!

#### Add file to card (python)

```
import os
import requests
import mimetypes

def add_file_to_card(filepath, card_id, user_id, subdomain, token):
    content_type = mimetypes.guess_type(filepath)[0]
    file_size = os.path.getsize(filepath)
    filename = os.path.basename(filepath)

    headers = {
        'X-Account': subdomain,
        'X-Auth-Token': token,
    }

    # request s3 upload details
    response = requests.get("https://api.codecks.io/s3/sign?objectName=%s" % filename, headers=headers)
    response.raise_for_status()
    u = response.json()

    # upload file
    files = [('file', (filename, open(filepath, 'rb'), content_type))]
    payload = u['fields']
    payload["Content-Type"] = content_type
    requests.request("POST", u['signedUrl'], headers=headers, data=payload, files=files)

    # update card
    requests.request("POST", "https://api.codecks.io/dispatch/cards/addFile", headers=headers, json={
        "cardId": card_id,
        "userId": user_id,
        "fileData": {
            "fileName": filename,
            "url": u['publicUrl'],
            "size": file_size,
            "type": content_type,
        }
    })
```
