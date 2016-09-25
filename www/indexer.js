jQuery.fn.sortElements = (function() {
  var sort = [].sort;
  return function(comparator, getSortable) {
    getSortable = getSortable || function() {
      return this;
    };
    var placements = this.map(function() {
      var sortElement = getSortable.call(this),
        parentNode = sortElement.parentNode,
        // Since the element itself will change position, we have
        // to have some way of storing its original position in
        // the DOM. The easiest way is to have a 'flag' node:
        nextSibling = parentNode.insertBefore(
          document.createTextNode(''),
          sortElement.nextSibling
        );
      return function() {
        if (parentNode === this) {
          throw new Error(
            "You can't sort elements if any one is a descendant of another."
          );
        }
        // Insert before flag:
        parentNode.insertBefore(this, nextSibling);
        // Remove flag:
        parentNode.removeChild(nextSibling);
      };
    });
    return sort.call(this, comparator).each(function(i) {
      placements[i].call(getSortable.call(this));
    });
  };
})();

function bytesToSize(bytes) {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return 'n/a';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

function filename(path) {
  var lastSlash = path.lastIndexOf('/');
  if (lastSlash >= 0) {
    return path.substr(lastSlash + 1);
  }
  return path;
};

var image_types = {
  jpg: true,
  png: true,
  gif: true
};

var first_a = function(elem) {
  return $(elem).find('a')[0];
};

$('.expand').live('click', function() {
  if ($(this).next().is(':visible')) {
    if (this.dataset.expand_key) localStorage[this.dataset.expand_key] = true;
    this.classList.remove('expand-open');
    this.classList.add('expand-close');
  } else {
    if (this.dataset.expand_key) delete localStorage[this.dataset.expand_key];
    this.classList.remove('expand-close');
    this.classList.add('expand-open');
  }
  $(this).nextAll('ul').slideToggle();
});

var shows = {};
var movies = {};

String.prototype.capitalize = function() {
  return this.replace(/(?:^|\s)\S/g, function(a) {
    return a.toUpperCase();
  });
};

function getShow(path) {
  var segments = path.toLowerCase().split('/');
  for (var i = 0; i < segments.length; ++i) {
    var match = segments[i].match(/(.*)\.s(\d\d)(?:e(\d\d))?(?:\.|_)(.+(?=\.(?:hdtv|720p|1080p)))?/);
    if (match) {
      var show = {
        name: match[1].replace(/\./g, ' ').capitalize(),
        episode: "Season " + parseInt(match[2], 10)
      };
      if (match[3]) {
        show.episode += ", episode " + parseInt(match[3], 10);
      }
      if (match[4]) {
        show.episode += " \"" + match[4].replace(/\.|_/g, ' ').capitalize() + "\"";
      }
      return show;
    }
  }
}

function getMovie(path) {
  var segments = path.toLowerCase().split('/');
  for (var i = 0; i < segments.length; ++i) {
    var match = segments[i].match(/(.*)(?: |\.)(\d\d\d\d)(?: |\.)/);
    if (match) {
      var movie = {
        name: match[1].replace(/\./g, ' ').capitalize() + ' (' + match[2] + ')',
        year: parseInt(match[2], 10)
      };
      return movie;
    }
  }
}

function prune(node) {
  var slashIndex = node.path.lastIndexOf('/');
  node.name = node.path.substr(slashIndex + 1);
  if (node.contents) {
    for (var i = 0; i < node.contents.length; ++i) {
      prune(node.contents[i]);
    }
    var mp4s = {};
    for (var i = 0; i < node.contents.length; ++i) {
      var n = node.contents[i].name;
      if (n && n.endsWith('.mp4')) {
        mp4s[n.substr(0, n.length - 4)] = true;
      }
    }
    for (var i = 0; i < node.contents.length; ++i) {
      var n = node.contents[i].name;
      var remove = false;
      remove = remove || n.toLowerCase() == 'screens';
      remove = remove || n.toLowerCase().startsWith('rarbg.com');
      remove = remove || n.endsWith('.nfo') || n.endsWith('.txt') || n.endsWith('.srt');
      remove = remove || n.toLowerCase().indexOf('sample') >= 0; // TODO: show samples alongside shows
      if (!remove && node.contents[i].contents) {
        remove = remove || node.contents[i].contents.length == 0;
      }
      if (!remove && (n.endsWith('.mkv') || n.endsWith('.avi'))) {
        remove = remove || mp4s[n.substr(0, n.length - 4)];
      }
      if (!remove && (n.endsWith('.vtt') || n.endsWith('.mp4'))) {
        var show = getShow(node.contents[i].path);
        if (show) {
          remove = true;
          shows[show.name] = shows[show.name] || {};
          shows[show.name][show.episode] = shows[show.name][show.episode] || {
            subs: [],
            videos: []
          };
          if (n.endsWith('.vtt')) {
            shows[show.name][show.episode].subs.push(node.contents[i]);
          }
          if (n.endsWith('.mp4')) {
            shows[show.name][show.episode].videos.push(node.contents[i]);
          }
        }
        var movie = getMovie(node.contents[i].path);
        if (movie) {
          remove = true;
          movies[movie.name] = movies[movie.name] || {
            videos: [],
            subs: []
          };
          if (n.endsWith('.vtt')) {
            movies[movie.name].subs.push(node.contents[i]);
          }
          if (n.endsWith('.mp4')) {
            movies[movie.name].videos.push(node.contents[i]);
          }
        }
      }
      if (!remove && getMovie(node.contents[i].path)) {
        if (n.toLowerCase().endsWith('.png')) {
          remove = true;
        }
      }
      if (remove) {
        node.contents.splice(i, 1);
        --i;
      }
    }
  }
}

function gen(arr, ul) {
  for (var i = 0; i < arr.length; ++i) {
    var a = document.createElement('a');
    var li = document.createElement('li');
    a.innerText = arr[i].name;
    a.dataset.expand_key = arr[i].path + ':folded';
    li.appendChild(a);
    if (arr[i].contents) {
      a.classList.add('expand');
      var new_ul = document.createElement('ul');
      gen(arr[i].contents, new_ul);
      li.appendChild(new_ul);
      if (localStorage[a.dataset.expand_key]) {
        $(new_ul).hide();
        a.classList.add('expand-close');
      } else {
        a.classList.add('expand-open');
      }
    } else {
      a.href = arr[i].path;
    }
    ul.appendChild(li);
  }
}

function alphanum(a, b) {
  function chunkify(t) {
    var tz = [],
      x = 0,
      y = -1,
      n = 0,
      i, j;

    while (i = (j = t.charAt(x++)).charCodeAt(0)) {
      var m = (i == 46 || (i >= 48 && i <= 57));
      if (m !== n) {
        tz[++y] = "";
        n = m;
      }
      tz[y] += j;
    }
    return tz;
  }

  var aa = chunkify(a);
  var bb = chunkify(b);

  for (x = 0; aa[x] && bb[x]; x++) {
    if (aa[x] !== bb[x]) {
      var c = Number(aa[x]),
        d = Number(bb[x]);
      if (c == aa[x] && d == bb[x]) {
        return c - d;
      } else return (aa[x] > bb[x]) ? 1 : -1;
    }
  }
  return aa.length - bb.length;
}

var sort_by_name = function(a, b) {
  //return first_a(a).innerHTML.toLowerCase().localeCompare(first_a(b).innerHTML.toLowerCase());
  a = first_a(a).innerHTML.toLowerCase();
  b = first_a(b).innerHTML.toLowerCase();
  return alphanum(a, b);
}

var cnt = 0;
var video;

var video_mimetypes = {
  mp4: "video/mp4",
  webm: "video/webm",
  ogv: "video/ogg",
  mkv: "video/webm",
  m4v: "video/m4v",
  avi: "video/avi"
};

function gen_movies(ul) {
  for (var name in movies) {
    var m = movies[name];
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.innerText = name;
    if (m.videos.length == 0) {
      a.innerText += " (no videos!)";
    }
    if (m.videos.length > 1) {
      a.innerText += " (" + m.videos.length + " videos - bug?)";
    }
    video_link(a, m, false);
    a.dataset.key = name;
    li.appendChild(a);
    ul.appendChild(li);
  }
}

function video_link(a, vid, play_next) {
  $(a).click(function() {
    if (video) {
      video.dispose();
      video = undefined;
    }
    var id = 'player' + cnt;
    var html = '<video id="' + id + '" class="video-js vjs-default-skin" controls autoplay preload="auto">';
    for (var i = 0; i < vid.videos.length; ++i) {
      console.log(vid.videos[i]);
      var ext = vid.videos[i].path.split('.').pop();
      html += '<source src="' + vid.videos[i].path + '" type="' + video_mimetypes[ext] + '" />';
    }
    for (var i = 0; i < vid.subs.length; ++i) {
      html += '<track kind="captions" src="' + vid.subs[i].path + '" srclang="en" label="' + vid.subs[i].name + '" ' + (i == 0 ? "default " : "") + '/>';
    }
    html += '</video>';

    console.log(html);

    $('#preview').html(html);
    video = videojs(id, {}, function() {
      var player = this;
      this.on("ended", function() {
        localStorage[a.dataset.key] = (new Date).getTime();
        new_buttons();
        if (play_next) {
          var episode_li = a.parentElement;
          var next_li = episode_li.nextSibling;
          if (next_li) {
            $(next_li).children('a').first().click();
          }
        }
      });
      window.onresize = function resizeVideoJS() {
        var width = document.getElementById('preview').offsetWidth;
        var height = document.getElementById('preview').offsetHeight;
        if (width * 9 / 16 > height) {
          player.width(height * 16 / 9).height(height);
        } else {
          player.width(width).height(width * 9 / 16);
        }
      };
      onresize();
    });
    cnt += 1;
    return false;
  });
}

function gen_shows(ul) {
  for (var name in shows) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.innerText = name;
    a.classList.add('expand');
    //a.classList.add('expand-open');
    var ep_ul = document.createElement('ul');
    for (var episode in shows[name]) {
      var ep_li = document.createElement('li');
      var ep_a = document.createElement('a');
      ep_a.innerText = episode;
      if (shows[name][episode].videos.length == 0) {
        ep_a.innerText += " (no videos!)";
      }
      if (shows[name][episode].videos.length > 1) {
        ep_a.innerText += " (" + shows[name][episode].videos.length + " videos - bug?)";
      }

      video_link(ep_a, shows[name][episode], true);

      ep_a.dataset.show = name;
      ep_a.dataset.episode = episode;
      ep_a.dataset.key = name + ':' + episode;
      ep_a.classList.add('episode');

      ep_li.appendChild(ep_a);
      ep_ul.appendChild(ep_li);
    }
    $(ep_ul.childNodes).sortElements(sort_by_name);
    li.appendChild(a);
    li.appendChild(ep_ul);
    ul.appendChild(li);
  }

  $(ul.childNodes).sortElements(sort_by_name);
  new_buttons();
  $(ul.childNodes).each(function() {
    if ($(this).find('.new').get().length) {
      $(this).children('a').get()[0].classList.add('expand-open');
    } else {
      $(this).children('a').get()[0].classList.add('expand-close');
      $(this).children('ul').hide();
    }
  });
}

