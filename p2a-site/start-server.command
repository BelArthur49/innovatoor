#!/bin/bash
cd "$(dirname "$0")"
echo "Starting local server at http://localhost:8000/map.html"
echo "Press Control+C to stop."
python3 -m http.server 8000 || python -m http.server 8000
