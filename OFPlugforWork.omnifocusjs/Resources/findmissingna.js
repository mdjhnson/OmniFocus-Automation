/*{
	"type": "action",
	"targets": ["omnifocus"],
	"author": "Matt",
	"identifier": "com.mattjohnson.findMissingNextAction",
	"version": "1.1.2",
	"description": "A plug-in that finds projects with missing next actions",
	"label": "Find Missing Next Action",
	"shortLabel": "Next Action"
}*/

/***********************************
VERSION LOG:
• 1.1 (20.07.17 - MDJ) - Updated the code to search all subtasks of a project for next actions (tags).
• 1.1.2 (20.07.17 - MDJ) - Updated the code to search all tags and not just top level tags for exemptions.





************************************/




//PROPERTIES:
var shouldCheckSingleActionLists = false;
var shouldMarkTasksWithSubtasks = false;
var lackingListingDelim = ("\n" + "    • ");
var missingNASuffix = "(missing next action)";
var missingNADelimiter = " ";
var exemptTagNames = ["–", "✔️ Checklist", "🗄 Reference", "? Maybe", "Someday/Maybe"];
var perspectiveName = "No NA";



/***********************************
Finds tags by name and returns an array containing their objects
tagNames: an array of names to search for matching tags

***********************************/
function getTags(tagNames) {
    var tags = new Array();
    tagNames.forEach((tName) => {
        var result = flattenedTags.filter((tag) => tag.name === tName)[0];
        tags.push(result);
    });
    return tags;
}



(() => {
    var action = new PlugIn.Action(function (selection, sender) {
        // Add code to run when the action is invoked

        var oldNames = removeSuffixes();
        console.log("Removed suffixes from task:", oldNames);
        var lackingNextActions = accumulateMissingNAs([]);
        console.log(lackingNextActions);
        
        if (lackingNextActions == []) {
            if (shouldCheckSingleActionLists) {
                msg = "Next actions are identified for all active projects, action groups, and single action lists.";
            } else {
                msg = "Next actions are identified for all active projects and action groups.";
            }
            console.log("Congratulations! ", msg);
        } else {
            titleText = "Some active projects or action groups are missing next actions. You can reveal them if you want to correct this.";
            pluralizedItems = "items";
            if (lackingNextActions.length == 1) {
                titleText = "An active project or action group is missing a next action. You can reveal it if you want to correct this.";
                msg = 'There is no next action for "' + lackingNextActions[0] + '".';
                pluralizedItems = "item";
            } else if (lackingNextActions.length > 10) {
                msg = "There are " + lackingNextActions.length + " active projects or action groups without next actions. ";
            } else {
                lackingListing = lackingNextActions;
                msg = "These active projects or action groups do not have next actions:" & lackingListingDelim & lackingListing;
            }
            console.log(msg, lackingListingDelim + lackingNextActions.join(lackingListingDelim));
            var alert = new Alert(titleText, msg + "Mark the " + pluralizedItems + ' as completed, or add actions as needed and re-run this script to remove the "' + missingNASuffix + '" suffix.');
            alert.addOption("Ok")
            alert.addOption("Reveal")
            alert.show(function (result) {
                if (result == 0) {
                    console.log("Button: Ok")
                } else {
                    console.log("Button: Reveal");
                    var p = Perspective.Custom.byName(perspectiveName);
                    if (p) {
                        urlStr = "omnifocus:///perspective/" + encodeURIComponent(perspectiveName);
                        URL.fromString(urlStr).open();
                    } else {

                        urlStr = "omnifocus:///search?q=" + encodeURIComponent(missingNASuffix);
                        //urlStr = "omnifocus:///search?q=%28missing%20next%20action%29";
                        URL.fromString(urlStr).open();
                        //.call(function(result){console.log(result)});
                    }

                }
            })
        }

    });


    action.validate = function (selection, sender) {
        // validation code
        // selection options: tasks, projects, folders, tags, allObjects
        return true
    };

    return action;
})();




/************************************	
    Removes "(missing next action)" suffixes from all tasks and projects.
    
************************************/
function removeSuffixes() {
    var oldNames = new Array(),
        newNames = new Array();
    flattenedTasks.forEach((task) => {
        if (task.name.endsWith(missingNASuffix)) {
            oldNames.push(task.name);
            var newName = task.name;
            if (newName == missingNASuffix) {
                newName = "";
            } else {
                newName = newName.substring(0, newName.indexOf(missingNASuffix));
            }
            if (newName == missingNADelimiter) {
                newName = "";
            } else if (newName.endsWith(missingNADelimiter)) {
                newName = newName.substr(0, newName.length - missingNADelimiter.length);
            }
            task.name = newName;
            newNames.push(task.name);
        }
    });
    return oldNames;
}




