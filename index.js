'use strict';

const inquirer = require('inquirer');
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
const config = require('./config');

const cherryPick = require('./testCherry-pick');
const jira = require('./getJiraPatchVersion');
const jiraComment = require('./addJiraComment');
const searchProject = require('./searchProject').searchProjectInquirer;
const searchBranch = require('./searchBranch').searchBranch;
const getReleasedVersions = require('./getReleasedVersions').getReleasedVersions;
const runPipeline = require('./runPipeline').runPipeline;

const JIRA_MODE = "Get/Publish a Jira version table";
const LUCKY_MODE = "Do a lucky merge request";
const CHERRY_MODE = "Do only a cherry pick";
const MERGE_MODE = "Do only a merge request";
const PIPELINE_MODE = "Run a pipeline";

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
    if (config.DEFAULT_JIRA_USERNAME) {
        onEnter(config.DEFAULT_JIRA_USERNAME);
    } else {
        askSimpleQuestion("What's your JIRA username ?", onEnter);
    }
}

function enterPassword(onEnter) {
    askSimpleQuestion("What's your JIRA password ?", onEnter, true);
}

function runJiraMode() {
    getReleasedVersions(versions => {
        askCheckboxQuestion("Which versions ?", versions, (chosenVersions) => {
            const table = "Corrigé dans les versions suivantes:\n" + jira.formatPatchVersions(chosenVersions);
            askYesNo("Do you want to publish it ?", () => {
                enterJiraKey(jiraKey => {
                    enterUsername(username => {
                        enterPassword(password => {
                            jiraComment.addJiraComment(jiraKey, table, username, password);
                        });
                    });
                });
            }, () => {
                console.log(table);
            });
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
            runPipeline(p, b);
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

function askCheckboxQuestion(question, choices, onChoose) {
    inquirer.prompt([{
        type: 'checkbox',
        name: 'data',
        message: question,
        choices: choices,
        default: choices
    }]).then(response => {
        onChoose(response.data);
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