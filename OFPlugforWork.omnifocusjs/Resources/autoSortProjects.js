(() => {
    const excludeTags = ['Reviews'];
    const excludeFolders = [
        'Habits',
        'TEMPLATES',
        'Someday/Maybe',
        'Someday',
        'Maybe'
    ];
    const sortSingleActionProjects = true;

    var action = new PlugIn.Action(function (selection, sender) {
        // action code
        // selection options: tasks, projects, folders, tags, allObjects
        // processes active Folders    
        var ActiveFolders = flattenedFolders.filter(folder => folder.status == Folder.Status.Active)
        ActiveFolders.forEach((fldr) => {
            // process project
            if (excludeFolders.indexOf(fldr.name) == -1) {
                var projs = fldr.projects.sort().sort((a, b) => {
                    if (a.status < b.status) return 1;
                    if (a.status > b.status) return -1;
                })

                projs.forEach((project) => {
                    moveSections([project], fldr.beginning)
                })
            }
        })

        sortSingleActionProjects ? sortProjects() : "";


    });



    action.validate = function (selection, sender) {
        // validation code
        // selection options: tasks, projects, folders, tags, allObjects
        return true;
    };

    return action;
})()



function sortProjects() {
    var activeProjects = flattenedProjects.filter(project => project.status == Project.Status.Active && project.containsSingletonActions == true)
    var onHoldTags = flattenedTags.filter(tag => tag.status == Tag.Status.OnHold);
    var d = new Date();
    activeProjects.forEach((proj) => {
        var tasks = proj.task.children
        if (tasks.length > 1) {
            tasks.sort((a, b) => {          // sorts by defer date, paused tags, and then creation date
                var a_paused = checkPaused(a, onHoldTags);        // checks for paused tags
                var b_paused = checkPaused(b, onHoldTags);        // checks for paused tags
                var x = a.deferDate > d ? a.deferDate : "";
                var y = b.deferDate > d ? a.deferDate : "";
                if (a_paused > b_paused) { return 1}          // if paused
                if (a_paused < b_paused) { return -1}          // if active
                if (x < y) { return -1; }
                if (x > y) { return 1; }
                if (a.added < b.added) { return -1; }
                if (a.added > b.added) { return 1; }
                return 0;
            })
            moveTasks(tasks, proj);
        }
    })

}



function checkPaused(task, tagList) {
    var paused = false;
    if (task.tags.length > 0) {
        task.tags.forEach((tag) => {
            if (tagList.indexOf(tag) != -1) {
                paused = true;
            }
        })
    }
    return paused;
}