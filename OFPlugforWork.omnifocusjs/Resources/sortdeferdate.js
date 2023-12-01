(() => {
    var action = new PlugIn.Action(function (selection, sender) {
        // action code
        // selection options: tasks, projects, folders, tags, allObjects
        project = document.windows[0].selection.projects[0]
        if (project.containsSingletonActions) {
            var tasks = project.task.children
            if (tasks.length > 1) {
                tasks.sort((a, b) => {
                    var x = a.deferDate;
                    var y = b.deferDate;
                    if (x < y) {
                        return -1;
                    }
                    if (x > y) {
                        return 1;
                    }
                    return 0;
                })
                moveTasks(tasks, project)
            }
        }
    });

    action.validate = function (selection, sender) {
        // validation code
        // selection options: tasks, projects, folders, tags, allObjects
        return (document.windows[0].selection.projects.length === 1)
    };

    return action;
})();

