var engine = null;

(function() {
    function setup(name) {
        if ('string' == typeof name)
            engine = {name:name};
        else
            engine = name;
        document.dispatchEvent(new CustomEvent('engine', {detail: engine}));
    }

    function $$(selector) { return document.querySelector(selector); }
    function $id(id) { return document.getElementById(id); }

    function attribute(selector, name) {
        return [].map.call(document.head.querySelectorAll(selector), function(link) {
            return link.getAttribute(name);
        })
    }

    if (window.Joomla) {
        return setup('joomla');
    }
    if (window.Drupal) {
        return setup('drupal');
    }
    if (window.phpbb || $id('phpbb')) {
        return setup({
            name:'phpbb',
            post:'.post'
        });
    }
    if (window.smf_charset) {
        return setup('smf');
    }
    if (window.vBulletin_init) {
        return setup({
            name: 'vbulletin',
            post: 'table[id^="post"]'
        });
    }
    else if (window.IPBoard) {
        return setup({
            name: 'invision',
            post: '.post_block'
        });
    }

    var generator = $$('meta[name="generator"]');
    generator = (generator ? generator.getAttribute('content') : '').toLocaleLowerCase();

    var links = attribute('link', 'href');

    function contains(list, regex) {
        for (var i = 0; i < list.length; i++)
            if (regex.test(links[i]))
                return links[i];
    }

    if (generator.indexOf('wordpress') >= 0 || contains(links, /wp-content/)) {
        setup('wordpress');
    }
})();
