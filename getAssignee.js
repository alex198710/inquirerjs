const assigneeTree = require('./merge-request-assignee');
const searchProject = require('./searchProject');
const DEFAULT_GITLAB_MR_ASSIGNEE = require('./config').DEFAULT_GITLAB_MR_ASSIGNEE;

function getAssigneeAtLevel(assigneeTree) {
    if (assigneeTree && assigneeTree.assignee && assigneeTree.assignee !== "") {
        return assigneeTree.assignee;
    }
    return null;
}

function getAssignee(projectName) {
    const project = searchProject.searchFullProject(projectName);
    console.log("Getting assignee for project: " + project.name);
    if (!project) {
        return;
    }
    let splittedPath = project.path_with_namespace.split('/');
    let assignee = "";
    let assigneeTreeRelative = assigneeTree;
    while (splittedPath.length > 0 && assigneeTreeRelative !== undefined) {
        assigneeTreeRelative = assigneeTreeRelative[splittedPath.shift()];
        const tmpAssignee = getAssigneeAtLevel(assigneeTreeRelative);
        if (tmpAssignee !== null) {
            assignee = tmpAssignee;
        }
    }
    return assignee ? assignee : DEFAULT_GITLAB_MR_ASSIGNEE;
}

module.exports = {
    getAssignee: getAssignee
};

//console.log(getAssignee(process.argv[2]));