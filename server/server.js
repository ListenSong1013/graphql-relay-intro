import path from 'path';
import express from 'express';
import schema from './schema';

import { graphql } from 'graphql';
import bodyParser from 'body-parser';

let app = express();
let PORT = 3000;

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

//Parse post content as text
app.use(bodyParser.text({ type: 'application/graphql' }));

app.get('/', function(req, res){
    res.render('index', {});
});

app.post('/graphql', (req, res) => {
  //GraphQL executor
    graphql(schema, req.body)
    .then((result) => {
        res.send(JSON.stringify(result, null, 2));
    });
});

let server = app.listen(PORT, function() {
    let host = server.address().address;
    let port = server.address().port;

    console.log('GraphQL listening at http://%s:%s', host, port);
});
