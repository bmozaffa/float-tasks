# Google Apps Script Task Floating
## Description
These scripts run on your google account under your own authorization, and can be scheduled or run manually to manage your Google Tasks. Specifically, when run:
1- Any Google Tasks due before the current date are updated so that their due date is set to the next day
2- Any Google Tasks marked as completed are removed, and instead a calendar entry is created on the date and time when the task was marked as completed.

## Setup
Navigate to https://script.google.com/ and after accepting the prompts, use the + sign on the top-left to create a 'New script'. Give the project a name, for example "Float Tasks". The file will be called Code.gs by default and have an empty function in there. Replace the content of the file with the provided Code.gs file.

Once saved, use the Resources menu option to navigate to Advanced Google services. Turn on the "Calendar API" and "Tasks API", while leaving default versions and names in place. Notice the warning that "These services must also be enabled in the Google Cloud Platform API Dashboard.". Click the link to open the GCP API dashboard, make sure you have the same project selected, and use the button in the top-middle to "Enable APIs and Services". From the new page, search for the corresponding options of "Google Calendar API" and "Tasks API", and enable both. You do not need to create credentials for these.

After this setup, use the "Select function" drop-down and select the first option, called advanceTasks. Then press the play button to run the script for the first time. This will trigger a security event, which will require you to authorize the script with access to your tasks and calendars. It should then complete successfully. You can go to View / Logs to verify the results.

To schedule these scripts to run periodically, click the timer button to the left of the play button. You can then "Add Trigger" in the bottom-right, and set up a timer to run your advanceTasks function on a daily basis at the preferred time.
