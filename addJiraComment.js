// https://developer.atlassian.com/server/jira/platform/jira-rest-api-example-add-comment-8946422/
const JIRA_REST_API = require('./config').JIRA_REST_API;
const request = require('sync-request');

function addJiraComment(jiraKey, comment, username, password) {
    const res = request('POST', `${JIRA_REST_API}/issue/${jiraKey}/comment`, {
        headers: {
            authorization: 'Basic ' + new Buffer(username + ':' + password).toString('base64')
        },
        json: {body: comment.replace(/\\n/g, '\n')}
    });
    console.log(comment + "\n" + "The table has been published to Jira number " + jiraKey);
    return JSON.parse(res.getBody('utf8'));
}

module.exports = {
    addJiraComment: addJiraComment
};