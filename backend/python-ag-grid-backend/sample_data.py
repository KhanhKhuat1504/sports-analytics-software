tables = {
    "players": {
        "columns": [
            {"headerName": "ID", "field": "id", "editable": False},
            {"headerName": "Name", "field": "name"},
            {"headerName": "Team", "field": "team"},
            {"headerName": "Position", "field": "position"},
        ],
        "rows": [
        ],
    },
    "matches": {
        "columns": [
            {"headerName": "Date", "field": "date"},
            {"headerName": "Home", "field": "home"},
            {"headerName": "Away", "field": "away"},
            {"headerName": "Score", "field": "score"},
        ],
        "rows": [
            {"date": "2024-01-01", "home": "Lakers", "away": "Warriors", "score": "102-99"},
        ],
    },
    "performance": {
        "columns": [
            {"headerName": "Player", "field": "player"},
            {"headerName": "Points", "field": "points"},
            {"headerName": "Assists", "field": "assists"},
        ],
        "rows": [
            {"player": "LeBron James", "points": 28, "assists": 8},
        ],
    },
}