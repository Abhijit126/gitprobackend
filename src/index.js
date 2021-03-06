let express = require('express');
let request = require('request');
let paginate = require('jw-paginate');
var cors = require('cors');
let serverless = require('serverless-http');


let app = express();
let router = express.Router();
app.use(cors())
app.listen(5000,()=> {
    console.log("Listening on port 5000");
});

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', false);

    // Pass to next layer of middleware
    next();
});

let userRepoList={};

function getLanguages(username,repoName) {
   return new Promise((resolve,reject)=> {
       request.get(`https://api.github.com/repos/${username}/${repoName}/languages`, { headers: { "User-Agent": username } }, (err, response, body) => {
           resolve(JSON.parse(body));
       });
   });
}

router.get('/users/:username/repos/:pageSize/:pageNo',(req,res)=> {
    let username = req.params.username;
    request.get(`https://api.github.com/users/${username}/repos`,{headers: {"User-Agent":username},
            per_page:req.params.pageSize },async (err,response,body)=> {
        if(err) {
            return res.send({ "error": err.message });
        }

        if(userRepoList.userName != username) {
        let repos=[];
        let data = JSON.parse(body);
        if(data.message) {
           return res.send({"error":data.message});
        }

        for(let item of data) {
            let repo ={};
            repo.name = item.name;
            repo.description = item.description;
            repos.push(repo);
        }
        
        userRepoList.userName = username;
        userRepoList.list = repos;
    }

        // get page from query params or default to first page
        const page = parseInt(req.params.pageNo);
        // get pager object for specified page
        const pageSize = parseInt(req.params.pageSize);

        const pager = paginate(userRepoList.list.length, page, pageSize);
        for (let i = pager.startIndex; i <= pager.endIndex && i < userRepoList.list.length; i++) {
            if (!userRepoList.list[i].languagesUsed) {
            await getLanguages(username, userRepoList.list[i].name).then((data) => {
                let languages = Object.keys(data);
                userRepoList.list[i].languagesUsed = languages;
            }).catch((err) => {
                console.log(err);
            });
        }
        }

        // get page of items from items array
        const pageOfItems = (userRepoList.list).slice(pager.startIndex, pager.endIndex + 1);

        // return pager object and current page of items
        return res.json({ pager, pageOfItems });
    })
});

router.get('/user/details/:username',(req,res)=> {
    let username = req.params.username;
    request.get(`https://api.github.com/users/${username}`, { headers: { "User-Agent": "Abhijit126" }},(err,response,body)=> {
        if(err) {
            return res.send({ "error": err.message });
        }
    
        let details = JSON.parse(body);
        if(details.message) {
            return res.send({"error":details.message});
        }
        let user={};
        user.name = details.name;
        user.location = details.location;
        user.imageUrl = details.avatar_url;
        user.bio = details.bio;
        user.githubUrl = details.html_url;
        user.twitterUserName = details.twitter_username;
        res.json(user);
    });
});

app.use('/.netlify/functions/index',router);

module.exports.handler = serverless(app);