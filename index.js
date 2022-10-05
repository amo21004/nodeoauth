const express = require('express');

const app = express();

app.use(express.json());

require('dotenv').config();

const port = process.env.PORT || 3000;

app.listen(port);

const cors = require('cors');

app.use(cors());

const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

const github_auth_url = 'https://github.com/login/oauth/authorize?client_id=';

const axios = require('axios');

app.get('/oauth-callback', async (request, response) => {
    const code = request.query.code;

    const body = {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
    };

    const options = {
        headers: {
            accept: 'application/json'
        }
    };

    console.log('Step 2: Performing post request on https://github.com/login/oauth/access_token');

    await axios.post('https://github.com/login/oauth/access_token', body, options).then(_response => _response.data.access_token).then(access_token => {
        if (!access_token) {
            return;
        }

        console.log('Step 3: Access Token received. Redirecting to: http://localhost:3000/success?access_token=' + access_token);

        return response.redirect('http://localhost:3000/success?access_token=' + access_token);
    });

    response.send();
});

app.get('/auth', (request, response) => {
    console.log('Step 1: Redirecting user to: ' + github_auth_url + process.env.GITHUB_CLIENT_ID);

    response.redirect(github_auth_url + process.env.GITHUB_CLIENT_ID);
});

app.get('/success', async (request, response) => {
    const access_token = request.query.access_token;

    const result = await axios({
        method: 'get',
        url: 'https://api.github.com/user',
        headers: {
            Authorization: 'token ' + access_token
        }
    }).then(_response => {
        return {
            status: _response.status,
            message: _response.statusText,
            data: _response.data
        };
    }).catch(error => {
        return {
            status: error.response.status,
            message: error.message
        };
    });

    response.status(result.status).send(result);
});