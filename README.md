# Mapty Exercise Tracker

Basic javascript app used to enter and view cycling and running exercises on an openstreetmap/leafly map.

Based on Udemy JavaScript course https://www.udemy.com/course/the-complete-javascript-course/ by Jonas Schmedtmann, with CouchDB/PouchDB storage added. Node/npm installation is required.

## Running the App

Clone the repo and cd into it:
`git clone https://github.com/jimfellows/mapty-exercise-tracker.git`

To install npm dependencies:
`npm install package.json`

Install live-server
`npm install live-server -g`

Run live-server
`live-server`

## Local CouchDB Instance

I'm running a basic CouchDB instance in Docker for Windows.

1. Install [Docker for Windows](https://docs.docker.com/desktop/install/windows-install/)
2. CD to your desired directory for couch, and spin up [CouchDB docker container](https://hub.docker.com/_/couchdb):
   `docker run -d --name couch -p 5984:5984 -e COUCHDB_USER admin -e COUCHDB_PASSWORD admin couchdb:latest`
3. Create database "workouts" (you can do this via JS / Pouch)
4. Enable CORS in CouchDB by going to localhost:5984/\_utils, logging in with the admin:admin credentials, and creating a database named "workouts" in fauxton.

## TODOs

- Mount data directory for couch data
- Re-init workout classes from Couch JSON docs retrieved
