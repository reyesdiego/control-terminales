#!/bin/sh
DATE=$(date +"%m-%d-%Y")
NOW=$(date +"%Y-%m-%dT%H:%M:%S")
FILE="nohup.$DATE.out"
echo "{ \"timestamp\":\"$NOW\", \"level\":\"info\",\"message\":\"======== continue on $FILE ==========\"}" >> /home/diego/agp/agpapi/log/nohup.out
sudo cp /home/diego/agp/agpapi/log/nohup.out /home/diego/agp/agpapi/log/$FILE
echo "{ \"timestamp\":\"$NOW\", \"level\":\"info\",\"message\":\"======== comes from $FILE ==========\"}" > /home/diego/agp/agpapi/log/nohup.out
