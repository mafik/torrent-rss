<!doctype html>
<meta charset="utf-8">
<title><?php echo $_SERVER["REQUEST_URI"] ?></title>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js"></script>

<link href="//vjs.zencdn.net/5.7.1/video-js.css" rel="stylesheet">
<script src="//vjs.zencdn.net/5.7.1/video.js"></script>

<style>
html {
 height: 100%;
}
body {
 margin: 0;
 color: #ddd;
 font-family: "Open Sans", sans-serif;
 font-size: 12px;
 display: flex;
 flex-direction: row;
 height: 100%;
}
#overview, #details {
 flex: 1 0 0;
}
#overview {
 background: #444;
 overflow: auto;
}
#index, #shows {
 margin: 0;
 padding: 1em 2em;
 line-height: 2em;
 list-style: none;
}
#movies {
  padding: 0 1em;
}
#movies li {
  cursor: pointer;
  display: inline-block;
  margin: .5em;
  padding: .5em 1em;
  background: #555;
  border-radius: .5em;
}
#details {
 display: flex;
 flex-direction: column;
}
#preview, #metadata {
 flex: 1 0 0;
}
#metadata {
 background: #222;
 display: flex;
 flex-direction: column;
}
#metadata > div {
 flex: 1 1 0;
 display: flex;
 flex-direction: row;
 align-content: center;
 align-items: center;
}
#metadata > div:nth-child(odd) {
 background: #111;
}
#metadata span {
 flex: 0 1 20%;
 text-align: right;
 padding: 1em;
 font-weight: bold;
}
#preview {
 background: black;
 overflow: hidden;
}
@media all and (max-width: 1024px) {
  body {
    flex-direction: column;
  }
  #metadata {
    display: none;
  }
  #details {
    order: -1;
  }
}
h1 {
  margin: 0;
  padding: 1em;
  background: #333;
  vertical-align: middle;
}
h2 {
  margin: 0;
  padding: .5em 1em;
  background: #555;
  vertical-align: middle;
  border-top: solid .1em #333;
  border-bottom: solid .1em #333;
}
a {
 color: #dee;
 text-decoration: none;
}
.expand:before {
  font-size: .8em;
  margin-right: 1em;
}
.expand-open:before {
  content: '▼';
}
.expand-close:before {
  content: '▶';
}
a.viewed {
 color: #abb;
}
a:hover {
 color: #fff;
 text-decoration: underline;
}
.video-js {
 margin: 0 auto;
}
.video-js .vjs-captions {
 color: white;
}
.video-js .vjs-text-track {
 display: none;
 font-size: 2.4em !important;
 text-align: center;
 margin-bottom: .1em;
 background-color: transparent;
}
.vjs-fullscreen .vjs-tt-cue {
  font-size: 3em;
}
.new:before {
content: 'new!';
background: #d00;
color: white;
font-weight: bold;
display: inline-block;
border-radius: .2em;
padding: 0 .4em;
margin: .1em .1em .1em .5em;
}
.vjs-tt-cue {
  display: inline-block;
  background-color: rgba(0,0,0,0.5);
  padding: .1em .2em;
  margin: 0 auto;
}
.sub {
  background: #555;
  padding: 2px 5px;
  border-radius: 3px;
  margin: 3px 3px;
}
button {
  float: right;
  background: #222;
  color: #ddd;
  font-family: "Open Sans";
  font-weight: 900;
  border: 1px solid #444;
  padding: 5px;
  border-radius: 3px;
}
button:hover {
  color: white;
  border: 1px solid #555;
}
.expand {
  cursor: pointer;
}
#index img {
  max-width: 200px;
  max-height: 200px;
}
#preview img {
  max-width: 100%;
  max-height: 100%;
}
#stats {
  font-family: monospace;
}
#stats li {
  list-style: none;
}
#stats, #stats ul {
  padding-left: 1em;
}
</style>
<div id="overview">
</div>
<div id="details">
  <div id="preview"></div>
  <div id="metadata">
    <div id="filename"></div>
    <div id="size"></div>
    <div id="mtime"></div>
  </div>
</div>

<?php
$uri = urldecode($_SERVER["REQUEST_URI"]);
$root = $_SERVER["DOCUMENT_ROOT"];

function scan($path) {
  global $root;
  $stats = stat($root . $path);
  echo "{path:'".$path."',mtime:".$stats['mtime'].",size:".$stats['size'];
  if(is_dir($root . $path)) {
    if(substr($path,-1) != '/') {
      $path = $path . '/';
    }
    echo ",contents:[";
    $handle = opendir($root . $path);
    while($file = readdir($handle)) {
      if($file[0] == '.') continue;
      if($file == 'index.php') continue;
      if(substr($file,-1) == '~') continue;
      scan($path . $file);
      echo ",";
    }
    closedir($handle);
    echo "]";
  }
  echo "}";
}

echo "<script>var tree = ";
scan($uri);
echo ";var disk_free_space = ";
echo disk_free_space($_SERVER["DOCUMENT_ROOT"]);
echo ";</script>";
?>
<script src="/indexer.js"></script>
