const request = require('sync-request');
const PRIVATE_TOKEN = require('./config').PRIVATE_TOKEN;
const GITLAB_REST_API = require('./config').GITLAB_REST_API;

function extractProject(projectName, projects) {
    const projectList = projects.filter(u => {
        return u.name.toLowerCase() === projectName;
    });
    if (projectList.length > 0) {
        const project = projectList[0];
        console.log(`Found project: ${project.name}, id: ${project.id}`);
        return project;
    } else {
        console.log("No project found");
    }
    return null;
}

function searchProject(projectName) {
    const project = searchFullProject(projectName);
    return project ? project.id : null;
}

function searchFullProject(projectName) {
    const res = request('GET', `${GITLAB_REST_API}/projects?search=${projectName}`, {
        headers: {
            'PRIVATE-TOKEN': PRIVATE_TOKEN,
            "content-type": "application/json",
        },
    });
    return extractProject(projectName, JSON.parse(res.getBody('utf8')));
}

function searchProjectInquirer(answers, input) {
    input = input || '';
    return new Promise(function(resolve) {
        if (input && input.length < 3) {
            console.log("\x1b[31m\n3 caracters minimum !");
            resolve([]);
        }
        let fullurl = `${GITLAB_REST_API}/projects?search=${input}&order_by=name&sort=asc`;
        axios.get(fullurl)
            .then(response => {
                /*
                name (to display in list), a value (to save in the answers hash) and a short (to display after selection) properties
                */
                let projects = response.data.map(c => {
                    return {
                        name: c.name,
                        value: {
                            id: c.id,
                            name: c.name
                        },
                        short: c.name
                    }
                });
                resolve(projects);
            })
            .catch(error => {
                resolve([]);
            });
    });
}

function searchProtectedBranches(projectName) {
    const projectId = searchProject(projectName);
    const res = request('GET', `${GITLAB_REST_API}/projects/${projectId}/protected_branches`, {
        headers: {
            'PRIVATE-TOKEN': PRIVATE_TOKEN,
            "content-type": "application/json",
        },
    });
    return JSON.parse(res.getBody('utf8'));
}

module.exports = {
    searchProject: searchProject,
    searchFullProject: searchFullProject,
    searchProjectInquirer: searchProjectInquirer,
    searchProtectedBranches: searchProtectedBranches
};

//console.log(searchFullProject(process.argv[2]));
//console.log(searchProtectedBranches(process.argv[2]));