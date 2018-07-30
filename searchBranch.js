const fuzzy = require('fuzzy');

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