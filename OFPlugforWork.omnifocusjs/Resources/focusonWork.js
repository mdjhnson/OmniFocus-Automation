(() => {
	var action = new PlugIn.Action(function(selection, sender){
		// action code
		// selection options: tasks, projects, folders, tags, allObjects
        
        // Section 1.0: Gets the folders that need to be focused on
        sFolders = new Array();
        folderNames = ["CO Serve", "Development", "CO Super Admin", "Support", "Reference", "Habits", "TEMPLATES", "Someday/Maybe"]
        folderNames.forEach((name) => {
            sFolders.push(folderNamed(name))
        })
        
        // Section 2.0: Resets the digital workspace
        if (document.windows.length > 1) {
            document.windows.forEach((win,index) => {
                if (index !=0){
                    console.log("close" + index)
                    win.close()
                }
            })
        }
        
        // Section 3.0: Focuses on the folders
        document.windows[0].focus = sFolders
        
	});

	action.validate = function(selection, sender){
		// validation code
		// selection options: tasks, projects, folders, tags, allObjects
		if (!Device.current.mac){
            return false
        }
		return true
	};
	
	return action;
})();