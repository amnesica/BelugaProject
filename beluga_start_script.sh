#!/bin/bash

# how to run this script on startup: (instructions can be used for a raspberry pi)
# 1. important: make sure this script has unix file format (lf)
# 2. enter the path to the jar file and the filename of the beluga jar to 'pathBelugaJarWithFilename'
# 3. make this script executable: chmod +x beluga_start_script.sh 
# 4. open crontab as normal user: crontab -e (or if you want to use other user as 'pi': sudo crontab -u username -e)
# 5. add new entry at the very bottom: @reboot sh *pathToThisScript*/beluga_start_script.sh
# 6. save file and reboot your pi or computer

# path to beluga jar file with filename
pathBelugaJarWithFilename="TODO"

# command to start jar files
echo "starting BelugaProject ... (autostart)"
java -jar $pathBelugaJarWithFilename