function new_buttons() {
  $('.new').remove();
  $('.episode').filter(function() {
    return !localStorage[this.dataset.key];
  }).each(function() {
    var new_button = document.createElement('a');
    new_button.classList.add('new');
    $(new_button).click(function() {
      localStorage[this.dataset.key] = (new Date).getTime();
      new_buttons();
    });
    new_button.dataset.key = this.dataset.key;
    $(this).after(new_button);
  });
  $('#shows > li > a.expand').filter(function() {
    return $(this).next().find('.new').size() > 0;
  }).each(function() {
    var new_button = document.createElement('a');
    new_button.classList.add('new');
    $(new_button).click(function() {
      $(this).next().find('.new').each(function() {
        localStorage[this.dataset.key] = (new Date).getTime();
      });
      $(this).prev().click();
      new_buttons();
    });
    $(this).after(new_button);
  });
}

function fill_stats() {
  var ul = document.getElementById('stats');
  var sum = function(node) {
    node.cumulative = node.size;
    if (node.contents) {
      for (var i = 0; i < node.contents.length; ++i) {
        node.cumulative += sum(node.contents[i]);
      }
    }
    return node.cumulative;
  };
  var total = sum(tree);
  var stat = function(name, value) {
    var li = document.createElement('li');
    li.innerText = name + ": " + value;
    ul.appendChild(li);
  }
  stat("Total size", bytesToSize(total));
  stat("Free space", bytesToSize(disk_free_space));
  tree.contents.sort(function(a, b) {
    return b.cumulative - a.cumulative;
  })
  var biggest_li = document.createElement('li');
  biggest_li.innerText = 'Biggest files:';
  var biggest_ul = document.createElement('ul');
  biggest_li.appendChild(biggest_ul);
  for (var i = 0; i < 5; ++i) {
    var file_li = document.createElement('li');
    file_li.innerText = tree.contents[i].path + ' - ' + bytesToSize(tree.contents[i].cumulative);
    biggest_ul.appendChild(file_li);
  }
  ul.appendChild(biggest_li);
}

