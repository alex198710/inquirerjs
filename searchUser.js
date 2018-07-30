const request = require('sync-request');
const PRIVATE_TOKEN = require('./config').PRIVATE_TOKEN;
const GITLAB_REST_API = require('./config').GITLAB_REST_API;

function extractUserId(name, users) {
    const term = name ? name.toLowerCase() : name;
    const userList = users.filter(u => {
        return u.name.toLowerCase().includes(term) || u.username.toLowerCase().includes(term);
    });
    if (userList.length > 0) {
        const user = userList[0];
        console.log(`Found user: ${user.name}, id: ${user.id}`);
        return user.id;
    } else {
        console.log("No user found");
    }
    return null;
}

function searchUser(name) {
    const res = request('GET', `${GITLAB_REST_API}/users?per_page=1000`, {
        headers: {
            'PRIVATE-TOKEN': PRIVATE_TOKEN,
            "content-type": "application/json",
        },
    });
    return extractUserId(name, JSON.parse(res.getBody('utf8')));
}

module.exports = {
    searchUser: searchUser
};