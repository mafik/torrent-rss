# Directories & configuration

This webapp requires: nodejs (for subtitle re-encoding), PHP-capable web server, transmission-cli daemon.

`daemons/` directory contains daemons that are suppesed to run periodically, possibly hourly cron jobs.
`www/` contains scripts that handle displaying downloaded content (PHP-based)

All scripts need to be configured in order to work properly. Configuration is inside the scripts themselves.

# Features

* downloading torrents from RSS feeds
* matching and downloading subtitles
* reencoding subtitles to .vtt format (for HTML5 subtitle display)
* reencoding video files to .mp4

# Contributing

If you have done some improvements, please send me a pull request. 

In case of problems, please file an issue. Even if I don't fix it, it'll help others.

Thanks!
