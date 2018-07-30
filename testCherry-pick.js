const PRIVATE_TOKEN = require('./config').PRIVATE_TOKEN;
const GITLAB_REST_API = require('./config').GITLAB_REST_API;

const execSync = require('child_process').execSync;
const request = require('sync-request');
const searchUser = require('./searchUser');
const searchProject = require('./searchProject');
const getAssignee = require('./getAssignee');

function getUserId(name) {
    return searchUser.searchUser(name);
}

function getProject(name) {
    return searchProject.searchFullProject(name);
}

function cherryPickAbort() {
    const abortCmd = 'git cherry-pick --abort';
    try {
        console.log(abortCmd);
        execSync(abortCmd);
    } catch (e) {
        // maybe no cherry pick in progress
    }
}

function continueCherryPick() {
    const continueCmd = 'git cherry-pick --continue';
    try {
        console.log(continueCmd);
        execSync(continueCmd);
    } catch (e) {
        return false;
    }
    console.log('cherry-pick succeeded');
    return true;
}

function makeCherryPick(project, sourceBranch, targetBranch, commitHash) {
    execSync(`git clone ${project.ssh_url_to_repo}`);
    execSync(`cd ${project.name} && git checkout ${targetBranch}`);
    execSync(`cd ${project.name} && git pull`);
    execSync(`cd ${project.name} && git checkout -b ${sourceBranch}`);

    let success = true;
    let cmd = `cd ${project.name} && git cherry-pick ${commitHash}`;
    try {
        console.log(cmd);
        execSync(cmd);
    } catch (e) {
        success = false;
        console.log('An error occurred: ' + e);

        // With good ascendant
        cmd = `cd ${project.name} && git cherry-pick -m 1 ${commitHash}`;
        try {
            cherryPickAbort();
            console.log(cmd);
            execSync(cmd);
            success = true;
        } catch (e) {
            success = false;
            console.log('An error occurred: ' + e);

            // With good ascendant + ignore space change
            cmd = `cd ${project.name} && git cherry-pick -m 1 -Xignore-space-change ${commitHash}`;
            try {
                cherryPickAbort();
                console.log(cmd);
                execSync(cmd);
                success = true;
            } catch (e) {
                success = false;
                console.log('An error occurred: ' + e);

                // Only ignore space change
                cmd = `cd ${project.name} && git cherry-pick -Xignore-space-change ${commitHash}`;
                try {
                    cherryPickAbort();
                    console.log(cmd);
                    execSync(cmd);
                    success = true;
                } catch (e) {
                    success = false;
                    console.log('An error occurred: ' + e);
                }
            }
        }
    }
    if (success) {
        console.log('cherry-pick succeeded');
    }
    return success;
}

function makeAndPushCherryPick(project, sourceBranch, targetBranch, commitHash, commitMessage, resumeCherryPick=false) {
    console.log (`project: ${project.id} - ${project.name}`);
    console.log (`commit hash: ${commitHash}`);

    console.log (`target branch: ${targetBranch}`);
    console.log (`source branch: ${sourceBranch}`);
    console.log(`commit message: ${commitMessage}`);

    console.log (`Continue a cherry-pick ? ${resumeCherryPick}`);

    let success = false;

    if (resumeCherryPick) {
        success = continueCherryPick();
    } else {
        success = makeCherryPick(project, sourceBranch, targetBranch, commitHash);
    }

    if (!success) {
        console.log("Cannot cherry-pick : you have to merge manually");
    } else {
        console.log(`Pushing branch ${sourceBranch} to remote`);
        pushNewBranch(project, sourceBranch);

        console.log(`Deleting local branch ${sourceBranch}`);
        execSync(`cd ${project.name} && git checkout ${targetBranch}`);
        execSync(`cd ${project.name} && git branch -D ${sourceBranch}`);
    }
    return success;
}

function pushNewBranch(project, sourceBranch) {
    execSync(`cd ${project.name} && git push origin ${sourceBranch}`);
}

function createMergeRequest(project, sourceBranch, targetBranch, commitMessage=null, assigneeName=null) {
    const userId = getUserId(assigneeName ? assigneeName : getAssignee.getAssignee(project.name));
    console.log("User id: " + userId);
    const options = {
        id: project.id,
		source_branch: sourceBranch,
		target_branch: targetBranch,
		remove_source_branch: true,
		title: commitMessage ? commitMessage : `Merge branch '${sourceBranch}' into '${targetBranch}'`,
		assignee_id: userId
    };
    const res = request('POST', `${GITLAB_REST_API}/projects/${project.id}/merge_requests`, {
        headers: {
            'PRIVATE-TOKEN': PRIVATE_TOKEN,
            "content-type": "application/json",
        },
        json: options
    });
    const mergeRequestInfo = JSON.parse(res.getBody('utf8'));

    console.log(`Merge request was created, id=${mergeRequestInfo.id}, title=${commitMessage}, url=${mergeRequestInfo.web_url}`);
}

function makeAwesomeCherryPick(projectName, commitHash, targetBranch, assignee_name=null, resumeCherryPick=false) {
    console.log(projectName);
    const project = getProject(projectName);
    console.log(project.id);

    const sourceBranch = `hotfix/${targetBranch}-${commitHash}`;
    const commitMessage = `Merge branch '${sourceBranch}' into '${targetBranch}'`;

    const success = makeAndPushCherryPick(project, sourceBranch, targetBranch, commitHash, commitMessage, resumeCherryPick);
    if (success) {
        createMergeRequest(project, sourceBranch, targetBranch, commitMessage, assignee_name);
    }
}

module.exports = {
    makeAndPushCherryPick: makeAndPushCherryPick,
    createMergeRequest: createMergeRequest,
    makeAwesomeCherryPick: makeAwesomeCherryPick
};
/*
const projectName = process.argv[2];//getProjectName();
const commitHash = process.argv[3];
const targetBranch = process.argv[4];
const assignee_name = process.argv[5];
const resumeCherryPick = process.argv.length > 6 ? process.argv[6] === "continue" : false;
makeAwesomeCherryPick(projectName, commitHash, targetBranch, assignee_name, resumeCherryPick);*/