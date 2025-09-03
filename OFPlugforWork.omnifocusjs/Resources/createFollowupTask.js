(() => {
    var action = new PlugIn.Action(function (selection, sender) {
        // action code
        // selection options: tasks, projects, folders, tags, allObjects
        selection.tasks.forEach(function (task) {
            //task = selection.tasks[0]

			/*
			var menuItems = ["Related Task","Reply On"]
			var menuIndexes = [0,1]

			var menuElement = new Form.Field.Option(
					"menuElement", 
					null, 
					menuIndexes, 
					menuItems, 
					0
				)

			var inputForm = new Form()
			inputForm.addField(menuElement)
			var formPrompt = "Choose one of the items:"
			var buttonTitle = "Continue"
			var formPromise = inputForm.show(formPrompt, buttonTitle)

			inputForm.validate = function(formObject){
				return true
			}
			
			formPromise.then(function(formObject){
				var menuIndex = formObject.values['menuElement']
				var chosenItem = menuItems[menuIndex]
				//console.log('Chosen item:', chosenItem)
			
				if (chosenItem == "Reply On") {
				*/
		            var prefix = "Reply On: ";
		            var targetTagName = "Waiting For"
		            var clearTags = true;
		            var clearDates = true;
                    var clearRepeat = true;
		            var nNote = "Reminder sent on " + getDate_Time() + "\n" + "————————" + "\n\n\n";
	
		            var targetTag = null
		            tags.apply(function (tag) {
		                if (tag.name == targetTagName) {
		                    targetTag = tag
		                    return ApplyResult.Stop
		                }
		            })
		            tag = targetTag || new Tag(targetTagName)
	
		            insertionLocation = task.after
		            if (insertionLocation === null) {
		                insertionLocation = inbox.ending
		            }
		            folTask = duplicateTasks([task], insertionLocation)[0]
		            if (clearTags == true) {
		                folTask.clearTags()
		            }
		            if (clearDates == true) {
		                folTask.deferDate = null
		                folTask.dueDate = null
                        if (app.userVersion >= 4.7) {
                            folTask.plannedDate = null
                        }
		            }
                    if (clearRepeat == true) {
                        folTask.repetitionRule = null
                    }
            
		            folTask.addTag(tag)
		            folTask.flagged = false
		            folTask.name = addPrefix(folTask.name, prefix)
		            folTask.note = nNote + folTask.note
		            idStr = folTask.id.primaryKey
		            task.markComplete();
		            URL.fromString("omnifocus:///task/" + idStr).open()
				/*} else {
					
				}
			})
			
			formPromise.catch(function(err){
				console.error("form cancelled", err.message)
			})*/
        });
    });




    action.validate = function (selection, sender) {
        // validation code
        // selection options: tasks, projects, folders, tags, allObjects
        // return (selection.tasks.length === 1)
        return (selection.tasks.length > 0)
    };

    return action;
})();




// This checks if duplicate prefixes are present and converts them to a numbered increment if necessary.
function DuplicatePrefixCheck(name, prefix) {
    var reg = new RegExp(prefix, "gi") 
    var res = name.match(reg)
    if (res != null) {
        if (res.length > 1) {
            var count = 0  
            while (res.length > 1) {
                name = name.replace(prefix ,"")
                res = name.match(reg)
                count += 1
            }   
        }      
    }
    return name
}




// This adds the prefix to a task name if missing and incrementally increases it if already present.
function addPrefix(name, prefix) {
    name = DuplicatePrefixCheck(name, prefix)
    var t = new Array()
    if ( name.substr(0,8) == "Reply On" ) {
	   t[0] = name.indexOf(":")
        if ( t[0] == 8 ) {
            name = name.replace("Reply On", "Reply On x2") 
        } else {
            t[1] = +name.substring(10, t[0]).valueOf()
            name = name.replace(t[1], t[1] + 1)
        }
        return name
    } else {
        return (prefix + folTask.name)
    }
}





// Adds a zero to number in the time to make sure they are double digits
function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}




// Gets the current date in the desired format 
// (ie. "Saturday, July 4, 2020 at 10:04:36 PM")
function getDate_Time() {
    var locale = "en-us"
    var d = new Date();
    var month = d.toLocaleString(locale, {
        month: "long"
    })
    var day = d.toLocaleString(locale, {
        weekday: "long"
    })
    var time = d.toLocaleString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    })
    var date = day + ", " + month + " " + d.getDate() + ", " + d.getFullYear();

    return date + " at " + time;

}