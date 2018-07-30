const fuzzy = require('fuzzy');
const config = require('./config');
const PRIVATE_TOKEN = config.PRIVATE_TOKEN;
const GITLAB_REST_API = config.GITLAB_REST_API;
const axios = require('axios');
axios.defaults.headers.common['PRIVATE-TOKEN'] = PRIVATE_TOKEN;

function searchBranch(answers, input, project) {
    input = input || '';
    return new Promise(function(resolve) {
        let fullurl = `${GITLAB_REST_API}/projects/${project.id}/repository/branches?search=${input}`;
        axios.get(fullurl)
            .then(response => {
                let branches = response.data.map(c => c.name);
                //resolve(branches);
                let fuzzyResult = fuzzy.filter(input, branches);
                resolve(
                    fuzzyResult.map(function(el) {
                        return el.original;
                    })
                );
            })
            .catch(error => {
                resolve([]);
            });
    });
}

module.exports = {
    searchBranch: searchBranch
};