$(function() {
  $('#overview').html('<h2>Files</h2><ul id=index></ul><h2>Movies</h2><ul id=movies></ul><h2>Shows</h2><ul id=shows></ul><h2>Server stats</h2><ul id=stats></ul>');
  fill_stats();
  var index = document.getElementById('index');
  prune(tree);
  gen(tree.contents, index);
  var elem = document.getElementById('shows');
  gen_shows(elem);
  var movie_elem = document.getElementById('movies');
  gen_movies(movie_elem);
  return;

  setClasses();
  rearrange();
  $('h1')
    .append('<button id="sort_by_name"><i class="fa fa-sort-alpha-asc"></i> Alfabetycznie</button>')
    .append('<button id="sort_by_date"><i class="fa fa-sort-numeric-asc"></i> Chronologicznie</button>');

  $('a').mouseover(function() {
    var filename = $(this).attr('href');
    var dotIndex = filename.lastIndexOf('.');
    var ext = filename.substr(dotIndex + 1);
    var basename = filename.substr(0, dotIndex);
    if (image_types[ext]) {
      $('#preview').html('<img src="' + filename + '" />');
    }
    $('#filename').html("<span><i class='fa fa-file'></i> Plik</span>" + filename);
    $('#size').html("<span><i class='fa fa-archive'></i> Rozmiar</span>" + bytesToSize(this.dataset.size));
    $('#mtime').html("<span><i class='fa fa-clock-o'></i> Modyfikacja</span>" + new Date(Number(this.dataset.modified) * 1000).toISOString().replace('T', ' ').substring(0, 16));

  });
  var sort_by_name = function(a, b) {
    return first_a(a).innerHTML.toLowerCase().localeCompare(first_a(b).innerHTML.toLowerCase());
  }
  var sort_by_date = function(a, b) {
    return Number(first_a(b).dataset.modified) - Number(first_a(a).dataset.modified);
  }

  $('#sort_by_name').click(function() {
    $("#index > li").sortElements(sort_by_name);
  });
  $('#sort_by_date').click(function() {
    $("#index > li").sortElements(sort_by_date);
  });

});