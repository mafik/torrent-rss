#!/bin/bash

DIR=/root/torrent-rss
LOG=$DIR/log
INBOX=$DIR/add
RSS_OLD=$DIR/old.rss
RSS_NEW=$DIR/new.rss
URL="http://showrss.info/rss.php?user_id=150282&hd=null&proper=null&magnets=false"

echo "get_torrents.sh started:" `date` | tee -a $LOG

#look for sved file
if [ ! `ls $RSS_OLD` ]; 
then 
    #make it
    echo > $RSS_OLD
    echo "$RSS_OLD doesn't exist, now creating" 
fi

#update feed
wget -O $RSS_NEW $URL

#get the diff and wget the torrents
diff $RSS_NEW $RSS_OLD | grep -o '<link>[^" ]*.torrent</link>' | sed 's/<link>//g' | sed 's/<\/link>//g' | xargs wget -c
#diff ./$feedFolder/$count.rss ./$feedFolder/$count.saved | grep -o '<link>[^"]*' | sed 's/<link>//g' | sed 's/<\/link>//g'
        
#save the need feed for next run
cp $RSS_NEW $RSS_OLD

#move to watchfolder for transmission
if ls *.torrent &> /dev/null; then
    echo "downloaded " `ls *.torrent | wc -l` " new torrents" | tee -a $LOG
    for i in *.torrent
    do
	mv $i $i.gz
	gunzip $i.gz || mv $i.gz $i
	chown debian-transmission.debian-transmission $i
	mv $i $INBOX
    done
fi


echo "get_torrents.sh finished:" `date` | tee -a $LOG
