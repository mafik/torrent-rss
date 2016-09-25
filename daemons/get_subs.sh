#!/bin/bash

LOG=/root/torrent-rss/log
DIR=/var/www/downloads/

echo "subtitle-downloader.py started:" `date` | tee -a $LOG
sudo -u debian-transmission python /root/torrent-rss/subtitle-downloader/subtitle-downloader.py $DIR || echo "failed..."
echo "subtitle-downloader.py done, re-encoding subs:" `date` | tee -a $LOG

#echo "subliminal started:" `date` >> $LOG
#subliminal \
#  -l pl en \
#  --providers addic7ed opensubtitles thesubdb tvsubtitles \
#  --addic7ed mafikpl monakana \
#  --color $DIR >> $LOG
#echo "subliminal done, re-encoding subs:" `date` >> $LOG

find $DIR -name '*.srt' |
while read f
do
    if test -f "$f"
    then
	nodejs /root/torrent-rss/srt2vtt/bin/convert.js < "$f" > "${f%srt}vtt"
	chown debian-transmission.debian-transmission "${f%srt}vtt"
	chmod 664 "${f%srt}vtt"
#         CHARSET="$( file -bi "$f"|awk -F "=" '{print $2}')"
#         if [ "$CHARSET" == "unknown-8bit" ]; then
#             echo " converting $f" >> $LOG
#             iconv -f cp1250 -t utf8 "$f" -o "$f.tmp"
#             mv "$f.tmp" "$f"
#         fi
    else
        echo " warning: $f - is not a regular file" >> $LOG
    fi
done

echo "re-encoding done:" `date` >> $LOG
