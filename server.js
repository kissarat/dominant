"use strict";
var http = require('http');
var postgres = require('pg');
var intel = require('intel');
var url = require('url');
var fs = require('fs');

var log = intel.getLogger();
var db = new postgres.Client('postgres://postgres:1@localhost/dominant');
var wss;
var clients = new Map();

var server = http.createServer(function(req, res) {
    console.log(req.url);
    //if (['/apps.json', '/wappalyzer.js', '/driver.js'].indexOf(req.url) >= 0)
    //    return fs.readFile('node_modules/wappalyzer' + req.url, wrap(res, function (data) {
    //        res.writeHead(200, {
    //            'Content-Type': 'text/javascript'
    //        });
    //        data = data.toString();
    //        res.end(data);
    //    }));
    log.info([req.method, req.url].join('\t'));
    if (!req.headers.source) {
        res.writeHead(400);
        res.end();
        return;
    }
    req.url_pair = url.parse(req.headers.source);
    req.url_pair = [req.url_pair.hostname, req.url_pair.pathname];
    var method = Message[req.method];
    if (method)
        method(req, res);
    else {
        res.writeHead(405);
        res.end();
    }
});

var Message = {
    GET: function(req, res) {
        query('select * from page_message where host = $ and path = $',
            req.url_pair, send_rows(res));
    },

    POST: function(req, res) {
        query('select * from page where host = $ and path = $', req.url_pair, wrap(res, function(_page) {
            if (0 == _page.rowCount)
                query('insert into page(host, path) values ($,$) returning *', req.url_pair, wrap(res, function(_page) {
                    Message.add(req, res, _page.rows[0].id);
                }));
            else
                Message.add(req, res, _page.rows[0].id);
        }));
    },

    add: function(req, res, page) {
        receive(req, function(message) {
            query('insert into message(page, selector, text, address) values ($,$,$,$) returning *',
                [page, req.headers.selector || null, message, req.socket.remoteAddress], send_row(req, res));
        });
    }
};

db.connect(function(err) {
    if (err) {
        log.critical(err);
        process.exit(-1);
    }
    try {
        var ws = require('ws');
        wss = new ws.Server({port:2009});
        wss.on('connection', function(ws) {
            clients.set(ws, []);
            ws.on('message', function(data) {
                data = JSON.parse(data);
                switch (data.type) {
                    case 'add':
                        var hosts = clients.get(ws);
                        if (hosts.indexOf(data.host) < 0)
                            hosts.push(data.host);
                        break;
                }
            });
            ws.on('close', function() {
                clients.delete(ws);
            });
        });
    }
    catch (ex) {
        log.error(ex);
    }
    server.listen(8080);
});

function wrap(res, call) {
    if (!call)
        call = res;
    return function(err, data) {
        if (err) {
            log.error(err);
            if (call != res)
                res.end(JSON.stringify({
                    error: err
                }));
        }
        else
            call(data);
    }
}

function send_rows(res) {
    return wrap(res, function(result) {
        res.end(JSON.stringify(result.rows));
    });
}

function send_row(req, res) {
    return wrap(res, function(result) {
        var row = result.rows[0];
        row.path = req.url_pair[1];
        row = JSON.stringify(row);
        clients.forEach(function(hosts, ws) {
            if (hosts.indexOf(req.url_pair[0]) >= 0)
                ws.send(row);
        });
        res.end(row);
    });
}

function query(q, params, call) {
    if (call) {
        var i = 0;
        log.debug(q.replace(/\$/g, function () {
            var param = params[i++];
            if ('string' == typeof param) {
                if (param.length > 24)
                    param = param.slice(0, 21) + '...';
                param = "'" + param + "'";
            }

            return param;
        }));
        i = 1;
        q = q.replace(/\$/g, function () {
            return '$' + i++;
        });
        db.query(q, params, call);
    }
    else {
        call = params;
        log.debug(q);
        db.query(q, call);
    }
}

function receive(req, call) {
    var data = [];
    req.setEncoding('utf8');
    req.on('data', function(chunk) {
       data.push(chunk);
    });
    req.on('end', function() {
        data = data.join('');
        call(data);
    });
}
