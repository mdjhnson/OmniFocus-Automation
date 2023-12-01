(() => {
	var action = new PlugIn.Action(function(selection, sender){
		// action code
		// selection options: tasks, projects, folders, tags, allObjects
		var oldTagName = "Next Week"
        var newTagName = "This Week"
        
        var newTag = flattenedTags.filter((tag) => tag.name === newTagName)[0]
        var oldTag = flattenedTags.filter((tag) => tag.name === oldTagName)[0]
        oldTag.tasks.forEach((task) => {
            task.removeTag(oldTag)
            task.addTag(newTag)
        });
        
	});

	action.validate = function(selection, sender){
		// validation code
		// selection options: tasks, projects, folders, tags, allObjects
		return true
	};
	
	return action;
})();