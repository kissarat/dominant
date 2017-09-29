function $all(selector) { return document.querySelectorAll(selector); }

function contains(collection, element) {
    return Array.prototype.indexOf.call(collection, element) >= 0;
}

function identify(element) {
    if (element.id) {
        element.selector = '#' + element.id;
        return element;
    }
    var src = element.getAttribute('src');
    if (src && 1 == document.querySelectorAll('[src="' + src + '"]').length) {
        element.selector = '[src="' + src + '"]';
        return element;
    }
    element = element.parentNode;
    return element.getAttribute ? identify(element) : document.body;
}

document.addEventListener('DOMContentLoaded', function() {
    return;
    var host = 'bookfucker.net';

    var zen = document.createElement('div');
    zen.classList.add('zen');
    var messages = [];
    function comment(message, add) {
        var div = document.createElement('div');
        div.id = 'zen' + message.id;
        div.innerHTML = message.text;
        zen.insertBefore(div, panel);
        if (add)
            messages.push(message);
        commented(message);
    }

    function commented(message) {
        if (!message.selector)
            return;
        var element = document.querySelector(message.selector);
        if (!element)
            return console.error(message.selector + ' not found');
        if (!element.classList.contains('zen-commented'))
            element.classList.add('zen-commented');
        if (element.getAttribute('src'))
            return;
        var $count = element.querySelector('.zen-count');
        if (!$count) {
            $count = document.createElement('div');
            $count.classList.add('zen-count');
            element.insertBefore($count, element.firstElementChild);
        }
        var count = 0;
        for (var i = 0; i < messages.length; i++)
            if (message.selector == messages[i].selector)
                count++;
        $count.innerHTML = count.toString();
    }

    var panel = document.createElement('div');
    
// @ * @ * @ * @ * @ * @ * @ * @ * @ * @ * select @ * @ * @ * @ * @ * @ * @ * @ * @ * @ * 
    
    var $selector = document.createElement('div');
    panel.appendChild($selector);

    function select(selector) {
        if (!selector)
            selector = null;
        if ($selector.innerHTML != (selector || '')) {
            if ($selector.innerHTML)
                document.querySelector($selector.innerHTML).classList.remove('zen-select');
            zen.remove();
            [].filter.call(zen.childNodes, function(message) {return message.id})
                .forEach(function(message) {
                    message.remove();
                });
            messages.forEach(function(message) {
                if (selector == message.selector)
                    comment(message);
            });
            $selector.innerHTML = selector || '';
            document.body.appendChild(zen);
        }
    }

    var $select = document.createElement('span');
    $select.innerHTML = '&#9633;';
    $select.onclick = function() {
        var selected = document.body;

        function mousemove(e) {
            var current = document.elementFromPoint(e.clientX, e.clientY);
            if (current.getAttribute)
                current = identify(current);
            if (current != selected) {
                selected.classList.remove('zen-select');
                if (current != document.body)
                    current.classList.add('zen-select');
                selected = current;
                //console.log(selected.selector);
            }
        }

        function click(e) {
            if (e.defaultPrevented)
                return;
            for(var target = e.target; target.classList; target = target.parentNode)
                if (target.classList.contains('zen-select')) {
                    e.preventDefault();
                    return;
                }
        }

        function mousedown(e) {
            e.target.addEventListener('click', click);
            document.body.removeEventListener('mousedown', mousedown);
            document.body.removeEventListener('mousemove', mousemove);
            select(selected.selector);
        }

        document.body.addEventListener('mousemove', mousemove);
        document.body.addEventListener('mousedown', mousedown);
    };
    panel.appendChild($select);

// @ * @ * @ * @ * @ * @ * @ * @ * @ * @ * online @ * @ * @ * @ * @ * @ * @ * @ * @ * @ * 
    
    var online = document.createElement('span');
    online.innerHTML = '\u26AB';
    online.classList.add('offline');
    function zensocket() {
        var socket = new WebSocket('ws://' + host + ':2009');
        socket.onopen = function() {
            socket.send(JSON.stringify({type:'add', host:location.hostname}));
            online.classList.remove('offline');
        };
        socket.onclose = function() {
            online.classList.add('offline');
        };
        socket.onmessage = function(e) {
            var data = JSON.parse(e.data);
            if (location.pathname != data.path)
                return;
            var $comment = document.getElementById('zen' + data.id);
            if ($comment)
                $comment.innerHTML = data.text;
            else {
                if ($selector.innerHTML == (data.selector || '')) {
                    comment(data);
                }
                messages.push(data);
                commented(data);
            }
            
        };
        online.onclick = function() {
            if (online.classList.contains('offline'))
                zensocket();
            else
                socket.close();
        };
    }

    panel.appendChild(online);
    
// @ * @ * @ * @ * @ * @ * @ * @ * @ * @ * close @ * @ * @ * @ * @ * @ * @ * @ * @ * @ *
    
    var close = document.createElement('span');
    close.innerHTML = '&#10006;';
    close.onclick = function() {
        zen.remove();
        return false;
    };
    panel.appendChild(close);
    panel.classList.add('zen-panel');

    function movable(block) {
            function mousemove(e) {
            zen.style.left = (parseFloat(zen.style.left) + e.movementX) + 'px';
            zen.style.top = (parseFloat(zen.style.top) + e.movementY) + 'px';
        }

        function mouseup() {
            document.body.removeEventListener('mouseup', mouseup);
            document.body.removeEventListener('mousemove', mousemove);
            document.body.style.removeProperty('cursor');
        }

        block.onmousedown = function() {
            var box = zen.getBoundingClientRect();
            zen.style.left = box.left + 'px';
            zen.style.top = box.top + 'px';
            document.body.style.cursor = 'move';
            document.body.addEventListener('mousemove', mousemove);
            document.body.addEventListener('mouseup', mouseup);
        };
    }

    movable(panel);
    zen.appendChild(panel);

// @ * @ * @ * @ * @ * @ * @ * @ * @ * @ * input @ * @ * @ * @ * @ * @ * @ * @ * @ * @ * 
    
    var input = document.createElement('textarea');
    input.onkeydown = function(e) {
        if (13 == e.keyCode) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'http://bookfucker.net');
            xhr.setRequestHeader('Source', location.href);
            if ($selector.innerHTML)
                xhr.setRequestHeader('Selector', $selector.innerHTML);
            xhr.onloadend = function() {
                var response = JSON.parse(this.responseText);
                comment({
                    id: response.id,
                    text: input.value,
                    selector: $selector.innerHTML || null
                }, true);
                input.value = '';
            };
            xhr.send(input.value);
            return false;
        }
    };
    zen.appendChild(input);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://' + host);
    xhr.setRequestHeader('Source', location.href);
    xhr.onloadend = function() {
        JSON.parse(this.responseText).forEach(function(message) {
            if (!message.selector)
                comment(message, true);
            else {
                messages.push(message);
                commented(message);
            }
        });
        document.body.appendChild(zen);
        zensocket();
    };
    xhr.send(null);

    window.addEventListener('keyup', function(e) {
        if (27 == e.keyCode)
            select();
    });
});

document.addEventListener('engine', function(e) {
    return;
    if (!e.detail.post)
        return;
    var $posts = $all(e.detail.post);
    identify = function(element) {
        if (contains($posts, element))
            return element;
        element = element.parentNode;
        return element.getAttribute ? identify(element) : document.body;
    }
});

addEventListener('load', function() {
    var script = document.createElement('script');
    script.setAttribute('src', chrome.extension.getURL('js/inject.js'));
    document.body.appendChild(script);
});
