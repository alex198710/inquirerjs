'use strict';

const inquirer = require('inquirer');
const fuzzy = require('fuzzy');
const axios = require('axios');
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const REST_COUNTRIES_URL = "https://restcountries.eu/rest/v2/name/";

const JIRA_MODE = "Get a jira version table";
const LUCKY_MODE = "Do a lucky merge request";
const CHERRY_MODE = "Do only a cherry pick";
const MERGE_MODE = "Do only a merge request";
const PIPELINE_MODE = "Run a pipeline";

function searchProject(answers, input) {
    input = input || 'a';
    return new Promise(function(resolve) {
        axios.get(`${REST_COUNTRIES_URL}${input}`)
            .then(response => {
                let countries = response.data.map(c => c.name);
                let fuzzyResult = fuzzy.filter(input, countries);
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
    //askAsyncQuestion("Choose a project:", searchProject, onChoose);
    // TODO get list of project in platform group via gitlab api
    askChoicesQuestion("Which project ?", {
        "bookingprocess"  : onChoose,
        "bookingprocess-data" : onChoose,
        "nucleus.productbooking3.amadeus" : onChoose,
        "amadeus.http.client" : onChoose,
        "orchestra.td" : onChoose,
        "orchestra.b2b" : onChoose
    });
}

function enterHashCommit(onEnter) {
    askSimpleQuestion("What's the merge commit hash ?", onEnter);
}

function chooseDestinationBranch(project, onChoose) {
    // TODO get list of project branches via gitlab api
    askChoicesQuestion("What's the destination branch ?", {
        "master"  : onChoose,
        "V15_8_X" : onChoose,
        "V15_7_X" : onChoose,
        "V15_6_X" : onChoose,
        "V15_5_X" : onChoose,
        "V15_4_X" : onChoose,
        "V15_3_X" : onChoose,
        "V15_2_X" : onChoose,
        "V15_1_X" : onChoose,
    });
}

function enterJiraKey(onEnter) {
    askSimpleQuestion("What's the JIRA number ?", onEnter);
}

function runJiraMode() {
    const table = "V15.8-TEST\nV15.8-SNAPSHOT\nV15.7.C\nV15.6.G\nV15.5.ZD\nV15.4.ZP\nV15.3.ZZR\nV15.2.ZZZ";
    askYesNo("Do you want to publish it ?", () => {
        enterJiraKey(k => {
           console.log(table);
           console.log("The table has been published to Jira number " + k);
        });
    }, () => {
       console.log(table);
    });
}

function runLuckyMode() {
    chooseProject(p => {
        enterHashCommit(h => {
            chooseDestinationBranch(p, b => {
                console.log("Launching lucky merge : Magic Cherry-pick + Magic Merge request ");
            });
        });
    });
}

function runCherryMode() {
    chooseProject(p => {
        enterHashCommit(h => {
            chooseDestinationBranch(p, b => {
                console.log("Launching magic cherry pick only");
            });
        });
    });
}

function runMergeMode() {
    chooseProject(p => {
        enterHashCommit(h => {
            chooseDestinationBranch(p, b => {
                console.log("Launching magic merge only");
            });
        });
    });
}

function runPipelineMode() {
    chooseProject(p => {
        chooseDestinationBranch(p, b => {
            console.log("Running pipeline for project " + p + " on branch " + b);
        });
    });
}

function askYesNo(question, yes, no) {
    askChoicesQuestion(question, {
        "yes" : yes,
        "no" : no
    });
}

function askSimpleQuestion(question, onEnter) {
    inquirer.prompt([{
        type: 'input',
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