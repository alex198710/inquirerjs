'use strict';

const inquirer = require('inquirer');
const fuzzy = require('fuzzy');
const axios = require('axios');
const cherryPick = require('./testCherry-pick');

const version = require('./convertNumToAlphaVersion');
const jira = require('./getJiraPatchVersion');
const jiraComment = require('./addJiraComment');

const config = require('./config');
axios.defaults.headers.common['PRIVATE-TOKEN'] = config.PRIVATE_TOKEN;
const GITLAB_REST_API = config.GITLAB_REST_API;
const RELEASED_VERSIONS_REST_API = config.RELEASED_VERSIONS_REST_API;

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const JIRA_MODE = "Get/Publish a Jira version table";
const LUCKY_MODE = "Do a lucky merge request";
const CHERRY_MODE = "Do only a cherry pick";
const MERGE_MODE = "Do only a merge request";
const PIPELINE_MODE = "Run a pipeline";

let versions = null;
axios.get(RELEASED_VERSIONS_REST_API)
.then(response => {
    let lastVersions = {};
    for (let i = 0; i < 2; i++) {
        lastVersions[response.data[i]] = null;
    }
    for (let i = 2; i < response.data.length && Object.keys(lastVersions).length < 9; i++) {
        const v = response.data[i];
        const split = v.split("-")[0].split(".");
        if (split.length === 3) {
            const fixVersion = +split.pop();
            const majorMinor = split.join(".");
            if (!Object.keys(lastVersions).includes(majorMinor)) {
                lastVersions[majorMinor] = fixVersion;
            } else if (lastVersions[majorMinor] < fixVersion) {
                lastVersions[majorMinor] = fixVersion;
            }
        }
    }
    versions = Object.keys(lastVersions).map(key => {
        if (lastVersions[key]) {
            return `${key}.${version.convertNumber(lastVersions[key])}`;
        }
        return key;
    });
});


function searchProject(answers, input) {
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

function chooseProject(onChoose) {
    askAsyncQuestion("Which project ?", searchProject, onChoose);
}

function enterHashCommit(onEnter) {
    askSimpleQuestion("What's the merge commit hash ?", onEnter);
}

function chooseSourceBranch(project, onChoose) {
    askAsyncQuestion("From which branch ?", (answers, input) => searchBranch(answers, input , project), onChoose);
}

function chooseDestinationBranch(project, onChoose) {
    askAsyncQuestion("On which branch ?", (answers, input) => searchBranch(answers, input , project), onChoose);
}

function enterJiraKey(onEnter) {
    askSimpleQuestion("What's the JIRA number ?", onEnter);
}

function enterUsername(onEnter) {
    askSimpleQuestion("What's your JIRA username ?", onEnter);
}

function enterPassword(onEnter) {
    askSimpleQuestion("What's your JIRA password ?", onEnter, true);
}

function runJiraMode() {
    inquirer.prompt([{
        type: 'checkbox',
        name: 'data',
        message: "Which versions ?",
        choices: versions,
        default: versions
    }]).then(response => {
        const table = "Corrigé dans les versions suivantes:\n" + jira.formatPatchVersions(response.data);
        askYesNo("Do you want to publish it ?", () => {
            enterJiraKey(jiraKey => {
                enterUsername(usr => {
                   enterPassword(pwd => {
                       jiraComment.addJiraComment(jiraKey, table, usr, pwd);
                       console.log(table + "\n" + "The table has been published to Jira number " + jiraKey);
                   });
                });
            });
        }, () => {
            console.log(table);
        });
    });
}

function runLuckyMode() {
    chooseProject(p => {
        enterHashCommit(h => {
            chooseDestinationBranch(p, b => {
                console.log("Launching lucky merge : Magic Cherry-pick + Magic Merge request ");
                cherryPick.makeAwesomeCherryPick(p.name, h, b);
            });
        });
    });
}

function runCherryMode() {
    chooseProject(p => {
        enterHashCommit(h => {
            chooseDestinationBranch(p, destBranch => {
                console.log("Creating magic cherry pick only");
                cherryPick.makeAndPushCherryPick(p, destBranch, h);
            });
        });
    });
}

function runMergeMode() {
    chooseProject(p => {
        chooseSourceBranch(p, sourceBranch => {
            chooseDestinationBranch(p, destBranch => {
                console.log("Creating merge request only");
                cherryPick.createMergeRequest(p, sourceBranch, destBranch);
            });
        });
    });
}

function runPipelineMode() {
    chooseProject(p => {
        chooseDestinationBranch(p, b => {
            axios.post(`${GITLAB_REST_API}/projects/${p.id}/pipeline?ref=${b}`)
                .then(response => {
                    if (response.status === 201) {
                        console.log("Running pipeline for project " + p.name + " on branch " + b);
                    } else {
                        console.log(`${response.status} - ${response.statusText}`);
                    }
                })
                .catch(error => {
                    console.log(error);
                });

        });
    });
}

function askYesNo(question, yes, no) {
    askChoicesQuestion(question, {
        "yes" : yes,
        "no" : no
    });
}

function askSimpleQuestion(question, onEnter, password=false) {
    inquirer.prompt([{
        type: password ? 'password' : 'input',
        name: 'data',
        message: question,
    }]).then(response => {
        onEnter(response.data);
    });
}

function askChoicesQuestion(question, choices) {
    inquirer.prompt([{
        type: 'list',
        name: 'data',
        message: question,
        choices: Object.keys(choices)
    }]).then(response => {
        choices[response.data](response.data);
    });
}

function askAsyncQuestion(question, source, callback) {
    inquirer.prompt([{
        type: 'autocomplete',
        name: 'data',
        suggestOnly: false,
        message: question,
        source: source,
        pageSize: 7,
        validate: (val) => val ? true : 'Type something!'
    }]).then(response => {
        callback(response.data);
    });
}

askChoicesQuestion("What do you want to do ?", {
    [JIRA_MODE]     : runJiraMode,
    [LUCKY_MODE]    : runLuckyMode,
    [CHERRY_MODE]   : runCherryMode,
    [MERGE_MODE]    : runMergeMode,
    [PIPELINE_MODE] : runPipelineMode
});