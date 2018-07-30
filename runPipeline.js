const axios = require('axios');
const config = require('./config');
axios.defaults.headers.common['PRIVATE-TOKEN'] = config.PRIVATE_TOKEN;
const GITLAB_REST_API = config.GITLAB_REST_API;

function runPipeline(project, branch) {
    axios.post(`${GITLAB_REST_API}/projects/${project.id}/pipeline?ref=${branch}`)
        .then(response => {
            if (response.status === 201) {
                console.log("Running pipeline for project " + project.name + " on branch " + branch);
            } else {
                console.log(`${response.status} - ${response.statusText}`);
            }
        })
        .catch(error => {
            console.log(error);
        });
}

module.exports = {
    runPipeline: runPipeline
};