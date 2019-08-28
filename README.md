# MyMDb
Find movies. Now.

TODO I need to do a full rewrite of MyMDb.
I should base the new app off of the Surfy backend.
I can keep a lot of the frontend code (especially the css as well as code that interfaces with OMDb), but I should start using React and I should use basically the same setup as I'm using for Surfy.
After I'm done rewriting MyMDb, I should add all of the features I've recorded in the Things app on my iPhone, and I should change the documentation below to reflect the final structure.


-----------


## Django Server (`backend`)
The Surfy Django Server (found in the `backend` directory) is a basic Django server written to do three things:
1. Crawl and parse mediabiasfactcheck.com to create the data needed for the Surfy Browser Extension.
2. Serve the landing page of the Surfy website (purely an informational site).
3. Support the crowdsourcing features of the Surfy Browser Extension via a private API.

The file structure in `backend` follows standard Django practices. An important thing to note is that the crawling and data-generation functionality (#1 above) of the app is fully contained in the files in `backend/surfy/management/commands`. The output of the generator_scores command and the package_scores command go into `backend/surfy_scores.txt` and `backend/surfy_scores.js`, respectively. `surfy_scores.js` contains the same data as `surfy_scores.txt`, but the data is reformatted so that it can be more easily used by the Surfy Browser Extension.


### Installation
First, make sure you have both Python 3, pip, and postgresql installed (on Mac, run `$ brew install postgres`). Then, navigate to the `backend` directory and run:
```zsh
    $ pip3 install venv   # On Ubuntu, run `apt-get install python3-venv`
    $ python3 -m venv env
    $ source env/bin/activate   # Enters the virtual environment
    $ pip3 install -r requirements.txt
```

#### Entering/exiting the virtual environment
To enter the virtual environment, run `$ source env/bin/activate`.
To exit the virtual environment, simply run `$ deactivate`.


#### Troubleshooting
+ `$ python manage.py runserver` will report a SyntaxError if your virtual environment is using Python 2 instead of Python 3. Type `$ python3 manage.py runserver` instead. Alternatively, dleting and re-creating the `env` directory using the command ``$ python3 -p `which python3` env`` might fix this issue.
+ When running `$ pip3 install -r requirements.txt` on Ubuntu, `psycopg2` might throw an error. You can fix this by running
```
sudo apt-get install postgresql
sudo apt-get install python-psycopg2
sudo apt-get install libpq-dev
```
+ `$ pip3 install -r requirements.txt` might fail if `wheel` isn't installed. If this happens, just install `wheel` via `$ pip3 install wheel`.


### Development

#### Crawling mediabiasfactcheck.com
To crawl mediabiasfactcheck.com, run: `$ python3 manage.py generate_scores`
By default, the crawler will ignore websites for which we already have data. However, to force a full recrawl, you can run: `$ python3 manage.py generate_scores --recrawl`. For development, you can limit the number of websites examined by passing the `--limit` parameter: `python3 manage.py generate_scores --limit 50`.
*The crawler stores the data it collects in `backend/surfy_scores.txt`.


#### Re-packaging the data
To re-package the raw reliability data for use in the Surfy Browser Extension, run `$ python3 manage.py package_scores`
This command creates a javascript file `backend/surfy_scores.js`, which exports a single function `getSurfyScores` as well as three constants: `SITE_TYPE_CONSTANTS`, `FACTUALITY_CONSTANTS`, and `LEAN_CONSTANTS`. See `surfy_scores.js` for more details.


#### Initializing the database (Mac -- for Ubuntu, see below)
*Still a work in progress, I might turn this into a bash script*
1. First, make sure Postgres is installed (`$ brew install postgres`).
2. To initialize Postgres, run `$ initdb /usr/local/var/postgres`
3. To start the Postgres server, run `$ pg_ctl -D /usr/local/var/postgres start`
4. To create the database, run `$ createdb surfy`
5. To enter the Postgres shell, run `$ psql surfy`
6. In the Postgres shell, create an admin user by typing `CREATE USER admin WITH PASSWORD 'admin';` Replace `admin` and `admin` with a secure username/password combination, and set both as environment variables: SURFY_DB_USERNAME, SURFY_DB_PASSWORD. Set another environment variable, SURFY_DB_NAME to `surfy` or whatever you typed in step 4. For development, I prefer to set these in ~/.zshrc or ~/.bashrc so they set themselves automatically whenever I open up a new terminal window. For production, set these in `backend/surfy/wsgi.py`.
7. After creating the `surfy` database, run `python3 manage.py makemigrations` then `python3 manage.py migrate`.
8. Then, create a Django superuser (i.e. an account with access to the Django admin dashboard, different from the Postgres admin account) by typing `python3 manage.py createsuperuser` and following the prompts.
9. Finally, run `python3 manage.py put_scores_in_db` to populate the database with the Surfy scores.
10. If you desire (you probably do), run `python3 manage.py autogenerate_user_ratings --number 10` to generate ten true user ratings for each website for which we already have a score (doing so prevents the first people who rate websites from having an outsized influence on the initial crowdsourced rating).


#### Starting the server for development
1. Make sure the SMS server is properly configured (see the `SMS Server` section below). If it isn't, the verification-via-text system will not work.
2. If you want to work on the website's front end, make sure the react stuff is set up (run `$ npm install`). For development, the Django server (which runs on port 8000) simply proxies to the react server running on port 3000.
3. If you're going to be using HTTPS, make sure to add `backend/ssl/dev/localhost.pem` to the list of known certificates. You can do so on macOS via `sudo security add-trusted-cert -k /Library/Keychains/System.keychain -d ./ssl/dev/localhost.pem`
5. Finally, make sure you've started the Postgres database via `$ pg_ctl -D /usr/local/var/postgres start`. The database will remain active forever unless you restart your computer.
6. Now, to start the Django server in http mode, run `$ ./run-http-server.sh`. Use this for normal development.
7. To start the Django server in https mode, run `$ ./run-https-server.sh`. Note that the `react-frontend` won't autoreload in https mode.



### Production
For production, make sure you've configured and started three things: the Postgres database, the Redis server, and the SMS server. Finally, make sure you've built the react-frontend via `$ cd backend` then `$ ./build-reach-frontend.sh`. The Django backend will automatically serve the files generated and collected by the `./build-react-frontend.sh` script. Once these four pieces are in place, just make sure you've set SURFY_KEY, SURFY_DB_NAME, SURFY_DB_USERNAME, SURFY_DB_PASSWORD, SURFY_MAIL_USERNAME, and SURFY_MAIL_PASSWORD in `backend/surfy/wsgi.py`, and make sure you've generated a valid SSL certificate via `certbot` and `letsencrypt`; make sure the certificate location matches that specified in `mainserver.sites.conf`. Then, restart Apache via `sudo service apache2 restart`. If you're using a separate server for the DB, change the necessary configuration details in `backend/surfy/settings.py`.

Note that since the current server is so small, it can't build the react-frontend, so you'll have to run npm build on another machine then copy the files onto the server via `$ sudo scp -i <path-to-key.pem> -r ~/Programs/jeffnet/surfy/backend/react-frontend/build ubuntu@ec2-54-201-26-7.us-west-2.compute.amazonaws.com:/home/ubuntu/surfy/backend/react-frontend`


#### Building the react-frontend
1. To install dependencies, cd into `react-frontend` and run `$ npm install`.
2. Then, cd into `backend` and simply run `$ /build-react-frontend.sh`
3. To test that the production frontend works correctly, simply run `$ ./run-https-server.sh` from the `backend` directory.

*Note that since the current server is so small, it can't build the react-frontend, so you'll have to run npm build on another machine then copy the files onto the server with something like `$ sudo scp -i <path-to-key.pem> -r ~/Programs/jeffnet/surfy/backend/react-frontend/build ubuntu@ec2-54-201-26-7.us-west-2.compute.amazonaws.com:/home/ubuntu/surfy/backend/react-frontend`. Then SSH into the server and run `$ /build-react-frontend.sh` and `sudo service apache2 restart` to restart Apache.


#### Setting up the production database (Ubuntu)
*(Still a work in progress, I might turn this into a bash script; I'll probably also set the database up on a separate server if it grows)*
1. First, make sure Postgres is installed (`$ sudo apt-get install postgresql postgresql-contrib`).
2. Then, log in as the default Postgres user via `$ sudo -i -u postgres`.
3. To create a new Postgres user, run `$ createuser --interactive` while logged in as the `postgres` user. Name the new user `surfy`.
4. Remaining logged in as the `postgres` user, create the `surfy` database by typing `$ createdb surfy`.
5. Now, switch back to the default user by typing `$ exit`.
6. Create a new Ubuntu user named `surfy` by running `$ sudo adduser surfy` while logged in as the default Ubuntu user. The `surfy` user will have the proper database permissions (I think because we created a Postgres user named `surfy` above?). Type `sudo -i -u surfy` to switch to the `surfy` user. As the `surfy` user, you can now type `psql` to enter the Postgres shell.
7. Open `backend/surfy/apache/wsgi.py` and set the environment variables SURFY_DB_NAME, SURFY_DB_USERNAME, and SURFY_DB_PASSWORD. SURFY_DB_NAME and SURFY_DB_USERNAME should be equal to `surfy` (per step 3 above) and SURFY_DB_PASSWORD should be whatever you set `surfy`'s password to.
8. Now that you've set up Postgres, get it ready for the backend to use by `cd`ing to `backend`, entering the virtual environment, then running `$ python3 manage.py makemigrations` and `$ python3 manage.py migrate`.
9. Then, create a Django superuser (i.e. an account with access to the Django admin dashboard, different from the Postgres admin account) by typing `$ python3 manage.py createsuperuser` and following the prompts.
10. Finally, run `$ python3 manage.py put_scores_in_db` to populate the database with the Surfy scores.
11. If you desire (you probably do), run `$ python3 manage.py autogenerate_user_ratings --number 10` to generate ten true user ratings for each website for which we already have a score (doing so prevents the first people who rate websites from having an outsized influence on the initial crowdsourced rating).


#### Generating the SSL Certificate for production
Simply run `$ sudo certbot certonly --apache` and follow the instructions. You might (but probably won't) need to change `mainserver.sites.conf` so that it points to the generated keys (which certbot puts in `/etc/letsencrypt/live` by default).


-----------


## SMS Server (`sms-server`)
The SMS server is based on the `textbelt` open source project and handles all outgoing text messages for the Django server's verification-via-text system. The SMS server runs locally on port 9090.


### Installation & Configuration
1. First, cd into `sms-server` and run `npm install`.
2. Install redis (on Mac: `$ brew install redis`, on Ubuntu: `$ sudo apt-get install redis-server`). For production, make redis start on boot via `$ sudo systemctl enable redis-server.service`. If you're installing redis for the first time, make any necessary configuration changes and then restart redis via `$ sudo systemctl restart redis-server.service`. You can test that the redis-server is running via `$ redis-cli ping`. Redis will say `PONG` if it's running.
3. Make sure the configuration information in `sms-server/lib/config.js` is correct.

*For more information on how the SMS server works, see `sms-server/README.md`.*


#### Adding credentials for the SMS messaging system
The SMS messaging library that we use requires credentials for the Surfy email account. These credentials need to be set via the environment variables `SURFY_MAIL_USERNAME` and `SURFY_MAIL_PASSWORD`. I prefer to set these in ~/.zshrc or ~/.bashrc so they set themselves automatically when I open up a new terminal window. Contact JeffreyTerry for these credentials or, for development, you can also use an email account of your own. For production, set these credentials in `backend/surfy/wsgi.py`.


### Running the SMS server
+ For development, the `./run-*-server.sh` scripts will automatically run the SMS server.
+ For production, run app.js via `$ forever start server/app.js`.
