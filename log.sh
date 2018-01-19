#!/bin/sh
DATE=$(date +"%m-%d-%Y")
NOW=$(date +"%Y-%m-%dT%H:%M:%S")
FILE="nohup.$DATE.out"
echo "{ \"timestamp\":\"$NOW\", \"level\":\"info\",\"message\":\"======== continue on $FILE ==========\"}" >> /home/desarrollo/control-terminales/log/nohup.out
sudo cp /home/desarrollo/control-terminales/log/nohup.out /home/desarrollo/control-terminales/log/$FILE
echo "{ \"timestamp\":\"$NOW\", \"level\":\"info\",\"message\":\"======== comes from $FILE ==========\"}" > /home/desarrollo/control-terminales/log/nohup.out
