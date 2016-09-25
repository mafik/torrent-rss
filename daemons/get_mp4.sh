#!/bin/bash

LOG=/root/torrent-rss/log
DIR=/var/www/downloads/

echo "mp4 converter started:" `date` | tee -a $LOG

find $DIR -type f -name '*.mkv' -o -name '*.avi' |
while read f
do
    mp4="${f%.*}.mp4"
    if test ! -f "$mp4"
    then
	echo "Transcoding $f -> $mp4..." | tee -a $LOG
	echo avconv -y -i "$f" -strict experimental -c:v libx264 -c:a aac -b:a 128k "$mp4"  | tee -a $LOG
	avconv -y -i "$f" -strict experimental -c:v libx264 -c:a aac -b:a 128k "$mp4"
	chown debian-transmission.debian-transmission "${f%srt}mp4"
	chmod 664 "${f%srt}mp4"
    fi
done

echo "mp4 converter done:" `date` | tee -a $LOG