/***********************************
	Accumulates a list of projects that are:
		• not complete,
        • not in a dropped folder, and
		• have subtasks, but 
		• have no incomplete or pending subtasks with tags.
    accum: the items lacking next actions that have been found so far
    
************************************/
function accumulateMissingNAs(accum) {
    var theProjects = new Array();
    flattenedProjects.forEach((project) => {
        if (shouldCheckSingleActionLists) {
            if (project.status === Project.Status.Active) {
                theProjects.push(project);
            }
        } else {
            if (project.status === Project.Status.Active && project.containsSingletonActions == false) {
                theProjects.push(project);
            }
        }
    });
    accum = accumulateMissingNAsProjects(theProjects, accum);
    return accum;
}




/************************************ 
	Recurs over the trees rooted at the given projects, accumulates a list of tasks that are:
		• not complete, 
        • not in a dropped folder, and
		• have subtasks, but
		• have no incomplete or pending subtasks with tags.
	theProjects: a list of projects
	accum: the items lacking next actions that have been found so far
    
************************************/
function accumulateMissingNAsProjects(theProjects, accum) {
	console.log("Summary:", theProjects.length, "projects found.");
    theProjects.forEach((aProject) => {
        // Checks to make sure the project's folder wasn't dropped
        if (aProject.task.effectiveActive) {
            theRootTask = aProject.task;
            accum = accumulateMissingNAsTask(theRootTask, true, accum);
        } else {
            console.log("SKIPPED (", aProject.name, ")");
        }
    })
    return accum;
}




/*************************************
	Recurs over the tree rooted at the given task, accumulates a list of items that are:
		• not complete,
        • not in a dropped folder, and
		• have subtasks, but
		• have no incomplete or pending subtasks with tags.
	theTask: a task
	isProjectRoot: true iff theTask is the root task of a project
	accum: the items lacking next actions that have been found so far 
*************************************/
function accumulateMissingNAsTask(theTask, isProjectRoot, accum) {
	console.log(theTask.name, "start")
    var incompleteChildTasks = new Array();
    var taggedTasks = new Array();
    var count = 0;
    var exemptTags = getTags(exemptTagNames);
    
    if (shouldMarkTasksWithSubtasks === false) {
        theTask.flattenedChildren.forEach((task) => {
            exempt = false;
            status = task.taskStatus;
            if (status == Task.Status.Completed || status == Task.Status.Dropped) {} else {
                if (task.tags.length > 0) {
									console.log(theTask.name + "." + task.name, "has tags")
                    for (var i = 0 ; i < task.tags.length ; i++) {
                        if (exemptTags.indexOf(task.tags[i]) != -1) {
                            exempt = true;
                            console.log(task.name, "was exempt")
                            //break;        
                        }
                    }
                    if (exempt == false) {
                        count += 1;
                        console.log(theTask.name + "." + task.name, "was counted as a NA");
                    }
                }
            }
        });
        if (count == 0) {
					console.log(theTask.name, " was counted")
            accum.push(theTask.name);
            if (theTask.name.endsWith(missingNASuffix) == false) {
                theTask.name = theTask.name + missingNADelimiter + missingNASuffix;
            }
            return accum;
        } else {
            return accum;
        }
    } else {
        //isAProjectOrSubprojectTask = isProjectRoot; 

        if (isProjectRoot == true) {
            if (theTask.tasks.length) {}

        }




        if (theTask.tasks.length > 0) {
            isAProjectOrSubprojectTask = true;
        } else {
            isAProjectOrSubprojectTask = isProjectRoot;
        }



        status = theTask.taskStatus;
        if (status == Task.Status.Completed || status == Task.Status.Dropped || isAProjectOrSubprojectTask == false) {
            console.log(theTask)
            return accum;
        }
        theTask.tasks.forEach((task) => {
            if (task.completed == false) {
                incompleteChildTasks.push(task);
            }
            if (task.tags.length > 0) {
                taggedTasks.push(task);
            }
        })
        console.log(theTask.name,"\n incompleteChildTasks:",incompleteChildTasks.length,"\n", "taggedTasks:",taggedTasks.length);
        if (incompleteChildTasks.length == 0 || taggedTasks.length == 0) {
            accum.push(theTask.name);
            if (theTask.name.endsWith(missingNASuffix) == false) {
                theTask.name = theTask.name + missingNADelimiter + missingNASuffix;
            }
            return accum;
        } else {
            return accumulateMissingNAsTasks(incompleteChildTasks, accum);
        }
    }
}



/***********************************
	Recurs over the trees rooted at the given tasks, accumulates a list of items that are:
		• not complete,
        • not in a dropped folder, and
		• have subtasks, but
		• have no incomplete or pending subtasks with tags.
	theTasks: a list of tasks, none of which are project root tasks
	accum: the items lacking next actions that have been found so far 
***********************************/
function accumulateMissingNAsTasks(theTasks, accum) {
    console.log("# of Tasks:", theTasks.length, "| Accum =", accum, accum.length);
    console.log(accum, accum.length);
    for (var i = theTasks.length ; i < theTasks.length ; i++) {
        var accum = accumulateMissingNAsTask(task, false, accum);
    }
    theTasks.forEach((task) => {
        //var accum = accumulateMissingNAsTask(task, false, accum);
    })
    return accum;
}