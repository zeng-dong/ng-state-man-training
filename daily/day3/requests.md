
# Get the Prefs

```http
GET http://localhost:5261/patrons/p029/prefs

```


## Update

```http
PUT http://localhost:5261/patrons/p029/prefs
Content-Type: application/json
if-match: "0"

{
    "homeBranch":"Tacos",
    "hideReviews": true
}
```
