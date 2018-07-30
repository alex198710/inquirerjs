const PRIVATE_TOKEN = 'YOUR GITLAB TOKEN';
const GITLAB_REST_API = 'https://gitlab.example.com/api/v4';
const JIRA_REST_API = "https://jira.example.com/rest/api/2";
const RELEASED_VERSIONS_REST_API = 'http://example.com/get/released-versions';
const DEFAULT_GITLAB_MR_ASSIGNEE = "firstname.lastname";
const DEFAULT_JIRA_USERNAME = "firstname.lastname";

module.exports = {
    PRIVATE_TOKEN               : PRIVATE_TOKEN,
    GITLAB_REST_API             : GITLAB_REST_API,
    JIRA_REST_API               : JIRA_REST_API,
    RELEASED_VERSIONS_REST_API  : RELEASED_VERSIONS_REST_API,
    DEFAULT_GITLAB_MR_ASSIGNEE  : DEFAULT_GITLAB_MR_ASSIGNEE,
    DEFAULT_JIRA_USERNAME       : DEFAULT_JIRA_USERNAME
};
